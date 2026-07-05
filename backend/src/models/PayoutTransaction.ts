import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IPayoutTransaction extends Document {
  companyId: string;
  employeeId: string;
  expenseId: string;
  amount: number;
  payoutProvider: 'RazorpayX' | 'Cashfree' | 'Decentro';
  payoutReference: string; // The merchant-provided reference ID
  transactionId: string; // The provider-returned unique transaction ID
  paymentMethod: 'IMPS' | 'NEFT' | 'RTGS' | 'UPI';
  status: 'Pending' | 'Processing' | 'Paid' | 'Failed' | 'Reversed';
  processedAt: Date;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PayoutTransactionSchema: Schema = new Schema(
  {
    companyId: { type: String, required: true, index: true },
    employeeId: { type: String, required: true, index: true },
    expenseId: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    payoutProvider: { type: String, required: true, enum: ['RazorpayX', 'Cashfree', 'Decentro'] },
    payoutReference: { type: String, required: true, unique: true, index: true },
    transactionId: { type: String, required: true, index: true },
    paymentMethod: { type: String, required: true, enum: ['IMPS', 'NEFT', 'RTGS', 'UPI'], default: 'IMPS' },
    status: { type: String, required: true, enum: ['Pending', 'Processing', 'Paid', 'Failed', 'Reversed'], default: 'Pending' },
    processedAt: { type: Date, default: Date.now },
    errorMessage: { type: String }
  },
  { timestamps: true }
);

if (mongoose.models && mongoose.models.PayoutTransaction) {
  delete mongoose.models.PayoutTransaction;
}
export const PayoutTransaction: Model<IPayoutTransaction> = mongoose.model<IPayoutTransaction>('PayoutTransaction', PayoutTransactionSchema);
