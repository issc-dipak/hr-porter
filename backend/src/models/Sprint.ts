import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ISprint extends Document {
  companyId: string;
  projectId: string;
  projectName?: string;
  name: string;
  goal?: string;
  startDate?: string;
  endDate?: string;
  status: 'Planning' | 'Active' | 'Completed' | 'Cancelled';
  capacity: number;    // Total story points allocated
  velocity: number;    // Completed story points
  taskIds: string[];
  completionPercent: number;
  companyName?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SprintSchema: Schema = new Schema(
  {
    companyId: { type: String, required: true, index: true, default: 'company_001' },
    projectId: { type: String, required: true, index: true },
    projectName: { type: String },
    name: { type: String, required: true },
    goal: { type: String, default: '' },
    startDate: { type: String },
    endDate: { type: String },
    status: {
      type: String,
      enum: ['Planning', 'Active', 'Completed', 'Cancelled'],
      default: 'Planning'
    },
    capacity: { type: Number, default: 0 },
    velocity: { type: Number, default: 0 },
    taskIds: { type: [String], default: [] },
    completionPercent: { type: Number, default: 0, min: 0, max: 100 },
    companyName: { type: String, default: 'HR Core Labs' },
    createdBy: { type: String }
  },
  { timestamps: true }
);

SprintSchema.index({ companyId: 1, projectId: 1, status: 1 });

if (mongoose.models && mongoose.models.Sprint) {
  delete mongoose.models.Sprint;
}
export const Sprint: Model<ISprint> = mongoose.model<ISprint>('Sprint', SprintSchema);
