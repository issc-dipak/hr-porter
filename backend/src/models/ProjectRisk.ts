import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IProjectRisk extends Document {
  companyId: string;
  projectId: string;
  projectName?: string;
  title: string;
  description?: string;
  category: 'Technical' | 'Financial' | 'Resource' | 'Timeline' | 'Scope' | 'External' | 'Other';
  probability: 'Low' | 'Medium' | 'High';
  impact: 'Low' | 'Medium' | 'High' | 'Critical';
  severity: number;            // AUTO: probability * impact score (1-9)
  severityLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'Mitigating' | 'Resolved' | 'Closed' | 'Accepted';
  ownerId?: string;
  ownerName?: string;
  mitigation?: string;
  contingency?: string;
  resolution?: string;
  dueDate?: string;
  resolvedAt?: string;
  companyName?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PROB_SCORE: Record<string, number> = { Low: 1, Medium: 2, High: 3 };
const IMPACT_SCORE: Record<string, number> = { Low: 1, Medium: 2, High: 3, Critical: 4 };

const ProjectRiskSchema: Schema = new Schema(
  {
    companyId: { type: String, required: true, index: true, default: 'company_001' },
    projectId: { type: String, required: true, index: true },
    projectName: { type: String },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    category: {
      type: String,
      enum: ['Technical', 'Financial', 'Resource', 'Timeline', 'Scope', 'External', 'Other'],
      default: 'Other'
    },
    probability: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Low'
    },
    impact: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Low'
    },
    severity: { type: Number, default: 1 },
    severityLevel: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Low'
    },
    status: {
      type: String,
      enum: ['Open', 'Mitigating', 'Resolved', 'Closed', 'Accepted'],
      default: 'Open'
    },
    ownerId: { type: String },
    ownerName: { type: String },
    mitigation: { type: String, default: '' },
    contingency: { type: String, default: '' },
    resolution: { type: String, default: '' },
    dueDate: { type: String },
    resolvedAt: { type: String },
    companyName: { type: String, default: 'HR Core Labs' },
    createdBy: { type: String }
  },
  { timestamps: true }
);

// Auto-calculate severity score before save
ProjectRiskSchema.pre('save', function (next) {
  const self = this as any;
  const score = (PROB_SCORE[self.probability as string] || 1) * (IMPACT_SCORE[self.impact as string] || 1);
  self.severity = score;
  if (score <= 2) self.severityLevel = 'Low';
  else if (score <= 4) self.severityLevel = 'Medium';
  else if (score <= 6) self.severityLevel = 'High';
  else self.severityLevel = 'Critical';
  next();
});

ProjectRiskSchema.index({ companyId: 1, projectId: 1, status: 1 });

if (mongoose.models && mongoose.models.ProjectRisk) {
  delete mongoose.models.ProjectRisk;
}
export const ProjectRisk: Model<IProjectRisk> = mongoose.model<IProjectRisk>('ProjectRisk', ProjectRiskSchema);
