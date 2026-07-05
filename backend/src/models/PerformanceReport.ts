import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IPerformanceReport extends Document {
  companyId?: string;
  scope: string;
  format: string;
  generatedBy: string;
  previewData: any;
  createdAt: Date;
  updatedAt: Date;
}

const PerformanceReportSchema: Schema = new Schema(
  {
    companyId: { type: String, required: true, index: true, default: 'company_001' },
    scope: { type: String, required: true },
    format: { type: String, required: true },
    generatedBy: { type: String, required: true, default: 'HR Analytics Lead' },
    previewData: { type: Schema.Types.Mixed, required: true }
  },
  { timestamps: true }
);

// Prevent mongoose from using stale cached models during hot reloads
if (mongoose.models && mongoose.models.PerformanceReport) {
  delete mongoose.models.PerformanceReport;
}
export const PerformanceReport: Model<IPerformanceReport> = mongoose.model<IPerformanceReport>('PerformanceReport', PerformanceReportSchema);
