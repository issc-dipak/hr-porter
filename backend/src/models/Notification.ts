import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IChatNotification extends Document {
  companyId: string; // Acts as workspaceId
  userId: string; // Recipient email
  senderEmail: string;
  senderName: string;
  senderAvatar?: string;
  type: 'direct_message' | 'mention' | 'channel_message';
  entityId: string; // Message ID or Channel ID
  content: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema: Schema = new Schema(
  {
    companyId: {
      type: String,
      required: true,
      index: true
    },
    userId: {
      type: String,
      required: true,
      index: true,
      lowercase: true
    },
    senderEmail: {
      type: String,
      required: true,
      lowercase: true
    },
    senderName: {
      type: String,
      required: true
    },
    senderAvatar: {
      type: String,
      default: ''
    },
    type: {
      type: String,
      required: true,
      enum: ['direct_message', 'mention', 'channel_message']
    },
    entityId: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true
    },
    read: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

NotificationSchema.index({ companyId: 1, userId: 1, read: 1 });

// Prevent mongoose from using stale cached models
if (mongoose.models && mongoose.models.ChatNotification) {
  delete mongoose.models.ChatNotification;
}

export const ChatNotification: Model<IChatNotification> =
  mongoose.models.ChatNotification || mongoose.model<IChatNotification>('ChatNotification', NotificationSchema);
