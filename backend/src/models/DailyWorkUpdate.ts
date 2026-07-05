import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IDailyWorkUpdateComment {
  authorEmail: string;
  authorName: string;
  authorRole: string;
  content: string;
  createdAt: Date;
}

export interface IDailyWorkUpdate extends Document {
  companyId?: string;
  employeeId: mongoose.Types.ObjectId | string;
  employeeEmail: string;
  employeeName: string;
  department: string;
  date: Date;
  yesterdaysWork: string;
  todaysPlan: string;
  blockers?: string;
  status: string; // 'Draft' | 'Submitted' | 'Pending Review' | 'Reviewed'
  reviewedBy?: string;
  reviewedAt?: Date;
  comments: IDailyWorkUpdateComment[];
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema({
  authorEmail: { type: String, required: true },
  authorName: { type: String, required: true },
  authorRole: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const DailyWorkUpdateSchema: Schema = new Schema(
  {
    companyId: { type: String, required: true, index: true, default: 'company_001' },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    employeeEmail: { type: String, required: true, index: true },
    employeeName: { type: String, required: true },
    department: { type: String, required: true, index: true },
    date: { type: Date, required: true, index: true },
    yesterdaysWork: { type: String, required: true },
    todaysPlan: { type: String, required: true },
    blockers: { type: String, default: '' },
    status: { 
      type: String, 
      required: true, 
      enum: ['Draft', 'Submitted', 'Pending Review', 'Reviewed', 'Completed', 'In Progress', 'Blocked'], 
      default: 'Draft' 
    },
    reviewedBy: { type: String },
    reviewedAt: { type: Date },
    comments: { type: [CommentSchema], default: [] }
  },
  { timestamps: true }
);

DailyWorkUpdateSchema.index({ companyId: 1, employeeEmail: 1, date: -1 });
DailyWorkUpdateSchema.index({ companyId: 1, department: 1, date: -1 });
DailyWorkUpdateSchema.index({ companyId: 1, date: -1 });

// Prevent mongoose from using cached models across hot-reloads
delete (mongoose.models as any).DailyWorkUpdate;
export const DailyWorkUpdate: Model<IDailyWorkUpdate> = mongoose.model<IDailyWorkUpdate>('DailyWorkUpdate', DailyWorkUpdateSchema);
