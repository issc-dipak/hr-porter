import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { CallSession } from '@/app/api/models/CallSession';
import { verifyAuth } from '@/app/api/lib/auth';

// GET: List all active calls/huddles in the company
export async function GET(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = decoded.companyId;

    await connectToDatabase();

    const activeCalls = await CallSession.find({
      companyId,
      status: 'active'
    });

    return NextResponse.json(activeCalls, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/meetings error:', error);
    return NextResponse.json({ error: 'Failed to retrieve call sessions' }, { status: 500 });
  }
}

// POST: Join, create, or leave a huddle session
export async function POST(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = decoded.companyId;

    const body = await req.json() as any;
    const { channelId, action } = body; // action: 'join' | 'leave'

    if (!channelId || !action) {
      return NextResponse.json({ error: 'Missing channelId or action' }, { status: 400 });
    }

    await connectToDatabase();

    let session = await CallSession.findOne({
      channelId,
      companyId,
      status: 'active'
    });

    if (action === 'join') {
      if (!session) {
        // Create new active huddle
        session = await CallSession.create({
          channelId,
          hostEmail: decoded.email,
          participants: [decoded.email],
          status: 'active',
          companyId
        });
      } else {
        // Join existing huddle
        if (!session.participants.includes(decoded.email)) {
          session.participants.push(decoded.email);
          await session.save();
        }
      }
    } else if (action === 'leave') {
      if (session) {
        session.participants = session.participants.filter(p => p !== decoded.email);
        if (session.participants.length === 0) {
          session.status = 'completed';
        }
        await session.save();
      }
    }

    return NextResponse.json({ message: `Huddle session updated`, data: session }, { status: 200 });

  } catch (error: any) {
    console.error('POST /api/meetings error:', error);
    return NextResponse.json({ error: 'Failed to update call session' }, { status: 500 });
  }
}

