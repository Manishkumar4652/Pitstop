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
