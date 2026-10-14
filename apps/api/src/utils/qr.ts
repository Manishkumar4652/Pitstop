import crypto from 'crypto';
import { getQrSigningSecret } from '../config/env';

export interface VenueQrPayload {
  restStopId: string;
  version: number;
  verificationCode?: string;
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
 * Generates a clean 6-digit verification code bound to the rest stop and version.
 */
export function generateVenueVerificationCode(
  restStopId: string,
  version: number = 1
): string {
  const hash = crypto
    .createHmac('sha256', getQrSigningKey())
    .update(`verification_code:${restStopId}:${version}`)
    .digest('hex');
  const num = (parseInt(hash.substring(0, 8), 16) % 900000) + 100000;
  return num.toString();
}

/**
 * Generates a tamper-proof cryptographic venue QR credential for a rest stop.
 * Signed with HMAC-SHA256 and bound to the venue ID, current rotation version, and expiry.
 */
export function generateVenueQrCredential(
  restStopId: string,
  version: number = 1,
  expiresInMs: number = 30 * 24 * 60 * 60 * 1000 // 30 days default validity for venue poster/display
): { qrCredential: string; verificationCode: string; expiresAt: Date; version: number } {
  const nonce = crypto.randomBytes(16).toString('hex');
  const issuedAt = Date.now();
  const expiresAtMs = issuedAt + expiresInMs;
  const verificationCode = generateVenueVerificationCode(restStopId, version);

  const payload: VenueQrPayload = {
    restStopId,
    version,
    verificationCode,
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
    verificationCode,
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

/**
 * Validates a 4-12 char / 6-digit manual desk verification code against a venue and version.
 * Supports timing safe comparison and both dynamically generated and stored codes.
 */
export function verifyVenueVerificationCode(
  code: string,
  expectedRestStopId: string,
  currentVersion: number = 1,
  storedCode?: string
): boolean {
  if (!code || typeof code !== 'string') return false;
  const cleanCode = code.trim().toUpperCase();
  if (cleanCode.length < 4 || cleanCode.length > 12) return false;

  const expectedGenerated = generateVenueVerificationCode(expectedRestStopId, currentVersion).toUpperCase();
  const expectedStored = storedCode ? storedCode.trim().toUpperCase() : null;

  if (cleanCode.length === expectedGenerated.length) {
    const bufA = Buffer.from(cleanCode);
    const bufB = Buffer.from(expectedGenerated);
    if (crypto.timingSafeEqual(bufA, bufB)) return true;
  }

  if (expectedStored && cleanCode.length === expectedStored.length) {
    const bufA = Buffer.from(cleanCode);
    const bufB = Buffer.from(expectedStored);
    if (crypto.timingSafeEqual(bufA, bufB)) return true;
  }

  return false;
}
