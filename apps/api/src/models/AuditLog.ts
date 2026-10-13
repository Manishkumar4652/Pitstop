import mongoose, { Document, Model, Schema } from 'mongoose';

export type AuditTargetType = 'merchant' | 'rest_stop' | 'job' | 'deal';

export interface IAuditLogDocument extends Document {
  adminId: mongoose.Types.ObjectId;
  adminName: string;
  action: string;
  targetType: AuditTargetType;
  targetId: string;
  targetName?: string;
  prevStatus?: string;
  newStatus?: string;
  reason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AuditLogSchema = new Schema<IAuditLogDocument>(
  {
    adminId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    adminName: {
      type: String,
      required: true,
      trim: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    targetType: {
      type: String,
      enum: ['merchant', 'rest_stop', 'job', 'deal'],
      required: true,
      index: true,
    },
    targetId: {
      type: String,
      required: true,
      index: true,
    },
    targetName: {
      type: String,
      trim: true,
    },
    prevStatus: {
      type: String,
      trim: true,
    },
    newStatus: {
      type: String,
      trim: true,
    },
    reason: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, any>) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

AuditLogSchema.index({ createdAt: -1 });

export const AuditLog: Model<IAuditLogDocument> =
  mongoose.models.AuditLog || mongoose.model<IAuditLogDocument>('AuditLog', AuditLogSchema);
