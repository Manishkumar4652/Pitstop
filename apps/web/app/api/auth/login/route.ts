import { NextRequest, NextResponse } from 'next/server';
import { LoginRequestSchema } from 'shared-types';
import { getApiBaseUrl } from '@/lib/api/config';
import { setAuthCookie } from '@/lib/auth/cookies';
import { validateCsrfOrigin } from '@/lib/auth/csrf';

/**
 * POST /api/auth/login
 * BFF endpoint for rider login.
 * Validates credentials against Express API and issues a secure HttpOnly session cookie.
 */
export async function POST(request: NextRequest) {
  // 1. CSRF Origin Validation
  if (!validateCsrfOrigin(request)) {
    return NextResponse.json(
      { success: false, message: 'Invalid origin or cross-site request prohibited.' },
      { status: 403 }
    );
  }

  try {
    const rawBody = await request.json();

    // 2. Client-side Zod validation
    const parseResult = LoginRequestSchema.safeParse(rawBody);
    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      return NextResponse.json(
        {
          success: false,
          error: 'ValidationError',
          message: issue ? issue.message : 'Please provide a valid Indian mobile number and password.',
        },
        { status: 400 }
      );
    }

    const payload = parseResult.data;

    // 3. Forward request to Express backend
    const apiBaseUrl = getApiBaseUrl();
    const backendRes = await fetch(`${apiBaseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const backendData = await backendRes.json().catch(() => null);

    if (!backendRes.ok || !backendData || !backendData.success) {
      const status = backendRes.status || 500;
      const message =
        status === 401
          ? 'Invalid phone number or password. Please check your credentials.'
          : status === 429
          ? 'Too many login attempts. Please try again in 15 minutes.'
          : backendData?.message || 'Login failed. Please verify your details.';

      return NextResponse.json(
        {
          success: false,
          error: backendData?.error || 'AuthenticationError',
          message,
        },
        { status }
      );
    }

    // 4. Role Authorization check if a specific role was requested (e.g. MERCHANT)
    const { token, user } = backendData.data;
    const requiredRole = (rawBody as any)?.requiredRole;

    if (requiredRole && user.role !== requiredRole) {
      const requiredRoleName = requiredRole === 'merchant' ? 'Merchant' : 'Rider';
      const actualRoleName = user.role === 'rider' ? 'Rider' : user.role === 'merchant' ? 'Merchant' : 'Admin';
      return NextResponse.json(
        {
          success: false,
          error: 'ForbiddenError',
          message: `Access denied. Your account is registered as a ${actualRoleName}. ${requiredRoleName} portal access requires a ${requiredRoleName} partner account.`,
        },
        { status: 403 }
      );
    }

    // 5. Secure HttpOnly cookie creation
    const response = NextResponse.json(
      {
        success: true,
        message: backendData.message || 'Login successful.',
        user,
      },
      { status: 200 }
    );

    setAuthCookie(response, token);
    return response;
  } catch (error: any) {
    const isNetworkError =
      error?.code === 'ECONNREFUSED' ||
      error?.name === 'FetchError' ||
      error?.message?.includes('fetch failed');

    return NextResponse.json(
      {
        success: false,
        error: 'NetworkError',
        message: isNetworkError
          ? 'Authentication service is temporarily unreachable. Please try again shortly.'
          : 'An unexpected error occurred during login.',
      },
      { status: 503 }
    );
  }
}
