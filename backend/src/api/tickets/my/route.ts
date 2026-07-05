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

    const { companyId, email, userId } = decoded;
    await connectToDatabase();

    const tickets = await Ticket.find({
      companyId,
      $or: [{ employeeEmail: email }, { employeeId: userId }]
    }).sort({ createdAt: -1 });

    return NextResponse.json(tickets, { status: 200 });
  } catch (error: any) {
    console.error('Failed to fetch my tickets:', error);
    return NextResponse.json({ error: 'Failed to fetch my tickets', details: error.message }, { status: 500 });
  }
}
