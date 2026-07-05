import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '../../lib/mongodb';
import { Employee } from '../../../models/Employee';
import { verifyAuth } from '../../lib/auth';

// GET /api/manager/eligible?excludeId=<employeeId>
// Returns list of eligible managers (active employees in same company)
export async function GET(req: NextRequest) {
  const decoded = verifyAuth(req as any);
  if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectToDatabase();

  const companyId = decoded.companyId || 'company_001';
  const url = new URL(req.url);
  const excludeId = url.searchParams.get('excludeId') || '';
  const search = url.searchParams.get('search') || '';
  const branchId = url.searchParams.get('branchId') || '';

  const query: any = {
    companyId,
    isActive: true,
  };

  if (excludeId) {
    const mongoose = await import('mongoose');
    try {
      query._id = { $ne: new mongoose.default.Types.ObjectId(excludeId) };
    } catch (_) {
      query._id = { $ne: excludeId };
    }
  }

  if (branchId) {
    query.branchId = branchId;
  }

  if (search) {
    query.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { designation: { $regex: search, $options: 'i' } },
    ];
  }

  const managers = await Employee.find(query)
    .select('_id fullName email designation department profilePicture phone')
    .sort({ fullName: 1 })
    .limit(50)
    .lean();

  return NextResponse.json(managers);
}
