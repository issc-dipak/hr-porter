import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IInterview extends Document {
  companyId: string;
  applicationId: string;
  interviewerId?: string;
  interviewerName: string;
  round: string; // e.g. HR Interview, Technical Interview, Final Interview
  interviewDate: string;
  interviewTime: string;
  meetingLink?: string;
  feedback?: string;
  rating?: number; // 1 to 5 stars
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const InterviewSchema = new Schema(
  {
    companyId: { type: String, required: true, index: true },
    applicationId: { type: String, required: true, index: true },
    interviewerId: { type: String, default: '' },
    interviewerName: { type: String, required: true },
    round: { type: String, required: true },
    interviewDate: { type: String, required: true },
    interviewTime: { type: String, required: true },
    meetingLink: { type: String, default: '' },
    feedback: { type: String, default: '' },
    rating: { type: Number, default: 0 },
    completed: { type: Boolean, default: false }
  },
  { timestamps: true }
);

// Prevent mongoose from using stale cached models
if (mongoose.models && mongoose.models.Interview) {
  delete mongoose.models.Interview;
}

export const Interview: Model<IInterview> =
  mongoose.models.Interview || mongoose.model<IInterview>('Interview', InterviewSchema);
