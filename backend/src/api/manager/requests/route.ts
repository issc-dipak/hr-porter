import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '../../lib/mongodb';
import { Employee } from '../../../models/Employee';
import { verifyAuth } from '../../lib/auth';
import { Leave } from '../../../models/Leave';
import { Reimbursement } from '../../../models/Reimbursement';
import { DailyWorkUpdate } from '../../../models/DailyWorkUpdate';

export async function GET(req: NextRequest) {
  const decoded = verifyAuth(req as any);
  if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectToDatabase();

  const companyId = decoded.companyId || 'company_001';

  // Find manager's own employee record
  const managerEmployee = await Employee.findOne({
    companyId,
    email: decoded.email,
  }).lean();

  if (!managerEmployee) {
    return NextResponse.json({ error: 'Manager employee record not found' }, { status: 404 });
  }

  const managerId = (managerEmployee as any)._id.toString();

  // Find all employees reporting to this manager
  const teamMembers = await Employee.find({
    companyId,
    reportingManagerId: managerId,
    isActive: true,
  })
    .select('_id fullName email department designation profilePicture empId')
    .lean();

  const teamEmails = teamMembers.map((e: any) => e.email);
  const teamIds = teamMembers.map((e: any) => new mongoose.Types.ObjectId(e._id.toString()));
  const teamByEmail: Record<string, any> = {};
  teamMembers.forEach((e: any) => { teamByEmail[e.email] = e; });

  // Pending leave requests from team
  const pendingLeaves = await Leave.find({
    companyId,
    employee: { $in: teamEmails },
    status: 'Pending',
  }).sort({ createdAt: -1 }).limit(50).lean();

  // Pending expense claims from team
  const pendingExpenses = await Reimbursement.find({
    companyId,
    employee: { $in: teamEmails },
    status: { $in: ['Submitted', 'Manager Review'] },
  }).sort({ createdAt: -1 }).limit(50).lean();

  // Recent DSR submissions from team (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  let recentDsrs: any[] = [];
  try {
    recentDsrs = await DailyWorkUpdate.find({
      companyId,
      employeeId: { $in: teamIds },
      date: { $gte: sevenDaysAgo },
    }).sort({ date: -1 }).limit(30).lean();
  } catch (_) {}

  // Shape results
  const leaves = pendingLeaves.map((l: any) => ({
    _id: l._id,
    type: 'leave',
    subType: l.type,
    employeeName: l.name,
    employeeEmail: l.employee,
    employeeAvatar: teamByEmail[l.employee]?.profilePicture || '',
    department: l.dept,
    date: l.date,
    duration: l.duration,
    reason: l.reason,
    status: l.status,
    createdAt: l.createdAt,
  }));

  const expenses = pendingExpenses.map((e: any) => ({
    _id: e._id,
    type: 'expense',
    subType: e.expenseType || e.type,
    employeeName: e.name,
    employeeEmail: e.employee,
    employeeAvatar: teamByEmail[e.employee]?.profilePicture || '',
    amount: e.amount,
    date: e.expenseDate || e.claimDate,
    description: e.description,
    status: e.status,
    createdAt: e.createdAt,
  }));

  const dsrs = recentDsrs.map((d: any) => ({
    _id: d._id,
    type: 'dsr',
    employeeId: d.employeeId,
    date: d.date,
    status: d.status,
    createdAt: d.createdAt,
  }));

  return NextResponse.json({
    pendingLeaves: leaves,
    pendingExpenses: expenses,
    recentDsrs: dsrs,
    totalPending: leaves.length + expenses.length,
  });
}

export async function PUT(req: NextRequest) {
  const decoded = verifyAuth(req as any);
  if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectToDatabase();

  const body = (await req.json()) as any;
  const { id, requestType, action, comment } = body;

  if (!id || !requestType || !action) {
    return NextResponse.json({ error: 'Missing required fields: id, requestType, action' }, { status: 400 });
  }

  const validActions = ['Approved', 'Rejected'];
  if (!validActions.includes(action)) {
    return NextResponse.json({ error: 'Invalid action. Use Approved or Rejected.' }, { status: 400 });
  }

  const companyId = decoded.companyId || 'company_001';

  if (requestType === 'leave') {
    const leave = await Leave.findByIdAndUpdate(
      id,
      { status: action },
      { new: true }
    );
    if (!leave) return NextResponse.json({ error: 'Leave not found' }, { status: 404 });

    // Notify employee about manager's action
    try {
      const { SystemNotificationService } = await import('../../../services/systemNotificationService');
      await SystemNotificationService.createNotification({
        companyId,
        userId: leave.employee,
        title: `Leave Request ${action}`,
        content: `Your leave request for ${leave.date} has been ${action.toLowerCase()} by your manager.`,
        type: 'leave',
        targetPage: 'leaves'
      });
    } catch (err) {
      console.error('Failed to send leave update notification:', err);
    }

    return NextResponse.json({ success: true, leave });
  }

  if (requestType === 'expense') {
    const update: any = {
      status: action === 'Approved' ? 'HR Review' : 'Rejected',
      'managerApproval.status': action,
      'managerApproval.approvedBy': decoded.email,
      'managerApproval.approvedAt': new Date(),
    };
    if (comment) update['managerApproval.comment'] = comment;

    const expense = await Reimbursement.findByIdAndUpdate(id, update, { new: true });
    if (!expense) return NextResponse.json({ error: 'Expense not found' }, { status: 404 });

    // Notify employee about manager's action
    try {
      const { SystemNotificationService } = await import('../../../services/systemNotificationService');
      await SystemNotificationService.createNotification({
        companyId,
        userId: expense.employee,
        title: `Expense Claim ${action}`,
        content: `Your expense claim of ₹${expense.amount.toLocaleString()} has been ${action.toLowerCase()} by your manager.`,
        type: 'payroll',
        targetPage: 'expenses'
      });

      if (action === 'Approved') {
        // Notify HR and Admins that an expense is pending their review
        await SystemNotificationService.notifyRoles(companyId, ['Admin', 'HR'], {
          companyId,
          title: 'Expense Claim Pending HR Clearance',
          content: `${expense.name}'s claim of ₹${expense.amount.toLocaleString()} has been approved by manager and is pending review.`,
          type: 'payroll',
          targetPage: 'payroll'
        });
      }
    } catch (err) {
      console.error('Failed to send expense update notifications:', err);
    }

    return NextResponse.json({ success: true, expense });
  }

  return NextResponse.json({ error: 'Invalid requestType' }, { status: 400 });
}
