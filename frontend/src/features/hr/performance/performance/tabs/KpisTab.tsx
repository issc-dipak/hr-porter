import React from 'react';
import { Target, Plus, Search, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KpisTabProps {
  kpis: any[];
  goals: any[];
  goalSearchQuery: string;
  setGoalSearchQuery: (val: string) => void;
  goalDeptFilter: string;
  setGoalDeptFilter: (val: string) => void;
  goalStatusFilter: string;
  setGoalStatusFilter: (val: string) => void;
  setIsKpiModalOpen: (val: boolean) => void;
  setIsGoalModalOpen: (val: boolean) => void;
}

export const KpisTab: React.FC<KpisTabProps> = ({
  kpis,
  goals,
  goalSearchQuery,
  setGoalSearchQuery,
  goalDeptFilter,
  setGoalDeptFilter,
  goalStatusFilter,
  setGoalStatusFilter,
  setIsKpiModalOpen,
  setIsGoalModalOpen
}) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">KPIs Library & Target Thresholds</h3>
          <p className="text-[10px] font-bold text-slate-405 mt-0.5">Manage SLA thresholds and delivery metric targets.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsKpiModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[9px] font-black uppercase tracking-wider cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Create KPI
          </button>
          <button 
            onClick={() => setIsGoalModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-705 text-white rounded-xl text-[9px] font-black uppercase tracking-wider cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Assign Goal
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {kpis.map((k) => (
          <div key={k.id} className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl shadow-sm flex flex-col justify-between min-h-[160px]">
            <div>
              <span className="px-2 py-0.5 bg-slate-105 dark:bg-slate-800 text-slate-400 rounded text-[8px] font-black uppercase tracking-wider">{k.dept}</span>
              <h4 className="text-xs font-black text-slate-900 dark:text-white mt-2 uppercase">{k.title}</h4>
            </div>

            <div className="grid grid-cols-2 gap-4 my-3 text-[10px] font-bold text-slate-400">
              <div>
                <span>SLA Target:</span>
                <p className="text-xs font-black text-slate-800 dark:text-slate-200">{k.target}</p>
              </div>
              <div>
                <span>Current:</span>
                <p className="text-xs font-black text-blue-600 dark:text-blue-400">{k.current}</p>
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-805 pt-2.5 flex justify-between items-center text-[9px] font-black uppercase tracking-wider text-slate-400">
              <span>{k.period} Track</span>
              <span className={cn(k.status === 'On Track' ? "text-emerald-500" : "text-rose-500")}>{k.status} ({k.trend})</span>
            </div>
          </div>
        ))}
      </div>

      {/* Assigned Goals History Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl overflow-hidden shadow-sm mt-8">
        <div className="p-5 border-b border-slate-100 dark:border-slate-805 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Assigned Goals History</h3>
            <p className="text-[10px] font-bold text-slate-400 mt-0.5">Track real-time progress, target completion dates, and confirmation logs of employee performance targets.</p>
          </div>

          {/* Interactive Filter Bar */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:flex-initial">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
              <input 
                type="text"
                placeholder="Search goal or assignee..."
                value={goalSearchQuery}
                onChange={e => setGoalSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-205 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 w-full md:w-48 text-slate-900 dark:text-white"
              />
            </div>
            
            <select
              value={goalDeptFilter}
              onChange={e => setGoalDeptFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none text-slate-700 dark:text-slate-300"
            >
              <option value="All">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="Design">Design</option>
              <option value="HR">HR</option>
              <option value="Sales">Sales</option>
              <option value="Marketing">Marketing</option>
            </select>

            <select
              value={goalStatusFilter}
              onChange={e => setGoalStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none text-slate-700 dark:text-slate-300"
            >
              <option value="All">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="In Progress">In Progress</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/40 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-805">
                <th className="p-4">Goal / Title</th>
                <th className="p-4">Assigned To</th>
                <th className="p-4">Department</th>
                <th className="p-4">Deadline</th>
                <th className="p-4">Progress</th>
                <th className="p-4">Status</th>
                <th className="p-4">Completed By & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-805 font-medium">
              {goals
                .filter((g: any) => {
                  const matchesSearch = 
                    (g.title || '').toLowerCase().includes(goalSearchQuery.toLowerCase()) ||
                    (g.assignee || '').toLowerCase().includes(goalSearchQuery.toLowerCase());
                  const matchesDept = goalDeptFilter === 'All' || g.dept === goalDeptFilter;
                  const matchesStatus = goalStatusFilter === 'All' || g.status === goalStatusFilter;
                  return matchesSearch && matchesDept && matchesStatus;
                })
                .map((g: any) => (
                  <tr key={g.id} className="hover:bg-slate-55/50 dark:hover:bg-slate-800/20">
                    <td className="p-4 font-black text-slate-900 dark:text-white uppercase tracking-tight">{g.title}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center text-[10px] font-black uppercase">
                          {g.assignee ? g.assignee.split(' ').map((n: string) => n[0]).join('').substring(0, 2) : 'EM'}
                        </span>
                        <span className="text-slate-808 dark:text-slate-202 font-semibold">{g.assignee || 'Unassigned'}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-500 font-bold uppercase tracking-wider">{g.dept}</td>
                    <td className="p-4 text-slate-500 font-mono">{g.deadline || 'No Deadline'}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-blue-600 dark:text-blue-400">{g.progress}%</span>
                        <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600" style={{ width: `${g.progress}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={cn(
                        "px-2.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border",
                        g.status === 'Completed' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                        g.status === 'In Progress' ? "bg-blue-500/10 text-blue-500 border-blue-500/20" : "bg-slate-500/10 text-slate-400 border-slate-700"
                      )}>
                        {g.status}
                      </span>
                    </td>
                    <td className="p-4">
                      {g.status === 'Completed' ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider text-[9px]">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                            <span>{g.assignee} completed</span>
                          </div>
                          {g.completedAt && (
                            <span className="block text-[8px] text-slate-400 font-mono">
                              {new Date(g.completedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 font-semibold italic">In Progress</span>
                      )}
                    </td>
                  </tr>
                ))}
              {goals.filter((g: any) => {
                const matchesSearch = 
                  (g.title || '').toLowerCase().includes(goalSearchQuery.toLowerCase()) ||
                  (g.assignee || '').toLowerCase().includes(goalSearchQuery.toLowerCase());
                const matchesDept = goalDeptFilter === 'All' || g.dept === goalDeptFilter;
                const matchesStatus = goalStatusFilter === 'All' || g.status === goalStatusFilter;
                return matchesSearch && matchesDept && matchesStatus;
              }).length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 dark:text-slate-500 font-semibold">
                    No matching assigned goals found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
