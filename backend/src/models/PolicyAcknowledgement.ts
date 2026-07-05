import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IPolicyAcknowledgement extends Document {
  companyId: string;
  policyId: mongoose.Types.ObjectId;
  userId: string;
  employeeName: string;
  employeeEmail: string;
  ipAddress: string;
  version: string;
  acknowledgedAt: Date;
}

const PolicyAcknowledgementSchema: Schema = new Schema(
  {
    companyId: { type: String, required: true, index: true },
    policyId: { type: Schema.Types.ObjectId, ref: 'Policy', required: true, index: true },
    userId: { type: String, required: true },
    employeeName: { type: String, required: true },
    employeeEmail: { type: String, required: true },
    ipAddress: { type: String, required: true },
    version: { type: String, required: true, default: '1.0' },
    acknowledgedAt: { type: Date, required: true, default: Date.now }
  },
  { timestamps: false }
);

delete (mongoose.models as any).PolicyAcknowledgement;
export const PolicyAcknowledgement: Model<IPolicyAcknowledgement> = mongoose.model<IPolicyAcknowledgement>('PolicyAcknowledgement', PolicyAcknowledgementSchema);
