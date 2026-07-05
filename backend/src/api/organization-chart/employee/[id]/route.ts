import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Employee } from '@/app/api/models/Employee';
import { verifyAuth } from '@/app/api/lib/auth';

export async function GET(req: Request, context: any) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { companyId } = decoded;
    const params = await context.params;
    const { id } = params;

    await connectToDatabase();

    const employees = await Employee.find({ companyId, status: 'Active' });
    const employee = employees.find(emp => emp._id.toString() === id);

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // 1. Manager Details
    let managerDetails = null;
    if (employee.managerId) {
      const manager = employees.find(emp => emp._id.toString() === employee.managerId);
      if (manager) {
        managerDetails = {
          _id: manager._id.toString(),
          fullName: manager.fullName,
          email: manager.email,
          designation: manager.designation,
          department: manager.department,
          profilePicture: manager.profilePicture || ''
        };
      }
    }

    // 2. Peers (same manager, excluding self)
    const peers = employees
      .filter(emp => emp._id.toString() !== id && emp.managerId === employee.managerId)
      .map(emp => ({
        _id: emp._id.toString(),
        fullName: emp.fullName,
        email: emp.email,
        designation: emp.designation,
        profilePicture: emp.profilePicture || ''
      }));

    // 3. Direct Reports
    const reports = employees
      .filter(emp => emp.managerId === id)
      .map(emp => ({
        _id: emp._id.toString(),
        fullName: emp.fullName,
        email: emp.email,
        designation: emp.designation,
        profilePicture: emp.profilePicture || ''
      }));

    // 4. Reporting Chain (Managers upward)
    const chain = [];
    let current = employee;
    let depth = 0;
    while (current.managerId && depth < 15) {
      const manager = employees.find(emp => emp._id.toString() === current.managerId);
      if (!manager) break;
      chain.push({
        _id: manager._id.toString(),
        fullName: manager.fullName,
        email: manager.email,
        designation: manager.designation,
        profilePicture: manager.profilePicture || ''
      });
      current = manager;
      depth++;
    }

    return NextResponse.json({
      employee: {
        _id: employee._id.toString(),
        fullName: employee.fullName,
        email: employee.email,
        designation: employee.designation,
        department: employee.department,
        profilePicture: employee.profilePicture || '',
        joinedDate: employee.joinedDate,
        location: employee.location
      },
      manager: managerDetails,
      peers,
      reports,
      reportingChain: chain
    }, { status: 200 });
  } catch (error: any) {
    console.error('Failed to load employee details:', error);
    return NextResponse.json({ error: 'Failed to load employee relationships', details: error.message }, { status: 500 });
  }
}
