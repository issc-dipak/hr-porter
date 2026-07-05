import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { ExpensePolicy } from '@/app/api/models/ExpensePolicy';
import { ExpenseAudit } from '@/app/api/models/ExpenseAudit';
import { verifyAuth } from '@/app/api/lib/auth';

// GET company policy
export async function GET(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = decoded.companyId || 'company_001';

    await connectToDatabase();

    let policy = await ExpensePolicy.findOne({ companyId });
    if (!policy) {
      // Create a default policy if none exists
      policy = await ExpensePolicy.create({
        companyId,
        travelLimit: 5000,
        foodLimit: 1500,
        hotelLimit: 8000,
        monthlyBudget: 200000,
        departmentBudget: {
          Engineering: 100000,
          Sales: 150000,
          HR: 50000,
          Marketing: 80000,
          Finance: 120000
        }
      });
    }

    return NextResponse.json(policy, { status: 200 });
  } catch (error: any) {
    console.error('Failed to fetch expense policy:', error);
    return NextResponse.json({ error: 'Failed to fetch expense policy', details: error.message }, { status: 500 });
  }
}

// POST or update company policy
export async function POST(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Only Admin or HR roles can modify policy
    if (decoded.role !== 'Admin' && decoded.role !== 'HR' && decoded.role !== 'Super Admin') {
      return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 });
    }
    const companyId = decoded.companyId || 'company_001';
    const data = await req.json() as any;

    await connectToDatabase();

    let policy = await ExpensePolicy.findOne({ companyId });
    if (policy) {
      // Update existing
      if (data.travelLimit !== undefined) policy.travelLimit = data.travelLimit;
      if (data.foodLimit !== undefined) policy.foodLimit = data.foodLimit;
      if (data.hotelLimit !== undefined) policy.hotelLimit = data.hotelLimit;
      if (data.monthlyBudget !== undefined) policy.monthlyBudget = data.monthlyBudget;
      if (data.departmentBudget !== undefined) {
        policy.departmentBudget = data.departmentBudget;
      }
      await policy.save();
    } else {
      // Create new
      policy = await ExpensePolicy.create({
        companyId,
        ...data
      });
    }

    // Record audit trace
    try {
      await ExpenseAudit.create({
        companyId,
        expenseId: 'POLICY_UPDATE',
        action: 'POLICY_UPDATED',
        performedBy: decoded.email,
        details: `Updated policy limits: Travel ₹${policy.travelLimit}, Food ₹${policy.foodLimit}, Hotel ₹${policy.hotelLimit}`
      });
    } catch (auditErr) {
      console.error('Failed to create policy audit log:', auditErr);
    }

    return NextResponse.json({ message: 'Policy updated successfully', policy }, { status: 200 });
  } catch (error: any) {
    console.error('Failed to update expense policy:', error);
    return NextResponse.json({ error: 'Failed to update expense policy', details: error.message }, { status: 500 });
  }
}
