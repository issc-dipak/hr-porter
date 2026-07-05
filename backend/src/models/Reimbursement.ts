import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IApprovalStep {
  status: string;
  approvedBy?: string;
  approvedAt?: Date;
  comment?: string;
}

export interface ICommentHistory {
  user: string;
  role: string;
  text: string;
  timestamp: Date;
}

export interface IOcrData {
  vendorName?: string;
  amount?: number;
  date?: string;
  gstNumber?: string;
  expenseCategory?: string;
}

export interface IFraudCheck {
  isDuplicateReceipt?: boolean;
  isDuplicateClaim?: boolean;
  isSuspiciousAmount?: boolean;
  isRepeatedExpense?: boolean;
  policyViolations?: string[];
  riskScore?: number;
}

export interface IReimbursement extends Document {
  companyId?: string;
  employee: string; // Employee email
  employeeId?: string; // Optional employee ID string
  name: string; // Employee full name
  type: string; // Backwards compatible type field (e.g. category)
  expenseType?: string; // Standardized field (e.g. Travel, Food)
  amount: number;
  claimDate: string; // Backwards compatible claimDate string
  expenseDate?: string; // Standardized field for expense date
  description: string;
  receiptUrl?: string;
  status: string; // Draft, Submitted, Manager Review, HR Review, Finance Approval, Paid, Rejected, Returned For Changes, Cancelled
  comment?: string;
  project?: string;
  department?: string;
  managerApproval?: IApprovalStep;
  hrApproval?: IApprovalStep;
  financeApproval?: IApprovalStep;
  paidDate?: Date;
  comments?: ICommentHistory[];
  ocrData?: IOcrData;
  fraudCheck?: IFraudCheck;
  createdAt: Date;
  updatedAt: Date;
}

const ApprovalStepSchema = new Schema({
  status: { type: String, default: 'Pending' },
  approvedBy: { type: String, default: '' },
  approvedAt: { type: Date },
  comment: { type: String, default: '' }
}, { _id: false });

const CommentHistorySchema = new Schema({
  user: { type: String, required: true },
  role: { type: String, required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const OcrDataSchema = new Schema({
  vendorName: { type: String, default: '' },
  amount: { type: Number, default: 0 },
  date: { type: String, default: '' },
  gstNumber: { type: String, default: '' },
  expenseCategory: { type: String, default: '' }
}, { _id: false });

const FraudCheckSchema = new Schema({
  isDuplicateReceipt: { type: Boolean, default: false },
  isDuplicateClaim: { type: Boolean, default: false },
  isSuspiciousAmount: { type: Boolean, default: false },
  isRepeatedExpense: { type: Boolean, default: false },
  policyViolations: [{ type: String }],
  riskScore: { type: Number, default: 0 }
}, { _id: false });

const ReimbursementSchema: Schema = new Schema(
  {
    companyId: { type: String, required: true, index: true, default: 'company_001' },
    employee: { type: String, required: true, index: true },
    employeeId: { type: String, required: false },
    name: { type: String, required: true },
    type: { type: String, required: true }, // travel, fuel, food, hotel, internet, mobile bill, medical, office supplies, training, client meeting, other
    expenseType: { type: String, required: false },
    amount: { type: Number, required: true },
    claimDate: { type: String, required: true },
    expenseDate: { type: String, required: false },
    description: { type: String, required: true },
    receiptUrl: { type: String, required: false },
    status: { type: String, required: true, default: 'Submitted' },
    comment: { type: String, required: false },
    project: { type: String, required: false },
    department: { type: String, required: false },
    managerApproval: { type: ApprovalStepSchema, default: () => ({ status: 'Pending' }) },
    hrApproval: { type: ApprovalStepSchema, default: () => ({ status: 'Pending' }) },
    financeApproval: { type: ApprovalStepSchema, default: () => ({ status: 'Pending' }) },
    paidDate: { type: Date, required: false },
    comments: { type: [CommentHistorySchema], default: [] },
    ocrData: { type: OcrDataSchema, default: () => ({}) },
    fraudCheck: { type: FraudCheckSchema, default: () => ({}) }
  },
  { timestamps: true }
);

if (mongoose.models && mongoose.models.Reimbursement) {
  delete mongoose.models.Reimbursement;
}
export const Reimbursement: Model<IReimbursement> = mongoose.model<IReimbursement>('Reimbursement', ReimbursementSchema);

