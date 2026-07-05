import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IPost extends Document {
  companyId?: string;
  title?: string;
  content: string;
  attachments?: { name: string; url: string; fileType: string }[];
  tags?: string[];
  pinned?: boolean;
  createdBy: {
    name: string;
    email: string;
    role: string;
    department?: string;
    avatar?: string;
  };
  reactions?: { emoji: string; users: string[] }[];
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema: Schema = new Schema(
  {
    companyId: { type: String, required: true, index: true, default: 'company_001' },
    title: { type: String },
    content: { type: String, required: true },
    attachments: [
      {
        name: { type: String },
        url: { type: String },
        fileType: { type: String }
      }
    ],
    tags: [{ type: String }],
    pinned: { type: Boolean, default: false },
    createdBy: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      role: { type: String, required: true },
      department: { type: String },
      avatar: { type: String }
    },
    reactions: [
      {
        emoji: { type: String },
        users: [{ type: String }]
      }
    ]
  },
  { timestamps: true }
);

delete (mongoose.models as any).Post;
export const Post: Model<IPost> = mongoose.models.Post || mongoose.model<IPost>('Post', PostSchema);
