import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IRoleActivityLog extends Document {
  companyId: string;
  actorId: string; // userId of the person performing the action
  actorEmail: string;
  action: string;  // e.g. 'CREATE_ROLE', 'ASSIGN_ROLE', 'UPDATE_PERMISSIONS'
  details: string; // Description details
  createdAt: Date;
  updatedAt: Date;
}

const RoleActivityLogSchema: Schema = new Schema(
  {
    companyId: { type: String, required: true, index: true },
    actorId: { type: String, required: true, index: true },
    actorEmail: { type: String, required: true },
    action: { type: String, required: true },
    details: { type: String, default: '' }
  },
  { timestamps: true }
);

delete (mongoose.models as any).RoleActivityLog;
export const RoleActivityLog: Model<IRoleActivityLog> = mongoose.model<IRoleActivityLog>('RoleActivityLog', RoleActivityLogSchema);
