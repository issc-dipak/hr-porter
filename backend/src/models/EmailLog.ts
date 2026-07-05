import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IEmailLog extends Document {
  companyId?: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  sent: boolean;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EmailLogSchema: Schema = new Schema(
  {
    companyId: { type: String, index: true },
    to: { type: String, required: true, lowercase: true, index: true },
    subject: { type: String, required: true },
    text: { type: String },
    html: { type: String },
    sent: { type: Boolean, default: false },
    error: { type: String }
  },
  { timestamps: true }
);

if (mongoose.models && mongoose.models.EmailLog) {
  delete mongoose.models.EmailLog;
}

export const EmailLog: Model<IEmailLog> =
  mongoose.models.EmailLog || mongoose.model<IEmailLog>('EmailLog', EmailLogSchema);
