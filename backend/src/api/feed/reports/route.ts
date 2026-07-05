import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Report } from '@/app/api/models/Report';
import { verifyAuth } from '@/app/api/lib/auth';

export async function GET(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded || (decoded.role !== 'Admin' && decoded.role !== 'HR')) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    await connectToDatabase();
    // Return all pending reports sorted by newest first
    const reports = await Report.find({ status: 'pending' }).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, reports }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to fetch reports', details: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { contentType, contentId, reason } = await req.json() as any;
    if (!contentType || !contentId || !reason) {
      return NextResponse.json({ success: false, error: 'Missing required parameters' }, { status: 400 });
    }

    await connectToDatabase();
    const newReport = await Report.create({
      contentType,
      contentId,
      reason,
      reportedBy: decoded.email,
      status: 'pending'
    });

    return NextResponse.json({ success: true, report: newReport }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to submit report', details: error.message }, { status: 500 });
  }
}

