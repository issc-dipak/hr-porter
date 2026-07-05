import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Channel } from '@/app/api/models/Channel';
import { verifyAuth } from '@/app/api/lib/auth';

const DEFAULT_CHANNELS = [
  { name: 'general', description: 'General company-wide discussion', type: 'company', isPrivate: false },
  { name: 'announcements', description: 'Important announcements and notices', type: 'company', isPrivate: false },
  { name: 'hr-helpdesk', description: 'HR queries, support, and discussions', type: 'company', isPrivate: false },
  { name: 'payroll', description: 'Payroll and salary discussion', type: 'company', isPrivate: false },
  { name: 'recruitment', description: 'Hiring updates and vacancy sharing', type: 'company', isPrivate: false },
  { name: 'marketing', description: 'Marketing division discussions', type: 'department', isPrivate: false },
  { name: 'sales', description: 'Sales division discussions', type: 'department', isPrivate: false },
  { name: 'engineering', description: 'Engineering team and dev updates', type: 'department', isPrivate: false }
];

export async function GET(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = decoded.companyId;

    await connectToDatabase();

    // Find all public channels, or private ones where the user is a member, belonging to the same company
    const channels = await Channel.find({
      companyId,
      $or: [
        { isPrivate: false },
        { members: decoded.email }
      ]
    }).sort({ type: 1, name: 1 });

    return NextResponse.json(channels, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/channels error:', error);
    return NextResponse.json({ error: 'Failed to fetch channels' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = decoded.companyId;

    if (!['Admin', 'HR', 'Employee', 'Company Admin', 'Super Admin'].includes(decoded.role)) {
      return NextResponse.json({ error: 'Forbidden: Unauthorized role' }, { status: 403 });
    }

    const body = await req.json() as any;
    const { name, description, type, isPrivate, members = [] } = body;

    if (!name) {
      return NextResponse.json({ error: 'Channel name is required' }, { status: 400 });
    }

    await connectToDatabase();

    const normalizedName = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '');

    // Check for existing channel with this name inside the same company
    const existing = await Channel.findOne({ name: normalizedName, companyId });
    if (existing) {
      return NextResponse.json({ error: 'A channel with this name already exists' }, { status: 400 });
    }

    // Auto-include creator in members list
    const channelMembers = Array.from(new Set([decoded.email, ...members]));

    const newChannel = await Channel.create({
      name: normalizedName,
      description: description || '',
      type: type || 'company',
      isPrivate: !!isPrivate,
      members: channelMembers,
      createdBy: decoded.email,
      companyId,
      companyName: decoded.companyName,
      pinnedMessages: []
    });

    return NextResponse.json({ message: 'Channel created successfully', data: newChannel }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/channels error:', error);
    return NextResponse.json({ error: 'Failed to create channel' }, { status: 500 });
  }
}

