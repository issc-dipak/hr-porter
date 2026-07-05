import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IDesignation extends Document {
  companyId: string;
  designationName: string;
  level: number;
  createdAt: Date;
  updatedAt: Date;
}

const DesignationSchema: Schema = new Schema(
  {
    companyId: { type: String, required: true, index: true },
    designationName: { type: String, required: true },
    level: { type: Number, required: true, default: 1 },
  },
  { timestamps: true }
);

if (mongoose.models && mongoose.models.Designation) {
  delete mongoose.models.Designation;
}
export const Designation: Model<IDesignation> = mongoose.model<IDesignation>('Designation', DesignationSchema);
