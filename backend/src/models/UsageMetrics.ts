import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IUsageMetrics extends Document {
  companyId: string;
  totalEmployees: number;
  activeEmployees: number;
  storageUsageBytes: number;
  apiCallsCount: number;
  aiQueriesCount: number;
  monthlyTransactionsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const UsageMetricsSchema: Schema = new Schema(
  {
    companyId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    totalEmployees: {
      type: Number,
      default: 0,
    },
    activeEmployees: {
      type: Number,
      default: 0,
    },
    storageUsageBytes: {
      type: Number,
      default: 0,
    },
    apiCallsCount: {
      type: Number,
      default: 0,
    },
    aiQueriesCount: {
      type: Number,
      default: 0,
    },
    monthlyTransactionsCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

if (mongoose.models && mongoose.models.UsageMetrics) {
  delete mongoose.models.UsageMetrics;
}

export const UsageMetrics: Model<IUsageMetrics> =
  mongoose.models.UsageMetrics || mongoose.model<IUsageMetrics>('UsageMetrics', UsageMetricsSchema);
