import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ICompany extends Document {
  companyName: string;
  slug: string;
  industry?: string;
  companySize?: string;
  country?: string;
  timezone?: string;
  status: 'Pending' | 'Active' | 'Suspended' | 'pending_verification' | 'email_verified' | 'pending_review' | 'active' | 'suspended';
  workEmail?: string;
  phoneNumber?: string;
  companyEmail?: string;
  companyDomain?: string;
  website?: string;
  gstNumber?: string;
  phone?: string;
  emailVerified?: boolean;
  domainVerified?: boolean;
  companyVerified?: boolean;
  emailOtp?: string;
  emailOtpExpire?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CompanySchema: Schema = new Schema(
  {
    companyName: {
      type: String,
      required: [true, 'Please provide a company name'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Please provide a company slug/subdomain'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    industry: {
      type: String,
      default: '',
    },
    companySize: {
      type: String,
      default: '',
    },
    country: {
      type: String,
      default: '',
    },
    timezone: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Pending', 'Active', 'Suspended', 'pending_verification', 'email_verified', 'pending_review', 'active', 'suspended'],
      default: 'pending_verification',
    },
    workEmail: {
      type: String,
      lowercase: true,
      trim: true,
      default: '',
    },
    phoneNumber: {
      type: String,
      default: '',
    },
    companyEmail: {
      type: String,
      lowercase: true,
      trim: true,
      index: true,
    },
    companyDomain: {
      type: String,
      lowercase: true,
      trim: true,
      index: true,
    },
    website: {
      type: String,
      default: '',
    },
    gstNumber: {
      type: String,
      trim: true,
      index: true,
      sparse: true,
    },
    phone: {
      type: String,
      default: '',
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    domainVerified: {
      type: Boolean,
      default: false,
    },
    companyVerified: {
      type: Boolean,
      default: false,
    },
    emailOtp: {
      type: String,
    },
    emailOtpExpire: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Prevent mongoose from using stale cached models during hot reloads
if (mongoose.models && mongoose.models.Company) {
  delete mongoose.models.Company;
}

export const Company: Model<ICompany> = mongoose.model<ICompany>('Company', CompanySchema);
