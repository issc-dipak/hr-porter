import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IReportSchedule extends Document {
  companyId: string;
  email: string;
  reportType: string;
  frequency: 'Daily' | 'Weekly' | 'Monthly';
  time: string; // e.g. "09:00"
  lastSentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ReportScheduleSchema: Schema = new Schema(
  {
    companyId: { type: String, required: true, index: true },
    email: { type: String, required: true },
    reportType: { type: String, required: true, default: 'all' },
    frequency: { type: String, required: true, enum: ['Daily', 'Weekly', 'Monthly'] },
    time: { type: String, required: true },
    lastSentAt: { type: Date }
  },
  { timestamps: true }
);

delete (mongoose.models as any).ReportSchedule;
export const ReportSchedule: Model<IReportSchedule> = mongoose.model<IReportSchedule>('ReportSchedule', ReportScheduleSchema);
