import { Router } from 'express';
import {
  UserRole,
  AdminRestStopQuerySchema,
  AdminUpdateRestStopStatusSchema,
  AdminDealQuerySchema,
  AdminUpdateDealStatusSchema,
  AdminJobQuerySchema,
  AdminUpdateJobStatusSchema,
  AdminCheckInQuerySchema,
  AdminMerchantQuerySchema,
  AdminUpdateMerchantStatusSchema,
  AdminAuditLogQuerySchema,
} from 'shared-types';
import { validateRequest } from '../middleware/validate';
import { authenticateJwt } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { asyncHandler } from '../utils/asyncHandler';
import {
  getAdminStatsHandler,
  getAdminMerchantsHandler,
  getAdminMerchantByIdHandler,
  updateAdminMerchantStatusHandler,
  getAdminAuditLogsHandler,
} from '../controllers/admin.controller';
import {
  getAdminRestStopsHandler,
  updateAdminRestStopStatusHandler,
} from '../controllers/restStop.controller';
import {
  getAdminDealsHandler,
  updateAdminDealStatusHandler,
} from '../controllers/deal.controller';
import {
  getAdminJobsHandler,
  updateAdminJobStatusHandler,
} from '../controllers/job.controller';
import { getAdminCheckInsHandler } from '../controllers/checkIn.controller';

export const adminRouter = Router();

// ==========================================
// Admin Live Analytics Endpoints
// ==========================================
adminRouter.get(
  '/stats',
  authenticateJwt,
  requireRoles(UserRole.ADMIN),
  asyncHandler(getAdminStatsHandler)
);

// ==========================================
// Admin Merchant Verification Endpoints
// ==========================================
adminRouter.get(
  '/merchants',
  authenticateJwt,
  requireRoles(UserRole.ADMIN),
  validateRequest({ query: AdminMerchantQuerySchema }),
  asyncHandler(getAdminMerchantsHandler)
);

adminRouter.get(
  '/merchants/:id',
  authenticateJwt,
  requireRoles(UserRole.ADMIN),
  asyncHandler(getAdminMerchantByIdHandler)
);

adminRouter.patch(
  '/merchants/:id/status',
  authenticateJwt,
  requireRoles(UserRole.ADMIN),
  validateRequest({ body: AdminUpdateMerchantStatusSchema }),
  asyncHandler(updateAdminMerchantStatusHandler)
);

// ==========================================
// Admin Rest-Stop Moderation Endpoints
// ==========================================
adminRouter.get(
  '/rest-stops',
  authenticateJwt,
  requireRoles(UserRole.ADMIN),
  validateRequest({ query: AdminRestStopQuerySchema }),
  asyncHandler(getAdminRestStopsHandler)
);

adminRouter.patch(
  '/rest-stops/:id/status',
  authenticateJwt,
  requireRoles(UserRole.ADMIN),
  validateRequest({ body: AdminUpdateRestStopStatusSchema }),
  asyncHandler(updateAdminRestStopStatusHandler)
);

// ==========================================
// Admin Deal Moderation Endpoints
// ==========================================
adminRouter.get(
  '/deals',
  authenticateJwt,
  requireRoles(UserRole.ADMIN),
  validateRequest({ query: AdminDealQuerySchema }),
  asyncHandler(getAdminDealsHandler)
);

adminRouter.patch(
  '/deals/:id/status',
  authenticateJwt,
  requireRoles(UserRole.ADMIN),
  validateRequest({ body: AdminUpdateDealStatusSchema }),
  asyncHandler(updateAdminDealStatusHandler)
);

// ==========================================
// Admin Job Moderation Endpoints
// ==========================================
adminRouter.get(
  '/jobs',
  authenticateJwt,
  requireRoles(UserRole.ADMIN),
  validateRequest({ query: AdminJobQuerySchema }),
  asyncHandler(getAdminJobsHandler)
);

adminRouter.patch(
  '/jobs/:id/status',
  authenticateJwt,
  requireRoles(UserRole.ADMIN),
  validateRequest({ body: AdminUpdateJobStatusSchema }),
  asyncHandler(updateAdminJobStatusHandler)
);

// ==========================================
// Admin Check-In Moderation Endpoints
// ==========================================
adminRouter.get(
  '/check-ins',
  authenticateJwt,
  requireRoles(UserRole.ADMIN),
  validateRequest({ query: AdminCheckInQuerySchema }),
  asyncHandler(getAdminCheckInsHandler)
);

// ==========================================
// Admin Audit Log Endpoints
// ==========================================
adminRouter.get(
  '/audit-logs',
  authenticateJwt,
  requireRoles(UserRole.ADMIN),
  validateRequest({ query: AdminAuditLogQuerySchema }),
  asyncHandler(getAdminAuditLogsHandler)
);
