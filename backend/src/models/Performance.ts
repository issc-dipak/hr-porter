import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IPerformance extends Document {
  companyId?: string;
  name: string;
  dept: string;
  rating: number;
  status: string;
  goals: string;
  lastReview: string;
  createdAt: Date;
  updatedAt: Date;
}

const PerformanceSchema: Schema = new Schema(
  {
    companyId: { type: String, required: true, index: true, default: 'company_001' },
    name: { type: String, required: true },
    dept: { type: String, required: true },
    rating: { type: Number, required: true },
    status: { type: String, required: true },
    goals: { type: String, required: true },
    lastReview: { type: String, required: true }
  },
  { timestamps: true }
);

export const Performance: Model<IPerformance> = mongoose.models.Performance || mongoose.model<IPerformance>('Performance', PerformanceSchema);
