import {
  CheckInRiderResponse,
  CheckinStatus,
  VerifyCheckInRequest,
  CreateCheckInRequest,
} from 'shared-types';

export interface CheckInsHistoryResponse {
  items: CheckInRiderResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export class CheckInApiError extends Error {
  public statusCode: number;
  public errorCode?: string;

  constructor(message: string, statusCode: number, errorCode?: string) {
    super(message);
    this.name = 'CheckInApiError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }
}

/**
 * Submits a scanned or manually entered venue QR credential to the BFF verification endpoint.
 */
export async function verifyVenueCheckIn(
  payload: VerifyCheckInRequest
): Promise<CheckInRiderResponse> {
  const res = await fetch('/api/check-ins/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const json = await res.json().catch(() => null);

  if (!res.ok || !json?.success) {
    throw new CheckInApiError(
      json?.message || 'Verification failed. Please try again.',
      res.status,
      json?.error
    );
  }

  return json.data as CheckInRiderResponse;
}

/**
 * Fetches the authenticated rider's real check-in history from the BFF.
 */
export async function fetchMyCheckIns(params?: {
  page?: number;
  limit?: number;
  status?: CheckinStatus;
}): Promise<CheckInsHistoryResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', params.page.toString());
  if (params?.limit) query.set('limit', params.limit.toString());
  if (params?.status) query.set('status', params.status);

  const res = await fetch(`/api/check-ins/me${query.toString() ? `?${query.toString()}` : ''}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const json = await res.json().catch(() => null);

  if (!res.ok || !json?.success) {
    throw new CheckInApiError(
      json?.message || 'Failed to fetch check-in history.',
      res.status,
      json?.error
    );
  }

  return json.data as CheckInsHistoryResponse;
}

/**
 * Cancels a pending check-in.
 */
export async function cancelCheckIn(checkInId: string): Promise<CheckInRiderResponse> {
  const res = await fetch(`/api/check-ins/${encodeURIComponent(checkInId)}/cancel`, {
    method: 'POST',
  });

  const json = await res.json().catch(() => null);

  if (!res.ok || !json?.success) {
    throw new CheckInApiError(
      json?.message || 'Failed to cancel check-in.',
      res.status,
      json?.error
    );
  }

  return json.data as CheckInRiderResponse;
}

/**
 * Initiates a pending check-in at a rest stop.
 */
export async function initiateCheckIn(
  payload: CreateCheckInRequest
): Promise<CheckInRiderResponse> {
  const res = await fetch('/api/check-ins', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const json = await res.json().catch(() => null);

  if (!res.ok || !json?.success) {
    throw new CheckInApiError(
      json?.message || 'Failed to initiate check-in.',
      res.status,
      json?.error
    );
  }

  return json.data as CheckInRiderResponse;
}
