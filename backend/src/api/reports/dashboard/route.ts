import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Employee } from '@/app/api/models/Employee';
import { Attendance } from '@/app/api/models/Attendance';
import { Leave } from '@/app/api/models/Leave';
import { Payroll } from '@/app/api/models/Payroll';
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

    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthStr = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }); // e.g., "June 2026"

    const employeeFilter: any = { companyId, status: 'Active' };
    const attendanceFilter: any = { 
      companyId, 
      date: todayStr, 
      status: { $in: ['Present', 'On Time', 'Late'] } 
    };
    const newHiresFilter: any = {
      companyId,
      joinedDate: { $gte: startOfMonth }
    };
    const leaveFilter: any = { companyId, status: 'Pending' };
    const payrollFilter: any = { companyId, month: currentMonthStr };
    const jobFilter: any = { companyId, status: 'Active' };

    if (branchId) {
      employeeFilter.branchId = branchId;
      attendanceFilter.branchId = branchId;
      newHiresFilter.branchId = branchId;
      leaveFilter.branchId = branchId;
      payrollFilter.branchId = branchId;
      jobFilter.branchId = branchId;
    }

    // 1. Total Employees (Active)
    const totalEmployees = await Employee.countDocuments(employeeFilter);

    // 2. Present Today
    const presentToday = await Attendance.countDocuments(attendanceFilter);

    // 3. New Hires This Month
    const newHires = await Employee.countDocuments(newHiresFilter);

    // 4. Pending Leave Requests
    const pendingLeaves = await Leave.countDocuments(leaveFilter);

    // 5. Monthly Payroll Cost
    const payrolls = await Payroll.find(payrollFilter);
    const monthlyPayrollCost = payrolls.reduce((sum, p) => sum + (Number(p.net) || 0), 0);

    // 6. Open Job Positions
    const openPositions = await Job.countDocuments(jobFilter);

    return NextResponse.json({
      totalEmployees,
      presentToday,
      newHires,
      pendingLeaves,
      monthlyPayrollCost,
      openPositions
    }, { status: 200 });

  } catch (error: any) {
    console.error('Failed to fetch reports dashboard:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard reports', details: error.message }, { status: 500 });
  }
}

