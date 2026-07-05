import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IPayroll extends Document {
  companyId?: string;
  employee: string; // email of employee
  employeeName: string; // full name of employee
  month: string;
  branchId?: string;
  basic: number;
  hra: number;
  allowance: number;
  bonus: number;
  overtime: number;
  pf: number;
  esi: number;
  tax: number;
  otherDeductions: number;
  gross: number;
  net: number;
  workingDays: number;
  leaveDeductions: number;
  status: string; // 'Draft' | 'Pending Approval' | 'Approved' | 'Paid'
  createdAt: Date;
  updatedAt: Date;
}

const PayrollSchema: Schema = new Schema(
  {
    companyId: { type: String, required: true, index: true, default: 'company_001' },
    branchId: { type: String, default: '', index: true },
    employee: { type: String, required: true },
    employeeName: { type: String },
    month: { type: String, required: true },
    basic: { type: Number, required: true },
    hra: { type: Number, default: 0 },
    allowance: { type: Number, default: 0 },
    bonus: { type: Number, default: 0 },
    overtime: { type: Number, default: 0 },
    pf: { type: Number, default: 0 },
    esi: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    otherDeductions: { type: Number, default: 0 },
    gross: { type: Number },
    net: { type: Number, required: true },
    workingDays: { type: Number, default: 30 },
    leaveDeductions: { type: Number, default: 0 },
    status: { type: String, enum: ['Draft', 'Pending Approval', 'Approved', 'Paid', 'Pending', 'Processed', 'Processing'], default: 'Draft' }
  },
  { timestamps: true }
);

PayrollSchema.index({ companyId: 1, month: 1 });
PayrollSchema.index({ companyId: 1, employee: 1 });

delete (mongoose.models as any).Payroll;
export const Payroll: Model<IPayroll> = mongoose.model<IPayroll>('Payroll', PayrollSchema);
