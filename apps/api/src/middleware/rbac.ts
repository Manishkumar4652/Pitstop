import { Request, Response, NextFunction } from 'express';
import { UserRole } from 'shared-types';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';

/**
 * Role-Based Access Control (RBAC) middleware factory.
 * Restricts endpoint access to users possessing at least one of the specified allowed roles.
 * 
 * Enforces zero-trust:
 * - Returns HTTP 401 Unauthorized if the user is unauthenticated.
 * - Returns HTTP 403 Forbidden if the user's verified server-side role is not in the allowlist.
 */
export function requireRoles(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication is required to access this resource.'));
    }

    const currentRole = req.user.role;

    if (!currentRole || !allowedRoles.includes(currentRole)) {
      return next(
        new ForbiddenError(
          `Access forbidden: Requires one of [${allowedRoles.join(', ')}] role(s). Current role '${currentRole || 'unknown'}' has insufficient permissions.`
        )
      );
    }

    next();
  };
}
