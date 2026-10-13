import { NextRequest, NextResponse } from 'next/server';
import { UpdateJobRequestSchema } from 'shared-types';
import { getApiBaseUrl } from '@/lib/api/config';
import { AUTH_COOKIE_NAME, clearAuthCookie } from '@/lib/auth/cookies';
import { validateCsrfOrigin } from '@/lib/auth/csrf';

interface RouteContext {
  params: {
    id: string;
  };
}

/**
 * GET /api/merchant/jobs/[id]
 * BFF endpoint to retrieve a single micro-job owned by the authenticated merchant.
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized', message: 'Authentication required. Please log in as a merchant partner.' },
      { status: 401 }
    );
  }

  const { id } = params;
  if (!id || !id.trim()) {
    return NextResponse.json(
      { success: false, error: 'BadRequest', message: 'Job ID is required.' },
      { status: 400 }
    );
  }

  try {
    const apiBaseUrl = getApiBaseUrl();
    const targetUrl = `${apiBaseUrl}/merchant/jobs/${encodeURIComponent(id.trim())}`;

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
          error: backendData?.error || 'MerchantJobError',
          message: backendData?.message || 'Failed to retrieve micro-job detail.',
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
          : 'An unexpected error occurred while fetching micro-job detail.',
      },
      { status: 503 }
    );
  }
}

/**
 * PATCH /api/merchant/jobs/[id]
 * BFF endpoint to update an owned micro-job.
 * Enforces CSRF validation, validates input schema, rejects empty payloads before calling backend.
 */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
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

  const { id } = params;
  if (!id || !id.trim()) {
    return NextResponse.json(
      { success: false, error: 'BadRequest', message: 'Job ID is required.' },
      { status: 400 }
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

  if (!body || typeof body !== 'object' || Object.keys(body).length === 0) {
    return NextResponse.json(
      { success: false, error: 'BadRequest', message: 'Update payload cannot be empty.' },
      { status: 400 }
    );
  }

  const parseResult = UpdateJobRequestSchema.safeParse(body);
  if (!parseResult.success) {
    const issues = parseResult.error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return NextResponse.json(
      {
        success: false,
        error: 'ValidationError',
        message: 'Job update payload failed schema validation.',
        details: issues,
      },
      { status: 400 }
    );
  }

  try {
    const apiBaseUrl = getApiBaseUrl();
    const targetUrl = `${apiBaseUrl}/jobs/${encodeURIComponent(id.trim())}`;

    const backendRes = await fetch(targetUrl, {
      method: 'PATCH',
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
          error: backendData?.error || 'UpdateJobError',
          message: backendData?.message || 'Failed to update micro-job.',
          details: backendData?.details,
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
          : 'An unexpected error occurred while updating micro-job.',
      },
      { status: 503 }
    );
  }
}
