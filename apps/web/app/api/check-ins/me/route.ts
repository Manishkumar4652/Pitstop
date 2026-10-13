import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/api/config';
import { AUTH_COOKIE_NAME, clearAuthCookie } from '@/lib/auth/cookies';

/**
 * GET /api/check-ins/me
 * BFF proxy endpoint to retrieve authenticated rider's check-in history.
 */
export async function GET(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized', message: 'Authentication required. Please log in.' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const page = searchParams.get('page') || '1';
  const limit = searchParams.get('limit') || '10';
  const status = searchParams.get('status');
  const sort = searchParams.get('sort') || 'newest';

  const queryParams = new URLSearchParams({
    page,
    limit,
    sort,
    ...(status && { status }),
  });

  try {
    const apiBaseUrl = getApiBaseUrl();
    const backendRes = await fetch(`${apiBaseUrl}/check-ins/me?${queryParams.toString()}`, {
      method: 'GET',
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
          : 'Failed to retrieve check-in history.',
      },
      { status: 503 }
    );
  }
}
