import { NextRequest, NextResponse } from 'next/server';
import { ApplyJobRequestSchema } from 'shared-types';
import { getApiBaseUrl } from '@/lib/api/config';
import { AUTH_COOKIE_NAME, clearAuthCookie } from '@/lib/auth/cookies';
import { validateCsrfOrigin } from '@/lib/auth/csrf';

interface RouteContext {
  params: {
    id: string;
  };
}

/**
 * POST /api/jobs/[id]/apply
 * Authenticated BFF endpoint for riders to apply to a micro-job.
 * Proxies to Express API: POST /api/v1/jobs/:id/apply
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

  // 3. Job ID parameter validation
  const { id } = params;
  if (!id || !id.trim()) {
    return NextResponse.json(
      { success: false, error: 'BadRequest', message: 'Job ID is required.' },
      { status: 400 }
    );
  }

  // 4. Request Body Validation
  let body: unknown = {};
  const text = await request.text().catch(() => '');
  if (text.trim()) {
    try {
      body = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { success: false, error: 'BadRequest', message: 'Invalid JSON request body.' },
        { status: 400 }
      );
    }
  }

  const parseResult = ApplyJobRequestSchema.safeParse(body);
  if (!parseResult.success) {
    const errorDetails = parseResult.error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));
    return NextResponse.json(
      {
        success: false,
        error: 'ValidationError',
        message: parseResult.error.errors[0]?.message || 'Invalid application payload.',
        details: errorDetails,
      },
      { status: 400 }
    );
  }

  // 5. Forward to Express Backend
  try {
    const apiBaseUrl = getApiBaseUrl();
    const targetUrl = `${apiBaseUrl}/jobs/${encodeURIComponent(id.trim())}/apply`;

    const backendRes = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(parseResult.data),
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
          error: backendData?.error || 'ApplyJobFailed',
          message: backendData?.message || 'Failed to submit application for this micro-job.',
          details: backendData?.details,
        },
        { status: backendRes.status || 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: backendData.data,
        message: backendData.message || 'Application submitted successfully!',
      },
      { status: 201 }
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
          ? 'Backend jobs service is currently unreachable.'
          : 'An unexpected error occurred while applying for the job.',
      },
      { status: 503 }
    );
  }
}
