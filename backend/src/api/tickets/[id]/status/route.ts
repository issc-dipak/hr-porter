import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Ticket } from '@/app/api/models/Ticket';
import { verifyAuth } from '@/app/api/lib/auth';
import { AuditLog } from '@/app/api/models/AuditLog';
import { sendEmail } from '../../../../utils/email';
import { buildEmailTemplate, infoTable, infoRow, statusPill } from '../../../../utils/emailTemplates';

export async function PUT(req: Request, context: any) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { companyId, role, email, userId } = decoded;
    const params = await context.params;
    const { id } = params;

    const body = await req.json() as any;
    const { status, rating, feedback, escalated, escalatedReason } = body;

    await connectToDatabase();

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    if (ticket.companyId !== companyId) {
      return NextResponse.json({ error: 'Access denied: company mismatch' }, { status: 403 });
    }

    // Security check: Employee can only update status of their own tickets
    if (role === 'Employee' && ticket.employeeEmail !== email && ticket.employeeId !== userId) {
      return NextResponse.json({ error: 'Access denied: not your ticket' }, { status: 403 });
    }

    // Role specific modifications
    if (status) {
      // Employees can only mark their own tickets as Resolved or Closed, or reopen
      if (role === 'Employee' && status !== 'Resolved' && status !== 'Closed' && status !== 'Reopened') {
        return NextResponse.json({ error: 'Access denied: Employees can only resolve, close, or reopen tickets.' }, { status: 403 });
      }
      ticket.status = status;
    }

    if (rating !== undefined) {
      // Only Employee who raised the ticket can rate it
      if (role !== 'Employee') {
        return NextResponse.json({ error: 'Access denied: Only the ticket creator can rate the resolution' }, { status: 403 });
      }
      ticket.rating = rating;
    }

    if (feedback !== undefined) {
      if (role !== 'Employee') {
        return NextResponse.json({ error: 'Access denied: Only the ticket creator can provide feedback' }, { status: 403 });
      }
      ticket.feedback = feedback;
    }

    if (escalated !== undefined) {
      // Escalation is for HR / Admin only
      if (role !== 'HR' && role !== 'Admin') {
        return NextResponse.json({ error: 'Access denied: HR/Admin only escalation' }, { status: 403 });
      }
      ticket.escalated = escalated;
      if (escalatedReason !== undefined) {
        ticket.escalatedReason = escalatedReason;
      }
      if (escalated) {
        // Automatically set priority to urgent/high when escalated
        ticket.priority = 'Urgent';
      }
    }

    await ticket.save();

    // Trigger system notification if updated by Admin/HR
    if (role !== 'Employee' && status) {
      try {
        const { SystemNotificationService } = await import('../../../../services/systemNotificationService');
        await SystemNotificationService.createNotification({
          companyId,
          userId: ticket.employeeEmail,
          title: 'Ticket Status Updated',
          content: `Your Support Ticket ${ticket.ticketNumber} status has been updated to "${status}".`,
          type: 'ticket',
          targetPage: 'helpdesk'
        });
      } catch (err) {
        console.error('Failed to trigger ticket status update notification:', err);
      }

      // P1 Email: Send email on Resolved or Closed
      if ((status === 'Resolved' || status === 'Closed') && ticket.employeeEmail) {
        try {
          const pillColor = status === 'Resolved' ? 'green' : 'blue';
          const emailBody = `
            <p style="margin:0 0 16px; font-size:15px; color:#0f172a;">
              Great news! Your support ticket has been ${statusPill(status, pillColor)}.
            </p>
            ${infoTable(
              infoRow('Ticket Number', `<strong>${ticket.ticketNumber}</strong>`) +
              infoRow('Subject', ticket.subject) +
              infoRow('Category', ticket.category || 'General') +
              infoRow('Resolved By', decoded.fullName || 'HR Team')
            )}
            <p style="margin:16px 0 0; font-size:13px; color:#64748b;">
              If the issue is still ongoing, you can reopen the ticket from your helpdesk dashboard.
              We’d also love your feedback — please rate your experience by clicking the button below.
            </p>
          `;

          const emailHtml = buildEmailTemplate({
            title: `✅ Ticket ${ticket.ticketNumber} ${status}`,
            preheader: `Your ticket "${ticket.subject}" has been ${status.toLowerCase()}`,
            body: emailBody,
            ctaText: 'Rate Your Experience',
            ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`,
            footerNote: 'If this issue reoccurs, please open a new ticket or reopen this one from the helpdesk.'
          });

          await sendEmail({
            to: ticket.employeeEmail,
            subject: `Your ticket ${ticket.ticketNumber} has been ${status}`,
            text: `Your support ticket "${ticket.subject}" (${ticket.ticketNumber}) has been marked as ${status} by our HR team.`,
            html: emailHtml
          });
        } catch (emailErr) {
          console.error('Failed to send ticket resolution email:', emailErr);
        }
      }
    }

    // Create Audit Log
    let logAction = 'Ticket Updated';
    let logDetails = `Ticket ${ticket.ticketNumber} updated by ${email}.`;
    if (status) {
      logAction = status === 'Resolved' ? 'Ticket Closing' : 'Ticket Updated'; 
      if (status === 'Resolved') logAction = 'Ticket Resolved';
      if (status === 'Closed') logAction = 'Ticket Closed';
      if (status === 'Reopened') logAction = 'Ticket Reopened';
      logDetails = `Ticket ${ticket.ticketNumber} status changed to "${status}" by ${email}`;
    } else if (escalated) {
      logAction = 'Ticket Escalated';
      logDetails = `Ticket ${ticket.ticketNumber} escalated by ${email}. Reason: "${escalatedReason || 'none'}"`;
    } else if (rating !== undefined) {
      logAction = 'Ticket Rated';
      logDetails = `Ticket ${ticket.ticketNumber} rated ${rating}/5 stars by employee ${email}`;
    }

    await AuditLog.create({
      companyId,
      action: logAction,
      performedBy: email,
      details: logDetails,
      ipAddress: '127.0.0.1'
    });

    return NextResponse.json(ticket, { status: 200 });
  } catch (error: any) {
    console.error('Failed to update ticket status:', error);
    return NextResponse.json({ error: 'Failed to update ticket status', details: error.message }, { status: 500 });
  }
}
