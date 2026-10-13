import { Request, Response } from 'express';
import mongoose, { Types } from 'mongoose';
import {
  RestStopStatus,
  DealDiscountType,
  CreateDealRequest,
  UpdateDealRequest,
  AdminUpdateDealStatus,
  DealQuery,
  AdminDealQuery,
  MerchantDealQuery,
} from 'shared-types';
import { Deal } from '../models/Deal';
import { RestStop } from '../models/RestStop';
import { isDatabaseConnected } from '../config/database';
import { config } from '../config/env';
import { formatPublicDeal, formatAdminDeal } from '../utils/deal';
import { sendSuccess } from '../utils/response';
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  AppError,
} from '../utils/errors';
import { mockDealStore, MockDealItem } from './dealMockStore';
import { mockRestStopStore } from './restStopMockStore';
import { recordAuditLog } from '../utils/audit';

/**
 * Escapes regex special characters to prevent ReDoS or unintended query matching.
 */
function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * GET /api/v1/deals
 * Public discovery endpoint. Only returns active, non-expired deals linked to active rest stops.
 */
export async function getPublicDealsHandler(req: Request, res: Response): Promise<void> {
  const query = req.query as unknown as DealQuery;
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));
  const skip = (page - 1) * limit;

  const search = query.search?.trim();
  const restStopId = query.restStopId?.trim();
  const discountType = query.discountType;
  const sort = query.sort || 'newest';

  const now = new Date();

  if (isDatabaseConnected()) {
    // 1. Identify active rest stops eligible for public deal discovery
    let targetRestStopIds: Types.ObjectId[] = [];
    const restStopNameMap = new Map<string, string>();

    if (restStopId) {
      if (!Types.ObjectId.isValid(restStopId)) {
        // Safe return of empty paginated result for invalid ID format
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

      const activeStop = await RestStop.findOne(
        { _id: new Types.ObjectId(restStopId), status: RestStopStatus.ACTIVE },
        { _id: 1, name: 1 }
      ).lean();

      if (!activeStop) {
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

      targetRestStopIds = [activeStop._id];
      restStopNameMap.set(activeStop._id.toString(), activeStop.name);
    } else {
      const activeStops = await RestStop.find(
        { status: RestStopStatus.ACTIVE },
        { _id: 1, name: 1 }
      ).lean();

      targetRestStopIds = activeStops.map((s) => s._id);
      for (const s of activeStops) {
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

    // 2. Build Mongo filter with strict public visibility rules
    const mongoFilter: Record<string, any> = {
      isActive: true,
      validFrom: { $lte: now },
      restStopId: { $in: targetRestStopIds },
      $or: [
        { validUntil: { $exists: false } },
        { validUntil: null },
        { validUntil: { $gt: now } },
      ],
    };

    if (discountType) {
      mongoFilter.discountType = discountType;
    }

    if (search) {
      const escaped = escapeRegex(search);
      mongoFilter.$or = [
        { title: { $regex: new RegExp(escaped, 'i') } },
        { description: { $regex: new RegExp(escaped, 'i') } },
      ];
    }

    const sortMap: Record<string, any> = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      title_asc: { title: 1 },
      title_desc: { title: -1 },
      discount_desc: { discountPercentage: -1, flatDiscountAmount: -1 },
    };
    const sortOption = sortMap[sort] || sortMap.newest;

    const total = await Deal.countDocuments(mongoFilter);
    const docs = await Deal.find(mongoFilter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .populate('restStopId', 'name');

    sendSuccess(res, {
      items: docs.map((doc) => formatPublicDeal(doc, restStopNameMap.get(doc.restStopId?.toString()))),
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

    // Offline mock evaluation
    let items = Array.from(mockDealStore.values()).filter((deal) => {
      // 1. Must be active
      if (!deal.isActive) return false;
      // 2. Must not be future-dated
      if (new Date(deal.validFrom) > now) return false;
      // 3. Must not be expired
      if (deal.validUntil && new Date(deal.validUntil) <= now) return false;
      // 4. Associated rest stop must be approved and active
      const restStop = mockRestStopStore.get(deal.restStopId);
      if (!restStop || restStop.status !== RestStopStatus.ACTIVE) return false;

      return true;
    });

    if (restStopId) {
      items = items.filter((d) => d.restStopId === restStopId);
    }

    if (discountType) {
      items = items.filter((d) => d.discountType === discountType);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      items = items.filter(
        (d) =>
          d.title.toLowerCase().includes(searchLower) ||
          d.description.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    if (sort === 'oldest') {
      items.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    } else if (sort === 'title_asc') {
      items.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sort === 'title_desc') {
      items.sort((a, b) => b.title.localeCompare(a.title));
    } else if (sort === 'discount_desc') {
      items.sort((a, b) => (b.discountPercentage || 0) - (a.discountPercentage || 0));
    } else {
      // newest
      items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    const total = items.length;
    const paginated = items.slice(skip, skip + limit);

    sendSuccess(res, {
      items: paginated.map((d) => {
        const rs = mockRestStopStore.get(d.restStopId);
        return formatPublicDeal(d, rs?.name);
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
 * GET /api/v1/deals/:id
 * Public deal detail endpoint. Returns safe DTO only if deal and associated rest stop are active.
 */
export async function getPublicDealByIdHandler(req: Request, res: Response): Promise<void> {
  const rawId = req.params.id;
  const dealId = (typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? rawId[0] : '').trim();

  if (!dealId) {
    throw new BadRequestError('Deal ID is required');
  }

  const now = new Date();

  if (isDatabaseConnected()) {
    if (!Types.ObjectId.isValid(dealId)) {
      throw new BadRequestError('Invalid deal ID format');
    }

    const doc = await Deal.findById(dealId).populate('restStopId', 'name status');
    if (!doc) {
      throw new NotFoundError(`Deal with ID '${dealId}' was not found.`);
    }

    // Enforce public visibility constraints
    const populatedStop = doc.restStopId as any;
    const isRestStopActive = populatedStop && populatedStop.status === RestStopStatus.ACTIVE;
    const isNotExpired = !doc.validUntil || doc.validUntil > now;
    const isStarted = doc.validFrom <= now;

    if (!doc.isActive || !isRestStopActive || !isNotExpired || !isStarted) {
      throw new NotFoundError(`Deal with ID '${dealId}' is not active or is no longer available.`);
    }

    sendSuccess(res, formatPublicDeal(doc, populatedStop?.name));
  } else {
    if (config.NODE_ENV === 'production') {
      throw new AppError('Database service unavailable.', 503);
    }

    const item = mockDealStore.get(dealId);
    if (!item) {
      throw new NotFoundError(`Deal with ID '${dealId}' was not found.`);
    }

    const restStop = mockRestStopStore.get(item.restStopId);
    const isRestStopActive = restStop && restStop.status === RestStopStatus.ACTIVE;
    const isNotExpired = !item.validUntil || new Date(item.validUntil) > now;
    const isStarted = new Date(item.validFrom) <= now;

    if (!item.isActive || !isRestStopActive || !isNotExpired || !isStarted) {
      throw new NotFoundError(`Deal with ID '${dealId}' is not active or is no longer available.`);
    }

    sendSuccess(res, formatPublicDeal(item, restStop?.name));
  }
}

/**
 * POST /api/v1/deals
 * Authenticated merchant endpoint to create a deal.
 * Derives merchantId from server session; validates restStop ownership and active status.
 */
export async function createMerchantDealHandler(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new ForbiddenError('Authentication required');
  }

  const user = req.user as any;
  const merchantId = user._id ? user._id.toString() : user.id ? user.id.toString() : '';
  const body = req.body as CreateDealRequest;

  const now = new Date();
  if (body.validUntil && new Date(body.validUntil) < now) {
    throw new BadRequestError('validUntil cannot be in the past when creating a deal.');
  }

  if (isDatabaseConnected()) {
    if (!Types.ObjectId.isValid(body.restStopId)) {
      throw new BadRequestError('Invalid rest stop ID format');
    }

    const restStop = await RestStop.findById(body.restStopId);
    if (!restStop) {
      throw new NotFoundError(`Associated rest stop with ID '${body.restStopId}' was not found.`);
    }

    // Verify ownership
    if (restStop.merchantId.toString() !== merchantId) {
      throw new ForbiddenError(
        'You do not own this rest stop. Merchants can only create deals for their own rest stops.'
      );
    }

    // Prevent publishing deals for unapproved or suspended rest stops
    if (restStop.status !== RestStopStatus.ACTIVE) {
      throw new BadRequestError(
        'Cannot publish deals for a rest stop that is not approved and active.'
      );
    }

    const newDeal = new Deal({
      restStopId: restStop._id,
      merchantId: new Types.ObjectId(merchantId),
      title: body.title,
      description: body.description,
      discountType: body.discountType,
      discountPercentage: body.discountPercentage,
      flatDiscountAmount: body.flatDiscountAmount,
      originalPrice: body.originalPrice,
      dealPrice: body.dealPrice,
      validHours: body.validHours,
      terms: body.terms,
      validFrom: body.validFrom || now,
      validUntil: body.validUntil,
      isActive: body.isActive !== undefined ? body.isActive : true,
      maxRedemptionsPerRider: body.maxRedemptionsPerRider || 1,
    });

    await newDeal.save();

    sendSuccess(
      res,
      formatAdminDeal(newDeal, restStop.name),
      201,
      'Deal created successfully.'
    );
  } else {
    if (config.NODE_ENV === 'production') {
      throw new AppError('Database service unavailable.', 503);
    }

    const restStop = mockRestStopStore.get(body.restStopId);
    if (!restStop) {
      throw new NotFoundError(`Associated rest stop with ID '${body.restStopId}' was not found.`);
    }

    if (restStop.merchantId !== merchantId) {
      throw new ForbiddenError(
        'You do not own this rest stop. Merchants can only create deals for their own rest stops.'
      );
    }

    if (restStop.status !== RestStopStatus.ACTIVE) {
      throw new BadRequestError(
        'Cannot publish deals for a rest stop that is not approved and active.'
      );
    }

    const mockId = `mock-deal-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const mockItem: MockDealItem = {
      _id: mockId,
      id: mockId,
      restStopId: body.restStopId,
      merchantId,
      title: body.title,
      description: body.description,
      discountType: body.discountType,
      discountPercentage: body.discountPercentage,
      flatDiscountAmount: body.flatDiscountAmount,
      originalPrice: body.originalPrice,
      dealPrice: body.dealPrice,
      validHours: body.validHours,
      terms: body.terms,
      validFrom: body.validFrom ? new Date(body.validFrom) : now,
      validUntil: body.validUntil ? new Date(body.validUntil) : undefined,
      isActive: body.isActive !== undefined ? body.isActive : true,
      maxRedemptionsPerRider: body.maxRedemptionsPerRider || 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockDealStore.set(mockId, mockItem);

    sendSuccess(
      res,
      formatAdminDeal(mockItem, restStop.name),
      201,
      'Deal created successfully.'
    );
  }
}

/**
 * PATCH /api/v1/deals/:id
 * Authenticated merchant endpoint to update their own deal.
 * Verifies ownership before updating; prevents activating expired deals.
 */
export async function updateMerchantDealHandler(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new ForbiddenError('Authentication required');
  }

  const rawId = req.params.id;
  const dealId = (typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? rawId[0] : '').trim();
  const user = req.user as any;
  const callerMerchantId = user._id ? user._id.toString() : user.id ? user.id.toString() : '';
  const updates = req.body as UpdateDealRequest;

  if (!dealId) {
    throw new BadRequestError('Deal ID is required');
  }

  const now = new Date();

  if (isDatabaseConnected()) {
    if (!Types.ObjectId.isValid(dealId)) {
      throw new BadRequestError('Invalid deal ID format');
    }

    const doc = await Deal.findById(dealId);
    if (!doc) {
      throw new NotFoundError(`Deal with ID '${dealId}' was not found.`);
    }

    // Verify ownership
    if (doc.merchantId.toString() !== callerMerchantId) {
      throw new ForbiddenError('You do not have permission to modify this deal.');
    }

    // Prevent activating an expired deal without extending validity
    if (updates.isActive === true) {
      const effectiveValidUntil =
        updates.validUntil !== undefined ? updates.validUntil : doc.validUntil;
      if (effectiveValidUntil && new Date(effectiveValidUntil) < now) {
        throw new BadRequestError(
          'Cannot activate an expired deal. Please update the validity period first.'
        );
      }
    }

    // Strictly allowlisted field assignments
    if (updates.title !== undefined) doc.title = updates.title;
    if (updates.description !== undefined) doc.description = updates.description;
    if (updates.discountType !== undefined) doc.discountType = updates.discountType;
    if (updates.discountPercentage !== undefined) doc.discountPercentage = updates.discountPercentage;
    if (updates.flatDiscountAmount !== undefined) doc.flatDiscountAmount = updates.flatDiscountAmount;
    if (updates.originalPrice !== undefined) doc.originalPrice = updates.originalPrice;
    if (updates.dealPrice !== undefined) doc.dealPrice = updates.dealPrice;
    if (updates.validHours !== undefined) doc.validHours = updates.validHours;
    if (updates.terms !== undefined) doc.terms = updates.terms;
    if (updates.validFrom !== undefined) doc.validFrom = updates.validFrom;
    if (updates.validUntil !== undefined) doc.validUntil = updates.validUntil;
    if (updates.isActive !== undefined) doc.isActive = updates.isActive;
    if (updates.maxRedemptionsPerRider !== undefined) {
      doc.maxRedemptionsPerRider = updates.maxRedemptionsPerRider;
    }

    await doc.save();

    sendSuccess(res, formatAdminDeal(doc), 200, 'Deal updated successfully.');
  } else {
    if (config.NODE_ENV === 'production') {
      throw new AppError('Database service unavailable.', 503);
    }

    const item = mockDealStore.get(dealId);
    if (!item) {
      throw new NotFoundError(`Deal with ID '${dealId}' was not found.`);
    }

    if (item.merchantId !== callerMerchantId) {
      throw new ForbiddenError('You do not have permission to modify this deal.');
    }

    if (updates.isActive === true) {
      const effectiveValidUntil =
        updates.validUntil !== undefined ? updates.validUntil : item.validUntil;
      if (effectiveValidUntil && new Date(effectiveValidUntil) < now) {
        throw new BadRequestError(
          'Cannot activate an expired deal. Please update the validity period first.'
        );
      }
    }

    if (updates.title !== undefined) item.title = updates.title;
    if (updates.description !== undefined) item.description = updates.description;
    if (updates.discountType !== undefined) item.discountType = updates.discountType;
    if (updates.discountPercentage !== undefined) item.discountPercentage = updates.discountPercentage;
    if (updates.flatDiscountAmount !== undefined) item.flatDiscountAmount = updates.flatDiscountAmount;
    if (updates.originalPrice !== undefined) item.originalPrice = updates.originalPrice;
    if (updates.dealPrice !== undefined) item.dealPrice = updates.dealPrice;
    if (updates.validHours !== undefined) item.validHours = updates.validHours;
    if (updates.terms !== undefined) item.terms = updates.terms;
    if (updates.validFrom !== undefined) item.validFrom = new Date(updates.validFrom);
    if (updates.validUntil !== undefined) item.validUntil = new Date(updates.validUntil);
    if (updates.isActive !== undefined) item.isActive = updates.isActive;
    if (updates.maxRedemptionsPerRider !== undefined) {
      item.maxRedemptionsPerRider = updates.maxRedemptionsPerRider;
    }
    item.updatedAt = new Date();

    sendSuccess(res, formatAdminDeal(item), 200, 'Deal updated successfully.');
  }
}

/**
 * GET /api/v1/merchant/deals
 * Authenticated merchant endpoint to list only deals belonging to the authenticated merchant.
 * Supports filtering by status ('all' | 'active' | 'inactive' | 'expired'), restStopId, and search keyword.
 */
export async function getMerchantDealsHandler(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new ForbiddenError('Authentication required');
  }

  const user = req.user as any;
  const callerMerchantId = user._id ? user._id.toString() : user.id ? user.id.toString() : '';
  const query = req.query as unknown as MerchantDealQuery;

  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));
  const skip = (page - 1) * limit;

  const search = query.search?.trim();
  const restStopId = query.restStopId?.trim();
  const status = query.status;
  const isActive = query.isActive;
  const now = new Date();

  if (isDatabaseConnected()) {
    const mongoFilter: Record<string, any> = {
      merchantId: new Types.ObjectId(callerMerchantId),
    };

    if (restStopId && Types.ObjectId.isValid(restStopId)) {
      mongoFilter.restStopId = new Types.ObjectId(restStopId);
    }

    if (isActive !== undefined) {
      mongoFilter.isActive = isActive;
    } else if (status && status !== 'all') {
      if (status === 'active') {
        mongoFilter.isActive = true;
        mongoFilter.$or = [{ validUntil: { $exists: false } }, { validUntil: { $gt: now } }];
      } else if (status === 'inactive') {
        mongoFilter.isActive = false;
      } else if (status === 'expired') {
        mongoFilter.validUntil = { $lte: now };
      }
    }

    if (search) {
      const escaped = escapeRegex(search);
      mongoFilter.$or = [
        { title: { $regex: new RegExp(escaped, 'i') } },
        { description: { $regex: new RegExp(escaped, 'i') } },
      ];
    }

    const total = await Deal.countDocuments(mongoFilter);
    const docs = await Deal.find(mongoFilter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('restStopId', 'name');

    sendSuccess(res, {
      items: docs.map((d) => formatAdminDeal(d, (d.restStopId as any)?.name)),
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

    let items = Array.from(mockDealStore.values()).filter(
      (d) => d.merchantId === callerMerchantId
    );

    if (restStopId) {
      items = items.filter((d) => d.restStopId === restStopId);
    }

    if (isActive !== undefined) {
      items = items.filter((d) => d.isActive === isActive);
    } else if (status && status !== 'all') {
      if (status === 'active') {
        items = items.filter((d) => d.isActive === true && (!d.validUntil || new Date(d.validUntil) > now));
      } else if (status === 'inactive') {
        items = items.filter((d) => d.isActive === false);
      } else if (status === 'expired') {
        items = items.filter((d) => d.validUntil && new Date(d.validUntil) <= now);
      }
    }

    if (search) {
      const searchLower = search.toLowerCase();
      items = items.filter(
        (d) =>
          d.title.toLowerCase().includes(searchLower) ||
          d.description.toLowerCase().includes(searchLower)
      );
    }

    items.sort((a, b) => {
      const aDate = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
      const bDate = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
      return bDate - aDate;
    });

    const total = items.length;
    const paginated = items.slice(skip, skip + limit);

    sendSuccess(res, {
      items: paginated.map((d) => {
        const rs = mockRestStopStore.get(d.restStopId);
        return formatAdminDeal(d, rs?.name);
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
 * GET /api/v1/merchant/deals/:id
 * Authenticated merchant endpoint to retrieve a single owned deal by ID.
 * Enforces ownership check (HTTP 403 on mismatch).
 */
export async function getMerchantDealByIdHandler(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new ForbiddenError('Authentication required');
  }

  const rawId = req.params.id;
  const dealId = (typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? rawId[0] : '').trim();
  const user = req.user as any;
  const callerMerchantId = user._id ? user._id.toString() : user.id ? user.id.toString() : '';

  if (!dealId) {
    throw new BadRequestError('Deal ID is required');
  }

  if (isDatabaseConnected()) {
    if (!Types.ObjectId.isValid(dealId)) {
      throw new BadRequestError('Invalid deal ID format');
    }

    const doc = await Deal.findById(dealId).populate('restStopId', 'name');
    if (!doc) {
      throw new NotFoundError(`Deal with ID '${dealId}' was not found.`);
    }

    if (doc.merchantId.toString() !== callerMerchantId) {
      throw new ForbiddenError('You do not have permission to view this deal.');
    }

    sendSuccess(res, formatAdminDeal(doc, (doc.restStopId as any)?.name));
  } else {
    if (config.NODE_ENV === 'production') {
      throw new AppError('Database service unavailable.', 503);
    }

    const item = mockDealStore.get(dealId);
    if (!item) {
      throw new NotFoundError(`Deal with ID '${dealId}' was not found.`);
    }

    if (item.merchantId !== callerMerchantId) {
      throw new ForbiddenError('You do not have permission to view this deal.');
    }

    const rs = mockRestStopStore.get(item.restStopId);
    sendSuccess(res, formatAdminDeal(item, rs?.name));
  }
}

/**
 * GET /api/v1/admin/deals
 * Admin listing endpoint. Returns all deals with administrative metadata.
 */
export async function getAdminDealsHandler(req: Request, res: Response): Promise<void> {
  const query = req.query as unknown as AdminDealQuery;
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));
  const skip = (page - 1) * limit;

  const search = query.search?.trim();
  const restStopId = query.restStopId?.trim();
  const merchantId = query.merchantId?.trim();
  const status = query.status;
  const isActive = query.isActive;

  if (isDatabaseConnected()) {
    const mongoFilter: Record<string, any> = {};

    if (isActive !== undefined) {
      mongoFilter.isActive = isActive;
    } else if (status && status !== 'all') {
      if (status === 'active') mongoFilter.isActive = true;
      if (status === 'inactive' || status === 'paused') mongoFilter.isActive = false;
    }

    if (restStopId && Types.ObjectId.isValid(restStopId)) {
      mongoFilter.restStopId = new Types.ObjectId(restStopId);
    }
    if (merchantId && Types.ObjectId.isValid(merchantId)) {
      mongoFilter.merchantId = new Types.ObjectId(merchantId);
    }

    if (search) {
      const escaped = escapeRegex(search);
      mongoFilter.$or = [
        { title: { $regex: new RegExp(escaped, 'i') } },
        { description: { $regex: new RegExp(escaped, 'i') } },
      ];
    }

    const total = await Deal.countDocuments(mongoFilter);
    const docs = await Deal.find(mongoFilter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('restStopId', 'name');

    sendSuccess(res, {
      items: docs.map((d) => formatAdminDeal(d, (d.restStopId as any)?.name)),
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

    let items = Array.from(mockDealStore.values());

    if (isActive !== undefined) {
      items = items.filter((d) => d.isActive === isActive);
    } else if (status && status !== 'all') {
      if (status === 'active') items = items.filter((d) => d.isActive === true);
      if (status === 'inactive' || status === 'paused') items = items.filter((d) => d.isActive === false);
    }

    if (restStopId) {
      items = items.filter((d) => d.restStopId === restStopId);
    }
    if (merchantId) {
      items = items.filter((d) => d.merchantId === merchantId);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      items = items.filter(
        (d) =>
          d.title.toLowerCase().includes(searchLower) ||
          d.description.toLowerCase().includes(searchLower)
      );
    }

    items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const total = items.length;
    const paginated = items.slice(skip, skip + limit);

    sendSuccess(res, {
      items: paginated.map((d) => {
        const rs = mockRestStopStore.get(d.restStopId);
        return formatAdminDeal(d, rs?.name);
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
 * PATCH /api/v1/admin/deals/:id/status
 * Admin moderation endpoint to activate, pause, or suspend a deal.
 */
export async function updateAdminDealStatusHandler(req: Request, res: Response): Promise<void> {
  const rawId = req.params.id;
  const dealId = (typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? rawId[0] : '').trim();
  const body = req.body as AdminUpdateDealStatus;

  if (!dealId) {
    throw new BadRequestError('Deal ID is required');
  }

  let targetIsActive = true;
  if (body.isActive !== undefined) {
    targetIsActive = body.isActive;
  } else if (body.status !== undefined) {
    targetIsActive = body.status === 'active';
  }

  const now = new Date();

  const adminUser = (req as any).user;
  const adminId = adminUser?.userId || adminUser?.id || 'admin';
  const adminName = adminUser?.name || 'Admin';

  if (isDatabaseConnected()) {
    if (!Types.ObjectId.isValid(dealId)) {
      throw new BadRequestError('Invalid deal ID format');
    }

    const doc = await Deal.findById(dealId);
    if (!doc) {
      throw new NotFoundError(`Deal with ID '${dealId}' was not found.`);
    }

    if (targetIsActive && doc.validUntil && doc.validUntil < now) {
      throw new BadRequestError('Cannot activate an expired deal.');
    }

    const prevActive = doc.isActive;
    doc.isActive = targetIsActive;
    await doc.save();

    await recordAuditLog({
      adminId,
      adminName,
      action: 'deal_moderation',
      targetType: 'deal',
      targetId: dealId,
      targetName: doc.title,
      prevStatus: prevActive ? 'active' : 'inactive',
      newStatus: targetIsActive ? 'active' : 'inactive',
      reason: body.reason,
    });

    sendSuccess(
      res,
      formatAdminDeal(doc),
      200,
      `Deal status updated to '${targetIsActive ? 'active' : 'inactive'}'.`
    );
  } else {
    if (config.NODE_ENV === 'production') {
      throw new AppError('Database service unavailable.', 503);
    }

    const item = mockDealStore.get(dealId);
    if (!item) {
      throw new NotFoundError(`Deal with ID '${dealId}' was not found.`);
    }

    if (targetIsActive && item.validUntil && new Date(item.validUntil) < now) {
      throw new BadRequestError('Cannot activate an expired deal.');
    }

    const prevActive = item.isActive;
    item.isActive = targetIsActive;
    item.updatedAt = new Date();

    await recordAuditLog({
      adminId,
      adminName,
      action: 'deal_moderation',
      targetType: 'deal',
      targetId: dealId,
      targetName: item.title,
      prevStatus: prevActive ? 'active' : 'inactive',
      newStatus: targetIsActive ? 'active' : 'inactive',
      reason: body.reason,
    });

    sendSuccess(
      res,
      formatAdminDeal(item),
      200,
      `Deal status updated to '${targetIsActive ? 'active' : 'inactive'}'.`
    );
  }
}
