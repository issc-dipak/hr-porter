import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IExitInterview extends Document {
  companyId: string;
  resignationId: string;
  employeeEmail: string;
  employeeName: string;
  scheduledAt: Date;
  feedback: string;
  exitReason: string;
  suggestions: string;
  rehireEligibility: boolean;
  completedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExitInterviewSchema: Schema = new Schema(
  {
    companyId: { type: String, required: true, index: true },
    resignationId: { type: Schema.Types.ObjectId, ref: 'Resignation', required: true, index: true },
    employeeEmail: { type: String, required: true, lowercase: true, index: true },
    employeeName: { type: String, required: true },
    scheduledAt: { type: Date, required: true },
    feedback: { type: String, default: '' },
    exitReason: { type: String, default: '' },
    suggestions: { type: String, default: '' },
    rehireEligibility: { type: Boolean, default: true },
    completedBy: { type: String, default: '' }
  },
  { timestamps: true }
);

if (mongoose.models && mongoose.models.ExitInterview) {
  delete mongoose.models.ExitInterview;
}

export const ExitInterview: Model<IExitInterview> = mongoose.model<IExitInterview>('ExitInterview', ExitInterviewSchema);
