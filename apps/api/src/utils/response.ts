import { Response } from 'express';

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  message: string;
  details?: unknown;
  timestamp: string;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  message?: string
): Response {
  const payload: ApiSuccessResponse<T> = {
    success: true,
    data,
    ...(message && { message }),
    timestamp: new Date().toISOString(),
  };
  return res.status(statusCode).json(payload);
}

export function sendError(
  res: Response,
  statusCode: number,
  error: string,
  message: string,
  details?: unknown
): Response {
  const payload: ApiErrorResponse = {
    success: false,
    error,
    message,
    ...(details !== undefined && { details }),
    timestamp: new Date().toISOString(),
  };
  return res.status(statusCode).json(payload);
}
