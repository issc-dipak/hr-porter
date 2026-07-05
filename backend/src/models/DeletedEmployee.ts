import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IDeletedEmployee extends Document {
  companyId: string;
  fullName: string;
  email: string;
  department: string;
  designation: string;
  deletedAt: Date;
  deletedBy: string;
}

const DeletedEmployeeSchema: Schema = new Schema(
  {
    companyId: { type: String, required: true, index: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    department: { type: String, required: true },
    designation: { type: String, required: true },
    deletedAt: { type: Date, default: Date.now },
    deletedBy: { type: String, required: true }
  },
  { timestamps: true }
);

if (mongoose.models && mongoose.models.DeletedEmployee) {
  delete mongoose.models.DeletedEmployee;
}

export const DeletedEmployee: Model<IDeletedEmployee> = mongoose.model<IDeletedEmployee>('DeletedEmployee', DeletedEmployeeSchema);
