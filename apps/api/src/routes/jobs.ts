import { Router } from 'express';
import {
  UserRole,
  CreateJobRequestSchema,
  UpdateJobRequestSchema,
  JobQuerySchema,
  ApplyJobRequestSchema,
} from 'shared-types';
import { validateRequest } from '../middleware/validate';
import { authenticateJwt } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { asyncHandler } from '../utils/asyncHandler';
import {
  getPublicJobsHandler,
  getPublicJobByIdHandler,
  createMerchantJobHandler,
  updateMerchantJobHandler,
} from '../controllers/job.controller';
import { applyJobHandler } from '../controllers/jobApplication.controller';

export const jobsRouter = Router();

// ==========================================
// Public / Rider Discovery Endpoints
// ==========================================
jobsRouter.get(
  '/',
  validateRequest({ query: JobQuerySchema }),
  asyncHandler(getPublicJobsHandler)
);

jobsRouter.get(
  '/:id',
  asyncHandler(getPublicJobByIdHandler)
);

// ==========================================
// Authenticated Merchant Endpoints
// ==========================================
jobsRouter.post(
  '/',
  authenticateJwt,
  requireRoles(UserRole.MERCHANT),
  validateRequest({ body: CreateJobRequestSchema }),
  asyncHandler(createMerchantJobHandler)
);

jobsRouter.patch(
  '/:id',
  authenticateJwt,
  requireRoles(UserRole.MERCHANT),
  validateRequest({ body: UpdateJobRequestSchema }),
  asyncHandler(updateMerchantJobHandler)
);

// ==========================================
// Authenticated Rider Job Application Endpoint
// ==========================================
jobsRouter.post(
  '/:id/apply',
  authenticateJwt,
  requireRoles(UserRole.RIDER),
  validateRequest({ body: ApplyJobRequestSchema }),
  asyncHandler(applyJobHandler)
);

