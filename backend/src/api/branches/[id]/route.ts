import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Branch } from '@/app/models/Branch';
import { Employee } from '@/app/models/Employee';
import { verifyAuth } from '@/app/api/lib/auth';
import { checkUserPermission } from '@/app/api/lib/rbac';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hasAccess = await checkUserPermission(decoded.companyId, decoded.userId, decoded.role, 'branch.manage');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions to manage branches' }, { status: 403 });
    }

    const companyId = decoded.companyId;
    const { id } = await params;
    const body = await req.json() as any;

    await connectToDatabase();

    const branch = await Branch.findOne({ _id: id, companyId });
    if (!branch) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
    }

    const fieldsToUpdate = [
      'branchName', 'branchCode', 'branchType', 'address', 'city', 'state',
      'country', 'postalCode', 'timezone', 'contactNumber', 'email', 'status'
    ];

    for (const field of fieldsToUpdate) {
      if (body[field] !== undefined) {
        (branch as any)[field] = body[field];
      }
    }

    await branch.save();

    return NextResponse.json(branch, { status: 200 });
  } catch (error: any) {
    console.error('Failed to update branch:', error);
    return NextResponse.json({ error: 'Failed to update branch', details: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hasAccess = await checkUserPermission(decoded.companyId, decoded.userId, decoded.role, 'branch.manage');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions to manage branches' }, { status: 403 });
    }

    const companyId = decoded.companyId;
    const { id } = await params;

    await connectToDatabase();

    const branch = await Branch.findOne({ _id: id, companyId });
    if (!branch) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
    }

    // Check if any active employees are mapped to this branch
    const employeeCount = await Employee.countDocuments({ companyId, branchId: id });
    if (employeeCount > 0) {
      return NextResponse.json({
        error: `Cannot delete branch. There are ${employeeCount} employees currently mapped to this branch.`
      }, { status: 400 });
    }

    await Branch.deleteOne({ _id: id, companyId });

    return NextResponse.json({ success: true, message: 'Branch deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Failed to delete branch:', error);
    return NextResponse.json({ error: 'Failed to delete branch', details: error.message }, { status: 500 });
  }
}
