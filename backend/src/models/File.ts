import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IFile extends Document {
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedBy: string; // User email
  channelId?: string;
  conversationId?: string;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

const FileSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    url: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true,
      default: 0
    },
    uploadedBy: {
      type: String,
      required: true
    },
    channelId: {
      type: String,
      default: ''
    },
    conversationId: {
      type: String,
      default: ''
    },
    companyId: {
      type: String,
      required: true,
      index: true
    }
  },
  { timestamps: true }
);

export const File: Model<IFile> =
  mongoose.models.File || mongoose.model<IFile>('File', FileSchema);
