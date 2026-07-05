import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Employee } from '@/app/api/models/Employee';
import { Attendance } from '@/app/api/models/Attendance';
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
    const period = searchParams.get('period') || 'Daily'; // Daily, Weekly, Monthly, Yearly
    let branchId = searchParams.get('branchId');
    if (decoded.role === 'HR' && decoded.branchId) {
      branchId = decoded.branchId;
    }

    const employeeFilter: any = { companyId, status: 'Active' };
    if (branchId) {
      employeeFilter.branchId = branchId;
    }
    const employees = await Employee.find(employeeFilter);
    const totalEmployees = employees.length;

    // Date range determination
    const now = new Date();
    let datesToQuery: string[] = [];

    if (period === 'Daily') {
      datesToQuery = [now.toISOString().split('T')[0]];
    } else if (period === 'Weekly') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        datesToQuery.push(d.toISOString().split('T')[0]);
      }
    } else if (period === 'Monthly') {
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        datesToQuery.push(d.toISOString().split('T')[0]);
      }
    } else {
      // Yearly: group or fetch last 12 months (we can simplify to last 12 months as timeline, query last 30 days for daily, or query by dates)
      for (let i = 365; i >= 0; i -= 10) { // query sample dates to represent yearly
        const d = new Date();
        d.setDate(now.getDate() - i);
        datesToQuery.push(d.toISOString().split('T')[0]);
      }
    }

    // Fetch attendance records
    const attendanceFilter: any = {
      companyId,
      date: { $in: datesToQuery }
    };
    if (branchId) {
      attendanceFilter.branchId = branchId;
    }
    const attendanceRecords = await Attendance.find(attendanceFilter);

    // Summary calculation
    const todayStr = now.toISOString().split('T')[0];
    const todayRecords = attendanceRecords.filter(r => r.date === todayStr);

    const presentTodayCount = todayRecords.filter(r => ['Present', 'On Time', 'Late'].includes(r.status)).length;
    const lateTodayCount = todayRecords.filter(r => r.status === 'Late').length;
    const absentTodayCount = Math.max(0, totalEmployees - presentTodayCount);

    // Sum overtime (overtime is calculated from duration or mock, we will mock overtime hours based on attendance duration > 8h)
    let totalOvertimeHours = 0;
    attendanceRecords.forEach(r => {
      if (r.duration) {
        const match = r.duration.match(/(\d+)h\s*(\d+)m/);
        if (match) {
          const hours = parseInt(match[1], 10);
          if (hours > 8) {
            totalOvertimeHours += (hours - 8);
          }
        }
      }
    });

    const attendanceRate = totalEmployees > 0 ? Math.round((presentTodayCount / totalEmployees) * 100) : 0;

    // Department spreads
    const deptStats: Record<string, { total: number; present: number }> = {};
    employees.forEach(emp => {
      const dept = emp.department || 'General';
      if (!deptStats[dept]) {
        deptStats[dept] = { total: 0, present: 0 };
      }
      deptStats[dept].total += 1;
    });

    todayRecords.forEach(rec => {
      // Find employee to get department
      const emp = employees.find(e => e.fullName === rec.name);
      if (emp) {
        const dept = emp.department || 'General';
        if (deptStats[dept] && ['Present', 'On Time', 'Late'].includes(rec.status)) {
          deptStats[dept].present += 1;
        }
      }
    });

    const departmentAttendanceTrends = Object.entries(deptStats).map(([dept, s]) => {
      const percent = s.total > 0 ? Math.round((s.present / s.total) * 100) : 0;
      return { department: dept, percentage: percent, present: s.present, total: s.total };
    });

    // Timeline chart data
    const timeline = datesToQuery.map(dateStr => {
      const dayRecs = attendanceRecords.filter(r => r.date === dateStr);
      const presentCount = dayRecs.filter(r => ['Present', 'On Time', 'Late'].includes(r.status)).length;
      const rate = totalEmployees > 0 ? Math.round((presentCount / totalEmployees) * 100) : 0;
      
      let dayOt = 0;
      dayRecs.forEach(r => {
        const match = (r.duration || '').match(/(\d+)h\s*(\d+)m/);
        if (match) {
          const hours = parseInt(match[1], 10);
          if (hours > 8) dayOt += (hours - 8);
        }
      });

      return {
        date: dateStr,
        label: new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        percentage: rate,
        overtime: dayOt
      };
    });

    return NextResponse.json({
      summary: {
        present: presentTodayCount,
        absent: absentTodayCount,
        late: lateTodayCount,
        overtime: totalOvertimeHours,
        percentage: attendanceRate
      },
      departmentAttendanceTrends,
      timeline
    }, { status: 200 });

  } catch (error: any) {
    console.error('Failed to fetch attendance reports:', error);
    return NextResponse.json({ error: 'Failed to fetch attendance reports', details: error.message }, { status: 500 });
  }
}

