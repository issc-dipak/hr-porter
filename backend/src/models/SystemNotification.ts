import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ISystemNotification extends Document {
  companyId: string;
  userId: string; // Recipient email (lowercase)
  title: string;
  content: string;
  type: 'leave' | 'payroll' | 'ticket' | 'announcement' | 'daily-update' | 'expense' | 'task' | 'policy' | 'recruitment' | 'other';
  targetPage: string; // e.g. 'leaves', 'payroll', 'helpdesk', 'announcements', 'daily-updates'
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SystemNotificationSchema: Schema = new Schema(
  {
    companyId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true, lowercase: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: ['leave', 'payroll', 'ticket', 'announcement', 'daily-update', 'expense', 'task', 'policy', 'recruitment', 'other']
    },
    targetPage: { type: String, required: true },
    read: { type: Boolean, default: false }
  },
  { timestamps: true }
);

SystemNotificationSchema.index({ companyId: 1, userId: 1, read: 1, createdAt: -1 });

// Prevent mongoose from using stale cached models
if (mongoose.models && mongoose.models.SystemNotification) {
  delete mongoose.models.SystemNotification;
}

export const SystemNotification: Model<ISystemNotification> =
  mongoose.models.SystemNotification || mongoose.model<ISystemNotification>('SystemNotification', SystemNotificationSchema);
