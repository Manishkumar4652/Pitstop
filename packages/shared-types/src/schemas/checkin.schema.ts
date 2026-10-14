import { z } from 'zod';
import { CheckinStatus } from '../enums';

export const CreateCheckInRequestSchema = z
  .object({
    restStopId: z.string().trim().min(1, 'Rest stop ID is required'),
    method: z.enum(['qr_code', 'otp']).default('qr_code').optional(),
  })
  .strict();

// Backward compatibility alias
export const CheckinRequestSchema = CreateCheckInRequestSchema;

export const CheckInQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10).optional(),
  status: z.nativeEnum(CheckinStatus).optional(),
  restStopId: z.string().trim().optional(),
  sort: z.enum(['newest', 'oldest']).default('newest').optional(),
});

export const AdminCheckInQuerySchema = CheckInQuerySchema.extend({
  riderId: z.string().trim().optional(),
  merchantId: z.string().trim().optional(),
});

// Direct Venue QR verification request by an authenticated rider
export const VerifyCheckInRequestSchema = z
  .object({
    restStopId: z.string().trim().min(1, 'Rest stop ID is required'),
    qrCredential: z.string().trim().optional(),
    verificationCode: z.string().trim().optional(),
    location: z
      .object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
      })
      .optional(),
  })
  .strict()
  .refine(
    (data) => Boolean((data.qrCredential && data.qrCredential.length > 0) || (data.verificationCode && data.verificationCode.length > 0)),
    {
      message: 'Either venue QR credential or verification code is required',
      path: ['qrCredential'],
    }
  );

// Merchant desk check-in confirmation
export const ConfirmCheckInRequestSchema = z
  .object({
    verificationCode: z.string().trim().min(4).max(12).optional(),
  })
  .strict();

// Merchant desk check-in rejection
export const RejectCheckInRequestSchema = z
  .object({
    reason: z.string().trim().max(200).optional(),
  })
  .strict();

// Venue QR Credential payload returned to authorized merchant
export const VenueQrCredentialResponseSchema = z.object({
  restStopId: z.string(),
  qrCredential: z.string(),
  verificationCode: z.string().optional(),
  expiresAt: z.string(),
  version: z.number().int().min(1),
});

export const CheckInRiderResponseSchema = z.object({
  id: z.string(),
  restStopId: z.string(),
  restStopName: z.string().optional(),
  method: z.enum(['qr_code', 'otp']),
  status: z.nativeEnum(CheckinStatus),
  checkInTime: z.string(),
  verifiedAt: z.string().optional(),
  checkOutTime: z.string().optional(),
});

export const CheckInMerchantResponseSchema = z.object({
  id: z.string(),
  restStopId: z.string(),
  restStopName: z.string().optional(),
  riderName: z.string().optional(),
  method: z.enum(['qr_code', 'otp']),
  status: z.nativeEnum(CheckinStatus),
  checkInTime: z.string(),
  verifiedAt: z.string().optional(),
  checkOutTime: z.string().optional(),
});

export const CheckInAdminResponseSchema = z.object({
  id: z.string(),
  riderId: z.string(),
  merchantId: z.string(),
  restStopId: z.string(),
  restStopName: z.string().optional(),
  method: z.enum(['qr_code', 'otp']),
  status: z.nativeEnum(CheckinStatus),
  checkInTime: z.string(),
  verifiedAt: z.string().optional(),
  checkOutTime: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Backward compatibility schema
export const CheckinResponseSchema = CheckInAdminResponseSchema;

export const CheckinVerifySchema = z
  .object({
    checkinId: z.string().trim().min(1, 'Check-in ID is required'),
    verificationCode: z.string().trim().min(4, 'Verification code is required'),
  })
  .strict();

export type CreateCheckInRequest = z.infer<typeof CreateCheckInRequestSchema>;
export type CheckinRequest = CreateCheckInRequest;
export type CheckInQuery = z.infer<typeof CheckInQuerySchema>;
export type AdminCheckInQuery = z.infer<typeof AdminCheckInQuerySchema>;
export type VerifyCheckInRequest = z.infer<typeof VerifyCheckInRequestSchema>;
export type ConfirmCheckInRequest = z.infer<typeof ConfirmCheckInRequestSchema>;
export type RejectCheckInRequest = z.infer<typeof RejectCheckInRequestSchema>;
export type VenueQrCredentialResponse = z.infer<typeof VenueQrCredentialResponseSchema>;
export type CheckInRiderResponse = z.infer<typeof CheckInRiderResponseSchema>;
export type CheckInMerchantResponse = z.infer<typeof CheckInMerchantResponseSchema>;
export type CheckInAdminResponse = z.infer<typeof CheckInAdminResponseSchema>;
export type CheckinResponse = CheckInAdminResponse;
export type CheckinVerify = z.infer<typeof CheckinVerifySchema>;
