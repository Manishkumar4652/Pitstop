import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/api/config';
import { AUTH_COOKIE_NAME, clearAuthCookie } from '@/lib/auth/cookies';

/**
 * GET /api/auth/me
 * BFF endpoint to validate session and return current user profile.
 * Reads HttpOnly cookie and validates with Express backend.
 */
export async function GET(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized', message: 'No active session.' },
      { status: 401 }
    );
  }

  try {
    const apiBaseUrl = getApiBaseUrl();
    const backendRes = await fetch(`${apiBaseUrl}/auth/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const backendData = await backendRes.json().catch(() => null);

    if (!backendRes.ok || !backendData || !backendData.success) {
      // Token is invalid or expired: clear cookie
      const response = NextResponse.json(
        {
          success: false,
          error: 'SessionExpired',
          message: 'Your session has expired. Please log in again.',
        },
        { status: 401 }
      );
      clearAuthCookie(response);
      return response;
    }

    return NextResponse.json({
      success: true,
      user: backendData.data.user,
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
          ? 'Authentication service is currently unreachable.'
          : 'Failed to verify session.',
      },
      { status: 503 }
    );
  }
}
