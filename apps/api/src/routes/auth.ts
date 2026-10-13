import { Router } from 'express';
import { RegisterRequestSchema, LoginRequestSchema } from 'shared-types';
import { validateRequest } from '../middleware/validate';
import { authenticateJwt } from '../middleware/auth';
import { createRateLimiter } from '../middleware/rateLimit';
import { asyncHandler } from '../utils/asyncHandler';
import {
  registerHandler,
  loginHandler,
  getMeHandler,
} from '../controllers/auth.controller';

export const authRouter = Router();

// Rate limiters for public authentication endpoints (15-min window)
const registerLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: 'Too many registration attempts from this IP. Please try again after 15 minutes.',
});

const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 25,
  message: 'Too many login attempts from this IP. Please try again after 15 minutes.',
});

// Public routes
authRouter.post(
  '/register',
  registerLimiter,
  validateRequest({ body: RegisterRequestSchema }),
  asyncHandler(registerHandler)
);

authRouter.post(
  '/login',
  loginLimiter,
  validateRequest({ body: LoginRequestSchema }),
  asyncHandler(loginHandler)
);

// Protected routes (requires valid JWT access token)
authRouter.get(
  '/me',
  authenticateJwt,
  asyncHandler(getMeHandler)
);

