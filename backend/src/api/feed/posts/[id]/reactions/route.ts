import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Post } from '@/app/api/models/Post';
import { FeedNotification } from '@/app/api/models/FeedNotification';
import { Employee } from '@/app/api/models/Employee';
import { verifyAuth } from '@/app/api/lib/auth';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { emoji } = await req.json() as any;
    if (!emoji) {
      return NextResponse.json({ success: false, error: 'Emoji is required' }, { status: 400 });
    }

    await connectToDatabase();
    const post = await Post.findById(id);
    if (!post) {
      return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 });
    }

    const employee = await Employee.findOne({ email: decoded.email });
    const userName = employee?.fullName || decoded.email.split('@')[0];

    const reactionsCopy = [...(post.reactions || [])];
    const existing = reactionsCopy.find((r: any) => r.emoji === emoji);

    let isAdded = false;

    if (existing) {
      if (existing.users.includes(userName)) {
        // Remove reaction
        existing.users = existing.users.filter((u: string) => u !== userName);
      } else {
        // Add reaction
        existing.users.push(userName);
        isAdded = true;
      }
    } else {
      reactionsCopy.push({ emoji, users: [userName] });
      isAdded = true;
    }

    post.reactions = reactionsCopy.filter((r: any) => r.users.length > 0);
    await post.save();

    // Trigger notification if reaction was added and it's not the creator's own action
    if (isAdded && post.createdBy.email !== decoded.email) {
      await FeedNotification.create({
        recipient: post.createdBy.email,
        sender: {
          name: userName,
          avatar: employee?.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${decoded.email}`
        },
        type: 'like',
        postId: post._id.toString(),
        content: `reacted ${emoji} to your post: "${post.content.substring(0, 30)}..."`,
        read: false
      });
    }

    return NextResponse.json({ success: true, post }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to update reaction', details: error.message }, { status: 500 });
  }
}
