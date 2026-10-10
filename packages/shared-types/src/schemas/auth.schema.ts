import { z } from 'zod';
import { UserRole } from '../enums';

// Phone number regex for Indian mobile numbers (10 digits starting with 6-9)
const phoneRegex = /^[6-9]\d{9}$/;

export const RegisterRequestSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long'),
  phone: z.string().regex(phoneRegex, 'Invalid Indian mobile phone number (10 digits expected)'),
  email: z.string().email('Invalid email address').optional(),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  role: z.nativeEnum(UserRole),
  riderProfile: z
    .object({
      platform: z.enum(['zomato', 'swiggy', 'blinkit', 'zepto', 'uber', 'ola', 'rapido', 'other']),
      vehicleType: z.enum(['2-wheeler-ev', '2-wheeler-petrol', 'bicycle', 'auto', 'car']),
      vehicleNumber: z.string().optional(),
    })
    .optional(),
  merchantProfile: z
    .object({
      businessName: z.string().min(2, 'Business name is required'),
      businessType: z.enum(['restaurant', 'tea_stall', 'garage', 'supermarket', 'service_center', 'other']),
      gstNumber: z.string().optional(),
      address: z.string().min(5, 'Full address is required'),
    })
    .optional(),
});

export const LoginRequestSchema = z.object({
  phone: z.string().regex(phoneRegex, 'Invalid Indian mobile phone number'),
  password: z.string().min(1, 'Password is required'),
});

export const SendOtpRequestSchema = z.object({
  phone: z.string().regex(phoneRegex, 'Invalid Indian mobile phone number'),
});

export const VerifyOtpRequestSchema = z.object({
  phone: z.string().regex(phoneRegex, 'Invalid Indian mobile phone number'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export const UserPublicProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string(),
  email: z.string().optional(),
  role: z.nativeEnum(UserRole),
  isVerified: z.boolean(),
  avatarUrl: z.string().optional(),
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
