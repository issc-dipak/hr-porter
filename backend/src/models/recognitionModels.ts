import mongoose, { Document, Model, Schema } from 'mongoose';

// ── 1. REWARD PROGRAM SCHEMA ──
export interface IRewardProgram extends Document {
  companyId: string;
  name: string;
  description: string;
  budget: number;
  spent: number;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Inactive' | 'Draft';
  createdAt: Date;
  updatedAt: Date;
}

const RewardProgramSchema = new Schema(
  {
    companyId: { type: String, required: true, index: true, default: 'company_001' },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    budget: { type: Number, default: 0 },
    spent: { type: Number, default: 0 },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    status: { type: String, enum: ['Active', 'Inactive', 'Draft'], default: 'Draft' }
  },
  { timestamps: true }
);

if (mongoose.models && mongoose.models.RewardProgram) {
  delete mongoose.models.RewardProgram;
}
export const RewardProgram: Model<IRewardProgram> = mongoose.model<IRewardProgram>('RewardProgram', RewardProgramSchema);

// ── 2. REWARD CATEGORY SCHEMA ──
export interface IRewardCategory extends Document {
  companyId: string;
  name: string;
  description: string;
  pointsMultiplier: number;
}

const RewardCategorySchema = new Schema({
  companyId: { type: String, required: true, index: true, default: 'company_001' },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  pointsMultiplier: { type: Number, default: 1 }
});

if (mongoose.models && mongoose.models.RewardCategory) {
  delete mongoose.models.RewardCategory;
}
export const RewardCategory: Model<IRewardCategory> = mongoose.model<IRewardCategory>('RewardCategory', RewardCategorySchema);

// ── 3. REWARD TRANSACTION SCHEMA ──
export interface IRewardTransaction extends Document {
  companyId: string;
  employeeId: string;
  employeeName: string;
  points: number;
  type: 'Credit' | 'Debit';
  source: 'Badge' | 'Nomination' | 'Redemption' | 'Manual';
  description: string;
  createdAt: Date;
}

const RewardTransactionSchema = new Schema(
  {
    companyId: { type: String, required: true, index: true, default: 'company_001' },
    employeeId: { type: String, required: true, index: true },
    employeeName: { type: String, required: true },
    points: { type: Number, required: true },
    type: { type: String, enum: ['Credit', 'Debit'], required: true },
    source: { type: String, enum: ['Badge', 'Nomination', 'Redemption', 'Manual'], required: true },
    description: { type: String, required: true }
  },
  { timestamps: true }
);

if (mongoose.models && mongoose.models.RewardTransaction) {
  delete mongoose.models.RewardTransaction;
}
export const RewardTransaction: Model<IRewardTransaction> = mongoose.model<IRewardTransaction>('RewardTransaction', RewardTransactionSchema);

// ── 4. EMPLOYEE CERTIFICATE SCHEMA ──
export interface IEmployeeCertificate extends Document {
  companyId: string;
  employeeId: string;
  employeeName: string;
  templateType: 'Employee of Month' | 'Best Performer' | 'Work Anniversary' | 'Training Completion' | 'Innovation Award' | 'Leadership Award' | 'Appreciation Award';
  certificateNumber: string;
  issuedById: string;
  issuedByName: string;
  issueDate: string;
  createdAt: Date;
}

const EmployeeCertificateSchema = new Schema(
  {
    companyId: { type: String, required: true, index: true, default: 'company_001' },
    employeeId: { type: String, required: true, index: true },
    employeeName: { type: String, required: true },
    templateType: {
      type: String,
      enum: ['Employee of Month', 'Best Performer', 'Work Anniversary', 'Training Completion', 'Innovation Award', 'Leadership Award', 'Appreciation Award'],
      required: true
    },
    certificateNumber: { type: String, required: true, unique: true },
    issuedById: { type: String, required: true },
    issuedByName: { type: String, required: true },
    issueDate: { type: String, required: true }
  },
  { timestamps: true }
);

if (mongoose.models && mongoose.models.EmployeeCertificate) {
  delete mongoose.models.EmployeeCertificate;
}
export const EmployeeCertificate: Model<IEmployeeCertificate> = mongoose.model<IEmployeeCertificate>('EmployeeCertificate', EmployeeCertificateSchema);

// ── 5. CAMPAIGN SCHEMA ──
export interface ICampaign extends Document {
  companyId: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Completed' | 'Upcoming';
  rewardPoints: number;
}

const CampaignSchema = new Schema({
  companyId: { type: String, required: true, index: true, default: 'company_001' },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  status: { type: String, enum: ['Active', 'Completed', 'Upcoming'], default: 'Upcoming' },
  rewardPoints: { type: Number, default: 0 }
});

if (mongoose.models && mongoose.models.Campaign) {
  delete mongoose.models.Campaign;
}
export const Campaign: Model<ICampaign> = mongoose.model<ICampaign>('Campaign', CampaignSchema);

// ── 6. AUDIT LOG SCHEMA ──
export interface IRecognitionAuditLog extends Document {
  companyId: string;
  action: 'Create' | 'Edit' | 'Delete' | 'Approve' | 'Reject' | 'Award' | 'Redeem';
  actorId: string;
  actorName: string;
  actorRole: string;
  targetId?: string;
  targetName?: string;
  ipAddress?: string;
  branchId?: string;
  createdAt: Date;
}

const RecognitionAuditLogSchema = new Schema(
  {
    companyId: { type: String, required: true, index: true, default: 'company_001' },
    action: { type: String, enum: ['Create', 'Edit', 'Delete', 'Approve', 'Reject', 'Award', 'Redeem'], required: true },
    actorId: { type: String, required: true },
    actorName: { type: String, required: true },
    actorRole: { type: String, required: true },
    targetId: { type: String },
    targetName: { type: String },
    ipAddress: { type: String },
    branchId: { type: String }
  },
  { timestamps: true }
);

if (mongoose.models && mongoose.models.RecognitionAuditLog) {
  delete mongoose.models.RecognitionAuditLog;
}
export const RecognitionAuditLog: Model<IRecognitionAuditLog> = mongoose.model<IRecognitionAuditLog>('RecognitionAuditLog', RecognitionAuditLogSchema);
