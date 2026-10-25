/**
 * Sanitizes return URLs to prevent Open Redirect vulnerabilities.
 * 
 * Rules:
 * 1. Must be a valid string starting with a single forward slash ('/').
 * 2. Cannot start with '//' (protocol-relative URL targeting external domain).
 * 3. Cannot start with '/\' or contain any backslashes '\\' (which some browsers normalize to '/' allowing open redirects like '/\\evil.com').
 * 4. Cannot contain ASCII control characters (0x00-0x1F, 0x7F) or carriage returns/newlines.
 * 5. Falls back to a safe default path if any check fails.
 */
export function sanitizeReturnUrl(rawUrl: string | null | undefined, fallback = '/merchant'): string {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return fallback;
  }

  const trimmed = rawUrl.trim();

  // Must begin with a single slash, not double slash or backslash
  if (
    !trimmed.startsWith('/') ||
    trimmed.startsWith('//') ||
    trimmed.startsWith('/\\') ||
    trimmed.includes('\\')
  ) {
    return fallback;
  }

  // Reject ASCII control characters (0x00 - 0x1F) and delete (0x7F)
  if (/[\x00-\x1F\x7F]/.test(trimmed)) {
    return fallback;
  }

  // Prevent self-redirect or redirect loop back to login or registration pages
  const lower = trimmed.toLowerCase();
  if (
    lower === '/login' ||
    lower.startsWith('/login?') ||
    lower === '/merchant/login' ||
    lower.startsWith('/merchant/login?') ||
    lower === '/rider/login' ||
    lower.startsWith('/rider/login?') ||
    lower === '/admin/login' ||
    lower.startsWith('/admin/login?') ||
    lower.includes('/register')
  ) {
    return fallback;
  }

  return trimmed;
}
