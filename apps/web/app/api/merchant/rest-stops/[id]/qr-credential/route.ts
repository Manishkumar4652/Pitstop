import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/api/config';
import { AUTH_COOKIE_NAME, clearAuthCookie } from '@/lib/auth/cookies';

interface RouteContext {
  params: Promise<{ id: string }> | { id: string };
}

/**
 * GET /api/merchant/rest-stops/[id]/qr-credential
 * BFF proxy endpoint to retrieve a venue's cryptographic QR credential.
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized', message: 'Authentication required. Please log in as a merchant partner.' },
      { status: 401 }
    );
  }

  const resolvedParams = await Promise.resolve(params);
  const id = resolvedParams?.id;
  if (!id) {
    return NextResponse.json(
      { success: false, error: 'BadRequest', message: 'Rest stop ID is required.' },
      { status: 400 }
    );
  }

  try {
    const apiBaseUrl = getApiBaseUrl();
    const backendRes = await fetch(`${apiBaseUrl}/merchant/rest-stops/${id}/qr-credential`, {
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
          error: backendData?.error || 'VenueQrCredentialError',
          message: backendData?.message || 'Failed to retrieve venue QR credential.',
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
          : 'An unexpected error occurred while fetching venue QR credential.',
      },
      { status: 503 }
    );
  }
}
