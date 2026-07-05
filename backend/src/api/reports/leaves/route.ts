import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Leave } from '@/app/api/models/Leave';
import { verifyAuth } from '@/app/api/lib/auth';

export async function GET(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded || (decoded.role !== 'Admin' && decoded.role !== 'HR')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const companyId = decoded.companyId || 'company_001';
    const { searchParams } = new URL(req.url);
    const department = searchParams.get('department');
    const employeeName = searchParams.get('employee');
    const leaveType = searchParams.get('leaveType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    let branchId = searchParams.get('branchId');
    if (decoded.role === 'HR' && decoded.branchId) {
      branchId = decoded.branchId;
    }

    const filter: any = { companyId };

    if (department) filter.dept = department;
    if (employeeName) filter.name = { $regex: employeeName, $options: 'i' };
    if (leaveType) filter.type = leaveType;
    if (branchId) filter.branchId = branchId;
    
    // Date filter on string date field or createdAt
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const leaves = await Leave.find(filter);

    const pending = leaves.filter(l => l.status === 'Pending' || l.status === 'pending').length;
    const approved = leaves.filter(l => l.status === 'Approved' || l.status === 'approved').length;
    const rejected = leaves.filter(l => l.status === 'Rejected' || l.status === 'rejected').length;

    // Leave type distribution
    const typeDistribution: Record<string, number> = {};
    leaves.forEach(l => {
      const type = l.type || 'Annual Leave';
      typeDistribution[type] = (typeDistribution[type] || 0) + 1;
    });

    const leaveTypes = Object.entries(typeDistribution).map(([name, count]) => ({
      name,
      count
    }));

    // Balance/Usage by department
    const deptUsage: Record<string, number> = {};
    leaves.forEach(l => {
      if (l.status === 'Approved' || l.status === 'approved') {
        const dept = l.dept || 'General';
        deptUsage[dept] = (deptUsage[dept] || 0) + 1;
      }
    });

    const departmentUsage = Object.entries(deptUsage).map(([dept, count]) => ({
      department: dept,
      count
    }));

    // Leave trends - group by month of creation
    const monthlyTrends: Record<string, number> = {};
    leaves.forEach(l => {
      const dateVal = l.createdAt ? new Date(l.createdAt) : new Date();
      const monthStr = dateVal.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      monthlyTrends[monthStr] = (monthlyTrends[monthStr] || 0) + 1;
    });

    const trends = Object.entries(monthlyTrends).map(([month, count]) => ({
      month,
      count
    })).sort((a,b) => new Date(a.month).getTime() - new Date(b.month).getTime());

    return NextResponse.json({
      summary: {
        pending,
        approved,
        rejected,
        total: leaves.length
      },
      leaveTypes,
      departmentUsage,
      trends
    }, { status: 200 });

  } catch (error: any) {
    console.error('Failed to fetch leaves reports:', error);
    return NextResponse.json({ error: 'Failed to fetch leaves reports', details: error.message }, { status: 500 });
  }
}

