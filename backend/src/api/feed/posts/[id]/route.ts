import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Post } from '@/app/api/models/Post';
import { verifyAuth } from '@/app/api/lib/auth';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    await connectToDatabase();
    const post = await Post.findById(id);
    if (!post) {
      return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 });
    }
    if (post.companyId !== decoded.companyId) {
      return NextResponse.json({ success: false, error: 'Forbidden: You do not own this record' }, { status: 403 });
    }
    return NextResponse.json({ success: true, post }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to fetch post', details: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { title, content, tags, pinned } = await req.json() as any;

    await connectToDatabase();
    const post = await Post.findById(id);
    if (!post) {
      return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 });
    }

    if (post.companyId !== decoded.companyId) {
      return NextResponse.json({ success: false, error: 'Forbidden: You do not own this record' }, { status: 403 });
    }

    // Only creator or admin can edit
    const isCreator = post.createdBy.email === decoded.email;
    const isAdmin = decoded.role === 'Admin' || decoded.role === 'HR';
    if (!isCreator && !isAdmin) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    const updateFields: any = {};
    if (title !== undefined) updateFields.title = title;
    if (content !== undefined) updateFields.content = content;
    if (tags !== undefined) updateFields.tags = tags;
    if (pinned !== undefined && isAdmin) updateFields.pinned = pinned;

    const updatedPost = await Post.findByIdAndUpdate(id, { $set: updateFields }, { new: true });

    return NextResponse.json({ success: true, post: updatedPost }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to update post', details: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const post = await Post.findById(id);
    if (!post) {
      return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 });
    }

    if (post.companyId !== decoded.companyId) {
      return NextResponse.json({ success: false, error: 'Forbidden: You do not own this record' }, { status: 403 });
    }

    const isCreator = post.createdBy.email === decoded.email;
    const isAdmin = decoded.role === 'Admin' || decoded.role === 'HR';
    if (!isCreator && !isAdmin) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    await Post.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Post deleted successfully' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to delete post', details: error.message }, { status: 500 });
  }
}
