import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Role } from '@/app/api/models/Role';
import { RolePermission } from '@/app/api/models/RolePermission';
import { RoleActivityLog } from '@/app/api/models/RoleActivityLog';
import { verifyAuth } from '@/app/api/lib/auth';
import { checkUserPermission } from '@/app/api/lib/rbac';

export async function GET(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const roles = await Role.find({ companyId: decoded.companyId }).sort({ createdAt: -1 }).lean();
    return NextResponse.json(roles, { status: 200 });
  } catch (error: any) {
    console.error('Failed to fetch roles:', error);
    return NextResponse.json({ error: 'Failed to fetch roles', details: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // RBAC permission check
    const hasAccess = await checkUserPermission(decoded.companyId, decoded.userId, decoded.role, 'permissions.manage');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { name, description, permissionIds } = (await req.json()) as any;
    if (!name) {
      return NextResponse.json({ error: 'Role name is required' }, { status: 400 });
    }

    await connectToDatabase();

    // Check if role name already exists in this company
    const existing = await Role.findOne({ companyId: decoded.companyId, name }).lean();
    if (existing) {
      return NextResponse.json({ error: 'Role name already exists' }, { status: 400 });
    }

    const newRole = await Role.create({
      companyId: decoded.companyId,
      name,
      description,
      isSystem: false
    });

    // Map permission mappings if provided
    if (permissionIds && Array.isArray(permissionIds)) {
      const mappings = permissionIds.map(permId => ({
        companyId: decoded.companyId,
        roleId: newRole._id,
        permissionId: permId
      }));
      if (mappings.length > 0) {
        await RolePermission.insertMany(mappings);
      }
    }

    // Log Activity
    await RoleActivityLog.create({
      companyId: decoded.companyId,
      actorId: decoded.userId,
      actorEmail: decoded.email,
      action: 'CREATE_ROLE',
      details: `Created custom role: ${name} with ${permissionIds?.length || 0} permissions`
    });

    return NextResponse.json(newRole, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create role:', error);
    return NextResponse.json({ error: 'Failed to create role', details: error.message }, { status: 500 });
  }
}
