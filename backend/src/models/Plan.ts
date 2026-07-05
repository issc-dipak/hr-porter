import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IPlan extends Document {
  name: string;
  code: 'starter' | 'professional' | 'enterprise';
  price: number;
  billingCycle: 'monthly' | 'yearly';
  employeeLimit: number;
  features: string[];
  createdAt: Date;
  updatedAt: Date;
}

const PlanSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      enum: ['starter', 'professional', 'enterprise'],
      unique: true,
      index: true,
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'yearly'],
      default: 'monthly',
    },
    employeeLimit: {
      type: Number,
      required: true,
      default: 25,
    },
    features: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

if (mongoose.models && mongoose.models.Plan) {
  delete mongoose.models.Plan;
}

export const Plan: Model<IPlan> = mongoose.models.Plan || mongoose.model<IPlan>('Plan', PlanSchema);

export async function ensurePlansSeeded(): Promise<void> {
  const count = await Plan.countDocuments();
  if (count === 0) {
    console.log('Seeding default SaaS Plans from helper...');
    const defaultPlans = [
      {
        name: 'Starter Plan',
        code: 'starter',
        price: 999,
        billingCycle: 'monthly',
        employeeLimit: 25,
        features: [
          'Up to 25 employees',
          'Attendance Tracking',
          'Leave Management',
          'Basic Payroll (Pay slips generation)',
          'Email Support'
        ]
      },
      {
        name: 'Professional Plan',
        code: 'professional',
        price: 4999,
        billingCycle: 'monthly',
        employeeLimit: 250,
        features: [
          'Up to 250 employees',
          'Attendance Tracking',
          'Payroll Management',
          'Recruitment ATS & Careers',
          'Expenses & Claims Portal',
          'Performance Reviews',
          'Standard SaaS Analytics',
          'Email & Chat Support'
        ]
      },
      {
        name: 'Enterprise Plan',
        code: 'enterprise',
        price: 0,
        billingCycle: 'monthly',
        employeeLimit: 999999,
        features: [
          'Unlimited employees',
          'Advanced Analytics Dashboard',
          'AI HR Assistant integration',
          'RAG Knowledge Base support',
          'API Developer Access',
          'Custom Company Branding',
          'Priority Support (24/7 SLA)'
        ]
      }
    ];
    await Plan.insertMany(defaultPlans);
  }
}

