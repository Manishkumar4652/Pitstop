import { NextRequest, NextResponse } from 'next/server';
import { CreateRestStopRequestSchema } from 'shared-types';
import { getApiBaseUrl } from '@/lib/api/config';
import { AUTH_COOKIE_NAME, clearAuthCookie } from '@/lib/auth/cookies';
import { validateCsrfOrigin } from '@/lib/auth/csrf';

/**
 * GET /api/merchant/rest-stops
 * BFF endpoint to list rest stops owned by the authenticated merchant.
 * Attaches the HttpOnly session token.
 */
export async function GET(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized', message: 'Authentication required. Please log in as a merchant partner.' },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const apiBaseUrl = getApiBaseUrl();
    const targetUrl = new URL(`${apiBaseUrl}/merchant/rest-stops`);

    // Forward safe query params
    const page = searchParams.get('page');
    const limit = searchParams.get('limit');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    if (page) targetUrl.searchParams.set('page', page);
    if (limit) targetUrl.searchParams.set('limit', limit);
    if (status) targetUrl.searchParams.set('status', status);
    if (search) targetUrl.searchParams.set('search', search);

    const backendRes = await fetch(targetUrl.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
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
          error: backendData?.error || 'MerchantRestStopError',
          message: backendData?.message || 'Failed to retrieve merchant rest stops.',
        },
        { status: backendRes.status || 500 }
      );
    }

    return NextResponse.json(backendData, { status: 200 });
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
          ? 'Merchant backend service is currently unreachable.'
          : 'An unexpected error occurred while fetching merchant rest stops.',
      },
      { status: 503 }
    );
  }
}

/**
 * POST /api/merchant/rest-stops
 * BFF endpoint for an authenticated merchant to register a new rest stop.
 * Enforces CSRF validation, validates input using CreateRestStopRequestSchema, and forwards to backend.
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
      { success: false, error: 'Unauthorized', message: 'Authentication required. Please log in as a merchant partner.' },
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

  const parsed = CreateRestStopRequestSchema.safeParse(body);
  if (!parsed.success) {
    const errorMessages = parsed.error.errors.map((e) => e.message).join('; ');
    return NextResponse.json(
      { success: false, error: 'ValidationError', message: errorMessages },
      { status: 400 }
    );
  }

  try {
    const apiBaseUrl = getApiBaseUrl();
    const backendRes = await fetch(`${apiBaseUrl}/rest-stops`, {
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
          error: backendData?.error || 'CreateRestStopError',
          message: backendData?.message || 'Failed to create rest stop.',
        },
        { status: backendRes.status || 500 }
      );
    }

    return NextResponse.json(backendData, { status: 201 });
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
          ? 'Merchant backend service is currently unreachable.'
          : 'An unexpected error occurred while creating rest stop.',
      },
      { status: 503 }
    );
  }
}
