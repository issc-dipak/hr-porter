import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IProjectMember {
  employeeId: string;
  employeeName: string;
  employeeEmail?: string;
  avatar?: string;
  role: 'Manager' | 'Lead' | 'Developer' | 'Designer' | 'QA' | 'Reviewer' | 'Analyst' | 'Devops' | 'Consultant' | 'Member';
  joinedAt: Date;
  utilization: number; // 0-100%
}

export interface IProject extends Document {
  companyId: string;
  projectCode: string;       // AUTO-GENERATED e.g. PRJ-2025-001
  name: string;
  description?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;

  // Team
  projectManagerId?: string;
  projectManagerName?: string;
  department?: string;
  teamMembers: IProjectMember[];

  // Timeline
  startDate?: string;
  endDate?: string;
  estimatedHours: number;
  actualHours: number;
  remainingDays?: number;

  // Status & Priority
  status: 'Planning' | 'Active' | 'On Hold' | 'Review' | 'Completed' | 'Cancelled' | 'Delayed';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';

  // Health Score (auto-calculated)
  healthScore: number;
  healthStatus: 'Healthy' | 'Warning' | 'Critical';

  // Budget
  totalBudget: number;
  approvedBudget: number;
  usedBudget: number;
  currency: string;

  // Progress (auto-calculated)
  completionPercent: number;
  tasksTotal: number;
  tasksCompleted: number;
  tasksOpen: number;

  // Meta
  tags: string[];
  isArchived: boolean;
  isTemplate: boolean;
  clonedFromId?: string;
  companyName?: string;

  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectMemberSchema = new Schema({
  employeeId: { type: String, required: true },
  employeeName: { type: String, required: true },
  employeeEmail: { type: String },
  avatar: { type: String },
  role: {
    type: String,
    enum: ['Manager', 'Lead', 'Developer', 'Designer', 'QA', 'Reviewer', 'Analyst', 'Devops', 'Consultant', 'Member'],
    default: 'Member'
  },
  joinedAt: { type: Date, default: Date.now },
  utilization: { type: Number, default: 100, min: 0, max: 100 }
}, { _id: false });

const ProjectSchema: Schema = new Schema(
  {
    companyId: { type: String, required: true, index: true, default: 'company_001' },
    projectCode: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    clientName: { type: String, default: '' },
    clientEmail: { type: String, default: '' },
    clientPhone: { type: String, default: '' },

    projectManagerId: { type: String },
    projectManagerName: { type: String },
    department: { type: String, default: '' },
    teamMembers: { type: [ProjectMemberSchema], default: [] },

    startDate: { type: String },
    endDate: { type: String },
    estimatedHours: { type: Number, default: 0 },
    actualHours: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ['Planning', 'Active', 'On Hold', 'Review', 'Completed', 'Cancelled', 'Delayed'],
      default: 'Planning'
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium'
    },

    healthScore: { type: Number, default: 100, min: 0, max: 100 },
    healthStatus: { type: String, enum: ['Healthy', 'Warning', 'Critical'], default: 'Healthy' },

    totalBudget: { type: Number, default: 0 },
    approvedBudget: { type: Number, default: 0 },
    usedBudget: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },

    completionPercent: { type: Number, default: 0, min: 0, max: 100 },
    tasksTotal: { type: Number, default: 0 },
    tasksCompleted: { type: Number, default: 0 },
    tasksOpen: { type: Number, default: 0 },

    tags: { type: [String], default: [] },
    isArchived: { type: Boolean, default: false },
    isTemplate: { type: Boolean, default: false },
    clonedFromId: { type: String },
    companyName: { type: String, default: 'HR Core Labs' },

    createdBy: { type: String },
    updatedBy: { type: String },
  },
  { timestamps: true }
);

// Compound indexes for fast queries
ProjectSchema.index({ companyId: 1, status: 1 });
ProjectSchema.index({ companyId: 1, isArchived: 1 });
ProjectSchema.index({ companyId: 1, projectManagerId: 1 });
ProjectSchema.index({ companyId: 1, 'teamMembers.employeeId': 1 });

if (mongoose.models && mongoose.models.Project) {
  delete mongoose.models.Project;
}
export const Project: Model<IProject> = mongoose.model<IProject>('Project', ProjectSchema);
