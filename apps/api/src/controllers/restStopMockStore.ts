import { RestStopStatus, CapacityStatus, Facility } from 'shared-types';

export interface MockRestStopItem {
  _id: string;
  id: string;
  merchantId: string;
  name: string;
  slug: string;
  description: string;
  address: {
    street: string;
    area: string;
    city: string;
    state: string;
    pincode: string;
    landmark?: string;
  };
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  facilities: Facility[];
  images: string[];
  capacity: {
    maxRiders: number;
    currentOccupancy: number;
    status: CapacityStatus;
  };
  operatingHours: Array<{
    day: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
    openTime: string;
    closeTime: string;
    isOpen: boolean;
  }>;
  status: RestStopStatus;
  rating: {
    average: number;
    count: number;
  };
  dealBadge?: string;
  dealDescription?: string;
  qrRotationVersion?: number;
  createdAt: Date;
  updatedAt: Date;
}

// In-memory store exclusively for offline unit/integration testing
export const mockRestStopStore = new Map<string, MockRestStopItem>();

/**
 * Resets the in-memory mock rest stop store (useful before/after test suites).
 */
export function clearMockRestStopStore(): void {
  mockRestStopStore.clear();
}
