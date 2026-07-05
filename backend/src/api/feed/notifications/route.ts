import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { FeedNotification } from '@/app/api/models/FeedNotification';
import { verifyAuth } from '@/app/api/lib/auth';

export async function GET(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const notifications = await FeedNotification.find({ recipient: decoded.email })
      .sort({ createdAt: -1 })
      .limit(50);

    return NextResponse.json({ success: true, notifications }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to fetch notifications', details: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    // Mark all notifications for the recipient as read
    await FeedNotification.updateMany({ recipient: decoded.email, read: false }, { $set: { read: true } });

    return NextResponse.json({ success: true, message: 'All notifications marked as read' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to update notifications', details: error.message }, { status: 500 });
  }
}

