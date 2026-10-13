import { CheckinStatus } from 'shared-types';

export interface MockCheckInItem {
  _id: string;
  id: string;
  riderId: string;
  restStopId: string;
  merchantId: string;
  method: 'qr_code' | 'otp';
  verificationCode?: string;
  status: CheckinStatus;
  checkInTime: Date;
  verifiedAt?: Date;
  checkOutTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// In-memory store exclusively for offline unit/integration testing
export const mockCheckInStore = new Map<string, MockCheckInItem>();

/**
 * Resets the in-memory mock check-in store (useful before/after test suites).
 */
export function clearMockCheckInStore(): void {
  mockCheckInStore.clear();
}
