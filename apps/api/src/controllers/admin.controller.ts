import { Request, Response } from 'express';
import { Types } from 'mongoose';
import {
  UserRole,
  MerchantVerificationStatus,
  RestStopStatus,
  JobStatus,
  JobApplicationStatus,
  AdminMerchantQuery,
  AdminUpdateMerchantStatus,
  AdminAuditLogQuery,
} from 'shared-types';
import { User, IUserDocument } from '../models/User';
import { RestStop } from '../models/RestStop';
import { Deal } from '../models/Deal';
import { Job } from '../models/Job';
import { JobApplication } from '../models/JobApplication';
import { AuditLog } from '../models/AuditLog';
import { isDatabaseConnected } from '../config/database';
import { sendSuccess } from '../utils/response';
import { BadRequestError, NotFoundError, AppError } from '../utils/errors';
import { recordAuditLog } from '../utils/audit';
import { config } from '../config/env';

// Mock stores for offline testing
import { mockUserStore } from './auth.controller';
import { mockRestStopStore } from './restStopMockStore';
import { mockDealStore } from './dealMockStore';
import { mockJobStore } from './jobMockStore';
import { mockJobApplicationStore } from './jobApplicationMockStore';
import { mockAuditLogStore } from './auditLogMockStore';

function escapeRegex(text: string): string {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

/**
 * Formats a user entity into a safe admin merchant object.
 * Strips password hashes, auth secrets, and internal tokens.
 */
export function formatAdminMerchant(user: any): any {
  const profile = user.merchantProfile || {};
  const currentVerificationStatus: MerchantVerificationStatus =
    profile.verificationStatus ||
    (user.isVerified ? MerchantVerificationStatus.VERIFIED : MerchantVerificationStatus.PENDING_REVIEW);

  return {
    _id: String(user._id || user.id),
    id: String(user._id || user.id),
    name: user.name,
    phone: user.phone,
    email: user.email,
    role: user.role,
    isVerified: Boolean(user.isVerified),
    merchantProfile: {
      businessName: profile.businessName || '',
      businessType: profile.businessType || 'other',
      gstNumber: profile.gstNumber || profile.gstin,
      address: profile.address,
      verificationStatus: currentVerificationStatus,
      verificationReason: profile.verificationReason,
    },
    createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
    updatedAt: user.updatedAt instanceof Date ? user.updatedAt.toISOString() : user.updatedAt,
  };
}

/**
 * Formats an audit log document.
 */
export function formatAdminAuditLog(log: any): any {
  return {
    _id: String(log._id || log.id),
    id: String(log._id || log.id),
    adminId: log.adminId,
    adminName: log.adminName || 'Admin',
    action: log.action,
    targetType: log.targetType,
    targetId: log.targetId,
    targetName: log.targetName,
    prevStatus: log.prevStatus,
    newStatus: log.newStatus,
    reason: log.reason,
    createdAt: log.createdAt instanceof Date ? log.createdAt.toISOString() : log.createdAt,
    updatedAt: log.updatedAt instanceof Date ? log.updatedAt.toISOString() : log.updatedAt,
  };
}

/**
 * GET /api/v1/admin/stats
 * Aggregates live system-wide operational metrics backed by the database or active mock store.
 */
export async function getAdminStatsHandler(req: Request, res: Response): Promise<void> {
  if (isDatabaseConnected()) {
    const [
      riderCount,
      merchantCount,
      adminCount,
      pendingMerchantsCount,
      totalRestStops,
      activeRestStops,
      pendingRestStops,
      suspendedRestStops,
      totalDeals,
      activeDeals,
      inactiveDeals,
      totalJobs,
      openJobs,
      inProgressJobs,
      completedJobs,
      cancelledJobs,
      totalApplications,
      pendingApplications,
      acceptedApplications,
      rejectedApplications,
      withdrawnApplications,
      recentAuditDocs,
    ] = await Promise.all([
      User.countDocuments({ role: UserRole.RIDER }),
      User.countDocuments({ role: UserRole.MERCHANT }),
      User.countDocuments({ role: UserRole.ADMIN }),
      User.countDocuments({
        role: UserRole.MERCHANT,
        $or: [
          { 'merchantProfile.verificationStatus': MerchantVerificationStatus.PENDING_REVIEW },
          { isVerified: false, 'merchantProfile.verificationStatus': { $exists: false } },
        ],
      }),
      RestStop.countDocuments(),
      RestStop.countDocuments({ status: RestStopStatus.ACTIVE }),
      RestStop.countDocuments({ status: RestStopStatus.PENDING_APPROVAL }),
      RestStop.countDocuments({ status: RestStopStatus.SUSPENDED }),
      Deal.countDocuments(),
      Deal.countDocuments({ isActive: true }),
      Deal.countDocuments({ isActive: false }),
      Job.countDocuments(),
      Job.countDocuments({ status: JobStatus.OPEN }),
      Job.countDocuments({ status: JobStatus.IN_PROGRESS }),
      Job.countDocuments({ status: JobStatus.COMPLETED }),
      Job.countDocuments({ status: JobStatus.CANCELLED }),
      JobApplication.countDocuments(),
      JobApplication.countDocuments({ status: JobApplicationStatus.PENDING }),
      JobApplication.countDocuments({ status: JobApplicationStatus.ACCEPTED }),
      JobApplication.countDocuments({ status: JobApplicationStatus.REJECTED }),
      JobApplication.countDocuments({ status: JobApplicationStatus.WITHDRAWN }),
      AuditLog.find().sort({ createdAt: -1 }).limit(10).lean(),
    ]);

    const stats = {
      users: {
        total: riderCount + merchantCount + adminCount,
        riders: riderCount,
        merchants: merchantCount,
        admins: adminCount,
        pendingMerchants: pendingMerchantsCount,
      },
      restStops: {
        total: totalRestStops,
        active: activeRestStops,
        pending_approval: pendingRestStops,
        suspended: suspendedRestStops,
      },
      deals: {
        total: totalDeals,
        active: activeDeals,
        inactive: inactiveDeals,
      },
      jobs: {
        total: totalJobs,
        open: openJobs,
        in_progress: inProgressJobs,
        completed: completedJobs,
        cancelled: cancelledJobs,
      },
      applications: {
        total: totalApplications,
        pending: pendingApplications,
        accepted: acceptedApplications,
        rejected: rejectedApplications,
        withdrawn: withdrawnApplications,
      },
      recentActivity: recentAuditDocs.map(formatAdminAuditLog),
    };

    sendSuccess(res, stats);
  } else {
    if (config.NODE_ENV === 'production') {
      throw new AppError('Database service unavailable.', 503);
    }

    const allUsers = Array.from(mockUserStore.values());
    const riders = allUsers.filter((u) => u.role === UserRole.RIDER).length;
    const merchants = allUsers.filter((u) => u.role === UserRole.MERCHANT).length;
    const admins = allUsers.filter((u) => u.role === UserRole.ADMIN).length;
    const pendingMerchants = allUsers.filter(
      (u) =>
        u.role === UserRole.MERCHANT &&
        (u.merchantProfile?.verificationStatus === MerchantVerificationStatus.PENDING_REVIEW ||
          (!u.isVerified && !u.merchantProfile?.verificationStatus))
    ).length;

    const allRestStops = Array.from(mockRestStopStore.values());
    const activeRestStops = allRestStops.filter((r) => r.status === 'active').length;
    const pendingRestStops = allRestStops.filter((r) => r.status === 'pending_approval').length;
    const suspendedRestStops = allRestStops.filter((r) => r.status === 'suspended').length;

    const allDeals = Array.from(mockDealStore.values());
    const activeDeals = allDeals.filter((d) => d.isActive).length;
    const inactiveDeals = allDeals.filter((d) => !d.isActive).length;

    const allJobs = Array.from(mockJobStore.values());
    const openJobs = allJobs.filter((j) => j.status === 'open').length;
    const inProgressJobs = allJobs.filter((j) => j.status === 'in_progress').length;
    const completedJobs = allJobs.filter((j) => j.status === 'completed').length;
    const cancelledJobs = allJobs.filter((j) => j.status === 'cancelled').length;

    const allApps = Array.from(mockJobApplicationStore.values());
    const pendingApps = allApps.filter((a) => a.status === 'pending').length;
    const acceptedApps = allApps.filter((a) => a.status === 'accepted').length;
    const rejectedApps = allApps.filter((a) => a.status === 'rejected').length;
    const withdrawnApps = allApps.filter((a) => a.status === 'withdrawn').length;

    const allAudit = Array.from(mockAuditLogStore.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10);

    const stats = {
      users: {
        total: allUsers.length,
        riders,
        merchants,
        admins,
        pendingMerchants,
      },
      restStops: {
        total: allRestStops.length,
        active: activeRestStops,
        pending_approval: pendingRestStops,
        suspended: suspendedRestStops,
      },
      deals: {
        total: allDeals.length,
        active: activeDeals,
        inactive: inactiveDeals,
      },
      jobs: {
        total: allJobs.length,
        open: openJobs,
        in_progress: inProgressJobs,
        completed: completedJobs,
        cancelled: cancelledJobs,
      },
      applications: {
        total: allApps.length,
        pending: pendingApps,
        accepted: acceptedApps,
        rejected: rejectedApps,
        withdrawn: withdrawnApps,
      },
      recentActivity: allAudit.map(formatAdminAuditLog),
    };

    sendSuccess(res, stats);
  }
}

/**
 * GET /api/v1/admin/merchants
 * Lists merchants with pagination and filtering by verification status or keyword search.
 */
export async function getAdminMerchantsHandler(req: Request, res: Response): Promise<void> {
  const query = req.query as unknown as AdminMerchantQuery;
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));
  const skip = (page - 1) * limit;

  const status = query.status && query.status !== 'all' ? query.status : undefined;
  const search = query.search?.trim();

  if (isDatabaseConnected()) {
    const mongoFilter: Record<string, any> = {
      role: UserRole.MERCHANT,
    };

    if (status) {
      if (status === MerchantVerificationStatus.VERIFIED) {
        mongoFilter.$or = [
          { 'merchantProfile.verificationStatus': MerchantVerificationStatus.VERIFIED },
          { isVerified: true, 'merchantProfile.verificationStatus': { $exists: false } },
        ];
      } else if (status === MerchantVerificationStatus.PENDING_REVIEW) {
        mongoFilter.$or = [
          { 'merchantProfile.verificationStatus': MerchantVerificationStatus.PENDING_REVIEW },
          { isVerified: false, 'merchantProfile.verificationStatus': { $exists: false } },
        ];
      } else {
        mongoFilter['merchantProfile.verificationStatus'] = status;
      }
    }

    if (search) {
      const escaped = escapeRegex(search);
      const searchOr = [
        { name: { $regex: new RegExp(escaped, 'i') } },
        { email: { $regex: new RegExp(escaped, 'i') } },
        { phone: { $regex: new RegExp(escaped, 'i') } },
        { 'merchantProfile.businessName': { $regex: new RegExp(escaped, 'i') } },
      ];
      if (mongoFilter.$or) {
        mongoFilter.$and = [{ $or: mongoFilter.$or }, { $or: searchOr }];
        delete mongoFilter.$or;
      } else {
        mongoFilter.$or = searchOr;
      }
    }

    const total = await User.countDocuments(mongoFilter);
    const docs = await User.find(mongoFilter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    sendSuccess(res, {
      items: docs.map(formatAdminMerchant),
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

    let items = Array.from(mockUserStore.values()).filter((u) => u.role === UserRole.MERCHANT);

    if (status) {
      items = items.filter((u) => {
        const itemStatus =
          u.merchantProfile?.verificationStatus ||
          (u.isVerified ? MerchantVerificationStatus.VERIFIED : MerchantVerificationStatus.PENDING_REVIEW);
        return itemStatus === status;
      });
    }

    if (search) {
      const searchLower = search.toLowerCase();
      items = items.filter(
        (u) =>
          u.name?.toLowerCase().includes(searchLower) ||
          u.email?.toLowerCase().includes(searchLower) ||
          u.phone?.toLowerCase().includes(searchLower) ||
          u.merchantProfile?.businessName?.toLowerCase().includes(searchLower)
      );
    }

    items.sort((a, b) => {
      const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt || 0).getTime();
      const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    const total = items.length;
    const paginated = items.slice(skip, skip + limit);

    sendSuccess(res, {
      items: paginated.map(formatAdminMerchant),
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
 * GET /api/v1/admin/merchants/:id
 * Fetches merchant details for moderation review.
 */
export async function getAdminMerchantByIdHandler(req: Request, res: Response): Promise<void> {
  const rawId = req.params.id;
  const merchantId = (typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? rawId[0] : '').trim();

  if (!merchantId) {
    throw new BadRequestError('Merchant ID is required');
  }

  if (isDatabaseConnected()) {
    if (!Types.ObjectId.isValid(merchantId)) {
      throw new BadRequestError('Invalid merchant ID format');
    }

    const doc = await User.findById(merchantId);
    if (!doc || doc.role !== UserRole.MERCHANT) {
      throw new NotFoundError(`Merchant with ID '${merchantId}' was not found.`);
    }

    sendSuccess(res, formatAdminMerchant(doc));
  } else {
    if (config.NODE_ENV === 'production') {
      throw new AppError('Database service unavailable.', 503);
    }

    const user = mockUserStore.get(merchantId);
    if (!user || user.role !== UserRole.MERCHANT) {
      throw new NotFoundError(`Merchant with ID '${merchantId}' was not found.`);
    }

    sendSuccess(res, formatAdminMerchant(user));
  }
}

/**
 * PATCH /api/v1/admin/merchants/:id/status
 * Moderation endpoint to approve, reject, or suspend a merchant.
 */
export async function updateAdminMerchantStatusHandler(req: Request, res: Response): Promise<void> {
  const rawId = req.params.id;
  const merchantId = (typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? rawId[0] : '').trim();
  const body = req.body as AdminUpdateMerchantStatus;

  if (!merchantId) {
    throw new BadRequestError('Merchant ID is required');
  }

  const adminUser = (req as any).user;
  const adminId = adminUser?.userId || adminUser?.id || 'admin';
  const adminName = adminUser?.name || 'Admin';

  if (isDatabaseConnected()) {
    if (!Types.ObjectId.isValid(merchantId)) {
      throw new BadRequestError('Invalid merchant ID format');
    }

    const doc = await User.findById(merchantId);
    if (!doc || doc.role !== UserRole.MERCHANT) {
      throw new NotFoundError(`Merchant with ID '${merchantId}' was not found.`);
    }

    const prevStatus =
      doc.merchantProfile?.verificationStatus ||
      (doc.isVerified ? MerchantVerificationStatus.VERIFIED : MerchantVerificationStatus.PENDING_REVIEW);

    if (!doc.merchantProfile) {
      doc.merchantProfile = {
        businessName: doc.name || 'Merchant Business',
        businessType: 'other',
      };
    }

    doc.merchantProfile.verificationStatus = body.status;
    if (body.reason !== undefined) {
      doc.merchantProfile.verificationReason = body.reason;
    }

    if (body.status === MerchantVerificationStatus.VERIFIED) {
      doc.isVerified = true;
    } else {
      doc.isVerified = false;
    }

    await doc.save();

    await recordAuditLog({
      adminId,
      adminName,
      action: 'merchant_verification',
      targetType: 'merchant',
      targetId: merchantId,
      targetName: doc.merchantProfile.businessName || doc.name,
      prevStatus,
      newStatus: body.status,
      reason: body.reason,
    });

    sendSuccess(
      res,
      formatAdminMerchant(doc),
      200,
      `Merchant verification status updated to '${body.status}'.`
    );
  } else {
    if (config.NODE_ENV === 'production') {
      throw new AppError('Database service unavailable.', 503);
    }

    const user = mockUserStore.get(merchantId);
    if (!user || user.role !== UserRole.MERCHANT) {
      throw new NotFoundError(`Merchant with ID '${merchantId}' was not found.`);
    }

    const prevStatus =
      user.merchantProfile?.verificationStatus ||
      (user.isVerified ? MerchantVerificationStatus.VERIFIED : MerchantVerificationStatus.PENDING_REVIEW);

    if (!user.merchantProfile) {
      user.merchantProfile = {
        businessName: user.name || 'Merchant Business',
        businessType: 'other',
      };
    }

    user.merchantProfile.verificationStatus = body.status;
    if (body.reason !== undefined) {
      user.merchantProfile.verificationReason = body.reason;
    }

    if (body.status === MerchantVerificationStatus.VERIFIED) {
      user.isVerified = true;
    } else {
      user.isVerified = false;
    }

    user.updatedAt = new Date();

    await recordAuditLog({
      adminId,
      adminName,
      action: 'merchant_verification',
      targetType: 'merchant',
      targetId: merchantId,
      targetName: user.merchantProfile.businessName || user.name,
      prevStatus,
      newStatus: body.status,
      reason: body.reason,
    });

    sendSuccess(
      res,
      formatAdminMerchant(user),
      200,
      `Merchant verification status updated to '${body.status}'.`
    );
  }
}

/**
 * GET /api/v1/admin/audit-logs
 * Retrieves paginated moderation audit history.
 */
export async function getAdminAuditLogsHandler(req: Request, res: Response): Promise<void> {
  const query = req.query as unknown as AdminAuditLogQuery;
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));
  const skip = (page - 1) * limit;

  const targetType = query.targetType && query.targetType !== 'all' ? query.targetType : undefined;
  const adminId = query.adminId?.trim();

  if (isDatabaseConnected()) {
    const mongoFilter: Record<string, any> = {};

    if (targetType) {
      mongoFilter.targetType = targetType;
    }
    if (adminId) {
      mongoFilter.adminId = adminId;
    }

    const total = await AuditLog.countDocuments(mongoFilter);
    const docs = await AuditLog.find(mongoFilter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    sendSuccess(res, {
      items: docs.map(formatAdminAuditLog),
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

    let items = Array.from(mockAuditLogStore.values());

    if (targetType) {
      items = items.filter((log) => log.targetType === targetType);
    }
    if (adminId) {
      items = items.filter((log) => log.adminId === adminId);
    }

    items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = items.length;
    const paginated = items.slice(skip, skip + limit);

    sendSuccess(res, {
      items: paginated.map(formatAdminAuditLog),
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
