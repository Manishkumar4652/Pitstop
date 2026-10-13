import { z } from 'zod';
import { MerchantVerificationStatus } from '../enums';

export const AdminMerchantQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10).optional(),
  search: z.string().trim().max(100).optional(),
  status: z
    .enum(['all', 'pending_review', 'verified', 'rejected', 'suspended'])
    .default('all')
    .optional(),
  sort: z.enum(['newest', 'oldest']).default('newest').optional(),
});

export type AdminMerchantQuery = z.infer<typeof AdminMerchantQuerySchema>;

export const AdminUpdateMerchantStatusSchema = z
  .object({
    status: z.enum([
      MerchantVerificationStatus.VERIFIED,
      MerchantVerificationStatus.REJECTED,
      MerchantVerificationStatus.SUSPENDED,
    ], {
      errorMap: () => ({
        message: "Status must be 'verified', 'rejected', or 'suspended'",
      }),
    }),
    reason: z.string().trim().max(500, 'Reason cannot exceed 500 characters').optional(),
  })
  .strict();

export type AdminUpdateMerchantStatus = z.infer<typeof AdminUpdateMerchantStatusSchema>;

export const AdminAuditLogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20).optional(),
  targetType: z.enum(['all', 'merchant', 'rest_stop', 'job', 'deal']).default('all').optional(),
  adminId: z.string().trim().max(100).optional(),
  action: z.string().trim().max(100).optional(),
});

export type AdminAuditLogQuery = z.infer<typeof AdminAuditLogQuerySchema>;

export const AdminMerchantProfileResponseSchema = z.object({
  businessName: z.string(),
  businessType: z.string(),
  gstNumber: z.string().optional(),
  address: z.string().optional(),
  verificationStatus: z.nativeEnum(MerchantVerificationStatus),
  verificationReason: z.string().optional(),
});

export const AdminMerchantResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string(),
  email: z.string().optional(),
  role: z.string(),
  isVerified: z.boolean(),
  merchantProfile: AdminMerchantProfileResponseSchema.optional(),
  venuesCount: z.number().default(0),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type AdminMerchantResponse = z.infer<typeof AdminMerchantResponseSchema>;

export const AdminAuditLogResponseSchema = z.object({
  id: z.string(),
  adminId: z.string(),
  adminName: z.string(),
  action: z.string(),
  targetType: z.enum(['merchant', 'rest_stop', 'job', 'deal']),
  targetId: z.string(),
  targetName: z.string().optional(),
  prevStatus: z.string().optional(),
  newStatus: z.string().optional(),
  reason: z.string().optional(),
  createdAt: z.string(),
});

export type AdminAuditLogResponse = z.infer<typeof AdminAuditLogResponseSchema>;

export interface AdminStatsResponse {
  users: {
    total: number;
    riders: number;
    merchants: number;
    admins: number;
    pendingMerchants: number;
  };
  restStops: {
    total: number;
    active: number;
    pendingApproval: number;
    suspended: number;
  };
  deals: {
    total: number;
    active: number;
    inactive: number;
  };
  jobs: {
    total: number;
    open: number;
    inProgress: number;
    completed: number;
    cancelled: number;
  };
  applications: {
    total: number;
    pending: number;
    accepted: number;
    rejected: number;
    withdrawn: number;
  };
  recentActivity: AdminAuditLogResponse[];
}
