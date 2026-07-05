import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IPermission extends Document {
  key: string; // e.g. 'employee.create'
  name: string;
  description: string;
  module: string;
  createdAt: Date;
  updatedAt: Date;
}

const PermissionSchema: Schema = new Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    module: { type: String, required: true }
  },
  { timestamps: true }
);

delete (mongoose.models as any).Permission;
export const Permission: Model<IPermission> = mongoose.model<IPermission>('Permission', PermissionSchema);
