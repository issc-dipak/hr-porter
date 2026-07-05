import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IInvoice extends Document {
  invoiceNumber: string;
  companyId: string;
  companyName: string;
  gstNumber?: string;
  planName: string;
  billingPeriod: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  paymentStatus: 'paid' | 'unpaid' | 'failed';
  pdfUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceSchema: Schema = new Schema(
  {
    invoiceNumber: {
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
    companyName: {
      type: String,
      required: true,
    },
    gstNumber: {
      type: String,
      default: '',
    },
    planName: {
      type: String,
      required: true,
    },
    billingPeriod: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    taxAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['paid', 'unpaid', 'failed'],
      default: 'unpaid',
      index: true,
    },
    pdfUrl: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

if (mongoose.models && mongoose.models.Invoice) {
  delete mongoose.models.Invoice;
}

export const Invoice: Model<IInvoice> =
  mongoose.models.Invoice || mongoose.model<IInvoice>('Invoice', InvoiceSchema);
