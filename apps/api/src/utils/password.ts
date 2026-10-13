import bcrypt from 'bcryptjs';
import { ValidationError } from './errors';
import { config } from '../config/env';

export const MIN_PASSWORD_LENGTH = 6;
export const MAX_PASSWORD_LENGTH = 128;

// Use lower work factor in test environment for sub-second test execution, 12 in production/dev
const BCRYPT_SALT_ROUNDS = config.NODE_ENV === 'test' ? 8 : 12;

/**
 * Validates password length and format against platform policy before hashing.
 * Rejects empty, whitespace-only, or overly long inputs to prevent denial-of-service.
 */
export function validatePasswordPolicy(password: string): void {
  if (!password || typeof password !== 'string') {
    throw new ValidationError('Password is required');
  }

  if (password.trim().length === 0) {
    throw new ValidationError('Password cannot be empty or only whitespace');
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new ValidationError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long`);
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    throw new ValidationError(`Password cannot exceed ${MAX_PASSWORD_LENGTH} characters`);
  }
}

/**
 * Hashes a plaintext password using bcryptjs with a secure work factor.
 * Plaintext passwords and hashes are never logged.
 */
export async function hashPassword(password: string): Promise<string> {
  validatePasswordPolicy(password);
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

/**
 * Compares a candidate plaintext password with a stored bcrypt hash.
 * Returns true if valid, false otherwise without throwing on mismatch.
 */
export async function comparePassword(
  candidatePassword: string,
  passwordHash?: string
): Promise<boolean> {
  if (!candidatePassword || !passwordHash) {
    return false;
  }
  return bcrypt.compare(candidatePassword, passwordHash);
}
