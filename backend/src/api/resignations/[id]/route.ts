import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Resignation } from '../../../models/Resignation';
import { ExitChecklist } from '../../../models/ExitChecklist';
import { ExitInterview } from '../../../models/ExitInterview';
import { Settlement } from '../../../models/Settlement';
import { ArchivedEmployee } from '../../../models/ArchivedEmployee';
import { User } from '../../../models/User';
import { Employee } from '../../../models/Employee';
import { verifyAuth, getDynamicRole } from '@/app/api/lib/auth';
import { sendEmail } from '../../../utils/email';
import { SystemNotificationService } from '../../../services/systemNotificationService';
import { AuditLog } from '../../../models/AuditLog';
import { ExperienceLetter } from '../../../models/ExperienceLetter';
import { RelievingLetter } from '../../../models/RelievingLetter';
import { CompanyBranding } from '../../../models/CompanyBranding';
import { generateExperienceLetterPdf, generateRelievingLetterPdf } from '../../../utils/pdf';

// GET: Fetch detailed resignation
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectToDatabase();
    const companyId = decoded.companyId || 'company_001';

    const resignation = await Resignation.findById(id);
    if (!resignation) {
      return NextResponse.json({ error: 'Resignation record not found' }, { status: 404 });
    }

    if (resignation.companyId !== companyId) {
      return NextResponse.json({ error: 'Forbidden: Multi-tenant boundary violation' }, { status: 403 });
    }

    // Check authorization: Employee can only see their own
    const userRole = await getDynamicRole(decoded);
    if (userRole === 'Employee' && resignation.employeeEmail !== decoded.email.toLowerCase()) {
      return NextResponse.json({ error: 'Forbidden: Access denied' }, { status: 403 });
    }

    // Fetch related records to return a consolidated object
    const checklist = await ExitChecklist.findOne({ resignationId: id, companyId });
    const interview = await ExitInterview.findOne({ resignationId: id, companyId });
    const settlement = await Settlement.findOne({ resignationId: id, companyId });

    return NextResponse.json({
      data: {
        resignation,
        checklist,
        interview,
        settlement
      }
    }, { status: 200 });
  } catch (error: any) {
    console.error('Failed to fetch detailed resignation:', error);
    return NextResponse.json({ error: 'Failed to fetch detailed resignation', details: error.message }, { status: 500 });
  }
}

// PUT: Update resignation details, checklist status, interviews, settlement, or status transitions
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = (await req.json()) as any;
    await connectToDatabase();

    const companyId = decoded.companyId || 'company_001';
    const userEmail = decoded.email.toLowerCase().trim();
    const userRole = await getDynamicRole(decoded);

    const resignation = await Resignation.findById(id);
    if (!resignation) {
      return NextResponse.json({ error: 'Resignation record not found' }, { status: 404 });
    }

    if (resignation.companyId !== companyId) {
      return NextResponse.json({ error: 'Forbidden: Multi-tenant boundary violation' }, { status: 403 });
    }

    const isSelf = resignation.employeeEmail === userEmail;

    // Self-Review & Self-Approval Guards
    if (body.status || body.approvalAction) {
      if (isSelf) {
        if (userRole === 'HR') {
          return NextResponse.json({ error: 'HR users must NEVER approve/review their own resignation.' }, { status: 400 });
        }
        if (userRole === 'Admin' || userRole === 'Company Admin') {
          return NextResponse.json({ error: 'Admin users must NEVER approve/review their own resignation.' }, { status: 400 });
        }
      }
    }

    // 1. Handle Status Transitions and Approvals
    if (body.status && body.status !== resignation.status) {
      const oldStatus = resignation.status;
      const newStatus = body.status;

      resignation.status = newStatus;
      resignation.history.push({
        action: `Status changed to ${newStatus}`,
        performedBy: userEmail,
        performedByRole: userRole,
        details: body.transitionNotes || `Status updated from ${oldStatus} to ${newStatus}`
      });

      // Log to AuditLogs
      await AuditLog.create({
        companyId,
        action: `Resignation Status Updated`,
        performedBy: userEmail,
        details: `Resignation for ${resignation.employeeEmail} status changed from ${oldStatus} to ${newStatus}.`,
        ipAddress: '127.0.0.1'
      });

      // Status Notification Triggers
      if (newStatus === 'Approved') {
        // Send email
        await sendEmail({
          to: resignation.employeeEmail,
          subject: 'Resignation Request Approved',
          text: `Dear ${resignation.employeeName},\n\nYour resignation request has been approved. You are now serving your notice period. Your last working day is ${resignation.lastWorkingDay.toLocaleDateString()}.\n\nRegards,\nHR Portal`,
          html: `<p>Dear <strong>${resignation.employeeName}</strong>,</p><p>Your resignation request has been approved.</p><p><strong>Status:</strong> Notice Period Started<br/><strong>Last Working Day:</strong> ${resignation.lastWorkingDay.toLocaleDateString()}</p><p>Regards,<br/>HR Portal</p>`
        });

        // Auto-generate Experience Letter and Relieving Letter and email them to the employee with PDFs
        try {
          const employee = await Employee.findOne({ companyId, email: resignation.employeeEmail });
          const branding = await CompanyBranding.findOne({ companyId });
          const companyName = branding?.companyName || 'HR Core Labs';
          const primaryColor = branding?.primaryColor || '#2563eb';
          const companyLogo = branding?.companyLogo || '';
          
          const joinedDate = employee?.joinedDate || new Date();
          const exitDate = resignation.lastWorkingDay || new Date();
          const designation = employee?.designation || 'Software Engineer';
          
          // Experience Letter HTML
          const expLetterContent = `
            <div style="font-family: 'Outfit', 'Inter', sans-serif; max-width: 800px; margin: 40px auto; padding: 40px; border: 2px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); background: white; color: #1e293b; position: relative;">
              <!-- Watermark / Background Styling -->
              <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; opacity: 0.02; background: radial-gradient(circle, ${primaryColor} 10%, transparent 80%); pointer-events: none;"></div>
              
              <div style="text-align: center; border-bottom: 2px solid ${primaryColor}; padding-bottom: 20px; margin-bottom: 30px;">
                ${companyLogo ? `<img src="${companyLogo}" alt="${companyName}" style="max-height: 50px; object-fit: contain; margin-bottom: 8px;" />` : ''}
                <h1 style="margin: 0; font-size: 28px; color: ${primaryColor}; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;">${companyName}</h1>
                <p style="margin: 5px 0 0; font-size: 14px; color: #64748b;">Enterprise Human Resource Management Systems</p>
              </div>

              <div style="text-align: center; margin-bottom: 40px;">
                <h2 style="margin: 0; font-size: 22px; color: #1e293b; font-weight: 700; border-bottom: 1px solid #e2e8f0; display: inline-block; padding-bottom: 5px;">TO WHOMSOEVER IT MAY CONCERN</h2>
              </div>

              <p style="font-size: 15px; line-height: 1.8; text-align: justify; margin-bottom: 24px;">
                This is to certify that <strong>${resignation.employeeName}</strong> was employed with us as a <strong>${designation}</strong> from <strong>${joinedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong> to <strong>${exitDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>.
              </p>

              <p style="font-size: 15px; line-height: 1.8; text-align: justify; margin-bottom: 24px;">
                During their tenure with us, they demonstrated exceptional professionalism, dedication, and technical competence. They have contributed significantly to key projects within the engineering department. Their conduct was exemplary, and we found them to be reliable, hardworking, and honest.
              </p>

              <p style="font-size: 15px; line-height: 1.8; text-align: justify; margin-bottom: 40px;">
                We thank <strong>${resignation.employeeName}</strong> for their service and wish them the absolute best in their future professional endeavors.
              </p>

              <div style="margin-top: 60px; display: flex; justify-content: space-between; align-items: flex-end;">
                <div>
                  <p style="margin: 0; font-size: 13px; color: #64748b;">Date: ${new Date().toLocaleDateString()}</p>
                  <p style="margin: 2px 0 0; font-size: 13px; color: #64748b;">Location: Mumbai, India</p>
                </div>
                <div style="text-align: center;">
                  <div style="width: 150px; border-bottom: 1px solid #94a3b8; margin-bottom: 5px;"></div>
                  <p style="margin: 0; font-size: 14px; font-weight: 700; color: #1e293b;">Authorized Signatory</p>
                  <p style="margin: 2px 0 0; font-size: 12px; color: #64748b;">HR Operations Team</p>
                </div>
              </div>
            </div>
          `;

          let expLetter = await ExperienceLetter.findOne({ resignationId: id, companyId });
          if (!expLetter) {
            await ExperienceLetter.create({
              companyId,
              resignationId: id,
              employeeEmail: resignation.employeeEmail,
              employeeName: resignation.employeeName,
              joinedDate,
              exitDate,
              designation,
              pdfUrl: `/api/resignations/${id}/experience-letter`,
              letterContent: expLetterContent
            });
          }

          // Generate Experience Letter PDF
          const expPdfBuffer = await generateExperienceLetterPdf(resignation, employee, branding);

          await sendEmail({
            to: resignation.employeeEmail,
            subject: `Experience Certificate - ${companyName}`,
            text: `Dear ${resignation.employeeName},\n\nYour resignation request has been approved. Please find below and attached your Experience Certificate from ${companyName}.\n\nRegards,\nHR Operations`,
            html: expLetterContent,
            attachments: [
              {
                filename: `${resignation.employeeName.replace(/\s+/g, '_')}_Experience_Certificate.pdf`,
                content: expPdfBuffer
              }
            ]
          });

          // Relieving Letter HTML
          const relColor = branding?.primaryColor || '#10b981';
          const relLetterContent = `
            <div style="font-family: 'Outfit', 'Inter', sans-serif; max-width: 800px; margin: 40px auto; padding: 40px; border: 2px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); background: white; color: #1e293b; position: relative;">
              <div style="text-align: center; border-bottom: 2px solid ${relColor}; padding-bottom: 20px; margin-bottom: 30px;">
                ${companyLogo ? `<img src="${companyLogo}" alt="${companyName}" style="max-height: 50px; object-fit: contain; margin-bottom: 8px;" />` : ''}
                <h1 style="margin: 0; font-size: 28px; color: ${relColor}; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;">${companyName}</h1>
                <p style="margin: 5px 0 0; font-size: 14px; color: #64748b;">Enterprise Human Resource Management Systems</p>
              </div>

              <div style="text-align: center; margin-bottom: 40px;">
                <h2 style="margin: 0; font-size: 22px; color: #1e293b; font-weight: 700; border-bottom: 1px solid #e2e8f0; display: inline-block; padding-bottom: 5px;">RELIEVING LETTER</h2>
              </div>

              <p style="font-size: 15px; line-height: 1.8; text-align: justify; margin-bottom: 24px;">
                Dear <strong>${resignation.employeeName}</strong>,
              </p>

              <p style="font-size: 15px; line-height: 1.8; text-align: justify; margin-bottom: 24px;">
                We reference your resignation request dated <strong>${new Date(resignation.createdAt).toLocaleDateString()}</strong> from the services of the Company. We wish to inform you that your resignation has been accepted and you are officially relieved from the services of the Company at the close of working hours on <strong>${exitDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>.
              </p>

              <p style="font-size: 15px; line-height: 1.8; text-align: justify; margin-bottom: 24px;">
                We confirm that your Full & Final Settlement has been successfully calculated and processed. All company credentials, assets, and documentation checklists have been verified and cleared by the HR and Finance departments.
              </p>

              <p style="font-size: 15px; line-height: 1.8; text-align: justify; margin-bottom: 40px;">
                We appreciate the contributions made by you during your period of association with us and wish you the very best in all your future endeavors.
              </p>

              <div style="margin-top: 60px; display: flex; justify-content: space-between; align-items: flex-end;">
                <div>
                  <p style="margin: 0; font-size: 13px; color: #64748b;">Date: ${new Date().toLocaleDateString()}</p>
                  <p style="margin: 2px 0 0; font-size: 13px; color: #64748b;">Location: Mumbai, India</p>
                </div>
                <div style="text-align: center;">
                  <div style="width: 150px; border-bottom: 1px solid #94a3b8; margin-bottom: 5px;"></div>
                  <p style="margin: 0; font-size: 14px; font-weight: 700; color: #1e293b;">Authorized Signatory</p>
                  <p style="margin: 2px 0 0; font-size: 12px; color: #64748b;">HR Operations Team</p>
                </div>
              </div>
            </div>
          `;

          let relLetter = await RelievingLetter.findOne({ resignationId: id, companyId });
          if (!relLetter) {
            await RelievingLetter.create({
              companyId,
              resignationId: id,
              employeeEmail: resignation.employeeEmail,
              employeeName: resignation.employeeName,
              joinedDate,
              exitDate,
              designation,
              pdfUrl: `/api/resignations/${id}/relieving-letter`,
              letterContent: relLetterContent
            });
          }

          // Generate Relieving Letter PDF
          const relPdfBuffer = await generateRelievingLetterPdf(resignation, employee, branding);

          await sendEmail({
            to: resignation.employeeEmail,
            subject: `Relieving Letter & Exit Confirmation - ${companyName}`,
            text: `Dear ${resignation.employeeName},\n\nYour resignation request has been approved. Please find below and attached your Relieving Letter from ${companyName}.\n\nRegards,\nHR Operations`,
            html: relLetterContent,
            attachments: [
              {
                filename: `${resignation.employeeName.replace(/\s+/g, '_')}_Relieving_Letter.pdf`,
                content: relPdfBuffer
              }
            ]
          });
        } catch (autoErr) {
          console.error('Failed to auto-generate letters on approval:', autoErr);
        }

        // Trigger Notice Period Status
        resignation.status = 'Notice Period';
        resignation.noticeStartDate = new Date();

        await SystemNotificationService.createNotification({
          companyId,
          userId: resignation.employeeEmail,
          title: 'Resignation Request Approved',
          content: `Your resignation is approved. Notice period started. LWD: ${resignation.lastWorkingDay.toLocaleDateString()}`,
          type: 'other',
          targetPage: 'offboarding'
        });
      } else if (newStatus === 'Rejected') {
        await sendEmail({
          to: resignation.employeeEmail,
          subject: 'Resignation Request Rejected',
          text: `Dear ${resignation.employeeName},\n\nYour resignation request has been rejected. Please connect with HR for clarification.\n\nRegards,\nHR Portal`,
          html: `<p>Dear <strong>${resignation.employeeName}</strong>,</p><p>Your resignation request has been rejected.</p><p>Please connect with HR/Management for clarification.</p><p>Regards,<br/>HR Portal</p>`
        });

        await SystemNotificationService.createNotification({
          companyId,
          userId: resignation.employeeEmail,
          title: 'Resignation Request Rejected',
          content: `Your resignation request was rejected. Please contact HR.`,
          type: 'other',
          targetPage: 'offboarding'
        });
      } else if (newStatus === 'Archived' || newStatus === 'Completed') {
        // ARCHIVE SYSTEM HOOK: Auto lock account
        resignation.archivedAt = new Date();

        // 1. Disable User login & Remove active access
        await User.updateMany(
          { companyId, email: resignation.employeeEmail },
          { $set: { isActive: false, status: 'Resigned' } }
        );

        // 2. Lock Employee Attendance, Payroll, Leaves & status to Archived
        await Employee.updateMany(
          { companyId, email: resignation.employeeEmail },
          { $set: { isActive: false, status: 'Archived', resignedAt: new Date() } }
        );

        // 3. Create Archived Snapshot
        const empSnapshot = await Employee.findOne({ companyId, email: resignation.employeeEmail });
        if (empSnapshot) {
          await ArchivedEmployee.create({
            companyId,
            employeeEmail: resignation.employeeEmail,
            fullName: resignation.employeeName,
            archivedAt: new Date(),
            employeeData: empSnapshot.toObject()
          });
        }

        // Notify employee of final closure
        await sendEmail({
          to: resignation.employeeEmail,
          subject: 'Offboarding Process Completed',
          text: `Dear ${resignation.employeeName},\n\nYour offboarding process is completed. Your account is archived, and final settlements are processed.\n\nBest wishes,\nHR Portal`,
          html: `<p>Dear <strong>${resignation.employeeName}</strong>,</p><p>Your offboarding and F&F settlement processes have been successfully completed.</p><p>Your company login and access have been disabled. We wish you the very best in your future endeavors!</p><p>Best regards,<br/>HR Portal</p>`
        });

        // Auto-generate and email both Experience Letter and Relieving Letter on completion/archiving with PDFs
        try {
          const employee = await Employee.findOne({ companyId, email: resignation.employeeEmail });
          const branding = await CompanyBranding.findOne({ companyId });
          const companyName = branding?.companyName || 'HR Core Labs';
          const primaryColor = branding?.primaryColor || '#2563eb';
          const companyLogo = branding?.companyLogo || '';
          
          const joinedDate = employee?.joinedDate || new Date();
          const exitDate = resignation.lastWorkingDay || new Date();
          const designation = employee?.designation || 'Software Engineer';
          
          // Experience Letter HTML
          const expLetterContent = `
            <div style="font-family: 'Outfit', 'Inter', sans-serif; max-width: 800px; margin: 40px auto; padding: 40px; border: 2px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); background: white; color: #1e293b; position: relative;">
              <!-- Watermark / Background Styling -->
              <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; opacity: 0.02; background: radial-gradient(circle, ${primaryColor} 10%, transparent 80%); pointer-events: none;"></div>
              
              <div style="text-align: center; border-bottom: 2px solid ${primaryColor}; padding-bottom: 20px; margin-bottom: 30px;">
                ${companyLogo ? `<img src="${companyLogo}" alt="${companyName}" style="max-height: 50px; object-fit: contain; margin-bottom: 8px;" />` : ''}
                <h1 style="margin: 0; font-size: 28px; color: ${primaryColor}; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;">${companyName}</h1>
                <p style="margin: 5px 0 0; font-size: 14px; color: #64748b;">Enterprise Human Resource Management Systems</p>
              </div>

              <div style="text-align: center; margin-bottom: 40px;">
                <h2 style="margin: 0; font-size: 22px; color: #1e293b; font-weight: 700; border-bottom: 1px solid #e2e8f0; display: inline-block; padding-bottom: 5px;">TO WHOMSOEVER IT MAY CONCERN</h2>
              </div>

              <p style="font-size: 15px; line-height: 1.8; text-align: justify; margin-bottom: 24px;">
                This is to certify that <strong>${resignation.employeeName}</strong> was employed with us as a <strong>${designation}</strong> from <strong>${joinedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong> to <strong>${exitDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>.
              </p>

              <p style="font-size: 15px; line-height: 1.8; text-align: justify; margin-bottom: 24px;">
                During their tenure with us, they demonstrated exceptional professionalism, dedication, and technical competence. They have contributed significantly to key projects within the engineering department. Their conduct was exemplary, and we found them to be reliable, hardworking, and honest.
              </p>

              <p style="font-size: 15px; line-height: 1.8; text-align: justify; margin-bottom: 40px;">
                We thank <strong>${resignation.employeeName}</strong> for their service and wish them the absolute best in their future professional endeavors.
              </p>

              <div style="margin-top: 60px; display: flex; justify-content: space-between; align-items: flex-end;">
                <div>
                  <p style="margin: 0; font-size: 13px; color: #64748b;">Date: ${new Date().toLocaleDateString()}</p>
                  <p style="margin: 2px 0 0; font-size: 13px; color: #64748b;">Location: Mumbai, India</p>
                </div>
                <div style="text-align: center;">
                  <div style="width: 150px; border-bottom: 1px solid #94a3b8; margin-bottom: 5px;"></div>
                  <p style="margin: 0; font-size: 14px; font-weight: 700; color: #1e293b;">Authorized Signatory</p>
                  <p style="margin: 2px 0 0; font-size: 12px; color: #64748b;">HR Operations Team</p>
                </div>
              </div>
            </div>
          `;

          let expLetter = await ExperienceLetter.findOne({ resignationId: id, companyId });
          if (!expLetter) {
            await ExperienceLetter.create({
              companyId,
              resignationId: id,
              employeeEmail: resignation.employeeEmail,
              employeeName: resignation.employeeName,
              joinedDate,
              exitDate,
              designation,
              pdfUrl: `/api/resignations/${id}/experience-letter`,
              letterContent: expLetterContent
            });
          } else {
            expLetter.joinedDate = joinedDate;
            expLetter.exitDate = exitDate;
            expLetter.designation = designation;
            expLetter.letterContent = expLetterContent;
            await expLetter.save();
          }

          // Generate Experience Letter PDF
          const expPdfBuffer = await generateExperienceLetterPdf(resignation, employee, branding);

          await sendEmail({
            to: resignation.employeeEmail,
            subject: `Experience Certificate - ${companyName}`,
            text: `Dear ${resignation.employeeName},\n\nYour offboarding process is completed. Please find below and attached your Experience Certificate from ${companyName}.\n\nRegards,\nHR Operations`,
            html: expLetterContent,
            attachments: [
              {
                filename: `${resignation.employeeName.replace(/\s+/g, '_')}_Experience_Certificate.pdf`,
                content: expPdfBuffer
              }
            ]
          });

          // Relieving Letter HTML
          const relColor = branding?.primaryColor || '#10b981';
          const relLetterContent = `
            <div style="font-family: 'Outfit', 'Inter', sans-serif; max-width: 800px; margin: 40px auto; padding: 40px; border: 2px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); background: white; color: #1e293b; position: relative;">
              <div style="text-align: center; border-bottom: 2px solid ${relColor}; padding-bottom: 20px; margin-bottom: 30px;">
                ${companyLogo ? `<img src="${companyLogo}" alt="${companyName}" style="max-height: 50px; object-fit: contain; margin-bottom: 8px;" />` : ''}
                <h1 style="margin: 0; font-size: 28px; color: ${relColor}; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;">${companyName}</h1>
                <p style="margin: 5px 0 0; font-size: 14px; color: #64748b;">Enterprise Human Resource Management Systems</p>
              </div>

              <div style="text-align: center; margin-bottom: 40px;">
                <h2 style="margin: 0; font-size: 22px; color: #1e293b; font-weight: 700; border-bottom: 1px solid #e2e8f0; display: inline-block; padding-bottom: 5px;">RELIEVING LETTER</h2>
              </div>

              <p style="font-size: 15px; line-height: 1.8; text-align: justify; margin-bottom: 24px;">
                Dear <strong>${resignation.employeeName}</strong>,
              </p>

              <p style="font-size: 15px; line-height: 1.8; text-align: justify; margin-bottom: 24px;">
                We reference your resignation request dated <strong>${new Date(resignation.createdAt).toLocaleDateString()}</strong> from the services of the Company. We wish to inform you that your resignation has been accepted and you are officially relieved from the services of the Company at the close of working hours on <strong>${exitDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>.
              </p>

              <p style="font-size: 15px; line-height: 1.8; text-align: justify; margin-bottom: 24px;">
                We confirm that your Full & Final Settlement has been successfully calculated and processed. All company credentials, assets, and documentation checklists have been verified and cleared by the HR and Finance departments.
              </p>

              <p style="font-size: 15px; line-height: 1.8; text-align: justify; margin-bottom: 40px;">
                We appreciate the contributions made by you during your period of association with us and wish you the very best in all your future endeavors.
              </p>

              <div style="margin-top: 60px; display: flex; justify-content: space-between; align-items: flex-end;">
                <div>
                  <p style="margin: 0; font-size: 13px; color: #64748b;">Date: ${new Date().toLocaleDateString()}</p>
                  <p style="margin: 2px 0 0; font-size: 13px; color: #64748b;">Location: Mumbai, India</p>
                </div>
                <div style="text-align: center;">
                  <div style="width: 150px; border-bottom: 1px solid #94a3b8; margin-bottom: 5px;"></div>
                  <p style="margin: 0; font-size: 14px; font-weight: 700; color: #1e293b;">Authorized Signatory</p>
                  <p style="margin: 2px 0 0; font-size: 12px; color: #64748b;">HR Operations Team</p>
                </div>
              </div>
            </div>
          `;

          let relLetter = await RelievingLetter.findOne({ resignationId: id, companyId });
          if (!relLetter) {
            await RelievingLetter.create({
              companyId,
              resignationId: id,
              employeeEmail: resignation.employeeEmail,
              employeeName: resignation.employeeName,
              joinedDate,
              exitDate,
              designation,
              pdfUrl: `/api/resignations/${id}/relieving-letter`,
              letterContent: relLetterContent
            });
          } else {
            relLetter.joinedDate = joinedDate;
            relLetter.exitDate = exitDate;
            relLetter.designation = designation;
            relLetter.letterContent = relLetterContent;
            await relLetter.save();
          }

          // Generate Relieving Letter PDF
          const relPdfBuffer = await generateRelievingLetterPdf(resignation, employee, branding);

          await sendEmail({
            to: resignation.employeeEmail,
            subject: `Relieving Letter & Exit Confirmation - ${companyName}`,
            text: `Dear ${resignation.employeeName},\n\nYour offboarding process is completed. Please find below and attached your Relieving Letter from ${companyName}.\n\nRegards,\nHR Operations`,
            html: relLetterContent,
            attachments: [
              {
                filename: `${resignation.employeeName.replace(/\s+/g, '_')}_Relieving_Letter.pdf`,
                content: relPdfBuffer
              }
            ]
          });
        } catch (autoErr) {
          console.error('Failed to auto-generate letters on completion:', autoErr);
        }

        // Audit log
        await AuditLog.create({
          companyId,
          action: 'Employee Archived',
          performedBy: userEmail,
          details: `Employee ${resignation.employeeEmail} has been archived. Access deactivated.`,
          ipAddress: '127.0.0.1'
        });
      }
    }

    // 2. Handle Checklist updates
    if (body.exitChecklist) {
      if (userRole === 'Employee') {
        return NextResponse.json({ error: 'Employees cannot modify exit clearance items.' }, { status: 403 });
      }

      const inputChecklist = body.exitChecklist;
      const isAdminOnlyFieldsUpdated = 
        inputChecklist.payrollClearance !== undefined || 
        inputChecklist.payrollClosed !== undefined || 
        inputChecklist.financeClearance !== undefined || 
        inputChecklist.settlementCompleted !== undefined || 
        inputChecklist.finalSettlementCompleted !== undefined;

      if (isAdminOnlyFieldsUpdated && userRole !== 'Admin' && userRole !== 'Company Admin') {
        return NextResponse.json({ error: 'Only Administrators can approve payroll and financial clearance items.' }, { status: 403 });
      }

      // Update nested checklist values on resignation
      for (const [key, value] of Object.entries(inputChecklist)) {
        if (resignation.exitChecklist[key] !== undefined) {
          resignation.exitChecklist[key] = !!value;
        }
      }

      // Sync or create ExitChecklist document
      let dbChecklist = await ExitChecklist.findOne({ resignationId: id, companyId });
      if (!dbChecklist) {
        dbChecklist = new ExitChecklist({
          companyId,
          resignationId: id,
          employeeEmail: resignation.employeeEmail
        });
      }

      for (const [key, value] of Object.entries(inputChecklist)) {
        if (dbChecklist[key] !== undefined) {
          dbChecklist[key] = !!value;
        }
      }
      dbChecklist.updatedBy = userEmail;
      await dbChecklist.save();

      resignation.history.push({
        action: 'Checklist Updated',
        performedBy: userEmail,
        performedByRole: userRole,
        details: 'Checklist status items synchronized.'
      });
    }

    // 3. Handle Full & Final (F&F) Settlement details
    if (body.settlementDetails) {
      if (userRole === 'Employee') {
        return NextResponse.json({ error: 'Employees cannot configure settlement details.' }, { status: 403 });
      }

      const details = body.settlementDetails;
      const pendingSalary = Number(details.pendingSalary) || 0;
      const leaveEncashment = Number(details.leaveEncashment) || 0;
      const bonus = Number(details.bonus) || 0;
      const incentives = Number(details.incentives) || 0;
      const expenseClaims = Number(details.expenseClaims) || 0;
      const reimbursements = Number(details.reimbursements) || 0;
      const deductions = Number(details.deductions) || 0;
      const loans = Number(details.loans) || 0;
      const advanceRecovery = Number(details.advanceRecovery) || 0;

      const totalAdditions = pendingSalary + leaveEncashment + bonus + incentives + expenseClaims + reimbursements;
      const totalDeductions = deductions + loans + advanceRecovery;
      const netAmount = totalAdditions - totalDeductions;

      // Update or create Settlement record
      let dbSettlement = await Settlement.findOne({ resignationId: id, companyId });
      if (!dbSettlement) {
        dbSettlement = new Settlement({
          companyId,
          resignationId: id,
          employeeEmail: resignation.employeeEmail,
          status: 'HR Review'
        });
      }

      dbSettlement.pendingSalary = pendingSalary;
      dbSettlement.leaveEncashment = leaveEncashment;
      dbSettlement.bonus = bonus;
      dbSettlement.incentives = incentives;
      dbSettlement.expenseClaims = expenseClaims;
      dbSettlement.reimbursements = reimbursements;
      dbSettlement.deductions = deductions;
      dbSettlement.loans = loans;
      dbSettlement.advanceRecovery = advanceRecovery;
      dbSettlement.totalSettlementAmount = netAmount;

      if (details.status) {
        // Enforce Admin guard on final settlement completion
        if (details.status === 'Completed' && userRole !== 'Admin' && userRole !== 'Company Admin') {
          return NextResponse.json({ error: 'Only Admin can mark settlement as Completed.' }, { status: 403 });
        }
        dbSettlement.status = details.status;
        if (details.status === 'Completed') {
          dbSettlement.approvedBy = userEmail;
          dbSettlement.approvedAt = new Date();
          resignation.exitChecklist.settlementCompleted = true;
          resignation.exitChecklist.finalSettlementCompleted = true;
        }
      }

      await dbSettlement.save();
      resignation.fullAndFinalSettlementAmount = netAmount;

      resignation.history.push({
        action: 'Settlement Updated',
        performedBy: userEmail,
        performedByRole: userRole,
        details: `F&F settlement details saved. Net Amount: ${netAmount}`
      });

      // Write Audit Log
      await AuditLog.create({
        companyId,
        action: 'Settlement Saved',
        performedBy: userEmail,
        details: `Settlement calculated for ${resignation.employeeEmail}. Net Payout: INR ${netAmount}`,
        ipAddress: '127.0.0.1'
      });
    }

    // 4. Handle Exit Interview details
    if (body.exitInterviewDetails) {
      if (userRole === 'Employee') {
        return NextResponse.json({ error: 'Employees cannot schedule or log exit interview remarks.' }, { status: 403 });
      }

      const interviewData = body.exitInterviewDetails;
      const scheduledAt = interviewData.scheduledAt ? new Date(interviewData.scheduledAt) : new Date();
      const feedback = interviewData.feedback || '';
      const exitReason = interviewData.exitReason || '';
      const suggestions = interviewData.suggestions || '';
      const rehireEligibility = interviewData.rehireEligibility !== undefined ? !!interviewData.rehireEligibility : true;

      // Update or create ExitInterview record
      let dbInterview = await ExitInterview.findOne({ resignationId: id, companyId });
      if (!dbInterview) {
        dbInterview = new ExitInterview({
          companyId,
          resignationId: id,
          employeeEmail: resignation.employeeEmail,
          employeeName: resignation.employeeName,
          scheduledAt
        });
      }

      dbInterview.scheduledAt = scheduledAt;
      dbInterview.feedback = feedback;
      dbInterview.exitReason = exitReason;
      dbInterview.suggestions = suggestions;
      dbInterview.rehireEligibility = rehireEligibility;
      dbInterview.completedBy = userEmail;
      await dbInterview.save();

      resignation.exitInterviewScheduledAt = scheduledAt;
      resignation.exitInterviewFeedback = feedback;

      resignation.history.push({
        action: 'Exit Interview Scheduled/Updated',
        performedBy: userEmail,
        performedByRole: userRole,
        details: `Interview feedback recorded by ${userEmail}`
      });

      // Send email alert for scheduled interview
      if (interviewData.sendScheduleEmail) {
        await sendEmail({
          to: resignation.employeeEmail,
          subject: 'Exit Interview Scheduled',
          text: `Dear ${resignation.employeeName},\n\nAn exit interview has been scheduled for you on ${scheduledAt.toLocaleString()}.\n\nRegards,\nHR Portal`,
          html: `<p>Dear <strong>${resignation.employeeName}</strong>,</p><p>An exit interview has been scheduled for you on <strong>${scheduledAt.toLocaleString()}</strong>.</p><p>Please attend the session to share your feedback.</p><p>Regards,<br/>HR Portal</p>`
        });
      }
    }

    await resignation.save();

    // Fetch refreshed documents
    const checklist = await ExitChecklist.findOne({ resignationId: id, companyId });
    const interview = await ExitInterview.findOne({ resignationId: id, companyId });
    const settlement = await Settlement.findOne({ resignationId: id, companyId });

    return NextResponse.json({
      message: 'Resignation record updated successfully',
      data: {
        resignation,
        checklist,
        interview,
        settlement
      }
    }, { status: 200 });
  } catch (error: any) {
    console.error('Failed to update resignation:', error);
    return NextResponse.json({ error: 'Failed to update resignation', details: error.message }, { status: 500 });
  }
}
