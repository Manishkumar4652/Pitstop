import { Router } from 'express';
import {
  UserRole,
  CheckInQuerySchema,
  ConfirmCheckInRequestSchema,
  RejectCheckInRequestSchema,
  MerchantRestStopQuerySchema,
  MerchantDealQuerySchema,
  MerchantJobQuerySchema,
  MerchantJobApplicantsQuerySchema,
  UpdateJobApplicationStatusSchema,
} from 'shared-types';
import { validateRequest } from '../middleware/validate';
import { authenticateJwt } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { asyncHandler } from '../utils/asyncHandler';
import {
  getMerchantCheckInsHandler,
  getVenueQrCredentialHandler,
  rotateVenueQrCredentialHandler,
  confirmMerchantCheckInHandler,
  rejectMerchantCheckInHandler,
} from '../controllers/checkIn.controller';
import {
  getMerchantRestStopsHandler,
  getMerchantRestStopByIdHandler,
} from '../controllers/restStop.controller';
import {
  getMerchantDealsHandler,
  getMerchantDealByIdHandler,
} from '../controllers/deal.controller';
import {
  getMerchantJobsHandler,
  getMerchantJobByIdHandler,
} from '../controllers/job.controller';
import {
  getJobApplicantsHandler,
  updateApplicationStatusHandler,
} from '../controllers/jobApplication.controller';

export const merchantRouter = Router();

// ==========================================
// Authenticated Merchant Rest-Stop Management Endpoints
// ==========================================

// Merchant lists their own rest stops across all statuses
merchantRouter.get(
  '/rest-stops',
  authenticateJwt,
  requireRoles(UserRole.MERCHANT),
  validateRequest({ query: MerchantRestStopQuerySchema }),
  asyncHandler(getMerchantRestStopsHandler)
);

// Merchant retrieves a single rest stop owned by them
merchantRouter.get(
  '/rest-stops/:id',
  authenticateJwt,
  requireRoles(UserRole.MERCHANT),
  asyncHandler(getMerchantRestStopByIdHandler)
);

// ==========================================
// Authenticated Merchant Deal Management Endpoints
// ==========================================

// Merchant lists their own deals across all statuses
merchantRouter.get(
  '/deals',
  authenticateJwt,
  requireRoles(UserRole.MERCHANT),
  validateRequest({ query: MerchantDealQuerySchema }),
  asyncHandler(getMerchantDealsHandler)
);

// Merchant retrieves a single deal owned by them
merchantRouter.get(
  '/deals/:id',
  authenticateJwt,
  requireRoles(UserRole.MERCHANT),
  asyncHandler(getMerchantDealByIdHandler)
);

// ==========================================
// Authenticated Merchant Micro-Job Management Endpoints
// ==========================================

// Merchant lists their own micro-jobs across all statuses
merchantRouter.get(
  '/jobs',
  authenticateJwt,
  requireRoles(UserRole.MERCHANT),
  validateRequest({ query: MerchantJobQuerySchema }),
  asyncHandler(getMerchantJobsHandler)
);

// Merchant retrieves a single micro-job owned by them
merchantRouter.get(
  '/jobs/:id',
  authenticateJwt,
  requireRoles(UserRole.MERCHANT),
  asyncHandler(getMerchantJobByIdHandler)
);

// Merchant views applicants for an owned micro-job
merchantRouter.get(
  '/jobs/:id/applications',
  authenticateJwt,
  requireRoles(UserRole.MERCHANT),
  validateRequest({ query: MerchantJobApplicantsQuerySchema }),
  asyncHandler(getJobApplicantsHandler)
);

// Merchant accepts or rejects a micro-job application with atomic capacity management
merchantRouter.patch(
  '/applications/:id/status',
  authenticateJwt,
  requireRoles(UserRole.MERCHANT),
  validateRequest({ body: UpdateJobApplicationStatusSchema }),
  asyncHandler(updateApplicationStatusHandler)
);

// ==========================================
// Authenticated Merchant Check-In Endpoints
// ==========================================

// Merchant views check-ins across owned rest stops
merchantRouter.get(
  '/check-ins',
  authenticateJwt,
  requireRoles(UserRole.MERCHANT),
  validateRequest({ query: CheckInQuerySchema }),
  asyncHandler(getMerchantCheckInsHandler)
);

// Merchant confirms a pending check-in at their venue
merchantRouter.post(
  '/check-ins/:id/confirm',
  authenticateJwt,
  requireRoles(UserRole.MERCHANT),
  validateRequest({ body: ConfirmCheckInRequestSchema }),
  asyncHandler(confirmMerchantCheckInHandler)
);

// Merchant rejects a pending check-in at their venue
merchantRouter.post(
  '/check-ins/:id/reject',
  authenticateJwt,
  requireRoles(UserRole.MERCHANT),
  validateRequest({ body: RejectCheckInRequestSchema }),
  asyncHandler(rejectMerchantCheckInHandler)
);

// ==========================================
// Venue QR Credential Management Endpoints
// ==========================================

// Merchant retrieves the cryptographic venue QR credential for their rest stop
merchantRouter.get(
  '/rest-stops/:id/qr-credential',
  authenticateJwt,
  requireRoles(UserRole.MERCHANT),
  asyncHandler(getVenueQrCredentialHandler)
);

// Merchant rotates the venue QR credential (invalidating all previous credentials)
merchantRouter.post(
  '/rest-stops/:id/qr-credential/rotate',
  authenticateJwt,
  requireRoles(UserRole.MERCHANT),
  asyncHandler(rotateVenueQrCredentialHandler)
);
