import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Comment } from '@/app/api/models/Comment';
import { verifyAuth } from '@/app/api/lib/auth';

export async function PUT(req: Request, { params }: { params: Promise<{ commentId: string }> }) {
  try {
    const { commentId } = await params;
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { content } = await req.json() as any;
    if (!content) {
      return NextResponse.json({ success: false, error: 'Content is required' }, { status: 400 });
    }

    await connectToDatabase();
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return NextResponse.json({ success: false, error: 'Comment not found' }, { status: 404 });
    }

    if (comment.createdBy.email !== decoded.email) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    comment.content = content;
    await comment.save();

    return NextResponse.json({ success: true, comment }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to update comment', details: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ commentId: string }> }) {
  try {
    const { commentId } = await params;
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return NextResponse.json({ success: false, error: 'Comment not found' }, { status: 404 });
    }

    const isCreator = comment.createdBy.email === decoded.email;
    const isAdmin = decoded.role === 'Admin' || decoded.role === 'HR';
    if (!isCreator && !isAdmin) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    await Comment.findByIdAndDelete(commentId);
    // Also delete any nested replies
    await Comment.deleteMany({ parentId: commentId });

    return NextResponse.json({ success: true, message: 'Comment deleted successfully' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to delete comment', details: error.message }, { status: 500 });
  }
}
