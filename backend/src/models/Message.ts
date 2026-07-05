import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IAttachment {
  companyId?: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface IReaction {
  companyId?: string;
  emoji: string;
  email: string;
  name: string;
}

export interface IMessage extends Document {
  companyId?: string;
  fromEmail: string;
  fromName: string;
  fromRole: string;
  toEmail: string; // 'all' for broadcast, employee email, or channel name
  toName: string;
  subject: string;
  body: string;
  type: 'birthday_wish' | 'announcement' | 'direct' | 'system' | 'messenger' | 'channel';
  isRead: boolean;
  sentAt: Date;
  channelId?: string; // Optional reference to Channel name/ID
  threadParentId?: string; // If this is a reply in a message thread
  reactions: IReaction[];
  attachments: IAttachment[];
  mentions: string[]; // List of user emails mentioned
  pinned: boolean;
  isReadBy: string[]; // List of user emails who have read this channel message
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AttachmentSchema = new Schema({
    companyId: { type: String, required: true, index: true, default: 'company_001' },
  name: { type: String, required: true },
  url: { type: String, required: true },
  type: { type: String, required: true },
  size: { type: Number, default: 0 }
}, { _id: false });

const ReactionSchema = new Schema({
    companyId: { type: String, required: true, index: true, default: 'company_001' },
  emoji: { type: String, required: true },
  email: { type: String, required: true },
  name: { type: String, required: true }
}, { _id: false });

const MessageSchema: Schema = new Schema(
  {
    companyId: { type: String, required: true, index: true, default: 'company_001' },
    fromEmail: { type: String, required: true },
    fromName: { type: String, required: true },
    fromRole: { type: String, default: 'Employee' },
    toEmail: { type: String, required: true }, // specific email, 'all', or channel ID
    toName: { type: String, default: '' },
    subject: { type: String, required: true },
    body: { type: String, default: '' },
    type: {
      type: String,
      default: 'direct'
    },
    isRead: { type: Boolean, default: false },
    sentAt: { type: Date, default: Date.now },
    channelId: { type: String, default: '' },
    threadParentId: { type: String, default: '' },
    reactions: { type: [ReactionSchema], default: [] },
    attachments: { type: [AttachmentSchema], default: [] },
    mentions: { type: [String], default: [] },
    pinned: { type: Boolean, default: false },
    isReadBy: { type: [String], default: [] },
    isDeleted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

MessageSchema.index({ companyId: 1, channelId: 1, sentAt: -1 });
MessageSchema.index({ companyId: 1, fromEmail: 1, toEmail: 1, sentAt: -1 });
MessageSchema.index({ companyId: 1, isDeleted: 1, sentAt: -1 });

if (mongoose.models && mongoose.models.Message) {
  delete mongoose.models.Message;
}
export const Message: Model<IMessage> = mongoose.model<IMessage>('Message', MessageSchema);
