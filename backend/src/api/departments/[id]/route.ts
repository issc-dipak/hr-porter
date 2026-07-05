import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Department } from '@/app/models/Department';
import { Employee } from '@/app/models/Employee';
import { verifyAuth } from '@/app/api/lib/auth';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const companyId = decoded.companyId;
    const { id } = await params;
    const body = await req.json() as any;
    const { departmentName, description, branchId } = body;

    await connectToDatabase();

    const dept = await Department.findOne({ _id: id, companyId });
    if (!dept) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    if (departmentName !== undefined) dept.departmentName = departmentName;
    if (description !== undefined) dept.description = description;
    if (branchId !== undefined) dept.branchId = branchId;

    await dept.save();

    return NextResponse.json(dept, { status: 200 });
  } catch (error: any) {
    console.error('Failed to update department:', error);
    return NextResponse.json({ error: 'Failed to update department', details: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const companyId = decoded.companyId;
    const { id } = await params;

    await connectToDatabase();

    const dept = await Department.findOne({ _id: id, companyId });
    if (!dept) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    // Check if any employees are in this department
    const employeeCount = await Employee.countDocuments({
      companyId,
      department: dept.departmentName
    });

    if (employeeCount > 0) {
      return NextResponse.json({
        error: `Cannot delete department. There are ${employeeCount} employees currently assigned to this department.`
      }, { status: 400 });
    }

    await Department.deleteOne({ _id: id, companyId });

    return NextResponse.json({ success: true, message: 'Department deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Failed to delete department:', error);
    return NextResponse.json({ error: 'Failed to delete department', details: error.message }, { status: 500 });
  }
}
