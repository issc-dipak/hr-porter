import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { PerformanceReport } from '@/app/api/models/PerformanceReport';
import { verifyAuth } from '@/app/api/lib/auth';

// GET all logged reports
export async function GET(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    const reports = await PerformanceReport.find({ companyId: decoded.companyId }).sort({ createdAt: -1 });
    return NextResponse.json(reports, { status: 200 });
  } catch (error: any) {
    console.error('Failed to fetch performance reports:', error);
    return NextResponse.json({ error: 'Failed to fetch reports', details: error.message }, { status: 500 });
  }
}

// POST a new generated report log
export async function POST(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const data = await req.json() as any;

    if (!data.scope || !data.format || !data.previewData) {
      return NextResponse.json(
        { error: 'Missing required fields (scope, format, previewData)' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const newReport = await PerformanceReport.create({
      companyId: decoded.companyId,
      scope: data.scope,
      format: data.format,
      generatedBy: data.generatedBy || 'HR Analytics Lead',
      previewData: data.previewData
    });

    return NextResponse.json(
      { message: 'Report logged successfully', report: newReport },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Failed to log performance report:', error);
    return NextResponse.json({ error: 'Failed to log report', details: error.message }, { status: 500 });
  }
}

