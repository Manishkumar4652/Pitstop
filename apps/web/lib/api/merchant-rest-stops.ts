import {
  RestStopMerchantResponse,
  RestStopStatus,
  CreateRestStopRequest,
  UpdateRestStopRequest,
  PaginationMeta,
} from 'shared-types';

export interface MerchantRestStopsListResponse {
  items: RestStopMerchantResponse[];
  pagination: PaginationMeta;
}

export interface VenueQrCredentialResponse {
  restStopId: string;
  qrCredential: string;
  expiresAt: string;
  version: number;
}

export class MerchantRestStopApiError extends Error {
  public statusCode: number;
  public errorCode?: string;

  constructor(message: string, statusCode: number, errorCode?: string) {
    super(message);
    this.name = 'MerchantRestStopApiError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }
}

/**
 * Fetches the authenticated merchant's listed rest stops from the BFF.
 */
export async function fetchMerchantRestStops(params?: {
  page?: number;
  limit?: number;
  status?: RestStopStatus;
  search?: string;
}): Promise<MerchantRestStopsListResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', params.page.toString());
  if (params?.limit) query.set('limit', params.limit.toString());
  if (params?.status) query.set('status', params.status);
  if (params?.search) query.set('search', params.search);

  const url = `/api/merchant/rest-stops${query.toString() ? `?${query.toString()}` : ''}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  const json = await res.json().catch(() => null);

  if (!res.ok || !json?.success) {
    throw new MerchantRestStopApiError(
      json?.message || 'Failed to load your rest stops.',
      res.status,
      json?.error
    );
  }

  return json.data as MerchantRestStopsListResponse;
}

/**
 * Fetches an individual owned rest stop by ID.
 */
export async function fetchMerchantRestStopById(
  id: string
): Promise<RestStopMerchantResponse> {
  const res = await fetch(`/api/merchant/rest-stops/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  const json = await res.json().catch(() => null);

  if (!res.ok || !json?.success) {
    throw new MerchantRestStopApiError(
      json?.message || 'Failed to load rest stop details.',
      res.status,
      json?.error
    );
  }

  return json.data as RestStopMerchantResponse;
}

/**
 * Creates a new merchant rest stop via the BFF.
 */
export async function createMerchantRestStop(
  payload: CreateRestStopRequest
): Promise<RestStopMerchantResponse> {
  const res = await fetch('/api/merchant/rest-stops', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const json = await res.json().catch(() => null);

  if (!res.ok || !json?.success) {
    throw new MerchantRestStopApiError(
      json?.message || 'Failed to create rest stop.',
      res.status,
      json?.error
    );
  }

  return json.data as RestStopMerchantResponse;
}

/**
 * Updates permitted fields of an owned rest stop via the BFF.
 */
export async function updateMerchantRestStop(
  id: string,
  payload: UpdateRestStopRequest
): Promise<RestStopMerchantResponse> {
  const res = await fetch(`/api/merchant/rest-stops/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const json = await res.json().catch(() => null);

  if (!res.ok || !json?.success) {
    throw new MerchantRestStopApiError(
      json?.message || 'Failed to update rest stop.',
      res.status,
      json?.error
    );
  }

  return json.data as RestStopMerchantResponse;
}

/**
 * Retrieves the cryptographic venue QR credential for an owned active venue.
 */
export async function fetchVenueQrCredential(
  id: string
): Promise<VenueQrCredentialResponse> {
  const res = await fetch(`/api/merchant/rest-stops/${encodeURIComponent(id)}/qr-credential`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  const json = await res.json().catch(() => null);

  if (!res.ok || !json?.success) {
    throw new MerchantRestStopApiError(
      json?.message || 'Failed to retrieve venue QR credential.',
      res.status,
      json?.error
    );
  }

  return json.data as VenueQrCredentialResponse;
}

/**
 * Rotates the cryptographic venue QR credential for an owned venue.
 * Revokes all previously generated/printed credentials immediately.
 */
export async function rotateVenueQrCredential(
  id: string
): Promise<VenueQrCredentialResponse> {
  const res = await fetch(`/api/merchant/rest-stops/${encodeURIComponent(id)}/qr-credential/rotate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const json = await res.json().catch(() => null);

  if (!res.ok || !json?.success) {
    throw new MerchantRestStopApiError(
      json?.message || 'Failed to rotate venue QR credential.',
      res.status,
      json?.error
    );
  }

  return json.data as VenueQrCredentialResponse;
}
