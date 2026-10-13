import { Request, Response } from 'express';
import mongoose, { Types } from 'mongoose';
import {
  JobStatus,
  JobCategory,
  RestStopStatus,
  CreateJobRequest,
  UpdateJobRequest,
  AdminUpdateJobStatus,
  JobQuery,
  AdminJobQuery,
  MerchantJobQuery,
  JobApplicationStatus,
} from 'shared-types';
import { Job } from '../models/Job';
import { JobApplication } from '../models/JobApplication';
import { RestStop } from '../models/RestStop';
import { isDatabaseConnected } from '../config/database';
import { config } from '../config/env';
import { formatPublicJob, formatAdminJob, formatMerchantJob } from '../utils/job';
import { sendSuccess } from '../utils/response';
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  AppError,
} from '../utils/errors';
import { mockJobStore, MockJobItem } from './jobMockStore';
import { mockRestStopStore } from './restStopMockStore';
import { mockJobApplicationStore } from './jobApplicationMockStore';
import { recordAuditLog } from '../utils/audit';

/**
 * Escapes regex special characters to prevent ReDoS or unintended query matching.
 */
function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * GET /api/v1/jobs
 * Public discovery endpoint. Lists open, discoverable micro-jobs linked to active rest stops.
 */
export async function getPublicJobsHandler(req: Request, res: Response): Promise<void> {
  const query = req.query as unknown as JobQuery;
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));
  const skip = (page - 1) * limit;

  const search = query.search?.trim();
  const category = query.category;
  const restStopId = query.restStopId?.trim();
  const payType = query.payType;
  const minPay = query.minPay ? Number(query.minPay) : undefined;
  const sort = query.sort || 'newest';

  const now = new Date();

  if (isDatabaseConnected()) {
    // 1. Identify active rest stops eligible for public job discovery
    let targetRestStopIds: Types.ObjectId[] = [];
    const restStopNameMap = new Map<string, string>();

    if (restStopId) {
      if (!Types.ObjectId.isValid(restStopId)) {
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

    // 2. Build Mongo filter: only open, unfilled, non-expired jobs on active rest stops
    const mongoFilter: Record<string, any> = {
      status: JobStatus.OPEN,
      endTime: { $gt: now },
      restStopId: { $in: targetRestStopIds },
      $expr: { $lt: ['$acceptedRidersCount', '$requiredRiders'] },
    };

    if (category) {
      mongoFilter.category = category;
    }
    if (payType) {
      mongoFilter.payType = payType;
    }
    if (minPay !== undefined && minPay > 0) {
      mongoFilter.payAmount = { $gte: minPay };
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
      pay_desc: { payAmount: -1 },
      pay_asc: { payAmount: 1 },
      duration_asc: { durationMinutes: 1 },
    };
    const sortOption = sortMap[sort] || sortMap.newest;

    const total = await Job.countDocuments(mongoFilter);
    const docs = await Job.find(mongoFilter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .populate('restStopId', 'name');

    sendSuccess(res, {
      items: docs.map((doc) =>
        formatPublicJob(doc, restStopNameMap.get(doc.restStopId?.toString()))
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

    // Offline mock evaluation
    let items = Array.from(mockJobStore.values()).filter((job) => {
      // 1. Must be open
      if (job.status !== JobStatus.OPEN) return false;
      // 2. End time must be in the future
      if (new Date(job.endTime) <= now) return false;
      // 3. Must not be full
      if (job.acceptedRidersCount >= job.requiredRiders) return false;
      // 4. Associated rest stop must be approved and active
      const restStop = mockRestStopStore.get(job.restStopId);
      if (!restStop || restStop.status !== RestStopStatus.ACTIVE) return false;

      return true;
    });

    if (restStopId) {
      items = items.filter((j) => j.restStopId === restStopId);
    }
    if (category) {
      items = items.filter((j) => j.category === category);
    }
    if (payType) {
      items = items.filter((j) => j.payType === payType);
    }
    if (minPay !== undefined && minPay > 0) {
      items = items.filter((j) => j.payAmount >= minPay);
    }
    if (search) {
      const searchLower = search.toLowerCase();
      items = items.filter(
        (j) =>
          j.title.toLowerCase().includes(searchLower) ||
          j.description.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    if (sort === 'oldest') {
      items.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    } else if (sort === 'pay_desc') {
      items.sort((a, b) => b.payAmount - a.payAmount);
    } else if (sort === 'pay_asc') {
      items.sort((a, b) => a.payAmount - b.payAmount);
    } else if (sort === 'duration_asc') {
      items.sort((a, b) => a.durationMinutes - b.durationMinutes);
    } else {
      // newest
      items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    const total = items.length;
    const paginated = items.slice(skip, skip + limit);

    sendSuccess(res, {
      items: paginated.map((j) => {
        const rs = mockRestStopStore.get(j.restStopId);
        return formatPublicJob(j, rs?.name);
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
 * GET /api/v1/jobs/:id
 * Public job detail endpoint. Returns safe DTO only if job and associated rest stop are active/discoverable.
 */
export async function getPublicJobByIdHandler(req: Request, res: Response): Promise<void> {
  const rawId = req.params.id;
  const jobId = (typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? rawId[0] : '').trim();

  if (!jobId) {
    throw new BadRequestError('Job ID is required');
  }

  const now = new Date();

  if (isDatabaseConnected()) {
    if (!Types.ObjectId.isValid(jobId)) {
      throw new BadRequestError('Invalid job ID format');
    }

    const doc = await Job.findById(jobId).populate('restStopId', 'name status');
    if (!doc) {
      throw new NotFoundError(`Job with ID '${jobId}' was not found.`);
    }

    const populatedStop = doc.restStopId as any;
    const isRestStopActive = populatedStop && populatedStop.status === RestStopStatus.ACTIVE;
    const isOpen = doc.status === JobStatus.OPEN;
    const isNotExpired = doc.endTime > now;
    const hasCapacity = doc.acceptedRidersCount < doc.requiredRiders;

    if (!isOpen || !isRestStopActive || !isNotExpired || !hasCapacity) {
      throw new NotFoundError(`Job with ID '${jobId}' is not open or is no longer available.`);
    }

    sendSuccess(res, formatPublicJob(doc, populatedStop?.name));
  } else {
    if (config.NODE_ENV === 'production') {
      throw new AppError('Database service unavailable.', 503);
    }

    const item = mockJobStore.get(jobId);
    if (!item) {
      throw new NotFoundError(`Job with ID '${jobId}' was not found.`);
    }

    const restStop = mockRestStopStore.get(item.restStopId);
    const isRestStopActive = restStop && restStop.status === RestStopStatus.ACTIVE;
    const isOpen = item.status === JobStatus.OPEN;
    const isNotExpired = new Date(item.endTime) > now;
    const hasCapacity = item.acceptedRidersCount < item.requiredRiders;

    if (!isOpen || !isRestStopActive || !isNotExpired || !hasCapacity) {
      throw new NotFoundError(`Job with ID '${jobId}' is not open or is no longer available.`);
    }

    sendSuccess(res, formatPublicJob(item, restStop?.name));
  }
}

/**
 * POST /api/v1/jobs
 * Authenticated merchant endpoint to create a micro-job.
 * Derives merchantId from server session; confirms restStop ownership and active status.
 */
export async function createMerchantJobHandler(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new ForbiddenError('Authentication required');
  }

  const user = req.user as any;
  const merchantId = user._id ? user._id.toString() : user.id ? user.id.toString() : '';
  const body = req.body as CreateJobRequest;

  const now = new Date();
  const startTime = new Date(body.startTime);
  const endTime = new Date(body.endTime);

  if (endTime <= startTime) {
    throw new BadRequestError('Job end time must be after start time.');
  }
  if (endTime <= now) {
    throw new BadRequestError('Job end time cannot be in the past.');
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
        'You do not own this rest stop. Merchants can only create micro-jobs for their own rest stops.'
      );
    }

    // Enforce active rest stop requirement
    if (restStop.status !== RestStopStatus.ACTIVE) {
      throw new BadRequestError(
        'Cannot post micro-jobs for a rest stop that is not approved and active.'
      );
    }

    const newJob = new Job({
      merchantId: new Types.ObjectId(merchantId),
      restStopId: restStop._id,
      title: body.title,
      description: body.description,
      category: body.category,
      payAmount: body.payAmount,
      payType: body.payType,
      durationMinutes: body.durationMinutes,
      startTime,
      endTime,
      requiredRiders: body.requiredRiders || 1,
      acceptedRidersCount: 0,
      status: JobStatus.OPEN,
      instructions: body.instructions,
    });

    await newJob.save();

    sendSuccess(
      res,
      formatAdminJob(newJob, restStop.name),
      201,
      'Micro-job posted successfully.'
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
        'You do not own this rest stop. Merchants can only create micro-jobs for their own rest stops.'
      );
    }

    if (restStop.status !== RestStopStatus.ACTIVE) {
      throw new BadRequestError(
        'Cannot post micro-jobs for a rest stop that is not approved and active.'
      );
    }

    const mockId = `mock-job-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const mockItem: MockJobItem = {
      _id: mockId,
      id: mockId,
      merchantId,
      restStopId: body.restStopId,
      title: body.title,
      description: body.description,
      category: body.category,
      payAmount: body.payAmount,
      payType: body.payType,
      durationMinutes: body.durationMinutes,
      startTime,
      endTime,
      requiredRiders: body.requiredRiders || 1,
      acceptedRidersCount: 0,
      status: JobStatus.OPEN,
      instructions: body.instructions,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockJobStore.set(mockId, mockItem);

    sendSuccess(
      res,
      formatAdminJob(mockItem, restStop.name),
      201,
      'Micro-job posted successfully.'
    );
  }
}

/**
 * PATCH /api/v1/jobs/:id
 * Authenticated merchant endpoint to update their own micro-job.
 * Enforces server-side ownership and validates schedule and status transitions.
 */
export async function updateMerchantJobHandler(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new ForbiddenError('Authentication required');
  }

  const rawId = req.params.id;
  const jobId = (typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? rawId[0] : '').trim();
  const user = req.user as any;
  const callerMerchantId = user._id ? user._id.toString() : user.id ? user.id.toString() : '';
  const updates = req.body as UpdateJobRequest;

  if (!jobId) {
    throw new BadRequestError('Job ID is required');
  }

  const now = new Date();

  if (isDatabaseConnected()) {
    if (!Types.ObjectId.isValid(jobId)) {
      throw new BadRequestError('Invalid job ID format');
    }

    const doc = await Job.findById(jobId);
    if (!doc) {
      throw new NotFoundError(`Job with ID '${jobId}' was not found.`);
    }

    // Verify ownership
    if (doc.merchantId.toString() !== callerMerchantId) {
      throw new ForbiddenError('You do not have permission to modify this micro-job.');
    }

    // Completed jobs cannot be altered
    if (doc.status === JobStatus.COMPLETED) {
      throw new BadRequestError('Cannot modify a job that has already been completed.');
    }

    // Date consistency check
    const effectiveStartTime = updates.startTime ? new Date(updates.startTime) : doc.startTime;
    const effectiveEndTime = updates.endTime ? new Date(updates.endTime) : doc.endTime;
    if (effectiveEndTime <= effectiveStartTime) {
      throw new BadRequestError('Job end time must be after start time.');
    }

    // Check: Cannot reduce required riders below already accepted riders count
    if (updates.requiredRiders !== undefined && updates.requiredRiders < doc.acceptedRidersCount) {
      throw new BadRequestError(
        `Cannot reduce required riders to ${updates.requiredRiders}. There are already ${doc.acceptedRidersCount} accepted riders.`
      );
    }

    // Check: Cannot set to OPEN if end time is in the past
    if (updates.status === JobStatus.OPEN && effectiveEndTime.getTime() <= now.getTime()) {
      throw new BadRequestError('Cannot open or reopen a job whose end time is in the past.');
    }

    // Allowlisted field assignments
    if (updates.title !== undefined) doc.title = updates.title;
    if (updates.description !== undefined) doc.description = updates.description;
    if (updates.category !== undefined) doc.category = updates.category;
    if (updates.payAmount !== undefined) doc.payAmount = updates.payAmount;
    if (updates.payType !== undefined) doc.payType = updates.payType;
    if (updates.durationMinutes !== undefined) doc.durationMinutes = updates.durationMinutes;
    if (updates.startTime !== undefined) doc.startTime = new Date(updates.startTime);
    if (updates.endTime !== undefined) doc.endTime = new Date(updates.endTime);
    if (updates.requiredRiders !== undefined) doc.requiredRiders = updates.requiredRiders;
    if (updates.instructions !== undefined) doc.instructions = updates.instructions;
    if (updates.status !== undefined) doc.status = updates.status;

    await doc.save();

    sendSuccess(res, formatAdminJob(doc), 200, 'Micro-job updated successfully.');
  } else {
    if (config.NODE_ENV === 'production') {
      throw new AppError('Database service unavailable.', 503);
    }

    const item = mockJobStore.get(jobId);
    if (!item) {
      throw new NotFoundError(`Job with ID '${jobId}' was not found.`);
    }

    if (item.merchantId !== callerMerchantId) {
      throw new ForbiddenError('You do not have permission to modify this micro-job.');
    }

    if (item.status === JobStatus.COMPLETED) {
      throw new BadRequestError('Cannot modify a job that has already been completed.');
    }

    const effectiveStartTime = updates.startTime ? new Date(updates.startTime) : item.startTime;
    const effectiveEndTime = updates.endTime ? new Date(updates.endTime) : item.endTime;
    if (effectiveEndTime <= effectiveStartTime) {
      throw new BadRequestError('Job end time must be after start time.');
    }

    // Check: Cannot reduce required riders below already accepted riders count
    if (updates.requiredRiders !== undefined && updates.requiredRiders < item.acceptedRidersCount) {
      throw new BadRequestError(
        `Cannot reduce required riders to ${updates.requiredRiders}. There are already ${item.acceptedRidersCount} accepted riders.`
      );
    }

    // Check: Cannot set to OPEN if end time is in the past
    if (updates.status === JobStatus.OPEN && effectiveEndTime.getTime() <= now.getTime()) {
      throw new BadRequestError('Cannot open or reopen a job whose end time is in the past.');
    }

    if (updates.title !== undefined) item.title = updates.title;
    if (updates.description !== undefined) item.description = updates.description;
    if (updates.category !== undefined) item.category = updates.category;
    if (updates.payAmount !== undefined) item.payAmount = updates.payAmount;
    if (updates.payType !== undefined) item.payType = updates.payType;
    if (updates.durationMinutes !== undefined) item.durationMinutes = updates.durationMinutes;
    if (updates.startTime !== undefined) item.startTime = new Date(updates.startTime);
    if (updates.endTime !== undefined) item.endTime = new Date(updates.endTime);
    if (updates.requiredRiders !== undefined) item.requiredRiders = updates.requiredRiders;
    if (updates.instructions !== undefined) item.instructions = updates.instructions;
    if (updates.status !== undefined) item.status = updates.status;
    item.updatedAt = new Date();

    sendSuccess(res, formatAdminJob(item), 200, 'Micro-job updated successfully.');
  }
}

/**
 * GET /api/v1/admin/jobs
 * Admin listing endpoint. Returns jobs of any status across all merchants with administrative metadata.
 */
export async function getAdminJobsHandler(req: Request, res: Response): Promise<void> {
  const query = req.query as unknown as AdminJobQuery;
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));
  const skip = (page - 1) * limit;

  const search = query.search?.trim();
  const category = query.category;
  const status = query.status;
  const merchantId = query.merchantId?.trim();
  const restStopId = query.restStopId?.trim();

  if (isDatabaseConnected()) {
    const mongoFilter: Record<string, any> = {};

    if (status) mongoFilter.status = status;
    if (category) mongoFilter.category = category;
    if (merchantId && Types.ObjectId.isValid(merchantId)) {
      mongoFilter.merchantId = new Types.ObjectId(merchantId);
    }
    if (restStopId && Types.ObjectId.isValid(restStopId)) {
      mongoFilter.restStopId = new Types.ObjectId(restStopId);
    }

    if (search) {
      const escaped = escapeRegex(search);
      mongoFilter.$or = [
        { title: { $regex: new RegExp(escaped, 'i') } },
        { description: { $regex: new RegExp(escaped, 'i') } },
      ];
    }

    const total = await Job.countDocuments(mongoFilter);
    const docs = await Job.find(mongoFilter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('restStopId', 'name');

    sendSuccess(res, {
      items: docs.map((doc) => formatAdminJob(doc, (doc.restStopId as any)?.name)),
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

    let items = Array.from(mockJobStore.values());

    if (status) items = items.filter((j) => j.status === status);
    if (category) items = items.filter((j) => j.category === category);
    if (merchantId) items = items.filter((j) => j.merchantId === merchantId);
    if (restStopId) items = items.filter((j) => j.restStopId === restStopId);

    if (search) {
      const searchLower = search.toLowerCase();
      items = items.filter(
        (j) =>
          j.title.toLowerCase().includes(searchLower) ||
          j.description.toLowerCase().includes(searchLower)
      );
    }

    items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const total = items.length;
    const paginated = items.slice(skip, skip + limit);

    sendSuccess(res, {
      items: paginated.map((j) => {
        const rs = mockRestStopStore.get(j.restStopId);
        return formatAdminJob(j, rs?.name);
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
 * PATCH /api/v1/admin/jobs/:id/status
 * Admin moderation endpoint to update job status.
 */
export async function updateAdminJobStatusHandler(req: Request, res: Response): Promise<void> {
  const rawId = req.params.id;
  const jobId = (typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? rawId[0] : '').trim();
  const body = req.body as AdminUpdateJobStatus;

  if (!jobId) {
    throw new BadRequestError('Job ID is required');
  }

  const adminUser = (req as any).user;
  const adminId = adminUser?.userId || adminUser?.id || 'admin';
  const adminName = adminUser?.name || 'Admin';

  if (isDatabaseConnected()) {
    if (!Types.ObjectId.isValid(jobId)) {
      throw new BadRequestError('Invalid job ID format');
    }

    const doc = await Job.findById(jobId);
    if (!doc) {
      throw new NotFoundError(`Job with ID '${jobId}' was not found.`);
    }

    const prevStatus = doc.status;
    doc.status = body.status;
    await doc.save();

    await recordAuditLog({
      adminId,
      adminName,
      action: 'job_moderation',
      targetType: 'job',
      targetId: jobId,
      targetName: doc.title,
      prevStatus,
      newStatus: body.status,
      reason: body.reason,
    });

    sendSuccess(
      res,
      formatAdminJob(doc),
      200,
      `Job status updated to '${body.status}'.`
    );
  } else {
    if (config.NODE_ENV === 'production') {
      throw new AppError('Database service unavailable.', 503);
    }

    const item = mockJobStore.get(jobId);
    if (!item) {
      throw new NotFoundError(`Job with ID '${jobId}' was not found.`);
    }

    const prevStatus = item.status;
    item.status = body.status;
    item.updatedAt = new Date();

    await recordAuditLog({
      adminId,
      adminName,
      action: 'job_moderation',
      targetType: 'job',
      targetId: jobId,
      targetName: item.title,
      prevStatus,
      newStatus: body.status,
      reason: body.reason,
    });

    sendSuccess(
      res,
      formatAdminJob(item),
      200,
      `Job status updated to '${body.status}'.`
    );
  }
}

/**
 * GET /api/v1/merchant/jobs
 * Authenticated merchant endpoint to list micro-jobs owned exclusively by the caller.
 * Supports operational status filter ('all', 'open', 'in_progress', 'completed', 'cancelled'),
 * category, associated rest stop, and keyword search.
 */
export async function getMerchantJobsHandler(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new ForbiddenError('Authentication required');
  }

  const user = req.user as any;
  const callerMerchantId = user._id ? user._id.toString() : user.id ? user.id.toString() : '';
  const query = req.query as unknown as MerchantJobQuery;

  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));
  const skip = (page - 1) * limit;

  const search = query.search?.trim();
  const restStopId = query.restStopId?.trim();
  const status = query.status;
  const category = query.category;

  if (isDatabaseConnected()) {
    const mongoFilter: Record<string, any> = {
      merchantId: new Types.ObjectId(callerMerchantId),
    };

    if (restStopId && Types.ObjectId.isValid(restStopId)) {
      mongoFilter.restStopId = new Types.ObjectId(restStopId);
    }

    if (status && status !== 'all') {
      mongoFilter.status = status;
    }

    if (category) {
      mongoFilter.category = category;
    }

    if (search) {
      const escaped = escapeRegex(search);
      mongoFilter.$or = [
        { title: { $regex: new RegExp(escaped, 'i') } },
        { description: { $regex: new RegExp(escaped, 'i') } },
        { instructions: { $regex: new RegExp(escaped, 'i') } },
      ];
    }

    const total = await Job.countDocuments(mongoFilter);
    const docs = await Job.find(mongoFilter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('restStopId', 'name');

    // Aggregate application counts for these jobs
    const jobIds = docs.map((d) => d._id);
    const appCounts = await JobApplication.aggregate([
      { $match: { jobId: { $in: jobIds } } },
      {
        $group: {
          _id: '$jobId',
          total: { $sum: 1 },
          pending: {
            $sum: {
              $cond: [{ $eq: ['$status', JobApplicationStatus.PENDING] }, 1, 0],
            },
          },
        },
      },
    ]);

    const countMap = new Map<string, { total: number; pending: number }>();
    for (const item of appCounts) {
      countMap.set(item._id.toString(), { total: item.total, pending: item.pending });
    }

    sendSuccess(res, {
      items: docs.map((d) => {
        const counts = countMap.get(d._id.toString()) || { total: 0, pending: 0 };
        return formatMerchantJob(
          d,
          (d.restStopId as any)?.name,
          counts.total,
          counts.pending
        );
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
  } else {
    if (config.NODE_ENV === 'production') {
      throw new AppError('Database service unavailable.', 503);
    }

    let items = Array.from(mockJobStore.values()).filter(
      (j) => j.merchantId === callerMerchantId
    );

    if (restStopId) {
      items = items.filter((j) => j.restStopId === restStopId);
    }

    if (status && status !== 'all') {
      items = items.filter((j) => j.status === status);
    }

    if (category) {
      items = items.filter((j) => j.category === category);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      items = items.filter(
        (j) =>
          j.title.toLowerCase().includes(searchLower) ||
          j.description.toLowerCase().includes(searchLower) ||
          j.instructions.toLowerCase().includes(searchLower)
      );
    }

    items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const total = items.length;
    const paginated = items.slice(skip, skip + limit);

    sendSuccess(res, {
      items: paginated.map((j) => {
        const rs = mockRestStopStore.get(j.restStopId);
        let appCount = 0;
        let pendingCount = 0;
        for (const app of mockJobApplicationStore.values()) {
          if (app.jobId === j._id || app.jobId === j.id) {
            appCount++;
            if (app.status === JobApplicationStatus.PENDING) pendingCount++;
          }
        }
        return formatMerchantJob(j, rs?.name, appCount, pendingCount);
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
 * GET /api/v1/merchant/jobs/:id
 * Authenticated merchant endpoint to fetch a single owned micro-job by ID.
 * Returns HTTP 403 Forbidden on ownership mismatches.
 */
export async function getMerchantJobByIdHandler(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new ForbiddenError('Authentication required');
  }

  const rawId = req.params.id;
  const jobId = (typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? rawId[0] : '').trim();
  const user = req.user as any;
  const callerMerchantId = user._id ? user._id.toString() : user.id ? user.id.toString() : '';

  if (!jobId) {
    throw new BadRequestError('Job ID is required');
  }

  if (isDatabaseConnected()) {
    if (!Types.ObjectId.isValid(jobId)) {
      throw new BadRequestError('Invalid job ID format');
    }

    const doc = await Job.findById(jobId).populate('restStopId', 'name');
    if (!doc) {
      throw new NotFoundError(`Job with ID '${jobId}' was not found.`);
    }

    if (doc.merchantId.toString() !== callerMerchantId) {
      throw new ForbiddenError('You do not have permission to access this micro-job.');
    }

    const appCount = await JobApplication.countDocuments({ jobId: doc._id });
    const pendingCount = await JobApplication.countDocuments({
      jobId: doc._id,
      status: JobApplicationStatus.PENDING,
    });

    sendSuccess(
      res,
      formatMerchantJob(doc, (doc.restStopId as any)?.name, appCount, pendingCount)
    );
  } else {
    if (config.NODE_ENV === 'production') {
      throw new AppError('Database service unavailable.', 503);
    }

    const item = mockJobStore.get(jobId);
    if (!item) {
      throw new NotFoundError(`Job with ID '${jobId}' was not found.`);
    }

    if (item.merchantId !== callerMerchantId) {
      throw new ForbiddenError('You do not have permission to access this micro-job.');
    }

    const rs = mockRestStopStore.get(item.restStopId);
    let appCount = 0;
    let pendingCount = 0;
    for (const app of mockJobApplicationStore.values()) {
      if (app.jobId === item._id || app.jobId === item.id) {
        appCount++;
        if (app.status === JobApplicationStatus.PENDING) pendingCount++;
      }
    }

    sendSuccess(res, formatMerchantJob(item, rs?.name, appCount, pendingCount));
  }
}

