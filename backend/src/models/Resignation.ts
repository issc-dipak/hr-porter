import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IResignationHistory {
  action: string;
  performedBy: string;
  performedByRole: string;
  details?: string;
  timestamp?: Date;
}

export interface IResignation extends Document {
  companyId: string;
  employeeEmail: string;
  employeeName: string;
  reason: string;
  category: 'Better Opportunity' | 'Higher Education' | 'Relocation' | 'Personal Reasons' | 'Health Reasons' | 'Career Change' | 'Retirement' | 'Family Reasons' | 'Other';
  lastWorkingDay: Date;
  noticePeriodDays: number;
  noticeStartDate?: Date;
  status: 'Draft' | 'Submitted' | 'HR Review' | 'Admin Review' | 'Approved' | 'Rejected' | 'Notice Period' | 'Clearance Pending' | 'Settlement Pending' | 'Completed' | 'Archived';
  additionalNotes?: string;
  resignationLetterUrl?: string;
  assigneeEmail?: string; // successor admin
  rightsTransferred?: boolean;
  exitInterviewScheduledAt?: Date;
  exitInterviewFeedback?: string;
  fullAndFinalSettlementAmount?: number;
  exitChecklist: {
    laptopReturned: boolean;
    idCardReturned: boolean;
    companyAssetsReturned: boolean;
    assetReturned: boolean; // backward compatibility for verify script
    accessRevoked: boolean;
    knowledgeTransferCompleted: boolean;
    documentsSubmitted: boolean;
    hrClearance: boolean; // backward compatibility for verify script
    payrollClearance: boolean;
    payrollClosed: boolean; // backward compatibility for verify script
    financeClearance: boolean;
    settlementCompleted: boolean; // backward compatibility for verify script
    finalSettlementCompleted: boolean; // backward compatibility for verify script
  };
  archivedAt?: Date;
  history: IResignationHistory[];
  createdAt: Date;
  updatedAt: Date;
}

const ResignationSchema: Schema = new Schema(
  {
    companyId: { type: String, required: true, index: true },
    employeeEmail: { type: String, required: true, lowercase: true, index: true },
    employeeName: { type: String, required: true },
    reason: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: [
        'Better Opportunity',
        'Higher Education',
        'Relocation',
        'Personal Reasons',
        'Health Reasons',
        'Career Change',
        'Retirement',
        'Family Reasons',
        'Other'
      ],
      default: 'Other'
    },
    lastWorkingDay: { type: Date, required: true },
    noticePeriodDays: { type: Number, required: true },
    noticeStartDate: { type: Date },
    status: {
      type: String,
      required: true,
      enum: [
        'Draft',
        'Submitted',
        'HR Review',
        'Admin Review',
        'Approved',
        'Rejected',
        'Notice Period',
        'Clearance Pending',
        'Settlement Pending',
        'Completed',
        'Archived'
      ],
      default: 'Submitted'
    },
    additionalNotes: { type: String, default: '' },
    resignationLetterUrl: { type: String, default: '' },
    assigneeEmail: { type: String, default: '' },
    rightsTransferred: { type: Boolean, default: false },
    exitInterviewScheduledAt: { type: Date },
    exitInterviewFeedback: { type: String, default: '' },
    fullAndFinalSettlementAmount: { type: Number, default: 0 },
    exitChecklist: {
      laptopReturned: { type: Boolean, default: false },
      idCardReturned: { type: Boolean, default: false },
      companyAssetsReturned: { type: Boolean, default: false },
      assetReturned: { type: Boolean, default: false },
      accessRevoked: { type: Boolean, default: false },
      knowledgeTransferCompleted: { type: Boolean, default: false },
      documentsSubmitted: { type: Boolean, default: false },
      hrClearance: { type: Boolean, default: false },
      payrollClearance: { type: Boolean, default: false },
      payrollClosed: { type: Boolean, default: false },
      financeClearance: { type: Boolean, default: false },
      settlementCompleted: { type: Boolean, default: false },
      finalSettlementCompleted: { type: Boolean, default: false }
    },
    archivedAt: { type: Date },
    history: [
      {
        action: { type: String, required: true },
        performedBy: { type: String, required: true },
        performedByRole: { type: String, required: true },
        details: { type: String },
        timestamp: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

ResignationSchema.index({ companyId: 1, status: 1 });
ResignationSchema.index({ companyId: 1, employeeEmail: 1 });

if (mongoose.models && mongoose.models.Resignation) {
  delete mongoose.models.Resignation;
}

export const Resignation: Model<IResignation> = mongoose.model<IResignation>('Resignation', ResignationSchema);
