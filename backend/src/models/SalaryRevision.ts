import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ISalarySnapshot {
  basic: number;
  hra: number;
  medicalAllowance: number;
  travelAllowance: number;
  specialAllowance: number;
  otherEarnings: number;
  bonus: number;
  pf: number;
  esi: number;
  professionalTax: number;
  tds: number;
  otherDeductions: number;
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  monthlyCTC: number;
  annualCTC: number;
}

export interface ISalaryRevision extends Document {
  companyId: string;
  employeeId: string;
  employeeEmail: string;
  employeeName: string;
  department: string;
  designation: string;
  revisionType: 'Increment' | 'Decrement' | 'Promotion' | 'Annual Increment' | 'Custom';
  oldSalary: ISalarySnapshot;
  newSalary: ISalarySnapshot;
  incrementAmount: number;
  incrementPercent: number;
  reason: string;
  effectiveDate: Date;
  approvedBy: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  rejectionReason?: string;
  approvedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SalarySnapshotSchema = new Schema({
  basic: { type: Number, default: 0 },
  hra: { type: Number, default: 0 },
  medicalAllowance: { type: Number, default: 0 },
  travelAllowance: { type: Number, default: 0 },
  specialAllowance: { type: Number, default: 0 },
  otherEarnings: { type: Number, default: 0 },
  bonus: { type: Number, default: 0 },
  pf: { type: Number, default: 0 },
  esi: { type: Number, default: 0 },
  professionalTax: { type: Number, default: 0 },
  tds: { type: Number, default: 0 },
  otherDeductions: { type: Number, default: 0 },
  grossSalary: { type: Number, default: 0 },
  totalDeductions: { type: Number, default: 0 },
  netSalary: { type: Number, default: 0 },
  monthlyCTC: { type: Number, default: 0 },
  annualCTC: { type: Number, default: 0 },
}, { _id: false });

const SalaryRevisionSchema: Schema = new Schema(
  {
    companyId: { type: String, required: true, index: true },
    employeeId: { type: String, required: true, index: true },
    employeeEmail: { type: String, required: true },
    employeeName: { type: String, required: true },
    department: { type: String, default: '' },
    designation: { type: String, default: '' },
    revisionType: {
      type: String,
      enum: ['Increment', 'Decrement', 'Promotion', 'Annual Increment', 'Custom'],
      required: true
    },
    oldSalary: { type: SalarySnapshotSchema, required: true },
    newSalary: { type: SalarySnapshotSchema, required: true },
    incrementAmount: { type: Number, default: 0 },
    incrementPercent: { type: Number, default: 0 },
    reason: { type: String, required: true },
    effectiveDate: { type: Date, required: true },
    approvedBy: { type: String, default: '' },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending'
    },
    rejectionReason: { type: String },
    approvedAt: { type: Date },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

SalaryRevisionSchema.index({ companyId: 1, employeeId: 1 });
SalaryRevisionSchema.index({ companyId: 1, status: 1 });
SalaryRevisionSchema.index({ companyId: 1, createdAt: -1 });

if (mongoose.models && mongoose.models.SalaryRevision) {
  delete mongoose.models.SalaryRevision;
}

export const SalaryRevision: Model<ISalaryRevision> = mongoose.model<ISalaryRevision>('SalaryRevision', SalaryRevisionSchema);
