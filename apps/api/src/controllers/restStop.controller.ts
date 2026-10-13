import { Request, Response } from 'express';
import mongoose, { Types } from 'mongoose';
import {
  RestStopStatus,
  Facility,
  CreateRestStopRequest,
  UpdateRestStopRequest,
  AdminUpdateRestStopStatus,
  RestStopQuery,
  AdminRestStopQuery,
} from 'shared-types';
import { RestStop, IRestStopDocument } from '../models/RestStop';
import { isDatabaseConnected } from '../config/database';
import { config } from '../config/env';
import { slugify, generateUniqueSlug } from '../utils/slug';
import { formatPublicRestStop, formatAdminRestStop } from '../utils/rest-stop';
import { sendSuccess } from '../utils/response';
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
  AppError,
} from '../utils/errors';
import {
  mockRestStopStore,
  MockRestStopItem,
} from './restStopMockStore';
import { recordAuditLog } from '../utils/audit';

/**
 * Escapes regex special characters to prevent ReDoS or unintended query matching.
 */
function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Normalizes facilities filter into an array of Facility enums.
 */
function parseFacilitiesFilter(raw?: string | string[]): Facility[] {
  if (!raw) return [];
  const list = Array.isArray(raw) ? raw : raw.split(',');
  const validFacilities = Object.values(Facility) as string[];
  return list
    .map((f) => f.trim())
    .filter((f) => validFacilities.includes(f)) as Facility[];
}

/**
 * GET /api/v1/rest-stops
 * Public discovery endpoint. Only returns approved/active rest stops.
 */
export async function getPublicRestStopsHandler(req: Request, res: Response): Promise<void> {
  const query = req.query as unknown as RestStopQuery;
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));
  const skip = (page - 1) * limit;

  const facilities = parseFacilitiesFilter(query.facilities);
  const city = query.city?.trim();
  const search = query.search?.trim();
  const sort = query.sort || 'newest';

  if (isDatabaseConnected()) {
    const mongoFilter: Record<string, any> = {
      status: RestStopStatus.ACTIVE,
    };

    if (city) {
      mongoFilter['address.city'] = { $regex: new RegExp(`^${escapeRegex(city)}$`, 'i') };
    }

    if (facilities.length > 0) {
      mongoFilter.facilities = { $all: facilities };
    }

    if (search) {
      const escaped = escapeRegex(search);
      mongoFilter.$or = [
        { name: { $regex: new RegExp(escaped, 'i') } },
        { 'address.city': { $regex: new RegExp(escaped, 'i') } },
        { 'address.area': { $regex: new RegExp(escaped, 'i') } },
      ];
    }

    const sortMap: Record<string, any> = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      name_asc: { name: 1 },
      name_desc: { name: -1 },
      rating: { 'rating.average': -1, 'rating.count': -1 },
    };
    const sortOption = sortMap[sort] || sortMap.newest;

    const total = await RestStop.countDocuments(mongoFilter);
    const docs = await RestStop.find(mongoFilter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    sendSuccess(res, {
      items: docs.map(formatPublicRestStop),
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
    // In production, database connection is mandatory. Never use test mocks in production.
    if (config.NODE_ENV === 'production') {
      throw new AppError('Database service unavailable.', 503);
    }

    // Offline execution path for tests without MongoDB
    let items = Array.from(mockRestStopStore.values()).filter(
      (item) => item.status === RestStopStatus.ACTIVE
    );

    if (city) {
      const cityLower = city.toLowerCase();
      items = items.filter((item) => item.address.city.toLowerCase() === cityLower);
    }

    if (facilities.length > 0) {
      items = items.filter((item) =>
        facilities.every((f) => item.facilities.includes(f))
      );
    }

    if (search) {
      const searchLower = search.toLowerCase();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(searchLower) ||
          item.address.city.toLowerCase().includes(searchLower) ||
          item.address.area.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    if (sort === 'name_asc') {
      items.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === 'name_desc') {
      items.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sort === 'rating') {
      items.sort((a, b) => (b.rating?.average || 0) - (a.rating?.average || 0));
    } else if (sort === 'oldest') {
      items.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    } else {
      // newest
      items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    const total = items.length;
    const paginated = items.slice(skip, skip + limit);

    sendSuccess(res, {
      items: paginated.map(formatPublicRestStop),
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
 * GET /api/v1/rest-stops/:slug
 * Public rest-stop detail by slug. Only returns approved/active rest stops.
 */
export async function getPublicRestStopBySlugHandler(
  req: Request,
  res: Response
): Promise<void> {
  const rawSlug = req.params.slug;
  const slug = (typeof rawSlug === 'string' ? rawSlug : Array.isArray(rawSlug) ? rawSlug[0] : '').trim().toLowerCase();

  if (!slug) {
    throw new BadRequestError('Rest stop slug is required');
  }

  if (isDatabaseConnected()) {
    const doc = await RestStop.findOne({
      slug,
      status: RestStopStatus.ACTIVE,
    });

    if (!doc) {
      throw new NotFoundError(`Rest stop with slug '${slug}' was not found or is not active.`);
    }

    sendSuccess(res, formatPublicRestStop(doc));
  } else {
    if (config.NODE_ENV === 'production') {
      throw new AppError('Database service unavailable.', 503);
    }

    const item = Array.from(mockRestStopStore.values()).find(
      (s) => s.slug === slug && s.status === RestStopStatus.ACTIVE
    );

    if (!item) {
      throw new NotFoundError(`Rest stop with slug '${slug}' was not found or is not active.`);
    }

    sendSuccess(res, formatPublicRestStop(item));
  }
}

/**
 * POST /api/v1/rest-stops
 * Authenticated merchant endpoint to create a rest stop.
 * Derives merchantId from authenticated user; enforces PENDING_APPROVAL initial status.
 */
export async function createMerchantRestStopHandler(
  req: Request,
  res: Response
): Promise<void> {
  if (!req.user) {
    throw new ForbiddenError('Authentication required');
  }

  const user = req.user as any;
  const merchantId = user._id ? user._id.toString() : user.id ? user.id.toString() : '';
  const body = req.body as CreateRestStopRequest;


  // Derive slug
  let slug = body.slug ? slugify(body.slug) : slugify(body.name);
  if (!slug) {
    slug = generateUniqueSlug(body.name);
  }

  if (isDatabaseConnected()) {
    const existingSlug = await RestStop.findOne({ slug });
    if (existingSlug) {
      throw new ConflictError(`A rest stop with slug '${slug}' already exists.`);
    }

    try {
      const newDoc = new RestStop({
        merchantId: new Types.ObjectId(merchantId),
        name: body.name,
        slug,
        description: body.description,
        address: body.address,
        location: body.location,
        facilities: body.facilities,
        images: body.images || [],
        capacity: {
          maxRiders: body.capacity.maxRiders,
          currentOccupancy: 0,
          status: body.capacity.status,
        },
        operatingHours: body.operatingHours || [],
        status: RestStopStatus.PENDING_APPROVAL,
        rating: { average: 0, count: 0 },
        dealBadge: body.dealBadge,
        dealDescription: body.dealDescription,
      });

      await newDoc.save();

      sendSuccess(
        res,
        formatAdminRestStop(newDoc),
        201,
        'Rest stop created successfully. It is pending admin approval.'
      );
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'code' in err && (err as { code: number }).code === 11000) {
        throw new ConflictError(`A rest stop with slug '${slug}' already exists.`);
      }
      throw err;
    }
  } else {
    if (config.NODE_ENV === 'production') {
      throw new AppError('Database service unavailable.', 503);
    }

    for (const item of mockRestStopStore.values()) {
      if (item.slug === slug) {
        throw new ConflictError(`A rest stop with slug '${slug}' already exists.`);
      }
    }

    const mockId = `mock-rs-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const mockItem: MockRestStopItem = {
      _id: mockId,
      id: mockId,
      merchantId,
      name: body.name,
      slug,
      description: body.description,
      address: body.address,
      location: body.location,
      facilities: body.facilities,
      images: body.images || [],
      capacity: {
        maxRiders: body.capacity.maxRiders,
        currentOccupancy: 0,
        status: body.capacity.status,
      },
      operatingHours: (body.operatingHours || []).map((h) => ({
        day: h.day,
        openTime: h.openTime,
        closeTime: h.closeTime,
        isOpen: Boolean(h.isOpen),
      })),
      status: RestStopStatus.PENDING_APPROVAL,
      rating: { average: 0, count: 0 },
      dealBadge: body.dealBadge,
      dealDescription: body.dealDescription,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockRestStopStore.set(mockId, mockItem);

    sendSuccess(
      res,
      formatAdminRestStop(mockItem),
      201,
      'Rest stop created successfully. It is pending admin approval.'
    );
  }
}

/**
 * PATCH /api/v1/rest-stops/:id
 * Authenticated merchant endpoint to update their own rest stop.
 * Verifies ownership before updating; strictly allowlists mutable fields.
 */
export async function updateMerchantRestStopHandler(
  req: Request,
  res: Response
): Promise<void> {
  if (!req.user) {
    throw new ForbiddenError('Authentication required');
  }

  const rawId = req.params.id;
  const restStopId = (typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? rawId[0] : '').trim();
  const user = req.user as any;
  const callerMerchantId = user._id ? user._id.toString() : user.id ? user.id.toString() : '';
  const updates = req.body as UpdateRestStopRequest;


  if (!restStopId) {
    throw new BadRequestError('Rest stop ID is required');
  }

  if (isDatabaseConnected()) {
    if (!Types.ObjectId.isValid(restStopId)) {
      throw new BadRequestError('Invalid rest stop ID format');
    }

    const doc = await RestStop.findById(restStopId);
    if (!doc) {
      throw new NotFoundError(`Rest stop with ID '${restStopId}' was not found.`);
    }

    // Verify ownership
    if (doc.merchantId.toString() !== callerMerchantId) {
      throw new ForbiddenError('You do not have permission to modify this rest stop.');
    }

    // Apply strictly allowlisted updates
    if (updates.name !== undefined) doc.name = updates.name;
    if (updates.description !== undefined) doc.description = updates.description;
    if (updates.address !== undefined) doc.address = updates.address as any;
    if (updates.location !== undefined) doc.location = updates.location as any;
    if (updates.facilities !== undefined) doc.facilities = updates.facilities;
    if (updates.images !== undefined) doc.images = updates.images;
    if (updates.capacity !== undefined) {
      if (updates.capacity.maxRiders !== undefined) {
        doc.capacity.maxRiders = updates.capacity.maxRiders;
      }
      if (updates.capacity.status !== undefined) {
        doc.capacity.status = updates.capacity.status;
      }
    }
    if (updates.operatingHours !== undefined) {
      doc.operatingHours = updates.operatingHours as any;
    }
    if (updates.dealBadge !== undefined) doc.dealBadge = updates.dealBadge;
    if (updates.dealDescription !== undefined) doc.dealDescription = updates.dealDescription;

    await doc.save();

    sendSuccess(res, formatAdminRestStop(doc), 200, 'Rest stop updated successfully.');
  } else {
    if (config.NODE_ENV === 'production') {
      throw new AppError('Database service unavailable.', 503);
    }

    const item = mockRestStopStore.get(restStopId);
    if (!item) {
      throw new NotFoundError(`Rest stop with ID '${restStopId}' was not found.`);
    }

    if (item.merchantId !== callerMerchantId) {
      throw new ForbiddenError('You do not have permission to modify this rest stop.');
    }

    if (updates.name !== undefined) item.name = updates.name;
    if (updates.description !== undefined) item.description = updates.description;
    if (updates.address !== undefined) item.address = updates.address;
    if (updates.location !== undefined) item.location = updates.location;
    if (updates.facilities !== undefined) item.facilities = updates.facilities;
    if (updates.images !== undefined) item.images = updates.images;
    if (updates.capacity !== undefined) {
      if (updates.capacity.maxRiders !== undefined) {
        item.capacity.maxRiders = updates.capacity.maxRiders;
      }
      if (updates.capacity.status !== undefined) {
        item.capacity.status = updates.capacity.status;
      }
    }
    if (updates.operatingHours !== undefined) {
      item.operatingHours = updates.operatingHours.map((h) => ({
        day: h.day,
        openTime: h.openTime,
        closeTime: h.closeTime,
        isOpen: Boolean(h.isOpen),
      }));
    }
    if (updates.dealBadge !== undefined) item.dealBadge = updates.dealBadge;
    if (updates.dealDescription !== undefined) item.dealDescription = updates.dealDescription;
    item.updatedAt = new Date();

    sendSuccess(res, formatAdminRestStop(item), 200, 'Rest stop updated successfully.');
  }
}

/**
 * GET /api/v1/admin/rest-stops
 * Admin list endpoint. Returns rest stops of any status with administrative metadata.
 */
export async function getAdminRestStopsHandler(req: Request, res: Response): Promise<void> {
  const query = req.query as unknown as AdminRestStopQuery;
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));
  const skip = (page - 1) * limit;

  const status = query.status;
  const city = query.city?.trim();
  const search = query.search?.trim();

  if (isDatabaseConnected()) {
    const mongoFilter: Record<string, any> = {};

    if (status) {
      mongoFilter.status = status;
    }
    if (city) {
      mongoFilter['address.city'] = { $regex: new RegExp(`^${escapeRegex(city)}$`, 'i') };
    }
    if (search) {
      const escaped = escapeRegex(search);
      mongoFilter.$or = [
        { name: { $regex: new RegExp(escaped, 'i') } },
        { 'address.city': { $regex: new RegExp(escaped, 'i') } },
      ];
    }

    const total = await RestStop.countDocuments(mongoFilter);
    const docs = await RestStop.find(mongoFilter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    sendSuccess(res, {
      items: docs.map(formatAdminRestStop),
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

    let items = Array.from(mockRestStopStore.values());

    if (status) {
      items = items.filter((item) => item.status === status);
    }
    if (city) {
      const cityLower = city.toLowerCase();
      items = items.filter((item) => item.address.city.toLowerCase() === cityLower);
    }
    if (search) {
      const searchLower = search.toLowerCase();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(searchLower) ||
          item.address.city.toLowerCase().includes(searchLower)
      );
    }

    items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const total = items.length;
    const paginated = items.slice(skip, skip + limit);

    sendSuccess(res, {
      items: paginated.map(formatAdminRestStop),
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
 * PATCH /api/v1/admin/rest-stops/:id/status
 * Admin moderation endpoint to approve or suspend a rest stop.
 */
export async function updateAdminRestStopStatusHandler(
  req: Request,
  res: Response
): Promise<void> {
  const rawId = req.params.id;
  const restStopId = (typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? rawId[0] : '').trim();
  const body = req.body as AdminUpdateRestStopStatus;

  if (!restStopId) {
    throw new BadRequestError('Rest stop ID is required');
  }


  const adminUser = (req as any).user;
  const adminId = adminUser?.userId || adminUser?.id || 'admin';
  const adminName = adminUser?.name || 'Admin';

  if (isDatabaseConnected()) {
    if (!Types.ObjectId.isValid(restStopId)) {
      throw new BadRequestError('Invalid rest stop ID format');
    }

    const doc = await RestStop.findById(restStopId);
    if (!doc) {
      throw new NotFoundError(`Rest stop with ID '${restStopId}' was not found.`);
    }

    const prevStatus = doc.status;
    doc.status = body.status;
    await doc.save();

    await recordAuditLog({
      adminId,
      adminName,
      action: 'rest_stop_moderation',
      targetType: 'rest_stop',
      targetId: restStopId,
      targetName: doc.name,
      prevStatus,
      newStatus: body.status,
      reason: body.reason,
    });

    sendSuccess(
      res,
      formatAdminRestStop(doc),
      200,
      `Rest stop status updated to '${body.status}'.`
    );
  } else {
    if (config.NODE_ENV === 'production') {
      throw new AppError('Database service unavailable.', 503);
    }

    const item = mockRestStopStore.get(restStopId);
    if (!item) {
      throw new NotFoundError(`Rest stop with ID '${restStopId}' was not found.`);
    }

    const prevStatus = item.status;
    item.status = body.status;
    item.updatedAt = new Date();

    await recordAuditLog({
      adminId,
      adminName,
      action: 'rest_stop_moderation',
      targetType: 'rest_stop',
      targetId: restStopId,
      targetName: item.name,
      prevStatus,
      newStatus: body.status,
      reason: body.reason,
    });

    sendSuccess(
      res,
      formatAdminRestStop(item),
      200,
      `Rest stop status updated to '${body.status}'.`
    );
  }
}

/**
 * GET /api/v1/merchant/rest-stops
 * Authenticated merchant endpoint to list only their own rest stops across all moderation statuses.
 */
export async function getMerchantRestStopsHandler(
  req: Request,
  res: Response
): Promise<void> {
  if (!req.user) {
    throw new ForbiddenError('Authentication required');
  }

  const user = req.user as any;
  const callerMerchantId = user._id ? user._id.toString() : user.id ? user.id.toString() : '';
  const query = req.query as unknown as RestStopQuery & { status?: RestStopStatus };

  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));
  const skip = (page - 1) * limit;
  const search = query.search?.trim();
  const status = query.status;

  if (isDatabaseConnected()) {
    const mongoFilter: Record<string, any> = {
      merchantId: new Types.ObjectId(callerMerchantId),
    };

    if (status && Object.values(RestStopStatus).includes(status)) {
      mongoFilter.status = status;
    }

    if (search) {
      const escaped = escapeRegex(search);
      mongoFilter.$or = [
        { name: { $regex: new RegExp(escaped, 'i') } },
        { 'address.city': { $regex: new RegExp(escaped, 'i') } },
        { 'address.area': { $regex: new RegExp(escaped, 'i') } },
      ];
    }

    const total = await RestStop.countDocuments(mongoFilter);
    const docs = await RestStop.find(mongoFilter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    sendSuccess(res, {
      items: docs.map(formatAdminRestStop),
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

    let items = Array.from(mockRestStopStore.values()).filter(
      (s) => s.merchantId === callerMerchantId
    );

    if (status && Object.values(RestStopStatus).includes(status)) {
      items = items.filter((s) => s.status === status);
    }

    if (search) {
      const lower = search.toLowerCase();
      items = items.filter(
        (s) =>
          s.name.toLowerCase().includes(lower) ||
          s.address.city.toLowerCase().includes(lower) ||
          s.address.area.toLowerCase().includes(lower)
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
      items: paginated.map(formatAdminRestStop),
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
 * GET /api/v1/merchant/rest-stops/:id
 * Authenticated merchant endpoint to retrieve an owned rest stop detail.
 */
export async function getMerchantRestStopByIdHandler(
  req: Request,
  res: Response
): Promise<void> {
  if (!req.user) {
    throw new ForbiddenError('Authentication required');
  }

  const user = req.user as any;
  const callerMerchantId = user._id ? user._id.toString() : user.id ? user.id.toString() : '';
  const rawId = req.params.id;
  const restStopId = (typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? rawId[0] : '').trim();

  if (!restStopId) {
    throw new BadRequestError('Rest stop ID is required');
  }

  if (isDatabaseConnected()) {
    if (!Types.ObjectId.isValid(restStopId)) {
      throw new BadRequestError('Invalid rest stop ID format');
    }

    const doc = await RestStop.findById(restStopId);
    if (!doc) {
      throw new NotFoundError(`Rest stop with ID '${restStopId}' was not found.`);
    }

    if (doc.merchantId.toString() !== callerMerchantId) {
      throw new ForbiddenError('You do not have permission to view this rest stop.');
    }

    sendSuccess(res, formatAdminRestStop(doc));
  } else {
    if (config.NODE_ENV === 'production') {
      throw new AppError('Database service unavailable.', 503);
    }

    const item = mockRestStopStore.get(restStopId);
    if (!item) {
      throw new NotFoundError(`Rest stop with ID '${restStopId}' was not found.`);
    }

    if (item.merchantId !== callerMerchantId) {
      throw new ForbiddenError('You do not have permission to view this rest stop.');
    }

    sendSuccess(res, formatAdminRestStop(item));
  }
}

