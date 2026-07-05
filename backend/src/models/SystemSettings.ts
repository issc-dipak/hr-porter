import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ISystemSettings extends Document {
  companyId?: string;
  company: {
    name: string;
    logo: string;
    timezone: string;
    currency: string;
    departments: string[];
  };
  payroll: {
    salaryCycle: string;
    taxRegime: string;
    overtimeRate: string;
    bonusRules: string;
    autoRelease: boolean;
  };
  attendance: {
    shiftStart: string;
    shiftEnd: string;
    graceBuffer: string;
    maxBreakTime: string;
    lateDeductionActive: boolean;
    biometricSync: boolean;
  };
  leave: {
    leaveTypes: { name: string; days: number }[];
    holidayCalendar: { title: string; date: string }[];
    approvalFlow: string;
    hrMaxLeaves: number;
    employeeMaxLeaves: number;
  };
  recruitment: {
    interviewStages: string[];
    jobTemplates: { title: string; description: string }[];
  };
  security: {
    minPasswordLength: number;
    twoFactorAuthActive: boolean;
    sessionExpiryMinutes: number;
    ipRestrictions: string;
  };
  notifications: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    hrAlerts: boolean;
    employeeReminders: boolean;
  };
  theme: {
    defaultThemeMode: string;
    defaultLanguage: string;
  };
  chat: {
    workspaceName: string;
    workspaceLogo: string;
    allowEmployeeChannelCreate: boolean;
    allowEmployeeChannelPrivateCreate: boolean;
    allowAnnouncementsPostAll: boolean;
    allowEmployeeEditDelete: boolean;
    restrictedKeywords: string;
  };
  payout: {
    primaryProvider: 'RazorpayX' | 'Cashfree' | 'Decentro';
    razorpayxKey: string;
    razorpayxSecret: string;
    cashfreeAppId: string;
    cashfreeSecret: string;
    decentroClientId: string;
    decentroClientSecret: string;
    isSimulator: boolean;
  };
  org?: {
    branches: string[];
    designations: string[];
    costCenters: string[];
  };
  workflow?: {
    onboarding: any[];
    offboarding: any[];
  };
  integrations?: {
    google: string;
    m365: string;
    slack: string;
  };
  billing?: {
    plan: string;
    seats: number;
  };
  backup?: {
    autoBackup: boolean;
    snapshots: any[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const SystemSettingsSchema: Schema = new Schema(
  {
    companyId: { type: String, required: true, index: true, default: 'company_001' },
    company: {
      name: { type: String, default: 'Acme Global Technologies Ltd' },
      logo: { type: String, default: '' },
      timezone: { type: String, default: 'UTC+05:30 (Kolkata)' },
      currency: { type: String, default: 'INR (₹)' },
      departments: { type: [String], default: ['Engineering', 'Design', 'HR', 'Marketing', 'Sales', 'Finance'] },
    },
    payroll: {
      salaryCycle: { type: String, default: 'Monthly (1st)' },
      taxRegime: { type: String, default: 'Standard 2026' },
      overtimeRate: { type: String, default: '1.5x' },
      bonusRules: { type: String, default: '15%' },
      autoRelease: { type: Boolean, default: true },
    },
    attendance: {
      shiftStart: { type: String, default: '09:00 AM' },
      shiftEnd: { type: String, default: '06:00 PM' },
      graceBuffer: { type: String, default: '15 Mins' },
      maxBreakTime: { type: String, default: '60 Mins' },
      lateDeductionActive: { type: Boolean, default: false },
      biometricSync: { type: Boolean, default: true },
    },
    leave: {
      leaveTypes: {
        type: [{ name: String, days: Number }],
        default: [
          { name: 'Sick Leave', days: 12 },
          { name: 'Casual Leave', days: 15 },
          { name: 'Paid Leave', days: 20 },
        ],
      },
      holidayCalendar: {
        type: [{ title: String, date: String }],
        default: [
          { title: 'New Year', date: '2026-01-01' },
          { title: 'Independence Day', date: '2026-08-15' },
          { title: 'Diwali', date: '2026-11-08' },
        ],
      },
      approvalFlow: { type: String, default: 'Manager -> HR -> Approved' },
      hrMaxLeaves: { type: Number, default: 24 },
      employeeMaxLeaves: { type: Number, default: 24 }
    },
    recruitment: {
      interviewStages: { type: [String], default: ['CV Screening', 'First Technical', 'System Design', 'Managerial Round', 'Offer Letter'] },
      jobTemplates: {
        type: [{ title: String, description: String }],
        default: [
          { title: 'Software Engineer', description: 'Fullstack Next.js developer with TypeScript experience.' },
          { title: 'Product Designer', description: 'UX designer to build enterprise dashboards using Figma.' },
        ],
      },
    },
    security: {
      minPasswordLength: { type: Number, default: 8 },
      twoFactorAuthActive: { type: Boolean, default: true },
      sessionExpiryMinutes: { type: Number, default: 60 },
      ipRestrictions: { type: String, default: '192.168.1.0/24' },
    },
    notifications: {
      emailNotifications: { type: Boolean, default: true },
      pushNotifications: { type: Boolean, default: true },
      hrAlerts: { type: Boolean, default: true },
      employeeReminders: { type: Boolean, default: true },
    },
    theme: {
      defaultThemeMode: { type: String, default: 'Dark' },
      defaultLanguage: { type: String, default: 'English (US)' },
    },
    chat: {
      workspaceName: { type: String, default: 'Acme Workspace' },
      workspaceLogo: { type: String, default: '' },
      allowEmployeeChannelCreate: { type: Boolean, default: true },
      allowEmployeeChannelPrivateCreate: { type: Boolean, default: true },
      allowAnnouncementsPostAll: { type: Boolean, default: false },
      allowEmployeeEditDelete: { type: Boolean, default: true },
      restrictedKeywords: { type: String, default: 'spam, offensive_word, leak' }
    },
    org: {
      branches: { type: [String], default: ['Headquarters (Mumbai)', 'Technical Center (Bengaluru)', 'Sales Office (Delhi)'] },
      designations: { type: [String], default: ['Software Engineer', 'Technical Lead', 'Product Manager', 'HR Manager', 'Sales Specialist'] },
      costCenters: { type: [String], default: ['Tech Ops', 'Product Development', 'Sales HQ'] }
    },
    workflow: {
      onboarding: { type: Array, default: [] },
      offboarding: { type: Array, default: [] }
    },
    integrations: {
      google: { type: String, default: 'Connected' },
      m365: { type: String, default: 'Configure' },
      slack: { type: String, default: 'Connected' }
    },
    billing: {
      plan: { type: String, default: 'Enterprise Growth' },
      seats: { type: Number, default: 14 }
    },
    backup: {
      autoBackup: { type: Boolean, default: true },
      snapshots: { type: Array, default: [] }
    },
    payout: {
      primaryProvider: { type: String, enum: ['RazorpayX', 'Cashfree', 'Decentro'], default: 'RazorpayX' },
      razorpayxKey: { type: String, default: '' },
      razorpayxSecret: { type: String, default: '' },
      cashfreeAppId: { type: String, default: '' },
      cashfreeSecret: { type: String, default: '' },
      decentroClientId: { type: String, default: '' },
      decentroClientSecret: { type: String, default: '' },
      isSimulator: { type: Boolean, default: true }
    },
  },
  { timestamps: true }
);

// Prevent mongoose from caching stale models in development
if (mongoose.models && mongoose.models.SystemSettings) {
  delete mongoose.models.SystemSettings;
}

export const SystemSettings: Model<ISystemSettings> =
  mongoose.models.SystemSettings || mongoose.model<ISystemSettings>('SystemSettings', SystemSettingsSchema);
