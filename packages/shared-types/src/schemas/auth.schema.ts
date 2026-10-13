import { z } from 'zod';
import { UserRole } from '../enums';

// Phone number regex for Indian mobile numbers (10 digits starting with 6-9)
const phoneRegex = /^[6-9]\d{9}$/;

export const RegisterRequestSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters long').max(100, 'Name cannot exceed 100 characters'),
  phone: z.string().trim().regex(phoneRegex, 'Invalid Indian mobile phone number (10 digits starting with 6-9 expected)'),
  email: z.string().trim().email('Invalid email address').toLowerCase().optional(),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters long')
    .max(128, 'Password cannot exceed 128 characters'),
  role: z
    .enum([UserRole.RIDER, UserRole.MERCHANT], {
      errorMap: () => ({ message: 'Public registration allows rider or merchant roles only. Admin cannot be registered publicly.' }),
    })
    .default(UserRole.RIDER),
  riderProfile: z
    .object({
      platform: z.enum(['zomato', 'swiggy', 'blinkit', 'zepto', 'uber', 'ola', 'rapido', 'other']),
      vehicleType: z.enum(['2-wheeler-ev', '2-wheeler-petrol', 'bicycle', 'auto', 'car']),
      vehicleNumber: z.string().trim().optional(),
    })
    .optional(),
  merchantProfile: z
    .object({
      businessName: z.string().trim().min(2, 'Business name is required'),
      businessType: z.enum(['restaurant', 'tea_stall', 'garage', 'supermarket', 'service_center', 'other']),
      gstNumber: z.string().trim().optional(),
      address: z.string().trim().min(5, 'Full address is required'),
    })
    .optional(),
});

export const LoginRequestSchema = z.object({
  phone: z.string().trim().regex(phoneRegex, 'Invalid Indian mobile phone number (10 digits starting with 6-9 expected)'),
  password: z.string().min(1, 'Password is required').max(128, 'Password cannot exceed 128 characters'),
});

export const SendOtpRequestSchema = z.object({
  phone: z.string().trim().regex(phoneRegex, 'Invalid Indian mobile phone number'),
});

export const VerifyOtpRequestSchema = z.object({
  phone: z.string().trim().regex(phoneRegex, 'Invalid Indian mobile phone number'),
  otp: z.string().trim().length(6, 'OTP must be 6 digits'),
});

export const UserPublicProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string(),
  email: z.string().optional(),
  role: z.nativeEnum(UserRole),
  isVerified: z.boolean(),
  avatarUrl: z.string().optional(),
  riderProfile: z
    .object({
      platform: z.enum(['zomato', 'swiggy', 'blinkit', 'zepto', 'uber', 'ola', 'rapido', 'other']),
      vehicleType: z.enum(['2-wheeler-ev', '2-wheeler-petrol', 'bicycle', 'auto', 'car']),
      vehicleNumber: z.string().optional(),
    })
    .optional(),
  merchantProfile: z
    .object({
      businessName: z.string(),
      businessType: z.enum(['restaurant', 'tea_stall', 'garage', 'supermarket', 'service_center', 'other']),
      gstNumber: z.string().optional(),
      address: z.string().optional(),
    })
    .optional(),
  createdAt: z.string(),
});

export const AuthResponseSchema = z.object({
  token: z.string(),
  user: UserPublicProfileSchema,
});

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type SendOtpRequest = z.infer<typeof SendOtpRequestSchema>;
export type VerifyOtpRequest = z.infer<typeof VerifyOtpRequestSchema>;
export type UserPublicProfile = z.infer<typeof UserPublicProfileSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
