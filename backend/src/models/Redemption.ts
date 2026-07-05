import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IRedemption extends Document {
  companyId: string;
  employeeId: string;
  employeeName: string;
  rewardId: string;
  rewardName: string;
  pointsRedeemed: number;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Delivered';
  deliveryNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RedemptionSchema: Schema = new Schema(
  {
    companyId: { type: String, required: true, index: true, default: 'company_001' },
    employeeId: { type: String, required: true, index: true },
    employeeName: { type: String, required: true },
    rewardId: { type: String, required: true },
    rewardName: { type: String, required: true },
    pointsRedeemed: { type: Number, required: true },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Delivered'],
      default: 'Pending'
    },
    deliveryNote: { type: String, default: '' }
  },
  { timestamps: true }
);

if (mongoose.models && mongoose.models.Redemption) {
  delete mongoose.models.Redemption;
}
export const Redemption: Model<IRedemption> = mongoose.model<IRedemption>('Redemption', RedemptionSchema);
