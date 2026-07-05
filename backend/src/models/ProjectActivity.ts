import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IProjectActivity extends Document {
  companyId: string;
  projectId: string;
  projectName?: string;
  actorId?: string;
  actorName?: string;
  actorAvatar?: string;
  action: string;              // e.g., "created task", "updated status", "added member"
  entity: 'project' | 'task' | 'sprint' | 'milestone' | 'budget' | 'risk' | 'file' | 'member' | 'comment';
  entityId?: string;
  entityName?: string;
  oldValue?: string;
  newValue?: string;
  metadata?: Record<string, any>;
  companyName?: string;
  createdAt: Date;
}

const ProjectActivitySchema: Schema = new Schema(
  {
    companyId: { type: String, required: true, index: true, default: 'company_001' },
    projectId: { type: String, required: true, index: true },
    projectName: { type: String },
    actorId: { type: String },
    actorName: { type: String },
    actorAvatar: { type: String },
    action: { type: String, required: true },
    entity: {
      type: String,
      enum: ['project', 'task', 'sprint', 'milestone', 'budget', 'risk', 'file', 'member', 'comment'],
      default: 'project'
    },
    entityId: { type: String },
    entityName: { type: String },
    oldValue: { type: String },
    newValue: { type: String },
    metadata: { type: Schema.Types.Mixed },
    companyName: { type: String, default: 'HR Core Labs' }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ProjectActivitySchema.index({ companyId: 1, projectId: 1, createdAt: -1 });
ProjectActivitySchema.index({ companyId: 1, actorId: 1, createdAt: -1 });

if (mongoose.models && mongoose.models.ProjectActivity) {
  delete mongoose.models.ProjectActivity;
}
export const ProjectActivity: Model<IProjectActivity> = mongoose.model<IProjectActivity>('ProjectActivity', ProjectActivitySchema);
