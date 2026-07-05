import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Ticket } from '@/app/api/models/Ticket';
import { verifyAuth } from '@/app/api/lib/auth';

export async function GET(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { companyId, role } = decoded;
    if (role !== 'HR' && role !== 'Admin') {
      return NextResponse.json({ error: 'Access denied: HR/Admin only' }, { status: 403 });
    }

    await connectToDatabase();

    const tickets = await Ticket.find({ companyId }).sort({ createdAt: -1 });

    const reportsData = tickets.map(t => {
      const created = new Date(t.createdAt);
      const updated = new Date(t.updatedAt);
      const isResolved = ['Resolved', 'Closed'].includes(t.status);
      const resolutionTimeHours = isResolved 
        ? Math.round((updated.getTime() - created.getTime()) / (1000 * 60 * 60) * 10) / 10
        : null;

      return {
        ticketNumber: t.ticketNumber,
        subject: t.subject,
        employeeName: t.employeeName,
        employeeEmail: t.employeeEmail,
        department: t.department,
        category: t.category,
        priority: t.priority,
        status: t.status,
        assignedTo: t.assignedToName || t.assignedTo || 'Unassigned',
        escalated: t.escalated ? 'Yes' : 'No',
        createdDate: created.toLocaleDateString('en-US'),
        resolvedDate: isResolved ? updated.toLocaleDateString('en-US') : 'Pending',
        resolutionTimeHours: resolutionTimeHours !== null ? `${resolutionTimeHours} hrs` : '-',
        rating: t.rating || 'No rating',
        feedback: t.feedback || 'No feedback'
      };
    });

    return NextResponse.json(reportsData, { status: 200 });
  } catch (error: any) {
    console.error('Failed to generate ticket reports:', error);
    return NextResponse.json({ error: 'Failed to generate ticket reports', details: error.message }, { status: 500 });
  }
}
