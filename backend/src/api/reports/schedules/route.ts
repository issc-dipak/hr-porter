import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { ReportSchedule } from '@/app/api/models/ReportSchedule';
import { verifyAuth } from '@/app/api/lib/auth';

export async function GET(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = decoded.companyId || 'company_001';

    await connectToDatabase();
    
    // Find all schedules for this company and email
    const schedules = await ReportSchedule.find({ companyId });
    return NextResponse.json(schedules, { status: 200 });
  } catch (error: any) {
    console.error('Failed to fetch report schedules:', error);
    return NextResponse.json({ error: 'Failed to fetch report schedules', details: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = decoded.companyId || 'company_001';
    const body = await req.json() as any;

    if (!body.email || !body.reportType || !body.frequency || !body.time) {
      return NextResponse.json({ error: 'Missing required fields (email, reportType, frequency, time)' }, { status: 400 });
    }

    await connectToDatabase();

    const newSchedule = await ReportSchedule.create({
      companyId,
      email: body.email,
      reportType: body.reportType,
      frequency: body.frequency,
      time: body.time
    });

    return NextResponse.json(newSchedule, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create report schedule:', error);
    return NextResponse.json({ error: 'Failed to create report schedule', details: error.message }, { status: 500 });
  }
}
