import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { SystemNotification } from '../../models/SystemNotification';
import { verifyAuth } from '@/app/api/lib/auth';

// GET: Fetch unread system notifications for authenticated user
export async function GET(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = decoded.companyId;
    const userEmail = decoded.email.toLowerCase().trim();

    await connectToDatabase();

    const notifications = await SystemNotification.find({
      companyId,
      userId: userEmail,
      read: false
    }).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: notifications }, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/system-notifications error:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

// PUT: Mark notifications as read
export async function PUT(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = decoded.companyId;
    const userEmail = decoded.email.toLowerCase().trim();

    const body = await req.json() as any;
    const { notificationId, all = false } = body;

    await connectToDatabase();

    let query: any = {
      companyId,
      userId: userEmail,
      read: false
    };

    if (!all && notificationId) {
      query._id = notificationId;
    }

    await SystemNotification.updateMany(query, { $set: { read: true } });

    return NextResponse.json({ success: true, message: 'Notifications marked as read' }, { status: 200 });
  } catch (error: any) {
    console.error('PUT /api/system-notifications error:', error);
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}
