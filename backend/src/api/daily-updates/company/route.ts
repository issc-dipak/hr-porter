import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { DailyWorkUpdate } from '@/app/api/models/DailyWorkUpdate';
import { verifyAuth } from '@/app/api/lib/auth';

// GET: Fetch company-wide updates (Admin only)
export async function GET(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (decoded.role !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden. Admins only.' }, { status: 403 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const department = searchParams.get('department');
    const employeeEmail = searchParams.get('employeeEmail');
    const date = searchParams.get('date');
    const search = searchParams.get('search');

    const filter: any = { companyId: decoded.companyId };

    if (department) {
      filter.department = department;
    }
    if (employeeEmail) {
      filter.employeeEmail = employeeEmail.toLowerCase();
    }
    if (date) {
      const d = new Date(date);
      const start = new Date(d);
      start.setUTCHours(0, 0, 0, 0);
      const end = new Date(d);
      end.setUTCHours(23, 59, 59, 999);
      filter.date = { $gte: start, $lte: end };
    }
    if (search) {
      filter.$or = [
        { employeeName: { $regex: search, $options: 'i' } },
        { yesterdaysWork: { $regex: search, $options: 'i' } },
        { todaysPlan: { $regex: search, $options: 'i' } },
        { blockers: { $regex: search, $options: 'i' } }
      ];
    }

    const updates = await DailyWorkUpdate.find(filter).sort({ date: -1, createdAt: -1 });
    return NextResponse.json(updates, { status: 200 });
  } catch (error: any) {
    console.error('Failed to fetch company updates:', error);
    return NextResponse.json({ error: 'Failed to fetch company updates', details: error.message }, { status: 500 });
  }
}

