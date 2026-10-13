import { JobApplicationStatus } from 'shared-types';

export interface MockJobApplicationItem {
  _id: string;
  id: string;
  jobId: string;
  riderId: string;
  riderName?: string;
  vehicleType?: string;
  merchantId: string;
  status: JobApplicationStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// In-memory store exclusively for offline unit/integration testing
export const mockJobApplicationStore = new Map<string, MockJobApplicationItem>();

/**
 * Resets the in-memory mock job application store (useful before/after test suites).
 */
export function clearMockJobApplicationStore(): void {
  mockJobApplicationStore.clear();
}
