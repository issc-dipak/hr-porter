import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Department } from '@/app/models/Department';
import { verifyAuth } from '@/app/api/lib/auth';

export async function GET(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const companyId = decoded.companyId;
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get('branchId');
    const query: any = { companyId };

    if ((decoded.role === 'Branch Admin' || decoded.role === 'HR') && decoded.branchId) {
      query.branchId = decoded.branchId;
    } else if (branchId) {
      query.branchId = branchId;
    }

    const departments = await Department.find(query).sort({ departmentName: 1 });
    return NextResponse.json(departments, { status: 200 });
  } catch (error: any) {
    console.error('Failed to fetch departments:', error);
    return NextResponse.json({ error: 'Failed to fetch departments', details: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const companyId = decoded.companyId;
    const body = await req.json() as any;
    const { departmentName, description, branchId } = body;

    if (!departmentName) {
      return NextResponse.json({ error: 'Missing required field: departmentName' }, { status: 400 });
    }

    await connectToDatabase();

    const targetBranchId = ((decoded.role === 'Branch Admin' || decoded.role === 'HR') && decoded.branchId)
      ? decoded.branchId
      : (branchId || '');

    const newDept = await Department.create({
      companyId,
      departmentName,
      description: description || '',
      branchId: targetBranchId
    });

    return NextResponse.json(newDept, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create department:', error);
    return NextResponse.json({ error: 'Failed to create department', details: error.message }, { status: 500 });
  }
}
