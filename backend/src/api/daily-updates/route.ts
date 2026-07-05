import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { DailyWorkUpdate } from '@/app/api/models/DailyWorkUpdate';
import { Employee } from '@/app/api/models/Employee';
import { verifyAuth } from '@/app/api/lib/auth';

// GET: Fetch updates (HR / Admin view with filters)
export async function GET(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (decoded.role === 'Employee') {
      return NextResponse.json({ error: 'Forbidden. Employees should use /daily-updates/my' }, { status: 403 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const department = searchParams.get('department');
    const employeeEmail = searchParams.get('employeeEmail');
    const date = searchParams.get('date');
    const search = searchParams.get('search');

    const filter: any = { companyId: decoded.companyId };

    // HR can view all Employee updates, Admin can view both Employee & HR updates
    if (decoded.role === 'HR') {
      // Typically HR manages Employees, but we can query all except Admin (or all)
      // To satisfy 'employee ka report hr dekh sake', we filter or fetch all.
      // Let's just fetch all within the company, but we can filter if needed.
    }

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
    console.error('Failed to fetch updates:', error);
    return NextResponse.json({ error: 'Failed to fetch updates', details: error.message }, { status: 500 });
  }
}

// POST: Submit or Save Draft daily update
export async function POST(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json() as any;
    if (!data.date || !data.yesterdaysWork || !data.todaysPlan) {
      return NextResponse.json({ error: 'Missing required fields (date, yesterdaysWork, todaysPlan)' }, { status: 400 });
    }

    await connectToDatabase();

    // Find detailed employee profile to populate name/department
    const emp = await Employee.findOne({ email: decoded.email.toLowerCase() });
    const department = emp?.department || 'General';
    const employeeId = emp?._id || decoded.userId;
    const employeeName = emp?.fullName || decoded.fullName || decoded.email.split('@')[0];

    const dateVal = new Date(data.date);
    const startOfDay = new Date(dateVal);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(dateVal);
    endOfDay.setUTCHours(23, 59, 59, 999);

    // Check if an update already exists for this employee on this date
    let updateDoc = await DailyWorkUpdate.findOne({
      employeeEmail: decoded.email.toLowerCase(),
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    const statusValue = data.status || 'Draft';

    if (updateDoc) {
      // If it exists and status is already Submitted or reviewed, restrict overwriting unless saving another update
      if (updateDoc.status !== 'Draft' && statusValue === 'Draft') {
        return NextResponse.json({ error: 'Update has already been submitted for this day.' }, { status: 400 });
      }

      // Update the existing document
      updateDoc.yesterdaysWork = data.yesterdaysWork;
      updateDoc.todaysPlan = data.todaysPlan;
      updateDoc.blockers = data.blockers || '';
      updateDoc.status = statusValue;
      await updateDoc.save();

      if (statusValue === 'Submitted') {
        try {
          const { SystemNotificationService } = await import('../../services/systemNotificationService');
          await SystemNotificationService.notifyRoles(decoded.companyId, ['Admin', 'HR'], {
            companyId: decoded.companyId,
            title: 'DSR Submitted',
            content: `${employeeName} has submitted a Daily Work Update for ${new Date(data.date).toLocaleDateString()}`,
            type: 'daily-update',
            targetPage: 'daily-updates'
          });
        } catch (notifErr) {
          console.error('Failed to trigger daily-update submission notification:', notifErr);
        }
      }

      return NextResponse.json({ message: 'Update saved successfully', update: updateDoc }, { status: 200 });
    } else {
      // Create new update
      updateDoc = await DailyWorkUpdate.create({
        companyId: decoded.companyId,
        employeeId,
        employeeEmail: decoded.email.toLowerCase(),
        employeeName,
        department,
        date: startOfDay,
        yesterdaysWork: data.yesterdaysWork,
        todaysPlan: data.todaysPlan,
        blockers: data.blockers || '',
        status: statusValue
      });

      if (statusValue === 'Submitted') {
        try {
          const { SystemNotificationService } = await import('../../services/systemNotificationService');
          await SystemNotificationService.notifyRoles(decoded.companyId, ['Admin', 'HR'], {
            companyId: decoded.companyId,
            title: 'DSR Submitted',
            content: `${employeeName} has submitted a Daily Work Update for ${new Date(data.date).toLocaleDateString()}`,
            type: 'daily-update',
            targetPage: 'daily-updates'
          });
        } catch (notifErr) {
          console.error('Failed to trigger daily-update submission notification:', notifErr);
        }
      }

      return NextResponse.json({ message: 'Update created successfully', update: updateDoc }, { status: 201 });
    }
  } catch (error: any) {
    console.error('Failed to save daily update:', error);
    return NextResponse.json({ error: 'Failed to save daily update', details: error.message }, { status: 500 });
  }
}

