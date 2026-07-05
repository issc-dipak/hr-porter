"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Filter, Plus, LayoutGrid, List, Kanban, Calendar, RefreshCcw,
  FolderKanban, Clock, Users, DollarSign, AlertTriangle, CheckCircle2,
  ChevronDown, MoreVertical, Edit2, Trash2, Copy, Eye, Star, Zap,
  Flag, Building2, User, ArrowUpRight, ArrowRight, Loader2,
  ChevronRight, X, SlidersHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API = '';

function getHeaders() {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('hr_system_token') || '';
  const companyId = localStorage.getItem('companyId') || 'company_001';
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'x-company-id': companyId };
}

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  Active: { bg: 'bg-violet-500/10', text: 'text-violet-400', dot: 'bg-violet-500' },
  Planning: { bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-500' },
  Completed: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-500' },
  Delayed: { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-500' },
  'On Hold': { bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-500' },
  Review: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', dot: 'bg-cyan-500' },
  Cancelled: { bg: 'bg-slate-500/10', text: 'text-slate-400', dot: 'bg-slate-500' },
};

const PRIORITY_COLORS: Record<string, { bg: string; text: string }> = {
  Critical: { bg: 'bg-red-500/10', text: 'text-red-400' },
  High: { bg: 'bg-orange-500/10', text: 'text-orange-400' },
  Medium: { bg: 'bg-yellow-500/10', text: 'text-yellow-400' },
  Low: { bg: 'bg-slate-500/10', text: 'text-slate-400' },
};

const HEALTH_CONFIG: Record<string, { bg: string; text: string; icon: any }> = {
  Healthy: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', icon: CheckCircle2 },
  Warning: { bg: 'bg-amber-500/10', text: 'text-amber-400', icon: AlertTriangle },
  Critical: { bg: 'bg-red-500/10', text: 'text-red-400', icon: AlertTriangle },
};

interface Props {
  onOpenProject: (id: string) => void;
  onNewProject: () => void;
  employees: any[];
}

function ProjectCard({ project, onClick }: { project: any; onClick: () => void }) {
  const sc = STATUS_COLORS[project.status] || STATUS_COLORS.Planning;
  const pc = PRIORITY_COLORS[project.priority] || PRIORITY_COLORS.Medium;
  const hc = HEALTH_CONFIG[project.healthStatus] || HEALTH_CONFIG.Healthy;
  const HealthIcon = hc.icon;

  const budgetPercent = project.approvedBudget > 0
    ? Math.round((project.usedBudget / project.approvedBudget) * 100)
    : 0;

  const daysLeft = project.endDate
    ? Math.ceil((new Date(project.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -3, scale: 1.01 }}
      transition={{ duration: 0.2 }}
      className="w-full text-left bg-slate-900 border border-slate-800/60 hover:border-violet-500/40 rounded-2xl overflow-hidden group transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/5"
    >
      {/* Header */}
      <div className="p-5 pb-3">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-slate-500 font-mono">{project.projectCode}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sc.bg} ${sc.text}`}>
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${sc.dot} mr-1`} />
                {project.status}
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-200 group-hover:text-white truncate transition-colors">
              {project.name}
            </h3>
            {project.clientName && (
              <p className="text-xs text-slate-500 mt-0.5 truncate">{project.clientName}</p>
            )}
          </div>
          <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg ml-2 flex-shrink-0 ${hc.bg} ${hc.text}`}>
            <HealthIcon className="w-3 h-3" />
            <span className="font-bold">{project.healthScore || 100}</span>
          </div>
        </div>

        {/* Priority + Department */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${pc.bg} ${pc.text}`}>
            {project.priority}
          </span>
          {project.department && (
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Building2 className="w-3 h-3" /> {project.department}
            </span>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="px-5 pb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-slate-400">Progress</span>
          <span className="text-xs font-bold text-white">{project.completionPercent || 0}%</span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500"
            initial={{ width: 0 }}
            animate={{ width: `${project.completionPercent || 0}%` }}
            transition={{ duration: 0.8, delay: 0.2 }}
          />
        </div>
      </div>

      {/* Stats Row */}
      <div className="px-5 pb-4 grid grid-cols-3 gap-2">
        <div className="text-center">
          <div className="text-sm font-bold text-white">{project.tasksCompleted || 0}/{project.tasksTotal || 0}</div>
          <div className="text-xs text-slate-500">Tasks</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-bold text-white">{project.teamMembers?.length || 0}</div>
          <div className="text-xs text-slate-500">Members</div>
        </div>
        <div className="text-center">
          {daysLeft !== null ? (
            <>
              <div className={`text-sm font-bold ${daysLeft < 0 ? 'text-red-400' : daysLeft <= 7 ? 'text-amber-400' : 'text-white'}`}>
                {daysLeft < 0 ? `${Math.abs(daysLeft)}d late` : `${daysLeft}d`}
              </div>
              <div className="text-xs text-slate-500">{daysLeft < 0 ? 'Overdue' : 'Left'}</div>
            </>
          ) : (
            <>
              <div className="text-sm font-bold text-slate-400">—</div>
              <div className="text-xs text-slate-500">Deadline</div>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-slate-800/50 flex items-center justify-between">
        {/* Team Avatars */}
        <div className="flex -space-x-2">
          {(project.teamMembers || []).slice(0, 5).map((m: any, i: number) => (
            <div key={i} className="w-6 h-6 rounded-full border-2 border-slate-900 bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-xs text-white font-bold flex-shrink-0">
              {m.employeeName?.charAt(0) || '?'}
            </div>
          ))}
          {project.teamMembers?.length > 5 && (
            <div className="w-6 h-6 rounded-full border-2 border-slate-900 bg-slate-700 flex items-center justify-center text-xs text-slate-300">
              +{project.teamMembers.length - 5}
            </div>
          )}
        </div>

        {/* Budget */}
        {project.approvedBudget > 0 && (
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <DollarSign className="w-3 h-3" />
            <span>{budgetPercent}% used</span>
          </div>
        )}

        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
      </div>
    </motion.button>
  );
}

export default function ProjectList({ onOpenProject, onNewProject, employees }: Props) {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'table' | 'kanban'>('grid');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let url = `${API}/api/projects?limit=100`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (statusFilter) url += `&status=${encodeURIComponent(statusFilter)}`;
      if (priorityFilter) url += `&priority=${encodeURIComponent(priorityFilter)}`;

      const res = await fetch(url, { headers: getHeaders() as any });
      const json = await res.json();
      if (json.success) {
        setProjects(json.data || []);
        setTotal(json.total || 0);
      }
    } catch (_) {}
    setLoading(false);
  }, [search, statusFilter, priorityFilter]);

  useEffect(() => { load(); }, [load]);

  const kanbanColumns = ['Planning', 'Active', 'Review', 'On Hold', 'Completed'];

  return (
    <div className="p-6 space-y-5">
      {/* ── Toolbar ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search projects, clients..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700/60 rounded-xl text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50 transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm border transition-colors ${
            showFilters || statusFilter || priorityFilter
              ? 'bg-violet-600/10 border-violet-500/40 text-violet-400'
              : 'bg-slate-900 border-slate-700/60 text-slate-400 hover:text-white'
          }`}>
          <SlidersHorizontal className="w-4 h-4" />
          Filter
          {(statusFilter || priorityFilter) && <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />}
        </button>

        <button onClick={load} className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 border border-slate-700/60 rounded-xl text-sm text-slate-400 hover:text-white transition-colors">
          <RefreshCcw className="w-4 h-4" />
        </button>

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-slate-800/60 rounded-xl p-1">
          {[
            { id: 'grid', icon: LayoutGrid },
            { id: 'table', icon: List },
            { id: 'kanban', icon: Kanban },
          ].map(v => (
            <button key={v.id} onClick={() => setView(v.id as any)}
              className={`p-2 rounded-lg transition-all ${view === v.id ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}>
              <v.icon className="w-4 h-4" />
            </button>
          ))}
        </div>

        <button onClick={onNewProject}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-colors">
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      {/* ── Filter Panel ── */}
      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="bg-slate-900 border border-slate-800/60 rounded-2xl p-4 flex items-center gap-4 flex-wrap overflow-hidden">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Status:</span>
              <div className="flex gap-1 flex-wrap">
                {['', 'Active', 'Planning', 'Completed', 'Delayed', 'On Hold', 'Review'].map(s => (
                  <button key={s} onClick={() => setStatusFilter(s)}
                    className={`text-xs px-3 py-1 rounded-lg transition-all ${
                      statusFilter === s ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}>{s || 'All'}</button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Priority:</span>
              <div className="flex gap-1">
                {['', 'Critical', 'High', 'Medium', 'Low'].map(p => (
                  <button key={p} onClick={() => setPriorityFilter(p)}
                    className={`text-xs px-3 py-1 rounded-lg transition-all ${
                      priorityFilter === p ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}>{p || 'All'}</button>
                ))}
              </div>
            </div>
            {(statusFilter || priorityFilter) && (
              <button onClick={() => { setStatusFilter(''); setPriorityFilter(''); }}
                className="ml-auto text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
                <X className="w-3 h-3" /> Clear Filters
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Count ── */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-400">{projects.length} project{projects.length !== 1 ? 's' : ''}</span>
        {(statusFilter || priorityFilter || search) && (
          <span className="text-xs text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full">filtered</span>
        )}
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
            <p className="text-slate-400 text-sm">Loading projects...</p>
          </div>
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center">
            <FolderKanban className="w-8 h-8 text-slate-500" />
          </div>
          <div className="text-center">
            <p className="text-slate-300 font-semibold">No projects found</p>
            <p className="text-slate-500 text-sm mt-1">
              {search || statusFilter || priorityFilter ? 'Try adjusting your filters' : 'Create your first project to get started'}
            </p>
          </div>
          {!search && !statusFilter && !priorityFilter && (
            <button onClick={onNewProject} className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-colors">
              <Plus className="w-4 h-4" /> Create First Project
            </button>
          )}
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((proj, i) => (
            <motion.div key={proj._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <ProjectCard project={proj} onClick={() => onOpenProject(proj._id)} />
            </motion.div>
          ))}
        </div>
      ) : view === 'table' ? (
        <div className="bg-slate-900 border border-slate-800/60 rounded-2xl overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800/60">
                <th className="px-5 py-4 text-left text-xs font-semibold text-slate-400">PROJECT</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-slate-400">STATUS</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-slate-400">PRIORITY</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-slate-400">PROGRESS</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-slate-400">TEAM</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-slate-400">DEADLINE</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-slate-400">HEALTH</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-slate-400"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {projects.map((proj, i) => {
                const sc = STATUS_COLORS[proj.status] || STATUS_COLORS.Planning;
                const pc = PRIORITY_COLORS[proj.priority] || PRIORITY_COLORS.Medium;
                const hc = HEALTH_CONFIG[proj.healthStatus] || HEALTH_CONFIG.Healthy;
                const HealthIcon = hc.icon;
                const daysLeft = proj.endDate ? Math.ceil((new Date(proj.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
                return (
                  <motion.tr key={proj._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    className="hover:bg-slate-800/30 transition-colors cursor-pointer group" onClick={() => onOpenProject(proj._id)}>
                    <td className="px-5 py-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-200 group-hover:text-white">{proj.name}</p>
                        <p className="text-xs text-slate-500">{proj.projectCode} {proj.clientName ? `• ${proj.clientName}` : ''}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${sc.bg} ${sc.text}`}>{proj.status}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2 py-1 rounded-md font-medium ${pc.bg} ${pc.text}`}>{proj.priority}</span>
                    </td>
                    <td className="px-5 py-4 w-32">
                      <div className="space-y-1">
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-violet-500 rounded-full" style={{ width: `${proj.completionPercent || 0}%` }} />
                        </div>
                        <span className="text-xs text-slate-400">{proj.completionPercent || 0}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex -space-x-1.5">
                        {(proj.teamMembers || []).slice(0, 4).map((m: any, j: number) => (
                          <div key={j} className="w-6 h-6 rounded-full border-2 border-slate-900 bg-violet-600 flex items-center justify-center text-xs text-white font-bold">
                            {m.employeeName?.charAt(0) || '?'}
                          </div>
                        ))}
                        {proj.teamMembers?.length > 4 && (
                          <div className="w-6 h-6 rounded-full border-2 border-slate-900 bg-slate-700 flex items-center justify-center text-xs text-slate-300">
                            +{proj.teamMembers.length - 4}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {daysLeft !== null ? (
                        <span className={`text-xs font-semibold ${daysLeft < 0 ? 'text-red-400' : daysLeft <= 7 ? 'text-amber-400' : 'text-slate-400'}`}>
                          {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                        </span>
                      ) : <span className="text-xs text-slate-500">—</span>}
                    </td>
                    <td className="px-5 py-4">
                      <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg w-fit ${hc.bg} ${hc.text}`}>
                        <HealthIcon className="w-3 h-3" />
                        {proj.healthScore || 100}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-violet-400" />
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Kanban View by Status */
        <div className="flex gap-4 overflow-x-auto pb-4">
          {kanbanColumns.map(col => {
            const colProjs = projects.filter(p => p.status === col);
            const sc = STATUS_COLORS[col] || STATUS_COLORS.Planning;
            return (
              <div key={col} className="flex-shrink-0 w-72">
                <div className={`flex items-center gap-2 mb-3 px-3 py-2 rounded-xl ${sc.bg}`}>
                  <span className={`w-2 h-2 rounded-full ${sc.dot}`} />
                  <span className={`text-xs font-semibold ${sc.text}`}>{col}</span>
                  <span className="ml-auto text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">{colProjs.length}</span>
                </div>
                <div className="space-y-3">
                  {colProjs.map(proj => (
                    <ProjectCard key={proj._id} project={proj} onClick={() => onOpenProject(proj._id)} />
                  ))}
                  {colProjs.length === 0 && (
                    <div className="border-2 border-dashed border-slate-800 rounded-xl p-6 text-center text-slate-600 text-xs">
                      No projects
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
