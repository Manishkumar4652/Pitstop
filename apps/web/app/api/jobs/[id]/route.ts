import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/api/config';

interface RouteContext {
  params: {
    id: string;
  };
}

/**
 * GET /api/jobs/[id]
 * Public BFF endpoint to retrieve a single micro-job by ID.
 * Proxies to Express API: GET /api/v1/jobs/:id
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  const { id } = params;
  if (!id || !id.trim()) {
    return NextResponse.json(
      { success: false, error: 'BadRequest', message: 'Job ID is required.' },
      { status: 400 }
    );
  }

  try {
    const apiBaseUrl = getApiBaseUrl();
    const targetUrl = `${apiBaseUrl}/jobs/${encodeURIComponent(id.trim())}`;

    const backendRes = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    const backendData = await backendRes.json().catch(() => null);

    if (!backendRes.ok || !backendData || !backendData.success) {
      return NextResponse.json(
        {
          success: false,
          error: backendData?.error || (backendRes.status === 404 ? 'NotFound' : 'FetchJobFailed'),
          message: backendData?.message || (backendRes.status === 404 ? 'Job not found.' : 'Failed to retrieve job details.'),
          details: backendData?.details,
        },
        { status: backendRes.status || 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: backendData.data,
      },
      { status: 200 }
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
          : 'An unexpected error occurred while fetching job details.',
      },
      { status: 503 }
    );
  }
}
