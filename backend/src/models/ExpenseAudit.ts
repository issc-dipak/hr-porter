import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IExpenseAudit extends Document {
  companyId: string;
  expenseId: string;
  action: string; // Created, Edited, Approved, Rejected, Sent Back, Paid, Cancelled
  performedBy: string; // User email or full name
  ipAddress?: string;
  details?: string;
  timestamp: Date;
}

const ExpenseAuditSchema: Schema = new Schema(
  {
    companyId: { type: String, required: true, index: true },
    expenseId: { type: String, required: true, index: true },
    action: { type: String, required: true },
    performedBy: { type: String, required: true },
    ipAddress: { type: String, default: '127.0.0.1' },
    details: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now }
  }
);

if (mongoose.models && mongoose.models.ExpenseAudit) {
  delete mongoose.models.ExpenseAudit;
}
export const ExpenseAudit: Model<IExpenseAudit> = mongoose.model<IExpenseAudit>('ExpenseAudit', ExpenseAuditSchema);
