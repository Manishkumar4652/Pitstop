import { Facility, CapacityStatus, RestStopStatus, Address, OperatingHours } from 'shared-types';

export interface DemoRestStop {
  id: string;
  slug: string;
  name: string;
  merchantName: string;
  venueType: string;
  description: string;
  address: Address;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  facilities: Facility[];
  images: string[];
  capacity: {
    maxRiders: number;
    currentOccupancy: number;
    status: CapacityStatus;
  };
  operatingHours: OperatingHours[];
  status: RestStopStatus;
  rating: {
    average: number;
    count: number;
  };
  dealBadge?: string;
  dealDescription?: string;
  isDemoData: boolean;
}

/**
 * Fallback demo rest stops catalog — utilized only in development when PITSTOP_ENABLE_DEMO_FALLBACK=true.
 * Strictly forbidden in production.
 */
export const DEMO_REST_STOPS: DemoRestStop[] = [
  {
    id: 'rs-indiranagar-101',
    slug: 'chai-point-indiranagar',
    name: 'Chai Point Indiranagar',
    merchantName: 'Chai Point India',
    venueType: 'Tea & Beverage Outlet',
    description:
      'Designated pitstop for gig workers. Clean washroom, charging stations, and filtered cold water available.',
    address: {
      street: '100 Feet Road, HAL 2nd Stage',
      area: 'Indiranagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560038',
      landmark: 'Near Indiranagar Metro Station',
    },
    location: {
      type: 'Point',
      coordinates: [77.6412, 12.9716],
    },
    facilities: [
      Facility.RESTROOM,
      Facility.DRINKING_WATER,
      Facility.CHARGING,
      Facility.SEATING,
      Facility.WIFI,
    ],
    images: ['/images/rest-stops/chai-point.jpg'],
    capacity: {
      maxRiders: 10,
      currentOccupancy: 2,
      status: CapacityStatus.AVAILABLE,
    },
    operatingHours: [
      { day: 'mon', openTime: '07:00', closeTime: '23:00', isOpen: true },
      { day: 'tue', openTime: '07:00', closeTime: '23:00', isOpen: true },
      { day: 'wed', openTime: '07:00', closeTime: '23:00', isOpen: true },
      { day: 'thu', openTime: '07:00', closeTime: '23:00', isOpen: true },
      { day: 'fri', openTime: '07:00', closeTime: '23:00', isOpen: true },
      { day: 'sat', openTime: '07:00', closeTime: '23:00', isOpen: true },
      { day: 'sun', openTime: '07:00', closeTime: '23:00', isOpen: true },
    ],
    status: RestStopStatus.ACTIVE,
    rating: {
      average: 4.8,
      count: 24,
    },
    dealBadge: 'Free Chai with Snack',
    dealDescription: 'Buy any puff or samosa and get 1 hot chai free on rider badge scan.',
    isDemoData: true,
  },
];

/**
 * Helper to fetch all demo rest stops
 */
export function getDemoRestStops(): DemoRestStop[] {
  return DEMO_REST_STOPS;
}

/**
 * Helper to fetch a rest stop by slug
 */
export function getDemoRestStopBySlug(slug: string): DemoRestStop | undefined {
  return DEMO_REST_STOPS.find((stop) => stop.slug === slug);
}

/**
 * Helper to fetch all valid slugs for static params
 */
export function getAllRestStopSlugs(): string[] {
  return DEMO_REST_STOPS.map((stop) => stop.slug);
}
