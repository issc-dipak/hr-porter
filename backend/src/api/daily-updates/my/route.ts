import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { DailyWorkUpdate } from '@/app/api/models/DailyWorkUpdate';
import { verifyAuth } from '@/app/api/lib/auth';

// GET: Fetch current user's daily status updates
export async function GET(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const updates = await DailyWorkUpdate.find({
      companyId: decoded.companyId,
      employeeEmail: decoded.email.toLowerCase()
    }).sort({ date: -1, createdAt: -1 });

    return NextResponse.json(updates, { status: 200 });
  } catch (error: any) {
    console.error('Failed to fetch personal updates:', error);
    return NextResponse.json({ error: 'Failed to fetch personal updates', details: error.message }, { status: 500 });
  }
}

