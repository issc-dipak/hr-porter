import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Employee } from '@/app/api/models/Employee';
import { Attendance } from '@/app/api/models/Attendance';
import { Leave } from '@/app/api/models/Leave';
import { Payroll } from '@/app/api/models/Payroll';
import { verifyAuth } from '@/app/api/lib/auth';

export async function GET(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded || (decoded.role !== 'Admin' && decoded.role !== 'HR')) {
      return new Response('Unauthorized', { status: 401 });
    }

    await connectToDatabase();

    const companyId = decoded.companyId || 'company_001';
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'workforce';
    let branchId = searchParams.get('branchId');
    if (decoded.role === 'HR' && decoded.branchId) {
      branchId = decoded.branchId;
    }

    const filter: any = { companyId };
    if (branchId) {
      filter.branchId = branchId;
    }

    let tsvContent = '';
    let filename = `report_${type}.xls`;

    if (type === 'payroll') {
      const records = await Payroll.find(filter);
      tsvContent = 'Employee Email\tEmployee Name\tMonth\tBasic Salary\tHRA\tAllowance\tBonus\tOvertime\tDeductions\tNet Salary\tStatus\n';
      records.forEach(p => {
        const deduct = (p.pf || 0) + (p.esi || 0) + (p.tax || 0) + (p.otherDeductions || 0) + (p.leaveDeductions || 0);
        const clean = (v: any) => String(v || '').replace(/[\t\n\r]/g, ' ');
        tsvContent += `${clean(p.employee)}\t${clean(p.employeeName)}\t${clean(p.month)}\t${p.basic}\t${p.hra}\t${p.allowance}\t${p.bonus}\t${p.overtime}\t${deduct}\t${p.net}\t${clean(p.status)}\n`;
      });
      filename = `Payroll_Report_${new Date().toISOString().split('T')[0]}.xls`;
    } 
    
    else if (type === 'attendance') {
      const records = await Attendance.find(filter);
      tsvContent = 'Employee Name\tDate\tCheck In\tCheck Out\tStatus\tDuration\n';
      records.forEach(r => {
        const clean = (v: any) => String(v || '').replace(/[\t\n\r]/g, ' ');
        tsvContent += `${clean(r.name)}\t${clean(r.date)}\t${clean(r.timeIn)}\t${clean(r.timeOut)}\t${clean(r.status)}\t${clean(r.duration)}\n`;
      });
      filename = `Attendance_Report_${new Date().toISOString().split('T')[0]}.xls`;
    } 
    
    else if (type === 'leaves') {
      const records = await Leave.find(filter);
      tsvContent = 'Employee\tDepartment\tType\tDate\tDuration\tReason\tStatus\n';
      records.forEach(l => {
        const clean = (v: any) => String(v || '').replace(/[\t\n\r]/g, ' ');
        tsvContent += `${clean(l.name)}\t${clean(l.dept)}\t${clean(l.type)}\t${clean(l.date)}\t${clean(l.duration)}\t${clean(l.reason)}\t${clean(l.status)}\n`;
      });
      filename = `Leaves_Report_${new Date().toISOString().split('T')[0]}.xls`;
    } 
    
    else {
      // Default: Workforce
      const records = await Employee.find(filter);
      tsvContent = 'Full Name\tDepartment\tDesignation\tEmail\tPhone\tJoined Date\tLocation\tStatus\n';
      records.forEach(e => {
        const clean = (v: any) => String(v || '').replace(/[\t\n\r]/g, ' ');
        tsvContent += `${clean(e.fullName)}\t${clean(e.department)}\t${clean(e.designation)}\t${clean(e.email)}\t${clean(e.phone)}\t${clean(e.joinedDate ? new Date(e.joinedDate).toLocaleDateString() : '')}\t${clean(e.location)}\t${clean(e.status)}\n`;
      });
      filename = `Workforce_Directory_${new Date().toISOString().split('T')[0]}.xls`;
    }

    return new Response(tsvContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.ms-excel',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store'
      }
    });

  } catch (error: any) {
    console.error('Failed to export Excel report:', error);
    return new Response(`Failed to export Excel report: ${error.message}`, { status: 500 });
  }
}

