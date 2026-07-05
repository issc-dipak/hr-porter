import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IArchivedEmployee extends Document {
  companyId: string;
  employeeEmail: string;
  fullName: string;
  archivedAt: Date;
  employeeData: any;
  createdAt: Date;
  updatedAt: Date;
}

const ArchivedEmployeeSchema: Schema = new Schema(
  {
    companyId: { type: String, required: true, index: true },
    employeeEmail: { type: String, required: true, lowercase: true, index: true },
    fullName: { type: String, required: true },
    archivedAt: { type: Date, default: Date.now },
    employeeData: { type: Schema.Types.Mixed, required: true }
  },
  { timestamps: true }
);

if (mongoose.models && mongoose.models.ArchivedEmployee) {
  delete mongoose.models.ArchivedEmployee;
}

export const ArchivedEmployee: Model<IArchivedEmployee> = mongoose.model<IArchivedEmployee>('ArchivedEmployee', ArchivedEmployeeSchema);
