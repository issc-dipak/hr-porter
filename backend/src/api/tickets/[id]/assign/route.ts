import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Ticket } from '@/app/api/models/Ticket';
import { verifyAuth } from '@/app/api/lib/auth';
import { AuditLog } from '@/app/api/models/AuditLog';

export async function PUT(req: Request, context: any) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { companyId, role, email } = decoded;
    
    // Restrictions: HR or Admin only
    if (role !== 'HR' && role !== 'Admin') {
      return NextResponse.json({ error: 'Access denied: HR/Admin only' }, { status: 403 });
    }

    const params = await context.params;
    const { id } = params;

    const body = await req.json() as any;
    const { assignedTo, assignedToName } = body;

    await connectToDatabase();

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    if (ticket.companyId !== companyId) {
      return NextResponse.json({ error: 'Access denied: company mismatch' }, { status: 403 });
    }

    ticket.assignedTo = assignedTo || '';
    ticket.assignedToName = assignedToName || '';
    
    if (ticket.status === 'Open' && assignedTo) {
      ticket.status = 'Assigned';
    }

    await ticket.save();

    // Create Audit Log
    await AuditLog.create({
      companyId,
      action: 'Ticket Assigned',
      performedBy: email,
      details: `Ticket ${ticket.ticketNumber} assigned to ${assignedToName || assignedTo || 'Unassigned'} by ${email}`,
      ipAddress: '127.0.0.1'
    });

    return NextResponse.json(ticket, { status: 200 });
  } catch (error: any) {
    console.error('Failed to assign ticket:', error);
    return NextResponse.json({ error: 'Failed to assign ticket', details: error.message }, { status: 500 });
  }
}
