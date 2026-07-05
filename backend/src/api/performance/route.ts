import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Performance } from '@/app/api/models/Performance';
import { verifyAuth } from '@/app/api/lib/auth';

// GET all performance reviews
export async function GET(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    const reviews = await Performance.find({ companyId: decoded.companyId }).sort({ createdAt: -1 });
    return NextResponse.json(reviews, { status: 200 });
  } catch (error: any) {
    console.error('Failed to fetch performance reviews:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews', details: error.message }, { status: 500 });
  }
}

// POST a new performance review
export async function POST(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const data = await req.json() as any;

    if (!data.name || !data.dept || data.rating === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields (name, dept, rating)' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    if (!data.lastReview) {
      const today = new Date();
      data.lastReview = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    const newReview = await Performance.create({
      ...data,
      companyId: decoded.companyId
    });

    return NextResponse.json(
      { message: 'Performance review logged successfully', review: newReview },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Failed to create performance review:', error);
    return NextResponse.json({ error: 'Failed to create review', details: error.message }, { status: 500 });
  }
}

