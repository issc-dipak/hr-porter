import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Performance } from '@/app/api/models/Performance';
import { Employee } from '@/app/api/models/Employee';
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
    let branchId = searchParams.get('branchId');
    if (decoded.role === 'HR' && decoded.branchId) {
      branchId = decoded.branchId;
    }

    const filter: any = { companyId };
    if (branchId) {
      const branchEmployees = await Employee.find({ companyId, branchId }, { fullName: 1 });
      const names = branchEmployees.map(emp => emp.fullName);
      filter.name = { $in: names };
    }
    const performances = await Performance.find(filter);

    // Summary stats
    const avgScore = performances.length > 0
      ? (performances.reduce((sum, p) => sum + (Number(p.rating) || 0), 0) / performances.length)
      : 0.0;
    
    // Top performers (Rating >= 4.5)
    const topPerformers = performances
      .filter(p => Number(p.rating) >= 4.5)
      .map(p => ({
        name: p.name,
        department: p.dept,
        rating: p.rating,
        status: p.status
      }))
      .sort((a,b) => b.rating - a.rating)
      .slice(0, 10);

    // Rating distribution
    const bands = {
      'Needs Improvement (<3)': 0,
      'Meets Expectations (3-4)': 0,
      'Exceeds Expectations (4-4.5)': 0,
      'Outstanding (>=4.5)': 0
    };

    performances.forEach(p => {
      const r = Number(p.rating) || 0;
      if (r < 3) bands['Needs Improvement (<3)']++;
      else if (r >= 3 && r < 4) bands['Meets Expectations (3-4)']++;
      else if (r >= 4 && r < 4.5) bands['Exceeds Expectations (4-4.5)']++;
      else bands['Outstanding (>=4.5)']++;
    });

    const ratingDistribution = Object.entries(bands).map(([name, count]) => ({
      name,
      count
    }));

    // Department averages
    const deptTotals: Record<string, { sum: number; count: number }> = {};
    performances.forEach(p => {
      const dept = p.dept || 'General';
      if (!deptTotals[dept]) {
        deptTotals[dept] = { sum: 0, count: 0 };
      }
      deptTotals[dept].sum += (Number(p.rating) || 0);
      deptTotals[dept].count += 1;
    });

    const departmentPerformance = Object.entries(deptTotals).map(([department, data]) => ({
      department,
      average: parseFloat((data.sum / data.count).toFixed(2))
    }));

    return NextResponse.json({
      summary: {
        averageRating: parseFloat(avgScore.toFixed(2)),
        totalEvaluated: performances.length,
        topPerformersCount: topPerformers.length
      },
      topPerformers,
      ratingDistribution,
      departmentPerformance
    }, { status: 200 });

  } catch (error: any) {
    console.error('Failed to fetch performance reports:', error);
    return NextResponse.json({ error: 'Failed to fetch performance reports', details: error.message }, { status: 500 });
  }
}

