import { Request, Response } from 'express';
import { sendError } from '../utils/response';

export function notFoundHandler(req: Request, res: Response): Response {
  return sendError(
    res,
    404,
    'Not Found',
    `Cannot ${req.method} ${req.originalUrl} — The requested API endpoint does not exist.`
  );
}
