import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IChannel extends Document {
  companyId?: string;
  name: string;
  description: string;
  type: 'department' | 'project' | 'company' | 'private';
  members: string[]; // User emails allowed in the channel
  isPrivate: boolean;
  pinnedMessages: string[]; // Message IDs
  createdBy: string;
  companyName: string;
  createdAt: Date;
  updatedAt: Date;
}

const ChannelSchema: Schema = new Schema(
  {
    companyId: { type: String, required: true, index: true, default: 'company_001' },
    name: {
      type: String,
      required: [true, 'Please provide a channel name'],
      trim: true,
      lowercase: true
    },
    description: {
      type: String,
      default: ''
    },
    type: {
      type: String,
      enum: ['department', 'project', 'company', 'private'],
      default: 'company'
    },
    members: {
      type: [String],
      default: []
    },
    isPrivate: {
      type: Boolean,
      default: false
    },
    pinnedMessages: {
      type: [String],
      default: []
    },
    createdBy: {
      type: String,
      required: true
    },
    companyName: {
      type: String,
      default: 'HR Core Labs'
    }
  },
  { timestamps: true }
);

// Prevent compiling model multiple times
export const Channel: Model<IChannel> =
  mongoose.models.Channel || mongoose.model<IChannel>('Channel', ChannelSchema);
