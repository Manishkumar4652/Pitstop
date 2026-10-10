import { z } from 'zod';
import { JobStatus, JobCategory } from '../enums';

export const CreateJobRequestSchema = z.object({
  restStopId: z.string().min(1, 'Rest stop selection is required'),
  title: z.string().min(5, 'Job title must be at least 5 characters'),
  description: z.string().min(15, 'Job description must be at least 15 characters'),
  category: z.nativeEnum(JobCategory),
  payAmount: z.number().positive('Pay amount must be greater than 0'),
  payType: z.enum(['fixed', 'hourly']),
  durationMinutes: z.number().int().positive('Duration must be a positive integer'),
  startTime: z.string().datetime({ message: 'Start time must be a valid ISO datetime' }),
  endTime: z.string().datetime({ message: 'End time must be a valid ISO datetime' }),
  requiredRiders: z.number().int().positive('At least 1 rider required'),
  instructions: z.string().min(5, 'Instructions must be at least 5 characters'),
});

export const UpdateJobRequestSchema = CreateJobRequestSchema.partial().extend({
  status: z.nativeEnum(JobStatus).optional(),
});

export const JobQuerySchema = z.object({
  category: z.nativeEnum(JobCategory).optional(),
  status: z.nativeEnum(JobStatus).optional(),
  city: z.string().optional(),
  minPay: z.coerce.number().optional(),
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().positive().max(50).default(10).optional(),
});

export const JobApplicationRequestSchema = z.object({
  jobId: z.string().min(1, 'Job ID is required'),
  notes: z.string().max(200, 'Notes cannot exceed 200 characters').optional(),
});

export const JobPublicResponseSchema = z.object({
  id: z.string(),
  merchantId: z.string(),
  restStopId: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.nativeEnum(JobCategory),
  payAmount: z.number(),
  payType: z.enum(['fixed', 'hourly']),
  durationMinutes: z.number(),
  startTime: z.string(),
  endTime: z.string(),
  requiredRiders: z.number(),
  acceptedRidersCount: z.number(),
  status: z.nativeEnum(JobStatus),
  instructions: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type CreateJobRequest = z.infer<typeof CreateJobRequestSchema>;
export type UpdateJobRequest = z.infer<typeof UpdateJobRequestSchema>;
export type JobQuery = z.infer<typeof JobQuerySchema>;
export type JobApplicationRequest = z.infer<typeof JobApplicationRequestSchema>;
export type JobPublicResponse = z.infer<typeof JobPublicResponseSchema>;
