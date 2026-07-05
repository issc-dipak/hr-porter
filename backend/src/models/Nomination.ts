import mongoose, { Document, Model, Schema } from 'mongoose';

export interface INomination extends Document {
  companyId: string;
  nomineeId: string;
  nomineeName: string;
  nomineeDepartment?: string;
  nominatorId: string;
  nominatorName: string;
  category: string; // Employee of the Month, Team Leadership, Innovation Hero, etc.
  reason: string;
  evidence?: string; // links / text
  status: 'Pending' | 'Approved' | 'Rejected';
  approvedById?: string;
  approvedByName?: string;
  pointsRewarded?: number;
  createdAt: Date;
  updatedAt: Date;
}

const NominationSchema: Schema = new Schema(
  {
    companyId: { type: String, required: true, index: true, default: 'company_001' },
    nomineeId: { type: String, required: true, index: true },
    nomineeName: { type: String, required: true },
    nomineeDepartment: { type: String },
    nominatorId: { type: String, required: true },
    nominatorName: { type: String, required: true },
    category: { type: String, required: true },
    reason: { type: String, required: true },
    evidence: { type: String, default: '' },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending'
    },
    approvedById: { type: String },
    approvedByName: { type: String },
    pointsRewarded: { type: Number, default: 0 }
  },
  { timestamps: true }
);

if (mongoose.models && mongoose.models.Nomination) {
  delete mongoose.models.Nomination;
}
export const Nomination: Model<INomination> = mongoose.model<INomination>('Nomination', NominationSchema);
