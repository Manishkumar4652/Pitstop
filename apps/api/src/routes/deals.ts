import { Router } from 'express';
import {
  UserRole,
  CreateDealRequestSchema,
  UpdateDealRequestSchema,
  DealQuerySchema,
} from 'shared-types';
import { validateRequest } from '../middleware/validate';
import { authenticateJwt } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { asyncHandler } from '../utils/asyncHandler';
import {
  getPublicDealsHandler,
  getPublicDealByIdHandler,
  createMerchantDealHandler,
  updateMerchantDealHandler,
} from '../controllers/deal.controller';

export const dealsRouter = Router();

// ==========================================
// Public Discovery Endpoints
// ==========================================
dealsRouter.get(
  '/',
  validateRequest({ query: DealQuerySchema }),
  asyncHandler(getPublicDealsHandler)
);

dealsRouter.get(
  '/:id',
  asyncHandler(getPublicDealByIdHandler)
);

// ==========================================
// Authenticated Merchant Endpoints
// ==========================================
dealsRouter.post(
  '/',
  authenticateJwt,
  requireRoles(UserRole.MERCHANT),
  validateRequest({ body: CreateDealRequestSchema }),
  asyncHandler(createMerchantDealHandler)
);

dealsRouter.patch(
  '/:id',
  authenticateJwt,
  requireRoles(UserRole.MERCHANT),
  validateRequest({ body: UpdateDealRequestSchema }),
  asyncHandler(updateMerchantDealHandler)
);
