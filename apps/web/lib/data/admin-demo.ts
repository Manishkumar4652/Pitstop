import { RestStopStatus, Facility, CapacityStatus, Address, OperatingHours } from 'shared-types';
import { DEMO_REST_STOPS, DemoRestStop } from './rest-stops';

export interface DemoMerchantReview {
  id: string;
  businessName: string;
  ownerName: string;
  contactPhone: string;
  city: string;
  area: string;
  venuesCount: number;
  status: 'verified' | 'pending_review' | 'under_inspection';
  submittedDate: string;
  notes: string;
  isDemoData: boolean;
}

export interface DemoModerationRestStop extends DemoRestStop {
  moderationNotes?: string;
  submittedAt?: string;
}

// Initial demo rest-stops for moderation preview, including one in pending approval to demonstrate the queue
export const DEMO_ADMIN_REST_STOPS: DemoModerationRestStop[] = [
  ...DEMO_REST_STOPS,
  {
    id: 'stop-pending-1',
    slug: 'metro-point-snacks',
    name: 'Metro Point Snacks & Rest Hub',
    merchantName: 'Metro Point Quick Services',
    venueType: 'Tea Stall & Quick Snack Hub',
    description:
      'High-traffic rest desk near Baiyappanahalli Metro station providing filtered water, phone charging docks, and clean toilet access for gig riders.',
    address: {
      street: 'Old Madras Road, Near Metro Pillar 114',
      area: 'Baiyappanahalli',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560038',
      landmark: 'Next to Metro Gate 2',
    },
    location: {
      type: 'Point',
      coordinates: [77.6534, 12.9904],
    },
    facilities: [
      Facility.DRINKING_WATER,
      Facility.CHARGING,
      Facility.RESTROOM,
      Facility.SEATING,
    ],
    images: ['/images/rest-stops/metro-point.jpg'],
    capacity: {
      maxRiders: 8,
      currentOccupancy: 0,
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
    status: RestStopStatus.PENDING_APPROVAL,
    rating: {
      average: 0,
      count: 0,
    },
    isDemoData: true,
    moderationNotes: 'New merchant facility registration submitted for physical amenities verification.',
    submittedAt: 'Today, 11:20 AM',
  },
];

export const DEMO_MERCHANT_REVIEWS: DemoMerchantReview[] = [
  {
    id: 'merch-1',
    businessName: 'Chai Point Indiranagar',
    ownerName: 'Manish Verma (Store Manager)',
    contactPhone: '+91 98765 43210',
    city: 'Bengaluru',
    area: 'Indiranagar',
    venuesCount: 1,
    status: 'verified',
    submittedDate: '2026-09-15',
    notes: 'Physical facilities verified. Clean RO water station and charging docks operational.',
    isDemoData: true,
  },
  {
    id: 'merch-2',
    businessName: 'Green Park Hospitality',
    ownerName: 'Rajesh Hegde',
    contactPhone: '+91 98450 11223',
    city: 'Bengaluru',
    area: 'MG Road / Ashok Nagar',
    venuesCount: 1,
    status: 'verified',
    submittedDate: '2026-09-20',
    notes: 'Restroom and shaded outdoor seating verified during morning shift inspection.',
    isDemoData: true,
  },
  {
    id: 'merch-3',
    businessName: 'QuickBite Foods Pvt Ltd',
    ownerName: 'Kavitha Krishnan',
    contactPhone: '+91 97412 88990',
    city: 'Bengaluru',
    area: 'Koramangala',
    venuesCount: 1,
    status: 'verified',
    submittedDate: '2026-09-28',
    notes: 'High-capacity hub with parking and high-speed Wi-Fi confirmed.',
    isDemoData: true,
  },
  {
    id: 'merch-4',
    businessName: 'Metro Point Quick Services',
    ownerName: 'Sunil Kumar',
    contactPhone: '+91 99887 76655',
    city: 'Bengaluru',
    area: 'Baiyappanahalli',
    venuesCount: 1,
    status: 'pending_review',
    submittedDate: '2026-10-10',
    notes: 'New merchant registration pending on-site verification of washroom and charging points.',
    isDemoData: true,
  },
  {
    id: 'merch-5',
    businessName: 'Shivaji Military Store & Kitchen',
    ownerName: 'Anand Rao',
    contactPhone: '+91 98112 33445',
    city: 'Bengaluru',
    area: 'Jayanagar',
    venuesCount: 1,
    status: 'verified',
    submittedDate: '2026-10-01',
    notes: 'Verified partner with afternoon meal discounts for gig riders.',
    isDemoData: true,
  },
  {
    id: 'merch-6',
    businessName: 'Sri Krishna Refreshments',
    ownerName: 'Gopal Bhat',
    contactPhone: '+91 94480 66778',
    city: 'Bengaluru',
    area: 'Malleshwaram',
    venuesCount: 1,
    status: 'under_inspection',
    submittedDate: '2026-10-05',
    notes: 'Follow-up scheduled to check seating capacity expansion.',
    isDemoData: true,
  },
];
