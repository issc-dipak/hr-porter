import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Job } from '@/app/api/models/Job';
import { CompanyBranding } from '@/app/api/models/CompanyBranding';

// GET /api/careers (List all published job openings)
export async function GET(req: Request) {
  try {
    await connectToDatabase();
    
    const url = new URL(req.url);
    const companyId = url.searchParams.get('companyId');

    const query: any = { status: 'Published' };
    if (companyId) {
      query.companyId = companyId;
    }

    const jobs = await Job.find(query).sort({ createdAt: -1 });

    // Fetch unique company brandings for logo/name details
    const companyIds = Array.from(new Set(jobs.map(j => j.companyId)));
    const brandings = await CompanyBranding.find({ companyId: { $in: companyIds } });
    const brandingMap = brandings.reduce((acc: any, b) => {
      acc[b.companyId] = {
        name: b.companyName,
        logo: b.companyLogo
      };
      return acc;
    }, {});

    const mappedJobs = jobs.map(j => ({
      id: j._id,
      title: j.title,
      dept: j.dept,
      location: j.location,
      salary: j.salary,
      type: j.type,
      experienceLevel: j.experienceLevel,
      publicUrlSlug: j.publicUrlSlug,
      companyId: j.companyId,
      companyName: brandingMap[j.companyId]?.name || 'HR Core Labs',
      companyLogo: brandingMap[j.companyId]?.logo || ''
    }));

    return NextResponse.json(mappedJobs, { status: 200 });
  } catch (error: any) {
    console.error('Failed to list public jobs:', error);
    return NextResponse.json({ error: 'Failed to list public jobs', details: error.message }, { status: 500 });
  }
}
