import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ICompanyBranding extends Document {
  companyId: string;
  companyName: string;
  companyShortName?: string;
  companyTagline?: string;
  companyLogo?: string;
  favicon?: string;
  loginBanner?: string;
  loginBackground?: string;
  companyWatermark?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  companyEmail?: string;
  companyPhone?: string;
  companyWebsite?: string;
  companyAddress?: string;
  companyCode?: string;
  welcomeMessage?: string;
  emailHeaderLogoVisible?: boolean;
  companyHandbookUrl?: string;
  hrPoliciesUrl?: string;
  orgChartUrl?: string;
  trainingPortalUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CompanyBrandingSchema: Schema = new Schema(
  {
    companyId: {
      type: String,
      required: [true, 'Please provide a company ID'],
      unique: true,
      index: true,
    },
    companyName: {
      type: String,
      required: [true, 'Please provide a company name'],
      trim: true,
    },
    companyShortName: {
      type: String,
      default: '',
    },
    companyTagline: {
      type: String,
      default: '',
    },
    companyLogo: {
      type: String,
      default: '',
    },
    favicon: {
      type: String,
      default: '',
    },
    loginBanner: {
      type: String,
      default: '',
    },
    loginBackground: {
      type: String,
      default: '',
    },
    companyWatermark: {
      type: String,
      default: '',
    },
    primaryColor: {
      type: String,
      default: '#2563eb', // Default Blue theme
    },
    secondaryColor: {
      type: String,
      default: '#4f46e5', // Default Indigo accent-like
    },
    accentColor: {
      type: String,
      default: '#06b6d4', // Default Cyan
    },
    companyEmail: {
      type: String,
      default: '',
    },
    companyPhone: {
      type: String,
      default: '',
    },
    companyWebsite: {
      type: String,
      default: '',
    },
    companyAddress: {
      type: String,
      default: '',
    },
    companyCode: {
      type: String,
      default: '',
      index: true,
    },
    welcomeMessage: {
      type: String,
      default: 'Welcome to our HR Portal',
    },
    emailHeaderLogoVisible: {
      type: Boolean,
      default: true,
    },
    companyHandbookUrl: {
      type: String,
      default: '',
    },
    hrPoliciesUrl: {
      type: String,
      default: '',
    },
    orgChartUrl: {
      type: String,
      default: '',
    },
    trainingPortalUrl: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Prevent mongoose from using stale cached models during hot reloads
if (mongoose.models && mongoose.models.CompanyBranding) {
  delete mongoose.models.CompanyBranding;
}

export const CompanyBranding: Model<ICompanyBranding> = 
  mongoose.models.CompanyBranding || mongoose.model<ICompanyBranding>('CompanyBranding', CompanyBrandingSchema);
