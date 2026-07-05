import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IDocItem {
  name: string;
  fileUrl: string;
  status: 'Pending' | 'Verified' | 'Rejected';
  uploadedAt?: Date;
  rejectedReason?: string;
}

export interface IBankDetails {
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  upiId?: string;
  status: 'Pending' | 'Verified' | 'Rejected';
  pennyDropVerified?: boolean;
}

export interface IPersonalInfo {
  fullName: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  emergencyContactName?: string;
  emergencyContactNumber?: string;
}

export interface IProfessionalInfo {
  education?: string;
  experience?: string;
  skills?: string[];
  linkedinProfile?: string;
  certifications?: string;
}

export interface IOnboardingRequest extends Document {
  companyId: string;
  inviteEmail: string;         // Work email — login ke liye
  invitePersonalEmail?: string; // Personal email — invitation jaati hai yahan
  inviteName: string;
  designation: string;
  department: string;
  joiningDate: Date;
  inviteToken: string;
  status: 'Draft' | 'Invited' | 'Profile Pending' | 'Documents Pending' | 'Verification Pending' | 'Approved' | 'Activated' | 'Completed' | 'Rejected';
  personalInfo?: IPersonalInfo;
  professionalInfo?: IProfessionalInfo;
  documents?: IDocItem[];
  bankDetails?: IBankDetails;
  roleAssigned?: 'Employee' | 'HR' | 'Admin';
  employmentType?: string;
  branchId?: string;
  tempPasswordHash?: string;
  workEmailPasswordPlain?: string;
  activatedEmployeeId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DocItemSchema = new Schema({
  name: { type: String, required: true },
  fileUrl: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'Verified', 'Rejected'], default: 'Pending' },
  uploadedAt: { type: Date, default: Date.now },
  rejectedReason: { type: String, default: '' }
}, { _id: false });

const BankDetailsSchema = new Schema({
  accountHolderName: { type: String, default: '' },
  accountNumber: { type: String, default: '' },
  ifscCode: { type: String, default: '' },
  bankName: { type: String, default: '' },
  upiId: { type: String, default: '' },
  status: { type: String, enum: ['Pending', 'Verified', 'Rejected'], default: 'Pending' },
  pennyDropVerified: { type: Boolean, default: false }
}, { _id: false });

const PersonalInfoSchema = new Schema({
  fullName: { type: String, default: '' },
  dateOfBirth: { type: String, default: '' },
  gender: { type: String, default: '' },
  address: { type: String, default: '' },
  emergencyContact: { type: String, default: '' },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  country: { type: String, default: '' },
  emergencyContactName: { type: String, default: '' },
  emergencyContactNumber: { type: String, default: '' }
}, { _id: false });

const ProfessionalInfoSchema = new Schema({
  education: { type: String, default: '' },
  experience: { type: String, default: '' },
  skills: { type: [String], default: [] },
  linkedinProfile: { type: String, default: '' },
  certifications: { type: String, default: '' }
}, { _id: false });

const OnboardingRequestSchema: Schema = new Schema(
  {
    companyId: { type: String, required: true, index: true },
    inviteEmail: { type: String, required: true, lowercase: true, index: true },
    invitePersonalEmail: { type: String, default: '', lowercase: true }, // Personal email for invitation
    inviteName: { type: String, required: true },
    designation: { type: String, required: true },
    department: { type: String, required: true },
    joiningDate: { type: Date, required: true },
    inviteToken: { type: String, required: true, unique: true, index: true },
    status: { 
      type: String, 
      enum: ['Draft', 'Invited', 'Profile Pending', 'Documents Pending', 'Verification Pending', 'Approved', 'Activated', 'Completed', 'Rejected'], 
      default: 'Invited',
      index: true
    },
    personalInfo: { type: PersonalInfoSchema, default: () => ({}) },
    professionalInfo: { type: ProfessionalInfoSchema, default: () => ({}) },
    documents: { type: [DocItemSchema], default: [] },
    bankDetails: { type: BankDetailsSchema, default: () => ({}) },
    roleAssigned: { type: String, enum: ['Employee', 'HR', 'Admin'], default: 'Employee' },
    employmentType: { type: String, default: 'Full-Time' },
    branchId: { type: String, default: '', index: true },
    tempPasswordHash: { type: String, default: '' },
    tempPasswordPlain: { type: String, default: '' },  // Temporarily store plain password for activation email
    workEmailPasswordPlain: { type: String, default: '' }, // Store work email password from invite stage
    activatedEmployeeId: { type: String, default: '' }
  },
  { timestamps: true }
);

OnboardingRequestSchema.index({ companyId: 1, inviteEmail: 1 });

// Prevent mongoose cached model errors
if (mongoose.models && mongoose.models.OnboardingRequest) {
  delete mongoose.models.OnboardingRequest;
}

export const OnboardingRequest: Model<IOnboardingRequest> = mongoose.model<IOnboardingRequest>('OnboardingRequest', OnboardingRequestSchema);
