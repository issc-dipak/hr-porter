import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Announcement } from '@/app/api/models/Announcement';
import { EventRSVP } from '@/app/api/models/EventRSVP';
import { verifyAuth } from '@/app/api/lib/auth';
import { checkUserPermission } from '@/app/api/lib/rbac';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = decoded.companyId;
    const email = decoded.email.toLowerCase().trim();
    const isPrivileged = decoded.role === 'Admin' || decoded.role === 'Super Admin' || decoded.role === 'Company Admin' || decoded.role === 'HR';
    const { id } = await params;

    await connectToDatabase();
    const announcement = await Announcement.findOne({ _id: id, companyId });
    if (!announcement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
    }

    if (!isPrivileged && announcement.audienceType === 'Specific' && !announcement.targetEmployees?.map(e => e.toLowerCase().trim()).includes(email)) {
      return NextResponse.json({ error: 'Forbidden: You are not targeted for this event' }, { status: 403 });
    }

    return NextResponse.json(announcement, { status: 200 });
  } catch (error: any) {
    console.error('Failed to fetch specific announcement:', error);
    return NextResponse.json({ error: 'Failed to fetch announcement', details: error.message }, { status: 550 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── RBAC: Check announcement.edit permission ──────────────────────────────
    if (decoded.role !== 'Admin' && decoded.role !== 'Super Admin') {
      const hasEdit = await checkUserPermission(
        decoded.companyId,
        decoded.userId,
        decoded.role,
        'announcement.edit'
      );
      if (!hasEdit) {
        return NextResponse.json({ error: 'Forbidden: You do not have permission to edit announcements' }, { status: 403 });
      }
    }

    const companyId = decoded.companyId;
    const { id } = await params;
    const data = (await req.json()) as any;

    await connectToDatabase();
    const announcement = await Announcement.findOne({ _id: id, companyId });
    if (!announcement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
    }

    const updatableFields = [
      'title',
      'content',
      'category',
      'postedBy',
      'eventDate',
      'eventTime',
      'eventLocation',
      'eventType',
      'eventBanner',
      'maxParticipants',
      'rsvpRequired',
      'isCompleted',
      'eventPhotos',
      'eventSummary',
      'audienceType',
      'targetEmployees',
    ];

    for (const field of updatableFields) {
      if (data[field] !== undefined) {
        (announcement as any)[field] = data[field];
      }
    }

    await announcement.save();
    return NextResponse.json(announcement, { status: 200 });
  } catch (error: any) {
    console.error('Failed to update announcement:', error);
    return NextResponse.json({ error: 'Failed to update announcement', details: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── RBAC: Check announcement.delete permission ────────────────────────────
    if (decoded.role !== 'Admin' && decoded.role !== 'Super Admin') {
      const hasDelete = await checkUserPermission(
        decoded.companyId,
        decoded.userId,
        decoded.role,
        'announcement.delete'
      );
      if (!hasDelete) {
        return NextResponse.json({ error: 'Forbidden: You do not have permission to delete announcements' }, { status: 403 });
      }
    }

    const companyId = decoded.companyId;
    const { id } = await params;

    await connectToDatabase();
    const announcement = await Announcement.findOne({ _id: id, companyId });
    if (!announcement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
    }

    await Announcement.deleteOne({ _id: id });
    await EventRSVP.deleteMany({ eventId: id });

    return NextResponse.json({ success: true, message: 'Announcement deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Failed to delete announcement:', error);
    return NextResponse.json({ error: 'Failed to delete announcement', details: error.message }, { status: 500 });
  }
}
