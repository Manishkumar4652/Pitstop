import { NextRequest, NextResponse } from 'next/server';
import { AdminUpdateMerchantStatusSchema } from 'shared-types';
import { getApiBaseUrl } from '@/lib/api/config';
import { AUTH_COOKIE_NAME, clearAuthCookie } from '@/lib/auth/cookies';
import { validateCsrfOrigin } from '@/lib/auth/csrf';

/**
 * PATCH /api/admin/merchants/[id]/status
 * BFF endpoint to approve, reject, or suspend a merchant.
 * Protected by CSRF origin verification and HttpOnly session cookie.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // CSRF validation
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
      { success: false, error: 'BadRequest', message: 'Merchant ID is required.' },
      { status: 400 }
    );
  }

  try {
    const rawBody = await request.json().catch(() => null);
    const parsed = AdminUpdateMerchantStatusSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'ValidationError',
          message: parsed.error.errors[0]?.message || 'Invalid merchant status payload.',
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const apiBaseUrl = getApiBaseUrl();
    const targetUrl = `${apiBaseUrl}/admin/merchants/${encodeURIComponent(id)}/status`;

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
          error: backendData?.error || 'AdminMerchantModerationError',
          message: backendData?.message || 'Failed to update merchant verification status.',
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
