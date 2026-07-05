import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ITenantSettings extends Document {
  companyId: string;
  allowedIpRanges: string[];
  mfaEnabled: boolean;
  emailTemplates: {
    welcomeHeader?: string;
    welcomeBody?: string;
    welcomeFooter?: string;
    inviteHeader?: string;
    inviteBody?: string;
    inviteFooter?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const TenantSettingsSchema: Schema = new Schema(
  {
    companyId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    allowedIpRanges: {
      type: [String],
      default: [],
    },
    mfaEnabled: {
      type: Boolean,
      default: false,
    },
    emailTemplates: {
      welcomeHeader: { type: String, default: 'Welcome to our organization!' },
      welcomeBody: { type: String, default: 'We are thrilled to have you join our team. Your profile is set up and active.' },
      welcomeFooter: { type: String, default: 'If you have any questions, contact HR Department.' },
      inviteHeader: { type: String, default: 'Invitation to Join HR Portal' },
      inviteBody: { type: String, default: 'You have been invited by your administrator to join the HR Portal.' },
      inviteFooter: { type: String, default: 'Best regards, The Team.' },
    },
  },
  { timestamps: true }
);

if (mongoose.models && mongoose.models.TenantSettings) {
  delete mongoose.models.TenantSettings;
}

export const TenantSettings: Model<ITenantSettings> =
  mongoose.models.TenantSettings || mongoose.model<ITenantSettings>('TenantSettings', TenantSettingsSchema);
