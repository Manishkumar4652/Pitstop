import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { JobApplicationStatus } from 'shared-types';

export interface IJobApplicationDocument extends Document {
  jobId: Types.ObjectId;
  riderId: Types.ObjectId;
  merchantId: Types.ObjectId;
  status: JobApplicationStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const JobApplicationSchema = new Schema<IJobApplicationDocument>(
  {
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'Job',
      required: [true, 'Job application must be linked to a micro-job'],
      index: true,
    },
    riderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Job application must be linked to a rider applicant'],
      index: true,
    },
    merchantId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Job application must identify the merchant poster'],
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(JobApplicationStatus),
      default: JobApplicationStatus.PENDING,
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [200, 'Notes cannot exceed 200 characters'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// Enforce unique application constraint per rider per job at the database level
JobApplicationSchema.index({ jobId: 1, riderId: 1 }, { unique: true });

// Common lookup indexes
JobApplicationSchema.index({ merchantId: 1, status: 1 });
JobApplicationSchema.index({ riderId: 1, status: 1 });
JobApplicationSchema.index({ jobId: 1, status: 1 });

export const JobApplication: Model<IJobApplicationDocument> =
  mongoose.models.JobApplication ||
  mongoose.model<IJobApplicationDocument>('JobApplication', JobApplicationSchema);
