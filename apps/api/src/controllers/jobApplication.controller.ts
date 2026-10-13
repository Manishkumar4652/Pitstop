import { Request, Response } from 'express';
import { Types } from 'mongoose';
import {
  JobStatus,
  JobApplicationStatus,
  RestStopStatus,
  ApplyJobRequest,
  RiderJobApplicationQuery,
  MerchantJobApplicantsQuery,
  UpdateJobApplicationStatus,
} from 'shared-types';
import { Job } from '../models/Job';
import { JobApplication } from '../models/JobApplication';
import { RestStop } from '../models/RestStop';
import { User } from '../models/User';
import { isDatabaseConnected } from '../config/database';
import { config } from '../config/env';
import { formatJobApplication, formatRiderJobApplication } from '../utils/job';
import { sendSuccess } from '../utils/response';
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
  AppError,
} from '../utils/errors';
import { mockJobStore } from './jobMockStore';
import { mockRestStopStore } from './restStopMockStore';
import {
  mockJobApplicationStore,
  MockJobApplicationItem,
} from './jobApplicationMockStore';

/**
 * POST /api/v1/jobs/:id/apply
 * Authenticated rider applies for an open, unexpired micro-job with available capacity.
 * Maps duplicate applications to HTTP 409 Conflict.
 */
export async function applyJobHandler(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new ForbiddenError('Authentication required');
  }

  const rawId = req.params.id;
  const jobId = (typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? rawId[0] : '').trim();
  const user = req.user as any;
  const callerRiderId = user._id ? user._id.toString() : user.id ? user.id.toString() : '';

  if (!jobId) {
    throw new BadRequestError('Job ID is required');
  }

  const body = (req.body || {}) as ApplyJobRequest;
  const notes = body.notes?.trim();

  const now = new Date();

  if (isDatabaseConnected()) {
    if (!Types.ObjectId.isValid(jobId)) {
      throw new BadRequestError('Invalid job ID format');
    }

    const job = await Job.findById(jobId);
    if (!job) {
      throw new NotFoundError(`Job with ID '${jobId}' was not found.`);
    }

    // Eligibility check 1: Status must be OPEN
    if (job.status !== JobStatus.OPEN) {
      throw new BadRequestError('This micro-job is not open for applications.');
    }

    // Eligibility check 2: Must not have passed end time
    if (new Date(job.endTime).getTime() <= now.getTime()) {
      throw new BadRequestError('This micro-job has already expired.');
    }

    // Eligibility check 3: Must have remaining capacity
    if (job.acceptedRidersCount >= job.requiredRiders) {
      throw new BadRequestError('This micro-job has already reached full capacity.');
    }

    // Eligibility check 4: Associated rest stop must be active
    const restStop = await RestStop.findById(job.restStopId).lean();
    if (!restStop || restStop.status !== RestStopStatus.ACTIVE) {
      throw new BadRequestError('Applications are only accepted for jobs at active rest stops.');
    }

    // Persist application with database duplicate prevention
    try {
      const application = await JobApplication.create({
        jobId: job._id,
        riderId: new Types.ObjectId(callerRiderId),
        merchantId: job.merchantId,
        status: JobApplicationStatus.PENDING,
        notes: notes || undefined,
      });

      sendSuccess(res, formatJobApplication(application), 201);
    } catch (err: any) {
      if (err.code === 11000 || (err.name === 'MongoServerError' && err.code === 11000)) {
        throw new ConflictError('You have already applied for this micro-job.');
      }
      throw err;
    }
  } else {
    if (config.NODE_ENV === 'production') {
      throw new AppError('Database service unavailable.', 503);
    }

    const job = mockJobStore.get(jobId);
    if (!job) {
      throw new NotFoundError(`Job with ID '${jobId}' was not found.`);
    }

    if (job.status !== JobStatus.OPEN) {
      throw new BadRequestError('This micro-job is not open for applications.');
    }

    if (new Date(job.endTime).getTime() <= now.getTime()) {
      throw new BadRequestError('This micro-job has already expired.');
    }

    if (job.acceptedRidersCount >= job.requiredRiders) {
      throw new BadRequestError('This micro-job has already reached full capacity.');
    }

    const restStop = mockRestStopStore.get(job.restStopId);
    if (!restStop || restStop.status !== RestStopStatus.ACTIVE) {
      throw new BadRequestError('Applications are only accepted for jobs at active rest stops.');
    }

    // Check duplicate in mock store
    for (const existing of mockJobApplicationStore.values()) {
      if (
        (existing.jobId === job._id || existing.jobId === job.id) &&
        existing.riderId === callerRiderId
      ) {
        throw new ConflictError('You have already applied for this micro-job.');
      }
    }

    const appId = `mock-app-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const mockApp: MockJobApplicationItem = {
      _id: appId,
      id: appId,
      jobId: job._id || job.id,
      riderId: callerRiderId,
      merchantId: job.merchantId,
      status: JobApplicationStatus.PENDING,
      notes: notes || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockJobApplicationStore.set(appId, mockApp);
    sendSuccess(res, formatJobApplication(mockApp), 201);
  }
}

/**
 * GET /api/v1/rider/applications
 * Authenticated rider views their own applications with pagination and status filters.
 */
export async function getRiderApplicationsHandler(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new ForbiddenError('Authentication required');
  }

  const user = req.user as any;
  const callerRiderId = user._id ? user._id.toString() : user.id ? user.id.toString() : '';

  const query = req.query as unknown as RiderJobApplicationQuery;
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));
  const skip = (page - 1) * limit;
  const status = query.status || 'all';

  if (isDatabaseConnected()) {
    const mongoFilter: Record<string, any> = {
      riderId: new Types.ObjectId(callerRiderId),
    };

    if (status && status !== 'all') {
      mongoFilter.status = status;
    }

    const total = await JobApplication.countDocuments(mongoFilter);
    const docs = await JobApplication.find(mongoFilter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'jobId',
        select: 'title payAmount payType durationMinutes startTime endTime instructions restStopId',
        populate: {
          path: 'restStopId',
          select: 'name',
        },
      })
      .lean();

    const items = docs.map((doc) => {
      const job = doc.jobId as any;
      const restStopName = job?.restStopId?.name;
      return formatRiderJobApplication(doc, {
        title: job?.title,
        restStopName,
        payAmount: job?.payAmount,
        payType: job?.payType,
        durationMinutes: job?.durationMinutes,
        startTime: job?.startTime,
        endTime: job?.endTime,
        instructions: job?.instructions,
      });
    });

    sendSuccess(res, {
      items,
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

    let items = Array.from(mockJobApplicationStore.values()).filter(
      (app) => app.riderId === callerRiderId
    );

    if (status && status !== 'all') {
      items = items.filter((app) => app.status === status);
    }

    items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const total = items.length;
    const paginated = items.slice(skip, skip + limit);

    const formatted = paginated.map((app) => {
      const job = mockJobStore.get(app.jobId);
      const restStop = job ? mockRestStopStore.get(job.restStopId) : undefined;
      return formatRiderJobApplication(app, {
        title: job?.title,
        restStopName: restStop?.name,
        payAmount: job?.payAmount,
        payType: job?.payType,
        durationMinutes: job?.durationMinutes,
        startTime: job?.startTime,
        endTime: job?.endTime,
        instructions: job?.instructions,
      });
    });

    sendSuccess(res, {
      items: formatted,
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
 * GET /api/v1/merchant/jobs/:id/applications
 * Authenticated merchant views applicants for an owned micro-job with pagination and status filters.
 * Returns HTTP 403 Forbidden on ownership mismatches.
 */
export async function getJobApplicantsHandler(req: Request, res: Response): Promise<void> {
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

  const query = req.query as unknown as MerchantJobApplicantsQuery;
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));
  const skip = (page - 1) * limit;
  const status = query.status || 'all';
  const sort = query.sort || 'newest';

  if (isDatabaseConnected()) {
    if (!Types.ObjectId.isValid(jobId)) {
      throw new BadRequestError('Invalid job ID format');
    }

    const job = await Job.findById(jobId).lean();
    if (!job) {
      throw new NotFoundError(`Job with ID '${jobId}' was not found.`);
    }

    if (job.merchantId.toString() !== callerMerchantId) {
      throw new ForbiddenError('You do not have permission to view applicants for this micro-job.');
    }

    const mongoFilter: Record<string, any> = {
      jobId: job._id,
    };

    if (status && status !== 'all') {
      mongoFilter.status = status;
    }

    const sortDir = sort === 'oldest' ? 1 : -1;
    const total = await JobApplication.countDocuments(mongoFilter);
    const docs = await JobApplication.find(mongoFilter)
      .sort({ createdAt: sortDir })
      .skip(skip)
      .limit(limit)
      .populate('riderId', 'name riderProfile.vehicleType')
      .lean();

    const items = docs.map((doc) => {
      const rider = doc.riderId as any;
      return formatJobApplication(doc, rider?.name, rider?.riderProfile?.vehicleType);
    });

    sendSuccess(res, {
      items,
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

    const job = mockJobStore.get(jobId);
    if (!job) {
      throw new NotFoundError(`Job with ID '${jobId}' was not found.`);
    }

    if (job.merchantId !== callerMerchantId) {
      throw new ForbiddenError('You do not have permission to view applicants for this micro-job.');
    }

    let items = Array.from(mockJobApplicationStore.values()).filter(
      (app) => app.jobId === job._id || app.jobId === job.id
    );

    if (status && status !== 'all') {
      items = items.filter((app) => app.status === status);
    }

    if (sort === 'oldest') {
      items.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    } else {
      items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    const total = items.length;
    const paginated = items.slice(skip, skip + limit);

    const formatted = paginated.map((app) =>
      formatJobApplication(app, app.riderName, app.vehicleType)
    );

    sendSuccess(res, {
      items: formatted,
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
 * PATCH /api/v1/merchant/applications/:id/status
 * Authenticated merchant accepts or rejects a pending application.
 * Enforces atomic capacity invariant: 0 <= acceptedRidersCount <= requiredRiders.
 */
export async function updateApplicationStatusHandler(
  req: Request,
  res: Response
): Promise<void> {
  if (!req.user) {
    throw new ForbiddenError('Authentication required');
  }

  const rawId = req.params.id;
  const appId = (typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? rawId[0] : '').trim();
  const user = req.user as any;
  const callerMerchantId = user._id ? user._id.toString() : user.id ? user.id.toString() : '';

  if (!appId) {
    throw new BadRequestError('Application ID is required');
  }

  const { status: targetStatus } = req.body as UpdateJobApplicationStatus;
  if (
    targetStatus !== JobApplicationStatus.ACCEPTED &&
    targetStatus !== JobApplicationStatus.REJECTED
  ) {
    throw new BadRequestError("Status must be either 'accepted' or 'rejected'");
  }

  const now = new Date();

  if (isDatabaseConnected()) {
    if (!Types.ObjectId.isValid(appId)) {
      throw new BadRequestError('Invalid application ID format');
    }

    // Step 1: Verify existence and merchant ownership
    const appDoc = await JobApplication.findById(appId);
    if (!appDoc) {
      throw new NotFoundError(`Application with ID '${appId}' was not found.`);
    }

    if (appDoc.merchantId.toString() !== callerMerchantId) {
      throw new ForbiddenError(
        'You do not have permission to modify this application.'
      );
    }

    // Permit transitions ONLY from PENDING
    if (appDoc.status !== JobApplicationStatus.PENDING) {
      throw new BadRequestError(
        `Application is already '${appDoc.status}' and cannot be transitioned to '${targetStatus}'.`
      );
    }

    // REJECTION BRANCH: Does not consume capacity
    if (targetStatus === JobApplicationStatus.REJECTED) {
      const updatedApp = await JobApplication.findOneAndUpdate(
        {
          _id: appDoc._id,
          merchantId: appDoc.merchantId,
          status: JobApplicationStatus.PENDING,
        },
        { $set: { status: JobApplicationStatus.REJECTED } },
        { returnDocument: 'after' }
      );

      if (!updatedApp) {
        throw new BadRequestError('Application is no longer pending and cannot be rejected.');
      }

      sendSuccess(res, formatJobApplication(updatedApp));
      return;
    }

    // ACCEPTANCE BRANCH: Atomic Capacity Enforcement
    // Check job preconditions prior to atomic write
    const job = await Job.findById(appDoc.jobId);
    if (!job) {
      throw new NotFoundError('Associated micro-job was not found.');
    }

    if (job.status !== JobStatus.OPEN) {
      throw new BadRequestError('Cannot accept application: micro-job is not open.');
    }

    if (new Date(job.endTime).getTime() <= now.getTime()) {
      throw new BadRequestError('Cannot accept application: micro-job has already expired.');
    }

    if (job.acceptedRidersCount >= job.requiredRiders) {
      throw new ConflictError(
        'Cannot accept application: micro-job has already reached full capacity.'
      );
    }

    // Two-Phase Atomic Conditional Update:
    // 1. Uniquely transition the application from PENDING to ACCEPTED
    const claimedApp = await JobApplication.findOneAndUpdate(
      {
        _id: appDoc._id,
        merchantId: appDoc.merchantId,
        status: JobApplicationStatus.PENDING,
      },
      { $set: { status: JobApplicationStatus.ACCEPTED } },
      { returnDocument: 'after' }
    );

    if (!claimedApp) {
      throw new BadRequestError(
        'Application is no longer pending and cannot be accepted.'
      );
    }

    // 2. Atomically reserve slot on the Job document
    const updatedJob = await Job.findOneAndUpdate(
      {
        _id: appDoc.jobId,
        merchantId: appDoc.merchantId,
        status: JobStatus.OPEN,
        endTime: { $gt: now },
        $expr: { $lt: ['$acceptedRidersCount', '$requiredRiders'] },
      },
      { $inc: { acceptedRidersCount: 1 } },
      { returnDocument: 'after' }
    );

    // 3. Compensation / Rollback if capacity reservation failed
    if (!updatedJob) {
      await JobApplication.findByIdAndUpdate(appDoc._id, {
        $set: { status: JobApplicationStatus.PENDING },
      });
      throw new ConflictError(
        'Cannot accept application: micro-job has reached full capacity or is no longer open.'
      );
    }

    sendSuccess(res, formatJobApplication(claimedApp));
  } else {
    if (config.NODE_ENV === 'production') {
      throw new AppError('Database service unavailable.', 503);
    }

    const app = mockJobApplicationStore.get(appId);
    if (!app) {
      throw new NotFoundError(`Application with ID '${appId}' was not found.`);
    }

    if (app.merchantId !== callerMerchantId) {
      throw new ForbiddenError(
        'You do not have permission to modify this application.'
      );
    }

    if (app.status !== JobApplicationStatus.PENDING) {
      throw new BadRequestError(
        `Application is already '${app.status}' and cannot be transitioned to '${targetStatus}'.`
      );
    }

    if (targetStatus === JobApplicationStatus.REJECTED) {
      app.status = JobApplicationStatus.REJECTED;
      app.updatedAt = new Date();
      sendSuccess(res, formatJobApplication(app, app.riderName, app.vehicleType));
      return;
    }

    // ACCEPTANCE in mock store
    const job = mockJobStore.get(app.jobId);
    if (!job) {
      throw new NotFoundError('Associated micro-job was not found.');
    }

    if (job.status !== JobStatus.OPEN) {
      throw new BadRequestError('Cannot accept application: micro-job is not open.');
    }

    if (new Date(job.endTime).getTime() <= now.getTime()) {
      throw new BadRequestError('Cannot accept application: micro-job has already expired.');
    }

    if (job.acceptedRidersCount >= job.requiredRiders) {
      throw new ConflictError(
        'Cannot accept application: micro-job has already reached full capacity.'
      );
    }

    job.acceptedRidersCount += 1;
    app.status = JobApplicationStatus.ACCEPTED;
    app.updatedAt = new Date();

    sendSuccess(res, formatJobApplication(app, app.riderName, app.vehicleType));
  }
}

/**
 * POST /api/v1/rider/applications/:id/withdraw
 * Authenticated rider withdraws their own pending application.
 * Only pending applications can be withdrawn. Does not mutate job capacity counter.
 */
export async function withdrawApplicationHandler(
  req: Request,
  res: Response
): Promise<void> {
  if (!req.user) {
    throw new ForbiddenError('Authentication required');
  }

  const rawId = req.params.id;
  const appId = (typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? rawId[0] : '').trim();
  const user = req.user as any;
  const callerRiderId = user._id ? user._id.toString() : user.id ? user.id.toString() : '';

  if (!appId) {
    throw new BadRequestError('Application ID is required');
  }

  if (isDatabaseConnected()) {
    if (!Types.ObjectId.isValid(appId)) {
      throw new BadRequestError('Invalid application ID format');
    }

    const app = await JobApplication.findById(appId);
    if (!app) {
      throw new NotFoundError(`Application with ID '${appId}' was not found.`);
    }

    if (app.riderId.toString() !== callerRiderId) {
      throw new ForbiddenError('You do not have permission to withdraw this application.');
    }

    if (app.status !== JobApplicationStatus.PENDING) {
      throw new BadRequestError(
        `Cannot withdraw an application that is already '${app.status}'.`
      );
    }

    const updated = await JobApplication.findOneAndUpdate(
      { _id: app._id, riderId: app.riderId, status: JobApplicationStatus.PENDING },
      { $set: { status: JobApplicationStatus.WITHDRAWN } },
      { returnDocument: 'after' }
    );

    if (!updated) {
      throw new BadRequestError('Application is no longer pending and cannot be withdrawn.');
    }

    sendSuccess(res, formatJobApplication(updated));
  } else {
    if (config.NODE_ENV === 'production') {
      throw new AppError('Database service unavailable.', 503);
    }

    const app = mockJobApplicationStore.get(appId);
    if (!app) {
      throw new NotFoundError(`Application with ID '${appId}' was not found.`);
    }

    if (app.riderId !== callerRiderId) {
      throw new ForbiddenError('You do not have permission to withdraw this application.');
    }

    if (app.status !== JobApplicationStatus.PENDING) {
      throw new BadRequestError(
        `Cannot withdraw an application that is already '${app.status}'.`
      );
    }

    app.status = JobApplicationStatus.WITHDRAWN;
    app.updatedAt = new Date();

    sendSuccess(res, formatJobApplication(app));
  }
}
