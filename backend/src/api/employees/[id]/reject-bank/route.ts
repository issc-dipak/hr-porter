import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Employee } from '@/app/api/models/Employee';
import { verifyAuth } from '@/app/api/lib/auth';
import { AuditLog } from '@/app/api/models/AuditLog';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded || (decoded.role !== 'Admin' && decoded.role !== 'HR')) {
      return NextResponse.json({ error: 'Unauthorized: Admin or HR access required' }, { status: 401 });
    }

    const { id } = await params;
    await connectToDatabase();

    const employee = await Employee.findById(id);
    if (!employee) {
      return NextResponse.json({ error: 'Employee record not found' }, { status: 404 });
    }

    (employee as any).bankVerificationStatus = 'Rejected';
    (employee as any).pendingBankDetails = null;

    await employee.save();

    // Create Audit Log
    await AuditLog.create({
      companyId: decoded.companyId,
      action: 'Bank Details Rejected',
      performedBy: decoded.email,
      details: `Rejected updated bank details request for employee ${employee.fullName} (${employee.email}).`,
      ipAddress: '127.0.0.1'
    });

    // Notify employee
    try {
      const { SystemNotificationService } = await import('../../../../services/systemNotificationService');
      await SystemNotificationService.createNotification({
        companyId: employee.companyId || decoded.companyId,
        userId: employee.email,
        title: 'Bank Details Verification Rejected',
        content: 'Your salary account bank details request has been rejected. Please verify your details or raise a ticket.',
        type: 'other',
        targetPage: 'settings'
      });
    } catch (notifErr) {
      console.error('Failed to send notification for bank details rejection:', notifErr);
    }

    return NextResponse.json({ message: 'Bank details verification request rejected successfully', employee }, { status: 200 });
  } catch (error: any) {
    console.error('Reject bank details error:', error);
    return NextResponse.json({ error: 'Failed to reject bank details', details: error.message }, { status: 500 });
  }
}
