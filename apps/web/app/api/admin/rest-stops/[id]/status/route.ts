import { NextRequest, NextResponse } from 'next/server';
import { AdminUpdateRestStopStatusSchema } from 'shared-types';
import { getApiBaseUrl } from '@/lib/api/config';
import { AUTH_COOKIE_NAME, clearAuthCookie } from '@/lib/auth/cookies';
import { validateCsrfOrigin } from '@/lib/auth/csrf';

/**
 * PATCH /api/admin/rest-stops/[id]/status
 * BFF endpoint to approve or suspend a rest stop.
 * Protected by CSRF origin verification and HttpOnly session cookie.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!validateCsrfOrigin(request)) {
    return NextResponse.json(
      { success: false, error: 'Forbidden', message: 'Cross-site request forgery protection rejected this request.' },
      { status: 403 }
    );
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized', message: 'Authentication required. Admin privileges needed.' },
      { status: 401 }
    );
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { success: false, error: 'BadRequest', message: 'Rest stop ID is required.' },
      { status: 400 }
    );
  }

  try {
    const rawBody = await request.json().catch(() => null);
    const parsed = AdminUpdateRestStopStatusSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'ValidationError',
          message: parsed.error.errors[0]?.message || 'Invalid rest stop status payload.',
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const apiBaseUrl = getApiBaseUrl();
    const targetUrl = `${apiBaseUrl}/admin/rest-stops/${encodeURIComponent(id)}/status`;

    const backendRes = await fetch(targetUrl, {
      method: 'PATCH',
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
          error: backendData?.error || 'AdminRestStopModerationError',
          message: backendData?.message || 'Failed to update rest stop status.',
        },
        { status: backendRes.status || 500 }
      );
    }

    return NextResponse.json(backendData, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'AdminGatewayError',
        message: 'Could not connect to the API service. Please try again later.',
      },
      { status: 502 }
    );
  }
}
