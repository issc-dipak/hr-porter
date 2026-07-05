import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Policy } from '@/app/api/models/Policy';
import { PolicyVersion } from '@/app/api/models/PolicyVersion';
import { PolicyAcknowledgement } from '@/app/api/models/PolicyAcknowledgement';
import { PolicyAuditLog } from '@/app/api/models/PolicyAuditLog';
import { verifyAuth } from '@/app/api/lib/auth';
import { checkUserPermission } from '@/app/api/lib/rbac';

export async function GET(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = decoded.companyId;
    const isPrivileged = await checkUserPermission(companyId, decoded.userId, decoded.role, 'policy.create') ||
                        await checkUserPermission(companyId, decoded.userId, decoded.role, 'policy.publish');
    
    await connectToDatabase();

    if (isPrivileged) {
      // HR/Admin sees all policies in their company
      const policies = await Policy.find({ companyId }).sort({ updatedAt: -1 });
      return NextResponse.json(policies, { status: 200 });
    } else {
      // Employee sees only Published policies that match visibility scopes and their department
      // Let's get employee's department by email
      const { Employee } = await import('../../models/Employee');
      const employee = await Employee.findOne({ email: decoded.email.toLowerCase().trim(), companyId });
      const department = employee?.department || '';

      const query: any = {
        companyId,
        status: 'Published',
        $or: [
          { visibilityScope: 'Entire Company' },
          { visibilityScope: 'Department Specific', targetDepartments: department },
          // leadership or HR only not visible to standard Employee
        ]
      };

      const policies = await Policy.find(query).sort({ effectiveDate: -1 });

      // Fetch acknowledgements for this employee
      const acknowledgements = await PolicyAcknowledgement.find({
        companyId,
        userId: decoded.userId
      });

      const ackMap = new Map(acknowledgements.map(ack => [ack.policyId.toString(), ack]));

      const policiesWithAckStatus = policies.map(policy => {
        const ackRecord = ackMap.get(policy._id.toString());
        return {
          ...policy.toObject(),
          acknowledged: !!ackRecord && ackRecord.version === policy.currentVersion,
          acknowledgementDetails: ackRecord || null
        };
      });

      return NextResponse.json(policiesWithAckStatus, { status: 200 });
    }
  } catch (error: any) {
    console.error('Failed to fetch policies:', error);
    return NextResponse.json({ error: 'Failed to fetch policies', details: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const companyId = decoded.companyId;
    const hasAccess = await checkUserPermission(companyId, decoded.userId, decoded.role, 'policy.create');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions to create policies' }, { status: 403 });
    }

    const companyName = decoded.companyName;
    const data = await req.json() as any;

    if (!data.title || !data.category || !data.effectiveDate) {
      return NextResponse.json({ error: 'Missing required fields (title, category, effectiveDate)' }, { status: 400 });
    }

    await connectToDatabase();

    const initialVersion = '1.0';

    const newPolicy = await Policy.create({
      companyId,
      companyName,
      title: data.title,
      category: data.category,
      description: data.description || '',
      content: data.content || '',
      effectiveDate: new Date(data.effectiveDate),
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
      visibilityScope: data.visibilityScope || 'Entire Company',
      targetDepartments: data.targetDepartments || [],
      status: data.status || 'Draft',
      currentVersion: initialVersion,
      attachments: data.attachments || []
    });

    // Create initial PolicyVersion
    await PolicyVersion.create({
      policyId: newPolicy._id,
      version: initialVersion,
      content: data.content || '',
      changeSummary: 'Initial policy document creation',
      modifiedBy: decoded.fullName || decoded.email.split('@')[0],
      modifiedByEmail: decoded.email
    });

    // Log in Policy Audit Log
    await PolicyAuditLog.create({
      companyId,
      policyId: newPolicy._id,
      policyTitle: newPolicy.title,
      user: decoded.fullName || decoded.email.split('@')[0],
      email: decoded.email,
      role: decoded.role,
      action: 'Created',
      details: `Policy "${newPolicy.title}" created in Draft status.`
    });

    return NextResponse.json(newPolicy, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create policy:', error);
    return NextResponse.json({ error: 'Failed to create policy', details: error.message }, { status: 500 });
  }
}
