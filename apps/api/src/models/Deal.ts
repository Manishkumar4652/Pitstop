import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export type DealDiscountType = 'percentage' | 'fixed_price' | 'free_item';

export interface IDealDocument extends Document {
  restStopId: Types.ObjectId;
  merchantId: Types.ObjectId;
  title: string;
  description: string;
  discountType: DealDiscountType;
  discountPercentage?: number;
  flatDiscountAmount?: number;
  originalPrice?: number;
  dealPrice?: number;
  validHours?: string;
  terms?: string;
  validFrom: Date;
  validUntil?: Date;
  isActive: boolean;
  maxRedemptionsPerRider?: number;
  createdAt: Date;
  updatedAt: Date;
}

const DealSchema = new Schema<IDealDocument>(
  {
    restStopId: {
      type: Schema.Types.ObjectId,
      ref: 'RestStop',
      required: [true, 'Deal must be linked to a physical rest stop'],
      index: true,
    },
    merchantId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Deal must be linked to a merchant owner'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Deal title is required'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    description: {
      type: String,
      required: [true, 'Deal description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed_price', 'free_item'],
      default: 'percentage',
      required: true,
    },
    discountPercentage: {
      type: Number,
      min: [1, 'Discount percentage must be at least 1%'],
      max: [100, 'Discount percentage cannot exceed 100%'],
    },
    flatDiscountAmount: {
      type: Number,
      min: [1, 'Discount amount must be positive'],
    },
    originalPrice: {
      type: Number,
      min: [0, 'Original price cannot be negative'],
    },
    dealPrice: {
      type: Number,
      min: [0, 'Deal price cannot be negative'],
    },
    validHours: {
      type: String,
      trim: true,
    },
    terms: {
      type: String,
      trim: true,
    },
    validFrom: {
      type: Date,
      default: Date.now,
    },
    validUntil: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    maxRedemptionsPerRider: {
      type: Number,
      default: 1,
      min: 1,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

DealSchema.index({ restStopId: 1, isActive: 1 });
DealSchema.index({ merchantId: 1, isActive: 1 });

export const Deal: Model<IDealDocument> =
  mongoose.models.Deal || mongoose.model<IDealDocument>('Deal', DealSchema);
