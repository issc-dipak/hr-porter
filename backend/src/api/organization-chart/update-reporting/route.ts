import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Employee } from '@/app/api/models/Employee';
import { verifyAuth } from '@/app/api/lib/auth';
import { AuditLog } from '@/app/api/models/AuditLog';

export async function PUT(req: Request) {
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
    const { employeeIds, newManagerId } = body;

    if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
      return NextResponse.json({ error: 'employeeIds array is required' }, { status: 400 });
    }

    await connectToDatabase();

    let managerName = 'None';
    if (newManagerId) {
      const manager = await Employee.findById(newManagerId);
      if (!manager) {
        return NextResponse.json({ error: 'New manager not found' }, { status: 404 });
      }
      if (manager.companyId !== companyId) {
        return NextResponse.json({ error: 'Access denied: manager company mismatch' }, { status: 403 });
      }
      managerName = manager.fullName;
    }

    // Update managerId for each employee
    const res = await Employee.updateMany(
      { companyId, _id: { $in: employeeIds } },
      { $set: { managerId: newManagerId || '' } }
    );

    await AuditLog.create({
      companyId,
      action: 'Reporting Structures Updated',
      performedBy: email,
      details: `Bulk reassigned manager of ${res.modifiedCount} employees to ${managerName} by ${email}`,
      ipAddress: '127.0.0.1'
    });

    return NextResponse.json({ message: 'Reporting structures updated successfully', modifiedCount: res.modifiedCount }, { status: 200 });
  } catch (error: any) {
    console.error('Failed to update reporting structure:', error);
    return NextResponse.json({ error: 'Failed to update reporting structures', details: error.message }, { status: 500 });
  }
}
