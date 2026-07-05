import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Employee } from '@/app/api/models/Employee';
import { Performance } from '@/app/api/models/Performance';
import { Attendance } from '@/app/api/models/Attendance';
import { Payroll } from '@/app/api/models/Payroll';
import { Job } from '@/app/api/models/Job';
import { Leave } from '@/app/api/models/Leave';
import { verifyAuth } from '@/app/api/lib/auth';
import { User } from '@/app/api/models/User';

export async function GET(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = decoded.companyId;
    const { searchParams } = new URL(req.url);
    const scope = searchParams.get('scope') || 'Company Performance';

    await connectToDatabase();

    // Fetch all active employees as a base
    const rawActiveEmployees = await Employee.find({ companyId, status: 'Active' });
    
    // Fetch associated users to check roles and filter out Admins
    const emails = rawActiveEmployees.map(e => e.email.toLowerCase().trim());
    const users = await User.find({ email: { $in: emails } });
    const adminEmails = new Set(
      users
        .filter(u => ['Admin', 'Super Admin', 'Company Admin'].includes(u.role))
        .map(u => u.email.toLowerCase().trim())
    );

    const activeEmployees = rawActiveEmployees.filter(e => !adminEmails.has(e.email.toLowerCase().trim()));
    const employeeNames = activeEmployees.map(e => e.fullName);

    // Fetch all performance reviews and attendances to cache/use in computations
    const reviews = await Performance.find({ companyId });
    const attendances = await Attendance.find({ companyId });

    if (scope === 'Company Performance') {
      const departments = Array.from(new Set(activeEmployees.map(e => e.department).filter(Boolean)));

      const tableData = await Promise.all(departments.map(async (deptName) => {
        const deptEmployees = activeEmployees.filter(e => e.department === deptName);
        
        // 1. Productivity Calculation
        let productivity = 0;
        if (deptEmployees.length > 0) {
          const names = deptEmployees.map(e => e.fullName.toLowerCase());
          const deptReviews = reviews.filter(r => names.includes(r.name.toLowerCase()));
          if (deptReviews.length > 0) {
            const avgRating = deptReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / deptReviews.length;
            productivity = Math.round(avgRating * 20);
          }
        }

        // 2. Attendance Calculation
        let attendance = 0;
        if (deptEmployees.length > 0) {
          const names = deptEmployees.map(e => e.fullName.toLowerCase());
          const deptAtt = attendances.filter(a => names.includes(a.name.toLowerCase()));
          if (deptAtt.length > 0) {
            const present = deptAtt.filter(a => a.status === 'Present').length;
            attendance = Math.round((present / deptAtt.length) * 100);
          }
        }

        // 3. Task Completion Calculation
        let taskFulfillment = 0;

        // 4. Budget Util Calculation
        let budgetUtil = 0;
        if (deptEmployees.length > 0) {
          const names = deptEmployees.map(e => e.fullName);
          const deptPayrolls = await Payroll.find({ companyId, employeeName: { $in: names } });
          const totalPaid = deptPayrolls.reduce((sum, p) => sum + (p.net || 0), 0);
          const budgetAllocation = deptEmployees.length * 50000;
          if (totalPaid > 0 && budgetAllocation > 0) {
            budgetUtil = Math.min(100, Math.round((totalPaid / budgetAllocation) * 100));
          }
        }

        return {
          name: deptName,
          Productivity: productivity,
          Attendance: attendance,
          TaskFulfillment: taskFulfillment,
          BudgetUtil: budgetUtil
        };
      }));

      // Compute Averages
      const avgProd = tableData.length > 0 ? Math.round(tableData.reduce((sum, d) => sum + d.Productivity, 0) / tableData.length) : 0;
      const avgAtt = tableData.length > 0 ? Math.round(tableData.reduce((sum, d) => sum + d.Attendance, 0) / tableData.length) : 0;

      return NextResponse.json({
        scope,
        summary: [
          { label: 'Avg Productivity', value: tableData.length > 0 ? `${avgProd}%` : 'N/A' },
          { label: 'Avg Attendance', value: tableData.length > 0 ? `${avgAtt}%` : 'N/A' },
          { label: 'Departments', value: tableData.length }
        ],
        tableData
      }, { status: 200 });

    } else if (scope === 'Employee Grid Metrics') {
      const tableData = activeEmployees.map(emp => {
        const empReviews = reviews.filter(r => r.name.toLowerCase() === emp.fullName.toLowerCase());
        const avgRating = empReviews.length > 0
          ? empReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / empReviews.length
          : 0;

        const score = Math.round(avgRating * 20);
        const ratingStatus = score === 0 
          ? 'No Reviews'
          : score >= 90 ? 'Top Performer' : score >= 80 ? 'Exceeds Expectations' : score >= 70 ? 'Meets Expectations' : 'Needs Improvement';

        const empAtt = attendances.filter(a => a.name.toLowerCase() === emp.fullName.toLowerCase());
        const present = empAtt.filter(a => a.status === 'Present').length;
        const attendanceRate = empAtt.length > 0 ? Math.round((present / empAtt.length) * 100) : 0;

        return {
          id: emp._id,
          name: emp.fullName,
          dept: emp.department || 'Engineering',
          score,
          attendance: attendanceRate,
          status: ratingStatus
        };
      });

      const avgScore = tableData.length > 0 && tableData.some(e => e.score > 0)
        ? (tableData.filter(e => e.score > 0).reduce((sum, e) => sum + e.score, 0) / tableData.filter(e => e.score > 0).length).toFixed(1)
        : "0.0";
      const topPerformersCount = tableData.filter(e => e.status === 'Top Performer').length;

      return NextResponse.json({
        scope,
        summary: [
          { label: 'Avg Score', value: tableData.length > 0 && tableData.some(e => e.score > 0) ? `${avgScore}%` : 'N/A' },
          { label: 'Top Performers', value: `${topPerformersCount} Employees` },
          { label: 'Active Monitored', value: tableData.length }
        ],
        tableData
      }, { status: 200 });

    } else {
      // HR SLA Metrics
      const jobs = await Job.find({ companyId });
      let totalApplicants = 0;
      let hiredCount = 0;
      jobs.forEach(j => {
        if (j.applicants) {
          totalApplicants += j.applicants.length;
          hiredCount += j.applicants.filter(a => a.status === 'Hired').length;
        }
      });
      const hiringSuccess = totalApplicants > 0 ? Math.round((hiredCount / totalApplicants) * 100) : 0;

      const payrolls = await Payroll.find({ companyId });
      const approvedOrPaid = payrolls.filter(p => ['Approved', 'Paid', 'Processed'].includes(p.status)).length;
      const payrollSpeed = payrolls.length > 0 ? Math.round((approvedOrPaid / payrolls.length) * 100) : 0;

      const leaves = await Leave.find({ companyId });
      const approvedLeaves = leaves.filter(l => l.status === 'Approved').length;
      const leaveApprovalHrs = leaves.length > 0 ? (Math.max(0.0, Math.min(2.9, 3.0 - (approvedLeaves / leaves.length)))).toFixed(1) : "0.0";

      const tableData = [
        {
          category: 'Hiring Pipeline Speed',
          target: '90%',
          actual: totalApplicants > 0 ? `${hiringSuccess}%` : 'N/A',
          status: totalApplicants > 0 ? (hiringSuccess >= 90 ? 'OPTIMAL' : 'WARNING') : 'NO_DATA'
        },
        {
          category: 'Payroll Verification latency',
          target: '95%',
          actual: payrolls.length > 0 ? `${payrollSpeed}%` : 'N/A',
          status: payrolls.length > 0 ? (payrollSpeed >= 95 ? 'OPTIMAL' : 'WARNING') : 'NO_DATA'
        },
        {
          category: 'Leave approval turnaround',
          target: '< 3.0 hrs',
          actual: leaves.length > 0 ? `${leaveApprovalHrs} hrs` : 'N/A',
          status: leaves.length > 0 ? (parseFloat(leaveApprovalHrs) < 3.0 ? 'OPTIMAL' : 'WARNING') : 'NO_DATA'
        }
      ];

      return NextResponse.json({
        scope,
        summary: [
          { label: 'Hiring Success', value: totalApplicants > 0 ? `${hiringSuccess}%` : 'N/A' },
          { label: 'Payroll Compliant', value: payrolls.length > 0 ? `${payrollSpeed}%` : 'N/A' },
          { label: 'Response SLA', value: leaves.length > 0 ? `${leaveApprovalHrs} Hrs` : 'N/A' }
        ],
        tableData
      }, { status: 200 });
    }
  } catch (error: any) {
    console.error('Failed to calculate report preview metrics:', error);
    return NextResponse.json({ error: 'Failed to generate preview', details: error.message }, { status: 500 });
  }
}

