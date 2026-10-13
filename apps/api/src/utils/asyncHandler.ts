import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Higher-order utility wrapping asynchronous Express route handlers to forward
 * any thrown errors or rejected promises directly to the centralized error middleware.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
