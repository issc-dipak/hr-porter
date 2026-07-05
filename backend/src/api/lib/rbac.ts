import connectToDatabase from './mongodb';
import { Role } from '../../models/Role';
import { UserRole } from '../../models/UserRole';
import { RolePermission } from '../../models/RolePermission';
import { Permission } from '../../models/Permission';

/**
 * Checks if a user has a specific permission in their company.
 */
export async function checkUserPermission(
  companyId: string,
  userId: string,
  tokenRole: string,
  requiredPermission: string
): Promise<boolean> {
  // Admin & Super Admin bypass all RBAC checks; Helpdesk ticket raising is allowed for all authenticated users
  if (tokenRole === 'Admin' || tokenRole === 'Super Admin' || requiredPermission === 'helpdesk.raise') {
    return true;
  }

  await connectToDatabase();

  // Find user's dynamic role assignment
  const userRoleObj = await UserRole.findOne({ companyId, userId }).populate('roleId').lean();
  let roleId = userRoleObj ? (userRoleObj as any).roleId?._id : null;
  let roleName = userRoleObj ? (userRoleObj as any).roleId?.name : tokenRole;

  if (roleName === 'Admin' || roleName === 'Super Admin') {
    return true;
  }

  // If no dynamic roleId, look up by name
  if (!roleId) {
    const roleDoc = await Role.findOne({ companyId, name: roleName }).lean();
    if (roleDoc) {
      roleId = (roleDoc as any)._id;
    }
  }

  if (!roleId) {
    return false;
  }

  // Find permission record ID by key
  const permissionDoc = await Permission.findOne({ key: requiredPermission }).lean();
  if (!permissionDoc) {
    // If the permission is not registered in the system database yet, register it dynamically
    const parts = requiredPermission.split('.');
    const moduleName = parts[0] || 'general';
    const newPerm = await Permission.create({
      key: requiredPermission,
      name: requiredPermission.replace('.', ' ').toUpperCase(),
      module: moduleName,
      description: `Dynamically created permission for ${requiredPermission}`
    });
    // By default, since it's new, the role doesn't have it mapped yet
    return false;
  }

  // Check if mapping exists in RolePermission
  const mapping = await RolePermission.findOne({
    companyId,
    roleId,
    permissionId: (permissionDoc as any)._id
  }).lean();

  return !!mapping;
}
