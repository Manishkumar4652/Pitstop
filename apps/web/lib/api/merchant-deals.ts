import {
  CreateDealRequest,
  UpdateDealRequest,
  DealMerchantResponse,
  PaginationMeta,
} from 'shared-types';

export class MerchantDealApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public errorCode?: string
  ) {
    super(message);
    this.name = 'MerchantDealApiError';
  }
}

export interface FetchMerchantDealsParams {
  page?: number;
  limit?: number;
  status?: 'all' | 'active' | 'inactive' | 'expired';
  restStopId?: string;
  search?: string;
}

export interface FetchMerchantDealsResponse {
  items: DealMerchantResponse[];
  pagination: PaginationMeta;
}

/**
 * Client helper to list only the authenticated merchant's own deals.
 * Calls Next.js BFF GET /api/merchant/deals
 */
export async function fetchMerchantDeals(
  params: FetchMerchantDealsParams = {}
): Promise<FetchMerchantDealsResponse> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', params.page.toString());
  if (params.limit) query.set('limit', params.limit.toString());
  if (params.status && params.status !== 'all') query.set('status', params.status);
  if (params.restStopId) query.set('restStopId', params.restStopId);
  if (params.search) query.set('search', params.search);

  const qs = query.toString();
  const url = `/api/merchant/deals${qs ? `?${qs}` : ''}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  const body = await res.json().catch(() => null);

  if (!res.ok || !body || !body.success) {
    throw new MerchantDealApiError(
      body?.message || 'Failed to retrieve merchant deals.',
      res.status,
      body?.error
    );
  }

  return body.data;
}

/**
 * Client helper to fetch a single deal owned by the authenticated merchant.
 * Calls Next.js BFF GET /api/merchant/deals/[id]
 */
export async function fetchMerchantDealById(id: string): Promise<DealMerchantResponse> {
  const res = await fetch(`/api/merchant/deals/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  const body = await res.json().catch(() => null);

  if (!res.ok || !body || !body.success) {
    throw new MerchantDealApiError(
      body?.message || 'Failed to retrieve deal detail.',
      res.status,
      body?.error
    );
  }

  return body.data;
}

/**
 * Client helper to create a promotional deal for an owned active rest stop.
 * Calls Next.js BFF POST /api/merchant/deals
 */
export async function createMerchantDeal(
  dealData: CreateDealRequest
): Promise<DealMerchantResponse> {
  const res = await fetch('/api/merchant/deals', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(dealData),
  });

  const body = await res.json().catch(() => null);

  if (!res.ok || !body || !body.success) {
    throw new MerchantDealApiError(
      body?.message || 'Failed to create promotional deal.',
      res.status,
      body?.error
    );
  }

  return body.data;
}

/**
 * Client helper to update an owned deal.
 * Calls Next.js BFF PATCH /api/merchant/deals/[id]
 */
export async function updateMerchantDeal(
  id: string,
  updates: UpdateDealRequest
): Promise<DealMerchantResponse> {
  const res = await fetch(`/api/merchant/deals/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(updates),
  });

  const body = await res.json().catch(() => null);

  if (!res.ok || !body || !body.success) {
    throw new MerchantDealApiError(
      body?.message || 'Failed to update deal.',
      res.status,
      body?.error
    );
  }

  return body.data;
}

/**
 * Client helper to toggle deal active/paused state.
 */
export async function toggleMerchantDealStatus(
  id: string,
  isActive: boolean
): Promise<DealMerchantResponse> {
  return updateMerchantDeal(id, { isActive });
}
