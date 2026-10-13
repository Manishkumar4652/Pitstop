import { NextRequest, NextResponse } from 'next/server';
import { JobQuerySchema } from 'shared-types';
import { getApiBaseUrl } from '@/lib/api/config';

/**
 * GET /api/jobs
 * Public BFF endpoint to discover available, open micro-jobs.
 * Proxies to Express API: GET /api/v1/jobs
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawQuery = Object.fromEntries(searchParams.entries());

  const parseResult = JobQuerySchema.safeParse(rawQuery);
  if (!parseResult.success) {
    const errorDetails = parseResult.error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));
    return NextResponse.json(
      {
        success: false,
        error: 'ValidationError',
        message: 'Invalid query parameters provided for job discovery.',
        details: errorDetails,
      },
      { status: 400 }
    );
  }

  try {
    const apiBaseUrl = getApiBaseUrl();
    const validated = parseResult.data;

    const forwardParams = new URLSearchParams();
    if (validated.page) forwardParams.set('page', String(validated.page));
    if (validated.limit) forwardParams.set('limit', String(validated.limit));
    if (validated.search) forwardParams.set('search', validated.search);
    if (validated.category) forwardParams.set('category', validated.category);
    if (validated.restStopId) forwardParams.set('restStopId', validated.restStopId);
    if (validated.payType) forwardParams.set('payType', validated.payType);
    if (validated.minPay !== undefined && validated.minPay > 0) {
      forwardParams.set('minPay', String(validated.minPay));
    }
    if (validated.sort) forwardParams.set('sort', validated.sort);

    const queryString = forwardParams.toString();
    const targetUrl = `${apiBaseUrl}/jobs${queryString ? `?${queryString}` : ''}`;

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
          error: backendData?.error || 'FetchJobsFailed',
          message: backendData?.message || 'Failed to retrieve micro-jobs.',
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
          : 'An unexpected error occurred while fetching micro-jobs.',
      },
      { status: 503 }
    );
  }
}
