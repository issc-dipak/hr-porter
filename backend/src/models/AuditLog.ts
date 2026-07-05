import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IAuditLog extends Document {
  companyId?: string;
  action: string;
  performedBy: string; // email of user
  details: string;
  ipAddress: string;
  createdAt: Date;
  updatedAt: Date;
}

const AuditLogSchema: Schema = new Schema(
  {
    companyId: { type: String, required: true, index: true, default: 'company_001' },
    action: { type: String, required: true },
    performedBy: { type: String, required: true },
    details: { type: String, required: true },
    ipAddress: { type: String, default: '127.0.0.1' },
  },
  { timestamps: true }
);

AuditLogSchema.index({ companyId: 1, createdAt: -1 });
AuditLogSchema.index({ companyId: 1, action: 1, createdAt: -1 });
AuditLogSchema.index({ companyId: 1, performedBy: 1, createdAt: -1 });

delete (mongoose.models as any).AuditLog;
export const AuditLog: Model<IAuditLog> = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
