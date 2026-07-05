import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Employee } from '@/app/api/models/Employee';
import { SalaryRevision } from '../../models/SalaryRevision';
import { verifyAuth } from '@/app/api/lib/auth';
import { AuditLog } from '@/app/api/models/AuditLog';

// Helper to calculate salary summary
export function calculateSalary(s: any) {
  const grossSalary = (s.basic || 0) + (s.hra || 0) + (s.medicalAllowance || 0) + 
    (s.travelAllowance || 0) + (s.specialAllowance || 0) + (s.otherEarnings || 0) + (s.bonus || 0);
  const totalDeductions = (s.pf || 0) + (s.esi || 0) + (s.professionalTax || 0) + 
    (s.tds || s.tax || 0) + (s.otherDeductions || 0);
  const netSalary = Math.max(0, grossSalary - totalDeductions);
  const monthlyCTC = grossSalary + (s.pf || 0);
  const annualCTC = monthlyCTC * 12;
  return { grossSalary, totalDeductions, netSalary, monthlyCTC, annualCTC };
}

// GET /api/salary — List all employee salary structures for company
export async function GET(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    const url = new URL(req.url);
    const employeeId = url.searchParams.get('employeeId');
    
    if (employeeId) {
      // Return single employee salary
      const emp = await Employee.findOne({ _id: employeeId, companyId: decoded.companyId });
      if (!emp) {
        return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
      }
      
      // Get revision history for this employee
      const revisions = await SalaryRevision.find({ 
        companyId: decoded.companyId, 
        employeeId: employeeId 
      }).sort({ createdAt: -1 }).limit(10);
      
      return NextResponse.json({
        employee: emp,
        salaryStructure: emp.salaryStructure,
        revisions
      }, { status: 200 });
    }

    // Return all employees with salary
    const employees = await Employee.find({ 
      companyId: decoded.companyId,
      isActive: true
    }).select('_id empId fullName email department designation joinedDate salaryStructure status').sort({ fullName: 1 });

    // Get pending revision counts
    const pendingRevisions = await SalaryRevision.countDocuments({ 
      companyId: decoded.companyId, 
      status: 'Pending' 
    });

    const totalPayrollCost = employees.reduce((sum, emp) => {
      return sum + (emp.salaryStructure?.monthlyCTC || emp.salaryStructure?.net || 0);
    }, 0);

    return NextResponse.json({
      employees,
      totalPayrollCost,
      pendingRevisions,
      totalEmployees: employees.length
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('Failed to fetch salary data:', error);
    return NextResponse.json({ error: 'Failed to fetch salary data', details: error.message }, { status: 500 });
  }
}

// PUT /api/salary — Update employee salary structure
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
    const { employeeId, salaryStructure } = body;

    if (!employeeId || !salaryStructure) {
      return NextResponse.json({ error: 'employeeId and salaryStructure are required' }, { status: 400 });
    }

    const emp = await Employee.findOne({ _id: employeeId, companyId: decoded.companyId });
    if (!emp) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Calculate derived fields
    const { grossSalary, totalDeductions, netSalary, monthlyCTC, annualCTC } = calculateSalary(salaryStructure);
    
    const updatedStructure = {
      ...salaryStructure,
      grossSalary,
      totalDeductions,
      net: netSalary,
      monthlyCTC,
      annualCTC,
      // Keep backward compat aliases
      allowance: salaryStructure.specialAllowance || salaryStructure.allowance || 0,
      tax: salaryStructure.tds || salaryStructure.tax || 0,
    };

    const updatedEmp = await Employee.findByIdAndUpdate(
      employeeId,
      { $set: { salaryStructure: updatedStructure } },
      { new: true, runValidators: false }
    );

    // Audit log
    try {
      await AuditLog.create({
        companyId: decoded.companyId,
        action: 'Salary Updated',
        performedBy: decoded.email,
        details: `Salary structure updated for ${emp.fullName} (${emp.email}). New monthly CTC: ₹${monthlyCTC.toLocaleString()}`,
      });
    } catch (auditErr) {
      console.error('Audit log failed:', auditErr);
    }

    return NextResponse.json({ 
      message: 'Salary structure updated successfully', 
      employee: updatedEmp 
    }, { status: 200 });

  } catch (error: any) {
    console.error('Failed to update salary:', error);
    return NextResponse.json({ error: 'Failed to update salary', details: error.message }, { status: 500 });
  }
}
