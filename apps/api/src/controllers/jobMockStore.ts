import { JobCategory, JobStatus } from 'shared-types';

export interface MockJobItem {
  _id: string;
  id: string;
  merchantId: string;
  restStopId: string;
  title: string;
  description: string;
  category: JobCategory;
  payAmount: number;
  payType: 'fixed' | 'hourly';
  durationMinutes: number;
  startTime: Date;
  endTime: Date;
  requiredRiders: number;
  acceptedRidersCount: number;
  status: JobStatus;
  instructions: string;
  createdAt: Date;
  updatedAt: Date;
}

// In-memory store exclusively for offline unit/integration testing
export const mockJobStore = new Map<string, MockJobItem>();

/**
 * Resets the in-memory mock job store (useful before/after test suites).
 */
export function clearMockJobStore(): void {
  mockJobStore.clear();
}
