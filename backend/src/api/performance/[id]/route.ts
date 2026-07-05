import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Performance } from '@/app/api/models/Performance';
import { verifyAuth } from '@/app/api/lib/auth';

// PUT to update performance review
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    const data = await req.json() as any;

    await connectToDatabase();

    const review = await Performance.findById(id);
    if (!review) {
      return NextResponse.json({ error: 'Performance review not found' }, { status: 404 });
    }
    if (review.companyId !== decoded.companyId) {
      return NextResponse.json({ error: 'Forbidden: You do not own this record' }, { status: 403 });
    }

    const updatedReview = await Performance.findByIdAndUpdate(id, data, { new: true });

    if (!updatedReview) {
      return NextResponse.json({ error: 'Performance review not found' }, { status: 404 });
    }

    return NextResponse.json(
      { message: 'Performance review updated successfully', review: updatedReview },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Failed to update performance review:', error);
    return NextResponse.json({ error: 'Failed to update review', details: error.message }, { status: 500 });
  }
}

// DELETE a performance review
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;

    await connectToDatabase();

    const review = await Performance.findById(id);
    if (!review) {
      return NextResponse.json({ error: 'Performance review not found' }, { status: 404 });
    }
    if (review.companyId !== decoded.companyId) {
      return NextResponse.json({ error: 'Forbidden: You do not own this record' }, { status: 403 });
    }

    await Performance.findByIdAndDelete(id);
    return NextResponse.json(
      { message: 'Performance review deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Failed to delete performance review:', error);
    return NextResponse.json({ error: 'Failed to delete review', details: error.message }, { status: 500 });
  }
}
