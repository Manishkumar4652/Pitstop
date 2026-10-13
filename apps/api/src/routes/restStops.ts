import { Router } from 'express';
import { UserRole, CreateRestStopRequestSchema, UpdateRestStopRequestSchema, RestStopQuerySchema } from 'shared-types';
import { validateRequest } from '../middleware/validate';
import { authenticateJwt } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { asyncHandler } from '../utils/asyncHandler';
import {
  getPublicRestStopsHandler,
  getPublicRestStopBySlugHandler,
  createMerchantRestStopHandler,
  updateMerchantRestStopHandler,
} from '../controllers/restStop.controller';

export const restStopsRouter = Router();

// ==========================================
// Public Discovery Endpoints
// ==========================================
restStopsRouter.get(
  '/',
  validateRequest({ query: RestStopQuerySchema }),
  asyncHandler(getPublicRestStopsHandler)
);

restStopsRouter.get(
  '/:slug',
  asyncHandler(getPublicRestStopBySlugHandler)
);

// ==========================================
// Authenticated Merchant Endpoints
// ==========================================
restStopsRouter.post(
  '/',
  authenticateJwt,
  requireRoles(UserRole.MERCHANT),
  validateRequest({ body: CreateRestStopRequestSchema }),
  asyncHandler(createMerchantRestStopHandler)
);

restStopsRouter.patch(
  '/:id',
  authenticateJwt,
  requireRoles(UserRole.MERCHANT),
  validateRequest({ body: UpdateRestStopRequestSchema }),
  asyncHandler(updateMerchantRestStopHandler)
);
