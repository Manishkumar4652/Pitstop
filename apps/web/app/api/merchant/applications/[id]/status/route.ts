import { NextRequest, NextResponse } from 'next/server';
import { UpdateJobApplicationStatusSchema } from 'shared-types';
import { getApiBaseUrl } from '@/lib/api/config';
import { AUTH_COOKIE_NAME, clearAuthCookie } from '@/lib/auth/cookies';
import { validateCsrfOrigin } from '@/lib/auth/csrf';

interface RouteContext {
  params: {
    id: string;
  };
}

/**
 * PATCH /api/merchant/applications/[id]/status
 * BFF endpoint to accept or reject an applicant for a merchant's micro-job.
 * Proxies to Express API: PATCH /api/v1/merchant/applications/:id/status
 */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
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
      { success: false, error: 'Unauthorized', message: 'Authentication required. Please log in as a merchant partner.' },
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

  // 4. Request Body Validation
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'BadRequest', message: 'Invalid JSON request body.' },
      { status: 400 }
    );
  }

  const parseResult = UpdateJobApplicationStatusSchema.safeParse(body);
  if (!parseResult.success) {
    const errorDetails = parseResult.error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
    }));
    return NextResponse.json(
      {
        success: false,
        error: 'ValidationError',
        message: parseResult.error.errors[0]?.message || 'Invalid application status update request.',
        details: errorDetails,
      },
      { status: 400 }
    );
  }

  // 5. Forward to Express Backend
  try {
    const apiBaseUrl = getApiBaseUrl();
    const targetUrl = `${apiBaseUrl}/merchant/applications/${encodeURIComponent(id.trim())}/status`;

    const backendRes = await fetch(targetUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(parseResult.data),
      cache: 'no-store',
    });

    const backendData = await backendRes.json().catch(() => null);

    // Handle token expiry / invalidation
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
          error: backendData?.error || 'UpdateApplicationStatusFailed',
          message:
            backendData?.message ||
            (backendRes.status === 409
              ? 'Capacity conflict or stale application status.'
              : 'Failed to update application status.'),
          details: backendData?.details,
        },
        { status: backendRes.status || 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: backendData.data,
        message: backendData.message || `Application status updated to ${parseResult.data.status}.`,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('Error in PATCH /api/merchant/applications/[id]/status BFF:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'InternalServerError',
        message: 'A network error occurred while communicating with the service.',
      },
      { status: 502 }
    );
  }
}
