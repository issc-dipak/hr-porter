import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ITaskChecklist {
  item: string;
  completed: boolean;
  completedBy?: string;
  completedAt?: Date;
}

export interface ITaskComment {
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  mentions: string[];
  attachments: string[];
  createdAt: Date;
}

export interface ITaskTimeLog {
  employeeId: string;
  employeeName: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // minutes
  note?: string;
  isBillable: boolean;
  date: string;
}

export interface IProjectTask extends Document {
  companyId: string;

  // Core fields
  title: string;
  description?: string;
  type: 'Task' | 'Bug' | 'Feature' | 'Story' | 'Epic' | 'Sub-task';

  // Project & Sprint
  projectId: string;
  projectName?: string;
  sprintId?: string;
  milestoneId?: string;
  parentTaskId?: string; // for sub-tasks

  // Assignment
  assigneeId?: string;
  assigneeName?: string;
  assigneeAvatar?: string;
  reporterId?: string;
  reporterName?: string;
  reviewerIds: string[];

  // Status & Priority
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Backlog' | 'To Do' | 'In Progress' | 'Code Review' | 'QA Testing' | 'Blocked' | 'Completed';

  // Kanban
  kanbanColumn: string;
  kanbanOrder: number;

  // Timeline
  startDate?: string;
  dueDate?: string;
  completedAt?: string;

  // Estimation
  storyPoints: number;
  estimatedHours: number;
  loggedHours: number;
  completionPercent: number;

  // Meta
  labels: string[];
  attachments: string[];
  dependencies: string[]; // task IDs this task depends on
  watchers: string[];

  // Rich content
  checklist: ITaskChecklist[];
  comments: ITaskComment[];
  timeLogs: ITaskTimeLog[];

  // Recurring
  isRecurring: boolean;
  recurringInterval?: 'daily' | 'weekly' | 'monthly';

  dept?: string;
  companyName?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TaskChecklistSchema = new Schema({
  item: { type: String, required: true },
  completed: { type: Boolean, default: false },
  completedBy: { type: String },
  completedAt: { type: Date }
}, { _id: true });

const TaskCommentSchema = new Schema({
  authorId: { type: String, required: true },
  authorName: { type: String, required: true },
  authorAvatar: { type: String },
  content: { type: String, required: true },
  mentions: { type: [String], default: [] },
  attachments: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now }
}, { _id: true });

const TaskTimeLogSchema = new Schema({
  employeeId: { type: String, required: true },
  employeeName: { type: String, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  duration: { type: Number, default: 0 },
  note: { type: String },
  isBillable: { type: Boolean, default: true },
  date: { type: String, required: true }
}, { _id: true });

const ProjectTaskSchema: Schema = new Schema(
  {
    companyId: { type: String, required: true, index: true, default: 'company_001' },

    title: { type: String, required: true },
    description: { type: String, default: '' },
    type: {
      type: String,
      enum: ['Task', 'Bug', 'Feature', 'Story', 'Epic', 'Sub-task'],
      default: 'Task'
    },

    projectId: { type: String, required: true, index: true },
    projectName: { type: String },
    sprintId: { type: String },
    milestoneId: { type: String },
    parentTaskId: { type: String },

    assigneeId: { type: String },
    assigneeName: { type: String },
    assigneeAvatar: { type: String },
    reporterId: { type: String },
    reporterName: { type: String },
    reviewerIds: { type: [String], default: [] },

    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium'
    },
    status: {
      type: String,
      enum: ['Backlog', 'To Do', 'In Progress', 'Code Review', 'QA Testing', 'Blocked', 'Completed'],
      default: 'To Do'
    },

    kanbanColumn: { type: String, default: 'To Do' },
    kanbanOrder: { type: Number, default: 0 },

    startDate: { type: String },
    dueDate: { type: String },
    completedAt: { type: String },

    storyPoints: { type: Number, default: 0 },
    estimatedHours: { type: Number, default: 0 },
    loggedHours: { type: Number, default: 0 },
    completionPercent: { type: Number, default: 0, min: 0, max: 100 },

    labels: { type: [String], default: [] },
    attachments: { type: [String], default: [] },
    dependencies: { type: [String], default: [] },
    watchers: { type: [String], default: [] },

    checklist: { type: [TaskChecklistSchema], default: [] },
    comments: { type: [TaskCommentSchema], default: [] },
    timeLogs: { type: [TaskTimeLogSchema], default: [] },

    isRecurring: { type: Boolean, default: false },
    recurringInterval: { type: String, enum: ['daily', 'weekly', 'monthly'] },

    dept: { type: String, default: '' },
    companyName: { type: String, default: 'HR Core Labs' },
    createdBy: { type: String },
  },
  { timestamps: true }
);

ProjectTaskSchema.index({ companyId: 1, projectId: 1, status: 1 });
ProjectTaskSchema.index({ companyId: 1, assigneeId: 1 });
ProjectTaskSchema.index({ companyId: 1, projectId: 1, kanbanColumn: 1, kanbanOrder: 1 });
ProjectTaskSchema.index({ companyId: 1, sprintId: 1 });

if (mongoose.models && mongoose.models.ProjectTask) {
  delete mongoose.models.ProjectTask;
}
export const ProjectTask: Model<IProjectTask> = mongoose.model<IProjectTask>('ProjectTask', ProjectTaskSchema);
