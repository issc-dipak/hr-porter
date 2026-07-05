import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Employee } from '@/app/api/models/Employee';
import { verifyAuth } from '@/app/api/lib/auth';

export async function GET(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { companyId } = decoded;
    await connectToDatabase();

    const employees = await Employee.find({ companyId, status: 'Active' });

    // Find all manager IDs assigned to any active employee
    const managerIds = Array.from(new Set(employees.map(emp => emp.managerId).filter(Boolean)));

    const managersList = employees
      .filter(emp => managerIds.includes(emp._id.toString()))
      .map(mgr => {
        const directReports = employees.filter(emp => emp.managerId === mgr._id.toString());
        return {
          _id: mgr._id.toString(),
          fullName: mgr.fullName,
          email: mgr.email,
          designation: mgr.designation,
          department: mgr.department,
          profilePicture: mgr.profilePicture || '',
          teamSize: directReports.length,
          reports: directReports.map(emp => ({
            _id: emp._id.toString(),
            fullName: emp.fullName,
            email: emp.email,
            designation: emp.designation,
            profilePicture: emp.profilePicture || ''
          }))
        };
      })
      .sort((a, b) => b.teamSize - a.teamSize); // sorted by team size

    return NextResponse.json(managersList, { status: 200 });
  } catch (error: any) {
    console.error('Failed to construct managers list:', error);
    return NextResponse.json({ error: 'Failed to construct managers list', details: error.message }, { status: 500 });
  }
}
