import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/api/config';
import { AUTH_COOKIE_NAME, clearAuthCookie } from '@/lib/auth/cookies';

interface RouteContext {
  params: {
    id: string;
  };
}

/**
 * GET /api/merchant/jobs/[id]/applications
 * BFF endpoint to list applicants for an owned micro-job.
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
    const { searchParams } = new URL(request.url);
    const apiBaseUrl = getApiBaseUrl();

    const forwardParams = new URLSearchParams();
    const page = searchParams.get('page');
    const limit = searchParams.get('limit');
    const status = searchParams.get('status');
    const sort = searchParams.get('sort');

    if (page) forwardParams.set('page', page);
    if (limit) forwardParams.set('limit', limit);
    if (status) forwardParams.set('status', status);
    if (sort) forwardParams.set('sort', sort);

    const queryString = forwardParams.toString();
    const targetUrl = `${apiBaseUrl}/merchant/jobs/${encodeURIComponent(id.trim())}/applications${queryString ? `?${queryString}` : ''}`;

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
          error: backendData?.error || 'MerchantApplicantsError',
          message: backendData?.message || 'Failed to retrieve applicants.',
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
          : 'An unexpected error occurred while fetching applicants.',
      },
      { status: 503 }
    );
  }
}
