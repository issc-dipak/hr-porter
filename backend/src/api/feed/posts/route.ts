import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Post } from '@/app/api/models/Post';
import { Employee } from '@/app/api/models/Employee';
import { verifyAuth } from '@/app/api/lib/auth';

export async function GET(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const tag = searchParams.get('tag') || '';
    const announcementOnly = searchParams.get('announcements') === 'true';

    await connectToDatabase();

    let query: any = { companyId: decoded.companyId };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { 'createdBy.name': { $regex: search, $options: 'i' } }
      ];
    }

    if (tag) {
      query.tags = tag;
    }

    if (announcementOnly) {
      query.tags = '#announcement';
    }

    // Sort: pinned posts first, then newest
    const posts = await Post.find(query).sort({ pinned: -1, createdAt: -1 });

    return NextResponse.json({ success: true, posts }, { status: 200 });
  } catch (error: any) {
    console.error('Failed to fetch posts:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch posts', details: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { title, content, attachments, tags, pinned } = await req.json() as any;

    if (!content) {
      return NextResponse.json({ success: false, error: 'Content is required' }, { status: 400 });
    }

    await connectToDatabase();

    const employee = await Employee.findOne({ email: decoded.email });

    const postData = {
      companyId: decoded.companyId,
      title,
      content,
      attachments: attachments || [],
      tags: tags || [],
      pinned: pinned || false,
      createdBy: {
        name: employee?.fullName || decoded.email.split('@')[0],
        email: decoded.email,
        role: employee?.designation || decoded.role,
        department: employee?.department || 'Management',
        avatar: employee?.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${decoded.email}`
      },
      reactions: []
    };

    const newPost = await Post.create(postData);

    // Send real-time notification to all active users in the company
    try {
      const { SystemNotificationService } = await import('../../../services/systemNotificationService');
      const authorName = employee?.fullName || decoded.email.split('@')[0];
      const previewText = content.substring(0, 50) + (content.length > 50 ? '...' : '');
      
      await SystemNotificationService.notifyAllUsers(decoded.companyId, {
        companyId: decoded.companyId,
        title: 'New Feed Post',
        content: `${authorName} shared a post: "${title || previewText}"`,
        type: 'other',
        targetPage: 'feed'
      });
    } catch (err) {
      console.error('Failed to trigger feed post notification:', err);
    }

    return NextResponse.json({ success: true, post: newPost }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create post:', error);
    return NextResponse.json({ success: false, error: 'Failed to create post', details: error.message }, { status: 500 });
  }
}

