import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { PayoutTransaction } from '@/app/api/models/PayoutTransaction';
import { Reimbursement } from '@/app/api/models/Reimbursement';
import { User } from '@/app/api/models/User';
import { ExpenseAudit } from '@/app/api/models/ExpenseAudit';
import { SystemNotificationService } from '@/app/services/systemNotificationService';
import { sendEmail } from '@/app/utils/email';

export async function POST(req: Request) {
  try {
    const payload = await req.json() as any;
    console.log('[Webhook Receiver] Incoming payout event:', JSON.stringify(payload));

    // Support both RazorpayX style (payload.payout) and generic simulator styles
    const event = payload.event || payload.action || 'payout_success';
    
    // Parse references
    let referenceId = '';
    let transactionId = '';
    let utr = '';
    let failureReason = '';

    if (payload.payload?.payout?.entity) {
      // Standard RazorpayX webhook format
      const entity = payload.payload.payout.entity;
      referenceId = entity.reference_id;
      transactionId = entity.id;
      utr = entity.utr || '';
      failureReason = entity.failure_reason || '';
    } else {
      // Simulator or fallback format
      referenceId = payload.payoutReference || payload.referenceId || '';
      transactionId = payload.transactionId || '';
      utr = payload.utr || '';
      failureReason = payload.errorMessage || payload.reason || '';
    }

    if (!referenceId && !transactionId) {
      return NextResponse.json({ error: 'Missing reference_id or transaction_id in webhook payload' }, { status: 400 });
    }

    await connectToDatabase();

    // Find transaction record
    const query: any = {};
    if (referenceId) query.payoutReference = referenceId;
    else if (transactionId) query.transactionId = transactionId;

    const tx = await PayoutTransaction.findOne(query);
    if (!tx) {
      console.warn(`[Webhook Warning] PayoutTransaction not found for Ref: ${referenceId}, TxId: ${transactionId}`);
      return NextResponse.json({ message: 'Transaction not tracked or found' }, { status: 200 }); // Return 200 so gateway doesn't retry
    }

    const claim = await Reimbursement.findById(tx.expenseId);
    if (!claim) {
      console.warn(`[Webhook Warning] Reimbursement claim not found for ID: ${tx.expenseId}`);
      return NextResponse.json({ message: 'Reimbursement claim not found' }, { status: 200 });
    }

    const employee = await User.findOne({ email: claim.employee.toLowerCase() });
    const eventLower = event.toLowerCase();

    let newTxStatus = tx.status;
    let newClaimStatus = claim.status;
    let auditAction = '';
    let auditDetails = '';

    // Handle Event States
    if (eventLower.includes('success') || eventLower.includes('processed')) {
      newTxStatus = 'Paid';
      newClaimStatus = 'Paid';
      claim.paidDate = new Date();
      
      auditAction = 'PAYOUT_SETTLED';
      auditDetails = `Payout successful. Transac UTR: ${utr || transactionId}. Ref: ${tx.payoutReference}`;

      // Append comment
      if (!claim.comments) claim.comments = [];
      claim.comments.push({
        user: 'system@hrcore.com',
        role: 'Admin',
        text: `Payout settled successfully via webhook. UTR: ${utr || 'N/A'}.`,
        timestamp: new Date()
      });

      // Notification
      if (employee) {
        await SystemNotificationService.createNotification({
          companyId: tx.companyId,
          userId: employee.email,
          title: 'Reimbursement Payout Successful!',
          content: `Your reimbursement of ₹${claim.amount.toLocaleString()} has been successfully paid to your bank account.`,
          type: 'payroll',
          targetPage: 'payroll'
        });

        await sendEmail({
          to: employee.email,
          subject: 'Reimbursement Disbursed Successfully',
          text: `Hi ${employee.fullName},\n\nYour reimbursement of INR ${claim.amount} is paid.\nUTR ID: ${utr || transactionId}\nReference: ${tx.payoutReference}\n\nHR System`,
          html: `<p>Hi ${employee.fullName},</p><p>Great news! Your reimbursement payout of <strong>INR ${claim.amount}</strong> is successful.</p><p><strong>UTR/Tx ID:</strong> ${utr || transactionId}</p><p><strong>Reference:</strong> ${tx.payoutReference}</p>`
        });
      }

    } else if (eventLower.includes('failed')) {
      newTxStatus = 'Failed';
      newClaimStatus = 'Approved'; // revert so finance can resolve / retry
      tx.errorMessage = failureReason || 'Gateway payout failed';

      auditAction = 'PAYOUT_FAILED';
      auditDetails = `Payout failed via webhook. Reason: ${failureReason || 'Unknown Gateway Error'}. Ref: ${tx.payoutReference}`;

      if (!claim.comments) claim.comments = [];
      claim.comments.push({
        user: 'system@hrcore.com',
        role: 'Admin',
        text: `Payout failed: ${failureReason || 'Gateway Error'}`,
        timestamp: new Date()
      });

      if (employee) {
        await SystemNotificationService.createNotification({
          companyId: tx.companyId,
          userId: employee.email,
          title: 'Reimbursement Payout Failed',
          content: `Your payout of ₹${claim.amount.toLocaleString()} failed: ${failureReason || 'Gateway error'}`,
          type: 'payroll',
          targetPage: 'payroll'
        });

        await sendEmail({
          to: employee.email,
          subject: 'Action Required: Payout Failed',
          text: `Hi ${employee.fullName},\n\nYour reimbursement of INR ${claim.amount} failed.\nReason: ${failureReason}\n\nPlease check your bank credentials.\n\nHR System`,
          html: `<p>Hi ${employee.fullName},</p><p>Your reimbursement payout of <strong>INR ${claim.amount}</strong> failed.</p><p><strong>Reason:</strong> ${failureReason || 'Gateway Error'}</p><p>Please review your banking details in the portal.</p>`
        });
      }

    } else if (eventLower.includes('reversed')) {
      newTxStatus = 'Reversed';
      newClaimStatus = 'Approved'; // Reverted
      tx.errorMessage = failureReason || 'Gateway transaction reversed';

      auditAction = 'PAYOUT_REVERSED';
      auditDetails = `Payout reversed by bank gateway. Ref: ${tx.payoutReference}`;

      if (!claim.comments) claim.comments = [];
      claim.comments.push({
        user: 'system@hrcore.com',
        role: 'Admin',
        text: `Payout reversed by partner bank: ${failureReason || 'Transaction reversed'}`,
        timestamp: new Date()
      });

      if (employee) {
        await SystemNotificationService.createNotification({
          companyId: tx.companyId,
          userId: employee.email,
          title: 'Reimbursement Payout Reversed',
          content: `Your payout of ₹${claim.amount.toLocaleString()} was reversed by the bank gateway.`,
          type: 'payroll',
          targetPage: 'payroll'
        });
      }
    }

    // Save updates
    tx.status = newTxStatus;
    await tx.save();

    claim.status = newClaimStatus;
    await claim.save();

    await ExpenseAudit.create({
      companyId: tx.companyId,
      expenseId: claim._id,
      action: auditAction,
      performedBy: 'webhook@payoutprovider.com',
      details: auditDetails
    });

    return NextResponse.json({ success: true, message: `Processed ${event} successfully` }, { status: 200 });

  } catch (error: any) {
    console.error('Webhook endpoint error:', error);
    return NextResponse.json({ error: 'Webhook processing error', details: error.message }, { status: 500 });
  }
}
