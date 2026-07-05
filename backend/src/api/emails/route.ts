import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { EmailLog } from '../../models/EmailLog';
import { verifyAuth } from '@/app/api/lib/auth';

export async function GET(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Admins, HR managers, and employees can fetch the email logs
    // Filter by companyId to scope it properly
    const companyId = decoded.companyId;

    await connectToDatabase();

    const emails = await EmailLog.find({ companyId })
      .sort({ createdAt: -1 })
      .limit(100);

    return NextResponse.json(emails, { status: 200 });
  } catch (error: any) {
    console.error('Failed to fetch email logs:', error);
    return NextResponse.json({ error: 'Failed to fetch email logs', details: error.message }, { status: 500 });
  }
}
