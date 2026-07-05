import { Router } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { handleWebRoute } from '../adaptor';
import { NextResponse } from 'next/server';
import connectToDatabase from '../api/lib/mongodb';
import { OnboardingRequest } from '../models/OnboardingRequest';
import { OnboardingCounter } from '../models/OnboardingCounter';
import { Employee } from '../models/Employee';
import { User } from '../models/User';
import { AuditLog } from '../models/AuditLog';
import { Branch } from '../models/Branch';
import { SystemNotification } from '../models/SystemNotification';
import { verifyAuth } from '../api/lib/auth';
import { sendEmail } from '../utils/email';

const router = Router();

// Helper to log audit actions
async function logOnboardingAudit(companyId: string, email: string, action: string, details: string) {
  try {
    await AuditLog.create({
      companyId,
      performedBy: email,
      action,
      details,
      ipAddress: '127.0.0.1'
    });
  } catch (err) {
    console.error('[Onboarding Audit Error]', err);
  }
}

// 1. GET /api/onboarding/analytics
router.get('/analytics', handleWebRoute(async (req: Request) => {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { companyId } = decoded;

    await connectToDatabase();

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0,0,0,0);

    const filter: any = { companyId };
    if ((decoded.role === 'Branch Admin' || decoded.role === 'HR') && decoded.branchId) {
      filter.branchId = decoded.branchId;
    }

    const newJoinersThisMonth = await OnboardingRequest.countDocuments({
      ...filter,
      joiningDate: { $gte: startOfMonth }
    });

    const requests = await OnboardingRequest.find(filter);

    const pendingOnboarding = requests.filter(r => 
      ['Invited', 'Documents Pending', 'Verification Pending', 'Approved'].includes(r.status)
    ).length;

    const completedOnboarding = requests.filter(r => 
      ['Activated', 'Completed'].includes(r.status)
    ).length;

    // Count pending documents across all verification requests
    let pendingDocsCount = 0;
    requests.forEach(r => {
      if (r.documents) {
        pendingDocsCount += r.documents.filter(d => d.status === 'Pending').length;
      }
    });

    // Compute average onboarding duration (in days) for completed ones
    const completedReqs = requests.filter(r => 
      ['Activated', 'Completed'].includes(r.status) && r.createdAt && r.updatedAt
    );
    let avgOnboardingDays = 0;
    if (completedReqs.length > 0) {
      const totalMs = completedReqs.reduce((acc, curr) => {
        return acc + (new Date(curr.updatedAt).getTime() - new Date(curr.createdAt).getTime());
      }, 0);
      avgOnboardingDays = Math.round(totalMs / (completedReqs.length * 24 * 60 * 60 * 1000) * 10) / 10 || 0.5;
    }

    // Group department joiners
    const deptHiring: Record<string, number> = {};
    requests.forEach(r => {
      const dept = r.department || 'Other';
      deptHiring[dept] = (deptHiring[dept] || 0) + 1;
    });

    return NextResponse.json({
      newJoinersThisMonth,
      pendingOnboarding,
      completedOnboarding,
      pendingDocsCount,
      avgOnboardingDays,
      deptHiring
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}));

// 2. GET /api/onboarding - Fetch list of onboarding requests (HR / Admin)
router.get('/', handleWebRoute(async (req: Request) => {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { companyId } = decoded;

    await connectToDatabase();
    const filter: any = { companyId };
    if ((decoded.role === 'Branch Admin' || decoded.role === 'HR') && decoded.branchId) {
      filter.branchId = decoded.branchId;
    }
    const requests = await OnboardingRequest.find(filter).sort({ createdAt: -1 });
    return NextResponse.json({ data: requests }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}));

// 3. POST /api/onboarding/invite - Invite a candidate
router.post('/invite', handleWebRoute(async (req: Request) => {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { companyId } = decoded;

    const data = await req.json() as any;
    if (!data.inviteEmail || !data.inviteName || !data.designation || !data.department || !data.joiningDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await connectToDatabase();

    // Check if user already exists
    const existingUser = await User.findOne({ email: data.inviteEmail.toLowerCase().trim() });
    if (existingUser) {
      return NextResponse.json({ error: 'An employee with this email already exists in the system.' }, { status: 400 });
    }

    // Check if onboarding invitation already exists
    const existingRequest = await OnboardingRequest.findOne({ companyId, inviteEmail: data.inviteEmail.toLowerCase().trim() });
    if (existingRequest && existingRequest.status !== 'Rejected') {
      return NextResponse.json({ error: 'An onboarding invitation is already pending for this email.' }, { status: 400 });
    }

    // Check if employee record already exists
    const existingEmployee = await Employee.findOne({ email: data.inviteEmail.toLowerCase().trim() });
    if (existingEmployee) {
      return NextResponse.json({ error: 'An employee record with this email already exists in the system.' }, { status: 400 });
    }

    const inviteToken = crypto.randomBytes(32).toString('hex');

    let branchId = data.branchId || '';
    if ((decoded.role === 'Branch Admin' || decoded.role === 'HR') && decoded.branchId) {
      branchId = decoded.branchId;
    } else if (!branchId) {
      const defaultBranch = await Branch.findOne({ companyId, branchCode: 'MUM001' });
      branchId = defaultBranch ? defaultBranch._id.toString() : '';
    }

    const newRequest = await OnboardingRequest.create({
      companyId,
      inviteEmail: data.inviteEmail.toLowerCase().trim(),
      inviteName: data.inviteName,
      designation: data.designation,
      department: data.department,
      joiningDate: new Date(data.joiningDate),
      inviteToken,
      status: 'Invited',
      employmentType: data.employmentType || 'Full-Time',
      workEmailPasswordPlain: data.workEmailPassword || '',
      branchId
    });

    // Create Employee record in 'Invited' state
    await Employee.create({
      companyId,
      fullName: data.inviteName,
      email: data.inviteEmail.toLowerCase().trim(),
      phone: data.phone || '',
      department: data.department,
      designation: data.designation,
      role: data.role || 'Employee',
      status: 'Invited',
      joinedDate: new Date(data.joiningDate),
      location: 'Remote',
      isActive: false,
      onboardingProgress: 0,
      employmentType: data.employmentType || 'Full-Time',
      companyName: decoded.companyName || 'Corporate',
      companyCode: decoded.companyCode || 'hrcore',
      branchId
    });

    // Send invitation email
    const setupLink = `http://localhost:3000/onboarding/${inviteToken}`;
    
    try {
      await sendEmail({
        to: data.inviteEmail.toLowerCase().trim(),
        subject: `Welcome to the Team! Complete your onboarding setup`,
        text: `Hello ${data.inviteName},\n\nYou have been invited to join our company as a ${data.designation} in the ${data.department} department.\n\nPlease complete your onboarding profile setup here: ${setupLink}\n\nWelcome aboard!`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 8px;">
            <h2 style="color: #2563eb; font-size: 20px; font-weight: bold; border-bottom: 2px solid #2563eb; padding-bottom: 8px; margin-bottom: 16px;">Welcome Aboard!</h2>
            <p style="font-size: 15px; font-weight: bold;">Hello ${data.inviteName},</p>
            <p style="font-size: 14px; color: #475569;">
              We are absolutely thrilled to welcome you to our team as a <strong>${data.designation}</strong> within the <strong>${data.department}</strong> department!
            </p>
            <p style="font-size: 14px; color: #475569; margin-top: 15px;">
              Before your joining date on <strong>${new Date(data.joiningDate).toLocaleDateString(undefined, { dateStyle: 'long' })}</strong>, please complete your onboarding forms, bank verification, and document setup.
            </p>
            <div style="text-align: center; margin: 25px 0;">
              <a href="${setupLink}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; font-size: 14px; font-weight: bold; border-radius: 8px; display: inline-block;">Start Onboarding Setup</a>
            </div>
            <p style="font-size: 12px; color: #64748b; margin-top: 20px; border-top: 1px solid #f0f0f0; padding-top: 8px;">
              If you have any queries, please get in touch with your HR representative.
            </p>
          </div>
        `
      });
    } catch (mailErr) {
      console.error('Failed to send onboarding email:', mailErr);
    }

    await logOnboardingAudit(companyId, decoded.email, 'Invitation Sent', `Sent onboarding invitation link to ${data.inviteEmail}`);

    return NextResponse.json({ success: true, request: newRequest }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}));

// 4. GET /api/onboarding/invite/:token - Validate token and return invite info
router.get('/invite/:token', handleWebRoute(async (req: Request, { params }: { params: any }) => {
  try {
    const { token } = await params;
    await connectToDatabase();
    
    const request = await OnboardingRequest.findOne({ inviteToken: token });
    if (!request) {
      return NextResponse.json({ error: 'Invalid or expired onboarding token' }, { status: 404 });
    }
    return NextResponse.json({ data: request }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}));

// 5. PUT /api/onboarding/:id/profile - Employee completes setup profile & password
router.put('/:id/profile', handleWebRoute(async (req: Request, { params }: { params: any }) => {
  try {
    const { id } = await params;
    const data = await req.json() as any;

    if (!data.fullName || !data.dateOfBirth || !data.gender || !data.address || !data.city || !data.state || !data.country || !data.emergencyContactName || !data.emergencyContactNumber || !data.password) {
      return NextResponse.json({ error: 'Missing required profile setup fields' }, { status: 400 });
    }

    await connectToDatabase();
    const request = await OnboardingRequest.findById(id);
    if (!request) {
      return NextResponse.json({ error: 'Onboarding record not found' }, { status: 404 });
    }

    // Save profile details and temporary password
    request.personalInfo = {
      fullName: data.fullName,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      address: data.address,
      city: data.city,
      state: data.state,
      country: data.country,
      emergencyContactName: data.emergencyContactName,
      emergencyContactNumber: data.emergencyContactNumber,
    };
    
    request.status = 'Profile Pending';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);
    request.tempPasswordHash = passwordHash;
    (request as any).tempPasswordPlain = data.password;  // Store temporarily for activation email
    
    await request.save();

    // Sync Employee record
    await Employee.findOneAndUpdate(
      { companyId: request.companyId, email: request.inviteEmail },
      {
        $set: {
          fullName: data.fullName,
          status: 'Profile Pending',
          onboardingProgress: 25,
          dateOfBirth: data.dateOfBirth,
          gender: data.gender,
          address: `${data.address}, ${data.city}, ${data.state}, ${data.country}`,
          emergencyContact: `${data.emergencyContactName} (${data.emergencyContactNumber})`,
          personalInfo: request.personalInfo
        }
      }
    );

    await logOnboardingAudit(request.companyId, request.inviteEmail, 'Profile Completed', `Candidate completed profile setup step 1`);

    return NextResponse.json({ success: true, request }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}));

// 6. PUT /api/onboarding/:id/documents - Employee uploads verification documents
router.put('/:id/documents', handleWebRoute(async (req: Request, { params }: { params: any }) => {
  try {
    const { id } = await params;
    const { documents } = await req.json() as { documents: Array<{ name: string; fileUrl: string }> };

    if (!Array.isArray(documents)) {
      return NextResponse.json({ error: 'Documents array is required' }, { status: 400 });
    }

    await connectToDatabase();
    const request = await OnboardingRequest.findById(id);
    if (!request) {
      return NextResponse.json({ error: 'Onboarding record not found' }, { status: 404 });
    }

    const mappedDocs = documents.map(d => ({
      name: d.name,
      fileUrl: d.fileUrl,
      status: 'Pending' as const,
      uploadedAt: new Date()
    }));

    request.documents = mappedDocs;
    request.status = 'Documents Pending';
    await request.save();

    // Sync Employee record
    await Employee.findOneAndUpdate(
      { companyId: request.companyId, email: request.inviteEmail },
      {
        $set: {
          status: 'Documents Pending',
          onboardingProgress: 50,
          documents: mappedDocs.map(d => ({
            name: d.name,
            fileUrl: d.fileUrl,
            status: 'Pending Verification',
            uploadedAt: d.uploadedAt
          }))
        }
      }
    );

    await logOnboardingAudit(request.companyId, request.inviteEmail, 'Documents Uploaded', `Candidate uploaded ${documents.length} documents`);

    return NextResponse.json({ success: true, request }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}));

// 7. PUT /api/onboarding/:id/bank - Employee submits bank details & runs Penny Drop
router.put('/:id/bank', handleWebRoute(async (req: Request, { params }: { params: any }) => {
  try {
    const { id } = await params;
    const data = await req.json() as any;

    if (!data.accountHolderName || !data.accountNumber || !data.ifscCode || !data.bankName) {
      return NextResponse.json({ error: 'Missing bank credentials' }, { status: 400 });
    }

    await connectToDatabase();
    const request = await OnboardingRequest.findById(id);
    if (!request) {
      return NextResponse.json({ error: 'Onboarding record not found' }, { status: 404 });
    }

    const verifyPenny = data.pennyDrop === true;

    request.bankDetails = {
      accountHolderName: data.accountHolderName,
      accountNumber: data.accountNumber,
      ifscCode: data.ifscCode,
      bankName: data.bankName,
      upiId: data.upiId || '',
      status: verifyPenny ? 'Verified' : 'Pending',
      pennyDropVerified: verifyPenny
    };

    request.status = 'Documents Pending';
    await request.save();

    // Sync Employee record
    await Employee.findOneAndUpdate(
      { companyId: request.companyId, email: request.inviteEmail },
      {
        $set: {
          status: 'Documents Pending',
          onboardingProgress: 75,
          bankName: data.bankName,
          accountNumber: data.accountNumber,
          ifscCode: data.ifscCode,
          upiId: data.upiId || ''
        }
      }
    );

    await logOnboardingAudit(request.companyId, request.inviteEmail, 'Bank Details Saved', `Candidate submitted bank info (Penny Drop: ${verifyPenny ? 'Successful' : 'Skipped'})`);

    return NextResponse.json({ success: true, request }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}));

// 7.5. PUT /api/onboarding/:id/professional - Employee completes professional info & submits
router.put('/:id/professional', handleWebRoute(async (req: Request, { params }: { params: any }) => {
  try {
    const { id } = await params;
    const data = await req.json() as any;

    if (!data.education || !data.experience || !data.skills) {
      return NextResponse.json({ error: 'Missing required professional setup fields' }, { status: 400 });
    }

    await connectToDatabase();
    const request = await OnboardingRequest.findById(id);
    if (!request) {
      return NextResponse.json({ error: 'Onboarding record not found' }, { status: 404 });
    }

    request.professionalInfo = {
      education: data.education,
      experience: data.experience,
      skills: Array.isArray(data.skills) ? data.skills : String(data.skills).split(',').map(s => s.trim()).filter(Boolean),
      linkedinProfile: data.linkedinProfile || '',
      certifications: data.certifications || ''
    };

    request.status = 'Verification Pending';
    await request.save();

    // Sync Employee record
    await Employee.findOneAndUpdate(
      { companyId: request.companyId, email: request.inviteEmail },
      {
        $set: {
          status: 'Verification Pending',
          onboardingProgress: 100,
          professionalInfo: request.professionalInfo
        }
      }
    );

    // Trigger Notification for Admin & HR that candidate has completed onboarding self-setup
    try {
      const { SystemNotification } = await import('../models/SystemNotification');
      await SystemNotification.create({
        companyId: request.companyId,
        userId: 'admin',
        title: 'Candidate Self-Onboarding Completed',
        content: `${request.inviteName} has submitted onboarding details for verification.`,
        type: 'other',
        targetPage: 'onboarding',
        read: false
      });
    } catch (notifErr) {
      console.error('Failed to trigger completion notification:', notifErr);
    }

    await logOnboardingAudit(request.companyId, request.inviteEmail, 'Professional Info Saved', `Candidate submitted professional setup details for verification`);

    return NextResponse.json({ success: true, request }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}));

// 8. PUT /api/onboarding/:id/verify-document - HR verifies employee document
router.put('/:id/verify-document', handleWebRoute(async (req: Request, { params }: { params: any }) => {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { companyId } = decoded;

    const { id } = await params;
    const { docName, status, rejectedReason } = await req.json() as any;

    await connectToDatabase();
    const request = await OnboardingRequest.findOne({ _id: id, companyId });
    if (!request) {
      return NextResponse.json({ error: 'Onboarding record not found' }, { status: 404 });
    }

    if (request.documents) {
      const doc = request.documents.find(d => d.name === docName);
      if (doc) {
        doc.status = status;
        if (rejectedReason) doc.rejectedReason = rejectedReason;
      }
    }

    await request.save();

    await logOnboardingAudit(companyId, decoded.email, 'Document Verified', `Document ${docName} verification marked as ${status} for ${request.inviteEmail}`);

    return NextResponse.json({ success: true, request }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}));

// 9. PUT /api/onboarding/:id/verify-bank - HR verifies bank details
router.put('/:id/verify-bank', handleWebRoute(async (req: Request, { params }: { params: any }) => {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { companyId } = decoded;

    const { id } = await params;
    const { status } = await req.json() as any;

    await connectToDatabase();
    const request = await OnboardingRequest.findOne({ _id: id, companyId });
    if (!request) {
      return NextResponse.json({ error: 'Onboarding record not found' }, { status: 404 });
    }

    if (request.bankDetails) {
      request.bankDetails.status = status;
    }

    await request.save();

    await logOnboardingAudit(companyId, decoded.email, 'Bank Details Verified', `Bank account verification marked as ${status} for ${request.inviteEmail}`);

    return NextResponse.json({ success: true, request }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}));

// 10. PUT /api/onboarding/:id/activate - Final Approve & Activate Employee
router.put('/:id/activate', handleWebRoute(async (req: Request, { params }: { params: any }) => {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { companyId, companyName, companyCode } = decoded;

    const { id } = await params;
    const data = await req.json() as any; // { role: 'Employee', department: 'Engineering', designation: '...' }

    await connectToDatabase();
    const request = await OnboardingRequest.findOne({ _id: id, companyId });
    if (!request) {
      return NextResponse.json({ error: 'Onboarding record not found' }, { status: 404 });
    }

    // Auto-generate Employee ID
    const year = 2026;
    const counter = await OnboardingCounter.findOneAndUpdate(
      { companyId, year },
      { $inc: { seq: 1 } },
      { upsert: true, new: true }
    );

    const empId = `EMP-${year}-${counter.seq.toString().padStart(4, '0')}`;

    // Create Employee record
    const personal = request.personalInfo || {} as any;
    const bank = request.bankDetails || {} as any;
    
    // Map documents to employee schema format
    const empDocs = (request.documents || []).map(d => ({
      name: d.name,
      fileUrl: d.fileUrl,
      status: d.status === 'Verified' ? 'Verified' : 'Pending Verification',
      uploadedAt: d.uploadedAt || new Date()
    }));

    let newEmployee = await Employee.findOne({ companyId, email: request.inviteEmail });
    if (newEmployee) {
      newEmployee.empId = empId;
      newEmployee.fullName = personal.fullName || request.inviteName;
      newEmployee.department = data.department || request.department || newEmployee.department;
      newEmployee.designation = data.designation || request.designation || newEmployee.designation;
      newEmployee.phone = personal.emergencyContactNumber || newEmployee.phone || '+91 99999 99999';
      newEmployee.joinedDate = request.joiningDate || newEmployee.joinedDate;
      newEmployee.location = personal.address || newEmployee.location || 'Corporate HQ';
      newEmployee.emergencyContact = personal.emergencyContact || newEmployee.emergencyContact || '';
      newEmployee.bankName = bank.bankName || newEmployee.bankName || '';
      newEmployee.accountNumber = bank.accountNumber || newEmployee.accountNumber || '';
      newEmployee.ifscCode = bank.ifscCode || newEmployee.ifscCode || '';
      newEmployee.upiId = bank.upiId || newEmployee.upiId || '';
      newEmployee.dateOfBirth = personal.dateOfBirth || newEmployee.dateOfBirth || '';
      newEmployee.gender = personal.gender || newEmployee.gender || '';
      newEmployee.address = personal.address || newEmployee.address || '';
      newEmployee.documents = empDocs;
      newEmployee.isActive = true;
      newEmployee.status = 'Active';
      newEmployee.onboardingProgress = 100;
      newEmployee.personalInfo = personal;
      newEmployee.professionalInfo = request.professionalInfo;
      newEmployee.maxLeaves = 24;
      newEmployee.branchId = request.branchId || newEmployee.branchId || '';
      await newEmployee.save();
    } else {
      newEmployee = await Employee.create({
        companyId,
        empId,
        fullName: personal.fullName || request.inviteName,
        department: data.department || request.department,
        designation: data.designation || request.designation,
        email: request.inviteEmail,
        phone: personal.emergencyContactNumber || '+91 99999 99999',
        joinedDate: request.joiningDate,
        location: personal.address || 'Corporate HQ',
        companyName,
        companyCode,
        emergencyContact: personal.emergencyContact || '',
        bankName: bank.bankName || '',
        accountNumber: bank.accountNumber || '',
        ifscCode: bank.ifscCode || '',
        upiId: bank.upiId || '',
        dateOfBirth: personal.dateOfBirth || '',
        gender: personal.gender || '',
        address: personal.address || '',
        documents: empDocs,
        isActive: true,
        status: 'Active',
        onboardingProgress: 100,
        personalInfo: personal,
        professionalInfo: request.professionalInfo,
        maxLeaves: 24,
        branchId: request.branchId || ''
      });
    }

    // Create User login credentials
    const passwordHash = (request as any).tempPasswordHash || await bcrypt.hash('DefaultWelcome2026!', 10);
    
    await User.create({
      fullName: personal.fullName || request.inviteName,
      email: request.inviteEmail,
      companyName,
      companyCode,
      companyId,
      role: data.role || 'Employee',
      password: passwordHash,
      isVerified: true,
      status: 'Active',
      isActive: true
    });

    // Update OnboardingRequest
    request.status = 'Activated';
    request.activatedEmployeeId = empId;
    request.roleAssigned = data.role || 'Employee';
    await request.save();

    // Trigger System welcome notification
    try {
      await SystemNotification.create({
        companyId,
        userId: request.inviteEmail,
        title: 'Welcome Center Activated!',
        content: `Welcome to ${companyName}! Explore policies, your team org structure, and welcome handbook.`,
        type: 'other',
        targetPage: 'dashboard',
        read: false
      });
    } catch (notifErr) {
      console.error('[Welcome Notif Error]', notifErr);
    }

    // Trigger Welcome email — send to PERSONAL email with login credentials
    const personalEmailAddress = request.invitePersonalEmail || request.inviteEmail;
    const loginPassword = (request as any).tempPasswordPlain || '(Password set during onboarding)';
    const workEmailPwd = data.workEmailPassword || (request as any).workEmailPasswordPlain || '';
    try {
      await sendEmail({
        to: personalEmailAddress,
        subject: `🎉 You're Activated! Your login credentials for ${companyName}`,
        text: `Hello ${request.inviteName},\n\nYour profile has been approved and activated!\n\nEmployee ID: ${empId}\nWork Email (Login ID): ${request.inviteEmail}\nHR Portal Password: ${loginPassword}${workEmailPwd ? `\nWork Email Password: ${workEmailPwd}` : ''}\n\nLogin here: http://localhost:3000/\n\nWelcome to ${companyName}!`,
        html: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 0; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 28px 24px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">Welcome to ${companyName}! 🎉</h1>
              <p style="color: #d1fae5; font-size: 13px; margin: 6px 0 0; font-weight: 500;">Your account has been activated by HR</p>
            </div>

            <!-- Body -->
            <div style="padding: 24px;">
              <p style="font-size: 15px; font-weight: 600; color: #1e293b; margin: 0 0 8px;">Hi ${request.inviteName},</p>
              <p style="font-size: 14px; color: #64748b; margin: 0 0 20px;">
                Congratulations! Your onboarding is complete and your employee account is now active. Here are your login details:
              </p>

              <!-- Credentials Card -->
              <div style="background-color: #f0fdf4; border: 2px solid #86efac; border-radius: 10px; padding: 20px; margin: 0 0 20px;">
                <h3 style="font-size: 11px; font-weight: 800; color: #15803d; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 14px; border-bottom: 1px solid #bbf7d0; padding-bottom: 8px;">🔐 Your Login Credentials</h3>
                <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
                  <tr>
                    <td style="font-weight: 700; color: #166534; padding: 6px 0; width: 140px;">Employee ID</td>
                    <td style="font-weight: 800; color: #1e293b; font-size: 16px; letter-spacing: 0.5px;">${empId}</td>
                  </tr>
                  <tr>
                    <td style="font-weight: 700; color: #166534; padding: 6px 0;">Work Email</td>
                    <td style="font-weight: 600; color: #1e293b;">${request.inviteEmail}</td>
                  </tr>
                  <tr>
                    <td style="font-weight: 700; color: #166534; padding: 6px 0;">HR Portal Password</td>
                    <td style="font-weight: 800; color: #dc2626; font-family: monospace; font-size: 15px; background: #fef2f2; padding: 6px 10px; border-radius: 4px;">${loginPassword}</td>
                  </tr>
                  ${workEmailPwd ? `
                  <tr>
                    <td style="font-weight: 700; color: #166534; padding: 6px 0;">Work Email Password</td>
                    <td style="font-weight: 800; color: #7c3aed; font-family: monospace; font-size: 15px; background: #f5f3ff; padding: 6px 10px; border-radius: 4px;">${workEmailPwd}</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="font-weight: 700; color: #166534; padding: 6px 0;">Designation</td>
                    <td style="color: #334155;">${newEmployee.designation}</td>
                  </tr>
                  <tr>
                    <td style="font-weight: 700; color: #166534; padding: 6px 0;">Department</td>
                    <td style="color: #334155;">${newEmployee.department}</td>
                  </tr>
                </table>
              </div>

              <!-- Important Note -->
              <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 14px; margin: 0 0 20px;">
                <p style="font-size: 12px; color: #92400e; font-weight: 700; margin: 0 0 4px;">⚠️ Important</p>
                <p style="font-size: 13px; color: #78350f; margin: 0;">
                  Use your <strong>Work Email</strong> (${request.inviteEmail}) and the password shown above to log in. <strong>Change your password immediately after first login</strong> for security.
                </p>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 24px 0 8px;">
                <a href="http://localhost:3000/" style="background: linear-gradient(135deg, #10b981, #059669); color: #ffffff; padding: 14px 32px; text-decoration: none; font-size: 14px; font-weight: 800; border-radius: 10px; display: inline-block; letter-spacing: 0.5px;">Login to HR Portal →</a>
              </div>
              
              <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 16px 0 0;">
                This email was sent to your personal email. For any issues, contact HR at ${companyName}.
              </p>
            </div>
          </div>
        `
      });
    } catch (mailErr) {
      console.error('[Welcome Email Error]', mailErr);
    }

    // Clear plain password from DB after sending email (security)
    (request as any).tempPasswordPlain = '';
    await request.save();

    await logOnboardingAudit(companyId, decoded.email, 'Employee Activated', `Successfully activated profile for ${request.inviteEmail} with Employee ID ${empId}`);

    return NextResponse.json({ success: true, empId }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}));

// 10.5. PUT /api/onboarding/:id/status - HR updates onboarding request status (Reject or Request Changes)
router.put('/:id/status', handleWebRoute(async (req: Request, { params }: { params: any }) => {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { companyId } = decoded;

    const { id } = await params;
    const { status, feedback } = await req.json() as any; // status: 'Rejected' or 'Profile Pending' or 'Documents Pending'

    if (!['Rejected', 'Profile Pending', 'Documents Pending', 'Verification Pending'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status transition' }, { status: 400 });
    }

    await connectToDatabase();
    const request = await OnboardingRequest.findOne({ _id: id, companyId });
    if (!request) {
      return NextResponse.json({ error: 'Onboarding record not found' }, { status: 404 });
    }

    request.status = status;
    await request.save();

    // Sync Employee record status
    await Employee.findOneAndUpdate(
      { companyId, email: request.inviteEmail },
      { $set: { status: status } }
    );

    // If feedback is provided or if status is changed, send an email to the candidate
    try {
      let subject = '';
      let messageHtml = '';

      if (status === 'Rejected') {
        subject = `Update regarding your onboarding setup`;
        messageHtml = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 8px;">
            <h2 style="color: #ef4444; font-size: 20px; font-weight: bold; border-bottom: 2px solid #ef4444; padding-bottom: 8px; margin-bottom: 16px;">Onboarding Update</h2>
            <p style="font-size: 15px; font-weight: bold;">Hello ${request.inviteName},</p>
            <p style="font-size: 14px; color: #475569;">
              We regret to inform you that your onboarding setup has been rejected and cancelled.
            </p>
            ${feedback ? `<p style="font-size: 14px; color: #475569; margin-top: 10px;"><strong>Feedback from HR:</strong> ${feedback}</p>` : ''}
          </div>
        `;
      } else {
        // Request Changes
        subject = `Action Required: Onboarding profile modifications requested`;
        const setupLink = `http://localhost:3000/onboarding/${request.inviteToken}`;
        messageHtml = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 8px;">
            <h2 style="color: #f59e0b; font-size: 20px; font-weight: bold; border-bottom: 2px solid #f59e0b; padding-bottom: 8px; margin-bottom: 16px;">Changes Requested</h2>
            <p style="font-size: 15px; font-weight: bold;">Hello ${request.inviteName},</p>
            <p style="font-size: 14px; color: #475569;">
              Our HR team has reviewed your onboarding details and requested some modifications before activating your profile.
            </p>
            ${feedback ? `<div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 6px; padding: 12px; margin: 15px 0; color: #b45309; font-size: 13px;"><strong>Details:</strong> ${feedback}</div>` : ''}
            <div style="text-align: center; margin: 25px 0;">
              <a href="${setupLink}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; font-size: 14px; font-weight: bold; border-radius: 8px; display: inline-block;">Update Onboarding Details</a>
            </div>
          </div>
        `;
      }

      await sendEmail({
        to: request.inviteEmail,
        subject,
        text: feedback || `Your onboarding status has been updated to ${status}`,
        html: messageHtml
      });
    } catch (mailErr) {
      console.error('[Status Update Email Error]', mailErr);
    }

    await logOnboardingAudit(companyId, decoded.email, `Onboarding ${status}`, `Onboarding request marked as ${status}. Feedback: ${feedback || 'None'}`);

    return NextResponse.json({ success: true, request }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}));

// 11. POST /api/onboarding/:id/remind - Send a reminder email to the candidate
router.post('/:id/remind', handleWebRoute(async (req: Request, { params }: { params: any }) => {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { companyId } = decoded;

    const { id } = await params;
    await connectToDatabase();
    
    const request = await OnboardingRequest.findOne({ _id: id, companyId });
    if (!request) {
      return NextResponse.json({ error: 'Onboarding record not found' }, { status: 404 });
    }

    if (['Activated', 'Completed'].includes(request.status)) {
      return NextResponse.json({ error: 'Candidate onboarding already completed' }, { status: 400 });
    }

    const setupLink = `http://localhost:3000/onboarding/${request.inviteToken}`;
    
    try {
      await sendEmail({
        to: request.inviteEmail,
        subject: `Friendly Reminder: Please complete your onboarding setup`,
        text: `Hello ${request.inviteName},\n\nThis is a friendly reminder to complete your onboarding profile setup.\n\nPlease complete it here: ${setupLink}\n\nThank you!`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 8px;">
            <h2 style="color: #2563eb; font-size: 20px; font-weight: bold; border-bottom: 2px solid #2563eb; padding-bottom: 8px; margin-bottom: 16px;">Onboarding Setup Reminder</h2>
            <p style="font-size: 15px; font-weight: bold;">Hello ${request.inviteName},</p>
            <p style="font-size: 14px; color: #475569;">
              This is a gentle reminder to complete your employee onboarding wizard.
            </p>
            <p style="font-size: 14px; color: #475569; margin-top: 15px;">
              Your current onboarding status is: <strong>${request.status}</strong>. Please ensure all personal, banking, professional details and document uploads are completed.
            </p>
            <div style="text-align: center; margin: 25px 0;">
              <a href="${setupLink}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; font-size: 14px; font-weight: bold; border-radius: 8px; display: inline-block;">Continue Onboarding Setup</a>
            </div>
            <p style="font-size: 12px; color: #64748b; margin-top: 20px; border-top: 1px solid #f0f0f0; padding-top: 8px;">
              If you have any questions, please contact your HR department.
            </p>
          </div>
        `
      });
    } catch (mailErr) {
      console.error('Failed to send reminder email:', mailErr);
    }

    await logOnboardingAudit(companyId, decoded.email, 'Reminder Sent', `Sent manual onboarding reminder to ${request.inviteEmail}`);

    return NextResponse.json({ success: true, message: 'Reminder email sent successfully' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}));

export default router;
