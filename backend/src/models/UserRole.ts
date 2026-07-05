import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IUserRole extends Document {
  companyId: string;
  userId: string;
  roleId: mongoose.Types.ObjectId;
}

const UserRoleSchema: Schema = new Schema(
  {
    companyId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    roleId: { type: Schema.Types.ObjectId, ref: 'Role', required: true, index: true }
  },
  { timestamps: true }
);

// A user has one role per company (standard HRMS RBAC)
UserRoleSchema.index({ companyId: 1, userId: 1 }, { unique: true });

delete (mongoose.models as any).UserRole;
export const UserRole: Model<IUserRole> = mongoose.model<IUserRole>('UserRole', UserRoleSchema);
