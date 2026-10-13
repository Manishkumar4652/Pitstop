import mongoose, { Document, Model, Schema } from 'mongoose';
import { UserRole } from 'shared-types';

export interface IRiderProfile {
  platform: 'zomato' | 'swiggy' | 'blinkit' | 'zepto' | 'uber' | 'ola' | 'rapido' | 'other';
  vehicleType: '2-wheeler-ev' | '2-wheeler-petrol' | 'bicycle' | 'auto' | 'car';
  vehicleNumber?: string;
}

export interface IMerchantProfile {
  businessName: string;
  businessType: 'restaurant' | 'tea_stall' | 'garage' | 'supermarket' | 'service_center' | 'other';
  gstNumber?: string;
  address?: string;
  verificationStatus?: 'pending_review' | 'verified' | 'rejected' | 'suspended';
  verificationReason?: string;
}

export interface IUserDocument extends Document {
  name: string;
  phone: string;
  email?: string;
  passwordHash?: string;
  role: UserRole;
  isVerified: boolean;
  avatarUrl?: string;
  riderProfile?: IRiderProfile;
  merchantProfile?: IMerchantProfile;
  createdAt: Date;
  updatedAt: Date;
}

const RiderProfileSchema = new Schema<IRiderProfile>(
  {
    platform: {
      type: String,
      enum: ['zomato', 'swiggy', 'blinkit', 'zepto', 'uber', 'ola', 'rapido', 'other'],
      required: true,
    },
    vehicleType: {
      type: String,
      enum: ['2-wheeler-ev', '2-wheeler-petrol', 'bicycle', 'auto', 'car'],
      required: true,
    },
    vehicleNumber: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const MerchantProfileSchema = new Schema<IMerchantProfile>(
  {
    businessName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
    },
    businessType: {
      type: String,
      enum: ['restaurant', 'tea_stall', 'garage', 'supermarket', 'service_center', 'other'],
      required: true,
    },
    gstNumber: {
      type: String,
      trim: true,
      uppercase: true,
    },
    address: {
      type: String,
      trim: true,
    },
    verificationStatus: {
      type: String,
      enum: ['pending_review', 'verified', 'rejected', 'suspended'],
      default: 'pending_review',
    },
    verificationReason: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  { _id: false }
);

const UserSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: [true, 'User name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    phone: {
      type: String,
      required: [true, 'Indian phone number is required'],
      unique: true,
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian phone number starting with 6-9'],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true, // Allows null/absent emails while enforcing uniqueness for provided values
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    passwordHash: {
      type: String,
      select: false, // Exclude password hash from standard queries for security
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.RIDER,
      required: true,
      index: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    avatarUrl: {
      type: String,
      trim: true,
    },
    riderProfile: {
      type: RiderProfileSchema,
      required: false,
    },
    merchantProfile: {
      type: MerchantProfileSchema,
      required: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, any>) => {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Prevent re-compilation of existing model during hot-reloads
export const User: Model<IUserDocument> =
  mongoose.models.User || mongoose.model<IUserDocument>('User', UserSchema);
