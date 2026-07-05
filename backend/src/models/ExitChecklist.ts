import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IExitChecklist extends Document {
  companyId: string;
  resignationId: string;
  employeeEmail: string;
  laptopReturned: boolean;
  idCardReturned: boolean;
  companyAssetsReturned: boolean;
  assetReturned: boolean; // backward compatibility
  accessRevoked: boolean;
  knowledgeTransferCompleted: boolean;
  documentsSubmitted: boolean;
  hrClearance: boolean;
  payrollClearance: boolean;
  payrollClosed: boolean;
  financeClearance: boolean;
  settlementCompleted: boolean;
  finalSettlementCompleted: boolean;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExitChecklistSchema: Schema = new Schema(
  {
    companyId: { type: String, required: true, index: true },
    resignationId: { type: Schema.Types.ObjectId, ref: 'Resignation', required: true, index: true },
    employeeEmail: { type: String, required: true, lowercase: true, index: true },
    laptopReturned: { type: Boolean, default: false },
    idCardReturned: { type: Boolean, default: false },
    companyAssetsReturned: { type: Boolean, default: false },
    assetReturned: { type: Boolean, default: false },
    accessRevoked: { type: Boolean, default: false },
    knowledgeTransferCompleted: { type: Boolean, default: false },
    documentsSubmitted: { type: Boolean, default: false },
    hrClearance: { type: Boolean, default: false },
    payrollClearance: { type: Boolean, default: false },
    payrollClosed: { type: Boolean, default: false },
    financeClearance: { type: Boolean, default: false },
    settlementCompleted: { type: Boolean, default: false },
    finalSettlementCompleted: { type: Boolean, default: false },
    updatedBy: { type: String, default: '' }
  },
  { timestamps: true }
);

if (mongoose.models && mongoose.models.ExitChecklist) {
  delete mongoose.models.ExitChecklist;
}

export const ExitChecklist: Model<IExitChecklist> = mongoose.model<IExitChecklist>('ExitChecklist', ExitChecklistSchema);
