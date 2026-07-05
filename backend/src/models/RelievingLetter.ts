import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IRelievingLetter extends Document {
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

const RelievingLetterSchema: Schema = new Schema(
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

if (mongoose.models && mongoose.models.RelievingLetter) {
  delete mongoose.models.RelievingLetter;
}

export const RelievingLetter: Model<IRelievingLetter> = mongoose.model<IRelievingLetter>('RelievingLetter', RelievingLetterSchema);
