import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Job } from '@/app/api/models/Job';
import { verifyAuth } from '@/app/api/lib/auth';

// POST /api/jobs/:id/publish
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectToDatabase();

    const job = await Job.findById(id);
    if (!job) {
      return NextResponse.json({ error: 'Job opening not found' }, { status: 404 });
    }

    if (job.companyId !== decoded.companyId) {
      return NextResponse.json({ error: 'Forbidden: You do not own this record' }, { status: 403 });
    }

    // Generate unique slug if not set
    if (!job.publicUrlSlug) {
      const titleSlug = job.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      const hash = Math.random().toString(36).substring(2, 6);
      job.publicUrlSlug = `${titleSlug}-${hash}`;
    }

    job.status = 'Published';
    await job.save();

    return NextResponse.json({
      message: 'Job opening successfully published to careers portal',
      jobId: job._id,
      status: job.status,
      publicUrlSlug: job.publicUrlSlug
    }, { status: 200 });
  } catch (error: any) {
    console.error('Failed to publish job opening:', error);
    return NextResponse.json({ error: 'Failed to publish job opening', details: error.message }, { status: 500 });
  }
}
