import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IWalletTransaction {
  companyId?: string;
  transactionId: string;
  amount: number;
  type: 'Credit' | 'Debit';
  description: string;
  timestamp?: Date;
}

export interface IWallet extends Document {
  companyId?: string;
  balance: number;
  transactions: IWalletTransaction[];
  createdAt: Date;
  updatedAt: Date;
}

const WalletTransactionSchema = new Schema({
    companyId: { type: String, required: true, index: true, default: 'company_001' },
  transactionId: { type: String, required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['Credit', 'Debit'], required: true },
  description: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const WalletSchema: Schema = new Schema({
    companyId: { type: String, required: true, index: true, default: 'company_001' },
  balance: { type: Number, default: 0 },
  transactions: { type: [WalletTransactionSchema], default: [] }
}, { timestamps: true });

if (mongoose.models && mongoose.models.Wallet) {
  delete mongoose.models.Wallet;
}
export const Wallet: Model<IWallet> = mongoose.model<IWallet>('Wallet', WalletSchema);
