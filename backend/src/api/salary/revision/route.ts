import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Employee } from '@/app/api/models/Employee';
import { SalaryRevision } from '../../../models/SalaryRevision';
import { verifyAuth } from '@/app/api/lib/auth';
import { AuditLog } from '@/app/api/models/AuditLog';
import { calculateSalary } from '../route';

// GET /api/salary/revision — List revisions for company
export async function GET(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const employeeId = url.searchParams.get('employeeId');

    const filter: any = { companyId: decoded.companyId };
    if (status) filter.status = status;
    if (employeeId) filter.employeeId = employeeId;

    const revisions = await SalaryRevision.find(filter)
      .sort({ createdAt: -1 })
      .limit(100);

    return NextResponse.json(revisions, { status: 200 });
  } catch (error: any) {
    console.error('Failed to fetch salary revisions:', error);
    return NextResponse.json({ error: 'Failed to fetch salary revisions' }, { status: 500 });
  }
}

// POST /api/salary/revision — Create a new salary revision request
export async function POST(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['Admin', 'HR'].includes(decoded.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    await connectToDatabase();
    const body = await req.json() as any;
    const { employeeId, revisionType, newSalary, reason, effectiveDate, approvedBy, notes } = body;

    if (!employeeId || !revisionType || !newSalary || !reason || !effectiveDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const emp = await Employee.findOne({ _id: employeeId, companyId: decoded.companyId });
    if (!emp) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Build old salary snapshot
    const oldStruct: any = emp.salaryStructure || {};
    const oldCalc = calculateSalary(oldStruct);
    const oldSalary = {
      basic: oldStruct.basic || 0,
      hra: oldStruct.hra || 0,
      medicalAllowance: oldStruct.medicalAllowance || 0,
      travelAllowance: oldStruct.travelAllowance || 0,
      specialAllowance: oldStruct.specialAllowance || oldStruct.allowance || 0,
      otherEarnings: oldStruct.otherEarnings || 0,
      bonus: oldStruct.bonus || 0,
      pf: oldStruct.pf || 0,
      esi: oldStruct.esi || 0,
      professionalTax: oldStruct.professionalTax || 0,
      tds: oldStruct.tds || oldStruct.tax || 0,
      otherDeductions: oldStruct.otherDeductions || 0,
      grossSalary: oldCalc.grossSalary,
      totalDeductions: oldCalc.totalDeductions,
      netSalary: oldCalc.netSalary,
      monthlyCTC: oldCalc.monthlyCTC,
      annualCTC: oldCalc.annualCTC,
    };

    // Calculate new salary fields
    const newCalc = calculateSalary(newSalary);
    const newSalarySnapshot = {
      ...newSalary,
      grossSalary: newCalc.grossSalary,
      totalDeductions: newCalc.totalDeductions,
      netSalary: newCalc.netSalary,
      monthlyCTC: newCalc.monthlyCTC,
      annualCTC: newCalc.annualCTC,
    };

    const incrementAmount = newCalc.monthlyCTC - oldCalc.monthlyCTC;
    const incrementPercent = oldCalc.monthlyCTC > 0 
      ? Number(((incrementAmount / oldCalc.monthlyCTC) * 100).toFixed(2)) 
      : 0;

    const revision = await SalaryRevision.create({
      companyId: decoded.companyId,
      employeeId: emp._id.toString(),
      employeeEmail: emp.email,
      employeeName: emp.fullName,
      department: emp.department,
      designation: emp.designation,
      revisionType,
      oldSalary,
      newSalary: newSalarySnapshot,
      incrementAmount,
      incrementPercent,
      reason,
      effectiveDate: new Date(effectiveDate),
      approvedBy: approvedBy || '',
      status: decoded.role === 'Admin' ? 'Approved' : 'Pending',
      notes: notes || '',
    });

    // If Admin creates, auto-approve and apply immediately
    if (decoded.role === 'Admin') {
      await Employee.findByIdAndUpdate(
        employeeId,
        { $set: { salaryStructure: { ...newSalary, ...newCalc, net: newCalc.netSalary, tax: newSalary.tds || 0, allowance: newSalary.specialAllowance || 0 } } },
        { runValidators: false }
      );
      revision.approvedAt = new Date();
      await revision.save();
    }

    // Audit log
    try {
      await AuditLog.create({
        companyId: decoded.companyId,
        action: 'Salary Revision Created',
        performedBy: decoded.email,
        details: `Salary revision (${revisionType}) created for ${emp.fullName}. Change: ₹${Math.abs(incrementAmount).toLocaleString()} (${incrementPercent > 0 ? '+' : ''}${incrementPercent}%)`,
      });
    } catch (err) { /* ignore audit errors */ }

    return NextResponse.json({ message: 'Salary revision created successfully', revision }, { status: 201 });

  } catch (error: any) {
    console.error('Failed to create salary revision:', error);
    return NextResponse.json({ error: 'Failed to create salary revision', details: error.message }, { status: 500 });
  }
}

// PUT /api/salary/revision — Approve or Reject a revision
export async function PUT(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['Admin', 'HR'].includes(decoded.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    await connectToDatabase();
    const body = await req.json() as any;
    const { revisionId, action, rejectionReason } = body; // action: 'approve' | 'reject'

    if (!revisionId || !action) {
      return NextResponse.json({ error: 'revisionId and action are required' }, { status: 400 });
    }

    const revision = await SalaryRevision.findOne({ _id: revisionId, companyId: decoded.companyId });
    if (!revision) {
      return NextResponse.json({ error: 'Revision not found' }, { status: 404 });
    }

    if (revision.status !== 'Pending') {
      return NextResponse.json({ error: 'Revision already processed' }, { status: 400 });
    }

    if (action === 'approve') {
      revision.status = 'Approved';
      revision.approvedBy = decoded.email;
      revision.approvedAt = new Date();

      // Apply new salary to employee
      const newS = revision.newSalary;
      await Employee.findByIdAndUpdate(
        revision.employeeId,
        { $set: { salaryStructure: {
          basic: newS.basic,
          hra: newS.hra,
          medicalAllowance: newS.medicalAllowance,
          travelAllowance: newS.travelAllowance,
          specialAllowance: newS.specialAllowance,
          otherEarnings: newS.otherEarnings,
          allowance: newS.specialAllowance,
          bonus: newS.bonus,
          pf: newS.pf,
          esi: newS.esi,
          professionalTax: newS.professionalTax,
          tds: newS.tds,
          tax: newS.tds,
          otherDeductions: newS.otherDeductions,
          grossSalary: newS.grossSalary,
          totalDeductions: newS.totalDeductions,
          net: newS.netSalary,
          monthlyCTC: newS.monthlyCTC,
          annualCTC: newS.annualCTC,
        }}},
        { runValidators: false }
      );

    } else if (action === 'reject') {
      revision.status = 'Rejected';
      revision.rejectionReason = rejectionReason || 'No reason provided';
    } else {
      return NextResponse.json({ error: 'Invalid action. Use "approve" or "reject"' }, { status: 400 });
    }

    await revision.save();

    // Audit log
    try {
      await AuditLog.create({
        companyId: decoded.companyId,
        action: `Salary Revision ${action === 'approve' ? 'Approved' : 'Rejected'}`,
        performedBy: decoded.email,
        details: `Revision for ${revision.employeeName} ${action === 'approve' ? 'approved and applied' : 'rejected'}.`,
      });
    } catch (err) { /* ignore */ }

    return NextResponse.json({ message: `Revision ${action}d successfully`, revision }, { status: 200 });

  } catch (error: any) {
    console.error('Failed to process revision:', error);
    return NextResponse.json({ error: 'Failed to process revision', details: error.message }, { status: 500 });
  }
}
