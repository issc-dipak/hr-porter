import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { User } from '@/app/api/models/User';
import bcrypt from 'bcryptjs';
import { verifyAuth } from '@/app/api/lib/auth';

export async function POST(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json() as any;

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Please provide current and new passwords' }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findById(decoded.userId).select('+password');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password || '');
    if (!isMatch) {
      return NextResponse.json({ error: 'Incorrect current password' }, { status: 400 });
    }

    // Hash and save new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    await user.save();

    return NextResponse.json({ message: 'Password changed successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Password change error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}

