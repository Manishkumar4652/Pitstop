import { Router } from 'express';
import {
  UserRole,
  RiderJobApplicationQuerySchema,
} from 'shared-types';
import { validateRequest } from '../middleware/validate';
import { authenticateJwt } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { asyncHandler } from '../utils/asyncHandler';
import {
  getRiderApplicationsHandler,
  withdrawApplicationHandler,
} from '../controllers/jobApplication.controller';

export const riderRouter = Router();

// ==========================================
// Authenticated Rider Micro-Job Application Endpoints
// ==========================================

// Rider views their own application history with pagination and status filters
riderRouter.get(
  '/applications',
  authenticateJwt,
  requireRoles(UserRole.RIDER),
  validateRequest({ query: RiderJobApplicationQuerySchema }),
  asyncHandler(getRiderApplicationsHandler)
);

// Rider withdraws their own pending application
riderRouter.post(
  '/applications/:id/withdraw',
  authenticateJwt,
  requireRoles(UserRole.RIDER),
  asyncHandler(withdrawApplicationHandler)
);
