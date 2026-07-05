import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IProjectExpense {
  category: 'Labor' | 'Software' | 'Travel' | 'Hardware' | 'Marketing' | 'Other';
  description: string;
  amount: number;
  date: string;
  vendor?: string;
  receipt?: string;
  approvedBy?: string;
  approvedByName?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  submittedBy?: string;
}

export interface IProjectBudget extends Document {
  companyId: string;
  projectId: string;
  projectName?: string;
  totalBudget: number;
  approvedBudget: number;
  usedBudget: number;
  remainingBudget: number;
  currency: string;
  expenses: IProjectExpense[];
  companyName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectExpenseSchema = new Schema({
  category: {
    type: String,
    enum: ['Labor', 'Software', 'Travel', 'Hardware', 'Marketing', 'Other'],
    default: 'Other'
  },
  description: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 },
  date: { type: String, required: true },
  vendor: { type: String, default: '' },
  receipt: { type: String, default: '' },
  approvedBy: { type: String },
  approvedByName: { type: String },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  submittedBy: { type: String }
}, { _id: true, timestamps: true });

const ProjectBudgetSchema: Schema = new Schema(
  {
    companyId: { type: String, required: true, index: true, default: 'company_001' },
    projectId: { type: String, required: true, unique: true, index: true },
    projectName: { type: String },
    totalBudget: { type: Number, default: 0 },
    approvedBudget: { type: Number, default: 0 },
    usedBudget: { type: Number, default: 0 },
    remainingBudget: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
    expenses: { type: [ProjectExpenseSchema], default: [] },
    companyName: { type: String, default: 'HR Core Labs' }
  },
  { timestamps: true }
);

// Auto-calculate remainingBudget before save
ProjectBudgetSchema.pre('save', function (next) {
  const self = this as any;
  self.usedBudget = (self.expenses || [])
    .filter((e: any) => e.status === 'Approved')
    .reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
  self.remainingBudget = (self.approvedBudget || 0) - self.usedBudget;
  next();
});

if (mongoose.models && mongoose.models.ProjectBudget) {
  delete mongoose.models.ProjectBudget;
}
export const ProjectBudget: Model<IProjectBudget> = mongoose.model<IProjectBudget>('ProjectBudget', ProjectBudgetSchema);
