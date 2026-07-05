import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { verifyAuth } from '@/app/api/lib/auth';
import { Role } from '@/app/api/models/Role';
import { RolePermission } from '@/app/api/models/RolePermission';
import { UserRole } from '@/app/api/models/UserRole';
import { Permission } from '@/app/api/models/Permission';

/**
 * GET /api/rbac/me
 * Returns the current user's role name + all assigned permission keys.
 * Optimized: no ensureRolesAndPermissions (cached in rbac.ts), aggregate pipeline.
 */
export async function GET(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { companyId, userId, role: tokenRole } = decoded;

    await connectToDatabase();

    // Find user's dynamic role assignment (lean = faster, no mongoose overhead)
    const userRoleObj = await UserRole.findOne({ companyId, userId }).populate('roleId').lean();

    let roleName = tokenRole;
    let roleId: any = null;

    if (userRoleObj && (userRoleObj as any).roleId) {
      const roleRecord = (userRoleObj as any).roleId;
      roleName = roleRecord.name;
      roleId = roleRecord._id;
    }

    // Admin gets everything — short-circuit with single fast query
    if (roleName === 'Admin' || roleName === 'Super Admin') {
      const allPerms = await Permission.find({}, { key: 1, _id: 0 }).lean();
      return NextResponse.json({
        role: roleName,
        permissions: (allPerms as any[]).map((p) => p.key),
      });
    }

    // If no dynamic roleId, look up by name
    if (!roleId) {
      const roleDoc = await Role.findOne({ companyId, name: roleName }, { _id: 1 }).lean();
      if (roleDoc) {
        roleId = (roleDoc as any)._id;
        // Self-heal (fire-and-forget, don't await)
        UserRole.updateOne(
          { companyId, userId },
          { $set: { companyId, userId, roleId } },
          { upsert: true }
        ).catch(() => {});
      }
    }

    if (!roleId) {
      return NextResponse.json({ role: roleName, permissions: [] });
    }

    // Fetch mappings with populate to handle schema casting and collection matching robustly
    const mappings = await RolePermission.find({ companyId, roleId }).populate('permissionId').lean();
    const permissionKeys = mappings
      .filter((m: any) => m.permissionId)
      .map((m: any) => m.permissionId.key);

    return NextResponse.json({ role: roleName, permissions: permissionKeys });
  } catch (error: any) {
    console.error('Failed to fetch user permissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch permissions', details: error.message },
      { status: 500 }
    );
  }
}
