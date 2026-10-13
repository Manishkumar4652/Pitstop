import { NextRequest, NextResponse } from 'next/server';
import { Facility } from 'shared-types';
import { fetchPublicRestStops, ApiError, RestStopQueryParams } from '@/lib/api/rest-stops';

const ALLOWED_SORTS = ['newest', 'oldest', 'name_asc', 'name_desc', 'rating'] as const;

/**
 * GET /api/rest-stops
 * Server-side route handler for client-driven discovery queries.
 * Validates and allowlists incoming query parameters to prevent arbitrary proxying.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const pageStr = searchParams.get('page');
    const limitStr = searchParams.get('limit');
    const search = searchParams.get('search');
    const city = searchParams.get('city');
    const facilitiesParam = searchParams.get('facilities');
    const sortParam = searchParams.get('sort');

    const query: RestStopQueryParams = {};

    // Validate page
    if (pageStr) {
      const parsedPage = Number(pageStr);
      if (isNaN(parsedPage) || parsedPage < 1) {
        return NextResponse.json(
          { success: false, message: 'Invalid page parameter. Must be an integer >= 1.' },
          { status: 400 }
        );
      }
      query.page = parsedPage;
    }

    // Validate limit (bounded to 1-50)
    if (limitStr) {
      const parsedLimit = Number(limitStr);
      if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 50) {
        return NextResponse.json(
          { success: false, message: 'Invalid limit parameter. Must be between 1 and 50.' },
          { status: 400 }
        );
      }
      query.limit = parsedLimit;
    }

    // Sanitize search & city
    if (search && search.trim() !== '') {
      query.search = search.trim().slice(0, 100);
    }
    if (city && city.trim() !== '') {
      query.city = city.trim().slice(0, 100);
    }

    // Validate facilities
    if (facilitiesParam && facilitiesParam.trim() !== '') {
      const validFacilityValues = Object.values(Facility) as string[];
      const candidateList = facilitiesParam.split(',').map((f) => f.trim());
      const filtered = candidateList.filter((f) => validFacilityValues.includes(f));
      if (filtered.length > 0) {
        query.facilities = filtered as Facility[];
      }
    }

    // Validate sort allowlist
    if (sortParam && sortParam.trim() !== '') {
      const s = sortParam.trim();
      if (!ALLOWED_SORTS.includes(s as any)) {
        return NextResponse.json(
          {
            success: false,
            message: `Invalid sort parameter. Must be one of: ${ALLOWED_SORTS.join(', ')}.`,
          },
          { status: 400 }
        );
      }
      query.sort = s as (typeof ALLOWED_SORTS)[number];
    }

    const result = await fetchPublicRestStops(query);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    const statusCode = error instanceof ApiError ? error.statusCode : 500;
    const message = error.message || 'An unexpected error occurred while fetching rest stops.';

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: statusCode }
    );
  }
}
