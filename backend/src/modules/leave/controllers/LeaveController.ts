import { NextResponse } from 'next/server';
import { LeaveService } from '../services/LeaveService';
import { verifyAuthToken, createErrorResponse } from '../../../middleware/auth';
import { connectToDatabase } from '../../../database';
import { sendEmail } from '../../../utils/email';
import { buildEmailTemplate, infoTable, infoRow, statusPill } from '../../../utils/emailTemplates';

export class LeaveController {
  static async getLeaves(req: Request) {
    try {
      const decoded = verifyAuthToken(req);
      if (!decoded) {
        return createErrorResponse('Unauthorized', 401);
      }

      await connectToDatabase();
      const { searchParams } = new URL(req.url);
      const branchId = searchParams.get('branchId') || undefined;
      const employeeName = decoded.role === 'Employee' ? decoded.fullName : undefined;
      const result = await LeaveService.getLeaves(decoded.companyId, employeeName, branchId, decoded);
      return NextResponse.json(result.data, { status: result.status });
    } catch (error: any) {
      console.error('LeaveController getLeaves Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch leaves', details: error.message },
        { status: 500 }
      );
    }
  }

  static async createLeave(req: Request) {
    try {
      const decoded = verifyAuthToken(req);
      if (!decoded) {
        return createErrorResponse('Unauthorized', 401);
      }

      await connectToDatabase();
      const body = await req.json() as any;
      const result = await LeaveService.createLeave(body, decoded.companyId);
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: result.status });
      }

      // Send system notification to Admin and HR roles
      try {
        const { SystemNotificationService } = await import('../../../services/systemNotificationService');
        await SystemNotificationService.notifyRoles(decoded.companyId, ['Admin', 'HR'], {
          companyId: decoded.companyId,
          title: 'New Leave Request',
          content: `${decoded.fullName} requested ${body.type} leave for ${body.duration || 'specified days'}`,
          type: 'leave',
          targetPage: 'leaves'
        });
      } catch (err) {
        console.error('Failed to trigger leave submission notification:', err);
      }

      // P1 Email: Notify HR/Admin about the new leave request
      try {
        const { User } = await import('../../../models/User');
        const hrUsers = await User.find({
          companyId: decoded.companyId,
          role: { $in: ['Admin', 'HR'] },
          status: 'Active'
        });

        const emailBody = `
          <p style="margin:0 0 16px; font-size:15px; color:#0f172a;">
            A new leave request has been submitted and requires your review.
          </p>
          ${infoTable(
            infoRow('Employee', decoded.fullName || decoded.email) +
            infoRow('Leave Type', body.type || 'N/A') +
            infoRow('From', body.startDate || body.date || 'N/A') +
            infoRow('To', body.endDate || body.date || 'N/A') +
            infoRow('Duration', `${body.duration || 1} day(s)`) +
            infoRow('Reason', body.reason || '—')
          )}
        `;

        const emailHtml = buildEmailTemplate({
          title: '📅 New Leave Request',
          preheader: `${decoded.fullName} has submitted a leave request requiring approval`,
          body: emailBody,
          ctaText: 'Review Leave Request',
          ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`,
          footerNote: 'Login to the HR dashboard to approve or reject this request.'
        });

        for (const hrUser of hrUsers) {
          await sendEmail({
            to: hrUser.email,
            subject: `Leave Request — ${decoded.fullName} (${body.type || 'Leave'})`,
            text: `${decoded.fullName} has submitted a ${body.type || ''} leave request. Please review it in the HR dashboard.`,
            html: emailHtml
          });
        }
      } catch (emailErr) {
        console.error('Failed to send leave submission email to HR:', emailErr);
      }

      return NextResponse.json(result, { status: result.status });
    } catch (error: any) {
      console.error('LeaveController createLeave Error:', error);
      return NextResponse.json(
        { error: 'Failed to submit leave request', details: error.message },
        { status: 500 }
      );
    }
  }

  static async updateLeaveStatus(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
      const decoded = verifyAuthToken(req);
      if (!decoded) {
        return createErrorResponse('Unauthorized', 401);
      }

      await connectToDatabase();
      const { id } = await params;
      const { status } = await req.json() as any;
      const result = await LeaveService.updateLeaveStatus(id, status, decoded.companyId);
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: result.status });
      }

      // Notify the employee who requested this leave
      try {
        const { SystemNotificationService } = await import('../../../services/systemNotificationService');
        const leave = result.leave;
        if (leave) {
          let recipientEmail = leave.employee; // Fallback
          
          // Try to look up by matching fullName or email in the Employee or User collections
          try {
            const { Employee } = await import('../../../models/Employee');
            const empRecord = await Employee.findOne({ 
              $or: [
                { fullName: leave.name },
                { fullName: leave.employee },
                { email: leave.employee }
              ],
              companyId: decoded.companyId 
            });
            if (empRecord && empRecord.email) {
              recipientEmail = empRecord.email;
            } else {
              const { User } = await import('../../../models/User');
              const userRecord = await User.findOne({ 
                $or: [
                  { fullName: leave.name },
                  { fullName: leave.employee },
                  { email: leave.employee }
                ],
                companyId: decoded.companyId 
              });
              if (userRecord && userRecord.email) {
                recipientEmail = userRecord.email;
              }
            }
          } catch (lookupErr) {
            console.error('Failed to lookup employee email for notification:', lookupErr);
          }

          await SystemNotificationService.createNotification({
            companyId: decoded.companyId,
            userId: recipientEmail,
            title: `Leave Request ${status}`,
            content: `Your leave request for ${leave.type} on ${leave.date} has been ${status.toLowerCase()} by HR.`,
            type: 'leave',
            targetPage: 'leaves'
          });
        }
      } catch (err) {
        console.error('Failed to trigger leave status update notification:', err);
      }

      // P1 Email: Notify employee of their leave outcome
      try {
        const leave = result.leave;
        if (leave) {
          let recipientEmail = leave.employee;
          try {
            const { Employee } = await import('../../../models/Employee');
            const empRecord = await Employee.findOne({
              $or: [{ fullName: leave.name }, { email: leave.employee }],
              companyId: decoded.companyId
            });
            if (empRecord?.email) recipientEmail = empRecord.email;
          } catch (_) {}

          const isApproved = status === 'Approved';
          const isRejected = status === 'Rejected';
          const pillColor = isApproved ? 'green' : isRejected ? 'red' : 'amber';

          const emailBody = `
            <p style="margin:0 0 16px; font-size:15px; color:#0f172a;">
              Your leave request has been reviewed. Status: ${statusPill(status, pillColor)}
            </p>
            ${infoTable(
              infoRow('Leave Type', leave.type || 'N/A') +
              infoRow('Dates', `${leave.startDate || leave.date || 'N/A'}${leave.endDate ? ' → ' + leave.endDate : ''}`) +
              infoRow('Duration', `${leave.duration || 1} day(s)`) +
              infoRow('Reviewed By', decoded.fullName || 'HR Team') +
              (leave.rejectReason || leave.rejectionReason ? infoRow('Reason', leave.rejectReason || leave.rejectionReason) : '')
            )}
            <p style="margin:16px 0 0; font-size:13px; color:#64748b;">
              ${isApproved
                ? 'Your leave has been approved. Please ensure handover is completed before your leave dates.'
                : isRejected
                ? 'Your leave request was rejected. Please contact HR for more information or to discuss alternatives.'
                : 'The status of your leave request has been updated. Please log in to view full details.'
              }
            </p>
          `;

          const emailHtml = buildEmailTemplate({
            title: isApproved ? '✅ Leave Approved' : isRejected ? '❌ Leave Rejected' : `📅 Leave ${status}`,
            preheader: `Your ${leave.type || ''} leave request has been ${status.toLowerCase()}`,
            body: emailBody,
            ctaText: 'View My Leave Details',
            ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`,
          });

          await sendEmail({
            to: recipientEmail,
            subject: `Your leave request has been ${status}`,
            text: `Your ${leave.type || ''} leave request has been ${status.toLowerCase()} by HR.${leave.rejectReason ? ' Reason: ' + leave.rejectReason : ''}`,
            html: emailHtml
          });
        }
      } catch (emailErr) {
        console.error('Failed to send leave status email to employee:', emailErr);
      }

      return NextResponse.json(result, { status: result.status });
    } catch (error: any) {
      console.error('LeaveController updateLeaveStatus Error:', error);
      return NextResponse.json(
        { error: 'Failed to update leave request', details: error.message },
        { status: 500 }
      );
    }
  }
}
