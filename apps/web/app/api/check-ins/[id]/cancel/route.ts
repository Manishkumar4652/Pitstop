import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/api/config';
import { AUTH_COOKIE_NAME, clearAuthCookie } from '@/lib/auth/cookies';
import { validateCsrfOrigin } from '@/lib/auth/csrf';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * POST /api/check-ins/[id]/cancel
 * BFF proxy endpoint for rider to cancel their own pending check-in.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!validateCsrfOrigin(request)) {
    return NextResponse.json(
      { success: false, error: 'Forbidden', message: 'CSRF validation failed: Invalid request origin.' },
      { status: 403 }
    );
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized', message: 'Authentication required. Please log in.' },
      { status: 401 }
    );
  }

  const checkInId = params.id?.trim();
  if (!checkInId) {
    return NextResponse.json(
      { success: false, error: 'BadRequest', message: 'Check-in ID is required.' },
      { status: 400 }
    );
  }

  try {
    const apiBaseUrl = getApiBaseUrl();
    const backendRes = await fetch(`${apiBaseUrl}/check-ins/${encodeURIComponent(checkInId)}/cancel`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
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
          : 'Failed to cancel check-in.',
      },
      { status: 503 }
    );
  }
}
