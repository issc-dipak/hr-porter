import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IRole extends Document {
  companyId: string;
  name: string; // 'Admin' | 'HR' | 'Employee' or custom roles
  description: string;
  isSystem: boolean; // True for system-defined roles
  createdAt: Date;
  updatedAt: Date;
}

const RoleSchema: Schema = new Schema(
  {
    companyId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    isSystem: { type: Boolean, default: false }
  },
  { timestamps: true }
);

// Compound index to ensure role name is unique per company
RoleSchema.index({ companyId: 1, name: 1 }, { unique: true });

delete (mongoose.models as any).Role;
export const Role: Model<IRole> = mongoose.model<IRole>('Role', RoleSchema);
