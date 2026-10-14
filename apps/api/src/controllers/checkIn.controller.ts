import { Request, Response } from 'express';
import crypto from 'crypto';
import mongoose, { Types } from 'mongoose';
import {
  CheckinStatus,
  RestStopStatus,
  CapacityStatus,
  UserRole,
  CreateCheckInRequest,
  VerifyCheckInRequest,
  ConfirmCheckInRequest,
  RejectCheckInRequest,
  CheckInQuery,
  AdminCheckInQuery,
} from 'shared-types';
import { CheckIn } from '../models/CheckIn';
import { RestStop } from '../models/RestStop';
import { isDatabaseConnected } from '../config/database';
import { config } from '../config/env';
import {
  generateVenueQrCredential,
  verifyVenueQrCredential,
  verifyVenueVerificationCode,
} from '../utils/qr';
import {
  formatRiderCheckIn,
  formatMerchantCheckIn,
  formatAdminCheckIn,
} from '../utils/checkin';
import { sendSuccess } from '../utils/response';
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
  AppError,
} from '../utils/errors';
import { mockCheckInStore, MockCheckInItem } from './checkInMockStore';
import { mockRestStopStore } from './restStopMockStore';
import { mockUserStore } from './auth.controller';

const DUPLICATE_CHECKIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes cooldown per venue

/**
 * Helper to recalculate rest stop capacity occupancy and status when a rider checks in.
 */
function computeUpdatedCapacity(
  capacity?: { maxRiders: number; currentOccupancy: number; status: CapacityStatus },
  delta: number = 1
): { maxRiders: number; currentOccupancy: number; status: CapacityStatus } {
  const maxRiders = Math.max(1, capacity?.maxRiders || 10);
  const currentOccupancy = Math.max(0, capacity?.currentOccupancy || 0);
  const newOccupancy = Math.min(maxRiders, Math.max(0, currentOccupancy + delta));

  let status: CapacityStatus = CapacityStatus.AVAILABLE;
  if (newOccupancy >= maxRiders) {
    status = CapacityStatus.FULL;
  } else if (newOccupancy >= Math.ceil(maxRiders * 0.8)) {
    status = CapacityStatus.BUSY;
  }

  return {
    maxRiders,
    currentOccupancy: newOccupancy,
    status,
  };
}

/**
 * POST /api/v1/check-ins
 * Authenticated rider endpoint to record a check-in at an active rest stop.
 * Derives riderId from server session; sets initial status to PENDING.
 */
export async function createRiderCheckInHandler(
  req: Request,
  res: Response
): Promise<void> {
  if (!req.user) {
    throw new ForbiddenError('Authentication required');
  }

  const user = req.user as any;
  const riderId = user._id ? user._id.toString() : user.id ? user.id.toString() : '';
  const body = req.body as CreateCheckInRequest;

  const now = new Date();
  const cooldownThreshold = new Date(now.getTime() - DUPLICATE_CHECKIN_WINDOW_MS);

  if (isDatabaseConnected()) {
    if (!Types.ObjectId.isValid(body.restStopId)) {
      throw new BadRequestError('Invalid rest stop ID format');
    }

    const restStop = await RestStop.findById(body.restStopId);
    if (!restStop) {
      throw new NotFoundError(`Rest stop with ID '${body.restStopId}' was not found.`);
    }

    // Verify rest stop is approved and active
    if (restStop.status !== RestStopStatus.ACTIVE) {
      throw new BadRequestError('Cannot check in at a rest stop that is not approved and active.');
    }

    // Anti-abuse: Prevent duplicate check-in at same venue within cooldown window
    const recentCheckIn = await CheckIn.findOne({
      riderId: new Types.ObjectId(riderId),
      restStopId: restStop._id,
      checkInTime: { $gte: cooldownThreshold },
    });

    if (recentCheckIn) {
      throw new ConflictError(
        'A check-in for this rest stop was already recorded within the last 15 minutes.'
      );
    }

    // Cryptographically secure verification token generated on server (never exposed to client)
    const verificationCode = crypto.randomBytes(3).toString('hex').toUpperCase();

    const newCheckIn = new CheckIn({
      riderId: new Types.ObjectId(riderId),
      restStopId: restStop._id,
      merchantId: restStop.merchantId,
      method: body.method || 'qr_code',
      verificationCode,
      status: CheckinStatus.PENDING,
      checkInTime: now,
    });

    await newCheckIn.save();

    sendSuccess(
      res,
      formatRiderCheckIn(newCheckIn, restStop.name),
      201,
      'Check-in initiated successfully. It is currently pending merchant verification.'
    );
  } else {
    if (config.NODE_ENV === 'production') {
      throw new AppError('Database service unavailable.', 503);
    }

    const restStop = mockRestStopStore.get(body.restStopId);
    if (!restStop) {
      throw new NotFoundError(`Rest stop with ID '${body.restStopId}' was not found.`);
    }

    if (restStop.status !== RestStopStatus.ACTIVE) {
      throw new BadRequestError('Cannot check in at a rest stop that is not approved and active.');
    }

    // Duplicate check in mock store
    for (const item of mockCheckInStore.values()) {
      if (
        item.riderId === riderId &&
        item.restStopId === body.restStopId &&
        item.checkInTime.getTime() >= cooldownThreshold.getTime()
      ) {
        throw new ConflictError(
          'A check-in for this rest stop was already recorded within the last 15 minutes.'
        );
      }
    }

    const mockId = `mock-ci-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const verificationCode = crypto.randomBytes(3).toString('hex').toUpperCase();

    const mockItem: MockCheckInItem = {
      _id: mockId,
      id: mockId,
      riderId,
      restStopId: body.restStopId,
      merchantId: restStop.merchantId,
      method: body.method || 'qr_code',
      verificationCode,
      status: CheckinStatus.PENDING,
      checkInTime: now,
      createdAt: now,
      updatedAt: now,
    };

    mockCheckInStore.set(mockId, mockItem);

    sendSuccess(
      res,
      formatRiderCheckIn(mockItem, restStop.name),
      201,
      'Check-in initiated successfully. It is currently pending merchant verification.'
    );
  }
}

/**
 * GET /api/v1/check-ins/me
 * Authenticated rider endpoint to view their own check-in records.
 */
export async function getRiderCheckInsHandler(
  req: Request,
  res: Response
): Promise<void> {
  if (!req.user) {
    throw new ForbiddenError('Authentication required');
  }

  const user = req.user as any;
  const riderId = user._id ? user._id.toString() : user.id ? user.id.toString() : '';
  const query = req.query as unknown as CheckInQuery;

  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));
  const skip = (page - 1) * limit;
  const sort = query.sort || 'newest';
  const status = query.status;
  const restStopId = query.restStopId?.trim();

  if (isDatabaseConnected()) {
    const mongoFilter: Record<string, any> = {
      riderId: new Types.ObjectId(riderId),
    };

    if (status) mongoFilter.status = status;
    if (restStopId && Types.ObjectId.isValid(restStopId)) {
      mongoFilter.restStopId = new Types.ObjectId(restStopId);
    }

    const sortOption: Record<string, any> = sort === 'oldest' ? { checkInTime: 1 } : { checkInTime: -1 };

    const total = await CheckIn.countDocuments(mongoFilter);
    const docs = await CheckIn.find(mongoFilter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .populate('restStopId', 'name');

    sendSuccess(res, {
      items: docs.map((doc) =>
        formatRiderCheckIn(doc, (doc.restStopId as any)?.name)
      ),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    });
  } else {
    if (config.NODE_ENV === 'production') {
      throw new AppError('Database service unavailable.', 503);
    }

    let items = Array.from(mockCheckInStore.values()).filter(
      (ci) => ci.riderId === riderId
    );

    if (status) items = items.filter((ci) => ci.status === status);
    if (restStopId) items = items.filter((ci) => ci.restStopId === restStopId);

    if (sort === 'oldest') {
      items.sort((a, b) => a.checkInTime.getTime() - b.checkInTime.getTime());
    } else {
      items.sort((a, b) => b.checkInTime.getTime() - a.checkInTime.getTime());
    }

    const total = items.length;
    const paginated = items.slice(skip, skip + limit);

    sendSuccess(res, {
      items: paginated.map((ci) => {
        const rs = mockRestStopStore.get(ci.restStopId);
        return formatRiderCheckIn(ci, rs?.name);
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    });
  }
}

/**
 * GET /api/v1/check-ins/:id
 * Authenticated rider endpoint to view a single check-in of theirs.
 */
export async function getRiderCheckInByIdHandler(
  req: Request,
  res: Response
): Promise<void> {
  if (!req.user) {
    throw new ForbiddenError('Authentication required');
  }

  const user = req.user as any;
  const riderId = user._id ? user._id.toString() : user.id ? user.id.toString() : '';
  const rawId = req.params.id;
  const checkInId = (typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? rawId[0] : '').trim();

  if (!checkInId) {
    throw new BadRequestError('Check-in ID is required');
  }

  if (isDatabaseConnected()) {
    if (!Types.ObjectId.isValid(checkInId)) {
      throw new BadRequestError('Invalid check-in ID format');
    }

    const doc = await CheckIn.findById(checkInId).populate('restStopId', 'name');
    if (!doc || doc.riderId.toString() !== riderId) {
      throw new NotFoundError(`Check-in record with ID '${checkInId}' was not found.`);
    }

    sendSuccess(res, formatRiderCheckIn(doc, (doc.restStopId as any)?.name));
  } else {
    if (config.NODE_ENV === 'production') {
      throw new AppError('Database service unavailable.', 503);
    }

    const item = mockCheckInStore.get(checkInId);
    if (!item || item.riderId !== riderId) {
      throw new NotFoundError(`Check-in record with ID '${checkInId}' was not found.`);
    }

    const restStop = mockRestStopStore.get(item.restStopId);
    sendSuccess(res, formatRiderCheckIn(item, restStop?.name));
  }
}

/**
 * GET /api/v1/merchant/check-ins
 * Authenticated merchant endpoint to view check-in footfall at their owned rest stops.
 */
export async function getMerchantCheckInsHandler(
  req: Request,
  res: Response
): Promise<void> {
  if (!req.user) {
    throw new ForbiddenError('Authentication required');
  }

  const user = req.user as any;
  const callerMerchantId = user._id ? user._id.toString() : user.id ? user.id.toString() : '';
  const query = req.query as unknown as CheckInQuery;

  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));
  const skip = (page - 1) * limit;
  const sort = query.sort || 'newest';
  const status = query.status;
  const restStopId = query.restStopId?.trim();

  if (isDatabaseConnected()) {
    // 1. Identify valid rest stop IDs owned by this merchant
    let targetRestStopIds: Types.ObjectId[] = [];
    const restStopNameMap = new Map<string, string>();

    if (restStopId) {
      if (!Types.ObjectId.isValid(restStopId)) {
        throw new BadRequestError('Invalid rest stop ID format');
      }

      const restStop = await RestStop.findById(restStopId);
      if (!restStop) {
        throw new NotFoundError(`Rest stop with ID '${restStopId}' was not found.`);
      }

      if (restStop.merchantId.toString() !== callerMerchantId) {
        throw new ForbiddenError('You do not have permission to view check-ins for this rest stop.');
      }

      targetRestStopIds = [restStop._id];
      restStopNameMap.set(restStop._id.toString(), restStop.name);
    } else {
      const ownedStops = await RestStop.find({
        merchantId: new Types.ObjectId(callerMerchantId),
      }).lean();

      targetRestStopIds = ownedStops.map((s) => s._id);
      for (const s of ownedStops) {
        restStopNameMap.set(s._id.toString(), s.name);
      }
    }

    if (targetRestStopIds.length === 0) {
      sendSuccess(res, {
        items: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      });
      return;
    }

    const mongoFilter: Record<string, any> = {
      restStopId: { $in: targetRestStopIds },
    };
    if (status) mongoFilter.status = status;

    const sortOption: Record<string, any> = sort === 'oldest' ? { checkInTime: 1 } : { checkInTime: -1 };

    const total = await CheckIn.countDocuments(mongoFilter);
    const docs = await CheckIn.find(mongoFilter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .populate('riderId', 'name');

    sendSuccess(res, {
      items: docs.map((doc) =>
        formatMerchantCheckIn(
          doc,
          restStopNameMap.get(doc.restStopId?.toString()),
          (doc.riderId as any)?.name
        )
      ),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    });
  } else {
    if (config.NODE_ENV === 'production') {
      throw new AppError('Database service unavailable.', 503);
    }

    let ownedStopIds: string[] = [];
    if (restStopId) {
      const rs = mockRestStopStore.get(restStopId);
      if (!rs) {
        throw new NotFoundError(`Rest stop with ID '${restStopId}' was not found.`);
      }
      if (rs.merchantId !== callerMerchantId) {
        throw new ForbiddenError('You do not have permission to view check-ins for this rest stop.');
      }
      ownedStopIds = [restStopId];
    } else {
      ownedStopIds = Array.from(mockRestStopStore.values())
        .filter((rs) => rs.merchantId === callerMerchantId)
        .map((rs) => rs._id);
    }

    let items = Array.from(mockCheckInStore.values()).filter((ci) =>
      ownedStopIds.includes(ci.restStopId)
    );

    if (status) items = items.filter((ci) => ci.status === status);

    if (sort === 'oldest') {
      items.sort((a, b) => a.checkInTime.getTime() - b.checkInTime.getTime());
    } else {
      items.sort((a, b) => b.checkInTime.getTime() - a.checkInTime.getTime());
    }

    const total = items.length;
    const paginated = items.slice(skip, skip + limit);

    sendSuccess(res, {
      items: paginated.map((ci) => {
        const rs = mockRestStopStore.get(ci.restStopId);
        const rider = mockUserStore.get(ci.riderId);
        return formatMerchantCheckIn(ci, rs?.name, rider?.name);
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    });
  }
}

/**
 * GET /api/v1/admin/check-ins
 * Admin moderation endpoint to view check-ins across all venues.
 */
export async function getAdminCheckInsHandler(
  req: Request,
  res: Response
): Promise<void> {
  const query = req.query as unknown as AdminCheckInQuery;

  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));
  const skip = (page - 1) * limit;
  const sort = query.sort || 'newest';
  const status = query.status;
  const restStopId = query.restStopId?.trim();
  const riderId = query.riderId?.trim();
  const merchantId = query.merchantId?.trim();

  if (isDatabaseConnected()) {
    const mongoFilter: Record<string, any> = {};

    if (status) mongoFilter.status = status;
    if (restStopId && Types.ObjectId.isValid(restStopId)) {
      mongoFilter.restStopId = new Types.ObjectId(restStopId);
    }
    if (riderId && Types.ObjectId.isValid(riderId)) {
      mongoFilter.riderId = new Types.ObjectId(riderId);
    }
    if (merchantId && Types.ObjectId.isValid(merchantId)) {
      mongoFilter.merchantId = new Types.ObjectId(merchantId);
    }

    const sortOption: Record<string, any> = sort === 'oldest' ? { checkInTime: 1 } : { checkInTime: -1 };

    const total = await CheckIn.countDocuments(mongoFilter);
    const docs = await CheckIn.find(mongoFilter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .populate('restStopId', 'name');

    sendSuccess(res, {
      items: docs.map((doc) =>
        formatAdminCheckIn(doc, (doc.restStopId as any)?.name)
      ),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    });
  } else {
    if (config.NODE_ENV === 'production') {
      throw new AppError('Database service unavailable.', 503);
    }

    let items = Array.from(mockCheckInStore.values());

    if (status) items = items.filter((ci) => ci.status === status);
    if (restStopId) items = items.filter((ci) => ci.restStopId === restStopId);
    if (riderId) items = items.filter((ci) => ci.riderId === riderId);
    if (merchantId) items = items.filter((ci) => ci.merchantId === merchantId);

    if (sort === 'oldest') {
      items.sort((a, b) => a.checkInTime.getTime() - b.checkInTime.getTime());
    } else {
      items.sort((a, b) => b.checkInTime.getTime() - a.checkInTime.getTime());
    }

    const total = items.length;
    const paginated = items.slice(skip, skip + limit);

    sendSuccess(res, {
      items: paginated.map((ci) => {
        const rs = mockRestStopStore.get(ci.restStopId);
        return formatAdminCheckIn(ci, rs?.name);
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    });
  }
}

/**
 * POST /api/v1/check-ins/verify
 * Authenticated rider endpoint to verify arrival at a venue using a genuine Venue QR Credential.
 * Atomically transitions any pending check-in at the venue to VERIFIED, or creates a new verified record.
 */
export async function verifyRiderCheckInHandler(
  req: Request,
  res: Response
): Promise<void> {
  if (!req.user) {
    throw new ForbiddenError('Authentication required');
  }

  const user = req.user as any;
  const riderId = user._id ? user._id.toString() : user.id ? user.id.toString() : '';
  const body = req.body as VerifyCheckInRequest;

  const now = new Date();
  const cooldownThreshold = new Date(now.getTime() - DUPLICATE_CHECKIN_WINDOW_MS);

  if (isDatabaseConnected()) {
    if (!Types.ObjectId.isValid(body.restStopId)) {
      throw new BadRequestError('Invalid rest stop ID format');
    }

    const restStop = await RestStop.findById(body.restStopId);
    if (!restStop) {
      throw new NotFoundError(`Rest stop with ID '${body.restStopId}' was not found.`);
    }

    if (restStop.status !== RestStopStatus.ACTIVE) {
      throw new BadRequestError('Cannot check in at a rest stop that is not approved and active.');
    }

    const submittedToken = (body.qrCredential || '').trim();
    const submittedCode = (body.verificationCode || '').trim();

    let isCredentialValid = false;
    let checkInMethod: 'qr_code' | 'otp' = 'qr_code';
    let verifyError = 'Invalid venue QR credential or verification code.';

    // 1. Try QR credential validation if submitted token has HMAC format
    if (submittedToken && submittedToken.includes('.')) {
      const qrCheck = verifyVenueQrCredential(
        submittedToken,
        body.restStopId,
        restStop.qrRotationVersion || 1
      );
      if (qrCheck.valid) {
        isCredentialValid = true;
        checkInMethod = 'qr_code';
      } else {
        verifyError = qrCheck.error || 'Invalid venue QR credential.';
      }
    }

    // 2. If not validated yet, try manual verification code (from body.verificationCode or submittedToken)
    if (!isCredentialValid) {
      const candidateCode = submittedCode || submittedToken;
      if (candidateCode) {
        const isCodeValid = verifyVenueVerificationCode(
          candidateCode,
          body.restStopId,
          restStop.qrRotationVersion || 1,
          restStop.verificationCode
        );
        if (isCodeValid) {
          isCredentialValid = true;
          checkInMethod = 'otp';
        } else if (!submittedToken.includes('.')) {
          verifyError = 'Invalid or expired venue verification code.';
        }
      }
    }

    if (!isCredentialValid) {
      throw new BadRequestError(verifyError);
    }

    // Cooldown check: Prevent repeated verified check-ins within cooldown window
    const recentVerified = await CheckIn.findOne({
      riderId: new Types.ObjectId(riderId),
      restStopId: restStop._id,
      status: CheckinStatus.VERIFIED,
      checkInTime: { $gte: cooldownThreshold },
    });

    if (recentVerified) {
      throw new ConflictError(
        'A verified check-in for this rest stop was already recorded within the last 15 minutes.'
      );
    }

    // Check if an existing PENDING check-in can be transitioned atomically
    let checkInDoc = await CheckIn.findOneAndUpdate(
      {
        riderId: new Types.ObjectId(riderId),
        restStopId: restStop._id,
        status: CheckinStatus.PENDING,
        checkInTime: { $gte: cooldownThreshold },
      },
      {
        $set: {
          status: CheckinStatus.VERIFIED,
          verifiedAt: now,
          method: checkInMethod,
          ...(body.location && {
            locationAtCheckIn: {
              type: 'Point',
              coordinates: [body.location.longitude, body.location.latitude],
            },
          }),
        },
      },
      { new: true }
    );

    let statusCode = 200;
    if (!checkInDoc) {
      statusCode = 201;
      checkInDoc = new CheckIn({
        riderId: new Types.ObjectId(riderId),
        restStopId: restStop._id,
        merchantId: restStop.merchantId,
        method: checkInMethod,
        status: CheckinStatus.VERIFIED,
        checkInTime: now,
        verifiedAt: now,
        ...(body.location && {
          locationAtCheckIn: {
            type: 'Point',
            coordinates: [body.location.longitude, body.location.latitude],
          },
        }),
      });
      await checkInDoc.save();
    }

    // Increment rest stop capacity occupancy and dynamically recalculate status
    restStop.capacity = computeUpdatedCapacity(restStop.capacity, 1);
    await restStop.save();

    sendSuccess(
      res,
      formatRiderCheckIn(checkInDoc, restStop.name),
      statusCode,
      checkInMethod === 'qr_code'
        ? 'Check-in verified successfully via venue QR scan.'
        : 'Check-in verified successfully via manual desk code.'
    );
  } else {
    if (config.NODE_ENV === 'production') {
      throw new AppError('Database service unavailable.', 503);
    }

    const restStop = mockRestStopStore.get(body.restStopId);
    if (!restStop) {
      throw new NotFoundError(`Rest stop with ID '${body.restStopId}' was not found.`);
    }

    if (restStop.status !== RestStopStatus.ACTIVE) {
      throw new BadRequestError('Cannot check in at a rest stop that is not approved and active.');
    }

    const submittedToken = (body.qrCredential || '').trim();
    const submittedCode = (body.verificationCode || '').trim();

    let isCredentialValid = false;
    let checkInMethod: 'qr_code' | 'otp' = 'qr_code';
    let verifyError = 'Invalid venue QR credential or verification code.';

    // 1. Try QR credential validation if submitted token has HMAC format
    if (submittedToken && submittedToken.includes('.')) {
      const qrCheck = verifyVenueQrCredential(
        submittedToken,
        body.restStopId,
        restStop.qrRotationVersion || 1
      );
      if (qrCheck.valid) {
        isCredentialValid = true;
        checkInMethod = 'qr_code';
      } else {
        verifyError = qrCheck.error || 'Invalid venue QR credential.';
      }
    }

    // 2. If not validated yet, try manual verification code (from body.verificationCode or submittedToken)
    if (!isCredentialValid) {
      const candidateCode = submittedCode || submittedToken;
      if (candidateCode) {
        const isCodeValid = verifyVenueVerificationCode(
          candidateCode,
          body.restStopId,
          restStop.qrRotationVersion || 1,
          restStop.verificationCode
        );
        if (isCodeValid) {
          isCredentialValid = true;
          checkInMethod = 'otp';
        } else if (!submittedToken.includes('.')) {
          verifyError = 'Invalid or expired venue verification code.';
        }
      }
    }

    if (!isCredentialValid) {
      throw new BadRequestError(verifyError);
    }

    // Cooldown check in mock store
    for (const item of mockCheckInStore.values()) {
      if (
        item.riderId === riderId &&
        item.restStopId === body.restStopId &&
        item.status === CheckinStatus.VERIFIED &&
        item.checkInTime.getTime() >= cooldownThreshold.getTime()
      ) {
        throw new ConflictError(
          'A verified check-in for this rest stop was already recorded within the last 15 minutes.'
        );
      }
    }

    // Check for pending check-in to transition
    let existingPending: MockCheckInItem | undefined;
    for (const item of mockCheckInStore.values()) {
      if (
        item.riderId === riderId &&
        item.restStopId === body.restStopId &&
        item.status === CheckinStatus.PENDING &&
        item.checkInTime.getTime() >= cooldownThreshold.getTime()
      ) {
        existingPending = item;
        break;
      }
    }

    if (existingPending) {
      existingPending.status = CheckinStatus.VERIFIED;
      existingPending.verifiedAt = now;
      existingPending.method = checkInMethod;
      existingPending.updatedAt = now;

      // Increment rest stop capacity occupancy and dynamically recalculate status
      restStop.capacity = computeUpdatedCapacity(restStop.capacity, 1);
      restStop.updatedAt = now;
      mockRestStopStore.set(body.restStopId, restStop);

      sendSuccess(
        res,
        formatRiderCheckIn(existingPending, restStop.name),
        200,
        checkInMethod === 'qr_code'
          ? 'Check-in verified successfully via venue QR scan.'
          : 'Check-in verified successfully via manual desk code.'
      );
      return;
    }

    const mockId = `mock-ci-v-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const mockItem: MockCheckInItem = {
      _id: mockId,
      id: mockId,
      riderId,
      restStopId: body.restStopId,
      merchantId: restStop.merchantId,
      method: checkInMethod,
      status: CheckinStatus.VERIFIED,
      checkInTime: now,
      verifiedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    mockCheckInStore.set(mockId, mockItem);

    // Increment rest stop capacity occupancy and dynamically recalculate status
    restStop.capacity = computeUpdatedCapacity(restStop.capacity, 1);
    restStop.updatedAt = now;
    mockRestStopStore.set(body.restStopId, restStop);

    sendSuccess(
      res,
      formatRiderCheckIn(mockItem, restStop.name),
      201,
      checkInMethod === 'qr_code'
        ? 'Check-in verified successfully via venue QR scan.'
        : 'Check-in verified successfully via manual desk code.'
    );
  }
}

/**
 * POST /api/v1/check-ins/:id/cancel
 * Authenticated rider endpoint to cancel their own pending check-in.
 */
export async function cancelRiderCheckInHandler(
  req: Request,
  res: Response
): Promise<void> {
  if (!req.user) {
    throw new ForbiddenError('Authentication required');
  }

  const user = req.user as any;
  const riderId = user._id ? user._id.toString() : user.id ? user.id.toString() : '';
  const rawId = req.params.id;
  const checkInId = (typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? rawId[0] : '').trim();

  if (!checkInId) {
    throw new BadRequestError('Check-in ID is required');
  }

  if (isDatabaseConnected()) {
    if (!Types.ObjectId.isValid(checkInId)) {
      throw new BadRequestError('Invalid check-in ID format');
    }

    const checkIn = await CheckIn.findById(checkInId).populate('restStopId', 'name');
    if (!checkIn || checkIn.riderId.toString() !== riderId) {
      throw new NotFoundError(`Check-in record with ID '${checkInId}' was not found.`);
    }

    if (checkIn.status !== CheckinStatus.PENDING) {
      throw new BadRequestError(
        `Only pending check-ins can be cancelled. Current status is '${checkIn.status}'.`
      );
    }

    checkIn.status = CheckinStatus.CANCELLED;
    await checkIn.save();

    sendSuccess(
      res,
      formatRiderCheckIn(checkIn, (checkIn.restStopId as any)?.name),
      200,
      'Check-in cancelled successfully.'
    );
  } else {
    if (config.NODE_ENV === 'production') {
      throw new AppError('Database service unavailable.', 503);
    }

    const item = mockCheckInStore.get(checkInId);
    if (!item || item.riderId !== riderId) {
      throw new NotFoundError(`Check-in record with ID '${checkInId}' was not found.`);
    }

    if (item.status !== CheckinStatus.PENDING) {
      throw new BadRequestError(
        `Only pending check-ins can be cancelled. Current status is '${item.status}'.`
      );
    }

    item.status = CheckinStatus.CANCELLED;
    item.updatedAt = new Date();

    const restStop = mockRestStopStore.get(item.restStopId);
    sendSuccess(
      res,
      formatRiderCheckIn(item, restStop?.name),
      200,
      'Check-in cancelled successfully.'
    );
  }
}

/**
 * GET /api/v1/merchant/rest-stops/:id/qr-credential
 * Authenticated merchant endpoint to retrieve the venue's cryptographic QR credential.
 * Scoped strictly to rest stops owned by the authenticated merchant (or admin).
 */
export async function getVenueQrCredentialHandler(
  req: Request,
  res: Response
): Promise<void> {
  if (!req.user) {
    throw new ForbiddenError('Authentication required');
  }

  const user = req.user as any;
  const callerId = user._id ? user._id.toString() : user.id ? user.id.toString() : '';
  const callerRole = user.role as UserRole;
  const rawId = req.params.id;
  const restStopId = (typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? rawId[0] : '').trim();

  if (!restStopId) {
    throw new BadRequestError('Rest stop ID is required');
  }

  if (isDatabaseConnected()) {
    if (!Types.ObjectId.isValid(restStopId)) {
      throw new BadRequestError('Invalid rest stop ID format');
    }

    const restStop = await RestStop.findById(restStopId);
    if (!restStop) {
      throw new NotFoundError(`Rest stop with ID '${restStopId}' was not found.`);
    }

    if (callerRole === UserRole.MERCHANT && restStop.merchantId.toString() !== callerId) {
      throw new ForbiddenError('You do not have permission to access credentials for this rest stop.');
    }

    if (restStop.status !== RestStopStatus.ACTIVE) {
      throw new BadRequestError('Cannot generate QR credential for an inactive rest stop.');
    }

    const version = restStop.qrRotationVersion || 1;
    const { qrCredential, verificationCode, expiresAt } = generateVenueQrCredential(restStop._id.toString(), version);

    if (!restStop.verificationCode) {
      restStop.verificationCode = verificationCode;
      await restStop.save();
    }

    sendSuccess(res, {
      restStopId: restStop._id.toString(),
      qrCredential,
      verificationCode: restStop.verificationCode || verificationCode,
      expiresAt: expiresAt.toISOString(),
      version,
    });
  } else {
    if (config.NODE_ENV === 'production') {
      throw new AppError('Database service unavailable.', 503);
    }

    const restStop = mockRestStopStore.get(restStopId);
    if (!restStop) {
      throw new NotFoundError(`Rest stop with ID '${restStopId}' was not found.`);
    }

    if (callerRole === UserRole.MERCHANT && restStop.merchantId !== callerId) {
      throw new ForbiddenError('You do not have permission to access credentials for this rest stop.');
    }

    if (restStop.status !== RestStopStatus.ACTIVE) {
      throw new BadRequestError('Cannot generate QR credential for an inactive rest stop.');
    }

    const version = restStop.qrRotationVersion || 1;
    const { qrCredential, verificationCode, expiresAt } = generateVenueQrCredential(restStop._id, version);

    if (!restStop.verificationCode) {
      restStop.verificationCode = verificationCode;
    }

    sendSuccess(res, {
      restStopId: restStop._id,
      qrCredential,
      verificationCode: restStop.verificationCode || verificationCode,
      expiresAt: expiresAt.toISOString(),
      version,
    });
  }
}

/**
 * POST /api/v1/merchant/rest-stops/:id/qr-credential/rotate
 * Authenticated merchant endpoint to rotate and invalidate previous QR credentials for their venue.
 */
export async function rotateVenueQrCredentialHandler(
  req: Request,
  res: Response
): Promise<void> {
  if (!req.user) {
    throw new ForbiddenError('Authentication required');
  }

  const user = req.user as any;
  const callerId = user._id ? user._id.toString() : user.id ? user.id.toString() : '';
  const callerRole = user.role as UserRole;
  const rawId = req.params.id;
  const restStopId = (typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? rawId[0] : '').trim();

  if (!restStopId) {
    throw new BadRequestError('Rest stop ID is required');
  }

  if (isDatabaseConnected()) {
    if (!Types.ObjectId.isValid(restStopId)) {
      throw new BadRequestError('Invalid rest stop ID format');
    }

    const restStop = await RestStop.findById(restStopId);
    if (!restStop) {
      throw new NotFoundError(`Rest stop with ID '${restStopId}' was not found.`);
    }

    if (callerRole === UserRole.MERCHANT && restStop.merchantId.toString() !== callerId) {
      throw new ForbiddenError('You do not have permission to rotate credentials for this rest stop.');
    }

    const newVersion = (restStop.qrRotationVersion || 1) + 1;
    const { qrCredential, verificationCode, expiresAt } = generateVenueQrCredential(restStop._id.toString(), newVersion);
    restStop.qrRotationVersion = newVersion;
    restStop.verificationCode = verificationCode;
    await restStop.save();

    sendSuccess(
      res,
      {
        restStopId: restStop._id.toString(),
        qrCredential,
        verificationCode,
        expiresAt: expiresAt.toISOString(),
        version: newVersion,
      },
      200,
      'Venue QR credential rotated successfully. All previous credentials for this rest stop have been revoked.'
    );
  } else {
    if (config.NODE_ENV === 'production') {
      throw new AppError('Database service unavailable.', 503);
    }

    const restStop = mockRestStopStore.get(restStopId);
    if (!restStop) {
      throw new NotFoundError(`Rest stop with ID '${restStopId}' was not found.`);
    }

    if (callerRole === UserRole.MERCHANT && restStop.merchantId !== callerId) {
      throw new ForbiddenError('You do not have permission to rotate credentials for this rest stop.');
    }

    const newVersion = (restStop.qrRotationVersion || 1) + 1;
    const { qrCredential, verificationCode, expiresAt } = generateVenueQrCredential(restStop._id, newVersion);
    restStop.qrRotationVersion = newVersion;
    restStop.verificationCode = verificationCode;
    restStop.updatedAt = new Date();

    sendSuccess(
      res,
      {
        restStopId: restStop._id,
        qrCredential,
        verificationCode,
        expiresAt: expiresAt.toISOString(),
        version: newVersion,
      },
      200,
      'Venue QR credential rotated successfully. All previous credentials for this rest stop have been revoked.'
    );
  }
}

/**
 * POST /api/v1/merchant/check-ins/:id/confirm
 * Authenticated merchant endpoint to confirm a pending check-in at their owned venue.
 */
export async function confirmMerchantCheckInHandler(
  req: Request,
  res: Response
): Promise<void> {
  if (!req.user) {
    throw new ForbiddenError('Authentication required');
  }

  const user = req.user as any;
  const callerId = user._id ? user._id.toString() : user.id ? user.id.toString() : '';
  const callerRole = user.role as UserRole;
  const rawId = req.params.id;
  const checkInId = (typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? rawId[0] : '').trim();
  const body = req.body as ConfirmCheckInRequest;

  if (!checkInId) {
    throw new BadRequestError('Check-in ID is required');
  }

  const now = new Date();

  if (isDatabaseConnected()) {
    if (!Types.ObjectId.isValid(checkInId)) {
      throw new BadRequestError('Invalid check-in ID format');
    }

    const checkIn = await CheckIn.findById(checkInId)
      .populate('restStopId', 'name')
      .populate('riderId', 'name');

    if (!checkIn) {
      throw new NotFoundError(`Check-in record with ID '${checkInId}' was not found.`);
    }

    if (callerRole === UserRole.MERCHANT && checkIn.merchantId.toString() !== callerId) {
      throw new ForbiddenError('You do not have permission to confirm check-ins for this rest stop.');
    }

    if (checkIn.status === CheckinStatus.VERIFIED) {
      throw new ConflictError('Check-in has already been verified.');
    }

    if (checkIn.status !== CheckinStatus.PENDING) {
      throw new BadRequestError(`Cannot confirm check-in with status '${checkIn.status}'.`);
    }

    // Check expiry
    if (now.getTime() - checkIn.checkInTime.getTime() > DUPLICATE_CHECKIN_WINDOW_MS) {
      checkIn.status = CheckinStatus.EXPIRED;
      await checkIn.save();
      throw new BadRequestError('Check-in request has expired.');
    }

    // Check optional OTP verification code if supplied
    if (body.verificationCode) {
      const expectedCode = (checkIn.verificationCode || '').trim().toUpperCase();
      const providedCode = body.verificationCode.trim().toUpperCase();
      if (expectedCode !== providedCode) {
        throw new BadRequestError('Invalid verification code.');
      }
    }

    checkIn.status = CheckinStatus.VERIFIED;
    checkIn.verifiedAt = now;
    await checkIn.save();

    // Increment rest stop capacity occupancy upon merchant confirmation
    const restStop = await RestStop.findById(checkIn.restStopId);
    if (restStop) {
      restStop.capacity = computeUpdatedCapacity(restStop.capacity, 1);
      await restStop.save();
    }

    sendSuccess(
      res,
      formatMerchantCheckIn(
        checkIn,
        (checkIn.restStopId as any)?.name,
        (checkIn.riderId as any)?.name
      ),
      200,
      'Check-in verified successfully by merchant.'
    );
  } else {
    if (config.NODE_ENV === 'production') {
      throw new AppError('Database service unavailable.', 503);
    }

    const item = mockCheckInStore.get(checkInId);
    if (!item) {
      throw new NotFoundError(`Check-in record with ID '${checkInId}' was not found.`);
    }

    if (callerRole === UserRole.MERCHANT && item.merchantId !== callerId) {
      throw new ForbiddenError('You do not have permission to confirm check-ins for this rest stop.');
    }

    if (item.status === CheckinStatus.VERIFIED) {
      throw new ConflictError('Check-in has already been verified.');
    }

    if (item.status !== CheckinStatus.PENDING) {
      throw new BadRequestError(`Cannot confirm check-in with status '${item.status}'.`);
    }

    if (now.getTime() - item.checkInTime.getTime() > DUPLICATE_CHECKIN_WINDOW_MS) {
      item.status = CheckinStatus.EXPIRED;
      item.updatedAt = now;
      throw new BadRequestError('Check-in request has expired.');
    }

    if (body.verificationCode) {
      const expectedCode = (item.verificationCode || '').trim().toUpperCase();
      const providedCode = body.verificationCode.trim().toUpperCase();
      if (expectedCode !== providedCode) {
        throw new BadRequestError('Invalid verification code.');
      }
    }

    item.status = CheckinStatus.VERIFIED;
    item.verifiedAt = now;
    item.updatedAt = now;

    const restStop = mockRestStopStore.get(item.restStopId);
    if (restStop) {
      restStop.capacity = computeUpdatedCapacity(restStop.capacity, 1);
      restStop.updatedAt = now;
      mockRestStopStore.set(item.restStopId, restStop);
    }
    const rider = mockUserStore.get(item.riderId);

    sendSuccess(
      res,
      formatMerchantCheckIn(item, restStop?.name, rider?.name),
      200,
      'Check-in verified successfully by merchant.'
    );
  }
}

/**
 * POST /api/v1/merchant/check-ins/:id/reject
 * Authenticated merchant endpoint to reject a pending check-in at their venue.
 */
export async function rejectMerchantCheckInHandler(
  req: Request,
  res: Response
): Promise<void> {
  if (!req.user) {
    throw new ForbiddenError('Authentication required');
  }

  const user = req.user as any;
  const callerId = user._id ? user._id.toString() : user.id ? user.id.toString() : '';
  const callerRole = user.role as UserRole;
  const rawId = req.params.id;
  const checkInId = (typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? rawId[0] : '').trim();

  if (!checkInId) {
    throw new BadRequestError('Check-in ID is required');
  }

  const now = new Date();

  if (isDatabaseConnected()) {
    if (!Types.ObjectId.isValid(checkInId)) {
      throw new BadRequestError('Invalid check-in ID format');
    }

    const checkIn = await CheckIn.findById(checkInId)
      .populate('restStopId', 'name')
      .populate('riderId', 'name');

    if (!checkIn) {
      throw new NotFoundError(`Check-in record with ID '${checkInId}' was not found.`);
    }

    if (callerRole === UserRole.MERCHANT && checkIn.merchantId.toString() !== callerId) {
      throw new ForbiddenError('You do not have permission to reject check-ins for this rest stop.');
    }

    if (checkIn.status !== CheckinStatus.PENDING) {
      throw new BadRequestError(`Cannot reject check-in with status '${checkIn.status}'.`);
    }

    checkIn.status = CheckinStatus.REJECTED;
    await checkIn.save();

    sendSuccess(
      res,
      formatMerchantCheckIn(
        checkIn,
        (checkIn.restStopId as any)?.name,
        (checkIn.riderId as any)?.name
      ),
      200,
      'Check-in rejected by merchant.'
    );
  } else {
    if (config.NODE_ENV === 'production') {
      throw new AppError('Database service unavailable.', 503);
    }

    const item = mockCheckInStore.get(checkInId);
    if (!item) {
      throw new NotFoundError(`Check-in record with ID '${checkInId}' was not found.`);
    }

    if (callerRole === UserRole.MERCHANT && item.merchantId !== callerId) {
      throw new ForbiddenError('You do not have permission to reject check-ins for this rest stop.');
    }

    if (item.status !== CheckinStatus.PENDING) {
      throw new BadRequestError(`Cannot reject check-in with status '${item.status}'.`);
    }

    item.status = CheckinStatus.REJECTED;
    item.updatedAt = now;

    const restStop = mockRestStopStore.get(item.restStopId);
    const rider = mockUserStore.get(item.riderId);

    sendSuccess(
      res,
      formatMerchantCheckIn(item, restStop?.name, rider?.name),
      200,
      'Check-in rejected by merchant.'
    );
  }
}

