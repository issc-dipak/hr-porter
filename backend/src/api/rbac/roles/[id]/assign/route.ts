import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Role } from '@/app/api/models/Role';
import { UserRole } from '@/app/api/models/UserRole';
import { User } from '@/app/api/models/User';
import { RoleActivityLog } from '@/app/api/models/RoleActivityLog';
import { verifyAuth } from '@/app/api/lib/auth';
import { checkUserPermission } from '@/app/api/lib/rbac';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
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
    const { id } = await params;
    const { userIds } = await req.json() as { userIds: string[] };

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'Missing required field: userIds (array)' }, { status: 400 });
    }

    await connectToDatabase();

    // Verify role exists
    const role = await Role.findOne({ _id: id, companyId });
    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    // 1. Find all users currently assigned to this role
    const currentMappings = await UserRole.find({ companyId, roleId: role._id });
    const currentAssignedUserIds = currentMappings.map(m => m.userId);

    // 2. Identify users to unassign (were in currentAssignedUserIds but NOT in userIds)
    const toUnassign = currentAssignedUserIds.filter(uid => !userIds.includes(uid));

    // 3. Map roles for checked users
    for (const userId of userIds) {
      await UserRole.updateOne(
        { companyId, userId },
        { $set: { companyId, userId, roleId: role._id } },
        { upsert: true }
      );

      // Sync to User record
      await User.updateOne({ _id: userId, companyId }, { $set: { role: role.name } });
    }

    // 4. For unchecked users, reassign them back to the default 'Employee' role
    if (toUnassign.length > 0) {
      const employeeRole = await Role.findOne({ companyId, name: 'Employee' });
      if (employeeRole) {
        for (const userId of toUnassign) {
          await UserRole.updateOne(
            { companyId, userId },
            { $set: { companyId, userId, roleId: employeeRole._id } },
            { upsert: true }
          );
          await User.updateOne({ _id: userId, companyId }, { $set: { role: 'Employee' } });
        }
      } else {
        await UserRole.deleteMany({ companyId, userId: { $in: toUnassign } });
        await User.updateMany({ _id: { $in: toUnassign }, companyId }, { $set: { role: 'Employee' } });
      }
    }

    // Log Activity
    const usersInfo = await User.find({ _id: { $in: userIds } });
    const userNames = usersInfo.map(u => u.fullName).join(', ');

    await RoleActivityLog.create({
      companyId,
      roleId: role._id,
      roleName: role.name,
      user: decoded.fullName || decoded.email.split('@')[0],
      email: decoded.email,
      action: 'Assigned User',
      details: `Assigned users [ ${userNames} ] to role "${role.name}".`
    });

    return NextResponse.json({ success: true, message: `Successfully assigned ${userIds.length} users to role ${role.name}` }, { status: 200 });
  } catch (error: any) {
    console.error('Failed to assign users to role:', error);
    return NextResponse.json({ error: 'Failed to assign users', details: error.message }, { status: 500 });
  }
}
