import path from 'path';
import { z } from 'zod';
import dotenv from 'dotenv';

// 1. Load from monorepo root (.env) if present
dotenv.config();
// 2. Load from apps/api/.env if present
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  API_PORT: z.coerce.number().int().min(1).max(65535).optional(),
  API_URL: z.string().url().default('http://localhost:5000'),
  CLIENT_URL: z.string().default('http://localhost:3000'),
  API_PREFIX: z.string().default('/api/v1'),
  // Optional database & auth variables
  MONGODB_URI: z.string().optional(),
  JWT_SECRET: z
    .string()
    .refine((val) => val === undefined || val === '' || val.length >= 32, {
      message: 'JWT_SECRET must be at least 32 characters long when provided',
    })
    .optional(),
  JWT_EXPIRES_IN: z.string().default('15m'),
  QR_SIGNING_SECRET: z
    .string()
    .refine((val) => val === undefined || val === '' || val.length >= 32, {
      message: 'QR_SIGNING_SECRET must be at least 32 characters long when provided',
    })
    .optional(),
}).superRefine((data, ctx) => {
  if (data.NODE_ENV === 'production') {
    if (!data.MONGODB_URI || data.MONGODB_URI.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['MONGODB_URI'],
        message: 'MONGODB_URI is required in production environment',
      });
    }
    if (!data.JWT_SECRET || data.JWT_SECRET.trim() === '' || data.JWT_SECRET.length < 32) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['JWT_SECRET'],
        message: 'JWT_SECRET is required and must be at least 32 characters in production',
      });
    }
  }
});

export type EnvConfig = z.infer<typeof envSchema>;

export function loadConfig(rawEnv: NodeJS.ProcessEnv = process.env): EnvConfig {
  const result = envSchema.safeParse(rawEnv);

  if (!result.success) {
    const errorDetails = result.error.errors
      .map((err) => `${err.path.join('.')}: ${err.message}`)
      .join('; ');
    throw new Error(`API Configuration Error: Invalid environment variables [${errorDetails}]`);
  }

  const data = result.data;
  return {
    ...data,
    // Prefer API_PORT if explicitly set, otherwise PORT
    PORT: data.API_PORT || data.PORT,
  };
}

export const config = loadConfig();

/**
 * Returns the validated JWT_SECRET, or throws an explicit operational error if missing.
 * Ensures the API never attempts to issue or verify tokens without a safe, strong key.
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET || config.JWT_SECRET;
  if (!secret || secret.trim() === '' || secret.length < 32) {
    throw new Error('JWT_SECRET is not configured or is fewer than 32 characters. Authentication requires a secure secret.');
  }
  return secret;
}

/**
 * Returns the validated QR_SIGNING_SECRET, or falls back to JWT_SECRET.
 * Ensures venue QR credentials are signed with an authenticated >= 32 char key.
 */
export function getQrSigningSecret(): string {
  const secret = process.env.QR_SIGNING_SECRET || config.QR_SIGNING_SECRET;
  if (secret && secret.trim() !== '' && secret.length >= 32) {
    return secret;
  }
  return getJwtSecret();
}



