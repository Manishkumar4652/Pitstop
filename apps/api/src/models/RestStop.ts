import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { Facility, RestStopStatus, CapacityStatus } from 'shared-types';

export interface IAddress {
  street: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
}

export interface IGeoPoint {
  type: 'Point';
  coordinates: [number, number]; // [Longitude, Latitude]
}

export interface IOperatingHours {
  day: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
  openTime: string;
  closeTime: string;
  isOpen: boolean;
}

export interface IRestStopDocument extends Document {
  merchantId: Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  address: IAddress;
  location: IGeoPoint;
  facilities: Facility[];
  images: string[];
  capacity: {
    maxRiders: number;
    currentOccupancy: number;
    status: CapacityStatus;
  };
  operatingHours: IOperatingHours[];
  status: RestStopStatus;
  rating: {
    average: number;
    count: number;
  };
  dealBadge?: string;
  dealDescription?: string;
  qrRotationVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema = new Schema<IAddress>(
  {
    street: { type: String, required: true, trim: true },
    area: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: {
      type: String,
      required: true,
      trim: true,
      match: [/^\d{6}$/, 'Pincode must be exactly 6 digits'],
    },
    landmark: { type: String, trim: true },
  },
  { _id: false }
);

const LocationSchema = new Schema<IGeoPoint>(
  {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: (coords: number[]) =>
          Array.isArray(coords) &&
          coords.length === 2 &&
          coords[0] >= -180 &&
          coords[0] <= 180 &&
          coords[1] >= -90 &&
          coords[1] <= 90,
        message: 'Coordinates must be [Longitude (-180 to 180), Latitude (-90 to 90)]',
      },
    },
  },
  { _id: false }
);

const OperatingHoursSchema = new Schema<IOperatingHours>(
  {
    day: {
      type: String,
      enum: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
      required: true,
    },
    openTime: {
      type: String,
      required: true,
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be in HH:mm 24-hour format'],
    },
    closeTime: {
      type: String,
      required: true,
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be in HH:mm 24-hour format'],
    },
    isOpen: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const RestStopSchema = new Schema<IRestStopDocument>(
  {
    merchantId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Rest stop must be associated with a merchant user'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Rest stop name is required'],
      trim: true,
      minlength: [3, 'Name must be at least 3 characters'],
      maxlength: [120, 'Name cannot exceed 120 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Rest stop slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Rest stop description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
    },
    address: {
      type: AddressSchema,
      required: true,
    },
    location: {
      type: LocationSchema,
      required: true,
    },
    facilities: {
      type: [String],
      enum: Object.values(Facility),
      validate: {
        validator: (v: string[]) => Array.isArray(v) && v.length > 0,
        message: 'At least one facility must be offered',
      },
      required: true,
    },
    images: {
      type: [String],
      default: [],
    },
    capacity: {
      maxRiders: {
        type: Number,
        required: true,
        min: [1, 'Capacity must be at least 1 rider'],
      },
      currentOccupancy: {
        type: Number,
        default: 0,
        min: 0,
      },
      status: {
        type: String,
        enum: Object.values(CapacityStatus),
        default: CapacityStatus.AVAILABLE,
      },
    },
    operatingHours: {
      type: [OperatingHoursSchema],
      default: [],
    },
    status: {
      type: String,
      enum: Object.values(RestStopStatus),
      default: RestStopStatus.PENDING_APPROVAL,
      index: true,
    },
    rating: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      count: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    dealBadge: {
      type: String,
      trim: true,
    },
    dealDescription: {
      type: String,
      trim: true,
    },
    qrRotationVersion: {
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

// Define 2dsphere index for geospatial discovery queries ($near, $geoNear)
RestStopSchema.index({ location: '2dsphere' });
RestStopSchema.index({ 'address.city': 1, status: 1 });

export const RestStop: Model<IRestStopDocument> =
  mongoose.models.RestStop || mongoose.model<IRestStopDocument>('RestStop', RestStopSchema);
