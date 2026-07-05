import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IConversation extends Document {
  name?: string;
  type: 'dm' | 'group';
  members: string[]; // User emails in the conversation
  companyId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema: Schema = new Schema(
  {
    name: {
      type: String,
      default: '',
      trim: true
    },
    type: {
      type: String,
      enum: ['dm', 'group'],
      required: true,
      default: 'dm'
    },
    members: {
      type: [String],
      required: true,
      default: []
    },
    companyId: {
      type: String,
      required: true,
      index: true
    },
    createdBy: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

ConversationSchema.index({ companyId: 1, members: 1 });

// Prevent mongoose from using stale cached models
export const Conversation: Model<IConversation> =
  mongoose.models.Conversation || mongoose.model<IConversation>('Conversation', ConversationSchema);
