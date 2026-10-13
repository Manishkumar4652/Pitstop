import { Router } from 'express';
import {
  UserRole,
  CreateCheckInRequestSchema,
  VerifyCheckInRequestSchema,
  CheckInQuerySchema,
} from 'shared-types';
import { validateRequest } from '../middleware/validate';
import { authenticateJwt } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { asyncHandler } from '../utils/asyncHandler';
import {
  createRiderCheckInHandler,
  verifyRiderCheckInHandler,
  cancelRiderCheckInHandler,
  getRiderCheckInsHandler,
  getRiderCheckInByIdHandler,
} from '../controllers/checkIn.controller';

export const checkInsRouter = Router();

// ==========================================
// Authenticated Rider Check-In Endpoints
// ==========================================

// Rider creates a check-in at an active rest stop
checkInsRouter.post(
  '/',
  authenticateJwt,
  requireRoles(UserRole.RIDER),
  validateRequest({ body: CreateCheckInRequestSchema }),
  asyncHandler(createRiderCheckInHandler)
);

// Rider verifies arrival using venue QR credential (MUST be mounted before /:id)
checkInsRouter.post(
  '/verify',
  authenticateJwt,
  requireRoles(UserRole.RIDER),
  validateRequest({ body: VerifyCheckInRequestSchema }),
  asyncHandler(verifyRiderCheckInHandler)
);

// Rider views their check-in history (MUST be mounted before /:id)
checkInsRouter.get(
  '/me',
  authenticateJwt,
  requireRoles(UserRole.RIDER),
  validateRequest({ query: CheckInQuerySchema }),
  asyncHandler(getRiderCheckInsHandler)
);

// Rider cancels their own pending check-in
checkInsRouter.post(
  '/:id/cancel',
  authenticateJwt,
  requireRoles(UserRole.RIDER),
  asyncHandler(cancelRiderCheckInHandler)
);

// Rider views a specific check-in record
checkInsRouter.get(
  '/:id',
  authenticateJwt,
  requireRoles(UserRole.RIDER),
  asyncHandler(getRiderCheckInByIdHandler)
);
