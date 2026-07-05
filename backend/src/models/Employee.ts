import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ISalaryStructure {
  companyId?: string;
  basic: number;
  hra: number;
  medicalAllowance: number;
  travelAllowance: number;
  specialAllowance: number;
  otherEarnings: number;
  allowance: number; // kept for backward compatibility (special allowance alias)
  bonus: number;
  pf: number;
  esi: number;
  professionalTax: number;
  tds: number;
  tax: number; // kept for backward compatibility (TDS alias)
  otherDeductions: number;
  grossSalary: number;
  totalDeductions: number;
  net: number;
  monthlyCTC: number;
  annualCTC: number;
  employmentType: string;
}

export interface IEmployee extends Document {
  companyId?: string;
  empId?: string;
  fullName: string;
  department: string;
  status: string;
  designation: string;
  email: string;
  phone: string;
  joinedDate: Date;
  location: string;
  companyName?: string;
  companyCode?: string;
  profilePicture?: string;
  salaryStructure: ISalaryStructure;
  emergencyContact: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  upiId?: string;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  address?: string;
  panNumber?: string;
  uanNumber?: string;
  maxLeaves?: number;
  managerId?: string;
  reportingManagerId?: string;
  departmentId?: string;
  designationId?: string;
  branchId?: string;
  onboardingProgress?: number;
  employmentType?: string;
  personalInfo?: {
    fullName: string;
    dateOfBirth?: string;
    gender?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    emergencyContactName?: string;
    emergencyContactNumber?: string;
  };
  professionalInfo?: {
    education?: string;
    experience?: string;
    skills?: string[];
    linkedinProfile?: string;
    certifications?: string;
  };
  documents?: Array<{
    name: string;
    fileUrl: string;
    status: string;
    uploadedAt: Date;
  }>;
  isActive?: boolean;
  rewardPoints?: number;
  terminatedAt?: Date;
  terminatedBy?: string;
  terminationReason?: string;
  suspendedAt?: Date;
  suspendedBy?: string;
  suspensionReason?: string;
  resignedAt?: Date;
  resignationReason?: string;
  exitWorkflow?: {
    stage: 'None' | 'Resignation Submitted' | 'HR Review' | 'Manager Approval' | 'Exit Clearance' | 'Account Deactivated' | 'Archived';
    resignationSubmittedAt?: Date;
    resignationReason?: string;
    hrReviewedAt?: Date;
    hrReviewedBy?: string;
    managerApprovedAt?: Date;
    managerApprovedBy?: string;
    clearanceCompletedAt?: Date;
    clearanceCompletedBy?: string;
    deactivatedAt?: Date;
    deactivatedBy?: string;
    archivedAt?: Date;
    archivedBy?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const SalaryStructureSchema = new Schema({
  companyId: { type: String, index: true, default: 'company_001' },
  // Earnings
  basic: { type: Number, default: 0 },
  hra: { type: Number, default: 0 },
  medicalAllowance: { type: Number, default: 0 },
  travelAllowance: { type: Number, default: 0 },
  specialAllowance: { type: Number, default: 0 },
  otherEarnings: { type: Number, default: 0 },
  allowance: { type: Number, default: 0 }, // backward compat
  bonus: { type: Number, default: 0 },
  // Deductions
  pf: { type: Number, default: 0 },
  esi: { type: Number, default: 0 },
  professionalTax: { type: Number, default: 0 },
  tds: { type: Number, default: 0 },
  tax: { type: Number, default: 0 }, // backward compat
  otherDeductions: { type: Number, default: 0 },
  // Calculated
  grossSalary: { type: Number, default: 0 },
  totalDeductions: { type: Number, default: 0 },
  net: { type: Number, default: 0 },
  monthlyCTC: { type: Number, default: 0 },
  annualCTC: { type: Number, default: 0 },
  employmentType: { type: String, default: 'Full-Time' },
}, { _id: false });

const EmployeeSchema: Schema = new Schema(
  {
    companyId: { type: String, required: true, index: true, default: 'company_001' },
    empId: { type: String, unique: true, sparse: true },
    fullName: { type: String, required: true },
    department: { type: String, required: true },
    status: { type: String, required: true, default: 'Active' },
    onboardingProgress: { type: Number, default: 0 },
    employmentType: { type: String, default: 'Full-Time' },
    personalInfo: {
      fullName: { type: String, default: '' },
      dateOfBirth: { type: String, default: '' },
      gender: { type: String, default: '' },
      address: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      country: { type: String, default: '' },
      emergencyContactName: { type: String, default: '' },
      emergencyContactNumber: { type: String, default: '' }
    },
    professionalInfo: {
      education: { type: String, default: '' },
      experience: { type: String, default: '' },
      skills: { type: [String], default: [] },
      linkedinProfile: { type: String, default: '' },
      certifications: { type: String, default: '' }
    },
    designation: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    joinedDate: { type: Date, required: true },
    location: { type: String, required: true },
    companyName: { type: String, default: 'HR Core Labs' },
    companyCode: { type: String, default: 'hrcore' },
    profilePicture: { type: String, default: '' },
    salaryStructure: { type: SalaryStructureSchema, default: () => ({
      basic: 30000,
      hra: 10000,
      medicalAllowance: 1250,
      travelAllowance: 1600,
      specialAllowance: 5000,
      otherEarnings: 0,
      allowance: 5000,
      bonus: 0,
      pf: 3600,
      esi: 1000,
      professionalTax: 200,
      tds: 2000,
      tax: 2000,
      otherDeductions: 0,
      grossSalary: 48850,
      totalDeductions: 6800,
      net: 42050,
      monthlyCTC: 48850,
      annualCTC: 586200,
      employmentType: 'Full-Time'
    }) },
    emergencyContact: { type: String, default: '' },
    bankName: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    ifscCode: { type: String, default: '' },
    upiId: { type: String, default: '' },
    dateOfBirth: { type: String, default: '' },
    gender: { type: String, default: '' },
    bloodGroup: { type: String, default: '' },
    address: { type: String, default: '' },
    panNumber: { type: String, default: '' },
    uanNumber: { type: String, default: '' },
    maxLeaves: { type: Number, default: 24 },
    managerId: { type: String, default: '', index: true },
    reportingManagerId: { type: String, default: '', index: true },
    departmentId: { type: String, default: '', index: true },
    designationId: { type: String, default: '', index: true },
    branchId: { type: String, default: '', index: true },
    documents: {
      type: [{
        name: { type: String, required: true },
        fileUrl: { type: String, required: true },
        status: { type: String, default: 'Pending Verification' },
        uploadedAt: { type: Date, default: Date.now }
      }],
      default: []
    },
    isActive: { type: Boolean, default: true, index: true },
    terminatedAt: { type: Date },
    terminatedBy: { type: String },
    terminationReason: { type: String },
    suspendedAt: { type: Date },
    suspendedBy: { type: String },
    suspensionReason: { type: String },
    resignedAt: { type: Date },
    resignationReason: { type: String },
    exitWorkflow: {
      stage: {
        type: String,
        enum: [
          'None',
          'Resignation Submitted',
          'HR Review',
          'Manager Approval',
          'Exit Clearance',
          'Account Deactivated',
          'Archived'
        ],
        default: 'None'
      },
      resignationSubmittedAt: { type: Date },
      resignationReason: { type: String },
      hrReviewedAt: { type: Date },
      hrReviewedBy: { type: String },
      managerApprovedAt: { type: Date },
      managerApprovedBy: { type: String },
      clearanceCompletedAt: { type: Date },
      clearanceCompletedBy: { type: String },
      deactivatedAt: { type: Date },
      deactivatedBy: { type: String },
      archivedAt: { type: Date },
      archivedBy: { type: String }
    },
    rewardPoints: { type: Number, default: 0 }
  },
  { timestamps: true }
);

EmployeeSchema.index({ companyId: 1 });
EmployeeSchema.index({ status: 1 });
EmployeeSchema.index({ isActive: 1 });
EmployeeSchema.index({ companyId: 1, email: 1 });
EmployeeSchema.index({ companyId: 1, status: 1 });

// Prevent mongoose from using stale cached models during hot reloads
if (mongoose.models && mongoose.models.Employee) {
  delete mongoose.models.Employee;
}
export const Employee: Model<IEmployee> = mongoose.model<IEmployee>('Employee', EmployeeSchema);
