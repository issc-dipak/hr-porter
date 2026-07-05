import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IPolicy extends Document {
  companyId: string;
  companyName: string;
  title: string;
  category: string;
  description: string;
  content: string;
  effectiveDate: Date;
  expiryDate?: Date;
  visibilityScope: 'Entire Company' | 'Department Specific' | 'HR Only' | 'Leadership Only';
  targetDepartments: string[];
  status: 'Draft' | 'Under Review' | 'Approved' | 'Published' | 'Archived' | 'Expired';
  currentVersion: string;
  attachments: { name: string; url: string }[];
  createdAt: Date;
  updatedAt: Date;
}

const PolicySchema: Schema = new Schema(
  {
    companyId: { type: String, required: true, index: true },
    companyName: { type: String, required: true, default: 'HR Core Labs' },
    title: { type: String, required: true },
    category: { 
      type: String, 
      required: true,
      enum: [
        'Attendance Policy',
        'Leave Policy',
        'Payroll Policy',
        'Work From Home Policy',
        'IT & Security Policy',
        'Code Of Conduct',
        'Recruitment Policy',
        'Performance Policy',
        'Expense & Reimbursement Policy',
        'Resignation & Offboarding Policy'
      ]
    },
    description: { type: String, default: '' },
    content: { type: String, default: '' },
    effectiveDate: { type: Date, required: true, default: Date.now },
    expiryDate: { type: Date },
    visibilityScope: { 
      type: String, 
      required: true, 
      enum: ['Entire Company', 'Department Specific', 'HR Only', 'Leadership Only'],
      default: 'Entire Company'
    },
    targetDepartments: { type: [String], default: [] },
    status: { 
      type: String, 
      required: true, 
      enum: ['Draft', 'Under Review', 'Approved', 'Published', 'Archived', 'Expired'],
      default: 'Draft'
    },
    currentVersion: { type: String, required: true, default: '1.0' },
    attachments: {
      type: [
        {
          name: { type: String, required: true },
          url: { type: String, required: true }
        }
      ],
      default: []
    }
  },
  { timestamps: true }
);

delete (mongoose.models as any).Policy;
export const Policy: Model<IPolicy> = mongoose.model<IPolicy>('Policy', PolicySchema);
