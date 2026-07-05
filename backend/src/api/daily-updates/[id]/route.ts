import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { DailyWorkUpdate } from '@/app/api/models/DailyWorkUpdate';
import { verifyAuth } from '@/app/api/lib/auth';

// GET: Retrieve a single status update by ID
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Missing report ID parameter' }, { status: 400 });
    }

    await connectToDatabase();

    const report = await DailyWorkUpdate.findById(id);
    if (!report) {
      return NextResponse.json({ error: 'Daily status report not found' }, { status: 404 });
    }

    // Authorization check
    if (decoded.role === 'Employee' && report.employeeEmail.toLowerCase() !== decoded.email.toLowerCase()) {
      return NextResponse.json({ error: 'Forbidden. You do not have permission to view this report.' }, { status: 403 });
    }

    return NextResponse.json(report, { status: 200 });
  } catch (error: any) {
    console.error('Failed to retrieve single daily update:', error);
    return NextResponse.json({ error: 'Failed to retrieve daily update', details: error.message }, { status: 500 });
  }
}
