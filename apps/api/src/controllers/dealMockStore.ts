import { DealDiscountType } from 'shared-types';

export interface MockDealItem {
  _id: string;
  id: string;
  restStopId: string;
  merchantId: string;
  title: string;
  description: string;
  discountType: DealDiscountType;
  discountPercentage?: number;
  flatDiscountAmount?: number;
  originalPrice?: number;
  dealPrice?: number;
  validHours?: string;
  terms?: string;
  validFrom: Date;
  validUntil?: Date;
  isActive: boolean;
  maxRedemptionsPerRider?: number;
  createdAt: Date;
  updatedAt: Date;
}

// In-memory store exclusively for offline unit/integration testing
export const mockDealStore = new Map<string, MockDealItem>();

/**
 * Resets the in-memory mock deal store (useful before/after test suites).
 */
export function clearMockDealStore(): void {
  mockDealStore.clear();
}
