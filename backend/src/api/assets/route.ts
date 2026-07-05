import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Asset } from '@/app/api/models/Asset';
import { verifyAuth } from '@/app/api/lib/auth';

export async function GET(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = decoded.companyId || 'company_001';

    await connectToDatabase();
    
    const filter: any = { companyId };
    if ((decoded.role === 'Branch Admin' || decoded.role === 'HR') && decoded.branchId) {
      filter.branchId = decoded.branchId;
    } else {
      const { searchParams } = new URL(req.url);
      const branchId = searchParams.get('branchId');
      if (branchId) {
        filter.branchId = branchId;
      }
    }

    const assets = await Asset.find(filter).sort({ createdAt: -1 });
    return NextResponse.json(assets, { status: 200 });
  } catch (error: any) {
    console.error('Failed to fetch assets:', error);
    return NextResponse.json({ error: 'Failed to fetch assets', details: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = decoded.companyId || 'company_001';
    const companyName = decoded.companyName;
    const data = await req.json() as any;
    
    if (!data.name || !data.type || !data.serialNumber) {
      return NextResponse.json({ error: 'Missing required fields (name, type, serialNumber)' }, { status: 400 });
    }
    
    await connectToDatabase();

    let branchId = data.branchId || '';
    if (data.assignedTo) {
      const { Employee } = await import('@/app/models/Employee');
      const emp = await Employee.findOne({ email: data.assignedTo, companyId });
      if (emp) {
        branchId = emp.branchId || '';
      }
    }
    if ((decoded.role === 'Branch Admin' || decoded.role === 'HR') && decoded.branchId) {
      branchId = decoded.branchId;
    }
    
    const newAsset = await Asset.create({
      ...data,
      companyId,
      companyName,
      branchId
    });
    
    return NextResponse.json(newAsset, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create asset:', error);
    return NextResponse.json({ error: 'Failed to create asset', details: error.message }, { status: 500 });
  }
}

