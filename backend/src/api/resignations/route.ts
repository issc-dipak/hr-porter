import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Resignation } from '../../models/Resignation';
import { User } from '../../models/User';
import { Employee } from '../../models/Employee';
import { verifyAuth, getDynamicRole } from '@/app/api/lib/auth';
import { sendEmail } from '../../utils/email';
import { SystemNotificationService } from '../../services/systemNotificationService';
import { AuditLog } from '../../models/AuditLog';

// GET: List resignation requests
export async function GET(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const companyId = decoded.companyId || 'company_001';
    const userRole = await getDynamicRole(decoded);

    let resignations;
    if (userRole === 'Employee') {
      // Employees only see their own resignation
      resignations = await Resignation.find({ companyId, employeeEmail: decoded.email.toLowerCase() }).sort({ createdAt: -1 });
    } else {
      // Admin and HR see all resignations in their company
      resignations = await Resignation.find({ companyId }).sort({ createdAt: -1 });
    }

    return NextResponse.json({ data: resignations }, { status: 200 });
  } catch (error: any) {
    console.error('Failed to fetch resignations:', error);
    return NextResponse.json({ error: 'Failed to fetch resignations', details: error.message }, { status: 500 });
  }
}

// POST: Submit a new resignation request
export async function POST(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json()) as any;
    const { reason, category, lastWorkingDay, noticePeriodDays, additionalNotes, resignationLetterUrl, assigneeEmail } = body;

    if (!reason || !lastWorkingDay || !noticePeriodDays) {
      return NextResponse.json({ error: 'Missing required fields (reason, lastWorkingDay, noticePeriodDays)' }, { status: 400 });
    }

    await connectToDatabase();
    const companyId = decoded.companyId || 'company_001';
    const email = decoded.email.toLowerCase().trim();
    const userRole = await getDynamicRole(decoded);

    // Check if employee already has an active resignation
    const existingResignation = await Resignation.findOne({
      companyId,
      employeeEmail: email,
      status: { $nin: ['Rejected', 'Archived', 'Completed'] }
    });

    if (existingResignation) {
      return NextResponse.json({ error: 'You already have a pending resignation request' }, { status: 400 });
    }

    // Role-based workflow processing
    let initialStatus: 'Submitted' | 'HR Review' | 'Admin Review' = 'Submitted';
    let rightsTransferred = false;

    if (userRole === 'HR') {
      // HR resignation goes directly to Admin Review (bypassing HR review stage)
      initialStatus = 'Admin Review';
    } else if (userRole === 'Admin' || userRole === 'Company Admin') {
      // Admin resignation workflow
      initialStatus = 'Admin Review';

      // Count active admins in the company
      const activeAdmins = await User.countDocuments({
        companyId,
        role: { $in: ['Admin', 'Company Admin'] },
        isActive: true
      });

      if (activeAdmins <= 1) {
        // Must assign successor admin
        if (!assigneeEmail) {
          return NextResponse.json({
            error: 'You are the only active Admin. You must specify a successor Admin (assigneeEmail) to transfer ownership before resigining.'
          }, { status: 400 });
        }

        const successorEmail = assigneeEmail.toLowerCase().trim();
        if (successorEmail === email) {
          return NextResponse.json({ error: 'You cannot transfer admin rights to yourself.' }, { status: 400 });
        }

        const successor = await User.findOne({ companyId, email: successorEmail });
        if (!successor) {
          return NextResponse.json({ error: `Successor user with email ${successorEmail} not found.` }, { status: 400 });
        }

        // Promote successor to Admin
        successor.role = 'Admin';
        successor.isActive = true;
        successor.status = 'Active';
        await successor.save();

        // Also update successor employee profile if it exists
        const successorEmp = await Employee.findOne({ companyId, email: successorEmail });
        if (successorEmp) {
          successorEmp.isActive = true;
          successorEmp.status = 'Active';
          await successorEmp.save();
        }

        rightsTransferred = true;

        // Log audit trail of ownership transfer
        await AuditLog.create({
          companyId,
          action: 'Admin Rights Transferred',
          performedBy: email,
          details: `Transferred primary admin ownership to successor: ${successorEmail} because current admin resigned.`,
          ipAddress: '127.0.0.1'
        });
      }
    }

    const resignation = await Resignation.create({
      companyId,
      employeeEmail: email,
      employeeName: decoded.fullName || email.split('@')[0],
      reason,
      category: category || 'Other',
      lastWorkingDay: new Date(lastWorkingDay),
      noticePeriodDays,
      noticeStartDate: new Date(),
      status: initialStatus,
      additionalNotes: additionalNotes || '',
      resignationLetterUrl: resignationLetterUrl || '',
      assigneeEmail: assigneeEmail || '',
      rightsTransferred,
      exitChecklist: {
        laptopReturned: false,
        idCardReturned: false,
        companyAssetsReturned: false,
        assetReturned: false,
        accessRevoked: false,
        knowledgeTransferCompleted: false,
        documentsSubmitted: false,
        hrClearance: false,
        payrollClearance: false,
        payrollClosed: false,
        financeClearance: false,
        settlementCompleted: false,
        finalSettlementCompleted: false
      },
      history: [
        {
          action: 'Resignation Submitted',
          performedBy: email,
          performedByRole: userRole,
          details: `Resignation submitted. Category: ${category || 'Other'}. Last Working Day: ${new Date(lastWorkingDay).toLocaleDateString()}`
        }
      ]
    });

    // Write Audit Log
    await AuditLog.create({
      companyId,
      action: 'Resignation Submitted',
      performedBy: email,
      details: `Resignation request submitted by ${decoded.fullName || email} (${userRole})`,
      ipAddress: '127.0.0.1'
    });

    // Notify appropriate roles
    const targetRoles: ('Admin' | 'Company Admin' | 'HR')[] = [];
    if (userRole === 'Employee') {
      targetRoles.push('HR', 'Admin');
    } else {
      // HR or Admin resigning: only other Admins should review/approve
      targetRoles.push('Admin');
    }

    await SystemNotificationService.notifyRoles(companyId, targetRoles, {
      companyId,
      title: 'New Resignation Request',
      content: `${decoded.fullName || email} has submitted a resignation request. LWD: ${new Date(lastWorkingDay).toLocaleDateString()}`,
      type: 'other',
      targetPage: 'offboarding'
    });

    // Send confirmation email to the employee
    await sendEmail({
      to: email,
      subject: 'Resignation Request Submitted',
      text: `Dear ${decoded.fullName || email},\n\nYour resignation request has been successfully submitted and is under review. Your requested last working day is ${new Date(lastWorkingDay).toLocaleDateString()}.\n\nRegards,\nHR Portal`,
      html: `<p>Dear <strong>${decoded.fullName || email}</strong>,</p><p>Your resignation request has been successfully submitted and is under review.</p><p><strong>Requested Last Working Day:</strong> ${new Date(lastWorkingDay).toLocaleDateString()}</p><p>Regards,<br/>HR Portal</p>`
    });

    // Send notification emails to target roles (HR/Admin)
    const notificationUsers = await User.find({
      companyId,
      role: { $in: targetRoles },
      status: 'Active',
      email: { $ne: email }
    });

    for (const u of notificationUsers) {
      await sendEmail({
        to: u.email,
        subject: `New Resignation Submission - ${decoded.fullName || email}`,
        text: `Hello,\n\nA new resignation request has been submitted by ${decoded.fullName || email} (${userRole}). Please review it in the offboarding dashboard.\n\nRegards,\nHR Portal`,
        html: `<p>Hello,</p><p>A new resignation request has been submitted by <strong>${decoded.fullName || email}</strong> (${userRole}).</p><p>Please review it in the offboarding dashboard.</p><p>Regards,<br/>HR Portal</p>`
      });
    }

    return NextResponse.json({ message: 'Resignation request submitted successfully', data: resignation }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to submit resignation:', error);
    return NextResponse.json({ error: 'Failed to submit resignation', details: error.message }, { status: 500 });
  }
}
