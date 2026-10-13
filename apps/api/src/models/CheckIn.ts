import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { CheckinStatus } from 'shared-types';

export interface ICheckInDocument extends Document {
  riderId: Types.ObjectId;
  restStopId: Types.ObjectId;
  merchantId: Types.ObjectId;
  method: 'qr_code' | 'otp';
  verificationCode?: string;
  status: CheckinStatus;
  checkInTime: Date;
  verifiedAt?: Date;
  checkOutTime?: Date;
  locationAtCheckIn?: {
    type: 'Point';
    coordinates: [number, number];
  };
  createdAt: Date;
  updatedAt: Date;
}

const CheckInSchema = new Schema<ICheckInDocument>(
  {
    riderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Check-in must belong to a rider user'],
      index: true,
    },
    restStopId: {
      type: Schema.Types.ObjectId,
      ref: 'RestStop',
      required: [true, 'Check-in must be associated with a rest stop'],
      index: true,
    },
    merchantId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Check-in must identify the venue merchant'],
      index: true,
    },
    method: {
      type: String,
      enum: ['qr_code', 'otp'],
      required: [true, 'Check-in method (qr_code or otp) is required'],
    },
    verificationCode: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(CheckinStatus),
      default: CheckinStatus.PENDING,
      index: true,
    },
    checkInTime: {
      type: Date,
      default: Date.now,
      index: true,
    },
    verifiedAt: {
      type: Date,
    },
    checkOutTime: {
      type: Date,
    },
    locationAtCheckIn: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

CheckInSchema.index({ riderId: 1, restStopId: 1, checkInTime: -1 });
CheckInSchema.index({ restStopId: 1, status: 1 });

export const CheckIn: Model<ICheckInDocument> =
  mongoose.models.CheckIn || mongoose.model<ICheckInDocument>('CheckIn', CheckInSchema);
