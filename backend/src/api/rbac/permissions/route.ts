import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Permission } from '@/app/api/models/Permission';
import { verifyAuth } from '@/app/api/lib/auth';

export async function GET(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const permissions = await Permission.find({}).sort({ module: 1, key: 1 }).lean();
    return NextResponse.json(permissions, { status: 200 });
  } catch (error: any) {
    console.error('Failed to fetch permissions:', error);
    return NextResponse.json({ error: 'Failed to fetch permissions', details: error.message }, { status: 500 });
  }
}
