import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IUserSettings extends Document {
  companyId?: string;
  userId: mongoose.Types.ObjectId;
  email: string;
  bio: string;
  skills: string[];
  privacy: {
    showProfilePhoto: boolean;
    showContactNumber: boolean;
    showOnlineIndicator: boolean;
    shareSprintActivity: boolean;
  };
  notifications: {
    taskReminders: boolean;
    payrollAlerts: boolean;
    attendanceAlerts: boolean;
  };
  appearance: {
    themeMode: string;
    fontSize: string;
    compactLayout: boolean;
  };
  productivity: {
    focusModeTime: number;
    dailyTaskGoal: number;
    productivityReminders: boolean;
  };
  availability: {
    startHour: string;
    endHour: string;
    timezone: string;
    googleCalendarSynced: boolean;
  };
  chatSettings: {
    chatDisplayName: string;
    chatStatusText: string;
    chatStatusEmoji: string;
    chatPresence: string;
    chatMuteSound: boolean;
    chatNotifLevel: string;
    chatDndActive: boolean;
  };
  sessions?: Array<{
    id: string;
    device: string;
    ip: string;
    location: string;
    current: boolean;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const UserSettingsSchema: Schema = new Schema(
  {
    companyId: { type: String, required: true, index: true, default: 'company_001' },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    bio: { type: String, default: 'Senior Specialist' },
    skills: { type: [String], default: ['React', 'TypeScript', 'Tailwind CSS'] },
    privacy: {
      showEmail: { type: Boolean, default: true },
      showPhoneNumber: { type: Boolean, default: true },
      showBirthday: { type: Boolean, default: true },
      profileVisibility: { type: String, default: 'Employees Only' },
      directoryVisibility: { type: String, default: 'Employees Only' },
      showProfilePhoto: { type: Boolean, default: true },
      showContactNumber: { type: Boolean, default: false },
      showOnlineIndicator: { type: Boolean, default: true },
      shareSprintActivity: { type: Boolean, default: true },
    },
    notifications: {
      taskReminders: { type: Boolean, default: true },
      payrollAlerts: { type: Boolean, default: true },
      attendanceAlerts: { type: Boolean, default: true },
    },
    appearance: {
      themeMode: { type: String, default: 'Dark' },
      fontSize: { type: String, default: 'Medium' },
      compactLayout: { type: Boolean, default: false },
    },
    productivity: {
      focusModeTime: { type: Number, default: 25 },
      dailyTaskGoal: { type: Number, default: 5 },
      productivityReminders: { type: Boolean, default: true },
    },
    availability: {
      startHour: { type: String, default: '09:00 AM' },
      endHour: { type: String, default: '06:00 PM' },
      timezone: { type: String, default: 'GMT+05:30 (IST)' },
      googleCalendarSynced: { type: Boolean, default: true },
    },
    chatSettings: {
      chatDisplayName: { type: String, default: '' },
      chatStatusText: { type: String, default: '' },
      chatStatusEmoji: { type: String, default: '' },
      chatPresence: { type: String, default: 'online' },
      chatMuteSound: { type: Boolean, default: false },
      chatNotifLevel: { type: String, default: 'all' },
      chatDndActive: { type: Boolean, default: false }
    },
    sessions: {
      type: [{
        id: String,
        device: String,
        ip: String,
        location: String,
        current: Boolean
      }],
      default: [
        { id: '1', device: "Chrome / Windows 11", ip: "192.168.1.102", location: "Kolkata (Current)", current: true },
        { id: '2', device: "Safari / iPhone 15 Pro", ip: "103.88.99.12", location: "Mobile Network", current: false }
      ]
    },
  },
  { timestamps: true }
);

if (mongoose.models && mongoose.models.UserSettings) {
  delete mongoose.models.UserSettings;
}

export const UserSettings: Model<IUserSettings> =
  mongoose.models.UserSettings || mongoose.model<IUserSettings>('UserSettings', UserSettingsSchema);
