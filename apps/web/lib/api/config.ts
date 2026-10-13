/**
 * Server-side API client configuration.
 *
 * SECURITY MANDATE:
 * - Never expose PITSTOP_API_BASE_URL to client bundles via NEXT_PUBLIC_*.
 * - Database credentials, secrets, and private host configs must remain server-side only.
 */

/**
 * Resolves the server-only backend API base URL.
 * Defaults to http://127.0.0.1:5000/api/v1 for local monorepo development.
 */
export function getApiBaseUrl(): string {
  const envUrl = process.env.PITSTOP_API_BASE_URL;
  if (envUrl && envUrl.trim() !== '') {
    return envUrl.trim().replace(/\/+$/, '');
  }
  return 'http://127.0.0.1:5000/api/v1';
}

/**
 * Determines whether offline demo fallback is explicitly permitted.
 *
 * RELIABILITY & ZERO-MASQUERADE RULES:
 * 1. In production (NODE_ENV === 'production'), demo fallback is STRICTLY FORBIDDEN.
 *    Backend failures must never silently display fictional rest stops as real listings.
 * 2. In non-production, demo fallback is disabled by default and runs ONLY when
 *    PITSTOP_ENABLE_DEMO_FALLBACK === 'true'.
 */
export function isDemoFallbackAllowed(): boolean {
  if (process.env.NODE_ENV === 'production') {
    return false;
  }
  return process.env.PITSTOP_ENABLE_DEMO_FALLBACK === 'true';
}
