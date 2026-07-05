"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard, CheckSquare, Kanban, GitBranch, Calendar, Users,
  Files, DollarSign, Shield, BarChart3, Activity, Loader2, ArrowLeft,
  Edit2, Settings, Plus, Star, AlertTriangle, CheckCircle2, Clock,
  FolderKanban, Target, Zap, TrendingUp, RefreshCcw, MoreVertical,
  ChevronRight, Building2, User, Flag, Globe, Tag, Timer,
  ChevronDown, X, Save, Trash2, Copy, Archive, Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import KanbanBoard from './KanbanBoard';
import TaskList from './TaskList';
import TeamTab from './TeamTab';
import BudgetTab from './BudgetTab';
import RiskTab from './RiskTab';
import ActivityTab from './ActivityTab';

const API = '';

function getHeaders() {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('hr_system_token') || '';
  const companyId = localStorage.getItem('companyId') || 'company_001';
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'x-company-id': companyId };
}

interface Props {
  projectId: string;
  onBack: () => void;
  employees: any[];
  role?: string;
}

const STATUS_OPTIONS = ['Planning', 'Active', 'On Hold', 'Review', 'Completed', 'Cancelled', 'Delayed'];
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Critical'];

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'kanban', label: 'Kanban', icon: Kanban },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'budget', label: 'Budget', icon: DollarSign },
  { id: 'risks', label: 'Risks', icon: Shield },
  { id: 'activity', label: 'Activity', icon: Activity },
];

const STATUS_COLORS: Record<string, string> = {
  Active: 'text-violet-400 bg-violet-500/10',
  Planning: 'text-blue-400 bg-blue-500/10',
  Completed: 'text-emerald-400 bg-emerald-500/10',
  Delayed: 'text-red-400 bg-red-500/10',
  'On Hold': 'text-amber-400 bg-amber-500/10',
  Review: 'text-cyan-400 bg-cyan-500/10',
  Cancelled: 'text-slate-400 bg-slate-500/10',
};

const HEALTH_CONFIG: Record<string, { bg: string; text: string; bar: string }> = {
  Healthy: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', bar: 'bg-emerald-500' },
  Warning: { bg: 'bg-amber-500/10', text: 'text-amber-400', bar: 'bg-amber-500' },
  Critical: { bg: 'bg-red-500/10', text: 'text-red-400', bar: 'bg-red-500' },
};

export default function ProjectDetail({ projectId, onBack, employees, role }: Props) {
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [tasks, setTasks] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [projRes, tasksRes, msRes] = await Promise.all([
        fetch(`${API}/api/projects/${projectId}`, { headers: getHeaders() as any }),
        fetch(`${API}/api/projects/${projectId}/tasks`, { headers: getHeaders() as any }),
        fetch(`${API}/api/projects/${projectId}/milestones`, { headers: getHeaders() as any }),
      ]);
      const [projJson, tasksJson, msJson] = await Promise.all([projRes.json(), tasksRes.json(), msRes.json()]);
      if (projJson.success) { setProject(projJson.data); setEditData(projJson.data); }
      if (tasksJson.success) setTasks(tasksJson.data || []);
      if (msJson.success) setMilestones(msJson.data || []);
    } catch (_) {}
    setLoading(false);
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const saveProject = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/projects/${projectId}`, {
        method: 'PUT',
        headers: getHeaders() as any,
        body: JSON.stringify({ ...editData, companyId: editData.companyId || 'company_001' })
      });
      const json = await res.json();
      if (json.success) { setProject(json.data); setEditMode(false); }
    } catch (_) {}
    setSaving(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
        </div>
        <p className="text-slate-400 text-sm">Loading project...</p>
      </div>
    </div>
  );

  if (!project) return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <p className="text-slate-400">Project not found</p>
        <button onClick={onBack} className="mt-3 text-violet-400 hover:text-violet-300 text-sm">← Back to Projects</button>
      </div>
    </div>
  );

  const hc = HEALTH_CONFIG[project.healthStatus] || HEALTH_CONFIG.Healthy;
  const sc = STATUS_COLORS[project.status] || STATUS_COLORS.Planning;
  const budgetPercent = project.approvedBudget > 0 ? Math.round((project.usedBudget / project.approvedBudget) * 100) : 0;
  const daysLeft = project.endDate ? Math.ceil((new Date(project.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'Completed').length;
  const blockedTasks = tasks.filter(t => t.status === 'Blocked').length;

  return (
    <div className="flex flex-col h-full">
      {/* ── Project Header ── */}
      <div className="bg-slate-900/80 border-b border-slate-800/60 px-6 py-5">
        {/* Row 1 */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xs text-slate-500 font-mono bg-slate-800 px-2 py-1 rounded-lg">{project.projectCode}</span>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${sc}`}>{project.status}</span>
              <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg font-semibold ${hc.bg} ${hc.text}`}>
                {project.healthStatus === 'Healthy' ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                Health: {project.healthScore || 100}
              </span>
            </div>
            {editMode ? (
              <input
                value={editData.name || ''}
                onChange={e => setEditData((d: any) => ({ ...d, name: e.target.value }))}
                className="text-2xl font-bold text-white bg-transparent border-b border-violet-500 outline-none w-full"
              />
            ) : (
              <h1 className="text-2xl font-bold text-white truncate">{project.name}</h1>
            )}
            {project.clientName && (
              <p className="text-sm text-slate-400 mt-1">{project.clientName} {project.department ? `• ${project.department}` : ''}</p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={load} className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors">
              <RefreshCcw className="w-4 h-4" />
            </button>
            {editMode ? (
              <>
                <button onClick={() => { setEditMode(false); setEditData(project); }}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white border border-slate-700 rounded-xl transition-colors">
                  Cancel
                </button>
                <button onClick={saveProject} disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save
                </button>
              </>
            ) : (
              <button onClick={() => setEditMode(true)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-xl transition-colors">
                <Edit2 className="w-4 h-4" /> Edit
              </button>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
          {[
            { label: 'Progress', value: `${project.completionPercent || 0}%`, sub: `${completedTasks}/${totalTasks} tasks`, bar: true },
            { label: 'Health Score', value: `${project.healthScore || 100}`, sub: project.healthStatus, bar: false },
            { label: 'Days Left', value: daysLeft !== null ? (daysLeft < 0 ? `${Math.abs(daysLeft)}d late` : `${daysLeft}d`) : '—', sub: project.endDate || 'No deadline', bar: false },
            { label: 'Team', value: `${project.teamMembers?.length || 0}`, sub: 'Members', bar: false },
            { label: 'Budget Used', value: `${budgetPercent}%`, sub: `₹${(project.usedBudget || 0).toLocaleString()} / ₹${(project.approvedBudget || 0).toLocaleString()}`, bar: true },
          ].map((stat, i) => (
            <div key={i} className="bg-slate-800/40 rounded-xl p-3">
              <div className="text-lg font-bold text-white mb-0.5">{stat.value}</div>
              <div className="text-xs text-slate-400 mb-1.5">{stat.label}</div>
              {stat.bar ? (
                <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${i === 0 ? 'bg-violet-500' : budgetPercent > 90 ? 'bg-red-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(100, i === 0 ? (project.completionPercent || 0) : budgetPercent)}%` }} />
                </div>
              ) : (
                <div className="text-xs text-slate-500 truncate">{stat.sub}</div>
              )}
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}>
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
              {tab.id === 'tasks' && blockedTasks > 0 && (
                <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full ml-0.5">{blockedTasks}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Content ── */}
      <div className="flex-1 overflow-auto">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
            {activeTab === 'overview' && (
              <OverviewTab project={project} editMode={editMode} editData={editData} setEditData={setEditData} tasks={tasks} milestones={milestones} />
            )}
            {activeTab === 'tasks' && (
              <TaskList projectId={projectId} projectName={project.name} employees={employees} onTasksChanged={load} />
            )}
            {activeTab === 'kanban' && (
              <KanbanBoard projectId={projectId} employees={employees} />
            )}
            {activeTab === 'team' && (
              <TeamTab project={project} employees={employees} onTeamChanged={load} />
            )}
            {activeTab === 'budget' && (
              <BudgetTab projectId={projectId} project={project} />
            )}
            {activeTab === 'risks' && (
              <RiskTab projectId={projectId} employees={employees} />
            )}
            {activeTab === 'activity' && (
              <ActivityTab projectId={projectId} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Overview Tab ──
function OverviewTab({ project, editMode, editData, setEditData, tasks, milestones }: any) {
  const completed = tasks.filter((t: any) => t.status === 'Completed').length;
  const inProgress = tasks.filter((t: any) => t.status === 'In Progress').length;
  const blocked = tasks.filter((t: any) => t.status === 'Blocked').length;
  const overdueTasks = tasks.filter((t: any) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'Completed').length;

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Info */}
        <div className="lg:col-span-2 space-y-5">
          {/* Description */}
          <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Description</h3>
            {editMode ? (
              <textarea
                value={editData.description || ''}
                onChange={e => setEditData((d: any) => ({ ...d, description: e.target.value }))}
                rows={4}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-sm text-slate-200 outline-none focus:border-violet-500 resize-none"
                placeholder="Project description..."
              />
            ) : (
              <p className="text-sm text-slate-400 leading-relaxed">{project.description || 'No description added.'}</p>
            )}
          </div>

          {/* Project Details Grid */}
          <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">Project Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Status', field: 'status', options: ['Planning', 'Active', 'On Hold', 'Review', 'Completed', 'Cancelled', 'Delayed'] },
                { label: 'Priority', field: 'priority', options: ['Low', 'Medium', 'High', 'Critical'] },
                { label: 'Start Date', field: 'startDate', type: 'date' },
                { label: 'End Date', field: 'endDate', type: 'date' },
                { label: 'Department', field: 'department', type: 'text' },
                { label: 'Client Name', field: 'clientName', type: 'text' },
                { label: 'Client Email', field: 'clientEmail', type: 'text' },
                { label: 'Total Budget (₹)', field: 'totalBudget', type: 'number' },
              ].map(f => (
                <div key={f.field}>
                  <label className="block text-xs text-slate-500 mb-1">{f.label}</label>
                  {editMode ? (
                    f.options ? (
                      <select
                        value={editData[f.field] || ''}
                        onChange={e => setEditData((d: any) => ({ ...d, [f.field]: e.target.value }))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-violet-500"
                      >
                        {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input
                        type={f.type || 'text'}
                        value={editData[f.field] || ''}
                        onChange={e => setEditData((d: any) => ({ ...d, [f.field]: e.target.value }))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-violet-500"
                      />
                    )
                  ) : (
                    <p className="text-sm text-slate-200 font-medium">
                      {(project[f.field] !== undefined && project[f.field] !== null && project[f.field] !== '') 
                        ? (f.field === 'totalBudget' ? `₹${Number(project[f.field]).toLocaleString()}` : String(project[f.field])) 
                        : '—'}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Milestones */}
          {milestones.length > 0 && (
            <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-slate-300 mb-4">Milestones</h3>
              <div className="space-y-3">
                {milestones.map((ms: any) => (
                  <div key={ms._id} className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-xl">
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                      ms.status === 'Completed' ? 'bg-emerald-500' :
                      ms.status === 'Delayed' ? 'bg-red-500' :
                      ms.status === 'In Progress' ? 'bg-violet-500' : 'bg-slate-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">{ms.name}</p>
                      {ms.dueDate && <p className="text-xs text-slate-500">Due {ms.dueDate}</p>}
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-white">{ms.completionPercent || 0}%</div>
                      <div className="text-xs text-slate-500">{ms.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div className="space-y-5">
          {/* Task Summary */}
          <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">Task Summary</h3>
            <div className="space-y-3">
              {[
                { label: 'Total Tasks', value: tasks.length, color: 'text-white' },
                { label: 'Completed', value: completed, color: 'text-emerald-400' },
                { label: 'In Progress', value: inProgress, color: 'text-blue-400' },
                { label: 'Blocked', value: blocked, color: 'text-red-400' },
                { label: 'Overdue', value: overdueTasks, color: 'text-amber-400' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">{item.label}</span>
                  <span className={`text-sm font-bold ${item.color}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Team Summary */}
          <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">Team</h3>
            {(project.teamMembers || []).length === 0 ? (
              <p className="text-xs text-slate-500">No team members yet</p>
            ) : (
              <div className="space-y-2">
                {(project.teamMembers || []).slice(0, 6).map((m: any, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-xs text-white font-bold flex-shrink-0">
                      {m.employeeName?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-200 truncate">{m.employeeName}</p>
                      <p className="text-xs text-slate-500">{m.role}</p>
                    </div>
                    <span className="text-xs text-slate-400">{m.utilization}%</span>
                  </div>
                ))}
                {project.teamMembers?.length > 6 && (
                  <p className="text-xs text-slate-500 text-center">+{project.teamMembers.length - 6} more</p>
                )}
              </div>
            )}
          </div>

          {/* Tags */}
          {project.tags?.length > 0 && (
            <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {project.tags.map((tag: string) => (
                  <span key={tag} className="text-xs px-2 py-1 bg-violet-500/10 text-violet-400 rounded-lg">{tag}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
