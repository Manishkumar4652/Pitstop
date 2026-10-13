import {
  Facility,
  CapacityStatus,
  Address,
  Location,
  OperatingHours,
  RestStopPublicResponse,
  PaginationMeta,
} from 'shared-types';
import { getApiBaseUrl, isDemoFallbackAllowed } from './config';
import { DEMO_REST_STOPS, DemoRestStop, getDemoRestStopBySlug } from '../data/rest-stops';

/**
 * Unified display model for UI rendering across live backend DTOs and demo datasets.
 */
export interface RestStopDisplayItem {
  id: string;
  slug: string;
  name: string;
  merchantName?: string;
  venueType?: string;
  description: string;
  address: Address;
  location: Location;
  facilities: Facility[];
  images: string[];
  capacity: {
    maxRiders: number;
    currentOccupancy: number;
    status: CapacityStatus;
  };
  operatingHours: OperatingHours[];
  rating: {
    average: number;
    count: number;
  };
  dealBadge?: string;
  dealDescription?: string;
  isDemoData: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Maps a public backend REST DTO into the display model.
 * Zero-fabrication principle: fields not returned by the backend (merchant identity, venue category)
 * remain undefined rather than populated with synthetic data.
 */
export function mapPublicRestStopToDisplay(doc: RestStopPublicResponse): RestStopDisplayItem {
  return {
    id: doc.id,
    slug: doc.slug,
    name: doc.name,
    merchantName: undefined, // Preserves merchant privacy as designed in backend DTO
    venueType: undefined,
    description: doc.description,
    address: doc.address,
    location: doc.location,
    facilities: doc.facilities,
    images: doc.images || [],
    capacity: doc.capacity,
    operatingHours: doc.operatingHours || [],
    rating: doc.rating,
    dealBadge: doc.dealBadge,
    dealDescription: doc.dealDescription,
    isDemoData: false,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

/**
 * Custom error hierarchy to distinguish operational HTTP errors from transport/network faults.
 */
export class ApiError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(message: string, statusCode: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class ApiNotFoundError extends ApiError {
  constructor(message = 'Rest stop not found') {
    super(message, 404);
    this.name = 'ApiNotFoundError';
  }
}

export class ApiNetworkError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'ApiNetworkError';
  }
}

export interface RestStopQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  city?: string;
  facilities?: Facility[] | string;
  sort?: 'newest' | 'oldest' | 'name_asc' | 'name_desc' | 'rating';
}

export interface PublicRestStopsResult {
  items: RestStopDisplayItem[];
  pagination: PaginationMeta;
  isDemoFallback: boolean;
}

/**
 * Filters the offline demo dataset when fallback is explicitly permitted in development.
 */
function filterDemoRestStops(params?: RestStopQueryParams): PublicRestStopsResult {
  let list = [...DEMO_REST_STOPS];

  const page = Math.max(1, Number(params?.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(params?.limit) || 10));

  // City filter
  if (params?.city && params.city.trim() !== '') {
    const cityLower = params.city.trim().toLowerCase();
    list = list.filter((s) => s.address.city.toLowerCase() === cityLower);
  }

  // Facility filter (strict AND logic matching backend)
  if (params?.facilities) {
    const requested = Array.isArray(params.facilities)
      ? params.facilities
      : (params.facilities.split(',').map((f) => f.trim()) as Facility[]);

    if (requested.length > 0) {
      list = list.filter((s) => requested.every((fac) => s.facilities.includes(fac)));
    }
  }

  // Search filter
  if (params?.search && params.search.trim() !== '') {
    const q = params.search.trim().toLowerCase();
    list = list.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.address.area.toLowerCase().includes(q) ||
        s.address.city.toLowerCase().includes(q) ||
        s.address.street.toLowerCase().includes(q)
    );
  }

  // Sort
  const sort = params?.sort || 'newest';
  if (sort === 'rating') {
    list.sort((a, b) => b.rating.average - a.rating.average);
  } else if (sort === 'name_asc') {
    list.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sort === 'name_desc') {
    list.sort((a, b) => b.name.localeCompare(a.name));
  }

  const total = list.length;
  const skip = (page - 1) * limit;
  const paginated = list.slice(skip, skip + limit);

  return {
    items: paginated,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
    isDemoFallback: true,
  };
}

/**
 * Fetches public rest stops from the backend API.
 * In development, safely falls back to demo data only if PITSTOP_ENABLE_DEMO_FALLBACK === 'true'.
 * In production, strictly throws on failures to prevent silent demo masquerading.
 */
export async function fetchPublicRestStops(
  params?: RestStopQueryParams
): Promise<PublicRestStopsResult> {
  const baseUrl = getApiBaseUrl();
  const qs = new URLSearchParams();

  if (params?.page) {
    qs.set('page', String(Math.max(1, params.page)));
  }
  if (params?.limit) {
    qs.set('limit', String(Math.min(50, Math.max(1, params.limit))));
  }
  if (params?.search && params.search.trim() !== '') {
    qs.set('search', params.search.trim());
  }
  if (params?.city && params.city.trim() !== '') {
    qs.set('city', params.city.trim());
  }
  if (params?.facilities) {
    const facString = Array.isArray(params.facilities)
      ? params.facilities.join(',')
      : params.facilities;
    if (facString.trim() !== '') {
      qs.set('facilities', facString.trim());
    }
  }
  if (params?.sort) {
    qs.set('sort', params.sort);
  }

  const url = `${baseUrl}/rest-stops${qs.toString() ? `?${qs.toString()}` : ''}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
      },
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      let errorMessage = `API request failed with status ${res.status}`;
      try {
        const errJson = await res.json();
        if (errJson && errJson.message) errorMessage = errJson.message;
      } catch {}
      throw new ApiError(errorMessage, res.status);
    }

    const payload = await res.json();
    if (!payload || typeof payload !== 'object' || payload.success !== true || !payload.data) {
      throw new ApiError('Invalid response envelope from backend API', 502);
    }

    const { items, pagination } = payload.data;

    return {
      items: Array.isArray(items) ? items.map(mapPublicRestStopToDisplay) : [],
      pagination: pagination || {
        page: params?.page || 1,
        limit: params?.limit || 10,
        total: items?.length || 0,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
      isDemoFallback: false,
    };
  } catch (err: unknown) {
    clearTimeout(timeoutId);

    // If demo fallback is allowed (development only and enabled), use demo data
    if (isDemoFallbackAllowed()) {
      return filterDemoRestStops(params);
    }

    if (err instanceof ApiError) {
      throw err;
    }

    throw new ApiNetworkError('Failed to connect to backend rest-stop API service', err);
  }
}

/**
 * Fetches a single public rest stop by slug from the backend API.
 * Genuine 404s throw ApiNotFoundError.
 */
export async function fetchPublicRestStopBySlug(
  slug: string
): Promise<{ item: RestStopDisplayItem; isDemoFallback: boolean }> {
  const sanitizedSlug = encodeURIComponent(slug.trim());
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/rest-stops/${sanitizedSlug}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
      },
    });
    clearTimeout(timeoutId);

    if (res.status === 404) {
      throw new ApiNotFoundError(`Rest stop with slug '${slug}' was not found or is not active.`);
    }

    if (!res.ok) {
      let errorMessage = `API request failed with status ${res.status}`;
      try {
        const errJson = await res.json();
        if (errJson && errJson.message) errorMessage = errJson.message;
      } catch {}
      throw new ApiError(errorMessage, res.status);
    }

    const payload = await res.json();
    if (!payload || typeof payload !== 'object' || payload.success !== true || !payload.data) {
      throw new ApiError('Invalid response envelope from backend API', 502);
    }

    return {
      item: mapPublicRestStopToDisplay(payload.data),
      isDemoFallback: false,
    };
  } catch (err: unknown) {
    clearTimeout(timeoutId);

    // Genuine 404s: in dev mode, if demo fallback is enabled AND demo slug exists, allow demo preview
    if (err instanceof ApiNotFoundError) {
      if (isDemoFallbackAllowed()) {
        const demo = getDemoRestStopBySlug(slug);
        if (demo) {
          return { item: demo, isDemoFallback: true };
        }
      }
      throw err;
    }

    // Server or network error
    if (isDemoFallbackAllowed()) {
      const demo = getDemoRestStopBySlug(slug);
      if (demo) {
        return { item: demo, isDemoFallback: true };
      }
    }

    if (err instanceof ApiError) {
      throw err;
    }

    throw new ApiNetworkError(`Failed to connect to backend API for rest stop '${slug}'`, err);
  }
}
