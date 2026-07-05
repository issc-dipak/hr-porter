"use client";

import React, { useState, useEffect } from 'react';
import {
  FolderKanban, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2,
  Clock, Users, DollarSign, BarChart3, Target, Activity, Loader2,
  ArrowUpRight, Zap, Shield, Calendar, ChevronRight, RefreshCcw,
  AlertCircle, Star, Flame, Timer, ArrowRight, Eye
} from 'lucide-react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid } from 'recharts';

const API = '';

function getHeaders() {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('hr_system_token') || '';
  const companyId = localStorage.getItem('companyId') || 'company_001';
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'x-company-id': companyId };
}

interface Props {
  onOpenProject: (id: string) => void;
  onNewProject: () => void;
  onViewAll: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  Active: '#8b5cf6',
  Planning: '#3b82f6',
  Completed: '#10b981',
  Delayed: '#ef4444',
  'On Hold': '#f59e0b',
  Review: '#06b6d4',
  Cancelled: '#6b7280',
};

const HEALTH_COLORS = { Healthy: '#10b981', Warning: '#f59e0b', Critical: '#ef4444' };

export default function ProjectDashboard({ onOpenProject, onNewProject, onViewAll }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const [dashRes, projRes] = await Promise.all([
        fetch(`${API}/api/projects-dashboard`, { headers: getHeaders() as any }),
        fetch(`${API}/api/projects?limit=6`, { headers: getHeaders() as any })
      ]);
      const dashJson = await dashRes.json();
      const projJson = await projRes.json();
      if (dashJson.success) setData(dashJson.data);
      if (projJson.success) setProjects(projJson.data || []);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
        </div>
        <p className="text-slate-400 text-sm">Loading project analytics...</p>
      </div>
    </div>
  );

  const d = data || {};

  const kpis = [
    { label: 'Total Projects', value: d.totalProjects || 0, icon: FolderKanban, color: 'violet', trend: null },
    { label: 'Active', value: d.activeProjects || 0, icon: Zap, color: 'blue', trend: null },
    { label: 'Completed', value: d.completedProjects || 0, icon: CheckCircle2, color: 'emerald', trend: null },
    { label: 'Delayed', value: d.delayedProjects || 0, icon: AlertTriangle, color: 'red', trend: null },
    { label: 'Total Tasks', value: d.totalTasks || 0, icon: Target, color: 'indigo', trend: null },
    { label: 'Completed Tasks', value: d.completedTasks || 0, icon: CheckCircle2, color: 'green', trend: null },
    { label: 'Open Tasks', value: d.openTasks || 0, icon: Clock, color: 'amber', trend: null },
    { label: 'Billable Hours', value: `${(d.totalBillableHours || 0).toFixed(0)}h`, icon: Timer, color: 'purple', trend: null },
  ];

  const colorMap: Record<string, string> = {
    violet: 'from-violet-500/20 to-violet-600/10 border-violet-500/20 text-violet-400',
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/20 text-blue-400',
    emerald: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/20 text-emerald-400',
    red: 'from-red-500/20 to-red-600/10 border-red-500/20 text-red-400',
    indigo: 'from-indigo-500/20 to-indigo-600/10 border-indigo-500/20 text-indigo-400',
    green: 'from-green-500/20 to-green-600/10 border-green-500/20 text-green-400',
    amber: 'from-amber-500/20 to-amber-600/10 border-amber-500/20 text-amber-400',
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/20 text-purple-400',
  };

  // Status distribution pie chart data
  const statusData = [
    { name: 'Active', value: d.activeProjects || 0 },
    { name: 'Planning', value: d.planningProjects || 0 },
    { name: 'Completed', value: d.completedProjects || 0 },
    { name: 'Delayed', value: d.delayedProjects || 0 },
    { name: 'On Hold', value: d.onHoldProjects || 0 },
  ].filter(s => s.value > 0);

  const healthData = (d.healthBreakdown || []).map((h: any) => ({
    name: h._id,
    value: h.count,
    fill: HEALTH_COLORS[h._id as keyof typeof HEALTH_COLORS] || '#6b7280'
  }));

  const taskRate = d.taskCompletionRate || 0;

  return (
    <div className="p-6 space-y-6">
      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`bg-gradient-to-br ${colorMap[kpi.color]} border rounded-2xl p-4 flex flex-col gap-2`}
          >
            <kpi.icon className={`w-4 h-4 ${colorMap[kpi.color].split(' ')[3]}`} />
            <div className="text-2xl font-bold text-white">{kpi.value}</div>
            <div className="text-xs text-slate-400 leading-tight">{kpi.label}</div>
          </motion.div>
        ))}
      </div>

      {/* ── Task Completion Gauge + Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Completion Rate */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
          className="bg-slate-900 border border-slate-800/60 rounded-2xl p-6 flex flex-col items-center gap-4">
          <h3 className="text-sm font-semibold text-slate-300 self-start">Task Completion Rate</h3>
          <div className="relative w-32 h-32">
            <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="#1e293b" strokeWidth="12" />
              <circle cx="60" cy="60" r="50" fill="none" stroke="url(#grad)" strokeWidth="12"
                strokeDasharray={`${(taskRate / 100) * 314} 314`} strokeLinecap="round" />
              <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-white">{taskRate}%</span>
              <span className="text-xs text-slate-400">Complete</span>
            </div>
          </div>
          <div className="w-full grid grid-cols-2 gap-2 text-center">
            <div className="bg-slate-800/50 rounded-xl p-2">
              <div className="text-lg font-bold text-emerald-400">{d.completedTasks || 0}</div>
              <div className="text-xs text-slate-500">Done</div>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-2">
              <div className="text-lg font-bold text-amber-400">{d.openTasks || 0}</div>
              <div className="text-xs text-slate-500">Remaining</div>
            </div>
          </div>
        </motion.div>

        {/* Project Status Distribution */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.25 }}
          className="bg-slate-900 border border-slate-800/60 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Project Status</h3>
          {statusData.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={130} height={130}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={3} dataKey="value">
                    {statusData.map((entry, index) => (
                      <Cell key={index} fill={STATUS_COLORS[entry.name] || '#6b7280'} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-1.5 flex-1">
                {statusData.map(s => (
                  <div key={s.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[s.name] }} />
                      <span className="text-xs text-slate-400">{s.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-white">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-slate-500 text-sm">No projects yet</div>
          )}
        </motion.div>

        {/* Health Score Breakdown */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
          className="bg-slate-900 border border-slate-800/60 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Health Breakdown</h3>
          <div className="space-y-3">
            {healthData.length > 0 ? healthData.map((h: any) => (
              <div key={h.name} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: h.fill }} />
                    {h.name}
                  </span>
                  <span className="text-white font-semibold">{h.value}</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ backgroundColor: h.fill, width: `${Math.min(100, (h.value / (d.totalProjects || 1)) * 100)}%` }} />
                </div>
              </div>
            )) : (
              <div className="flex items-center justify-center h-20 text-slate-500 text-sm">No data</div>
            )}
          </div>
        </motion.div>
      </div>

      {/* ── Bottom Section: Upcoming Deadlines + Today's Tasks + Recent Projects ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Projects */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="lg:col-span-2 bg-slate-900 border border-slate-800/60 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-slate-800/50">
            <h3 className="text-sm font-semibold text-slate-200">Recent Projects</h3>
            <button onClick={onViewAll} className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors">
              View All <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="divide-y divide-slate-800/50">
            {projects.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                <FolderKanban className="w-10 h-10 mx-auto mb-2 opacity-30" />
                No projects yet. Create your first project!
                <button onClick={onNewProject} className="block mt-3 mx-auto px-4 py-2 bg-violet-600 text-white text-xs rounded-lg hover:bg-violet-500">+ New Project</button>
              </div>
            ) : projects.map((proj: any) => (
              <button key={proj._id} onClick={() => onOpenProject(proj._id)}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-800/40 transition-colors text-left group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/10 flex items-center justify-center flex-shrink-0">
                  <FolderKanban className="w-5 h-5 text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-200 truncate group-hover:text-white">{proj.name}</span>
                    <span className="text-xs text-slate-500 font-mono">{proj.projectCode}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium`}
                      style={{ backgroundColor: `${STATUS_COLORS[proj.status]}20`, color: STATUS_COLORS[proj.status] }}>
                      {proj.status}
                    </span>
                    {proj.clientName && <span className="text-xs text-slate-500 truncate">{proj.clientName}</span>}
                  </div>
                  {/* Progress Bar */}
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-violet-500 rounded-full" style={{ width: `${proj.completionPercent || 0}%` }} />
                    </div>
                    <span className="text-xs text-slate-400">{proj.completionPercent || 0}%</span>
                  </div>
                </div>
                <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg ${
                  proj.healthStatus === 'Healthy' ? 'bg-emerald-500/10 text-emerald-400' :
                  proj.healthStatus === 'Warning' ? 'bg-amber-500/10 text-amber-400' :
                  'bg-red-500/10 text-red-400'
                }`}>
                  {proj.healthStatus === 'Healthy' ? <CheckCircle2 className="w-3 h-3" /> :
                   proj.healthStatus === 'Warning' ? <AlertTriangle className="w-3 h-3" /> :
                   <AlertCircle className="w-3 h-3" />}
                  {proj.healthScore || 0}
                </div>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Upcoming Deadlines + Today's Tasks */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="flex flex-col gap-4">
          {/* Upcoming Deadlines */}
          <div className="bg-slate-900 border border-slate-800/60 rounded-2xl overflow-hidden flex-1">
            <div className="flex items-center gap-2 p-4 border-b border-slate-800/50">
              <Calendar className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-slate-200">Upcoming Deadlines</h3>
            </div>
            <div className="divide-y divide-slate-800/30 max-h-64 overflow-auto">
              {(d.upcomingDeadlines || []).length === 0 ? (
                <div className="p-4 text-center text-slate-500 text-xs">No deadlines in next 14 days</div>
              ) : (d.upcomingDeadlines || []).map((p: any) => {
                const daysLeft = p.endDate ? Math.ceil((new Date(p.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
                return (
                  <button key={p._id} onClick={() => onOpenProject(p._id)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-800/30 transition-colors text-left">
                    <div>
                      <p className="text-xs font-medium text-slate-300 truncate max-w-32">{p.name}</p>
                      <p className="text-xs text-slate-500">{p.endDate}</p>
                    </div>
                    {daysLeft !== null && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
                        daysLeft <= 2 ? 'bg-red-500/10 text-red-400' :
                        daysLeft <= 7 ? 'bg-amber-500/10 text-amber-400' :
                        'bg-slate-800 text-slate-400'
                      }`}>{daysLeft}d</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Today's Tasks */}
          <div className="bg-slate-900 border border-slate-800/60 rounded-2xl overflow-hidden flex-1">
            <div className="flex items-center gap-2 p-4 border-b border-slate-800/50">
              <Flame className="w-4 h-4 text-orange-400" />
              <h3 className="text-sm font-semibold text-slate-200">Today's Tasks</h3>
              <span className="ml-auto text-xs bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded-full font-semibold">{(d.todaysTasks || []).length}</span>
            </div>
            <div className="divide-y divide-slate-800/30 max-h-64 overflow-auto">
              {(d.todaysTasks || []).length === 0 ? (
                <div className="p-4 text-center text-slate-500 text-xs">No tasks due today 🎉</div>
              ) : (d.todaysTasks || []).map((t: any) => (
                <div key={t._id} className="flex items-center gap-3 px-4 py-3">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    t.priority === 'Urgent' ? 'bg-red-500' :
                    t.priority === 'High' ? 'bg-orange-500' :
                    t.priority === 'Medium' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-300 truncate">{t.title}</p>
                    <p className="text-xs text-slate-500">{t.projectName}</p>
                  </div>
                  <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${
                    t.status === 'In Progress' ? 'bg-blue-500/10 text-blue-400' :
                    t.status === 'Blocked' ? 'bg-red-500/10 text-red-400' :
                    'bg-slate-800 text-slate-400'
                  }`}>{t.status}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
