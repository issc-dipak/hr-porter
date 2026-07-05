import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { PayoutTransaction } from '@/app/api/models/PayoutTransaction';
import { verifyAuth } from '@/app/api/lib/auth';

// GET all payout transactions for the company (HR / Finance / Admin only)
export async function GET(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Tenant Isolation
    const companyId = decoded.companyId || 'company_001';

    // Access control: only management can see payout logs
    if (!['Admin', 'HR', 'Manager', 'Super Admin'].includes(decoded.role) && !decoded.email.toLowerCase().includes('finance')) {
      // Allow employee to view only their own payouts if requested
      const url = new URL(req.url);
      const viewSelfOnly = url.searchParams.get('self') === 'true';
      if (viewSelfOnly) {
        await connectToDatabase();
        const txs = await PayoutTransaction.find({ companyId, employeeId: decoded.userId }).sort({ processedAt: -1 });
        return NextResponse.json(txs, { status: 200 });
      }
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectToDatabase();

    const transactions = await PayoutTransaction.find({ companyId }).sort({ processedAt: -1 });
    return NextResponse.json(transactions, { status: 200 });

  } catch (error: any) {
    console.error('Failed to fetch payout transactions:', error);
    return NextResponse.json({ error: 'Failed to fetch payout transactions', details: error.message }, { status: 500 });
  }
}
