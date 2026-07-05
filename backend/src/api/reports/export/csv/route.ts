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

    let csvContent = '';
    let filename = `report_${type}.csv`;

    if (type === 'payroll') {
      const records = await Payroll.find(filter);
      csvContent = 'Employee Email,Employee Name,Month,Basic Salary,HRA,Allowance,Bonus,Overtime,Deductions (PF+ESI+Tax),Net Salary,Status\n';
      records.forEach(p => {
        const deduct = (p.pf || 0) + (p.esi || 0) + (p.tax || 0) + (p.otherDeductions || 0) + (p.leaveDeductions || 0);
        const esc = (v: any) => `"${String(v || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`;  
        csvContent += `${esc(p.employee)},${esc(p.employeeName)},${esc(p.month)},${p.basic},${p.hra},${p.allowance},${p.bonus},${p.overtime},${deduct},${p.net},${esc(p.status)}\n`;
      });
      filename = `Payroll_Report_${new Date().toISOString().split('T')[0]}.csv`;
    } 
    
    else if (type === 'attendance') {
      const records = await Attendance.find(filter);
      csvContent = 'Employee Name,Date,Check In,Check Out,Status,Duration\n';
      records.forEach(r => {
        const esc = (v: any) => `"${String(v || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`;  
        csvContent += `${esc(r.name)},${esc(r.date)},${esc(r.timeIn)},${esc(r.timeOut)},${esc(r.status)},${esc(r.duration)}\n`;
      });
      filename = `Attendance_Report_${new Date().toISOString().split('T')[0]}.csv`;
    } 
    
    else if (type === 'leaves') {
      const records = await Leave.find(filter);
      csvContent = 'Employee,Department,Type,Date,Duration,Reason,Status\n';
      records.forEach(l => {
        const esc = (v: any) => `"${String(v || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`;  
        csvContent += `${esc(l.name)},${esc(l.dept)},${esc(l.type)},${esc(l.date)},${esc(l.duration)},${esc(l.reason)},${esc(l.status)}\n`;
      });
      filename = `Leaves_Report_${new Date().toISOString().split('T')[0]}.csv`;
    } 
    
    else {
      // Default: Workforce
      const records = await Employee.find(filter);
      csvContent = 'Full Name,Department,Designation,Email,Phone,Joined Date,Location,Status\n';
      records.forEach(e => {
        const esc = (v: any) => `"${String(v || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`;  
        csvContent += `${esc(e.fullName)},${esc(e.department)},${esc(e.designation)},${esc(e.email)},${esc(e.phone)},${esc(e.joinedDate ? new Date(e.joinedDate).toLocaleDateString() : '')},${esc(e.location)},${esc(e.status)}\n`;
      });
      filename = `Workforce_Directory_${new Date().toISOString().split('T')[0]}.csv`;
    }

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store'
      }
    });

  } catch (error: any) {
    console.error('Failed to export CSV report:', error);
    return new Response(`Failed to export CSV report: ${error.message}`, { status: 500 });
  }
}

