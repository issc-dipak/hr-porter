import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { User } from '@/app/api/models/User';
import { UserRole } from '@/app/api/models/UserRole';
import { Role } from '@/app/api/models/Role';
import { verifyAuth } from '@/app/api/lib/auth';

export async function GET(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Fetch all users in the company
    const users = await User.find({ companyId: decoded.companyId }).select('-password').lean();

    // Fetch all role mappings
    const mappings = await UserRole.find({ companyId: decoded.companyId }).populate('roleId').lean();

    // Map roles to users
    const usersWithRoles = users.map((u: any) => {
      const mapping = mappings.find((m: any) => String(m.userId) === String(u._id));
      const roleName = mapping && (mapping as any).roleId ? (mapping as any).roleId.name : u.role || 'Employee';
      return {
        _id: u._id,
        name: u.name,
        email: u.email,
        designation: u.designation || '',
        department: u.department || '',
        role: roleName,
        status: u.status || 'Active'
      };
    });

    return NextResponse.json(usersWithRoles, { status: 200 });
  } catch (error: any) {
    console.error('Failed to fetch users for RBAC:', error);
    return NextResponse.json({ error: 'Failed to fetch users', details: error.message }, { status: 500 });
  }
}
