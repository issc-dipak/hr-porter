import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Ticket } from '@/app/api/models/Ticket';
import { TicketComment } from '@/app/api/models/TicketComment';
import { verifyAuth } from '@/app/api/lib/auth';

export async function GET(req: Request, context: any) {
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

    // Security: company alignment
    if (ticket.companyId !== companyId) {
      return NextResponse.json({ error: 'Access denied: company mismatch' }, { status: 403 });
    }

    // Security: employee ownership
    if (role === 'Employee' && ticket.employeeEmail !== email && ticket.employeeId !== userId) {
      return NextResponse.json({ error: 'Access denied: not your ticket' }, { status: 403 });
    }

    // Fetch comments
    let commentQuery: any = { ticketId: id, companyId };
    if (role === 'Employee') {
      commentQuery.isInternal = { $ne: true }; // Hide internal notes from employee
    }

    const comments = await TicketComment.find(commentQuery).sort({ createdAt: 1 });

    return NextResponse.json({ ticket, comments }, { status: 200 });
  } catch (error: any) {
    console.error('Failed to fetch ticket details:', error);
    return NextResponse.json({ error: 'Failed to fetch ticket details', details: error.message }, { status: 500 });
  }
}
