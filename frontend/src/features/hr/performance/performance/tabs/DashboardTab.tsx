import React from 'react';
import { TrendingUp, Users, Trophy, Target, AlertTriangle, Activity, Flame } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { cn } from '@/lib/utils';

interface DashboardTabProps {
  employees: any[];
  realtimeLogs: any[];
  alerts: any[];
  isClient: boolean;
  dashboardStats: {
    productivityIndex: number;
    totalEmployees: number;
    topDept: string;
    kpiCompletion: number;
    completedGoalsCount: number;
  };
  chartData: any[];
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  employees,
  realtimeLogs,
  alerts,
  isClient,
  dashboardStats,
  chartData
}) => {
  // Compute burnout risk from real employees by department
  const deptRisk: Record<string, { totalScore: number; count: number }> = {};
  employees.forEach((e) => {
    if (!deptRisk[e.dept]) deptRisk[e.dept] = { totalScore: 0, count: 0 };
    deptRisk[e.dept].totalScore += e.score;
    deptRisk[e.dept].count++;
  });

  const burnoutTeams = Object.entries(deptRisk).map(([dept, { totalScore, count }]) => {
    const avg = totalScore / count;
    const risk = avg < 70 ? 'High Risk' : avg < 85 ? 'Medium Risk' : 'Low Risk';
    const color = risk === 'High Risk'
      ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20 animate-pulse'
      : risk === 'Medium Risk'
      ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
      : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
    return { team: dept, score: risk, color };
  });

  const statCards = [
    {
      label: 'Company Productivity Index',
      value: dashboardStats.productivityIndex > 0 ? `${dashboardStats.productivityIndex}%` : 'No Data',
      change: dashboardStats.productivityIndex > 0 ? `Based on ${dashboardStats.totalEmployees} employees` : 'Fetch employees first',
      color: 'text-blue-600',
      icon: TrendingUp
    },
    {
      label: 'Active Monitored Staff',
      value: dashboardStats.totalEmployees > 0 ? `${dashboardStats.totalEmployees} Employees` : 'No Data',
      change: dashboardStats.topDept !== 'N/A' ? `${dashboardStats.topDept} leads output` : 'No employees found',
      color: 'text-emerald-500',
      icon: Users
    },
    {
      label: 'Top Performing Dept',
      value: dashboardStats.topDept !== 'N/A' ? dashboardStats.topDept : 'No Data',
      change: dashboardStats.topDept !== 'N/A' ? 'Highest average score' : 'Awaiting employee data',
      color: 'text-indigo-500',
      icon: Trophy
    },
    {
      label: 'Overall KPI Completion',
      value: dashboardStats.kpiCompletion > 0 ? `${dashboardStats.kpiCompletion}%` : 'No Data',
      change: dashboardStats.completedGoalsCount > 0 ? `${dashboardStats.completedGoalsCount} tasks completed` : 'No completed tasks yet',
      color: 'text-purple-500',
      icon: Target
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => (
          <div key={idx} className="p-4.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[8.5px] text-slate-400 font-black uppercase tracking-wider">{stat.label}</p>
              <stat.icon className={cn("w-4 h-4", stat.color)} />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">{stat.value}</h3>
            <p className="text-[9px] text-slate-400 font-bold mt-1">{stat.change}</p>
          </div>
        ))}
      </div>

      {/* Alert Center Banner */}
      {alerts.length > 0 && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex flex-col gap-2">
          <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> High Priority System Insights & Triggers
          </span>
          <div className="space-y-1.5">
            {alerts.map(a => (
              <p key={a.id} className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                • <span className="font-extrabold uppercase text-amber-500">[{a.source}]:</span> {a.message}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Recharts Area Chart & Live Log grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Productivity Index and Payroll alignment */}
        <div className="lg:col-span-2 p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Productivity vs Attendance</h3>
              <p className="text-[10px] font-bold text-slate-400 mt-0.5">Real data from employees and attendance records.</p>
            </div>
          </div>

          <div className="h-64">
            {isClient ? (
              chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold' }} />
                    <Area name="Productivity Score" type="monotone" dataKey="Productivity" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorProd)" />
                    <Area name="Attendance Score" type="monotone" dataKey="Attendance" stroke="#10b981" strokeWidth={1.5} fillOpacity={0} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-[11px] font-bold text-slate-400 uppercase">No attendance data available yet</div>
              )
            ) : <div className="h-full bg-slate-100 rounded-xl animate-pulse" />}
          </div>
        </div>

        {/* Realtime Event Stream */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Realtime Activity</h3>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="space-y-3">
            {realtimeLogs.length > 0 ? realtimeLogs.map(log => (
              <div key={log.id} className="flex gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                  <Activity className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-350">{log.message}</p>
                  <span className="text-[9px] text-slate-400 block mt-1">{log.time}</span>
                </div>
              </div>
            )) : (
              <p className="text-[10px] text-slate-400 font-bold uppercase text-center py-4">No recent activity</p>
            )}
          </div>
        </div>

      </div>

      {/* Team rankings and burner alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Burnout Risk — computed from real employee scores */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl shadow-sm">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-4 flex items-center gap-2">
            <Flame className="w-4 h-4 text-rose-500 animate-pulse" /> AI Team Burnout Risk Matrix
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
            {burnoutTeams.length > 0 ? burnoutTeams.map((t, idx) => (
              <div key={idx} className={cn("p-4 rounded-xl flex flex-col justify-between items-center gap-2", t.color)}>
                <span className="text-[10px] font-black uppercase tracking-wider">{t.team}</span>
                <span className="text-[8px] font-extrabold uppercase px-2 py-0.5 rounded bg-black/5">{t.score}</span>
              </div>
            )) : (
              <p className="col-span-3 text-[10px] text-slate-400 font-bold uppercase py-4 text-center">No employee data for risk analysis</p>
            )}
          </div>
        </div>

        {/* Leaderboard Grid — top 3 from real employees */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl shadow-sm space-y-4">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" /> Organizational Standings
          </h3>
          <div className="space-y-2.5">
            {employees.slice().sort((a, b) => b.score - a.score).slice(0, 3).map((e, idx) => (
              <div key={e.id} className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/60">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-slate-400">#{idx + 1}</span>
                  <div>
                    <p className="text-xs font-black text-slate-900 dark:text-white leading-none">{e.name}</p>
                    <p className="text-[9px] font-bold text-slate-405 mt-1">{e.dept}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-blue-600 dark:text-blue-400">{e.score} Points</span>
                  <span className="block text-[8px] font-black uppercase text-emerald-500 mt-1">{e.status}</span>
                </div>
              </div>
            ))}
            {employees.length === 0 && (
              <p className="text-[10px] text-slate-400 font-bold uppercase text-center py-4">No employee data available</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
