import { Router, Request, Response } from 'express';
import { sendSuccess } from '../utils/response';
import { config } from '../config/env';
import { isDatabaseConnected } from '../config/database';

export const healthRouter = Router();

healthRouter.get('/', (_req: Request, res: Response) => {
  const isConnected = isDatabaseConnected();
  return sendSuccess(res, {
    status: 'ok',
    service: 'PitStop REST API',
    version: 'v1',
    environment: config.NODE_ENV,
    uptimeSeconds: Math.floor(process.uptime()),
    database: isConnected ? 'connected' : 'disconnected',
  });
});
