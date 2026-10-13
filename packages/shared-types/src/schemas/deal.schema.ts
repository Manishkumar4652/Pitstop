import { z } from 'zod';
import { DealDiscountType } from '../enums';

export const CreateDealRequestSchema = z
  .object({
    restStopId: z.string().trim().min(1, 'Rest stop ID is required'),
    title: z
      .string()
      .trim()
      .min(5, 'Title must be at least 5 characters')
      .max(120, 'Title cannot exceed 120 characters'),
    description: z.string().trim().min(10, 'Description must be at least 10 characters'),
    discountType: z.nativeEnum(DealDiscountType, {
      errorMap: () => ({ message: 'Discount type must be percentage, fixed_price, or free_item' }),
    }),
    discountPercentage: z
      .number()
      .min(1, 'Discount percentage must be at least 1%')
      .max(100, 'Discount percentage cannot exceed 100%')
      .optional(),
    flatDiscountAmount: z.number().min(1, 'Discount amount must be positive').optional(),
    originalPrice: z.number().min(0, 'Original price cannot be negative').optional(),
    dealPrice: z.number().min(0, 'Deal price cannot be negative').optional(),
    validHours: z.string().trim().optional(),
    terms: z.string().trim().optional(),
    validFrom: z.coerce.date().optional(),
    validUntil: z.coerce.date().optional(),
    isActive: z.boolean().optional().default(true),
    maxRedemptionsPerRider: z.number().int().min(1, 'Max redemptions must be at least 1').optional().default(1),
  })
  .strict()
  .refine(
    (data) => {
      if (data.discountType === DealDiscountType.PERCENTAGE) {
        return (
          typeof data.discountPercentage === 'number' &&
          data.discountPercentage >= 1 &&
          data.discountPercentage <= 100
        );
      }
      return true;
    },
    {
      message: 'Discount percentage between 1 and 100 is required for percentage discount type',
      path: ['discountPercentage'],
    }
  )
  .refine(
    (data) => {
      if (data.validFrom && data.validUntil) {
        return data.validUntil.getTime() >= data.validFrom.getTime();
      }
      return true;
    },
    {
      message: 'validUntil must be after or equal to validFrom',
      path: ['validUntil'],
    }
  );

export const UpdateDealRequestSchema = z
  .object({
    title: z.string().trim().min(5).max(120).optional(),
    description: z.string().trim().min(10).optional(),
    discountType: z.nativeEnum(DealDiscountType).optional(),
    discountPercentage: z.number().min(1).max(100).optional(),
    flatDiscountAmount: z.number().min(1).optional(),
    originalPrice: z.number().min(0).optional(),
    dealPrice: z.number().min(0).optional(),
    validHours: z.string().trim().optional(),
    terms: z.string().trim().optional(),
    validFrom: z.coerce.date().optional(),
    validUntil: z.coerce.date().optional(),
    isActive: z.boolean().optional(),
    maxRedemptionsPerRider: z.number().int().min(1).optional(),
  })
  .strict()
  .refine(
    (data) => {
      if (data.discountType === DealDiscountType.PERCENTAGE && data.discountPercentage !== undefined) {
        return data.discountPercentage >= 1 && data.discountPercentage <= 100;
      }
      return true;
    },
    {
      message: 'Discount percentage between 1 and 100 is required for percentage discount type',
      path: ['discountPercentage'],
    }
  )
  .refine(
    (data) => {
      if (data.validFrom && data.validUntil) {
        return data.validUntil.getTime() >= data.validFrom.getTime();
      }
      return true;
    },
    {
      message: 'validUntil must be after or equal to validFrom',
      path: ['validUntil'],
    }
  );

export const AdminUpdateDealStatusSchema = z
  .object({
    status: z.enum(['active', 'inactive', 'paused'], {
      errorMap: () => ({ message: 'Status must be one of: active, inactive, paused' }),
    }).optional(),
    isActive: z.boolean().optional(),
    reason: z.string().trim().max(500).optional(),
  })
  .strict()
  .refine(
    (data) => data.status !== undefined || data.isActive !== undefined,
    {
      message: 'Either status (active, inactive, paused) or isActive boolean must be provided',
    }
  );

export const DealQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10).optional(),
  search: z.string().trim().max(100).optional(),
  restStopId: z.string().trim().optional(),
  discountType: z.nativeEnum(DealDiscountType).optional(),
  sort: z.enum(['newest', 'oldest', 'title_asc', 'title_desc', 'discount_desc']).default('newest').optional(),
});

export const AdminDealQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10).optional(),
  search: z.string().trim().max(100).optional(),
  restStopId: z.string().trim().optional(),
  merchantId: z.string().trim().optional(),
  status: z.enum(['all', 'active', 'inactive', 'paused']).optional(),
  isActive: z.preprocess((val) => (val === 'true' ? true : val === 'false' ? false : val), z.boolean().optional()).optional(),
});

export const MerchantDealQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10).optional(),
  search: z.string().trim().max(100).optional(),
  restStopId: z.string().trim().optional(),
  status: z.enum(['all', 'active', 'inactive', 'expired']).optional(),
  isActive: z.preprocess((val) => (val === 'true' ? true : val === 'false' ? false : val), z.boolean().optional()).optional(),
});

export const DealPublicResponseSchema = z.object({
  id: z.string(),
  restStopId: z.string(),
  restStopName: z.string().optional(),
  title: z.string(),
  description: z.string(),
  discountType: z.nativeEnum(DealDiscountType),
  discountPercentage: z.number().optional(),
  flatDiscountAmount: z.number().optional(),
  originalPrice: z.number().optional(),
  dealPrice: z.number().optional(),
  validHours: z.string().optional(),
  terms: z.string().optional(),
  validFrom: z.string(),
  validUntil: z.string().optional(),
  isActive: z.boolean(),
  maxRedemptionsPerRider: z.number().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const DealAdminResponseSchema = DealPublicResponseSchema.extend({
  merchantId: z.string(),
  status: z.string(),
});

export const DealMerchantResponseSchema = DealAdminResponseSchema;

export type CreateDealRequest = z.infer<typeof CreateDealRequestSchema>;
export type UpdateDealRequest = z.infer<typeof UpdateDealRequestSchema>;
export type AdminUpdateDealStatus = z.infer<typeof AdminUpdateDealStatusSchema>;
export type DealQuery = z.infer<typeof DealQuerySchema>;
export type AdminDealQuery = z.infer<typeof AdminDealQuerySchema>;
export type MerchantDealQuery = z.infer<typeof MerchantDealQuerySchema>;
export type DealPublicResponse = z.infer<typeof DealPublicResponseSchema>;
export type DealAdminResponse = z.infer<typeof DealAdminResponseSchema>;
export type DealMerchantResponse = z.infer<typeof DealMerchantResponseSchema>;

