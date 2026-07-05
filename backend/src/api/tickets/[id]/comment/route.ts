import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Ticket } from '@/app/api/models/Ticket';
import { TicketComment } from '@/app/api/models/TicketComment';
import { verifyAuth } from '@/app/api/lib/auth';
import { AuditLog } from '@/app/api/models/AuditLog';

export async function POST(req: Request, context: any) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { companyId, role, email, userId, fullName } = decoded;
    const params = await context.params;
    const { id } = params;

    const body = await req.json() as any;
    const { comment, attachments, isInternal } = body;

    if (!comment) {
      return NextResponse.json({ error: 'Comment text is required' }, { status: 400 });
    }

    await connectToDatabase();

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Security: company alignment
    if (ticket.companyId !== companyId) {
      return NextResponse.json({ error: 'Access denied: company mismatch' }, { status: 403 });
    }

    // Security: employee ownership
    if (role === 'Employee' && ticket.employeeEmail !== email && ticket.employeeId !== userId) {
      return NextResponse.json({ error: 'Access denied: not your ticket' }, { status: 403 });
    }

    // Force isInternal = false for employees
    const commentIsInternal = role === 'Employee' ? false : !!isInternal;

    const newComment = await TicketComment.create({
      companyId,
      ticketId: id,
      userId,
      userName: fullName || email.split('@')[0],
      userRole: role,
      comment,
      attachments: attachments || [],
      isInternal: commentIsInternal,
    });

    // Update ticket's updatedAt timestamp
    ticket.updatedAt = new Date();
    
    // Automatically change status depending on who replied
    if (role === 'Employee') {
      // If employee replies and ticket is in a state waiting for them, mark it back to In Progress
      if (ticket.status === 'Waiting for Employee') {
        ticket.status = 'In Progress';
      }
    } else {
      // If HR/Admin replies (non-internally), set status to "Waiting for Employee"
      if (!commentIsInternal && ticket.status !== 'Resolved' && ticket.status !== 'Closed') {
        ticket.status = 'Waiting for Employee';
      }
    }
    await ticket.save();

    // Trigger system notification
    try {
      const { SystemNotificationService } = await import('../../../../services/systemNotificationService');
      if (role === 'Employee') {
        await SystemNotificationService.notifyRoles(companyId, ['Admin', 'HR'], {
          companyId,
          title: 'Ticket Reply',
          content: `${fullName || email.split('@')[0]} replied to Ticket ${ticket.ticketNumber}: "${comment.substring(0, 60)}"`,
          type: 'ticket',
          targetPage: 'helpdesk'
        });
      } else if (!commentIsInternal) {
        await SystemNotificationService.createNotification({
          companyId,
          userId: ticket.employeeEmail,
          title: 'Support Ticket Reply',
          content: `Support team replied to Ticket ${ticket.ticketNumber}: "${comment.substring(0, 60)}"`,
          type: 'ticket',
          targetPage: 'helpdesk'
        });
      }
    } catch (err) {
      console.error('Failed to trigger ticket comment notification:', err);
    }

    // Create Audit Log
    await AuditLog.create({
      companyId,
      action: commentIsInternal ? 'Internal Note Added' : 'Ticket Comment Added',
      performedBy: email,
      details: `${role} (${email}) added a ${commentIsInternal ? 'internal note' : 'reply'} to ticket ${ticket.ticketNumber}`,
      ipAddress: '127.0.0.1'
    });

    return NextResponse.json(newComment, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create ticket comment:', error);
    return NextResponse.json({ error: 'Failed to create ticket comment', details: error.message }, { status: 500 });
  }
}
