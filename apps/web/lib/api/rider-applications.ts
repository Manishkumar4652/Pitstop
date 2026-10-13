import {
  RiderJobApplicationResponse,
  PaginationMeta,
  JobApplicationStatus,
} from 'shared-types';

export class RiderApplicationApiError extends Error {
  public status: number;

  constructor(
    message: string,
    public statusCode: number,
    public errorCode?: string,
    public details?: any[]
  ) {
    super(message);
    this.name = 'RiderApplicationApiError';
    this.status = statusCode;
  }
}

export interface FetchRiderApplicationsParams {
  page?: number;
  limit?: number;
  status?: JobApplicationStatus | 'all' | string;
}

export interface FetchRiderApplicationsResponse {
  items: RiderJobApplicationResponse[];
  pagination: PaginationMeta;
}

/**
 * Client helper to list the authenticated rider's own applications.
 * Calls Next.js BFF GET /api/rider/applications
 */
export async function fetchRiderApplications(
  params: FetchRiderApplicationsParams = {}
): Promise<FetchRiderApplicationsResponse> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', params.page.toString());
  if (params.limit) query.set('limit', params.limit.toString());
  if (params.status && params.status !== 'all') query.set('status', params.status);

  const qs = query.toString();
  const url = `/api/rider/applications${qs ? `?${qs}` : ''}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  const body = await res.json().catch(() => null);

  if (!res.ok || !body || !body.success) {
    throw new RiderApplicationApiError(
      body?.message || 'Failed to retrieve application history.',
      res.status,
      body?.error,
      body?.details
    );
  }

  return body.data;
}

/**
 * Client helper for an authenticated rider to withdraw their pending application.
 * Calls Next.js BFF POST /api/rider/applications/[id]/withdraw
 */
export async function withdrawRiderApplication(
  applicationId: string
): Promise<RiderJobApplicationResponse> {
  if (!applicationId || !applicationId.trim()) {
    throw new RiderApplicationApiError('Application ID is required.', 400, 'BadRequest');
  }

  const res = await fetch(
    `/api/rider/applications/${encodeURIComponent(applicationId.trim())}/withdraw`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    }
  );

  const body = await res.json().catch(() => null);

  if (!res.ok || !body || !body.success) {
    throw new RiderApplicationApiError(
      body?.message || 'Failed to withdraw application.',
      res.status,
      body?.error,
      body?.details
    );
  }

  return body.data;
}
