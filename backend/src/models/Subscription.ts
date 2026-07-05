import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ISubscription extends Document {
  companyId: string;
  planCode: 'starter' | 'professional' | 'enterprise';
  status: 'trial' | 'active' | 'paused' | 'cancelled' | 'expired';
  price: number;
  billingCycle: 'monthly' | 'yearly';
  startDate: Date;
  endDate: Date;
  trialStartDate?: Date;
  trialEndDate?: Date;
  cancelAtPeriodEnd: boolean;
  autoRenew: boolean;
  stripeSubscriptionId?: string;
  razorpaySubscriptionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema: Schema = new Schema(
  {
    companyId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    planCode: {
      type: String,
      required: true,
      enum: ['starter', 'professional', 'enterprise'],
      default: 'starter',
    },
    status: {
      type: String,
      required: true,
      enum: ['trial', 'active', 'paused', 'cancelled', 'expired'],
      default: 'trial',
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
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
    },
    trialStartDate: {
      type: Date,
    },
    trialEndDate: {
      type: Date,
    },
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false,
    },
    autoRenew: {
      type: Boolean,
      default: true,
    },
    stripeSubscriptionId: {
      type: String,
      default: '',
    },
    razorpaySubscriptionId: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

if (mongoose.models && mongoose.models.Subscription) {
  delete mongoose.models.Subscription;
}

export const Subscription: Model<ISubscription> =
  mongoose.models.Subscription || mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
