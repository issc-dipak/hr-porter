import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Policy } from '@/app/api/models/Policy';
import { PolicyAcknowledgement } from '@/app/api/models/PolicyAcknowledgement';
import { PolicyAuditLog } from '@/app/api/models/PolicyAuditLog';
import { verifyAuth } from '@/app/api/lib/auth';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const companyId = decoded.companyId;
    const { id } = await params;

    await connectToDatabase();
    const policy = await Policy.findOne({ _id: id, companyId });
    if (!policy) {
      return NextResponse.json({ error: 'Policy not found' }, { status: 404 });
    }

    if (policy.status !== 'Published') {
      return NextResponse.json({ error: 'Forbidden: Cannot acknowledge an unpublished policy' }, { status: 400 });
    }

    // Get client IP address
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';

    // Check if already acknowledged for the current version
    const existingAck = await PolicyAcknowledgement.findOne({
      companyId,
      policyId: id,
      userId: decoded.userId,
      version: policy.currentVersion
    });

    if (existingAck) {
      return NextResponse.json({ success: true, message: 'Policy already acknowledged', ack: existingAck }, { status: 200 });
    }

    // Create acknowledgement
    const newAck = await PolicyAcknowledgement.create({
      companyId,
      policyId: id,
      userId: decoded.userId,
      employeeName: decoded.fullName || decoded.email.split('@')[0],
      employeeEmail: decoded.email,
      ipAddress,
      version: policy.currentVersion,
      acknowledgedAt: new Date()
    });

    // Log in Policy Audit Log
    await PolicyAuditLog.create({
      companyId,
      policyId: policy._id,
      policyTitle: policy.title,
      user: decoded.fullName || decoded.email.split('@')[0],
      email: decoded.email,
      role: decoded.role,
      action: 'Acknowledged',
      details: `Acknowledged policy v${policy.currentVersion} from IP ${ipAddress}.`
    });

    return NextResponse.json({ success: true, ack: newAck }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to log policy acknowledgement:', error);
    return NextResponse.json({ error: 'Failed to log acknowledgement', details: error.message }, { status: 500 });
  }
}
