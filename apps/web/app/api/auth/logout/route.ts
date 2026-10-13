import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth/cookies';
import { validateCsrfOrigin } from '@/lib/auth/csrf';

/**
 * POST /api/auth/logout
 * BFF endpoint for user logout.
 * Clears the HttpOnly session cookie and ends session.
 */
export async function POST(request: NextRequest) {
  // CSRF validation for state-changing logout
  if (!validateCsrfOrigin(request)) {
    return NextResponse.json(
      { success: false, message: 'Invalid origin or cross-site request prohibited.' },
      { status: 403 }
    );
  }

  const response = NextResponse.json({
    success: true,
    message: 'Logged out successfully.',
  });

  clearAuthCookie(response);
  return response;
}
