export interface MockAuditLogItem {
  _id: string;
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  targetType: 'merchant' | 'rest_stop' | 'job' | 'deal';
  targetId: string;
  targetName?: string;
  prevStatus?: string;
  newStatus?: string;
  reason?: string;
  createdAt: Date;
  updatedAt: Date;
}

// In-memory store exclusively for offline unit/integration testing
export const mockAuditLogStore = new Map<string, MockAuditLogItem>();

/**
 * Resets the in-memory mock audit log store (useful before/after test suites).
 */
export function clearMockAuditLogStore(): void {
  mockAuditLogStore.clear();
}
