import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/api/config';
import { AUTH_COOKIE_NAME, clearAuthCookie } from '@/lib/auth/cookies';
import { validateCsrfOrigin } from '@/lib/auth/csrf';

interface RouteContext {
  params: {
    id: string;
  };
}

/**
 * POST /api/rider/applications/[id]/withdraw
 * Authenticated BFF endpoint for riders to withdraw their own pending micro-job application.
 * Proxies to Express API: POST /api/v1/rider/applications/:id/withdraw
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  // 1. CSRF Protection
  if (!validateCsrfOrigin(request)) {
    return NextResponse.json(
      { success: false, error: 'Forbidden', message: 'CSRF validation failed: Invalid request origin.' },
      { status: 403 }
    );
  }

  // 2. Auth Check via HttpOnly cookie
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized', message: 'Authentication required. Please log in as a delivery rider.' },
      { status: 401 }
    );
  }

  // 3. Application ID parameter validation
  const { id } = params;
  if (!id || !id.trim()) {
    return NextResponse.json(
      { success: false, error: 'BadRequest', message: 'Application ID is required.' },
      { status: 400 }
    );
  }

  // 4. Forward to Express Backend
  try {
    const apiBaseUrl = getApiBaseUrl();
    const targetUrl = `${apiBaseUrl}/rider/applications/${encodeURIComponent(id.trim())}/withdraw`;

    const backendRes = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    const backendData = await backendRes.json().catch(() => null);

    if (backendRes.status === 401) {
      const response = NextResponse.json(
        { success: false, error: 'Unauthorized', message: 'Session expired. Please log in again.' },
        { status: 401 }
      );
      clearAuthCookie(response);
      return response;
    }

    if (!backendRes.ok || !backendData || !backendData.success) {
      return NextResponse.json(
        {
          success: false,
          error: backendData?.error || 'WithdrawApplicationFailed',
          message: backendData?.message || 'Failed to withdraw application.',
          details: backendData?.details,
        },
        { status: backendRes.status || 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: backendData.data,
        message: backendData.message || 'Application withdrawn successfully.',
      },
      { status: 200 }
    );
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
          ? 'Backend applications service is currently unreachable.'
          : 'An unexpected error occurred while withdrawing the application.',
      },
      { status: 503 }
    );
  }
}
