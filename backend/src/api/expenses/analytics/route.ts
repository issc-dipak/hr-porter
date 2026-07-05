import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Reimbursement } from '@/app/api/models/Reimbursement';
import { ExpensePolicy } from '@/app/api/models/ExpensePolicy';
import { ExpenseAudit } from '@/app/api/models/ExpenseAudit';
import { PayoutTransaction } from '@/app/api/models/PayoutTransaction';
import { Employee } from '@/app/api/models/Employee';
import { verifyAuth } from '@/app/api/lib/auth';

export async function GET(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = decoded.companyId || 'company_001';

    await connectToDatabase();

    // Load active company policy to check budget consumption
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

    const url = new URL(req.url);
    const branchId = url.searchParams.get('branchId');
    let activeBranchId = branchId;
    if ((decoded.role === 'Branch Admin' || decoded.role === 'HR') && decoded.branchId) {
      activeBranchId = decoded.branchId;
    }

    let branchEmployeeEmails: string[] = [];
    let branchEmployeeIds: string[] = [];
    if (activeBranchId) {
      const branchEmployees = await Employee.find({ companyId, branchId: activeBranchId }, { email: 1 });
      branchEmployeeEmails = branchEmployees.map(emp => emp.email.toLowerCase());
      branchEmployeeIds = branchEmployees.map(emp => emp._id.toString());
    }

    // Fetch all claims for this company to run calculations (highly robust and handles empty/mock states gracefully)
    const claimsFilter: any = { companyId };
    if (activeBranchId) {
      claimsFilter.employee = { $in: branchEmployeeEmails };
    }
    const claims = await Reimbursement.find(claimsFilter);

    // Fetch payout transactions stats
    const payoutsFilter: any = { companyId };
    if (activeBranchId) {
      payoutsFilter.employeeId = { $in: branchEmployeeIds };
    }
    const payoutsList = await PayoutTransaction.find(payoutsFilter);
    let totalPayoutVolume = 0;
    let failedPayoutsCount = 0;
    const failedPayoutsList: any[] = [];

    payoutsList.forEach(p => {
      if (p.status === 'Paid') {
        totalPayoutVolume += p.amount;
      } else if (p.status === 'Failed') {
        failedPayoutsCount += 1;
        failedPayoutsList.push({
          id: p._id,
          transactionId: p.transactionId,
          payoutReference: p.payoutReference,
          amount: p.amount,
          error: p.errorMessage || 'Unknown Error',
          processedAt: p.processedAt
        });
      }
    });

    // Calculate core metrics
    let totalReimbursed = 0; // Status: Paid
    let totalPending = 0;    // Status: Submitted, Manager Review, HR Review, Finance Approval
    let totalApproved = 0;   // Status: Approved (Finance approved but not paid)
    let totalRejected = 0;   // Status: Rejected
    let monthlyCost = 0;     // Sum of Paid & Approved in current month
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const categoryBreakdown: Record<string, number> = {};
    const departmentBreakdown: Record<string, number> = {};
    const monthlyTrends: Record<string, number> = {};
    const employeeBreakdown: Record<string, { name: string, total: number, count: number }> = {};
    
    let highRiskCount = 0;
    const highValueClaims: any[] = [];
    const recentAudits: any[] = [];

    // Initialize categories with 0 for clean chart defaults
    const categoriesList = ['Travel', 'Fuel', 'Food', 'Hotel', 'Internet', 'Mobile Bill', 'Medical', 'Office Supplies', 'Training', 'Client Meeting', 'Other'];
    categoriesList.forEach(cat => {
      categoryBreakdown[cat] = 0;
    });

    claims.forEach(c => {
      const amt = c.amount || 0;
      const cDate = c.createdAt ? new Date(c.createdAt) : new Date();

      // Core counters
      if (c.status === 'Paid') {
        totalReimbursed += amt;
      } else if (c.status === 'Rejected') {
        totalRejected += amt;
      } else if (c.status === 'Approved') {
        totalApproved += amt;
      } else if (c.status !== 'Draft' && c.status !== 'Cancelled') {
        totalPending += amt;
      }

      // Filter current month cost
      if (cDate.getMonth() === currentMonth && cDate.getFullYear() === currentYear && c.status !== 'Cancelled' && c.status !== 'Rejected' && c.status !== 'Draft') {
        monthlyCost += amt;
      }

      // Category breakdown (Paid, Approved, Pending)
      if (c.status !== 'Draft' && c.status !== 'Cancelled' && c.status !== 'Rejected') {
        const cat = c.type || c.expenseType || 'Other';
        categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + amt;
      }

      // Department breakdown (Paid, Approved, Pending)
      if (c.status !== 'Draft' && c.status !== 'Cancelled' && c.status !== 'Rejected') {
        const dept = c.department || 'General';
        departmentBreakdown[dept] = (departmentBreakdown[dept] || 0) + amt;
      }

      // Monthly trends (Last 6 months)
      if (c.status !== 'Draft' && c.status !== 'Cancelled' && c.status !== 'Rejected') {
        const monthYear = cDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        monthlyTrends[monthYear] = (monthlyTrends[monthYear] || 0) + amt;
      }

      // Employee breakdown
      if (c.status !== 'Draft' && c.status !== 'Cancelled' && c.status !== 'Rejected') {
        const empEmail = c.employee;
        if (!employeeBreakdown[empEmail]) {
          employeeBreakdown[empEmail] = { name: c.name || empEmail.split('@')[0], total: 0, count: 0 };
        }
        employeeBreakdown[empEmail].total += amt;
        employeeBreakdown[empEmail].count += 1;
      }

      // Fraud checks count
      if (c.fraudCheck && c.fraudCheck.riskScore && c.fraudCheck.riskScore >= 50) {
        highRiskCount += 1;
      }

      // High value claims definition (> ₹15,000)
      if (amt >= 15000 && c.status !== 'Draft' && c.status !== 'Cancelled') {
        highValueClaims.push({
          id: c._id,
          name: c.name,
          employee: c.employee,
          amount: amt,
          type: c.type || c.expenseType,
          status: c.status,
          date: c.claimDate || c.expenseDate
        });
      }
    });

    // Format monthly trends for Recharts
    const trendData = Object.entries(monthlyTrends).map(([month, amount]) => ({
      month,
      amount
    })).slice(-6); // Limit to last 6 months

    // Format category data
    const categoryData = Object.entries(categoryBreakdown).map(([name, value]) => ({
      name,
      value
    })).filter(item => item.value > 0);

    // Format department data
    const departmentData = Object.entries(departmentBreakdown).map(([name, value]) => ({
      name,
      value,
      budget: (policy.departmentBudget && typeof (policy.departmentBudget as any).get === 'function')
        ? (policy.departmentBudget as any).get(name) || 50000
        : (policy.departmentBudget as any)?.[name] || 50000
    }));

    // Format employee list
    const employeeData = Object.entries(employeeBreakdown).map(([email, info]) => ({
      email,
      name: info.name,
      total: info.total,
      count: info.count
    })).sort((a,b) => b.total - a.total).slice(0, 5);

    // Load recent Audit trails
    let audits: any[] = [];
    try {
      const auditsFilter: any = { companyId };
      if (branchId) {
        const expenseIds = claims.map(c => c._id.toString());
        auditsFilter.expenseId = { $in: expenseIds };
      }
      audits = await ExpenseAudit.find(auditsFilter).sort({ timestamp: -1 }).limit(10);
    } catch (auditErr) {
      console.warn('Could not load audits for analytics:', auditErr);
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalReimbursed,
        totalPending,
        totalApproved,
        totalRejected,
        monthlyCost,
        budgetConsumption: Math.min(Math.round((monthlyCost / policy.monthlyBudget) * 100), 100),
        monthlyBudgetLimit: policy.monthlyBudget,
        highRiskCount,
        totalPayoutVolume,
        failedPayoutsCount
      },
      charts: {
        categoryData,
        departmentData,
        trendData,
        employeeData
      },
      highValueClaims: highValueClaims.sort((a,b) => b.amount - a.amount).slice(0, 5),
      recentAudits: audits,
      failedPayoutsList
    }, { status: 200 });

  } catch (error: any) {
    console.error('Analytics aggregation failed:', error);
    return NextResponse.json({ error: 'Failed to aggregate analytics', details: error.message }, { status: 500 });
  }
}
