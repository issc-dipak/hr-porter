import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Branch } from '@/app/models/Branch';
import { verifyAuth } from '@/app/api/lib/auth';
import { checkUserPermission } from '@/app/api/lib/rbac';

export async function GET(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const companyId = decoded.companyId;
    await connectToDatabase();

    const branches = await Branch.find({ companyId }).sort({ branchName: 1 });
    return NextResponse.json(branches, { status: 200 });
  } catch (error: any) {
    console.error('Failed to fetch branches:', error);
    return NextResponse.json({ error: 'Failed to fetch branches', details: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
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
    const body = await req.json() as any;

    const {
      branchName,
      branchCode,
      branchType,
      address,
      city,
      state,
      country,
      postalCode,
      timezone,
      contactNumber,
      email,
      status
    } = body;

    if (!branchName || !branchCode || !address || !city || !state || !country || !postalCode || !timezone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await connectToDatabase();

    // Check if branchCode already exists for this company
    const existing = await Branch.findOne({ companyId, branchCode });
    if (existing) {
      return NextResponse.json({ error: `Branch code "${branchCode}" already exists` }, { status: 400 });
    }

    const newBranch = await Branch.create({
      companyId,
      branchName,
      branchCode,
      branchType: branchType || 'Office',
      address,
      city,
      state,
      country,
      postalCode,
      timezone,
      contactNumber: contactNumber || '',
      email: email || '',
      status: status || 'Active'
    });

    return NextResponse.json(newBranch, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create branch:', error);
    return NextResponse.json({ error: 'Failed to create branch', details: error.message }, { status: 500 });
  }
}
