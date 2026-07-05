import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ITicketComment extends Document {
  companyId: string;
  ticketId: string;
  userId: string;
  userName: string;
  userRole: string;
  comment: string;
  attachments?: string[];
  isInternal: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TicketCommentSchema: Schema = new Schema(
  {
    companyId: { type: String, required: true, index: true },
    ticketId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    userRole: { type: String, required: true },
    comment: { type: String, required: true },
    attachments: { type: [String], default: [] },
    isInternal: { type: Boolean, default: false },
  },
  { timestamps: true }
);

if (mongoose.models && mongoose.models.TicketComment) {
  delete mongoose.models.TicketComment;
}
export const TicketComment: Model<ITicketComment> = mongoose.model<ITicketComment>('TicketComment', TicketCommentSchema);
