import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IUser extends Document {
  fullName: string;
  email: string;
  companyName: string;
  companyCode: string;
  companyId: string;
  role: 'Super Admin' | 'Company Admin' | 'Admin' | 'HR' | 'Manager' | 'Employee';
  password?: string;
  phoneNumber?: string;
  mobile?: string;
  department?: string;
  designation?: string;
  profilePicture?: string;
  isVerified: boolean;
  emailVerified?: boolean;
  mobileVerified?: boolean;
  status: 'Pending' | 'Active' | 'Inactive' | 'On Leave' | 'Probation' | 'Suspended' | 'Resigned' | 'Terminated';
  isActive?: boolean;
  otp?: string;
  otpExpire?: Date;
  invitationToken?: string;
  invitationExpire?: Date;
  resetPasswordOTP?: string;
  resetPasswordOTPExpire?: Date;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    accountHolderName: string;
    upiId?: string;
    isVerified?: boolean;
    verificationStatus?: 'unverified' | 'pending' | 'verified' | 'failed';
    pennyDropResponse?: any;
    verifiedBy?: string;
    verifiedAt?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Please provide a full name'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },
    companyName: {
      type: String,
      required: [true, 'Please provide a company name'],
    },
    companyCode: {
      type: String,
      required: [true, 'Please provide a company code'],
      lowercase: true,
      trim: true,
      default: 'hrcore',
    },
    companyId: {
      type: String,
      required: [true, 'Please provide a company id'],
      index: true,
      default: 'company_001',
    },
    role: {
      type: String,
      required: [true, 'Please provide a user role'],
      enum: ['Super Admin', 'Company Admin', 'Admin', 'HR', 'Manager', 'Employee'],
      default: 'Employee',
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      select: false, // Don't return password by default
    },
    phoneNumber: {
      type: String,
      default: '',
    },
    mobile: {
      type: String,
      default: '',
    },
    department: {
      type: String,
      default: '',
    },
    designation: {
      type: String,
      default: '',
    },
    profilePicture: {
      type: String,
      default: '',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    mobileVerified: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['Pending', 'Active', 'Inactive', 'On Leave', 'Probation', 'Suspended', 'Resigned', 'Terminated'],
      default: 'Pending',
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    otp: {
      type: String,
    },
    otpExpire: {
      type: Date,
    },
    invitationToken: {
      type: String,
      index: true,
    },
    invitationExpire: {
      type: Date,
    },
    resetPasswordOTP: String,
    resetPasswordOTPExpire: Date,
    bankDetails: {
      bankName: { type: String, default: '' },
      accountNumber: { type: String, default: '' },
      ifscCode: { type: String, default: '' },
      accountHolderName: { type: String, default: '' },
      upiId: { type: String, default: '' },
      isVerified: { type: Boolean, default: false },
      verificationStatus: { type: String, enum: ['unverified', 'pending', 'verified', 'failed'], default: 'unverified' },
      pennyDropResponse: { type: Schema.Types.Mixed, default: null },
      verifiedBy: { type: String, default: '' },
      verifiedAt: { type: Date, default: null }
    },
  },
  { timestamps: true }
);

// Prevent mongoose from using stale cached models during hot reloads
if (mongoose.models && mongoose.models.User) {
  delete mongoose.models.User;
}
export const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);
