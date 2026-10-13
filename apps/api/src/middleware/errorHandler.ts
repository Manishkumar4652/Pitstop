import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors';
import { sendError } from '../utils/response';
import { config } from '../config/env';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // If headers have already been sent to client, delegate to default Express handler
  if (res.headersSent) {
    return next(err);
  }

  // 1. Handle malformed JSON body from express.json()
  if (
    err instanceof SyntaxError &&
    'status' in err &&
    (err as { status?: unknown }).status === 400 &&
    'body' in err
  ) {
    sendError(
      res,
      400,
      'Bad Request',
      'Malformed JSON payload in request body. Please verify request syntax.'
    );
    return;
  }

  // 2. Handle Zod validation errors
  if (err instanceof ZodError || err.name === 'ZodError') {
    const formattedIssues = (err as ZodError).errors.map((e) => ({
      field: e.path.join('.') || 'root',
      message: e.message,
    }));

    sendError(
      res,
      400,
      'Validation Error',
      'The request payload or parameters failed schema validation.',
      formattedIssues
    );
    return;
  }

  // 3. Handle known operational application errors
  if (err instanceof AppError) {
    sendError(
      res,
      err.statusCode,
      err.name,
      err.message,
      err.details
    );
    return;
  }

  // 4. Handle MongoDB duplicate key errors (code 11000)
  if ('code' in err && (err as { code?: unknown }).code === 11000) {
    sendError(
      res,
      409,
      'Conflict',
      'An account or resource with these unique details already exists.'
    );
    return;
  }

  // 5. Handle unexpected server errors

  const isProd = config.NODE_ENV === 'production';
  // Diagnostic server logging (without leaking credentials)
  console.error(`[${new Date().toISOString()}] Unhandled API Error on ${req.method} ${req.originalUrl}:`, err.message);

  sendError(
    res,
    500,
    'Internal Server Error',
    isProd
      ? 'An unexpected server error occurred. Please try again later.'
      : err.message || 'An unexpected server error occurred.'
  );
}
