import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Announcement } from '@/app/api/models/Announcement';
import { EventRSVP } from '@/app/api/models/EventRSVP';
import { verifyAuth } from '@/app/api/lib/auth';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = decoded.companyId;
    const { id } = await params;
    const email = decoded.email.toLowerCase().trim();

    await connectToDatabase();

    const event = await Announcement.findOne({ _id: id, companyId });
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const rsvps = await EventRSVP.find({ eventId: id, companyId });

    const going = rsvps.filter((r) => r.status === 'Going').length;
    const maybe = rsvps.filter((r) => r.status === 'Maybe').length;
    const notAttending = rsvps.filter((r) => r.status === 'Not Attending').length;

    const userRsvp = rsvps.find((r) => r.employeeEmail.toLowerCase() === email)?.status || null;

    const isPrivileged = decoded.role === 'Admin' || decoded.role === 'Company Admin' || decoded.role === 'HR';

    return NextResponse.json(
      {
        summary: {
          going,
          maybe,
          notAttending,
          total: rsvps.length,
          userRsvp,
        },
        participants: isPrivileged ? rsvps : undefined,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Failed to fetch event RSVPs:', error);
    return NextResponse.json({ error: 'Failed to fetch event RSVPs', details: error.message }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = decoded.companyId;
    const { id } = await params;
    const { status } = (await req.json()) as { status: 'Going' | 'Maybe' | 'Not Attending' };
    const email = decoded.email.toLowerCase().trim();
    const name = decoded.fullName || (decoded as any).name || email.split('@')[0];

    if (!['Going', 'Maybe', 'Not Attending'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status. Must be Going, Maybe, or Not Attending.' }, { status: 400 });
    }

    await connectToDatabase();

    const event = await Announcement.findOne({ _id: id, companyId });
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    if (event.category !== 'Event') {
      return NextResponse.json({ error: 'Selected announcement is not an Event' }, { status: 400 });
    }

    if (status === 'Going' && event.maxParticipants) {
      const goingCount = await EventRSVP.countDocuments({ eventId: id, status: 'Going' });

      const existing = await EventRSVP.findOne({ eventId: id, employeeEmail: email });
      const alreadyGoing = existing && existing.status === 'Going';

      if (goingCount >= event.maxParticipants && !alreadyGoing) {
        return NextResponse.json({ error: 'Registration failed: Event is fully booked!' }, { status: 400 });
      }
    }

    const rsvp = await EventRSVP.findOneAndUpdate(
      { eventId: id, employeeEmail: email },
      {
        companyId,
        employeeName: name,
        status,
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, data: rsvp }, { status: 200 });
  } catch (error: any) {
    console.error('Failed to submit event RSVP:', error);
    return NextResponse.json({ error: 'Failed to submit RSVP', details: error.message }, { status: 500 });
  }
}
