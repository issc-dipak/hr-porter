import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IExperienceLetter extends Document {
  companyId: string;
  resignationId: string;
  employeeEmail: string;
  employeeName: string;
  joinedDate: Date;
  exitDate: Date;
  designation: string;
  pdfUrl?: string;
  letterContent?: string;
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ExperienceLetterSchema: Schema = new Schema(
  {
    companyId: { type: String, required: true, index: true },
    resignationId: { type: Schema.Types.ObjectId, ref: 'Resignation', required: true, index: true },
    employeeEmail: { type: String, required: true, lowercase: true, index: true },
    employeeName: { type: String, required: true },
    joinedDate: { type: Date, required: true },
    exitDate: { type: Date, required: true },
    designation: { type: String, required: true },
    pdfUrl: { type: String, default: '' },
    letterContent: { type: String, default: '' },
    generatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

if (mongoose.models && mongoose.models.ExperienceLetter) {
  delete mongoose.models.ExperienceLetter;
}

export const ExperienceLetter: Model<IExperienceLetter> = mongoose.model<IExperienceLetter>('ExperienceLetter', ExperienceLetterSchema);
