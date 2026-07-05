import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Application } from '@/app/api/models/Application';
import { verifyAuth } from '@/app/api/lib/auth';

// GET /api/applications (List applications)
export async function GET(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    const url = new URL(req.url);
    const jobId = url.searchParams.get('jobId');

    const query: any = { companyId: decoded.companyId };
    if (jobId) {
      query.jobId = jobId;
    }

    const applications = await Application.find(query).sort({ createdAt: -1 });

    return NextResponse.json(applications, { status: 200 });
  } catch (error: any) {
    console.error('Failed to fetch applications:', error);
    return NextResponse.json({ error: 'Failed to fetch applications', details: error.message }, { status: 500 });
  }
}
