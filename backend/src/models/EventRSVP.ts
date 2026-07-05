import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IEventRSVP extends Document {
  companyId: string;
  eventId: mongoose.Types.ObjectId;
  employeeEmail: string;
  employeeName: string;
  status: 'Going' | 'Maybe' | 'Not Attending';
  createdAt: Date;
  updatedAt: Date;
}

const EventRSVPSchema: Schema = new Schema(
  {
    companyId: { type: String, required: true, index: true },
    eventId: { type: Schema.Types.ObjectId, ref: 'Announcement', required: true, index: true },
    employeeEmail: { type: String, required: true, index: true },
    employeeName: { type: String, required: true },
    status: { type: String, required: true, enum: ['Going', 'Maybe', 'Not Attending'] },
  },
  { timestamps: true }
);

// Ensure one RSVP per employee per event
EventRSVPSchema.index({ eventId: 1, employeeEmail: 1 }, { unique: true });

delete (mongoose.models as any).EventRSVP;
export const EventRSVP: Model<IEventRSVP> = mongoose.models.EventRSVP || mongoose.model<IEventRSVP>('EventRSVP', EventRSVPSchema);
