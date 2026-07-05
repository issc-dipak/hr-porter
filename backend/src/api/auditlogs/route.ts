import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { AuditLog } from '@/app/api/models/AuditLog';
import { verifyAuth } from '@/app/api/lib/auth';

export async function GET(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    const logs = await AuditLog.find({ companyId: decoded.companyId }).sort({ createdAt: -1 }).limit(100);
    return NextResponse.json(logs, { status: 200 });
  } catch (error: any) {
    console.error('Failed to fetch audit logs:', error);
    return NextResponse.json({ error: 'Failed to fetch audit logs', details: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const data = await req.json() as any;
    if (!data.action || !data.performedBy || !data.details) {
      return NextResponse.json({ error: 'Missing required fields (action, performedBy, details)' }, { status: 400 });
    }
    await connectToDatabase();
    const newLog = await AuditLog.create({
      ...data,
      companyId: decoded.companyId
    });
    return NextResponse.json(newLog, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create audit log:', error);
    return NextResponse.json({ error: 'Failed to create audit log', details: error.message }, { status: 500 });
  }
}

