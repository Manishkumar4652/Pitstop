import crypto from 'crypto';
import { getQrSigningSecret } from '../config/env';

export interface VenueQrPayload {
  restStopId: string;
  version: number;
  issuedAt: number;
  expiresAt: number;
  nonce: string;
}

export interface VerifyQrResult {
  valid: boolean;
  error?: string;
  payload?: VenueQrPayload;
}

function getQrSigningKey(): string {
  return getQrSigningSecret();
}

/**
 * Generates a tamper-proof cryptographic venue QR credential for a rest stop.
 * Signed with HMAC-SHA256 and bound to the venue ID, current rotation version, and expiry.
 */
export function generateVenueQrCredential(
  restStopId: string,
  version: number = 1,
  expiresInMs: number = 30 * 24 * 60 * 60 * 1000 // 30 days default validity for venue poster/display
): { qrCredential: string; expiresAt: Date; version: number } {
  const nonce = crypto.randomBytes(16).toString('hex');
  const issuedAt = Date.now();
  const expiresAtMs = issuedAt + expiresInMs;

  const payload: VenueQrPayload = {
    restStopId,
    version,
    issuedAt,
    expiresAt: expiresAtMs,
    nonce,
  };

  const payloadBase64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const signature = crypto
    .createHmac('sha256', getQrSigningKey())
    .update(payloadBase64)
    .digest('base64url');

  return {
    qrCredential: `${payloadBase64}.${signature}`,
    expiresAt: new Date(expiresAtMs),
    version,
  };
}

/**
 * Validates a venue QR credential submitted during rider check-in.
 * Confirms signature authenticity, venue binding, rotation version, and temporal validity.
 */
export function verifyVenueQrCredential(
  qrCredential: string,
  expectedRestStopId: string,
  currentVersion: number = 1
): VerifyQrResult {
  if (!qrCredential || typeof qrCredential !== 'string') {
    return { valid: false, error: 'Venue QR credential is required.' };
  }

  const parts = qrCredential.split('.');
  if (parts.length !== 2) {
    return { valid: false, error: 'Malformed venue QR credential format.' };
  }

  const [payloadBase64, signature] = parts;

  // Re-compute expected HMAC signature
  const expectedSignature = crypto
    .createHmac('sha256', getQrSigningKey())
    .update(payloadBase64)
    .digest('base64url');

  const sigBuf = Buffer.from(signature, 'utf8');
  const expBuf = Buffer.from(expectedSignature, 'utf8');

  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return { valid: false, error: 'Invalid venue QR credential signature.' };
  }

  let payload: VenueQrPayload;
  try {
    payload = JSON.parse(Buffer.from(payloadBase64, 'base64url').toString('utf8'));
  } catch {
    return { valid: false, error: 'Malformed venue QR credential payload.' };
  }

  if (payload.restStopId !== expectedRestStopId) {
    return { valid: false, error: 'QR credential does not match the specified rest stop.' };
  }

  if (payload.version !== currentVersion) {
    return { valid: false, error: 'Venue QR credential has been rotated or revoked.' };
  }

  if (Date.now() > payload.expiresAt) {
    return { valid: false, error: 'Venue QR credential has expired.' };
  }

  return {
    valid: true,
    payload,
  };
}
