import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { JobCategory, JobStatus } from 'shared-types';

export interface IJobDocument extends Document {
  merchantId: Types.ObjectId;
  restStopId: Types.ObjectId;
  title: string;
  description: string;
  category: JobCategory;
  payAmount: number;
  payType: 'fixed' | 'hourly';
  durationMinutes: number;
  startTime: Date;
  endTime: Date;
  requiredRiders: number;
  acceptedRidersCount: number;
  status: JobStatus;
  instructions: string;
  createdAt: Date;
  updatedAt: Date;
}

const JobSchema = new Schema<IJobDocument>(
  {
    merchantId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Job must be linked to a merchant owner'],
      index: true,
    },
    restStopId: {
      type: Schema.Types.ObjectId,
      ref: 'RestStop',
      required: [true, 'Job must be linked to a rest stop location'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      minlength: [5, 'Job title must be at least 5 characters'],
      maxlength: [150, 'Job title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Job description is required'],
      trim: true,
      minlength: [15, 'Job description must be at least 15 characters'],
    },
    category: {
      type: String,
      enum: Object.values(JobCategory),
      required: [true, 'Job category is required'],
      index: true,
    },
    payAmount: {
      type: Number,
      required: [true, 'Pay amount is required'],
      min: [1, 'Pay amount must be greater than zero'],
    },
    payType: {
      type: String,
      enum: ['fixed', 'hourly'],
      default: 'fixed',
      required: true,
    },
    durationMinutes: {
      type: Number,
      required: [true, 'Estimated duration in minutes is required'],
      min: [15, 'Job duration must be at least 15 minutes'],
    },
    startTime: {
      type: Date,
      required: [true, 'Job scheduled start time is required'],
    },
    endTime: {
      type: Date,
      required: [true, 'Job scheduled end time is required'],
    },
    requiredRiders: {
      type: Number,
      default: 1,
      min: [1, 'At least 1 rider must be requested'],
    },
    acceptedRidersCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: Object.values(JobStatus),
      default: JobStatus.OPEN,
      index: true,
    },
    instructions: {
      type: String,
      required: [true, 'Task instructions for riders are required'],
      trim: true,
      minlength: [5, 'Instructions must be at least 5 characters'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

JobSchema.index({ restStopId: 1, status: 1 });
JobSchema.index({ merchantId: 1, status: 1 });
JobSchema.index({ category: 1, status: 1 });

export const Job: Model<IJobDocument> =
  mongoose.models.Job || mongoose.model<IJobDocument>('Job', JobSchema);
