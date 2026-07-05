import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { verifyAuth } from '@/app/api/lib/auth';
import { Message } from '@/app/api/models/Message';
import { Channel } from '@/app/api/models/Channel';
import { User } from '@/app/api/models/User';
import { File } from '@/app/api/models/File';
import { Announcement } from '@/app/api/models/Announcement';

export async function GET(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = decoded.companyId;

    const url = new URL(req.url);
    const query = url.searchParams.get('q') || '';
    if (!query.trim()) {
      return NextResponse.json({ channels: [], messages: [], employees: [], files: [], announcements: [] }, { status: 200 });
    }

    await connectToDatabase();
    const regex = new RegExp(query, 'i');

    // 1. Search visible channels in company
    const channels = await Channel.find({
      companyId,
      name: regex,
      $or: [
        { isPrivate: false },
        { members: decoded.email }
      ]
    }).limit(10);

    // 2. Search visible messages in company
    const visibleChannels = await Channel.find({
      companyId,
      $or: [
        { isPrivate: false },
        { members: decoded.email }
      ]
    });
    const channelIdsAndNames = [
      ...visibleChannels.map(c => c._id.toString()),
      ...visibleChannels.map(c => c.name)
    ];
    const messages = await Message.find({
      companyId,
      body: regex,
      $or: [
        { toEmail: decoded.email },
        { fromEmail: decoded.email },
        { toEmail: 'all' },
        { type: 'channel', channelId: { $in: channelIdsAndNames } }
      ]
    }).limit(20);

    // 3. Search employees in company
    const employees = await User.find({
      companyId,
      $or: [
        { fullName: regex },
        { email: regex },
        { department: regex }
      ]
    }).limit(10);

    // 4. Search files in company
    const files = await File.find({
      companyId,
      name: regex
    }).limit(10);

    // 5. Search announcements in company
    const announcements = await Announcement.find({
      companyId,
      $or: [
        { title: regex },
        { content: regex }
      ]
    }).limit(10);

    return NextResponse.json({
      channels,
      messages,
      employees: employees.map(emp => ({
        email: emp.email,
        fullName: emp.fullName,
        department: emp.department || 'Management',
        designation: emp.designation || 'Staff Member',
        profilePicture: emp.profilePicture || ''
      })),
      files,
      announcements
    }, { status: 200 });

  } catch (error: any) {
    console.error('GET /api/search/global error:', error);
    return NextResponse.json({ error: 'Failed to perform search query' }, { status: 500 });
  }
}

