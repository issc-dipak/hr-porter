import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IPayment extends Document {
  paymentId: string;
  companyId: string;
  amount: number;
  currency: string;
  status: 'success' | 'failed' | 'pending';
  gateway: 'stripe' | 'razorpay' | 'system';
  transactionId: string;
  invoiceId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema: Schema = new Schema(
  {
    paymentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    companyId: {
      type: String,
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    status: {
      type: String,
      enum: ['success', 'failed', 'pending'],
      default: 'pending',
      index: true,
    },
    gateway: {
      type: String,
      enum: ['stripe', 'razorpay', 'system'],
      default: 'system',
    },
    transactionId: {
      type: String,
      required: true,
    },
    invoiceId: {
      type: String,
      index: true,
    },
  },
  { timestamps: true }
);

if (mongoose.models && mongoose.models.Payment) {
  delete mongoose.models.Payment;
}

export const Payment: Model<IPayment> =
  mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);
