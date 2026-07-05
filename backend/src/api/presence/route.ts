import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { UserPresence } from '@/app/api/models/UserPresence';
import { verifyAuth } from '@/app/api/lib/auth';

// GET: Fetch statuses for all users
export async function GET(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = decoded.companyId;

    await connectToDatabase();

    const presences = await UserPresence.find({ companyId });
    return NextResponse.json(presences, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/presence error:', error);
    return NextResponse.json({ error: 'Failed to fetch presence data' }, { status: 500 });
  }
}

// POST: Update current user's presence status
export async function POST(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = decoded.companyId;

    const body = await req.json() as any;
    const { status, statusText } = body;

    await connectToDatabase();

    // Upsert user's status record
    const updatedPresence = await UserPresence.findOneAndUpdate(
      { email: decoded.email.toLowerCase() },
      {
        companyId,
        status: status || 'online',
        statusText: statusText || '',
        lastSeen: new Date()
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ message: 'Presence updated successfully', data: updatedPresence }, { status: 200 });
  } catch (error: any) {
    console.error('POST /api/presence error:', error);
    return NextResponse.json({ error: 'Failed to update presence status' }, { status: 500 });
  }
}

