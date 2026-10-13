import {
  AdminStatsResponse,
  AdminMerchantResponse,
  AdminAuditLogResponse,
  RestStopAdminResponse,
  DealAdminResponse,
  JobAdminResponse,
  PaginationMeta,
} from 'shared-types';

export interface PaginatedList<T> {
  items: T[];
  pagination: PaginationMeta;
}

export interface ApiResult<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface AdminMerchantFilters {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

export interface AdminRestStopFilters {
  page?: number;
  limit?: number;
  status?: string;
  city?: string;
  search?: string;
}

export interface AdminJobFilters {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

export interface AdminDealFilters {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

export interface AdminAuditLogFilters {
  page?: number;
  limit?: number;
  targetType?: string;
  action?: string;
}

/**
 * Fetches aggregated live administrative statistics.
 */
export async function fetchAdminStats(): Promise<ApiResult<AdminStatsResponse>> {
  const res = await fetch('/api/admin/stats', {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });
  return res.json();
}

/**
 * Searches and paginates merchants for administrative review.
 */
export async function fetchAdminMerchants(
  filters: AdminMerchantFilters = {}
): Promise<ApiResult<PaginatedList<AdminMerchantResponse>>> {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.status && filters.status !== 'all') params.set('status', filters.status);
  if (filters.search) params.set('search', filters.search);

  const res = await fetch(`/api/admin/merchants?${params.toString()}`, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });
  return res.json();
}

/**
 * Retrieves details for a specific merchant.
 */
export async function fetchAdminMerchantById(
  id: string
): Promise<ApiResult<AdminMerchantResponse>> {
  const res = await fetch(`/api/admin/merchants/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });
  return res.json();
}

/**
 * Updates verification status for a merchant (approve, reject, or suspend).
 */
export async function updateAdminMerchantStatus(
  id: string,
  payload: { status: 'verified' | 'rejected' | 'suspended'; reason?: string }
): Promise<ApiResult<AdminMerchantResponse>> {
  const res = await fetch(`/api/admin/merchants/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return res.json();
}

/**
 * Lists rest stops across all statuses with admin metadata.
 */
export async function fetchAdminRestStops(
  filters: AdminRestStopFilters = {}
): Promise<ApiResult<PaginatedList<RestStopAdminResponse>>> {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.status && filters.status !== 'all') params.set('status', filters.status);
  if (filters.city) params.set('city', filters.city);
  if (filters.search) params.set('search', filters.search);

  const res = await fetch(`/api/admin/rest-stops?${params.toString()}`, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });
  return res.json();
}

/**
 * Updates moderation status for a rest stop (approve, suspend, reactivate).
 */
export async function updateAdminRestStopStatus(
  id: string,
  payload: { status: 'pending_approval' | 'active' | 'suspended'; reason?: string }
): Promise<ApiResult<RestStopAdminResponse>> {
  const res = await fetch(`/api/admin/rest-stops/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return res.json();
}

/**
 * Lists micro-jobs across all merchants for moderation.
 */
export async function fetchAdminJobs(
  filters: AdminJobFilters = {}
): Promise<ApiResult<PaginatedList<JobAdminResponse>>> {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.status && filters.status !== 'all') params.set('status', filters.status);
  if (filters.search) params.set('search', filters.search);

  const res = await fetch(`/api/admin/jobs?${params.toString()}`, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });
  return res.json();
}

/**
 * Updates status for a micro-job (e.g. cancel or moderate inappropriate listing).
 */
export async function updateAdminJobStatus(
  id: string,
  payload: { status: 'open' | 'in_progress' | 'completed' | 'cancelled'; reason?: string }
): Promise<ApiResult<JobAdminResponse>> {
  const res = await fetch(`/api/admin/jobs/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return res.json();
}

/**
 * Lists deals across all merchants for moderation.
 */
export async function fetchAdminDeals(
  filters: AdminDealFilters = {}
): Promise<ApiResult<PaginatedList<DealAdminResponse>>> {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.status && filters.status !== 'all') params.set('status', filters.status);
  if (filters.search) params.set('search', filters.search);

  const res = await fetch(`/api/admin/deals?${params.toString()}`, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });
  return res.json();
}

/**
 * Updates status for a deal (activate, pause, suspend).
 */
export async function updateAdminDealStatus(
  id: string,
  payload: { status?: 'active' | 'inactive' | 'paused'; isActive?: boolean; reason?: string }
): Promise<ApiResult<DealAdminResponse>> {
  const res = await fetch(`/api/admin/deals/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return res.json();
}

/**
 * Retrieves paginated audit logs.
 */
export async function fetchAdminAuditLogs(
  filters: AdminAuditLogFilters = {}
): Promise<ApiResult<PaginatedList<AdminAuditLogResponse>>> {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.targetType && filters.targetType !== 'all') params.set('targetType', filters.targetType);
  if (filters.action) params.set('action', filters.action);

  const res = await fetch(`/api/admin/audit-logs?${params.toString()}`, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });
  return res.json();
}
