import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IComment extends Document {
  companyId?: string;
  postId: string;
  parentId?: string;
  content: string;
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

const CommentSchema: Schema = new Schema(
  {
    companyId: { type: String, required: true, index: true, default: 'company_001' },
    postId: { type: String, required: true },
    parentId: { type: String },
    content: { type: String, required: true },
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

delete (mongoose.models as any).Comment;
export const Comment: Model<IComment> = mongoose.models.Comment || mongoose.model<IComment>('Comment', CommentSchema);
