import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IRewardCatalog extends Document {
  companyId: string;
  name: string;
  pointsRequired: number;
  category: 'Voucher' | 'Merchandise' | 'Off-time' | 'Learning' | 'Other';
  stock: number;
  description: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RewardCatalogSchema: Schema = new Schema(
  {
    companyId: { type: String, required: true, index: true, default: 'company_001' },
    name: { type: String, required: true },
    pointsRequired: { type: Number, required: true },
    category: {
      type: String,
      enum: ['Voucher', 'Merchandise', 'Off-time', 'Learning', 'Other'],
      default: 'Merchandise'
    },
    stock: { type: Number, default: 0 },
    description: { type: String, default: '' },
    imageUrl: { type: String, default: '' }
  },
  { timestamps: true }
);

if (mongoose.models && mongoose.models.RewardCatalog) {
  delete mongoose.models.RewardCatalog;
}
export const RewardCatalog: Model<IRewardCatalog> = mongoose.model<IRewardCatalog>('RewardCatalog', RewardCatalogSchema);
