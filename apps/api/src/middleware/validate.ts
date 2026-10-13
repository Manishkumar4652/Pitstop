import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export interface RequestValidators {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export function validateRequest(validators: RequestValidators) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (validators.body) {
        req.body = await validators.body.parseAsync(req.body);
      }
      if (validators.query) {
        req.query = (await validators.query.parseAsync(req.query)) as any;
      }
      if (validators.params) {
        req.params = (await validators.params.parseAsync(req.params)) as any;
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}
