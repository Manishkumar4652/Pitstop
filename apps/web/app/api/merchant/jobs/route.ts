import { NextRequest, NextResponse } from 'next/server';
import { CreateJobRequestSchema, MerchantJobQuerySchema } from 'shared-types';
import { getApiBaseUrl } from '@/lib/api/config';
import { AUTH_COOKIE_NAME, clearAuthCookie } from '@/lib/auth/cookies';
import { validateCsrfOrigin } from '@/lib/auth/csrf';

/**
 * GET /api/merchant/jobs
 * BFF endpoint to list only the authenticated merchant's own micro-jobs.
 */
export async function GET(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized', message: 'Authentication required. Please log in as a merchant partner.' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const rawQuery = Object.fromEntries(searchParams.entries());
  const queryResult = MerchantJobQuerySchema.safeParse(rawQuery);
  if (!queryResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: 'ValidationError',
        message: 'Invalid query parameters provided.',
        details: queryResult.error.errors,
      },
      { status: 400 }
    );
  }

  try {
    const apiBaseUrl = getApiBaseUrl();

    const forwardParams = new URLSearchParams();
    const validated = queryResult.data;
    if (validated.page) forwardParams.set('page', String(validated.page));
    if (validated.limit) forwardParams.set('limit', String(validated.limit));
    if (validated.status && validated.status !== 'all') forwardParams.set('status', validated.status);
    if (validated.category) forwardParams.set('category', validated.category);
    if (validated.restStopId) forwardParams.set('restStopId', validated.restStopId);
    if (validated.search) forwardParams.set('search', validated.search);

    const queryString = forwardParams.toString();
    const targetUrl = `${apiBaseUrl}/merchant/jobs${queryString ? `?${queryString}` : ''}`;

    const backendRes = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
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
          error: backendData?.error || 'MerchantJobsError',
          message: backendData?.message || 'Failed to retrieve micro-jobs.',
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
          : 'An unexpected error occurred while fetching micro-jobs.',
      },
      { status: 503 }
    );
  }
}

/**
 * POST /api/merchant/jobs
 * BFF endpoint to create a micro-job.
 * Enforces CSRF validation and validates input schema before proxying to Express backend.
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

  const parseResult = CreateJobRequestSchema.safeParse(body);
  if (!parseResult.success) {
    const issues = parseResult.error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return NextResponse.json(
      {
        success: false,
        error: 'ValidationError',
        message: 'Job creation payload failed schema validation.',
        details: issues,
      },
      { status: 400 }
    );
  }

  try {
    const apiBaseUrl = getApiBaseUrl();
    const targetUrl = `${apiBaseUrl}/jobs`;

    const backendRes = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(parseResult.data),
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
          error: backendData?.error || 'CreateJobError',
          message: backendData?.message || 'Failed to create micro-job.',
          details: backendData?.details,
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
          : 'An unexpected error occurred while creating micro-job.',
      },
      { status: 503 }
    );
  }
}
