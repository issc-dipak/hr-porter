import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Reimbursement } from '@/app/api/models/Reimbursement';
import { ExpenseAudit } from '@/app/api/models/ExpenseAudit';
import { ExpensePolicy } from '@/app/api/models/ExpensePolicy';
import { verifyAuth } from '@/app/api/lib/auth';
import { sendEmail } from '../../../utils/email';
import { buildEmailTemplate, infoTable, infoRow, statusPill } from '../../../utils/emailTemplates';

// PUT update or process approval workflow on a claim
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = decoded.companyId || 'company_001';
    const { id } = await params;
    const body = await req.json() as any;

    await connectToDatabase();

    const claim = await Reimbursement.findById(id);
    if (!claim) {
      return NextResponse.json({ error: 'Expense claim not found' }, { status: 404 });
    }
    if (claim.companyId !== companyId) {
      return NextResponse.json({ error: 'Forbidden: Tenant isolation violation' }, { status: 403 });
    }

    // 1. Workflow Actions (Approve, Reject, Request Changes, Mark Paid)
    if (body.action) {
      const { action, comment } = body;
      const userEmail = decoded.email;
      const userRole = decoded.role; // Admin, HR, Manager, Employee

      const commentObj = {
        user: userEmail,
        role: userRole,
        text: comment || `${action} action performed`,
        timestamp: new Date()
      };

      if (!claim.comments) claim.comments = [];
      claim.comments.push(commentObj);

      let prevStatus = claim.status;
      let newStatus = claim.status;
      let auditDetail = '';

      if (action === 'Request Changes') {
        newStatus = 'Returned For Changes';
        auditDetail = `Requested changes at state ${prevStatus}`;
      } else if (action === 'Reject') {
        newStatus = 'Rejected';
        auditDetail = `Rejected claim at state ${prevStatus}`;
      } else if (action === 'Approve') {
        if (prevStatus === 'Manager Review') {
          claim.managerApproval = {
            status: 'Approved',
            approvedBy: userEmail,
            approvedAt: new Date(),
            comment: comment || ''
          };
          newStatus = 'HR Review';
          auditDetail = 'Manager approved claim; transitioned to HR Review';
        } else if (prevStatus === 'HR Review') {
          claim.hrApproval = {
            status: 'Approved',
            approvedBy: userEmail,
            approvedAt: new Date(),
            comment: comment || ''
          };
          newStatus = 'Approved';
          auditDetail = 'HR approved claim; ready for payout';
        }
      } else if (action === 'Mark Paid') {
        // Check and deduct from Company Payout Vault (Wallet)
        const { Wallet } = await import('../../../models/Wallet');
        let wallet = await Wallet.findOne({ companyId });
        if (!wallet) {
          wallet = await Wallet.create({ companyId, balance: 0, transactions: [] });
        }
        if (wallet.balance < claim.amount) {
          return NextResponse.json({ error: `Insufficient vault balance. Required: ₹${claim.amount.toLocaleString()}, Available: ₹${wallet.balance.toLocaleString()}.` }, { status: 400 });
        }
        wallet.balance -= claim.amount;
        const transactionId = `DEB-MAN-${Date.now()}`;
        wallet.transactions.push({
          companyId,
          transactionId,
          amount: claim.amount,
          type: 'Debit',
          description: `Manual Reimbursement Payout: ${claim.description || claim.type || 'Reimbursement Payout'}`
        });
        await wallet.save();

        // Log manual payout transaction
        try {
          const { PayoutTransaction } = await import('../../../models/PayoutTransaction');
          const { User } = await import('../../../models/User');
          const employeeObj = await User.findOne({ email: claim.employee.toLowerCase() });
          const employeeId = employeeObj?._id?.toString() || claim.employeeId || claim.employee;

          await PayoutTransaction.create({
            companyId,
            employeeId,
            expenseId: claim._id.toString(),
            amount: claim.amount,
            payoutProvider: 'RazorpayX',
            payoutReference: `pay_ref_manual_${Date.now()}_${claim._id.toString().slice(-6)}`,
            transactionId,
            paymentMethod: 'IMPS',
            status: 'Paid',
            processedAt: new Date()
          });
        } catch (txErr) {
          console.error('[Manual Payout Transaction Log Error]:', txErr);
        }

        // Finance processes payment
        newStatus = 'Paid';
        claim.paidDate = new Date();
        auditDetail = 'Finance processed payment; claim marked as Paid and debited from Company Payout Vault';
      } else if (action === 'Submit' && prevStatus === 'Draft') {
        newStatus = 'HR Review';
        auditDetail = 'Submitted draft for HR Review';
      } else if (action === 'Cancel') {
        newStatus = 'Cancelled';
        auditDetail = 'Employee cancelled the expense claim';
      }

      claim.status = newStatus;
      await claim.save();

      // Trigger automatic payout if claim is approved
      if (newStatus === 'Approved') {
        try {
          const { PayoutService } = await import('../../../services/payoutService');
          PayoutService.triggerPayout(claim._id.toString(), userEmail).catch(err => {
            console.error('[Payout Async Trigger Error]:', err);
          });
        } catch (payoutErr) {
          console.error('[Payout Import Error]:', payoutErr);
        }
      }

      // Log Audit Trail
      await ExpenseAudit.create({
        companyId,
        expenseId: claim._id,
        action: `WORKFLOW_${action.toUpperCase().replace(' ', '_')}`,
        performedBy: userEmail,
        details: `${auditDetail}. Comment: "${comment || ''}"`
      });

      // Send System In-App Notification to employee
      try {
        const { SystemNotificationService } = await import('../../../services/systemNotificationService');
        await SystemNotificationService.createNotification({
          companyId,
          userId: claim.employee, // User's email
          title: `Expense Claim: ${newStatus}`,
          content: `Your expense claim of ₹${claim.amount.toLocaleString()} for "${claim.type}" is now: ${newStatus}.`,
          type: 'expense',
          targetPage: 'expenses'
        });
      } catch (notifErr) {
        console.error('Failed to trigger workflow notification:', notifErr);
      }

      // P2 Email: Expense approved or rejected → notify employee
      if ((newStatus === 'Approved' || newStatus === 'Rejected' || newStatus === 'Paid' || newStatus === 'Returned For Changes') && claim.employee) {
        try {
          const pillColor =
            newStatus === 'Approved' || newStatus === 'Paid' ? 'green' :
            newStatus === 'Rejected' ? 'red' : 'amber';

          const emailBody = `
            <p style="margin:0 0 16px; font-size:15px; color:#0f172a;">
              Your expense claim status has been updated to: ${statusPill(newStatus, pillColor)}
            </p>
            ${infoTable(
              infoRow('Amount', `₹${claim.amount.toLocaleString()}`) +
              infoRow('Category', claim.type || claim.expenseType || 'N/A') +
              infoRow('Expense Date', claim.claimDate || claim.expenseDate || 'N/A') +
              infoRow('Updated By', decoded.fullName || decoded.role) +
              (comment ? infoRow('Comment / Reason', comment) : '')
            )}
            <p style="margin:16px 0 0; font-size:13px; color:#64748b;">
              ${newStatus === 'Approved'
                ? 'Your claim has been approved and will be processed for reimbursement soon.'
                : newStatus === 'Paid'
                ? 'Your reimbursement has been processed and the amount will be credited to your account.'
                : newStatus === 'Rejected'
                ? 'Your expense claim was rejected. Please contact HR or your manager for more information.'
                : 'Some changes were requested for your expense claim. Please review and resubmit.'
              }
            </p>
          `;

          const emailHtml = buildEmailTemplate({
            title:
              newStatus === 'Approved' || newStatus === 'Paid' ? '✅ Expense Claim Approved' :
              newStatus === 'Rejected' ? '❌ Expense Claim Rejected' :
              '⚠️ Changes Requested on Expense Claim',
            preheader: `Your ₹${claim.amount.toLocaleString()} expense claim status: ${newStatus}`,
            body: emailBody,
            ctaText: 'View Expense Details',
            ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`,
          });

          await sendEmail({
            to: claim.employee,
            subject: `Expense claim ₹${claim.amount.toLocaleString()} — ${newStatus}`,
            text: `Your expense claim of ₹${claim.amount.toLocaleString()} for ${claim.type} has been ${newStatus}.${comment ? ' Comment: ' + comment : ''}`,
            html: emailHtml
          });
        } catch (emailErr) {
          console.error('Failed to send expense outcome email to employee:', emailErr);
        }
      }

      return NextResponse.json({
        success: true,
        message: `Claim successfully updated to ${newStatus}`,
        claim
      }, { status: 200 });
    }

    // 2. Draft / Claim Edits (Allows employee to edit a draft or a returned claim)
    if (claim.status !== 'Draft' && claim.status !== 'Returned For Changes') {
      return NextResponse.json({ error: 'Only drafts or claims returned for changes can be edited' }, { status: 400 });
    }

    // If updating standard fields
    if (body.amount !== undefined) claim.amount = Number(body.amount);
    if (body.expenseType !== undefined) {
      claim.expenseType = body.expenseType;
      claim.type = body.expenseType;
    }
    if (body.expenseDate !== undefined) {
      claim.expenseDate = body.expenseDate;
      claim.claimDate = body.expenseDate;
    }
    if (body.description !== undefined) claim.description = body.description;
    if (body.receiptUrl !== undefined) claim.receiptUrl = body.receiptUrl;
    if (body.project !== undefined) claim.project = body.project;
    if (body.department !== undefined) claim.department = body.department;
    if (body.ocrData !== undefined) claim.ocrData = body.ocrData;

    // Re-check fraud / policies if they edited the claim
    let policy = await ExpensePolicy.findOne({ companyId });
    if (policy) {
      const policyViolations: string[] = [];
      const typeLower = (claim.expenseType || claim.type || '').toLowerCase();
      const amount = claim.amount;

      if (typeLower.includes('travel') && amount > policy.travelLimit) {
        policyViolations.push(`Expense exceeds travel limit of ₹${policy.travelLimit}.`);
      } else if (typeLower.includes('food') && amount > policy.foodLimit) {
        policyViolations.push(`Expense exceeds food limit of ₹${policy.foodLimit}.`);
      } else if (typeLower.includes('hotel') && amount > policy.hotelLimit) {
        policyViolations.push(`Expense exceeds hotel limit of ₹${policy.hotelLimit}.`);
      }

      // Recheck duplicate receipt
      let isDuplicateReceipt = false;
      if (claim.receiptUrl) {
        const existingReceipt = await Reimbursement.findOne({
          companyId,
          _id: { $ne: claim._id },
          receiptUrl: claim.receiptUrl,
          status: { $ne: 'Cancelled' }
        });
        if (existingReceipt) {
          isDuplicateReceipt = true;
        }
      }

      // Recheck duplicate claim
      const existingClaim = await Reimbursement.findOne({
        companyId,
        _id: { $ne: claim._id },
        employee: claim.employee,
        amount,
        type: claim.type,
        claimDate: claim.claimDate,
        status: { $ne: 'Cancelled' }
      });
      const isDuplicateClaim = !!existingClaim;

      let riskScore = 0;
      if (isDuplicateReceipt) riskScore += 50;
      if (isDuplicateClaim) riskScore += 30;
      if (claim.amount > 50000) riskScore += 20;
      if (policyViolations.length > 0) riskScore += 20 * policyViolations.length;
      riskScore = Math.min(riskScore, 100);

      claim.fraudCheck = {
        isDuplicateReceipt,
        isDuplicateClaim,
        isSuspiciousAmount: claim.amount > 50000,
        isRepeatedExpense: claim.fraudCheck?.isRepeatedExpense || false,
        policyViolations,
        riskScore
      };
    }

    if (body.status === 'Submitted') {
      claim.status = 'HR Review';
    }

    await claim.save();

    // Log Audit Trail
    await ExpenseAudit.create({
      companyId,
      expenseId: claim._id,
      action: 'CLAIM_EDITED',
      performedBy: decoded.email,
      details: `Edited claim properties. Amount: ₹${claim.amount}. Status: ${claim.status}`
    });

    return NextResponse.json({
      success: true,
      message: 'Claim updated successfully',
      claim
    }, { status: 200 });

  } catch (error: any) {
    console.error('Failed to update expense claim:', error);
    return NextResponse.json({ error: 'Failed to update expense claim', details: error.message }, { status: 500 });
  }
}

// DELETE a claim (Only permitted if status is Draft)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = decoded.companyId || 'company_001';
    const { id } = await params;

    await connectToDatabase();

    const claim = await Reimbursement.findById(id);
    if (!claim) {
      return NextResponse.json({ error: 'Expense claim not found' }, { status: 404 });
    }
    if (claim.companyId !== companyId) {
      return NextResponse.json({ error: 'Forbidden: Tenant isolation violation' }, { status: 403 });
    }

    // Only drafts can be deleted permanently, others must be cancelled
    if (claim.status !== 'Draft') {
      return NextResponse.json({ error: 'Only draft claims can be deleted. Submitted claims must be Cancelled instead.' }, { status: 400 });
    }

    await Reimbursement.findByIdAndDelete(id);

    // Audit Log
    await ExpenseAudit.create({
      companyId,
      expenseId: id,
      action: 'CLAIM_DELETED',
      performedBy: decoded.email,
      details: `Deleted draft expense claim of ₹${claim.amount}`
    });

    return NextResponse.json({
      success: true,
      message: 'Draft claim deleted successfully'
    }, { status: 200 });

  } catch (error: any) {
    console.error('Failed to delete expense claim:', error);
    return NextResponse.json({ error: 'Failed to delete expense claim', details: error.message }, { status: 500 });
  }
}
