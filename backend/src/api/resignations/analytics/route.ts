import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Resignation } from '../../../models/Resignation';
import { Employee } from '../../../models/Employee';
import { User } from '../../../models/User';
import { verifyAuth } from '@/app/api/lib/auth';

export async function GET(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const companyId = decoded.companyId || 'company_001';

    // 1. Fetch all resignations for the company
    const resignations = await Resignation.find({ companyId });
    const employees = await Employee.find({ companyId });
    const users = await User.find({ companyId });

    // 2. Average Notice Period
    const resignationsWithNotice = resignations.filter(r => r.noticePeriodDays);
    const avgNoticePeriod = resignationsWithNotice.length > 0
      ? Math.round(resignationsWithNotice.reduce((acc, curr) => acc + curr.noticePeriodDays, 0) / resignationsWithNotice.length)
      : 30;

    // 3. Top Exit Reasons (Categories)
    const reasonsMap: Record<string, number> = {};
    resignations.forEach(r => {
      const cat = r.category || 'Other';
      reasonsMap[cat] = (reasonsMap[cat] || 0) + 1;
    });
    const topExitReasons = Object.entries(reasonsMap).map(([name, value]) => ({ name, value }));

    // 4. Monthly Resignations (for Bar/Line charts in current year)
    const monthlyMap: Record<string, number> = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    months.forEach(m => { monthlyMap[m] = 0; });

    const currentYear = new Date().getFullYear();
    resignations.forEach(r => {
      const date = r.noticeStartDate || r.createdAt;
      if (date && new Date(date).getFullYear() === currentYear) {
        const monthIndex = new Date(date).getMonth();
        const monthName = months[monthIndex];
        monthlyMap[monthName] = (monthlyMap[monthName] || 0) + 1;
      }
    });
    const monthlyResignations = Object.entries(monthlyMap).map(([month, count]) => ({ month, count }));

    // 5. Department Attrition
    const deptMap: Record<string, number> = {};
    for (const r of resignations) {
      const emp = employees.find(e => e.email.toLowerCase() === r.employeeEmail.toLowerCase());
      const dept = emp ? emp.department : 'Engineering';
      deptMap[dept] = (deptMap[dept] || 0) + 1;
    }
    const departmentAttrition = Object.entries(deptMap).map(([name, value]) => ({ name, value }));

    // 6. Role Attrition
    const roleMap: Record<string, number> = {};
    for (const r of resignations) {
      const u = users.find(user => user.email.toLowerCase() === r.employeeEmail.toLowerCase());
      const role = u ? u.role : 'Employee';
      roleMap[role] = (roleMap[role] || 0) + 1;
    }
    const roleWiseAttrition = Object.entries(roleMap).map(([name, value]) => ({ name, value }));

    // 7. Retention Calculations
    const totalActiveEmployees = employees.filter(e => e.isActive && e.status === 'Active').length;
    const resignedLastYear = resignations.filter(r => {
      const date = r.archivedAt || r.createdAt;
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      return date && new Date(date) >= oneYearAgo;
    }).length;

    const employeeRetentionRate = totalActiveEmployees + resignedLastYear > 0
      ? Math.round((totalActiveEmployees / (totalActiveEmployees + resignedLastYear)) * 100)
      : 100;

    // HR Retention
    const activeHRs = users.filter(u => u.role === 'HR' && u.isActive).length;
    const resignedHRsLastYear = resignations.filter(r => {
      const u = users.find(usr => usr.email.toLowerCase() === r.employeeEmail.toLowerCase());
      if (!u || u.role !== 'HR') return false;
      const date = r.archivedAt || r.createdAt;
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      return date && new Date(date) >= oneYearAgo;
    }).length;

    const hrRetentionRate = activeHRs + resignedHRsLastYear > 0
      ? Math.round((activeHRs / (activeHRs + resignedHRsLastYear)) * 100)
      : 100;

    // 8. Annual Attrition Trend (past 3 years)
    const annualMap: Record<string, number> = {};
    const years = [currentYear - 2, currentYear - 1, currentYear];
    years.forEach(y => { annualMap[String(y)] = 0; });

    resignations.forEach(r => {
      const date = r.archivedAt || r.createdAt;
      if (date) {
        const year = new Date(date).getFullYear();
        if (annualMap[String(year)] !== undefined) {
          annualMap[String(year)] += 1;
        }
      }
    });
    const annualAttritionTrend = Object.entries(annualMap).map(([year, count]) => ({ year, count }));

    return NextResponse.json({
      data: {
        avgNoticePeriod,
        topExitReasons,
        monthlyResignations,
        departmentAttrition,
        roleWiseAttrition,
        employeeRetentionRate,
        hrRetentionRate,
        annualAttritionTrend
      }
    }, { status: 200 });
  } catch (error: any) {
    console.error('Failed to aggregate resignation analytics:', error);
    return NextResponse.json({ error: 'Failed to aggregate resignation analytics', details: error.message }, { status: 500 });
  }
}
