import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IBadge extends Document {
  companyId: string;
  name: string;
  description: string;
  icon: string; // lucide icon identifier
  points: number; // point reward value
  criteria: string;
  createdAt: Date;
  updatedAt: Date;
}

const BadgeSchema: Schema = new Schema(
  {
    companyId: { type: String, required: true, index: true, default: 'company_001' },
    name: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, default: 'Award' },
    points: { type: Number, default: 50 },
    criteria: { type: String, default: '' }
  },
  { timestamps: true }
);

if (mongoose.models && mongoose.models.Badge) {
  delete mongoose.models.Badge;
}
export const Badge: Model<IBadge> = mongoose.model<IBadge>('Badge', BadgeSchema);

// Employee Badges Earned Log Schema
export interface IEmployeeBadge extends Document {
  companyId: string;
  employeeId: string;
  employeeName: string;
  badgeId: string;
  badgeName: string;
  badgeIcon: string;
  badgePoints: number;
  issuedById: string;
  issuedByName: string;
  reason?: string;
  earnedDate: string;
  createdAt: Date;
}

const EmployeeBadgeSchema: Schema = new Schema(
  {
    companyId: { type: String, required: true, index: true, default: 'company_001' },
    employeeId: { type: String, required: true, index: true },
    employeeName: { type: String, required: true },
    badgeId: { type: String, required: true, index: true },
    badgeName: { type: String, required: true },
    badgeIcon: { type: String, default: 'Award' },
    badgePoints: { type: Number, default: 50 },
    issuedById: { type: String, required: true },
    issuedByName: { type: String, required: true },
    reason: { type: String, default: '' },
    earnedDate: { type: String, required: true }
  },
  { timestamps: true }
);

if (mongoose.models && mongoose.models.EmployeeBadge) {
  delete mongoose.models.EmployeeBadge;
}
export const EmployeeBadge: Model<IEmployeeBadge> = mongoose.model<IEmployeeBadge>('EmployeeBadge', EmployeeBadgeSchema);
