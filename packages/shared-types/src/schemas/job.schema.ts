import { z } from 'zod';
import { JobStatus, JobCategory, JobApplicationStatus } from '../enums';

export const CreateJobRequestSchema = z
  .object({
    restStopId: z.string().trim().min(1, 'Rest stop selection is required'),
    title: z
      .string()
      .trim()
      .min(5, 'Job title must be at least 5 characters')
      .max(150, 'Job title cannot exceed 150 characters'),
    description: z
      .string()
      .trim()
      .min(15, 'Job description must be at least 15 characters'),
    category: z.nativeEnum(JobCategory, {
      errorMap: () => ({ message: 'Invalid job category' }),
    }),
    payAmount: z.number().min(1, 'Pay amount must be at least 1'),
    payType: z.enum(['fixed', 'hourly'], {
      errorMap: () => ({ message: "Pay type must be 'fixed' or 'hourly'" }),
    }),
    durationMinutes: z
      .number()
      .int()
      .min(15, 'Duration must be at least 15 minutes'),
    startTime: z.coerce.date({ invalid_type_error: 'Start time must be a valid date' }),
    endTime: z.coerce.date({ invalid_type_error: 'End time must be a valid date' }),
    requiredRiders: z
      .number()
      .int()
      .min(1, 'At least 1 rider must be requested')
      .default(1),
    instructions: z
      .string()
      .trim()
      .min(5, 'Instructions must be at least 5 characters'),
  })
  .strict()
  .refine(
    (data) => data.endTime.getTime() > data.startTime.getTime(),
    {
      message: 'End time must be after start time',
      path: ['endTime'],
    }
  );

export const UpdateJobRequestSchema = z
  .object({
    title: z.string().trim().min(5).max(150).optional(),
    description: z.string().trim().min(15).optional(),
    category: z.nativeEnum(JobCategory).optional(),
    payAmount: z.number().min(1).optional(),
    payType: z.enum(['fixed', 'hourly']).optional(),
    durationMinutes: z.number().int().min(15).optional(),
    startTime: z.coerce.date().optional(),
    endTime: z.coerce.date().optional(),
    requiredRiders: z.number().int().min(1).optional(),
    instructions: z.string().trim().min(5).optional(),
    status: z.enum([JobStatus.OPEN, JobStatus.CANCELLED], {
      errorMap: () => ({ message: "Merchants can only set status to 'open' or 'cancelled'" }),
    }).optional(),
  })
  .strict()
  .refine(
    (data) => {
      if (data.startTime && data.endTime) {
        return data.endTime.getTime() > data.startTime.getTime();
      }
      return true;
    },
    {
      message: 'End time must be after start time',
      path: ['endTime'],
    }
  );

export const AdminUpdateJobStatusSchema = z
  .object({
    status: z.nativeEnum(JobStatus, {
      errorMap: () => ({ message: 'Status must be one of: open, in_progress, completed, cancelled' }),
    }),
    reason: z.string().trim().max(500).optional(),
  })
  .strict();

export const JobQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10).optional(),
  search: z.string().trim().max(100).optional(),
  category: z.nativeEnum(JobCategory).optional(),
  restStopId: z.string().trim().optional(),
  payType: z.enum(['fixed', 'hourly']).optional(),
  minPay: z.coerce.number().min(0).optional(),
  sort: z.enum(['newest', 'oldest', 'pay_desc', 'pay_asc', 'duration_asc']).default('newest').optional(),
});

export const AdminJobQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10).optional(),
  search: z.string().trim().max(100).optional(),
  category: z.nativeEnum(JobCategory).optional(),
  status: z.nativeEnum(JobStatus).optional(),
  merchantId: z.string().trim().optional(),
  restStopId: z.string().trim().optional(),
});

export const JobApplicationRequestSchema = z.object({
  jobId: z.string().min(1, 'Job ID is required').optional(),
  notes: z.string().max(200, 'Notes cannot exceed 200 characters').optional(),
});

export const ApplyJobRequestSchema = z
  .object({
    jobId: z.string().optional(),
    notes: z.string().trim().max(200, 'Notes cannot exceed 200 characters').optional(),
  })
  .strict();

export const RiderJobApplicationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10).optional(),
  status: z
    .enum(['all', JobApplicationStatus.PENDING, JobApplicationStatus.ACCEPTED, JobApplicationStatus.REJECTED, JobApplicationStatus.WITHDRAWN])
    .default('all')
    .optional(),
});

export const MerchantJobApplicantsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10).optional(),
  status: z
    .enum(['all', JobApplicationStatus.PENDING, JobApplicationStatus.ACCEPTED, JobApplicationStatus.REJECTED, JobApplicationStatus.WITHDRAWN])
    .default('all')
    .optional(),
  sort: z.enum(['newest', 'oldest']).default('newest').optional(),
});

export const UpdateJobApplicationStatusSchema = z
  .object({
    status: z.enum([JobApplicationStatus.ACCEPTED, JobApplicationStatus.REJECTED], {
      errorMap: () => ({ message: "Status must be either 'accepted' or 'rejected'" }),
    }),
  })
  .strict();

export const JobPublicResponseSchema = z.object({
  id: z.string(),
  restStopId: z.string(),
  restStopName: z.string().optional(),
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

export const JobAdminResponseSchema = JobPublicResponseSchema.extend({
  merchantId: z.string(),
});

export const MerchantJobQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10).optional(),
  search: z.string().trim().max(100).optional(),
  category: z.nativeEnum(JobCategory).optional(),
  status: z.enum(['all', JobStatus.OPEN, JobStatus.IN_PROGRESS, JobStatus.COMPLETED, JobStatus.CANCELLED]).default('all').optional(),
  restStopId: z.string().trim().optional(),
});

export const JobMerchantResponseSchema = JobAdminResponseSchema.extend({
  applicationsCount: z.number().int().min(0).optional(),
  pendingApplicationsCount: z.number().int().min(0).optional(),
});

export const JobApplicationResponseSchema = z.object({
  id: z.string(),
  jobId: z.string(),
  riderId: z.string(),
  riderName: z.string().optional(),
  vehicleType: z.string().optional(),
  merchantId: z.string(),
  status: z.nativeEnum(JobApplicationStatus),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const RiderJobApplicationResponseSchema = JobApplicationResponseSchema.extend({
  jobTitle: z.string().optional(),
  restStopName: z.string().optional(),
  payAmount: z.number().optional(),
  payType: z.enum(['fixed', 'hourly']).optional(),
  durationMinutes: z.number().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  instructions: z.string().optional(),
});

export type CreateJobRequest = z.infer<typeof CreateJobRequestSchema>;
export type UpdateJobRequest = z.infer<typeof UpdateJobRequestSchema>;
export type AdminUpdateJobStatus = z.infer<typeof AdminUpdateJobStatusSchema>;
export type JobQuery = z.infer<typeof JobQuerySchema>;
export type AdminJobQuery = z.infer<typeof AdminJobQuerySchema>;
export type MerchantJobQuery = z.infer<typeof MerchantJobQuerySchema>;
export type JobApplicationRequest = z.infer<typeof JobApplicationRequestSchema>;
export type ApplyJobRequest = z.infer<typeof ApplyJobRequestSchema>;
export type RiderJobApplicationQuery = z.infer<typeof RiderJobApplicationQuerySchema>;
export type MerchantJobApplicantsQuery = z.infer<typeof MerchantJobApplicantsQuerySchema>;
export type UpdateJobApplicationStatus = z.infer<typeof UpdateJobApplicationStatusSchema>;
export type JobPublicResponse = z.infer<typeof JobPublicResponseSchema>;
export type JobAdminResponse = z.infer<typeof JobAdminResponseSchema>;
export type JobMerchantResponse = z.infer<typeof JobMerchantResponseSchema>;
export type JobApplicationResponse = z.infer<typeof JobApplicationResponseSchema>;
export type RiderJobApplicationResponse = z.infer<typeof RiderJobApplicationResponseSchema>;
