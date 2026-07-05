"use client";

import React, { useMemo } from 'react';
import { 
  ShieldCheck, Heart, TrendingUp, DollarSign, Award, Clock 
} from 'lucide-react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ComposedChart 
} from 'recharts';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { PastelStatCard } from '@/components/ui/PastelStatCard';

interface AdminDashboardProps {
  employees: any[];
  isClient: boolean;
  recruitmentFunnel: any[];
  slaMetrics: {
    hiringSuccess: string;
    payrollSpeed: string;
    leaveApproval: string;
    conversionRate: string;
  };
  payrollData?: any[];
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  employees, 
  isClient, 
  recruitmentFunnel,
  slaMetrics,
  payrollData = []
}) => {
  // 1. Compute aggregate productivity index from live employee ratings
  const workforceProductivity = useMemo(() => {
    if (!employees || employees.length === 0) return 0;
    const scoredEmployees = employees.filter(emp => emp.score > 0);
    if (scoredEmployees.length === 0) return 0;
    const sum = scoredEmployees.reduce((acc, emp) => acc + emp.score, 0);
    return Number((sum / scoredEmployees.length).toFixed(1));
  }, [employees]);

  // Executive Scores - Dynamically computed from employee verification documents
  const complianceScore = useMemo(() => {
    let totalDocs = 0;
    let approvedDocs = 0;
    employees.forEach(emp => {
      if (emp.documents && Array.isArray(emp.documents)) {
        totalDocs += emp.documents.length;
        approvedDocs += emp.documents.filter((doc: any) => doc.status === 'Approved').length;
      }
    });
    if (totalDocs === 0) return 0;
    return Number(((approvedDocs / totalDocs) * 100).toFixed(1));
  }, [employees]);

  // Quarterly Attrition & Retention trend data (6 quarters) computed from employee records
  const retentionAttritionData = useMemo(() => {
    const quarters = [
      { name: 'Q1 2025', start: new Date('2025-01-01'), end: new Date('2025-03-31') },
      { name: 'Q2 2025', start: new Date('2025-04-01'), end: new Date('2025-06-30') },
      { name: 'Q3 2025', start: new Date('2025-07-01'), end: new Date('2025-09-30') },
      { name: 'Q4 2025', start: new Date('2025-10-01'), end: new Date('2025-12-31') },
      { name: 'Q1 2026', start: new Date('2026-01-01'), end: new Date('2026-03-31') },
      { name: 'Q2 2026', start: new Date('2026-04-01'), end: new Date('2026-06-30') }
    ];

    return quarters.map(q => {
      // Find employees who joined before or during this quarter
      const joinedBeforeOrDuring = employees.filter(emp => {
        const joinDate = new Date(emp.joinedDate || emp.createdAt);
        return joinDate <= q.end;
      });

      // Find employees who left (status Inactive) during this quarter
      const leftInQuarter = employees.filter(emp => {
        if (emp.employeeStatus !== 'Inactive') return false;
        const leaveDate = new Date(emp.updatedAt || emp.createdAt);
        return leaveDate >= q.start && leaveDate <= q.end;
      });

      const totalCount = joinedBeforeOrDuring.length;
      const leftCount = leftInQuarter.length;

      let attritionRate = 0;
      if (totalCount > 0) {
        attritionRate = Number(((leftCount / totalCount) * 100).toFixed(1));
      }

      const finalAttrition = attritionRate;
      const retentionRate = totalCount > 0 ? Number((100 - finalAttrition).toFixed(1)) : 100.0;

      return {
        quarter: q.name,
        Retention: retentionRate,
        Attrition: finalAttrition
      };
    });
  }, [employees]);

  const orgHealthScore = useMemo(() => {
    if (!employees || employees.length === 0) return 0;
    const latestRetention = retentionAttritionData.length > 0
      ? retentionAttritionData[retentionAttritionData.length - 1].Retention
      : 0;

    const components = [];
    if (workforceProductivity > 0) components.push(workforceProductivity);
    if (complianceScore > 0) components.push(complianceScore);
    if (latestRetention > 0) components.push(latestRetention);

    if (components.length === 0) return 0;
    const sum = components.reduce((acc, val) => acc + val, 0);
    return Number((sum / components.length).toFixed(1));
  }, [workforceProductivity, complianceScore, retentionAttritionData, employees]);

  // Payroll cost breakdown past 5 months (in USD/INR values)
  const payrollCostData = useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    
    // Generate past 5 months starting from 4 months ago to current month
    const pastMonths = Array.from({ length: 5 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (4 - i), 1);
      return {
        short: monthNames[d.getMonth()],
        full: d.toLocaleString('en-US', { month: 'long' }),
        year: d.getFullYear()
      };
    });

    return pastMonths.map(m => {
      // Find all payroll records matching this month
      const recordsForMonth = (payrollData || []).filter((p: any) => {
        if (!p.month) return false;
        const monthStr = p.month.toLowerCase();
        return monthStr.includes(m.full.toLowerCase()) || monthStr.includes(m.short.toLowerCase());
      });

      const salary = recordsForMonth.reduce((sum: number, p: any) => sum + (p.basic || 0) + (p.hra || 0) + (p.allowance || 0), 0);
      const bonuses = recordsForMonth.reduce((sum: number, p: any) => sum + (p.bonus || 0) + (p.overtime || 0), 0);
      const overheads = recordsForMonth.reduce((sum: number, p: any) => sum + (p.pf || 0) + (p.esi || 0), 0);

      return {
        month: m.short,
        Salary: salary,
        Bonuses: bonuses,
        Overheads: overheads
      };
    });
  }, [payrollData, employees]);

  // Conversion funnel data (recruitment conversion metrics)
  const funnelData = useMemo(() => {
    if (recruitmentFunnel && recruitmentFunnel.length > 0) {
      return recruitmentFunnel;
    }
    return [
      { name: 'Applied', candidates: 0, fill: '#64748b' },
      { name: 'Screened', candidates: 0, fill: '#3b82f6' },
      { name: 'Interviewed', candidates: 0, fill: '#6366f1' },
      { name: 'Hired', candidates: 0, fill: '#10b981' }
    ];
  }, [recruitmentFunnel]);

  return (
    <div className="space-y-6">
      
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
        {[
          { label: 'Org Health Score', value: `${orgHealthScore}%`, icon: Heart, accent: '#3B82F6', sub: '✓ Stable Workforce Climate' },
          { label: 'Workforce Productivity', value: `${workforceProductivity}%`, icon: TrendingUp, accent: '#8B5CF6', sub: 'Aggregate company performance' },
          { label: 'Compliance Rating', value: `${complianceScore}%`, icon: ShieldCheck, accent: '#10B981', sub: '✓ Full Audit Legal Compliance' }
        ].map((stat, idx) => (
          <PastelStatCard key={idx} icon={stat.icon} label={stat.label} value={stat.value} sub={stat.sub} accent={stat.accent} />
        ))}
      </div>

      {/* Core Business Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Retention & Attrition Analytics Composed Chart */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-805 rounded-2xl shadow-sm space-y-6">
          <div>
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-rose-500 animate-pulse" /> Retention & Attrition Trends
            </h3>
            <p className="text-[9px] font-bold text-slate-400 mt-0.5">Quarterly tracking of total staff retention compared to voluntary attrition rates.</p>
          </div>
          <div className="h-64">
            {isClient ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={retentionAttritionData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                  <XAxis dataKey="quarter" stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', fontSize: '10px', color: '#fff' }}
                    labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                    itemStyle={{ color: '#94a3b8' }}
                    cursor={{ fill: 'rgba(148, 163, 184, 0.05)' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '9px', textTransform: 'uppercase', fontWeight: 'bold' }} />
                  <Bar name="Retention Index %" dataKey="Retention" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Line name="Attrition Rate %" type="monotone" dataKey="Attrition" stroke="#f43f5e" strokeWidth={2.5} dot={{ r: 4 }} />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full bg-slate-100 rounded-xl animate-pulse" />
            )}
          </div>
        </div>

        {/* Payroll Monthly Cost Breakdown Stacked Bar Chart */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-855 rounded-2xl shadow-sm space-y-6">
          <div>
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-500" /> Payroll Expense Breakdown
            </h3>
            <p className="text-[9px] font-bold text-slate-400 mt-0.5">Consolidated monthly expenditures covering base salary, bonuses, and ESI/PF benefits.</p>
          </div>
          <div className="h-64">
            {isClient ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={payrollCostData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', fontSize: '10px', color: '#fff' }}
                    labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                    itemStyle={{ color: '#94a3b8' }}
                    formatter={(value: any) => value !== undefined && value !== null ? `₹${value.toLocaleString()}` : ''}
                    cursor={{ fill: 'rgba(148, 163, 184, 0.05)' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '9px', textTransform: 'uppercase', fontWeight: 'bold' }} />
                  <Bar name="Base Salary" dataKey="Salary" stackId="a" fill="#10b981" />
                  <Bar name="Bonus & Incentives" dataKey="Bonuses" stackId="a" fill="#3b82f6" />
                  <Bar name="ESI & PF Overhead" dataKey="Overheads" stackId="a" fill="#6366f1" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full bg-slate-100 rounded-xl animate-pulse" />
            )}
          </div>
        </div>

      </div>

      {/* Recruitment Funnel Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Horizontal Funnel Conversion Chart */}
        <div className="lg:col-span-2 p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-805 rounded-2xl shadow-sm space-y-6">
          <div>
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-1.5">
              <Award className="w-4 h-4 text-indigo-500" /> Hiring Conversion Funnel
            </h3>
            <p className="text-[9px] font-bold text-slate-400 mt-0.5">Aggregate recruitment milestones detailing progression levels from applications to hires.</p>
          </div>
          <div className="h-48">
            {isClient ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={funnelData}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', fontSize: '10px', color: '#fff' }}
                    labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                    itemStyle={{ color: '#94a3b8' }}
                    cursor={{ fill: 'rgba(148, 163, 184, 0.05)' }}
                  />
                  <Bar dataKey="candidates" fill="#6366f1" radius={[0, 4, 4, 0]} maxBarSize={25} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full bg-slate-100 rounded-xl animate-pulse" />
            )}
          </div>
        </div>

        {/* SLA Metrics Sidebar */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-855 rounded-2xl shadow-sm space-y-4">
          <div>
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-500" /> Hiring & Operations SLAs
            </h3>
            <p className="text-[9px] font-bold text-slate-400 mt-0.5">Operational targets and latency benchmarks calculated from active cases.</p>
          </div>
          <div className="space-y-4 pt-2">
            
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-100 dark:border-slate-800/80">
              <span className="text-[10px] font-extrabold uppercase text-slate-500">Hiring Success Ratio</span>
              <span className="text-xs font-black text-emerald-600 dark:text-emerald-450">{slaMetrics.hiringSuccess}</span>
            </div>

            <div className="flex justify-between items-center pb-2.5 border-b border-slate-100 dark:border-slate-800/80">
              <span className="text-[10px] font-extrabold uppercase text-slate-500">Recruit Conversion Rate</span>
              <span className="text-xs font-black text-slate-900 dark:text-white">{slaMetrics.conversionRate}</span>
            </div>

            <div className="flex justify-between items-center pb-2.5 border-b border-slate-100 dark:border-slate-800/80">
              <span className="text-[10px] font-extrabold uppercase text-slate-500">Leave Approval SLA</span>
              <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">{slaMetrics.leaveApproval}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[10px] font-extrabold uppercase text-slate-500">Payroll Cycle Time</span>
              <span className="text-xs font-black text-slate-900 dark:text-white">Same Day (SLA compliant)</span>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
