import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Policy } from '@/app/api/models/Policy';
import { PolicyVersion } from '@/app/api/models/PolicyVersion';
import { PolicyAcknowledgement } from '@/app/api/models/PolicyAcknowledgement';
import { PolicyAuditLog } from '@/app/api/models/PolicyAuditLog';
import { verifyAuth } from '@/app/api/lib/auth';
import { checkUserPermission } from '@/app/api/lib/rbac';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = decoded.companyId;
    const { id } = await params;

    await connectToDatabase();
    const policy = await Policy.findOne({ _id: id, companyId });
    if (!policy) {
      return NextResponse.json({ error: 'Policy not found' }, { status: 404 });
    }

    // Get versions
    const versions = await PolicyVersion.find({ policyId: id }).sort({ createdAt: -1 });

    // Get audit logs
    const auditLogs = await PolicyAuditLog.find({ policyId: id }).sort({ timestamp: -1 });

    // Get acknowledgements (Admin/HR only)
    let acknowledgements: any[] = [];
    const isPrivileged = await checkUserPermission(companyId, decoded.userId, decoded.role, 'policy.create') ||
                        await checkUserPermission(companyId, decoded.userId, decoded.role, 'policy.publish');
    if (isPrivileged) {
      acknowledgements = await PolicyAcknowledgement.find({ policyId: id }).sort({ acknowledgedAt: -1 });
    }

    return NextResponse.json({
      policy,
      versions,
      auditLogs,
      acknowledgements
    }, { status: 200 });
  } catch (error: any) {
    console.error('Failed to fetch specific policy details:', error);
    return NextResponse.json({ error: 'Failed to fetch policy details', details: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const companyId = decoded.companyId;
    const isPrivileged = await checkUserPermission(companyId, decoded.userId, decoded.role, 'policy.edit') ||
                        await checkUserPermission(companyId, decoded.userId, decoded.role, 'policy.publish');
    if (!isPrivileged) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions to modify policies' }, { status: 403 });
    }

    const { id } = await params;
    const data = await req.json() as any;

    await connectToDatabase();
    const policy = await Policy.findOne({ _id: id, companyId });
    if (!policy) {
      return NextResponse.json({ error: 'Policy not found' }, { status: 404 });
    }

    const originalStatus = policy.status;
    const contentChanged = data.content !== undefined && data.content !== policy.content;
    let nextVersion = policy.currentVersion;

    if (contentChanged) {
      // Determine version increment
      const incrementType = data.versionIncrement || 'minor'; // 'minor' or 'major'
      const versionParts = policy.currentVersion.split('.').map(Number);
      if (versionParts.length === 2 && !isNaN(versionParts[0]) && !isNaN(versionParts[1])) {
        if (incrementType === 'major') {
          nextVersion = `${versionParts[0] + 1}.0`;
        } else {
          nextVersion = `${versionParts[0]}.${versionParts[1] + 1}`;
        }
      } else {
        nextVersion = '1.1'; // fallback
      }

      // Create new PolicyVersion
      await PolicyVersion.create({
        policyId: policy._id,
        version: nextVersion,
        content: data.content,
        changeSummary: data.changeSummary || 'Policy content updated',
        modifiedBy: decoded.fullName || decoded.email.split('@')[0],
        modifiedByEmail: decoded.email
      });

      policy.content = data.content;
      policy.currentVersion = nextVersion;
    }

    // Update details
    const updatableFields = [
      'title',
      'category',
      'description',
      'effectiveDate',
      'expiryDate',
      'visibilityScope',
      'targetDepartments',
      'attachments',
      'status'
    ];

    for (const field of updatableFields) {
      if (data[field] !== undefined) {
        if (field === 'effectiveDate' || field === 'expiryDate') {
          (policy as any)[field] = data[field] ? new Date(data[field]) : undefined;
        } else {
          (policy as any)[field] = data[field];
        }
      }
    }

    await policy.save();

    // Log in Policy Audit Log
    await PolicyAuditLog.create({
      companyId,
      policyId: policy._id,
      policyTitle: policy.title,
      user: decoded.fullName || decoded.email.split('@')[0],
      email: decoded.email,
      role: decoded.role,
      action: 'Edited',
      details: contentChanged 
        ? `Updated policy content to v${nextVersion}. Change Summary: ${data.changeSummary || 'None'}. Status: ${policy.status}.`
        : `Updated policy details. Status: ${policy.status}.`
    });

    // Send notifications if status changed to Published
    if (policy.status === 'Published' && originalStatus !== 'Published') {
      // 1. Log in general Policy Audit Log
      await PolicyAuditLog.create({
        companyId,
        policyId: policy._id,
        policyTitle: policy.title,
        user: decoded.fullName || decoded.email.split('@')[0],
        email: decoded.email,
        role: decoded.role,
        action: 'Published',
        details: `Published policy "${policy.title}" v${policy.currentVersion}.`
      });

      // 2. In-App Notifications
      try {
        const { SystemNotificationService } = await import('../../../services/systemNotificationService');
        await SystemNotificationService.notifyAllUsers(companyId, {
          companyId,
          title: 'New Policy Published',
          content: `A new policy has been published: ${policy.title} (v${policy.currentVersion}). Please review and acknowledge.`,
          type: 'policy',
          targetPage: 'policies'
        });
      } catch (err) {
        console.error('Failed to trigger policy publish in-app notification:', err);
      }

      // 3. Email Notifications
      try {
        const { sendEmail } = await import('../../../utils/email');
        const { Employee } = await import('../../../models/Employee');
        
        let targetEmployees = [];
        if (policy.visibilityScope === 'Entire Company') {
          targetEmployees = await Employee.find({ companyId, status: 'Active' });
        } else if (policy.visibilityScope === 'Department Specific') {
          targetEmployees = await Employee.find({ companyId, status: 'Active', department: { $in: policy.targetDepartments } });
        } else if (policy.visibilityScope === 'HR Only') {
          targetEmployees = await Employee.find({ companyId, status: 'Active', department: 'HR' });
        }

        const emails = targetEmployees.map(emp => emp.email).filter(Boolean);

        if (emails.length > 0) {
          const subject = `📢 Mandatory Policy Review: ${policy.title}`;
          const emailText = `Hello Team,\n\nA new policy has been published: ${policy.title} (v${policy.currentVersion}).\n\nEffective Date: ${new Date(policy.effectiveDate).toLocaleDateString()}\nDescription: ${policy.description}\n\nPlease log in to the employee dashboard, read the policy content, and complete the acknowledgement.\n\nThank you,\nHR & Administration Team`;
          
          const emailHtml = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
              <h2 style="color: #2563eb; font-size: 20px; font-weight: bold; border-bottom: 2px solid #2563eb; padding-bottom: 8px; margin-bottom: 16px;">
                📢 Policy Update Notice
              </h2>
              <p style="font-size: 14px; margin-bottom: 16px;">Hello Team,</p>
              <p style="font-size: 14px; margin-bottom: 16px;">
                A new/updated company policy has been officially published and requires your attention.
              </p>
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                <h3 style="margin-top: 0; color: #0f172a; font-size: 16px; font-weight: bold;">${policy.title} <span style="font-size: 12px; color: #64748b; font-weight: normal;">(v${policy.currentVersion})</span></h3>
                <p style="font-size: 13px; color: #475569; margin-bottom: 8px;"><strong>Category:</strong> ${policy.category}</p>
                <p style="font-size: 13px; color: #475569; margin-bottom: 8px;"><strong>Effective Date:</strong> ${new Date(policy.effectiveDate).toLocaleDateString()}</p>
                <p style="font-size: 13px; color: #475569; margin-bottom: 0;"><strong>Description:</strong> ${policy.description || 'No description provided.'}</p>
              </div>
              <p style="font-size: 14px; margin-bottom: 20px;">
                Please log in to the HR Portal, navigate to <strong>Company Policies</strong>, read the full policy text, and click the <strong>"I Have Read & Understood"</strong> button to submit your compliance acknowledgement.
              </p>
              <p style="font-size: 12px; color: #64748b; margin-top: 20px; border-top: 1px solid #f0f0f0; padding-top: 8px;">
                This is an automated system notification. Please do not reply directly.
              </p>
            </div>
          `;

          // Send group emails asynchronously
          Promise.all(
            emails.map(async (email) => {
              try {
                await sendEmail({ to: email, subject, text: emailText, html: emailHtml });
              } catch (err) {
                console.error(`Failed to send policy notification email to ${email}:`, err);
              }
            })
          ).catch(err => console.error('[Policy Notification Email Dispatch Group Error]', err));
        }
      } catch (err) {
        console.error('Failed to dispatch policy email notifications:', err);
      }
    }

    return NextResponse.json(policy, { status: 200 });
  } catch (error: any) {
    console.error('Failed to update policy:', error);
    return NextResponse.json({ error: 'Failed to update policy', details: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const companyId = decoded.companyId;
    const isPrivileged = await checkUserPermission(companyId, decoded.userId, decoded.role, 'policy.edit');
    if (!isPrivileged) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions to delete policies' }, { status: 403 });
    }

    const { id } = await params;

    await connectToDatabase();
    const policy = await Policy.findOne({ _id: id, companyId });
    if (!policy) {
      return NextResponse.json({ error: 'Policy not found' }, { status: 404 });
    }

    // Delete policy and associated records
    await Policy.deleteOne({ _id: id });
    await PolicyVersion.deleteMany({ policyId: id });
    await PolicyAcknowledgement.deleteMany({ policyId: id });
    await PolicyAuditLog.deleteMany({ policyId: id });

    return NextResponse.json({ success: true, message: 'Policy and all historical version records deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Failed to delete policy:', error);
    return NextResponse.json({ error: 'Failed to delete policy', details: error.message }, { status: 500 });
  }
}
