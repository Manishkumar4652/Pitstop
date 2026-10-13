import { NextRequest, NextResponse } from 'next/server';
import { RiderJobApplicationQuerySchema } from 'shared-types';
import { getApiBaseUrl } from '@/lib/api/config';
import { AUTH_COOKIE_NAME, clearAuthCookie } from '@/lib/auth/cookies';

/**
 * GET /api/rider/applications
 * Authenticated BFF endpoint for riders to list their own job applications.
 * Proxies to Express API: GET /api/v1/rider/applications
 */
export async function GET(request: NextRequest) {
  // 1. Auth Check via HttpOnly cookie
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized', message: 'Authentication required. Please log in as a delivery rider.' },
      { status: 401 }
    );
  }

  // 2. Query Parameter Validation
  const { searchParams } = new URL(request.url);
  const rawQuery = Object.fromEntries(searchParams.entries());

  const parseResult = RiderJobApplicationQuerySchema.safeParse(rawQuery);
  if (!parseResult.success) {
    const errorDetails = parseResult.error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));
    return NextResponse.json(
      {
        success: false,
        error: 'ValidationError',
        message: 'Invalid query parameters provided for application history.',
        details: errorDetails,
      },
      { status: 400 }
    );
  }

  // 3. Forward to Express Backend
  try {
    const apiBaseUrl = getApiBaseUrl();
    const validated = parseResult.data;

    const forwardParams = new URLSearchParams();
    if (validated.page) forwardParams.set('page', String(validated.page));
    if (validated.limit) forwardParams.set('limit', String(validated.limit));
    if (validated.status && validated.status !== 'all') forwardParams.set('status', validated.status);

    const queryString = forwardParams.toString();
    const targetUrl = `${apiBaseUrl}/rider/applications${queryString ? `?${queryString}` : ''}`;

    const backendRes = await fetch(targetUrl, {
      method: 'GET',
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
          error: backendData?.error || 'FetchApplicationsFailed',
          message: backendData?.message || 'Failed to retrieve application history.',
          details: backendData?.details,
        },
        { status: backendRes.status || 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: backendData.data,
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
          : 'An unexpected error occurred while fetching application history.',
      },
      { status: 503 }
    );
  }
}
