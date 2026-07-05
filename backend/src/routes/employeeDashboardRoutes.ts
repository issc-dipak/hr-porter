import { Router, Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { handleWebRoute } from '../adaptor';
import { NextResponse } from 'next/server';
import { verifyAuth } from '../api/lib/auth';
import connectToDatabase from '../api/lib/mongodb';
import { Employee } from '../models/Employee';
import { Attendance } from '../models/Attendance';
import { Leave } from '../models/Leave';
import { Payroll } from '../models/Payroll';
import { Announcement } from '../models/Announcement';
import { Ticket } from '../models/Ticket';
import { DailyWorkUpdate } from '../models/DailyWorkUpdate';
import { DashboardService } from '../services/DashboardService';

const router = Router();

// GET /api/employee/dashboard
router.get('/employee/dashboard', handleWebRoute(async (req: Request) => {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { companyId, email } = decoded;

    await connectToDatabase();
    const result = await DashboardService.getEmployeeDashboardData(companyId, email);

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status as number });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching dashboard summary:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data', details: error.message }, { status: 500 });
  }
}));

// GET /api/attendance/summary
router.get('/attendance/summary', handleWebRoute(async (req: Request) => {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { companyId, fullName } = decoded;

    await connectToDatabase();
    const attendance = await Attendance.find({ companyId, name: fullName }).sort({ date: -1 }).limit(30);
    return NextResponse.json(attendance, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}));

// GET /api/leave/balance
router.get('/leave/balance', handleWebRoute(async (req: Request) => {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { companyId, fullName } = decoded;

    await connectToDatabase();
    const leaves = await Leave.find({ companyId, name: fullName });
    const approved = leaves.filter(l => l.status === 'Approved');
    
    // Distribute leave types
    const casual = approved.filter(l => l.type?.toLowerCase().includes('casual')).length;
    const sick = approved.filter(l => l.type?.toLowerCase().includes('sick')).length;
    const earned = approved.filter(l => l.type?.toLowerCase().includes('earned') || l.type?.toLowerCase().includes('annual')).length;

    return NextResponse.json({
      casual: { allowed: 8, used: casual, remaining: Math.max(0, 8 - casual) },
      sick: { allowed: 12, used: sick, remaining: Math.max(0, 12 - sick) },
      earned: { allowed: 10, used: earned, remaining: Math.max(0, 10 - earned) }
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}));

// GET /api/payroll/summary
router.get('/payroll/summary', handleWebRoute(async (req: Request) => {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { companyId, email } = decoded;

    await connectToDatabase();
    const payrolls = await Payroll.find({ companyId, employee: email }).sort({ month: -1 });
    return NextResponse.json(payrolls, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}));

// GET /api/events
router.get('/events', handleWebRoute(async (req: Request) => {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { companyId } = decoded;

    await connectToDatabase();
    const allEmployees = await Employee.find({ companyId, status: 'Active' });
    const events = allEmployees.map(emp => {
      if (emp.dateOfBirth) {
        return {
          type: 'Birthday',
          name: emp.fullName,
          date: emp.dateOfBirth,
          avatar: emp.profilePicture || ''
        };
      }
      return null;
    }).filter(Boolean);

    // Mock company holiday list
    events.push({
      type: 'Holiday',
      name: 'Independence Day',
      date: '2026-08-15',
      avatar: ''
    });

    return NextResponse.json(events, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}));

// GET /api/helpdesk
router.get('/helpdesk', handleWebRoute(async (req: Request) => {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { companyId, email } = decoded;

    await connectToDatabase();
    const tickets = await Ticket.find({ companyId, employeeEmail: email }).sort({ createdAt: -1 });
    return NextResponse.json(tickets, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}));

// POST /api/work-updates
router.post('/work-updates', handleWebRoute(async (req: Request) => {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { companyId, email, fullName } = decoded;

    const data = await req.json() as any;
    if (!data.yesterdaysWork || !data.todaysPlan) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await connectToDatabase();
    
    // Find employee info to fill department
    const employee = await Employee.findOne({ companyId, email });
    const department = employee ? employee.department : 'General';

    const newUpdate = await DailyWorkUpdate.create({
      companyId,
      employeeId: employee?._id || decoded.userId,
      employeeEmail: email,
      employeeName: fullName || employee?.fullName || email.split('@')[0],
      department,
      date: new Date(),
      yesterdaysWork: data.yesterdaysWork,
      todaysPlan: data.todaysPlan,
      blockers: data.blockers || '',
      status: data.status || 'Submitted',
      comments: []
    });

    return NextResponse.json({ success: true, update: newUpdate }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}));

// GET /api/work-updates
router.get('/work-updates', handleWebRoute(async (req: Request) => {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { companyId, email, role } = decoded;

    await connectToDatabase();
    
    let query: any = { companyId };
    
    // Security: Employee can only see own. HR and Admin can see all for that company.
    if (role === 'Employee') {
      query.employeeEmail = email;
    }

    const updates = await DailyWorkUpdate.find(query).sort({ date: -1 });
    return NextResponse.json(updates, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}));

export default router;
