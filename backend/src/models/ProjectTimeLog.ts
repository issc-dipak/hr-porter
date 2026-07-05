import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IProjectTimeLog extends Document {
  companyId: string;
  employeeId: string;
  employeeName: string;
  employeeAvatar?: string;
  projectId: string;
  projectName?: string;
  taskId?: string;
  taskName?: string;
  date: string;              // YYYY-MM-DD
  startTime?: Date;
  endTime?: Date;
  duration: number;          // minutes
  note?: string;
  isBillable: boolean;
  isManualEntry: boolean;
  isRunning: boolean;        // timer currently running
  approvedBy?: string;
  approvedByName?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  companyName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectTimeLogSchema: Schema = new Schema(
  {
    companyId: { type: String, required: true, index: true, default: 'company_001' },
    employeeId: { type: String, required: true, index: true },
    employeeName: { type: String, required: true },
    employeeAvatar: { type: String },
    projectId: { type: String, required: true, index: true },
    projectName: { type: String },
    taskId: { type: String },
    taskName: { type: String },
    date: { type: String, required: true },
    startTime: { type: Date },
    endTime: { type: Date },
    duration: { type: Number, default: 0 },  // minutes
    note: { type: String, default: '' },
    isBillable: { type: Boolean, default: true },
    isManualEntry: { type: Boolean, default: false },
    isRunning: { type: Boolean, default: false },
    approvedBy: { type: String },
    approvedByName: { type: String },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending'
    },
    companyName: { type: String, default: 'HR Core Labs' }
  },
  { timestamps: true }
);

ProjectTimeLogSchema.index({ companyId: 1, employeeId: 1, date: -1 });
ProjectTimeLogSchema.index({ companyId: 1, projectId: 1, date: -1 });
ProjectTimeLogSchema.index({ companyId: 1, isRunning: 1 });

if (mongoose.models && mongoose.models.ProjectTimeLog) {
  delete mongoose.models.ProjectTimeLog;
}
export const ProjectTimeLog: Model<IProjectTimeLog> = mongoose.model<IProjectTimeLog>('ProjectTimeLog', ProjectTimeLogSchema);
