import { NextRequest, NextResponse } from 'next/server';
import { RegisterRequestSchema, UserRole } from 'shared-types';
import { getApiBaseUrl } from '@/lib/api/config';
import { setAuthCookie } from '@/lib/auth/cookies';
import { validateCsrfOrigin } from '@/lib/auth/csrf';

/**
 * POST /api/auth/register
 * BFF endpoint for rider registration.
 * Issues a secure HttpOnly session cookie on successful registration without exposing raw JWT to client JS.
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

    // Reject explicitly if rawBody attempted to supply admin
    if ((rawBody.role as string) === UserRole.ADMIN || (rawBody.role as string) === 'admin') {
      return NextResponse.json(
        { success: false, error: 'BadRequestError', message: 'Admin registration is strictly prohibited.' },
        { status: 400 }
      );
    }

    const assignedRole = rawBody.role === UserRole.MERCHANT ? UserRole.MERCHANT : UserRole.RIDER;

    // 2. Client-side Zod validation against shared schema
    const parseResult = RegisterRequestSchema.safeParse({
      ...rawBody,
      role: assignedRole,
    });

    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      return NextResponse.json(
        {
          success: false,
          error: 'ValidationError',
          message: issue ? `${issue.path.join('.')}: ${issue.message}` : 'Invalid registration input.',
        },
        { status: 400 }
      );
    }

    const payload = parseResult.data;

    // 3. Forward request to Express backend
    const apiBaseUrl = getApiBaseUrl();
    const backendRes = await fetch(`${apiBaseUrl}/auth/register`, {
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
        backendData?.message ||
        (status === 409
          ? 'An account with this phone number or email already exists.'
          : status === 429
          ? 'Too many registration requests. Please try again later.'
          : 'Registration failed. Please check your details and try again.');

      return NextResponse.json(
        {
          success: false,
          error: backendData?.error || 'RegistrationError',
          message,
        },
        { status }
      );
    }

    // 4. Secure HttpOnly cookie creation
    const { token, user } = backendData.data;
    const response = NextResponse.json(
      {
        success: true,
        message: backendData.message || 'Account registered successfully.',
        user,
      },
      { status: 201 }
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
          : 'An unexpected error occurred during registration.',
      },
      { status: 503 }
    );
  }
}
