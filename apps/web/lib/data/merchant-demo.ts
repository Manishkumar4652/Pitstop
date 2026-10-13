import { JobCategory, JobStatus } from 'shared-types';

export interface DemoDeal {
  id: string;
  restStopSlug: string;
  restStopName: string;
  title: string;
  description: string;
  discountType: 'percentage' | 'fixed_price' | 'free_item';
  status: 'active' | 'paused';
  validHours: string;
  isDemoData: boolean;
}

export interface DemoMerchantJob {
  id: string;
  restStopSlug: string;
  restStopName: string;
  title: string;
  category: JobCategory;
  payAmount: number;
  payType: 'fixed' | 'hourly';
  durationMinutes: number;
  timeSlot: string;
  requiredRiders: number;
  acceptedRidersCount: number;
  status: JobStatus;
  instructions: string;
  isDemoData: boolean;
}

export const DEMO_MERCHANT_DEALS: DemoDeal[] = [
  {
    id: 'deal-1',
    restStopSlug: 'chai-point-indiranagar',
    restStopName: 'Chai Point Rest Stop',
    title: '50% off Chai & Samosa',
    description: 'Exclusive 50% discount on hot ginger chai and fresh samosa for registered gig delivery partners.',
    discountType: 'percentage',
    status: 'active',
    validHours: '14:00 – 17:00 (Off-peak)',
    isDemoData: true,
  },
  {
    id: 'deal-2',
    restStopSlug: 'green-park-mg-road',
    restStopName: 'Green Park Eatery & Rest Desk',
    title: 'Free Water Refill + 20% Off Meals',
    description: 'Complimentary cold water refill and 20% discount on all quick thali and rice combo meals.',
    discountType: 'percentage',
    status: 'active',
    validHours: '13:00 – 18:00',
    isDemoData: true,
  },
  {
    id: 'deal-3',
    restStopSlug: 'quickbite-koramangala',
    restStopName: 'QuickBite Rider Hub',
    title: '₹30 Cold Coffee for Riders',
    description: 'Refreshing ₹30 cold coffee or fresh lime juice with any check-in verification.',
    discountType: 'fixed_price',
    status: 'active',
    validHours: 'All Day',
    isDemoData: true,
  },
];

export const DEMO_MERCHANT_JOBS: DemoMerchantJob[] = [
  {
    id: 'job-1',
    restStopSlug: 'quickbite-koramangala',
    restStopName: 'QuickBite Rider Hub',
    title: 'Afternoon Parcel Sorting & Dispatch Assistant',
    category: JobCategory.PARCEL_SORTING,
    payAmount: 300,
    payType: 'fixed',
    durationMinutes: 120,
    timeSlot: '14:30 – 16:30',
    requiredRiders: 2,
    acceptedRidersCount: 0,
    status: JobStatus.OPEN,
    instructions: 'Assist cloud kitchen dispatch desk in sorting parcel boxes by delivery sector. Light lifting required.',
    isDemoData: true,
  },
  {
    id: 'job-2',
    restStopSlug: 'green-park-mg-road',
    restStopName: 'Green Park Eatery & Rest Desk',
    title: 'Beverage Inventory Stacking & Prep',
    category: JobCategory.LOADING_UNLOADING,
    payAmount: 200,
    payType: 'fixed',
    durationMinutes: 90,
    timeSlot: '15:00 – 16:30',
    requiredRiders: 1,
    acceptedRidersCount: 0,
    status: JobStatus.OPEN,
    instructions: 'Help unload afternoon bakery crates and arrange bottled drinks in coolers.',
    isDemoData: true,
  },
];
