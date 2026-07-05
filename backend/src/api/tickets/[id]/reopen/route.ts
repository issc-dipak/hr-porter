import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Ticket } from '@/app/api/models/Ticket';
import { verifyAuth } from '@/app/api/lib/auth';
import { AuditLog } from '@/app/api/models/AuditLog';

export async function POST(req: Request, context: any) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { companyId, role, email, userId } = decoded;
    const params = await context.params;
    const { id } = params;

    await connectToDatabase();

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    if (ticket.companyId !== companyId) {
      return NextResponse.json({ error: 'Access denied: company mismatch' }, { status: 403 });
    }

    if (role === 'Employee' && ticket.employeeEmail !== email && ticket.employeeId !== userId) {
      return NextResponse.json({ error: 'Access denied: not your ticket' }, { status: 403 });
    }

    ticket.status = 'Reopened';
    await ticket.save();

    // Create Audit Log
    await AuditLog.create({
      companyId,
      action: 'Ticket Reopened',
      performedBy: email,
      details: `Ticket ${ticket.ticketNumber} reopened by ${email}`,
      ipAddress: '127.0.0.1'
    });

    return NextResponse.json(ticket, { status: 200 });
  } catch (error: any) {
    console.error('Failed to reopen ticket:', error);
    return NextResponse.json({ error: 'Failed to reopen ticket', details: error.message }, { status: 500 });
  }
}
