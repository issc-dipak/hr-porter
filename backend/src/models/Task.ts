import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IComment extends Document {
  companyId?: string;
  author: string;
  avatar?: string;
  content: string;
  createdAt: string;
}

export interface ISubTask extends Document {
  companyId?: string;
  title: string;
  completed: boolean;
}

export interface ITimeLog extends Document {
  companyId?: string;
  startedAt?: string;
  endedAt?: string;
  durationMinutes: number;
  loggedBy?: string;
}

export interface ITask extends Document {
  companyId?: string;
  title: string;
  description?: string;
  assignedTo: string;
  assignedToEmail?: string;
  assignedBy?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'To Do' | 'In Progress' | 'Review' | 'Done' | 'Rejected' | 'Blocked';
  due: string;
  startDate?: string;
  dept: string;
  avatar?: string;
  projectId?: string;
  projectName?: string;
  labels: string[];
  attachments: string[];
  comments: IComment[];
  subtasks: ISubTask[];
  timeLogs: ITimeLog[];
  estimatedHours: number;
  completionPercent: number;
  isRecurring: boolean;
  recurringInterval?: 'daily' | 'weekly' | 'monthly';
  sprintId?: string;
  storyPoints: number;
  watchers: string[];
  completedAt?: string;
  companyName: string;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema({
  companyId: { type: String, required: true, index: true, default: 'company_001' },
  author: { type: String, required: true },
  avatar: { type: String },
  content: { type: String, required: true },
  createdAt: { type: String, default: () => new Date().toISOString() }
});

const SubTaskSchema = new Schema({
  companyId: { type: String, required: true, index: true, default: 'company_001' },
  title: { type: String, required: true },
  completed: { type: Boolean, default: false }
});

const TimeLogSchema = new Schema({
  companyId: { type: String, required: true, index: true, default: 'company_001' },
  startedAt: { type: String },
  endedAt: { type: String },
  durationMinutes: { type: Number, default: 0 },
  loggedBy: { type: String }
});

const TaskSchema = new Schema(
  {
    companyId: { type: String, required: true, index: true, default: 'company_001' },
    title: { type: String, required: true },
    description: { type: String },
    assignedTo: { type: String, required: true },
    assignedToEmail: { type: String },
    assignedBy: { type: String },
    priority: { type: String, required: true, enum: ['Low', 'Medium', 'High', 'Urgent'], default: 'Medium' },
    status: { type: String, required: true, enum: ['To Do', 'In Progress', 'Review', 'Done', 'Rejected', 'Blocked'], default: 'To Do' },
    due: { type: String, required: true },
    startDate: { type: String },
    dept: { type: String, required: true },
    avatar: { type: String },
    projectId: { type: String },
    projectName: { type: String },
    labels: { type: [String], default: [] },
    attachments: { type: [String], default: [] },
    comments: { type: [CommentSchema], default: [] },
    subtasks: { type: [SubTaskSchema], default: [] },
    timeLogs: { type: [TimeLogSchema], default: [] },
    estimatedHours: { type: Number, default: 0 },
    completionPercent: { type: Number, default: 0, min: 0, max: 100 },
    isRecurring: { type: Boolean, default: false },
    recurringInterval: { type: String, enum: ['daily', 'weekly', 'monthly'] },
    sprintId: { type: String },
    storyPoints: { type: Number, default: 0 },
    watchers: { type: [String], default: [] },
    completedAt: { type: String },
    companyName: { type: String, default: 'HR Core Labs' },
  },
  { timestamps: true }
);

if (mongoose.models && mongoose.models.Task) {
  delete mongoose.models.Task;
}
export const Task: Model<ITask> = mongoose.model<ITask>('Task', TaskSchema);
