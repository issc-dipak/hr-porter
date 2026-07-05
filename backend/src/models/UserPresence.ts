import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IUserPresence extends Document {
  companyId?: string;
  email: string;
  status: 'online' | 'offline' | 'busy' | 'away' | 'meeting' | 'remote';
  statusText: string;
  lastSeen: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserPresenceSchema: Schema = new Schema(
  {
    companyId: { type: String, required: true, index: true, default: 'company_001' },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    status: {
      type: String,
      enum: ['online', 'offline', 'busy', 'away', 'meeting', 'remote'],
      default: 'online'
    },
    statusText: {
      type: String,
      default: ''
    },
    lastSeen: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

export const UserPresence: Model<IUserPresence> =
  mongoose.models.UserPresence || mongoose.model<IUserPresence>('UserPresence', UserPresenceSchema);
