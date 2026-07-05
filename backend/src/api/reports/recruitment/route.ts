import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Job } from '@/app/api/models/Job';
import { verifyAuth } from '@/app/api/lib/auth';

export async function GET(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded || (decoded.role !== 'Admin' && decoded.role !== 'HR')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const companyId = decoded.companyId || 'company_001';
    const { searchParams } = new URL(req.url);
    let branchId = searchParams.get('branchId');
    if (decoded.role === 'HR' && decoded.branchId) {
      branchId = decoded.branchId;
    }

    const filter: any = { companyId };
    if (branchId) {
      filter.branchId = branchId;
    }
    const jobs = await Job.find(filter);

    let openPositions = 0;
    let applicationsReceived = 0;
    let candidatesInterviewed = 0;
    const funnel = {
      Applied: 0,
      Screening: 0,
      Interviewed: 0,
      Shortlisted: 0,
      Selected: 0
    };

    const positionStats: Array<{ title: string; dept: string; applicants: number; status: string }> = [];

    jobs.forEach(j => {
      if (j.status === 'Active') {
        openPositions++;
      }
      
      const appList = j.applicants ? (branchId ? j.applicants.filter(app => app.branchId === branchId) : j.applicants) : [];
      const appCount = appList.length;
      applicationsReceived += appCount;

      positionStats.push({
        title: j.title,
        dept: j.dept,
        applicants: appCount,
        status: j.status
      });

      appList.forEach(app => {
        const status = app.status || 'Applied';
        
        // Funnel aggregation
        funnel.Applied++;
        if (['Screening', 'Shortlisted', 'Interview', 'Technical Round', 'HR Round', 'Offer Sent', 'Hired'].includes(status)) {
          funnel.Screening++;
        }
        if (['Interview', 'Technical Round', 'HR Round', 'Offer Sent', 'Hired'].includes(status)) {
          funnel.Interviewed++;
          candidatesInterviewed++;
        }
        if (['Shortlisted', 'Offer Sent', 'Hired'].includes(status)) {
          funnel.Shortlisted++;
        }
        if (['Offer Sent', 'Hired'].includes(status)) {
          funnel.Selected++;
        }
      });
    });

    const funnelData = Object.entries(funnel).map(([stage, count]) => ({
      stage,
      count
    }));

    return NextResponse.json({
      summary: {
        openPositions,
        applicationsReceived,
        candidatesInterviewed,
        candidatesSelected: funnel.Selected
      },
      funnel: funnelData,
      positions: positionStats.slice(0, 10) // Limit to top 10 positions
    }, { status: 200 });

  } catch (error: any) {
    console.error('Failed to fetch recruitment reports:', error);
    return NextResponse.json({ error: 'Failed to fetch recruitment reports', details: error.message }, { status: 500 });
  }
}

