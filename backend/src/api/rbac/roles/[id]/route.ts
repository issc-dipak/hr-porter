import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Role } from '@/app/api/models/Role';
import { RolePermission } from '@/app/api/models/RolePermission';
import { RoleActivityLog } from '@/app/api/models/RoleActivityLog';
import { UserRole } from '@/app/api/models/UserRole';
import { verifyAuth } from '@/app/api/lib/auth';
import { checkUserPermission } from '@/app/api/lib/rbac';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectToDatabase();

    const role = await Role.findOne({ _id: id, companyId: decoded.companyId }).lean();
    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    const mappings = await RolePermission.find({ companyId: decoded.companyId, roleId: id }).populate('permissionId').lean();
    const permissionIds = mappings.filter((m: any) => m.permissionId).map((m: any) => m.permissionId._id);
    const permissionKeys = mappings.filter((m: any) => m.permissionId).map((m: any) => m.permissionId.key);

    return NextResponse.json({
      role,
      permissionIds,
      permissionKeys
    }, { status: 200 });
  } catch (error: any) {
    console.error('Failed to fetch role:', error);
    return NextResponse.json({ error: 'Failed to fetch role', details: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const { id } = await params;
    const { name, description, permissionIds } = (await req.json()) as any;

    await connectToDatabase();
    const role = await Role.findOne({ _id: id, companyId: decoded.companyId });
    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    // Update name & description if not system role
    if (!role.isSystem && name) {
      role.name = name;
    }
    if (description !== undefined) {
      role.description = description;
    }
    await role.save();

    // Re-map permissions
    await RolePermission.deleteMany({ companyId: decoded.companyId, roleId: id });
    if (permissionIds && Array.isArray(permissionIds)) {
      const mappings = permissionIds.map(permId => ({
        companyId: decoded.companyId,
        roleId: id,
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
      action: 'UPDATE_ROLE',
      details: `Updated role: ${role.name}. Total mapped permissions: ${permissionIds?.length || 0}`
    });

    return NextResponse.json(role, { status: 200 });
  } catch (error: any) {
    console.error('Failed to update role:', error);
    return NextResponse.json({ error: 'Failed to update role', details: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const { id } = await params;
    await connectToDatabase();

    const role = await Role.findOne({ _id: id, companyId: decoded.companyId });
    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    if (role.isSystem) {
      return NextResponse.json({ error: 'Cannot delete system roles' }, { status: 400 });
    }

    // Find fallback role 'Employee' or system default role to reassign users
    let employeeRole = await Role.findOne({ companyId: decoded.companyId, name: 'Employee' });
    if (!employeeRole) {
      employeeRole = await Role.create({
        companyId: decoded.companyId,
        name: 'Employee',
        description: 'Standard system employee role',
        isSystem: true
      });
    }

    // Reassign all users associated with this role to 'Employee'
    await UserRole.updateMany(
      { companyId: decoded.companyId, roleId: id },
      { $set: { roleId: employeeRole._id } }
    );

    // Delete mappings & role
    await RolePermission.deleteMany({ companyId: decoded.companyId, roleId: id });
    await Role.deleteOne({ _id: id, companyId: decoded.companyId });

    // Log Activity
    await RoleActivityLog.create({
      companyId: decoded.companyId,
      actorId: decoded.userId,
      actorEmail: decoded.email,
      action: 'DELETE_ROLE',
      details: `Deleted role: ${role.name}`
    });

    return NextResponse.json({ success: true, message: 'Role deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Failed to delete role:', error);
    return NextResponse.json({ error: 'Failed to delete role', details: error.message }, { status: 500 });
  }
}
