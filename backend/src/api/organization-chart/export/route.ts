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

    const exportData = employees.map(emp => {
      const manager = employees.find(m => m._id.toString() === emp.managerId);
      return {
        employeeId: emp._id.toString(),
        fullName: emp.fullName,
        email: emp.email,
        phone: emp.phone,
        department: emp.department,
        designation: emp.designation,
        reportingManager: manager ? manager.fullName : 'None',
        managerEmail: manager ? manager.email : '',
        joiningDate: emp.joinedDate ? new Date(emp.joinedDate).toLocaleDateString('en-US') : ''
      };
    });

    return NextResponse.json(exportData, { status: 200 });
  } catch (error: any) {
    console.error('Failed to construct export hierarchy:', error);
    return NextResponse.json({ error: 'Failed to construct export data', details: error.message }, { status: 500 });
  }
}
