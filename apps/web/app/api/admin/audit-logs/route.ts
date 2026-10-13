import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/api/config';
import { AUTH_COOKIE_NAME, clearAuthCookie } from '@/lib/auth/cookies';

/**
 * GET /api/admin/audit-logs
 * BFF endpoint to retrieve system moderation audit history.
 */
export async function GET(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized', message: 'Authentication required. Admin privileges needed.' },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const apiBaseUrl = getApiBaseUrl();
    const targetUrl = new URL(`${apiBaseUrl}/admin/audit-logs`);

    const page = searchParams.get('page');
    const limit = searchParams.get('limit');
    const targetType = searchParams.get('targetType');
    const action = searchParams.get('action');

    if (page) targetUrl.searchParams.set('page', page);
    if (limit) targetUrl.searchParams.set('limit', limit);
    if (targetType) targetUrl.searchParams.set('targetType', targetType);
    if (action) targetUrl.searchParams.set('action', action);

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
          error: backendData?.error || 'AdminAuditLogsError',
          message: backendData?.message || 'Failed to retrieve moderation audit logs.',
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
