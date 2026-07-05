import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Employee } from '@/app/api/models/Employee';
import { verifyAuth } from '@/app/api/lib/auth';

// Recursive builder with cycle-prevention visited tracking
function buildEmployeeTree(employees: any[], managerId: string, visited: Set<string>): any[] {
  return employees
    .filter(emp => {
      const empId = emp._id.toString();
      const match = (emp.managerId || '') === managerId;
      if (match && !visited.has(empId)) {
        visited.add(empId);
        return true;
      }
      return false;
    })
    .map(emp => {
      const children = buildEmployeeTree(employees, emp._id.toString(), visited);
      return {
        _id: emp._id.toString(),
        fullName: emp.fullName,
        email: emp.email,
        designation: emp.designation,
        department: emp.department,
        profilePicture: emp.profilePicture || '',
        location: emp.location || '',
        status: emp.status,
        children
      };
    });
}

// GET visual tree data
export async function GET(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { companyId } = decoded;
    await connectToDatabase();

    const activeEmployees = await Employee.find({ companyId, status: 'Active' });
    const employeeIds = new Set(activeEmployees.map(emp => emp._id.toString()));

    // Root nodes are employees without a manager or whose manager is not active in the system
    const rootEmployees = activeEmployees.filter(emp => {
      const mId = emp.managerId || '';
      return !mId || !employeeIds.has(mId);
    });

    const visited = new Set<string>();
    
    // Build nested tree structure starting from each root node
    const treeData = rootEmployees.map(emp => {
      visited.add(emp._id.toString());
      const children = buildEmployeeTree(activeEmployees, emp._id.toString(), visited);
      return {
        _id: emp._id.toString(),
        fullName: emp.fullName,
        email: emp.email,
        designation: emp.designation,
        department: emp.department,
        profilePicture: emp.profilePicture || '',
        location: emp.location || '',
        status: emp.status,
        children
      };
    });

    return NextResponse.json(treeData, { status: 200 });
  } catch (error: any) {
    console.error('Failed to construct employee tree:', error);
    return NextResponse.json({ error: 'Failed to construct tree data', details: error.message }, { status: 500 });
  }
}
