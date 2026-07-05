import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Employee } from '@/app/api/models/Employee';
import { Department } from '@/app/api/models/Department';
import { verifyAuth } from '@/app/api/lib/auth';

export async function GET(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { companyId } = decoded;
    await connectToDatabase();

    const departments = await Department.find({ companyId });
    const employees = await Employee.find({ companyId, status: 'Active' });

    const deptDetails = departments.map(dept => {
      const deptEmployees = employees.filter(emp => emp.department === dept.departmentName || emp.departmentId === dept._id.toString());
      
      // Find department head: designation contains Manager, Head, Director, Lead
      let head = deptEmployees.find(emp => 
        emp.designation.toLowerCase().includes('manager') || 
        emp.designation.toLowerCase().includes('head') || 
        emp.designation.toLowerCase().includes('director') ||
        emp.designation.toLowerCase().includes('vp')
      );
      
      if (!head && deptEmployees.length > 0) {
        // Fallback to employee with no manager within this dept or first employee
        head = deptEmployees.find(emp => !emp.managerId) || deptEmployees[0];
      }

      return {
        _id: dept._id.toString(),
        departmentName: dept.departmentName,
        description: dept.description || '',
        memberCount: deptEmployees.length,
        managerName: head ? head.fullName : 'Unassigned',
        managerEmail: head ? head.email : '',
        managerPicture: head ? head.profilePicture : '',
        members: deptEmployees.map(emp => ({
          _id: emp._id.toString(),
          fullName: emp.fullName,
          email: emp.email,
          designation: emp.designation,
          profilePicture: emp.profilePicture || ''
        }))
      };
    });

    return NextResponse.json(deptDetails, { status: 200 });
  } catch (error: any) {
    console.error('Failed to construct department view data:', error);
    return NextResponse.json({ error: 'Failed to construct department view data', details: error.message }, { status: 500 });
  }
}
