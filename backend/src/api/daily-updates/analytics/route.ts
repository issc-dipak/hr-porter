import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { DailyWorkUpdate } from '@/app/api/models/DailyWorkUpdate';
import { Employee } from '@/app/api/models/Employee';
import { User } from '@/app/api/models/User';
import { verifyAuth } from '@/app/api/lib/auth';

// GET: Fetch analytics metrics for DSR module
export async function GET(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (decoded.role === 'Employee') {
      return NextResponse.json({ error: 'Forbidden. Employees do not have access to analytics.' }, { status: 403 });
    }

    await connectToDatabase();

    // Fetch active employees
    const rawEmployees = await Employee.find({ 
      companyId: decoded.companyId, 
      status: 'Active' 
    });

    // Fetch associated users to check roles and filter out Admins
    const emails = rawEmployees.map(e => e.email.toLowerCase().trim());
    const users = await User.find({ email: { $in: emails } });
    const adminEmails = new Set(
      users
        .filter(u => ['Admin', 'Super Admin', 'Company Admin'].includes(u.role))
        .map(u => u.email.toLowerCase().trim())
    );

    const employees = rawEmployees.filter(e => !adminEmails.has(e.email.toLowerCase().trim()));

    const totalEmployeesCount = employees.length;

    // Today's range (local/UTC day normalization)
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setUTCHours(0, 0, 0, 0);
    const endOfToday = new Date(now);
    endOfToday.setUTCHours(23, 59, 59, 999);

    // Fetch updates submitted today
    const todayUpdates = await DailyWorkUpdate.find({
      companyId: decoded.companyId,
      date: { $gte: startOfToday, $lte: endOfToday }
    });

    const updatedTodayCount = todayUpdates.filter(u => u.status !== 'Draft').length;
    const missingTodayCount = Math.max(0, totalEmployeesCount - updatedTodayCount);

    // Find who is missing
    const updatedEmails = todayUpdates.filter(u => u.status !== 'Draft').map(u => u.employeeEmail.toLowerCase());
    const missingEmployees = employees.filter(emp => !updatedEmails.includes(emp.email.toLowerCase())).map(emp => ({
      name: emp.fullName,
      email: emp.email,
      department: emp.department,
      designation: emp.designation,
      profilePicture: emp.profilePicture || ''
    }));

    // Pending vs Reviewed updates today or historically
    const totalPendingCount = await DailyWorkUpdate.countDocuments({
      companyId: decoded.companyId,
      status: { $in: ['Submitted', 'Pending Review'] }
    });

    const totalReviewedCount = await DailyWorkUpdate.countDocuments({
      companyId: decoded.companyId,
      status: 'Reviewed'
    });

    // Group department counts for today
    const deptStatsMap: Record<string, { total: number; updated: number }> = {};
    employees.forEach(emp => {
      const dept = emp.department || 'General';
      if (!deptStatsMap[dept]) {
        deptStatsMap[dept] = { total: 0, updated: 0 };
      }
      deptStatsMap[dept].total += 1;
    });

    todayUpdates.forEach(upd => {
      if (upd.status !== 'Draft') {
        const dept = upd.department || 'General';
        if (!deptStatsMap[dept]) {
          deptStatsMap[dept] = { total: 0, updated: 0 };
        }
        deptStatsMap[dept].updated += 1;
      }
    });

    const departmentProductivity = Object.entries(deptStatsMap).map(([name, stats]) => {
      const percentage = stats.total > 0 ? Math.round((stats.updated / stats.total) * 100) : 0;
      return {
        department: name,
        updated: stats.updated,
        total: stats.total,
        percentage
      };
    });

    // Weekly activity trend (last 7 days)
    const weeklyActivityTrend = [];
    for (let i = 6; i >= 0; i--) {
      const targetDate = new Date();
      targetDate.setDate(now.getDate() - i);
      const start = new Date(targetDate);
      start.setUTCHours(0, 0, 0, 0);
      const end = new Date(targetDate);
      end.setUTCHours(23, 59, 59, 999);

      const dayCount = await DailyWorkUpdate.countDocuments({
        companyId: decoded.companyId,
        date: { $gte: start, $lte: end },
        status: { $ne: 'Draft' }
      });

      weeklyActivityTrend.push({
        day: targetDate.toLocaleDateString('en-US', { weekday: 'short' }),
        date: targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count: dayCount
      });
    }

    return NextResponse.json({
      updatedToday: updatedTodayCount,
      missingToday: missingTodayCount,
      totalPending: totalPendingCount,
      totalReviewed: totalReviewedCount,
      totalEmployees: totalEmployeesCount,
      missingEmployees,
      departmentProductivity,
      weeklyActivityTrend
    }, { status: 200 });

  } catch (error: any) {
    console.error('Failed to compile DSR analytics:', error);
    return NextResponse.json({ error: 'Failed to compile DSR analytics', details: error.message }, { status: 500 });
  }
}

