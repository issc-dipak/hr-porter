import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IScorecard {
  companyId?: string;
  interviewerRating?: number;
  feedbackComments?: string;
  recommendation?: string;
}

export interface IInterviewSchedule {
  companyId?: string;
  round: string;
  date: string;
  time: string;
  interviewer: string;
  meetingLink: string;
  completed: boolean;
  location?: string;
}

export interface IApplicant {
  companyId?: string;
  name: string;
  email: string;
  phone: string;
  status: string; // 'Applied' | 'Screening' | 'Shortlisted' | 'Interview' | 'Technical Round' | 'HR Round' | 'Offer Sent' | 'Hired' | 'Rejected'
  date: string;
  resumeUrl?: string;
  skills?: string[];
  experience?: string;
  rating?: number; // AI match score (1-100)
  branchId?: string;
  scorecard?: IScorecard;
  interviews?: IInterviewSchedule[];
}

export interface IJob extends Document {
  companyId?: string;
  title: string;
  dept: string;
  location: string;
  salary: string;
  type: string;
  experienceLevel: string; // 'Junior' | 'Mid' | 'Senior' | 'Lead'
  description?: string;
  requirements?: string[];
  branchId?: string;
  applicants: IApplicant[];
  status: string; // 'Active' | 'Closed' | 'On Hold' | 'Draft' | 'Published'
  postedDate: string;
  openPositions?: number;
  responsibilities?: string[];
  benefits?: string[];
  applicationDeadline?: string;
  publicUrlSlug?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InterviewScheduleSchema = new Schema({
    companyId: { type: String, required: true, index: true, default: 'company_001' },
  round: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  interviewer: { type: String, required: true },
  meetingLink: { type: String, default: '' },
  completed: { type: Boolean, default: false },
  location: { type: String, default: '' }
});

const ScorecardSchema = new Schema({
    companyId: { type: String, required: true, index: true, default: 'company_001' },
  interviewerRating: { type: Number, default: 0 },
  feedbackComments: { type: String, default: '' },
  recommendation: { type: String, default: '' }
});

const ApplicantSchema = new Schema({
    companyId: { type: String, required: true, index: true, default: 'company_001' },
  name: { type: String, required: true },
  branchId: { type: String, default: '', index: true },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  status: { type: String, required: true, default: 'Applied' },
  date: { type: String, required: true },
  resumeUrl: { type: String, default: '' },
  skills: { type: [String], default: [] },
  experience: { type: String, default: '0 years' },
  rating: { type: Number, default: 0 },
  scorecard: { type: ScorecardSchema, default: {} },
  interviews: { type: [InterviewScheduleSchema], default: [] }
});

const JobSchema: Schema = new Schema(
  {
    companyId: { type: String, required: true, index: true, default: 'company_001' },
    branchId: { type: String, default: '', index: true },
    title: { type: String, required: true },
    dept: { type: String, required: true },
    location: { type: String, required: true },
    salary: { type: String, required: true },
    type: { type: String, required: true },
    experienceLevel: { type: String, default: 'Mid' },
    description: { type: String, default: '' },
    requirements: { type: [String], default: [] },
    responsibilities: { type: [String], default: [] },
    benefits: { type: [String], default: [] },
    applicationDeadline: { type: String, default: '' },
    openPositions: { type: Number, default: 1 },
    publicUrlSlug: { type: String, default: '', index: true },
    applicants: { type: [ApplicantSchema], default: [] },
    status: { type: String, enum: ['Active', 'Closed', 'On Hold', 'Draft', 'Published'], default: 'Active' },
    postedDate: { type: String }
  },
  { timestamps: true }
);

export const Job: Model<IJob> = mongoose.models.Job || mongoose.model<IJob>('Job', JobSchema);
