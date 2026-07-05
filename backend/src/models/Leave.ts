import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ILeave extends Document {
  companyId?: string;
  employee: string;
  name: string;
  type: string;
  duration: string;
  date: string;
  reason: string;
  dept: string;
  branchId?: string;
  status: string;
  companyName: string;
  startDate?: string;
  endDate?: string;
  rejectReason?: string;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LeaveSchema: Schema = new Schema(
  {
    companyId: { type: String, required: true, index: true, default: 'company_001' },
    branchId: { type: String, default: '', index: true },
    employee: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String, required: true },
    duration: { type: String, required: false },
    date: { type: String, required: true },
    reason: { type: String, required: true },
    dept: { type: String, required: true },
    status: { type: String, required: true, default: 'Pending' },
    companyName: { type: String, default: 'HR Core Labs' },
  },
  { timestamps: true }
);

LeaveSchema.index({ companyId: 1, status: 1 });
LeaveSchema.index({ companyId: 1, employee: 1 });

// Prevent mongoose from using stale cached models during hot reloads
if (mongoose.models && mongoose.models.Leave) {
  delete mongoose.models.Leave;
}
export const Leave: Model<ILeave> = mongoose.model<ILeave>('Leave', LeaveSchema);
