import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { RoleActivityLog } from '@/app/api/models/RoleActivityLog';
import { verifyAuth } from '@/app/api/lib/auth';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const companyId = decoded.companyId;
    const { id } = await params;

    await connectToDatabase();
    const logs = await RoleActivityLog.find({ companyId, roleId: id }).sort({ timestamp: -1 });

    return NextResponse.json(logs, { status: 200 });
  } catch (error: any) {
    console.error('Failed to fetch role activity logs:', error);
    return NextResponse.json({ error: 'Failed to fetch logs', details: error.message }, { status: 500 });
  }
}
