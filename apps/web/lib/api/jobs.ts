import {
  JobPublicResponse,
  PaginationMeta,
  JobCategory,
  JobStatus,
  JobApplicationResponse,
} from 'shared-types';

export class JobApiError extends Error {
  public status: number;

  constructor(
    message: string,
    public statusCode: number,
    public errorCode?: string,
    public details?: any[]
  ) {
    super(message);
    this.name = 'JobApiError';
    this.status = statusCode;
  }
}

export interface FetchPublicJobsParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: JobCategory | string;
  restStopId?: string;
  payType?: 'fixed' | 'hourly';
  minPay?: number;
  sort?: 'newest' | 'oldest' | 'pay_desc' | 'pay_asc' | 'duration_asc';
}

export interface FetchPublicJobsResponse {
  items: JobPublicResponse[];
  pagination: PaginationMeta;
}

export interface ApplyJobPayload {
  notes?: string;
}

/**
 * Client helper to list public micro-jobs.
 * Calls Next.js BFF GET /api/jobs
 */
export async function fetchPublicJobs(
  params: FetchPublicJobsParams = {}
): Promise<FetchPublicJobsResponse> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', params.page.toString());
  if (params.limit) query.set('limit', params.limit.toString());
  if (params.search) query.set('search', params.search);
  if (params.category && params.category !== 'all') query.set('category', params.category);
  if (params.restStopId && params.restStopId !== 'all') query.set('restStopId', params.restStopId);
  if (params.payType) query.set('payType', params.payType);
  if (params.minPay !== undefined && params.minPay > 0) query.set('minPay', params.minPay.toString());
  if (params.sort) query.set('sort', params.sort);

  const qs = query.toString();
  const url = `/api/jobs${qs ? `?${qs}` : ''}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  const body = await res.json().catch(() => null);

  if (!res.ok || !body || !body.success) {
    throw new JobApiError(
      body?.message || 'Failed to retrieve available micro-jobs.',
      res.status,
      body?.error,
      body?.details
    );
  }

  return body.data;
}

/**
 * Client helper to fetch a single micro-job by ID.
 * Calls Next.js BFF GET /api/jobs/[id]
 */
export async function fetchPublicJobById(id: string): Promise<JobPublicResponse> {
  if (!id || !id.trim()) {
    throw new JobApiError('Job ID is required.', 400, 'BadRequest');
  }

  const res = await fetch(`/api/jobs/${encodeURIComponent(id.trim())}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  const body = await res.json().catch(() => null);

  if (!res.ok || !body || !body.success) {
    throw new JobApiError(
      body?.message || 'Failed to retrieve job details.',
      res.status,
      body?.error,
      body?.details
    );
  }

  return body.data;
}

/**
 * Client helper for an authenticated rider to apply for a micro-job.
 * Calls Next.js BFF POST /api/jobs/[id]/apply
 */
export async function applyToJob(
  jobId: string,
  payload: ApplyJobPayload = {}
): Promise<JobApplicationResponse> {
  if (!jobId || !jobId.trim()) {
    throw new JobApiError('Job ID is required.', 400, 'BadRequest');
  }

  const res = await fetch(`/api/jobs/${encodeURIComponent(jobId.trim())}/apply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const body = await res.json().catch(() => null);

  if (!res.ok || !body || !body.success) {
    throw new JobApiError(
      body?.message || 'Failed to submit application for this job.',
      res.status,
      body?.error,
      body?.details
    );
  }

  return body.data;
}
