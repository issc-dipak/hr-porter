import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IBreak {
  companyId?: string;
  start: string;
  end: string;
}

export interface IAttendance extends Document {
  companyId?: string;
  name: string;
  timeIn: string;
  timeOut: string;
  status: string;
  duration: string;
  date: string;
  branchId?: string;
  breaks: IBreak[];
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema: Schema = new Schema(
  {
    companyId: { type: String, required: true, index: true, default: 'company_001' },
    branchId: { type: String, default: '', index: true },
    name: { type: String, required: true },
    timeIn: { type: String, default: '-' },
    timeOut: { type: String, default: '-' },
    status: { type: String, required: true, default: 'Present' },
    duration: { type: String, default: '0h 00m' },
    date: { type: String, required: true },
    remarks: { type: String, default: '' },
    breaks: {
      type: [{
        start: { type: String, required: true },
        end: { type: String, default: '-' }
      }],
      default: []
    }
  },
  { timestamps: true }
);

AttendanceSchema.index({ companyId: 1, name: 1, date: -1 });
AttendanceSchema.index({ companyId: 1, date: 1 });

// Prevent mongoose from using stale cached models during hot reloads
if (mongoose.models && mongoose.models.Attendance) {
  delete mongoose.models.Attendance;
}
export const Attendance: Model<IAttendance> = mongoose.model<IAttendance>('Attendance', AttendanceSchema);
