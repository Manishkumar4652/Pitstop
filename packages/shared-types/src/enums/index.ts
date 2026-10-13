export enum UserRole {
  RIDER = 'rider',
  MERCHANT = 'merchant',
  ADMIN = 'admin',
}

export enum Facility {
  DRINKING_WATER = 'drinking_water',
  SEATING = 'seating',
  CHARGING = 'charging',
  RESTROOM = 'restroom',
  WIFI = 'wifi',
  PARKING = 'parking',
  AIR_CONDITIONING = 'air_conditioning',
  FIRST_AID = 'first_aid',
}

export enum JobStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum CheckinStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  EXPIRED = 'expired',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

export enum RestStopStatus {
  PENDING_APPROVAL = 'pending_approval',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
}

export enum CapacityStatus {
  AVAILABLE = 'available',
  BUSY = 'busy',
  FULL = 'full',
}

export enum JobCategory {
  PARCEL_SORTING = 'parcel_sorting',
  LOADING_UNLOADING = 'loading_unloading',
  FLYER_DISTRIBUTION = 'flyer_distribution',
  CLEANING_PREP = 'cleaning_prep',
  STORE_ASSISTANT = 'store_assistant',
  OTHER = 'other',
}

export enum DealDiscountType {
  PERCENTAGE = 'percentage',
  FIXED_PRICE = 'fixed_price',
  FREE_ITEM = 'free_item',
}

export enum JobApplicationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn',
}

export enum MerchantVerificationStatus {
  PENDING_REVIEW = 'pending_review',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
}

