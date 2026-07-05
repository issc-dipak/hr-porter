import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IPolicyAuditLog extends Document {
  companyId: string;
  policyId: mongoose.Types.ObjectId;
  policyTitle: string;
  user: string;
  email: string;
  role: string;
  action: 'Created' | 'Edited' | 'Approved' | 'Published' | 'Archived' | 'Rollback' | 'Acknowledged';
  details: string;
  timestamp: Date;
}

const PolicyAuditLogSchema: Schema = new Schema(
  {
    companyId: { type: String, required: true, index: true },
    policyId: { type: Schema.Types.ObjectId, ref: 'Policy', required: true, index: true },
    policyTitle: { type: String, required: true },
    user: { type: String, required: true },
    email: { type: String, required: true },
    role: { type: String, required: true },
    action: { 
      type: String, 
      required: true,
      enum: ['Created', 'Edited', 'Approved', 'Published', 'Archived', 'Rollback', 'Acknowledged']
    },
    details: { type: String, default: '' },
    timestamp: { type: Date, required: true, default: Date.now }
  },
  { timestamps: false }
);

delete (mongoose.models as any).PolicyAuditLog;
export const PolicyAuditLog: Model<IPolicyAuditLog> = mongoose.model<IPolicyAuditLog>('PolicyAuditLog', PolicyAuditLogSchema);
