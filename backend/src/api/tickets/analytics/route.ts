import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Ticket } from '@/app/api/models/Ticket';
import { verifyAuth } from '@/app/api/lib/auth';

export async function GET(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { companyId, role } = decoded;
    if (role !== 'HR' && role !== 'Admin') {
      return NextResponse.json({ error: 'Access denied: HR/Admin only' }, { status: 403 });
    }

    await connectToDatabase();

    const tickets = await Ticket.find({ companyId });

    // 1. Core Card Metrics
    const totalTickets = tickets.length;
    const openTickets = tickets.filter(t => ['Open', 'Assigned', 'In Progress', 'Waiting for Employee', 'Reopened'].includes(t.status)).length;
    const closedTickets = tickets.filter(t => ['Resolved', 'Closed'].includes(t.status)).length;
    const inProgress = tickets.filter(t => t.status === 'In Progress').length;
    const highPriorityTickets = tickets.filter(t => ['High', 'Urgent'].includes(t.priority) && !['Resolved', 'Closed'].includes(t.status)).length;

    // Resolved today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const resolvedToday = tickets.filter(t => 
      ['Resolved', 'Closed'].includes(t.status) && 
      new Date(t.updatedAt) >= startOfToday
    ).length;

    // 2. SLA compliance and average resolution time
    let totalResolutionTimeMs = 0;
    let resolvedCount = 0;
    let slaCompliantCount = 0;

    tickets.forEach(t => {
      if (['Resolved', 'Closed'].includes(t.status)) {
        resolvedCount++;
        const created = new Date(t.createdAt).getTime();
        const updated = new Date(t.updatedAt).getTime();
        const diff = updated - created;
        
        totalResolutionTimeMs += diff;
        
        // SLA: resolved within 24 hours (86,400,000 ms)
        if (diff <= 24 * 60 * 60 * 1000) {
          slaCompliantCount++;
        }
      }
    });

    const averageResolutionTime = resolvedCount > 0 
      ? Math.round((totalResolutionTimeMs / resolvedCount) / (1000 * 60 * 60) * 10) / 10 // hours
      : 0;

    const slaCompliance = resolvedCount > 0 
      ? Math.round((slaCompliantCount / resolvedCount) * 100) 
      : 100; // default to 100% if no resolved tickets yet

    // 3. Employee Satisfaction
    const ratedTickets = tickets.filter(t => t.rating && t.rating > 0);
    const employeeSatisfactionScore = ratedTickets.length > 0
      ? Math.round((ratedTickets.reduce((sum, t) => sum + (t.rating || 0), 0) / ratedTickets.length) * 10) / 10
      : 5.0; // default/placeholder score

    // 4. Department Wise Issues
    const deptMap: Record<string, number> = {};
    tickets.forEach(t => {
      const dept = t.department || 'Other';
      deptMap[dept] = (deptMap[dept] || 0) + 1;
    });
    const departmentWiseIssues = Object.entries(deptMap).map(([name, count]) => ({ name, count }));

    // 5. Category Wise Issues
    const catMap: Record<string, number> = {};
    tickets.forEach(t => {
      const cat = t.category || 'General';
      catMap[cat] = (catMap[cat] || 0) + 1;
    });
    const categoryWiseIssues = Object.entries(catMap).map(([name, count]) => ({ name, count }));

    // 6. Trend Analysis (Last 7 Days)
    const trendMap: Record<string, { created: number; resolved: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      trendMap[dateStr] = { created: 0, resolved: 0 };
    }

    tickets.forEach(t => {
      const createdDateStr = new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (trendMap[createdDateStr]) {
        trendMap[createdDateStr].created++;
      }
      
      if (['Resolved', 'Closed'].includes(t.status)) {
        const resolvedDateStr = new Date(t.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (trendMap[resolvedDateStr]) {
          trendMap[resolvedDateStr].resolved++;
        }
      }
    });

    const ticketTrends = Object.entries(trendMap).map(([date, counts]) => ({
      date,
      created: counts.created,
      resolved: counts.resolved
    }));

    return NextResponse.json({
      totalTickets,
      openTickets,
      closedTickets,
      inProgress,
      resolvedToday,
      highPriorityTickets,
      averageResolutionTime,
      slaCompliance,
      employeeSatisfactionScore,
      departmentWiseIssues,
      categoryWiseIssues,
      ticketTrends
    }, { status: 200 });
  } catch (error: any) {
    console.error('Failed to generate ticket analytics:', error);
    return NextResponse.json({ error: 'Failed to generate ticket analytics', details: error.message }, { status: 500 });
  }
}
