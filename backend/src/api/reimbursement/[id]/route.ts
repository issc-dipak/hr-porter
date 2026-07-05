import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Reimbursement } from '@/app/api/models/Reimbursement';
import { verifyAuth } from '@/app/api/lib/auth';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { status, comment } = await req.json() as any;
    const { id } = await params;
    
    if (!status || !['Approved', 'Rejected', 'Pending'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status provided' }, { status: 400 });
    }

    await connectToDatabase();

    const claim = await Reimbursement.findById(id);
    if (!claim) {
      return NextResponse.json({ error: 'Reimbursement claim not found' }, { status: 404 });
    }
    if (claim.companyId !== decoded.companyId) {
      return NextResponse.json({ error: 'Forbidden: You do not own this record' }, { status: 403 });
    }

    claim.status = status;
    if (comment !== undefined) {
      claim.comment = comment;
    }
    await claim.save();

    // Notify candidate/employee about the status update
    try {
      const { SystemNotificationService } = await import('../../../services/systemNotificationService');
      if (claim.employee) {
        await SystemNotificationService.createNotification({
          companyId: claim.companyId || decoded.companyId,
          userId: claim.employee,
          title: `Expense Claim ${status}`,
          content: `Your expense claim of ₹${claim.amount.toLocaleString()} for "${claim.name}" has been ${status.toLowerCase()}.`,
          type: 'payroll',
          targetPage: 'payroll'
        });
      }
    } catch (notifErr) {
      console.error('Failed to trigger reimbursement status update notification:', notifErr);
    }

    return NextResponse.json(
      { message: `Reimbursement ${status.toLowerCase()} successfully`, claim },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Failed to update reimbursement claim:', error);
    return NextResponse.json({ error: 'Failed to update reimbursement claim', details: error.message }, { status: 500 });
  }
}
