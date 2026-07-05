import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Reimbursement } from '@/app/api/models/Reimbursement';
import { ExpensePolicy } from '@/app/api/models/ExpensePolicy';
import { ExpenseAudit } from '@/app/api/models/ExpenseAudit';
import { Employee } from '@/app/api/models/Employee';
import { verifyAuth } from '@/app/api/lib/auth';
import { sendEmail } from '../../utils/email';
import { buildEmailTemplate, infoTable, infoRow } from '../../utils/emailTemplates';

// GET all expense claims
export async function GET(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = decoded.companyId || 'company_001';

    const url = new URL(req.url);
    const emailFilter = url.searchParams.get('email');
    const statusFilter = url.searchParams.get('status');
    const projectFilter = url.searchParams.get('project');
    const typeFilter = url.searchParams.get('type');
    const branchId = url.searchParams.get('branchId');
    let activeBranchId = branchId;
    if ((decoded.role === 'Branch Admin' || decoded.role === 'HR') && decoded.branchId) {
      activeBranchId = decoded.branchId;
    }

    await connectToDatabase();

    // Query builder
    const filter: any = { companyId };

    // Tenant Isolation & Role Filtering
    if (decoded.role === 'Employee') {
      // Employees can only view their own expenses
      filter.employee = decoded.email.toLowerCase();
    } else if (emailFilter) {
      filter.employee = emailFilter.toLowerCase();
    } else if (activeBranchId) {
      const branchEmployees = await Employee.find({ companyId, branchId: activeBranchId }, { email: 1 });
      const emails = branchEmployees.map(emp => emp.email.toLowerCase());
      filter.employee = { $in: emails };
    }

    if (statusFilter) {
      filter.status = statusFilter;
    }
    if (projectFilter) {
      filter.project = projectFilter;
    }
    if (typeFilter) {
      filter.type = typeFilter;
    }

    const expenses = await Reimbursement.find(filter).sort({ createdAt: -1 });
    return NextResponse.json(expenses, { status: 200 });
  } catch (error: any) {
    console.error('Failed to fetch expenses:', error);
    return NextResponse.json({ error: 'Failed to fetch expenses', details: error.message }, { status: 500 });
  }
}

// POST a new expense claim
export async function POST(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = decoded.companyId || 'company_001';
    const data = await req.json() as any;

    if (!data.amount || !data.description) {
      return NextResponse.json({ error: 'Amount and Description are required' }, { status: 400 });
    }

    await connectToDatabase();

    // Map fields for backwards compatibility
    const expenseType = data.expenseType || data.type || 'Other';
    const amount = Number(data.amount);
    const expenseDate = data.expenseDate || data.claimDate || new Date().toISOString().split('T')[0];
    const status = data.status || 'Submitted'; // Draft or Submitted (which maps to Manager Review)
    const project = data.project || '';
    const department = data.department || decoded.companyName || 'Engineering';
    const receiptUrl = data.receiptUrl || '';

    // 1. Load company policies
    let policy = await ExpensePolicy.findOne({ companyId });
    if (!policy) {
      policy = await ExpensePolicy.create({
        companyId,
        travelLimit: 5000,
        foodLimit: 1500,
        hotelLimit: 8000,
        monthlyBudget: 200000
      });
    }

    // 2. Perform Fraud & Policy violation checks
    const policyViolations: string[] = [];
    let isDuplicateReceipt = false;
    let isDuplicateClaim = false;
    let isSuspiciousAmount = amount > 50000;
    let isRepeatedExpense = false;

    // Check individual policy category limits
    const typeLower = expenseType.toLowerCase();
    if (typeLower.includes('travel') && amount > policy.travelLimit) {
      policyViolations.push(`Expense exceeds travel limit of ₹${policy.travelLimit}.`);
    } else if (typeLower.includes('food') && amount > policy.foodLimit) {
      policyViolations.push(`Expense exceeds food limit of ₹${policy.foodLimit}.`);
    } else if (typeLower.includes('hotel') && amount > policy.hotelLimit) {
      policyViolations.push(`Expense exceeds hotel limit of ₹${policy.hotelLimit}.`);
    }

    // Check monthly budget consumption
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0,0,0,0);

    const userMonthlyExpenses = await Reimbursement.aggregate([
      {
        $match: {
          companyId,
          employee: decoded.email.toLowerCase(),
          status: { $ne: 'Cancelled' },
          createdAt: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);
    const currentMonthTotal = userMonthlyExpenses.length > 0 ? userMonthlyExpenses[0].total : 0;
    if (currentMonthTotal + amount > policy.monthlyBudget) {
      policyViolations.push(`Expense exceeds monthly budget cap of ₹${policy.monthlyBudget}.`);
    }

    // Check duplicate receipts (same company & URL)
    if (receiptUrl) {
      const existingReceipt = await Reimbursement.findOne({
        companyId,
        receiptUrl,
        status: { $ne: 'Cancelled' }
      });
      if (existingReceipt) {
        isDuplicateReceipt = true;
      }
    }

    // Check duplicate claims (same user, same amount, same date, same category)
    const existingClaim = await Reimbursement.findOne({
      companyId,
      employee: decoded.email.toLowerCase(),
      amount,
      type: expenseType,
      claimDate: expenseDate,
      status: { $ne: 'Cancelled' }
    });
    if (existingClaim) {
      isDuplicateClaim = true;
    }

    // Check repeated expenses (more than 3 of the exact same category and amount in the current month)
    const repeatedCount = await Reimbursement.countDocuments({
      companyId,
      employee: decoded.email.toLowerCase(),
      amount,
      type: expenseType,
      status: { $ne: 'Cancelled' },
      createdAt: { $gte: startOfMonth }
    });
    if (repeatedCount >= 3) {
      isRepeatedExpense = true;
    }

    // Risk Score calculation
    let riskScore = 0;
    if (isDuplicateReceipt) riskScore += 50;
    if (isDuplicateClaim) riskScore += 30;
    if (isSuspiciousAmount) riskScore += 20;
    if (isRepeatedExpense) riskScore += 15;
    if (policyViolations.length > 0) riskScore += 20 * policyViolations.length;
    riskScore = Math.min(riskScore, 100);

    // Fetch the employee to check if they have a reporting manager
    const emp = await Employee.findOne({ companyId, email: decoded.email.toLowerCase() });
    let reportingManager = null;
    if (emp && emp.reportingManagerId) {
      reportingManager = await Employee.findById(emp.reportingManagerId);
    }

    // Initial workflow state
    // If user submits the claim (status is not Draft), set to Manager Review if manager exists, else HR Review
    const finalStatus = status === 'Draft'
      ? 'Draft'
      : (reportingManager ? 'Manager Review' : 'HR Review');

    const initialManagerApproval = reportingManager
      ? { status: 'Pending', comment: '' }
      : { status: 'Approved', comment: 'Bypassed (No manager assigned)' };

    // Create the claim
    const newClaim = await Reimbursement.create({
      companyId,
      employee: decoded.email.toLowerCase(),
      employeeId: decoded.userId,
      name: decoded.fullName || decoded.email.split('@')[0],
      type: expenseType,
      expenseType,
      amount,
      claimDate: expenseDate,
      expenseDate,
      description: data.description,
      receiptUrl,
      status: finalStatus,
      project,
      department,
      managerApproval: initialManagerApproval,
      hrApproval: { status: 'Pending', comment: '' },
      financeApproval: { status: 'Pending', comment: '' },
      paidDate: null,
      comments: data.comment ? [{ user: decoded.email, role: decoded.role, text: data.comment, timestamp: new Date() }] : [],
      ocrData: data.ocrData || {},
      fraudCheck: {
        isDuplicateReceipt,
        isDuplicateClaim,
        isSuspiciousAmount,
        isRepeatedExpense,
        policyViolations,
        riskScore
      }
    });

    // Create Audit Log
    await ExpenseAudit.create({
      companyId,
      expenseId: newClaim._id,
      action: status === 'Draft' ? 'Created Draft' : 'Claim Submitted',
      performedBy: decoded.email,
      details: `Submitted claim of ₹${amount} for ${expenseType}. Risk Score: ${riskScore}. Violations: ${policyViolations.length}`
    });

    // In-app Notification for submission
    if (status !== 'Draft') {
      try {
        const { SystemNotificationService } = await import('../../services/systemNotificationService');
        if (finalStatus === 'Manager Review' && reportingManager && reportingManager.email) {
          // Notify the specific manager
          await SystemNotificationService.createNotification({
            companyId,
            userId: reportingManager.email,
            title: 'Expense Claim for Review',
            content: `${newClaim.name} submitted ₹${amount.toLocaleString()} for ${expenseType}.`,
            type: 'expense',
            targetPage: 'my-team'
          });
        } else if (finalStatus === 'HR Review') {
          // Notify Admin / HR
          await SystemNotificationService.notifyRoles(companyId, ['Admin', 'HR'], {
            companyId,
            title: 'New Expense Claim Submitted',
            content: `${newClaim.name} submitted ₹${amount.toLocaleString()} expense for ${expenseType}.`,
            type: 'expense',
            targetPage: 'expenses'
          });
        }
      } catch (notifErr) {
        console.error('Failed to trigger notification:', notifErr);
      }

      // P2 Email: Confirm expense submission to the employee
      try {
        const violationWarning = policyViolations.length > 0
          ? `<div style="margin:16px 0; padding:14px; background:#fef9c3; border-left:4px solid #ca8a04; border-radius:4px;">
              <p style="margin:0 0 6px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:#a16207;">⚠️ Policy Warnings</p>
              <ul style="margin:0; padding-left:18px; font-size:13px; color:#78350f; line-height:1.8;">
                ${policyViolations.map(v => `<li>${v}</li>`).join('')}
              </ul>
             </div>`
          : '';

        const emailBody = `
          <p style="margin:0 0 16px; font-size:15px; color:#0f172a;">
            Your expense claim has been submitted and is currently under review.
          </p>
          ${infoTable(
            infoRow('Amount', `₹${amount.toLocaleString()}`) +
            infoRow('Category', expenseType) +
            infoRow('Date', expenseDate) +
            infoRow('Description', data.description || '—') +
            infoRow('Status', finalStatus)
          )}
          ${violationWarning}
          <p style="margin:16px 0 0; font-size:13px; color:#64748b;">
            You will receive an email as soon as your claim is reviewed. 
            Please retain all receipts and supporting documents.
          </p>
        `;

        const emailHtml = buildEmailTemplate({
          title: '🧾 Expense Claim Submitted',
          preheader: `Your ₹${amount.toLocaleString()} expense claim has been submitted`,
          body: emailBody,
          ctaText: 'View My Expense',
          ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`,
          footerNote: 'Keep your receipts until the claim is fully processed and paid.'
        });

        await sendEmail({
          to: decoded.email,
          subject: `Expense claim ₹${amount.toLocaleString()} submitted successfully`,
          text: `Your expense claim of ₹${amount.toLocaleString()} for ${expenseType} has been submitted and is under review (Status: ${finalStatus}).`,
          html: emailHtml
        });
      } catch (emailErr) {
        console.error('Failed to send expense submission confirmation email:', emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: status === 'Draft' ? 'Draft saved successfully' : 'Expense claim submitted successfully',
      claim: newClaim
    }, { status: 201 });

  } catch (error: any) {
    console.error('Failed to create expense claim:', error);
    return NextResponse.json({ error: 'Failed to submit expense claim', details: error.message }, { status: 500 });
  }
}
