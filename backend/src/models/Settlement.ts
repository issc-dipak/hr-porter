import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ISettlement extends Document {
  companyId: string;
  resignationId: string;
  employeeEmail: string;
  pendingSalary: number;
  leaveEncashment: number;
  bonus: number;
  incentives: number;
  expenseClaims: number;
  reimbursements: number;
  deductions: number;
  loans: number;
  advanceRecovery: number;
  totalSettlementAmount: number;
  status: 'HR Review' | 'Admin Approval' | 'Completed';
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SettlementSchema: Schema = new Schema(
  {
    companyId: { type: String, required: true, index: true },
    resignationId: { type: Schema.Types.ObjectId, ref: 'Resignation', required: true, index: true },
    employeeEmail: { type: String, required: true, lowercase: true, index: true },
    pendingSalary: { type: Number, default: 0 },
    leaveEncashment: { type: Number, default: 0 },
    bonus: { type: Number, default: 0 },
    incentives: { type: Number, default: 0 },
    expenseClaims: { type: Number, default: 0 },
    reimbursements: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    loans: { type: Number, default: 0 },
    advanceRecovery: { type: Number, default: 0 },
    totalSettlementAmount: { type: Number, default: 0 },
    status: {
      type: String,
      required: true,
      enum: ['HR Review', 'Admin Approval', 'Completed'],
      default: 'HR Review'
    },
    approvedBy: { type: String, default: '' },
    approvedAt: { type: Date }
  },
  { timestamps: true }
);

if (mongoose.models && mongoose.models.Settlement) {
  delete mongoose.models.Settlement;
}

export const Settlement: Model<ISettlement> = mongoose.model<ISettlement>('Settlement', SettlementSchema);
