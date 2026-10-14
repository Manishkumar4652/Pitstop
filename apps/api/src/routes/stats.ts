import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { getPublicPlatformStatsHandler } from '../controllers/stats.controller';

export const statsRouter = Router();

// GET /api/v1/stats/public
statsRouter.get('/public', asyncHandler(getPublicPlatformStatsHandler));
