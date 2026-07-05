import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { ReportSchedule } from '@/app/api/models/ReportSchedule';
import { verifyAuth } from '@/app/api/lib/auth';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = decoded.companyId || 'company_001';
    const { id } = await params;

    await connectToDatabase();

    const schedule = await ReportSchedule.findById(id);
    if (!schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    if (schedule.companyId !== companyId) {
      return NextResponse.json({ error: 'Forbidden: You do not own this schedule' }, { status: 403 });
    }

    await ReportSchedule.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Schedule deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Failed to delete report schedule:', error);
    return NextResponse.json({ error: 'Failed to delete report schedule', details: error.message }, { status: 500 });
  }
}
