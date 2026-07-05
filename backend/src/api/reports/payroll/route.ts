import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Payroll } from '@/app/api/models/Payroll';
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
      filter.branchId = branchId;
    }
    const payrolls = await Payroll.find(filter);

    let totalPayroll = 0;
    let totalBonuses = 0;
    let totalDeductions = 0;
    let totalBasic = 0;
    let totalHra = 0;

    payrolls.forEach(p => {
      // Sum up only paid or approved payrolls
      totalPayroll += (Number(p.net) || 0);
      totalBonuses += (Number(p.bonus) || 0);
      totalBasic += (Number(p.basic) || 0);
      totalHra += (Number(p.hra) || 0);
      
      const deduct = (Number(p.pf) || 0) + (Number(p.esi) || 0) + (Number(p.tax) || 0) + (Number(p.otherDeductions) || 0) + (Number(p.leaveDeductions) || 0);
      totalDeductions += deduct;
    });

    // Salary Distribution by Bands
    const bands = {
      'Below 30K': 0,
      '30K - 50K': 0,
      '50K - 80K': 0,
      'Above 80K': 0
    };

    payrolls.forEach(p => {
      const netVal = Number(p.net) || 0;
      if (netVal < 30000) bands['Below 30K']++;
      else if (netVal >= 30000 && netVal < 50000) bands['30K - 50K']++;
      else if (netVal >= 50000 && netVal < 80000) bands['50K - 80K']++;
      else bands['Above 80K']++;
    });

    const salaryDistribution = Object.entries(bands).map(([band, count]) => ({
      band,
      count
    }));

    // Payroll History - group by month
    const historyMap: Record<string, { net: number; gross: number; count: number }> = {};
    payrolls.forEach(p => {
      const m = p.month || 'Other';
      if (!historyMap[m]) {
        historyMap[m] = { net: 0, gross: 0, count: 0 };
      }
      historyMap[m].net += (Number(p.net) || 0);
      historyMap[m].gross += (Number(p.gross) || 0);
      historyMap[m].count += 1;
    });

    const history = Object.entries(historyMap).map(([month, data]) => ({
      month,
      net: data.net,
      gross: data.gross,
      count: data.count
    })).sort((a, b) => {
      // Simple sort by month date parsing
      const parseMonth = (mStr: string) => {
        const parts = mStr.split(' ');
        if (parts.length === 2) {
          const monthIndex = new Date(Date.parse(parts[0] + " 1, 2012")).getMonth();
          return new Date(Number(parts[1]), monthIndex, 1).getTime();
        }
        return 0;
      };
      return parseMonth(a.month) - parseMonth(b.month);
    });

    return NextResponse.json({
      summary: {
        totalPayroll,
        totalBonuses,
        totalDeductions,
        totalBasic,
        totalHra
      },
      salaryDistribution,
      history
    }, { status: 200 });

  } catch (error: any) {
    console.error('Failed to fetch payroll reports:', error);
    return NextResponse.json({ error: 'Failed to fetch payroll reports', details: error.message }, { status: 500 });
  }
}

