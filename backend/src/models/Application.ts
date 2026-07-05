import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IApplication extends Document {
  companyId: string;
  jobId: string;
  candidateName: string;
  email: string;
  phone: string;
  currentCompany?: string;
  currentDesignation?: string;
  experience: string;
  currentSalary?: string;
  expectedSalary?: string;
  noticePeriod?: string;
  linkedInUrl?: string;
  portfolioUrl?: string;
  resumeUrl?: string;
  coverLetter?: string;
  source: string; // e.g. LinkedIn, Indeed, Company Website, Referral
  utmSource?: string;
  utmCampaign?: string;
  stage: 'Applied' | 'Screening' | 'Shortlisted' | 'Interview' | 'Technical Round' | 'HR Round' | 'Selected' | 'Offer Sent' | 'Joined' | 'Rejected';
  aiScore?: number; // Match score 1-100
  aiSummary?: string;
  aiSuggestedQuestions?: string[];
  education?: string;
  skills?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ApplicationSchema = new Schema(
  {
    companyId: { type: String, required: true, index: true },
    jobId: { type: String, required: true, index: true },
    candidateName: { type: String, required: true },
    email: { type: String, required: true, index: true },
    phone: { type: String, required: true },
    currentCompany: { type: String, default: '' },
    currentDesignation: { type: String, default: '' },
    experience: { type: String, default: '0 years' },
    currentSalary: { type: String, default: '' },
    expectedSalary: { type: String, default: '' },
    noticePeriod: { type: String, default: '' },
    linkedInUrl: { type: String, default: '' },
    portfolioUrl: { type: String, default: '' },
    resumeUrl: { type: String, default: '' },
    coverLetter: { type: String, default: '' },
    source: { type: String, default: 'Company Website', index: true },
    utmSource: { type: String, default: '' },
    utmCampaign: { type: String, default: '' },
    stage: {
      type: String,
      required: true,
      enum: [
        'Applied',
        'Screening',
        'Shortlisted',
        'Interview',
        'Technical Round',
        'HR Round',
        'Selected',
        'Offer Sent',
        'Joined',
        'Rejected'
      ],
      default: 'Applied',
      index: true
    },
    aiScore: { type: Number, default: 0 },
    aiSummary: { type: String, default: '' },
    aiSuggestedQuestions: { type: [String], default: [] },
    education: { type: String, default: '' },
    skills: { type: [String], default: [] }
  },
  { timestamps: true }
);

ApplicationSchema.index({ companyId: 1, jobId: 1 });
ApplicationSchema.index({ companyId: 1, stage: 1 });

// Prevent mongoose from using stale cached models
if (mongoose.models && mongoose.models.Application) {
  delete mongoose.models.Application;
}

export const Application: Model<IApplication> =
  mongoose.models.Application || mongoose.model<IApplication>('Application', ApplicationSchema);
