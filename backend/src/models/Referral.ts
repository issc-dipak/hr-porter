import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IReferral extends Document {
  companyId?: string;
  referrerName: string;
  referrerEmail: string;
  candidateName: string;
  candidateEmail: string;
  jobId: mongoose.Types.ObjectId;
  role: string;
  status: 'Submitted' | 'Under Review' | 'Interview Scheduled' | 'Selected' | 'Rejected' | 'Bonus Credited';
  bonus: number;
  date: string;
  notes?: string;
  experience?: string;
  resumeUrl?: string;
  skills?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ReferralSchema: Schema = new Schema(
  {
    companyId: { type: String, required: true, index: true, default: 'company_001' },
    referrerName: { type: String, required: true },
    referrerEmail: { type: String, required: true },
    candidateName: { type: String, required: true },
    candidateEmail: { type: String, required: true },
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
    role: { type: String, required: true },
    status: {
      type: String,
      enum: ['Submitted', 'Under Review', 'Interview Scheduled', 'Selected', 'Rejected', 'Bonus Credited'],
      default: 'Submitted',
      required: true
    },
    bonus: { type: Number, default: 0 },
    date: { type: String, required: true },
    notes: { type: String, default: '' },
    experience: { type: String, default: '' },
    resumeUrl: { type: String, default: '' },
    skills: { type: [String], default: [] }
  },
  { timestamps: true }
);

// Prevent mongoose from using stale cached models during hot reloads
if (mongoose.models && mongoose.models.Referral) {
  delete mongoose.models.Referral;
}

export const Referral: Model<IReferral> = mongoose.model<IReferral>('Referral', ReferralSchema);
