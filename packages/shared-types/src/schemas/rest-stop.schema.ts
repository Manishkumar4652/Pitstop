import { z } from 'zod';
import { Facility, RestStopStatus, CapacityStatus } from '../enums';

export const LocationSchema = z.object({
  type: z.literal('Point').default('Point'),
  coordinates: z.tuple([
    z.number().min(-180, 'Longitude must be between -180 and 180').max(180, 'Longitude must be between -180 and 180'), // Longitude
    z.number().min(-90, 'Latitude must be between -90 and 90').max(90, 'Latitude must be between -90 and 90'),       // Latitude
  ]),
});

export const AddressSchema = z.object({
  street: z.string().trim().min(3, 'Street address must be at least 3 characters'),
  area: z.string().trim().min(2, 'Area/Locality must be at least 2 characters'),
  city: z.string().trim().min(2, 'City must be at least 2 characters'),
  state: z.string().trim().min(2, 'State must be at least 2 characters'),
  pincode: z.string().trim().regex(/^\d{6}$/, 'Pincode must be exactly 6 digits'),
  landmark: z.string().trim().optional(),
});

export const OperatingHoursSchema = z.object({
  day: z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']),
  openTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Invalid time format (HH:mm)'),
  closeTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Invalid time format (HH:mm)'),
  isOpen: z.boolean().default(true),
});

export const CreateRestStopRequestSchema = z
  .object({
    name: z.string().trim().min(3, 'Rest stop name must be at least 3 characters').max(120, 'Name cannot exceed 120 characters'),
    slug: z
      .string()
      .trim()
      .min(3)
      .max(140)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens')
      .optional(),
    description: z.string().trim().min(10, 'Description must be at least 10 characters'),
    address: AddressSchema,
    location: LocationSchema,
    facilities: z.array(z.nativeEnum(Facility)).min(1, 'Select at least one facility'),
    images: z.array(z.string().url()).optional().default([]),
    capacity: z.object({
      maxRiders: z.number().int().min(1, 'Capacity must be at least 1 rider'),
      status: z.nativeEnum(CapacityStatus).optional().default(CapacityStatus.AVAILABLE),
    }),
    operatingHours: z.array(OperatingHoursSchema).optional().default([]),
    dealBadge: z.string().trim().optional(),
    dealDescription: z.string().trim().optional(),
  })
  .strict();

export const UpdateRestStopRequestSchema = z
  .object({
    name: z.string().trim().min(3, 'Rest stop name must be at least 3 characters').max(120).optional(),
    description: z.string().trim().min(10, 'Description must be at least 10 characters').optional(),
    address: AddressSchema.optional(),
    location: LocationSchema.optional(),
    facilities: z.array(z.nativeEnum(Facility)).min(1).optional(),
    images: z.array(z.string().url()).optional(),
    capacity: z
      .object({
        maxRiders: z.number().int().min(1).optional(),
        status: z.nativeEnum(CapacityStatus).optional(),
      })
      .optional(),
    operatingHours: z.array(OperatingHoursSchema).optional(),
    dealBadge: z.string().trim().optional(),
    dealDescription: z.string().trim().optional(),
  })
  .strict();

export const AdminUpdateRestStopStatusSchema = z
  .object({
    status: z.nativeEnum(RestStopStatus, {
      errorMap: () => ({ message: 'Status must be one of: pending_approval, active, suspended' }),
    }),
    reason: z.string().trim().max(500).optional(),
  })
  .strict();

export const RestStopQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10).optional(),
  search: z.string().trim().max(100).optional(),
  city: z.string().trim().max(100).optional(),
  facilities: z.union([z.string(), z.array(z.string())]).optional(),
  sort: z.enum(['newest', 'oldest', 'name_asc', 'name_desc', 'rating']).default('newest').optional(),
});

export const AdminRestStopQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10).optional(),
  status: z.nativeEnum(RestStopStatus).optional(),
  search: z.string().trim().max(100).optional(),
  city: z.string().trim().max(100).optional(),
});

export const MerchantRestStopQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10).optional(),
  status: z.nativeEnum(RestStopStatus).optional(),
  search: z.string().trim().max(100).optional(),
});

export const RestStopPublicResponseSchema = z.object({
  id: z.string(),
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
  rating: z.object({
    average: z.number(),
    count: z.number(),
  }),
  dealBadge: z.string().optional(),
  dealDescription: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const RestStopAdminResponseSchema = RestStopPublicResponseSchema.extend({
  merchantId: z.string(),
  status: z.nativeEnum(RestStopStatus),
});

export const RestStopMerchantResponseSchema = RestStopAdminResponseSchema;

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export type Location = z.infer<typeof LocationSchema>;
export type Address = z.infer<typeof AddressSchema>;
export type OperatingHours = z.infer<typeof OperatingHoursSchema>;
export type CreateRestStopRequest = z.infer<typeof CreateRestStopRequestSchema>;
export type UpdateRestStopRequest = z.infer<typeof UpdateRestStopRequestSchema>;
export type AdminUpdateRestStopStatus = z.infer<typeof AdminUpdateRestStopStatusSchema>;
export type RestStopQuery = z.infer<typeof RestStopQuerySchema>;
export type AdminRestStopQuery = z.infer<typeof AdminRestStopQuerySchema>;
export type MerchantRestStopQuery = z.infer<typeof MerchantRestStopQuerySchema>;
export type RestStopPublicResponse = z.infer<typeof RestStopPublicResponseSchema>;
export type RestStopAdminResponse = z.infer<typeof RestStopAdminResponseSchema>;
export type RestStopMerchantResponse = z.infer<typeof RestStopMerchantResponseSchema>;

