import { z } from 'zod';
import { Facility, RestStopStatus, CapacityStatus } from '../enums';

export const LocationSchema = z.object({
  type: z.literal('Point'),
  coordinates: z.tuple([
    z.number().min(-180).max(180), // Longitude
    z.number().min(-90).max(90),   // Latitude
  ]),
});

export const AddressSchema = z.object({
  street: z.string().min(3, 'Street address required'),
  area: z.string().min(2, 'Area/Locality required'),
  city: z.string().min(2, 'City required'),
  state: z.string().min(2, 'State required'),
  pincode: z.string().length(6, 'Pincode must be 6 digits'),
  landmark: z.string().optional(),
});

export const OperatingHoursSchema = z.object({
  day: z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']),
  openTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Invalid time format (HH:mm)'),
  closeTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Invalid time format (HH:mm)'),
  isOpen: z.boolean(),
});

export const CreateRestStopRequestSchema = z.object({
  name: z.string().min(3, 'Rest stop name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  address: AddressSchema,
  location: LocationSchema,
  facilities: z.array(z.nativeEnum(Facility)).min(1, 'Select at least one facility'),
  images: z.array(z.string().url()).optional().default([]),
  capacity: z.object({
    maxRiders: z.number().int().positive(),
  }),
  operatingHours: z.array(OperatingHoursSchema),
});

export const UpdateRestStopRequestSchema = CreateRestStopRequestSchema.partial().extend({
  status: z.nativeEnum(RestStopStatus).optional(),
  capacityStatus: z.nativeEnum(CapacityStatus).optional(),
  currentOccupancy: z.number().int().nonnegative().optional(),
});

export const RestStopQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radiusKm: z.coerce.number().positive().default(5).optional(),
  facilities: z.union([z.string(), z.array(z.string())]).optional(),
  city: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().positive().max(50).default(10).optional(),
});

export const RestStopPublicResponseSchema = z.object({
  id: z.string(),
  merchantId: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  address: AddressSchema,
  location: LocationSchema,
  facilities: z.array(z.nativeEnum(Facility)),
  images: z.array(z.string()),
  capacity: z.object({
    maxRiders: z.number(),
    currentOccupancy: z.number(),
    status: z.nativeEnum(CapacityStatus),
  }),
  operatingHours: z.array(OperatingHoursSchema),
  status: z.nativeEnum(RestStopStatus),
  rating: z.object({
    average: z.number(),
    count: z.number(),
  }),
  distanceKm: z.number().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Location = z.infer<typeof LocationSchema>;
export type Address = z.infer<typeof AddressSchema>;
export type OperatingHours = z.infer<typeof OperatingHoursSchema>;
export type CreateRestStopRequest = z.infer<typeof CreateRestStopRequestSchema>;
export type UpdateRestStopRequest = z.infer<typeof UpdateRestStopRequestSchema>;
export type RestStopQuery = z.infer<typeof RestStopQuerySchema>;
export type RestStopPublicResponse = z.infer<typeof RestStopPublicResponseSchema>;
