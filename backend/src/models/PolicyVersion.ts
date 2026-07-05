import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IPolicyVersion extends Document {
  policyId: mongoose.Types.ObjectId;
  version: string;
  content: string;
  changeSummary: string;
  modifiedBy: string;
  modifiedByEmail: string;
  createdAt: Date;
}

const PolicyVersionSchema: Schema = new Schema(
  {
    policyId: { type: Schema.Types.ObjectId, ref: 'Policy', required: true, index: true },
    version: { type: String, required: true },
    content: { type: String, required: true },
    changeSummary: { type: String, default: '' },
    modifiedBy: { type: String, required: true },
    modifiedByEmail: { type: String, required: true }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

delete (mongoose.models as any).PolicyVersion;
export const PolicyVersion: Model<IPolicyVersion> = mongoose.model<IPolicyVersion>('PolicyVersion', PolicyVersionSchema);
