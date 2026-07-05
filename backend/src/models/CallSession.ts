import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ICallSession extends Document {
  channelId: string;
  hostEmail: string;
  participants: string[];
  status: 'active' | 'completed';
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

const CallSessionSchema: Schema = new Schema(
  {
    channelId: {
      type: String,
      required: true,
      index: true
    },
    hostEmail: {
      type: String,
      required: true
    },
    participants: {
      type: [String],
      default: []
    },
    status: {
      type: String,
      enum: ['active', 'completed'],
      default: 'active'
    },
    companyId: {
      type: String,
      required: true,
      index: true
    }
  },
  { timestamps: true }
);

export const CallSession: Model<ICallSession> =
  mongoose.models.CallSession || mongoose.model<ICallSession>('CallSession', CallSessionSchema);
