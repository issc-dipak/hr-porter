import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IReport extends Document {
  companyId?: string;
  contentType: 'post' | 'comment';
  contentId: string;
  reason: string;
  reportedBy: string;
  status: 'pending' | 'resolved';
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema: Schema = new Schema(
  {
    companyId: { type: String, required: true, index: true, default: 'company_001' },
    contentType: { type: String, required: true, enum: ['post', 'comment'] },
    contentId: { type: String, required: true },
    reason: { type: String, required: true },
    reportedBy: { type: String, required: true },
    status: { type: String, required: true, enum: ['pending', 'resolved'], default: 'pending' }
  },
  { timestamps: true }
);

delete (mongoose.models as any).Report;
export const Report: Model<IReport> = mongoose.models.Report || mongoose.model<IReport>('Report', ReportSchema);
