import { NextRequest, NextResponse } from 'next/server';
import { CreateCheckInRequestSchema } from 'shared-types';
import { getApiBaseUrl } from '@/lib/api/config';
import { AUTH_COOKIE_NAME, clearAuthCookie } from '@/lib/auth/cookies';
import { validateCsrfOrigin } from '@/lib/auth/csrf';

/**
 * POST /api/check-ins
 * BFF proxy endpoint to initiate a check-in at a rest stop.
 */
export async function POST(request: NextRequest) {
  if (!validateCsrfOrigin(request)) {
    return NextResponse.json(
      { success: false, error: 'Forbidden', message: 'CSRF validation failed: Invalid request origin.' },
      { status: 403 }
    );
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized', message: 'Authentication required. Please log in as a rider.' },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'BadRequest', message: 'Malformed JSON payload in request body.' },
      { status: 400 }
    );
  }

  const parsed = CreateCheckInRequestSchema.safeParse(body);
  if (!parsed.success) {
    const errorMessages = parsed.error.errors.map((e) => e.message).join('; ');
    return NextResponse.json(
      { success: false, error: 'ValidationError', message: errorMessages },
      { status: 400 }
    );
  }

  try {
    const apiBaseUrl = getApiBaseUrl();
    const backendRes = await fetch(`${apiBaseUrl}/check-ins`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(parsed.data),
    });

    const backendData = await backendRes.json().catch(() => null);

    if (backendRes.status === 401) {
      const response = NextResponse.json(
        backendData || { success: false, error: 'Unauthorized', message: 'Session expired.' },
        { status: 401 }
      );
      clearAuthCookie(response);
      return response;
    }

    return NextResponse.json(backendData || { success: false, message: 'Unexpected response.' }, {
      status: backendRes.status,
    });
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
          ? 'Check-in service is currently unreachable.'
          : 'Failed to initiate check-in.',
      },
      { status: 503 }
    );
  }
}
