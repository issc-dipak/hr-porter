import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IAsset extends Document {
  companyId?: string;
  name: string;
  type: string; // 'Hardware' | 'Software' | 'Accessory' | 'Other'
  branchId?: string;
  serialNumber: string;
  assignedTo: string; // email of employee
  status: string; // 'Available' | 'Assigned' | 'Under Repair' | 'Retired'
  assignedDate: string;
  value: number;
  companyName: string;
  createdAt: Date;
  updatedAt: Date;
}

const AssetSchema: Schema = new Schema(
  {
    companyId: { type: String, required: true, index: true, default: 'company_001' },
    branchId: { type: String, default: '', index: true },
    name: { type: String, required: true },
    type: { type: String, required: true, default: 'Hardware' },
    serialNumber: { type: String, required: true, unique: true },
    assignedTo: { type: String, default: '' },
    status: { type: String, required: true, default: 'Available' },
    assignedDate: { type: String, default: '' },
    value: { type: Number, default: 0 },
    companyName: { type: String, default: 'HR Core Labs' },
  },
  { timestamps: true }
);

delete (mongoose.models as any).Asset;
export const Asset: Model<IAsset> = mongoose.model<IAsset>('Asset', AssetSchema);
