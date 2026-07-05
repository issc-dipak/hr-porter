import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IRolePermission extends Document {
  companyId: string;
  roleId: mongoose.Types.ObjectId;
  permissionId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const RolePermissionSchema: Schema = new Schema(
  {
    companyId: { type: String, required: true, index: true },
    roleId: { type: Schema.Types.ObjectId, ref: 'Role', required: true, index: true },
    permissionId: { type: Schema.Types.ObjectId, ref: 'Permission', required: true, index: true }
  },
  { timestamps: true }
);

// Compound index to ensure uniqueness of permissions within a role per company
RolePermissionSchema.index({ companyId: 1, roleId: 1, permissionId: 1 }, { unique: true });

delete (mongoose.models as any).RolePermission;
export const RolePermission: Model<IRolePermission> = mongoose.model<IRolePermission>('RolePermission', RolePermissionSchema);
