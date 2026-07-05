import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { User } from '@/app/api/models/User';
import { Employee } from '@/app/api/models/Employee';
import { verifyAuth } from '@/app/api/lib/auth';

// GET all users (Admin only)
export async function GET(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded || decoded.role !== 'Admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin role required.' }, { status: 403 });
    }

    await connectToDatabase();
    const users = await User.find({ companyId: decoded.companyId }, '-password').sort({ createdAt: -1 });
    return NextResponse.json(users, { status: 200 });
  } catch (error: any) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json({ error: 'Failed to fetch users', details: error.message }, { status: 500 });
  }
}

// PUT to update user role (Admin only)
export async function PUT(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded || decoded.role !== 'Admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin role required.' }, { status: 403 });
    }

    const { userId, role, department } = await req.json() as any;

    if (!userId || !role) {
      return NextResponse.json({ error: 'Missing userId or role' }, { status: 400 });
    }

    if (!['Admin', 'HR', 'Employee'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    if (user.companyId !== decoded.companyId) {
      return NextResponse.json({ error: 'Forbidden: You do not own this user record' }, { status: 403 });
    }

    user.role = role;
    if (department) user.department = department;
    await user.save();

    // Also update matching employee record role/designation/department
    const designation = role === 'Admin' ? 'System Administrator' : role === 'HR' ? 'HR Manager' : 'Software Engineer';
    const dept = department || (role === 'HR' ? 'HR' : role === 'Admin' ? 'Management' : 'Engineering');
    
    await Employee.findOneAndUpdate(
      { email: user.email },
      { $set: { designation, department: dept } }
    );

    return NextResponse.json({ message: 'User role updated successfully', user }, { status: 200 });
  } catch (error: any) {
    console.error('Failed to update user role:', error);
    return NextResponse.json({ error: 'Failed to update user', details: error.message }, { status: 500 });
  }
}

// DELETE user and corresponding employee record (Admin only)
export async function DELETE(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded || decoded.role !== 'Admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin role required.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    if (user.companyId !== decoded.companyId) {
      return NextResponse.json({ error: 'Forbidden: You do not own this user record' }, { status: 403 });
    }

    // Don't allow deleting self
    if (user._id.toString() === decoded.userId) {
      return NextResponse.json({ error: 'Cannot delete your own admin account.' }, { status: 400 });
    }

    // Delete user and employee
    await User.findByIdAndDelete(userId);
    await Employee.findOneAndDelete({ email: user.email });

    return NextResponse.json({ message: 'User account and employee profile deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Failed to delete user:', error);
    return NextResponse.json({ error: 'Failed to delete user', details: error.message }, { status: 500 });
  }
}

