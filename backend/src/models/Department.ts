import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IDepartment extends Document {
  companyId: string;
  departmentName: string;
  description?: string;
  branchId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DepartmentSchema: Schema = new Schema(
  {
    companyId: { type: String, required: true, index: true },
    branchId: { type: String, default: '', index: true },
    departmentName: { type: String, required: true },
    description: { type: String, default: '' },
  },
  { timestamps: true }
);

if (mongoose.models && mongoose.models.Department) {
  delete mongoose.models.Department;
}
export const Department: Model<IDepartment> = mongoose.model<IDepartment>('Department', DepartmentSchema);
