import {
  CreateJobRequest,
  UpdateJobRequest,
  JobMerchantResponse,
  JobApplicationResponse,
  PaginationMeta,
  JobStatus,
  JobCategory,
  JobApplicationStatus,
} from 'shared-types';

export class MerchantJobApiError extends Error {
  public status: number;

  constructor(
    message: string,
    public statusCode: number,
    public errorCode?: string,
    public details?: any[]
  ) {
    super(message);
    this.name = 'MerchantJobApiError';
    this.status = statusCode;
  }
}

export interface FetchMerchantJobsParams {
  page?: number;
  limit?: number;
  status?: string;
  category?: string;
  restStopId?: string;
  search?: string;
}

export interface FetchMerchantJobsResponse {
  items: JobMerchantResponse[];
  pagination: PaginationMeta;
}

export interface FetchMerchantJobApplicantsParams {
  page?: number;
  limit?: number;
  status?: string;
  sort?: 'newest' | 'oldest';
}

export interface FetchMerchantJobApplicantsResponse {
  items: JobApplicationResponse[];
  pagination: PaginationMeta;
}

/**
 * Client helper to list the authenticated merchant's own micro-jobs.
 * Calls Next.js BFF GET /api/merchant/jobs
 */
export async function fetchMerchantJobs(
  params: FetchMerchantJobsParams = {}
): Promise<FetchMerchantJobsResponse> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', params.page.toString());
  if (params.limit) query.set('limit', params.limit.toString());
  if (params.status && params.status !== 'all') query.set('status', params.status);
  if (params.category && params.category !== 'all') query.set('category', params.category);
  if (params.restStopId && params.restStopId !== 'all') query.set('restStopId', params.restStopId);
  if (params.search) query.set('search', params.search);

  const qs = query.toString();
  const url = `/api/merchant/jobs${qs ? `?${qs}` : ''}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  const body = await res.json().catch(() => null);

  if (!res.ok || !body || !body.success) {
    throw new MerchantJobApiError(
      body?.message || 'Failed to retrieve micro-jobs.',
      res.status,
      body?.error
    );
  }

  return body.data;
}

/**
 * Client helper to fetch a single micro-job owned by the authenticated merchant.
 * Calls Next.js BFF GET /api/merchant/jobs/[id]
 */
export async function fetchMerchantJobById(id: string): Promise<JobMerchantResponse> {
  const res = await fetch(`/api/merchant/jobs/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  const body = await res.json().catch(() => null);

  if (!res.ok || !body || !body.success) {
    throw new MerchantJobApiError(
      body?.message || 'Failed to retrieve micro-job details.',
      res.status,
      body?.error
    );
  }

  return body.data;
}

/**
 * Client helper to create a micro-job for an owned active rest stop.
 * Calls Next.js BFF POST /api/merchant/jobs
 */
export async function createMerchantJob(
  payload: CreateJobRequest
): Promise<JobMerchantResponse> {
  const res = await fetch('/api/merchant/jobs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const body = await res.json().catch(() => null);

  if (!res.ok || !body || !body.success) {
    throw new MerchantJobApiError(
      body?.message || 'Failed to create micro-job.',
      res.status,
      body?.error
    );
  }

  return body.data;
}

/**
 * Client helper to update an owned micro-job.
 * Calls Next.js BFF PATCH /api/merchant/jobs/[id]
 */
export async function updateMerchantJob(
  id: string,
  payload: UpdateJobRequest
): Promise<JobMerchantResponse> {
  const res = await fetch(`/api/merchant/jobs/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const body = await res.json().catch(() => null);

  if (!res.ok || !body || !body.success) {
    throw new MerchantJobApiError(
      body?.message || 'Failed to update micro-job.',
      res.status,
      body?.error
    );
  }

  return body.data;
}

/**
 * Client helper to list applicants for an owned micro-job.
 * Calls Next.js BFF GET /api/merchant/jobs/[id]/applications
 */
export async function fetchMerchantJobApplicants(
  jobId: string,
  params: FetchMerchantJobApplicantsParams = {}
): Promise<FetchMerchantJobApplicantsResponse> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', params.page.toString());
  if (params.limit) query.set('limit', params.limit.toString());
  if (params.status && params.status !== 'all') query.set('status', params.status);
  if (params.sort) query.set('sort', params.sort);

  const qs = query.toString();
  const url = `/api/merchant/jobs/${encodeURIComponent(jobId)}/applications${qs ? `?${qs}` : ''}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  const body = await res.json().catch(() => null);

  if (!res.ok || !body || !body.success) {
    throw new MerchantJobApiError(
      body?.message || 'Failed to retrieve applicants for this micro-job.',
      res.status,
      body?.error
    );
  }

  return body.data;
}

/**
 * Client helper to accept or reject an applicant with atomic capacity management.
 * Calls Next.js BFF PATCH /api/merchant/applications/[id]/status
 */
export async function updateMerchantApplicationStatus(
  applicationId: string,
  status: JobApplicationStatus.ACCEPTED | JobApplicationStatus.REJECTED
): Promise<JobApplicationResponse> {
  const res = await fetch(`/api/merchant/applications/${encodeURIComponent(applicationId)}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ status }),
  });

  const body = await res.json().catch(() => null);

  if (!res.ok || !body || !body.success) {
    throw new MerchantJobApiError(
      body?.message || `Failed to update application status to '${status}'.`,
      res.status,
      body?.error
    );
  }

  return body.data;
}
