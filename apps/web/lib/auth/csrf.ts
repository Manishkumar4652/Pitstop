import { NextRequest } from 'next/server';

/**
 * Validates that the request origin matches the application host for CSRF protection.
 * In development or server-side test contexts, permits matching localhost/127.0.0.1.
 */
export function validateCsrfOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  if (!origin) {
    // If no origin header, check referer header
    const referer = request.headers.get('referer');
    if (!referer) {
      // In same-origin GET/POST or non-browser server calls, origin might not be sent.
      return true;
    }
    try {
      const refererHost = new URL(referer).host;
      const host = request.headers.get('host');
      return refererHost === host;
    } catch {
      return false;
    }
  }

  try {
    const originHost = new URL(origin).host;
    const host = request.headers.get('host');
    if (!host) return true;
    return originHost === host;
  } catch {
    return false;
  }
}
