import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IFeedNotification extends Document {
  companyId?: string;
  recipient: string;
  sender: {
    name: string;
    avatar?: string;
  };
  type: 'like' | 'comment' | 'reply' | 'mention' | 'announcement';
  postId: string;
  content: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FeedNotificationSchema: Schema = new Schema(
  {
    companyId: { type: String, required: true, index: true, default: 'company_001' },
    recipient: { type: String, required: true },
    sender: {
      name: { type: String, required: true },
      avatar: { type: String }
    },
    type: { type: String, required: true, enum: ['like', 'comment', 'reply', 'mention', 'announcement'] },
    postId: { type: String, required: true },
    content: { type: String, required: true },
    read: { type: Boolean, default: false }
  },
  { timestamps: true }
);

delete (mongoose.models as any).FeedNotification;
export const FeedNotification: Model<IFeedNotification> = mongoose.models.FeedNotification || mongoose.model<IFeedNotification>('FeedNotification', FeedNotificationSchema);
