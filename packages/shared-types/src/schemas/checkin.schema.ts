import { z } from 'zod';
import { CheckinStatus } from '../enums';

export const CheckinRequestSchema = z.object({
  restStopId: z.string().min(1, 'Rest stop ID is required'),
  method: z.enum(['qr_code', 'otp']),
  userLocation: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    })
    .optional(),
});

export const CheckinVerifySchema = z.object({
  checkinId: z.string().min(1, 'Check-in ID is required'),
  verificationCode: z.string().min(4, 'Verification code is required'),
});

export const CheckinResponseSchema = z.object({
  id: z.string(),
  riderId: z.string(),
  restStopId: z.string(),
  merchantId: z.string(),
  method: z.enum(['qr_code', 'otp']),
  status: z.nativeEnum(CheckinStatus),
  checkInTime: z.string(),
  checkOutTime: z.string().optional(),
  verificationCode: z.string().optional(),
});

export type CheckinRequest = z.infer<typeof CheckinRequestSchema>;
export type CheckinVerify = z.infer<typeof CheckinVerifySchema>;
export type CheckinResponse = z.infer<typeof CheckinResponseSchema>;
