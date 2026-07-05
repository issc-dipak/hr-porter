import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ISecurityLog extends Document {
  ip: string;
  email?: string;
  action: 'registration' | 'otp_request';
  createdAt: Date;
}

const SecurityLogSchema: Schema = new Schema(
  {
    ip: {
      type: String,
      required: true,
      index: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: ['registration', 'otp_request'],
      index: true,
    },
  },
  { 
    timestamps: { createdAt: true, updatedAt: false } 
  }
);

// Prevent mongoose from using stale cached models during hot reloads
if (mongoose.models && mongoose.models.SecurityLog) {
  delete mongoose.models.SecurityLog;
}

export const SecurityLog: Model<ISecurityLog> = mongoose.model<ISecurityLog>('SecurityLog', SecurityLogSchema);
