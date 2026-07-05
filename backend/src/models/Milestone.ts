import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IMilestone extends Document {
  companyId: string;
  projectId: string;
  projectName?: string;
  name: string;
  description?: string;
  dueDate?: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Delayed';
  taskIds: string[];
  completionPercent: number;
  isDeliverable: boolean;
  clientVisible: boolean;
  companyName?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MilestoneSchema: Schema = new Schema(
  {
    companyId: { type: String, required: true, index: true, default: 'company_001' },
    projectId: { type: String, required: true, index: true },
    projectName: { type: String },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    dueDate: { type: String },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Completed', 'Delayed'],
      default: 'Pending'
    },
    taskIds: { type: [String], default: [] },
    completionPercent: { type: Number, default: 0, min: 0, max: 100 },
    isDeliverable: { type: Boolean, default: false },
    clientVisible: { type: Boolean, default: false },
    companyName: { type: String, default: 'HR Core Labs' },
    createdBy: { type: String }
  },
  { timestamps: true }
);

MilestoneSchema.index({ companyId: 1, projectId: 1 });

if (mongoose.models && mongoose.models.Milestone) {
  delete mongoose.models.Milestone;
}
export const Milestone: Model<IMilestone> = mongoose.model<IMilestone>('Milestone', MilestoneSchema);
