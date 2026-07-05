import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { ChatNotification } from '@/app/api/models/Notification';
import { verifyAuth } from '@/app/api/lib/auth';

// GET: Fetch all unread chat notifications for the authenticated user
export async function GET(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = decoded.companyId;
    const userEmail = decoded.email.toLowerCase();

    await connectToDatabase();

    const notifications = await ChatNotification.find({
      companyId,
      userId: userEmail,
      read: false
    }).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: notifications }, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/notifications error:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

// PUT: Mark notifications as read (for a specific channel/DM conversation, or all)
export async function PUT(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = decoded.companyId;
    const userEmail = decoded.email.toLowerCase();

    const body = await req.json() as any;
    const { entityId, senderEmail, all = false } = body;

    await connectToDatabase();

    let query: any = {
      companyId,
      userId: userEmail,
      read: false
    };

    if (!all) {
      if (entityId) {
        query.entityId = entityId;
      } else if (senderEmail) {
        query.senderEmail = senderEmail.toLowerCase().trim();
      }
    }

    await ChatNotification.updateMany(query, { $set: { read: true } });

    return NextResponse.json({ success: true, message: 'Notifications marked as read' }, { status: 200 });
  } catch (error: any) {
    console.error('PUT /api/notifications error:', error);
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}
