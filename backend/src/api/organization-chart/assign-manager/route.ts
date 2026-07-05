import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Employee } from '@/app/api/models/Employee';
import { verifyAuth } from '@/app/api/lib/auth';
import { AuditLog } from '@/app/api/models/AuditLog';

export async function POST(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { companyId, role, email } = decoded;
    if (role !== 'HR' && role !== 'Admin') {
      return NextResponse.json({ error: 'Access denied: HR/Admin only' }, { status: 403 });
    }

    const body = await req.json() as any;
    const { employeeId, managerId } = body;

    if (!employeeId) {
      return NextResponse.json({ error: 'employeeId is required' }, { status: 400 });
    }

    await connectToDatabase();

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    if (employee.companyId !== companyId) {
      return NextResponse.json({ error: 'Access denied: company mismatch' }, { status: 403 });
    }

    let managerName = 'None';
    if (managerId) {
      // Loop-prevention: employee cannot be their own manager
      if (employeeId === managerId) {
        return NextResponse.json({ error: 'Employee cannot report to themselves' }, { status: 400 });
      }

      const manager = await Employee.findById(managerId);
      if (!manager) {
        return NextResponse.json({ error: 'Manager not found' }, { status: 404 });
      }

      if (manager.companyId !== companyId) {
        return NextResponse.json({ error: 'Access denied: manager company mismatch' }, { status: 403 });
      }

      // Check cycles: walk up the chain from target manager. If we hit the employeeId, it's a loop!
      let curr = manager;
      let depth = 0;
      while (curr.managerId && depth < 20) {
        if (curr.managerId === employeeId) {
          return NextResponse.json({ error: 'Cyclic reporting structure detected: this manager currently reports to the employee' }, { status: 400 });
        }
        const nextMgr = await Employee.findById(curr.managerId);
        if (!nextMgr) break;
        curr = nextMgr;
        depth++;
      }

      managerName = manager.fullName;
    }

    employee.managerId = managerId || '';
    await employee.save();

    await AuditLog.create({
      companyId,
      action: 'Reporting Manager Assigned',
      performedBy: email,
      details: `Employee ${employee.fullName} manager updated to ${managerName} by ${email}`,
      ipAddress: '127.0.0.1'
    });

    return NextResponse.json({ message: 'Manager assigned successfully', employee }, { status: 200 });
  } catch (error: any) {
    console.error('Failed to assign manager:', error);
    return NextResponse.json({ error: 'Failed to assign manager', details: error.message }, { status: 500 });
  }
}
