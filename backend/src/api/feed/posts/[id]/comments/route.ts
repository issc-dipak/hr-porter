import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Comment } from '@/app/api/models/Comment';
import { Post } from '@/app/api/models/Post';
import { Employee } from '@/app/api/models/Employee';
import { FeedNotification } from '@/app/api/models/FeedNotification';
import { verifyAuth } from '@/app/api/lib/auth';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectToDatabase();
    // Return all comments sorted by oldest first
    const comments = await Comment.find({ postId: id }).sort({ createdAt: 1 });
    return NextResponse.json({ success: true, comments }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to fetch comments', details: error.message }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { content, parentId } = await req.json() as any;
    if (!content) {
      return NextResponse.json({ success: false, error: 'Comment content is required' }, { status: 400 });
    }

    await connectToDatabase();

    const post = await Post.findById(id);
    if (!post) {
      return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 });
    }

    const employee = await Employee.findOne({ email: decoded.email });
    const userName = employee?.fullName || decoded.email.split('@')[0];

    const commentData = {
      postId: id,
      parentId: parentId || undefined,
      content,
      createdBy: {
        name: userName,
        email: decoded.email,
        role: employee?.designation || decoded.role,
        department: employee?.department || 'Management',
        avatar: employee?.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${decoded.email}`
      },
      reactions: []
    };

    const newComment = await Comment.create(commentData);

    // Send social notifications
    if (parentId) {
      // Find parent comment to notify its creator
      const parentComment = await Comment.findById(parentId);
      if (parentComment && parentComment.createdBy.email !== decoded.email) {
        await FeedNotification.create({
          recipient: parentComment.createdBy.email,
          sender: {
            name: userName,
            avatar: commentData.createdBy.avatar
          },
          type: 'reply',
          postId: id,
          content: `replied to your comment: "${content.substring(0, 30)}..."`,
          read: false
        });
      }
    } else if (post.createdBy.email !== decoded.email) {
      // Notify post creator of new general comment
      await FeedNotification.create({
        recipient: post.createdBy.email,
        sender: {
          name: userName,
          avatar: commentData.createdBy.avatar
        },
        type: 'comment',
        postId: id,
        content: `commented on your post: "${content.substring(0, 30)}..."`,
        read: false
      });
    }

    return NextResponse.json({ success: true, comment: newComment }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create comment:', error);
    return NextResponse.json({ success: false, error: 'Failed to create comment', details: error.message }, { status: 500 });
  }
}
