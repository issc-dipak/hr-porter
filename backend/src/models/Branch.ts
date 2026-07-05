import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IBranch extends Document {
  companyId: string;
  branchName: string;
  branchCode: string;
  branchType: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  timezone: string;
  contactNumber?: string;
  email?: string;
  status: 'Active' | 'Inactive';
  createdAt: Date;
  updatedAt: Date;
}

const BranchSchema: Schema = new Schema(
  {
    companyId: { type: String, required: true, index: true },
    branchName: { type: String, required: true },
    branchCode: { type: String, required: true },
    branchType: { type: String, required: true, default: 'Office' },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    postalCode: { type: String, required: true },
    timezone: { type: String, required: true, default: 'UTC+05:30 (Kolkata)' },
    contactNumber: { type: String, default: '' },
    email: { type: String, default: '' },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  },
  { timestamps: true }
);

BranchSchema.index({ companyId: 1, branchCode: 1 }, { unique: true });

// Prevent mongoose from using stale cached models during hot reloads
if (mongoose.models && mongoose.models.Branch) {
  delete mongoose.models.Branch;
}
export const Branch: Model<IBranch> = mongoose.model<IBranch>('Branch', BranchSchema);
