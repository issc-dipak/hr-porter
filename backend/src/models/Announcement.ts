import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IAnnouncement extends Document {
  companyId?: string;
  title: string;
  content: string;
  category: string; // 'Urgent' | 'General' | 'Event' | 'Policy'
  postedBy: string;
  companyName: string;
  targetBranchId?: string;

  // Event Fields
  eventDate?: Date;
  eventTime?: string;
  eventLocation?: string;
  eventType?: string;
  eventBanner?: string;
  maxParticipants?: number;
  rsvpRequired?: boolean;
  isCompleted?: boolean;
  eventPhotos?: string[];
  eventSummary?: string;

  // Audience Target Fields
  audienceType?: string; // 'All' | 'Specific'
  targetEmployees?: string[]; // Array of employee emails

  createdAt: Date;
  updatedAt: Date;
}

const AnnouncementSchema: Schema = new Schema(
  {
    companyId: { type: String, required: true, index: true, default: 'company_001' },
    targetBranchId: { type: String, default: '', index: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    category: { type: String, required: true, default: 'General' },
    postedBy: { type: String, required: true },
    companyName: { type: String, default: 'HR Core Labs' },

    // Event Fields
    eventDate: { type: Date },
    eventTime: { type: String },
    eventLocation: { type: String },
    eventType: { type: String },
    eventBanner: { type: String },
    maxParticipants: { type: Number },
    rsvpRequired: { type: Boolean, default: false },
    isCompleted: { type: Boolean, default: false },
    eventPhotos: { type: [String], default: [] },
    eventSummary: { type: String },

    // Audience Target Fields
    audienceType: { type: String, default: 'All' },
    targetEmployees: { type: [String], default: [] },
  },
  { timestamps: true }
);

delete (mongoose.models as any).Announcement;
export const Announcement: Model<IAnnouncement> = mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema);
