import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IEmployeeOfTheMonth extends Document {
  companyId: string;
  employeeId: string;
  employeeName: string;
  department?: string;
  photoUrl?: string;
  month: string; // e.g. "2026-07"
  achievement: string;
  rewardPoints: number;
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeOfTheMonthSchema: Schema = new Schema(
  {
    companyId: { type: String, required: true, index: true, default: 'company_001' },
    employeeId: { type: String, required: true, index: true },
    employeeName: { type: String, required: true },
    department: { type: String },
    photoUrl: { type: String, default: '' },
    month: { type: String, required: true, index: true }, // format "YYYY-MM"
    achievement: { type: String, required: true },
    rewardPoints: { type: Number, default: 500 }
  },
  { timestamps: true }
);

if (mongoose.models && mongoose.models.EmployeeOfTheMonth) {
  delete mongoose.models.EmployeeOfTheMonth;
}
export const EmployeeOfTheMonth: Model<IEmployeeOfTheMonth> = mongoose.model<IEmployeeOfTheMonth>('EmployeeOfTheMonth', EmployeeOfTheMonthSchema);
