import jwt, { JwtPayload, TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';
import { UserRole } from 'shared-types';
import { config, getJwtSecret } from '../config/env';
import { UnauthorizedError } from './errors';

export interface AuthTokenPayload {
  sub: string;
  role: UserRole;
}

/**
 * Generates a signed JWT access token with standard claims (sub, role, exp, iat).
 * Never includes sensitive information like passwords, emails, or personal details.
 */
export function signAccessToken(payload: { userId: string; role: UserRole }): string {
  const secret = getJwtSecret();
  
  return jwt.sign(
    {
      sub: payload.userId,
      role: payload.role,
    },
    secret,
    {
      expiresIn: config.JWT_EXPIRES_IN as any,
    }
  );
}

/**
 * Cryptographically verifies and decodes a JWT access token.
 * Maps library exceptions into consistent, safe UnauthorizedError instances
 * without leaking token verification internals or stack traces.
 */
export function verifyAccessToken(token: string): AuthTokenPayload {
  const secret = getJwtSecret();

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;

    if (!decoded || typeof decoded !== 'object') {
      throw new UnauthorizedError('Invalid authentication token');
    }

    const sub = decoded.sub;
    const role = decoded.role as UserRole;

    if (!sub || typeof sub !== 'string') {
      throw new UnauthorizedError('Authentication token contains invalid subject');
    }

    if (!role || !Object.values(UserRole).includes(role)) {
      throw new UnauthorizedError('Authentication token contains invalid role claim');
    }

    return {
      sub,
      role,
    };
  } catch (err: unknown) {
    if (err instanceof TokenExpiredError) {
      throw new UnauthorizedError('Authentication token has expired. Please log in again.');
    }
    if (err instanceof JsonWebTokenError) {
      throw new UnauthorizedError('Invalid authentication token');
    }
    if (err instanceof UnauthorizedError) {
      throw err;
    }
    throw new UnauthorizedError('Could not verify authentication token');
  }
}
