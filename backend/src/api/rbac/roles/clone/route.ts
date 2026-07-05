import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Role } from '@/app/api/models/Role';
import { RolePermission } from '@/app/api/models/RolePermission';
import { RoleActivityLog } from '@/app/api/models/RoleActivityLog';
import { verifyAuth } from '@/app/api/lib/auth';
import { checkUserPermission } from '@/app/api/lib/rbac';

export async function POST(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hasAccess = await checkUserPermission(decoded.companyId, decoded.userId, decoded.role, 'permissions.manage');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions to manage RBAC' }, { status: 403 });
    }

    const companyId = decoded.companyId;
    const { sourceRoleId, newRoleName, newRoleDescription } = await req.json() as any;

    if (!sourceRoleId || !newRoleName) {
      return NextResponse.json({ error: 'Missing required fields: sourceRoleId, newRoleName' }, { status: 400 });
    }

    await connectToDatabase();

    // Verify source role exists
    const sourceRole = await Role.findOne({ _id: sourceRoleId, companyId });
    if (!sourceRole) {
      return NextResponse.json({ error: 'Source role not found' }, { status: 404 });
    }

    // Verify name uniqueness
    const existing = await Role.findOne({ companyId, name: newRoleName });
    if (existing) {
      return NextResponse.json({ error: `Role name "${newRoleName}" already exists in this company` }, { status: 400 });
    }

    // Create new role
    const clonedRole = await Role.create({
      companyId,
      name: newRoleName,
      description: newRoleDescription || `Cloned from ${sourceRole.name}`,
      isSystem: false
    });

    // Copy permission mappings
    const sourceMappings = await RolePermission.find({ companyId, roleId: sourceRoleId });
    for (const mapping of sourceMappings) {
      await RolePermission.create({
        companyId,
        roleId: clonedRole._id,
        permissionId: mapping.permissionId
      });
    }

    // Log Activity
    await RoleActivityLog.create({
      companyId,
      roleId: clonedRole._id,
      roleName: clonedRole.name,
      user: decoded.fullName || decoded.email.split('@')[0],
      email: decoded.email,
      action: 'Cloned',
      details: `Role "${newRoleName}" cloned from source role "${sourceRole.name}" with ${sourceMappings.length} permissions.`
    });

    return NextResponse.json(clonedRole, { status: 201 });
  } catch (error: any) {
    console.error('Failed to clone role:', error);
    return NextResponse.json({ error: 'Failed to clone role', details: error.message }, { status: 500 });
  }
}
