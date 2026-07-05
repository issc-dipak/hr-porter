"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Filter, Loader2, CheckCircle2, Clock, AlertTriangle, ChevronDown, Edit2, Trash2, X, Save, MessageSquare, Paperclip } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API = '';
function getHeaders() {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('hr_system_token') || '';
  const companyId = localStorage.getItem('companyId') || 'company_001';
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'x-company-id': companyId };
}

const STATUS_OPTIONS = ['Backlog', 'To Do', 'In Progress', 'Code Review', 'QA Testing', 'Blocked', 'Completed'];
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Urgent'];
const TYPE_OPTIONS = ['Task', 'Bug', 'Feature', 'Story', 'Epic', 'Sub-task'];

const STATUS_COLORS: Record<string, string> = {
  Backlog: 'text-slate-400 bg-slate-500/10',
  'To Do': 'text-blue-400 bg-blue-500/10',
  'In Progress': 'text-violet-400 bg-violet-500/10',
  'Code Review': 'text-cyan-400 bg-cyan-500/10',
  'QA Testing': 'text-indigo-400 bg-indigo-500/10',
  Blocked: 'text-red-400 bg-red-500/10',
  Completed: 'text-emerald-400 bg-emerald-500/10',
};

const PRIORITY_COLORS: Record<string, string> = {
  Urgent: 'text-red-400 bg-red-500/10',
  High: 'text-orange-400 bg-orange-500/10',
  Medium: 'text-yellow-400 bg-yellow-500/10',
  Low: 'text-slate-400 bg-slate-500/10',
};

interface Props {
  projectId: string;
  projectName: string;
  employees: any[];
  onTasksChanged: () => void;
}

export default function TaskList({ projectId, projectName, employees, onTasksChanged }: Props) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let url = `${API}/api/projects/${projectId}/tasks?`;
      if (statusFilter) url += `status=${encodeURIComponent(statusFilter)}&`;
      if (priorityFilter) url += `priority=${encodeURIComponent(priorityFilter)}&`;
      const res = await fetch(url, { headers: getHeaders() as any });
      const json = await res.json();
      if (json.success) setTasks(json.data || []);
    } catch (_) {}
    setLoading(false);
  }, [projectId, statusFilter, priorityFilter]);

  useEffect(() => { load(); }, [load]);

  const filtered = tasks.filter(t =>
    !search || t.title?.toLowerCase().includes(search.toLowerCase()) || t.assigneeName?.toLowerCase().includes(search.toLowerCase())
  );

  const deleteTask = async (id: string) => {
    if (!confirm('Delete this task?')) return;
    try {
      await fetch(`${API}/api/projects/${projectId}/tasks/${id}`, { method: 'DELETE', headers: getHeaders() as any });
      setTasks(prev => prev.filter(t => t._id !== id));
      onTasksChanged();
    } catch (_) {}
  };

  return (
    <div className="p-6 space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700/60 rounded-xl text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50"
          />
        </div>

        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="bg-slate-900 border border-slate-700/60 rounded-xl px-3 py-2.5 text-sm text-slate-300 outline-none focus:border-violet-500">
          <option value="">All Status</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
          className="bg-slate-900 border border-slate-700/60 rounded-xl px-3 py-2.5 text-sm text-slate-300 outline-none focus:border-violet-500">
          <option value="">All Priority</option>
          {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-colors">
          <Plus className="w-4 h-4" /> Add Task
        </button>
      </div>

      <div className="text-xs text-slate-500">{filtered.length} task{filtered.length !== 1 ? 's' : ''}</div>

      {/* Task Table */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-violet-400 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>No tasks found</p>
          <button onClick={() => setShowCreate(true)} className="mt-3 text-violet-400 hover:text-violet-300 text-sm">+ Add first task</button>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800/60 rounded-2xl overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800/60">
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400">TASK</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">TYPE</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">STATUS</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">PRIORITY</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">ASSIGNEE</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">DUE</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">HRS</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {filtered.map((task, i) => {
                const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Completed';
                const sc = STATUS_COLORS[task.status] || '';
                const pc = PRIORITY_COLORS[task.priority] || '';
                return (
                  <motion.tr key={task._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    className="hover:bg-slate-800/20 transition-colors group">
                    <td className="px-5 py-3">
                      <div className="flex items-start gap-2">
                        <div className={`w-1 h-full min-h-4 rounded-full mt-1 flex-shrink-0 ${
                          task.priority === 'Urgent' ? 'bg-red-500' :
                          task.priority === 'High' ? 'bg-orange-500' :
                          task.priority === 'Medium' ? 'bg-yellow-500' : 'bg-blue-400'
                        }`} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-200 truncate max-w-xs">{task.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {task.comments?.length > 0 && (
                              <span className="flex items-center gap-0.5 text-xs text-slate-500"><MessageSquare className="w-3 h-3" />{task.comments.length}</span>
                            )}
                            {task.checklist?.length > 0 && (
                              <span className="text-xs text-slate-500">
                                {task.checklist.filter((c: any) => c.completed).length}/{task.checklist.length} ✓
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded">{task.type || 'Task'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sc}`}>{task.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${pc}`}>{task.priority}</span>
                    </td>
                    <td className="px-4 py-3">
                      {task.assigneeName ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center text-xs text-white font-bold">{task.assigneeName.charAt(0)}</div>
                          <span className="text-xs text-slate-400 truncate max-w-20">{task.assigneeName.split(' ')[0]}</span>
                        </div>
                      ) : <span className="text-xs text-slate-600">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {task.dueDate ? (
                        <span className={`text-xs font-medium ${isOverdue ? 'text-red-400' : 'text-slate-400'}`}>
                          {isOverdue && <AlertTriangle className="inline w-3 h-3 mr-0.5" />}
                          {task.dueDate}
                        </span>
                      ) : <span className="text-xs text-slate-600">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-400">{task.loggedHours?.toFixed(1) || 0}h / {task.estimatedHours || 0}h</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setEditingTask(task)} className="p-1 text-slate-400 hover:text-violet-400 transition-colors">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => deleteTask(task._id)} className="p-1 text-slate-400 hover:text-red-400 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Task Modal */}
      <AnimatePresence>
        {(showCreate || editingTask) && (
          <TaskFormModal
            task={editingTask}
            projectId={projectId}
            projectName={projectName}
            employees={employees}
            onClose={() => { setShowCreate(false); setEditingTask(null); }}
            onSaved={() => { setShowCreate(false); setEditingTask(null); load(); onTasksChanged(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function TaskFormModal({ task, projectId, projectName, employees, onClose, onSaved }: any) {
  const isEdit = !!task;
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    type: task?.type || 'Task',
    status: task?.status || 'To Do',
    priority: task?.priority || 'Medium',
    assigneeId: task?.assigneeId || '',
    assigneeName: task?.assigneeName || '',
    startDate: task?.startDate || '',
    dueDate: task?.dueDate || '',
    storyPoints: task?.storyPoints || 0,
    estimatedHours: task?.estimatedHours || 0,
    labels: task?.labels?.join(', ') || '',
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const body = {
        ...form,
        labels: form.labels ? form.labels.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        companyId: 'company_001',
        projectName,
      };
      const url = isEdit
        ? `${API}/api/projects/${projectId}/tasks/${task._id}`
        : `${API}/api/projects/${projectId}/tasks`;
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: getHeaders() as any,
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) onSaved();
    } catch (_) {}
    setSaving(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-900 border border-slate-700/60 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="text-base font-bold text-white">{isEdit ? 'Edit Task' : 'Create Task'}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400 hover:text-white" /></button>
        </div>

        <div className="p-5 space-y-3 max-h-[70vh] overflow-auto">
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Task title *" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-violet-500" />
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Description" rows={3}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-violet-500 resize-none" />
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Type', field: 'type', options: TYPE_OPTIONS },
              { label: 'Status', field: 'status', options: STATUS_OPTIONS },
              { label: 'Priority', field: 'priority', options: PRIORITY_OPTIONS },
            ].map(f => (
              <div key={f.field}>
                <label className="block text-xs text-slate-500 mb-1">{f.label}</label>
                <select value={(form as any)[f.field]} onChange={e => setForm(fv => ({ ...fv, [f.field]: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-violet-500">
                  {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
            <div>
              <label className="block text-xs text-slate-500 mb-1">Assignee</label>
              <select value={form.assigneeId} onChange={e => {
                const emp = employees.find((em: any) => em._id === e.target.value);
                setForm(f => ({ ...f, assigneeId: e.target.value, assigneeName: emp?.fullName || '' }));
              }} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-violet-500">
                <option value="">Unassigned</option>
                {employees.map((emp: any) => <option key={emp._id} value={emp._id}>{emp.fullName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Start Date</label>
              <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-violet-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Due Date</label>
              <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-violet-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Story Points</label>
              <input type="number" value={form.storyPoints} onChange={e => setForm(f => ({ ...f, storyPoints: +e.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-violet-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Est. Hours</label>
              <input type="number" value={form.estimatedHours} onChange={e => setForm(f => ({ ...f, estimatedHours: +e.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-violet-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Labels (comma-separated)</label>
            <input value={form.labels} onChange={e => setForm(f => ({ ...f, labels: e.target.value }))}
              placeholder="e.g. frontend, urgent, api"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-violet-500" />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-800">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white border border-slate-700 rounded-xl transition-colors">Cancel</button>
          <button onClick={save} disabled={saving || !form.title.trim()}
            className="flex items-center gap-2 px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isEdit ? 'Update' : 'Create'} Task
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
