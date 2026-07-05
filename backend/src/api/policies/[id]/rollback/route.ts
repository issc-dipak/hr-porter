import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Policy } from '@/app/api/models/Policy';
import { PolicyVersion } from '@/app/api/models/PolicyVersion';
import { PolicyAuditLog } from '@/app/api/models/PolicyAuditLog';
import { verifyAuth } from '@/app/api/lib/auth';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isPrivileged = decoded.role === 'Admin' || decoded.role === 'Company Admin' || decoded.role === 'HR';
    if (!isPrivileged) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }

    const companyId = decoded.companyId;
    const { id } = await params;
    const { versionNumber } = await req.json() as { versionNumber: string };

    if (!versionNumber) {
      return NextResponse.json({ error: 'Missing required field: versionNumber' }, { status: 400 });
    }

    await connectToDatabase();

    const policy = await Policy.findOne({ _id: id, companyId });
    if (!policy) {
      return NextResponse.json({ error: 'Policy not found' }, { status: 404 });
    }

    // Find the historical version record
    const targetVersion = await PolicyVersion.findOne({ policyId: id, version: versionNumber });
    if (!targetVersion) {
      return NextResponse.json({ error: `Historical version "${versionNumber}" not found for this policy` }, { status: 404 });
    }

    // Calculate new version number (incrementing current version)
    const versionParts = policy.currentVersion.split('.').map(Number);
    let nextVersion = '1.0';
    if (versionParts.length === 2 && !isNaN(versionParts[0]) && !isNaN(versionParts[1])) {
      nextVersion = `${versionParts[0]}.${versionParts[1] + 1}`;
    } else {
      nextVersion = '1.1';
    }

    // Update the Policy content
    policy.content = targetVersion.content;
    policy.currentVersion = nextVersion;
    await policy.save();

    // Create a new version entry recording this rollback action
    await PolicyVersion.create({
      policyId: policy._id,
      version: nextVersion,
      content: targetVersion.content,
      changeSummary: `Rollback to version ${versionNumber} content`,
      modifiedBy: decoded.fullName || decoded.email.split('@')[0],
      modifiedByEmail: decoded.email
    });

    // Log the rollback in audit logs
    await PolicyAuditLog.create({
      companyId,
      policyId: policy._id,
      policyTitle: policy.title,
      user: decoded.fullName || decoded.email.split('@')[0],
      email: decoded.email,
      role: decoded.role,
      action: 'Rollback',
      details: `Reverted policy content to historical version ${versionNumber}. Created new version ${nextVersion}.`
    });

    return NextResponse.json({
      success: true,
      message: `Successfully rolled back to version ${versionNumber}. Current version is now ${nextVersion}.`,
      policy
    }, { status: 200 });
  } catch (error: any) {
    console.error('Failed to rollback policy version:', error);
    return NextResponse.json({ error: 'Failed to rollback version', details: error.message }, { status: 500 });
  }
}
