import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Employee } from '@/app/api/models/Employee';
import { DeletedEmployee } from '@/app/api/models/DeletedEmployee';
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
    
    // Fetch active employees
    const activeFilter: any = { companyId, status: 'Active' };
    if (branchId) {
      activeFilter.branchId = branchId;
    }
    const activeEmployees = await Employee.find(activeFilter);
    const activeCount = activeEmployees.length;

    // Fetch deleted employees (attrition)
    // Deleted employees collection has companyId index if supported, otherwise just query
    let deletedCount = 0;
    try {
      deletedCount = await DeletedEmployee.countDocuments({ companyId });
    } catch (err) {
      console.warn("DeletedEmployee collection query fallback:", err);
      // Fallback in case of missing index or field
      deletedCount = await DeletedEmployee.countDocuments({});
    }

    const totalHeadcount = activeCount + deletedCount;
    const retentionRate = totalHeadcount > 0 ? Math.round((activeCount / totalHeadcount) * 100) : 0;
    const attritionRate = totalHeadcount > 0 ? Math.round((deletedCount / totalHeadcount) * 100) : 0;

    // Department Distribution
    const deptsMap: Record<string, number> = {};
    activeEmployees.forEach(e => {
      const d = e.department || 'General';
      deptsMap[d] = (deptsMap[d] || 0) + 1;
    });

    const departmentDistribution = Object.entries(deptsMap).map(([name, count]) => {
      const percentage = activeCount > 0 ? Math.round((count / activeCount) * 100) : 0;
      return {
        name,
        count,
        percentage
      };
    });

    // Gender Distribution
    const genderMap: Record<string, number> = {
      Male: 0,
      Female: 0,
      Other: 0
    };

    activeEmployees.forEach(e => {
      const g = e.gender || 'Male'; // default male if unpopulated
      if (g.toLowerCase().startsWith('m')) genderMap.Male++;
      else if (g.toLowerCase().startsWith('f')) genderMap.Female++;
      else genderMap.Other++;
    });

    const genderDistribution = Object.entries(genderMap).map(([gender, count]) => ({
      gender,
      count,
      percentage: activeCount > 0 ? Math.round((count / activeCount) * 100) : 0
    }));

    // Demographics by Location
    const locMap: Record<string, number> = {};
    activeEmployees.forEach(e => {
      const loc = e.location || 'Remote';
      locMap[loc] = (locMap[loc] || 0) + 1;
    });

    const locationDistribution = Object.entries(locMap).map(([location, count]) => ({
      location,
      count
    }));

    // Employee Growth Trend (group by join month)
    const growthMap: Record<string, number> = {};
    activeEmployees.forEach(e => {
      if (e.joinedDate) {
        const monthStr = new Date(e.joinedDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        growthMap[monthStr] = (growthMap[monthStr] || 0) + 1;
      }
    });

    // Sort growth trends by date chronologically
    const growthTrend = Object.entries(growthMap)
      .map(([month, count]) => ({
        month,
        count
      }))
      .sort((a,b) => new Date(a.month).getTime() - new Date(b.month).getTime());

    // Cumulative growth
    let cumulative = 0;
    const cumulativeGrowthTrend = growthTrend.map(item => {
      cumulative += item.count;
      return {
        month: item.month,
        hired: item.count,
        total: cumulative
      };
    });

    return NextResponse.json({
      summary: {
        activeCount,
        deletedCount,
        retentionRate,
        attritionRate
      },
      departmentDistribution,
      genderDistribution,
      locationDistribution,
      growthTrend: cumulativeGrowthTrend
    }, { status: 200 });

  } catch (error: any) {
    console.error('Failed to fetch workforce reports:', error);
    return NextResponse.json({ error: 'Failed to fetch workforce reports', details: error.message }, { status: 500 });
  }
}

