"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Loader2, GripVertical, ChevronRight, AlertTriangle, Clock, CheckCircle2, User, Calendar, Flag, MessageSquare, Paperclip, MoreVertical, X, Save, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API = '';
function getHeaders() {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('hr_system_token') || '';
  const companyId = localStorage.getItem('companyId') || 'company_001';
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'x-company-id': companyId };
}

const COLUMNS = [
  { id: 'Backlog', label: 'Backlog', color: 'text-slate-400', bg: 'bg-slate-500/10', dot: 'bg-slate-500', border: 'border-slate-700/40' },
  { id: 'To Do', label: 'To Do', color: 'text-blue-400', bg: 'bg-blue-500/10', dot: 'bg-blue-500', border: 'border-blue-700/30' },
  { id: 'In Progress', label: 'In Progress', color: 'text-violet-400', bg: 'bg-violet-500/10', dot: 'bg-violet-500', border: 'border-violet-700/30' },
  { id: 'Code Review', label: 'Code Review', color: 'text-cyan-400', bg: 'bg-cyan-500/10', dot: 'bg-cyan-500', border: 'border-cyan-700/30' },
  { id: 'QA Testing', label: 'QA Testing', color: 'text-indigo-400', bg: 'bg-indigo-500/10', dot: 'bg-indigo-500', border: 'border-indigo-700/30' },
  { id: 'Blocked', label: 'Blocked', color: 'text-red-400', bg: 'bg-red-500/10', dot: 'bg-red-500', border: 'border-red-700/30' },
  { id: 'Completed', label: 'Completed', color: 'text-emerald-400', bg: 'bg-emerald-500/10', dot: 'bg-emerald-500', border: 'border-emerald-700/30' },
];

const PRIORITY_COLORS: Record<string, string> = {
  Urgent: 'bg-red-500',
  High: 'bg-orange-500',
  Medium: 'bg-yellow-500',
  Low: 'bg-blue-400',
};

interface Props {
  projectId: string;
  employees: any[];
}

interface TaskCardProps {
  task: any;
  onDragStart: (e: any, taskId: string, fromCol: string) => void;
  onClick: () => void;
}

function TaskCard({ task, onDragStart, onClick }: TaskCardProps) {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Completed';
  const checklistDone = (task.checklist || []).filter((c: any) => c.completed).length;
  const checklistTotal = (task.checklist || []).length;

  return (
    <motion.div
      draggable
      onDragStart={e => onDragStart(e as any, task._id, task.kanbanColumn)}
      onClick={onClick}
      whileHover={{ scale: 1.01, y: -2 }}
      className="bg-slate-800/60 hover:bg-slate-800 border border-slate-700/40 hover:border-violet-500/30 rounded-xl p-3 cursor-pointer transition-all group"
    >
      {/* Priority stripe */}
      <div className={`h-0.5 w-full ${PRIORITY_COLORS[task.priority] || 'bg-slate-600'} rounded-full mb-2`} />

      {/* Type + Priority badge */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-500 bg-slate-700/50 px-1.5 py-0.5 rounded">{task.type || 'Task'}</span>
        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
          task.priority === 'Urgent' ? 'bg-red-500/10 text-red-400' :
          task.priority === 'High' ? 'bg-orange-500/10 text-orange-400' :
          task.priority === 'Medium' ? 'bg-yellow-500/10 text-yellow-400' :
          'bg-slate-700/50 text-slate-400'
        }`}>{task.priority}</span>
      </div>

      {/* Title */}
      <p className="text-sm font-medium text-slate-200 group-hover:text-white leading-snug mb-2 line-clamp-2">{task.title}</p>

      {/* Checklist progress */}
      {checklistTotal > 0 && (
        <div className="mb-2">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Checklist</span>
            <span>{checklistDone}/{checklistTotal}</span>
          </div>
          <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-violet-500 rounded-full" style={{ width: `${(checklistDone / checklistTotal) * 100}%` }} />
          </div>
        </div>
      )}

      {/* Labels */}
      {(task.labels || []).length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.labels.slice(0, 2).map((l: string) => (
            <span key={l} className="text-xs bg-violet-500/10 text-violet-400 px-1.5 py-0.5 rounded">{l}</span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-2">
          {task.comments?.length > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-slate-500">
              <MessageSquare className="w-3 h-3" />{task.comments.length}
            </span>
          )}
          {task.attachments?.length > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-slate-500">
              <Paperclip className="w-3 h-3" />{task.attachments.length}
            </span>
          )}
          {task.storyPoints > 0 && (
            <span className="text-xs bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded font-mono">{task.storyPoints}pt</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {isOverdue && <AlertTriangle className="w-3 h-3 text-red-400" />}
          {task.dueDate && (
            <span className={`text-xs ${isOverdue ? 'text-red-400' : 'text-slate-500'}`}>
              {new Date(task.dueDate).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
            </span>
          )}
          {task.assigneeName && (
            <div className="w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center text-xs text-white font-bold ml-1">
              {task.assigneeName.charAt(0)}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function KanbanBoard({ projectId, employees }: Props) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragFromCol, setDragFromCol] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [showAddTask, setShowAddTask] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/projects/${projectId}/tasks`, { headers: getHeaders() as any });
      const json = await res.json();
      if (json.success) setTasks(json.data || []);
    } catch (_) {}
    setLoading(false);
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const handleDragStart = (e: React.DragEvent, taskId: string, fromCol: string) => {
    setDraggedId(taskId);
    setDragFromCol(fromCol);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = async (e: React.DragEvent, toCol: string) => {
    e.preventDefault();
    if (!draggedId || dragFromCol === toCol) return;

    const tasks2 = tasks.map(t => t._id === draggedId ? { ...t, kanbanColumn: toCol, status: toCol } : t);
    setTasks(tasks2);

    try {
      await fetch(`${API}/api/projects/${projectId}/tasks/${draggedId}/kanban`, {
        method: 'PATCH',
        headers: getHeaders() as any,
        body: JSON.stringify({ companyId: 'company_001', column: toCol, status: toCol, order: 0 })
      });
    } catch (_) {}
    setDraggedId(null);
    setDragFromCol(null);
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };

  const addQuickTask = async (column: string) => {
    if (!newTaskTitle.trim()) return;
    try {
      const res = await fetch(`${API}/api/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: getHeaders() as any,
        body: JSON.stringify({
          companyId: 'company_001',
          title: newTaskTitle,
          status: column,
          kanbanColumn: column,
          priority: 'Medium',
          type: 'Task',
        })
      });
      const json = await res.json();
      if (json.success) setTasks(prev => [...prev, json.data]);
    } catch (_) {}
    setNewTaskTitle('');
    setShowAddTask(null);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-80">
      <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-300px)]">
        {COLUMNS.map(col => {
          const colTasks = tasks
            .filter(t => (t.kanbanColumn || t.status) === col.id)
            .sort((a, b) => (a.kanbanOrder || 0) - (b.kanbanOrder || 0));

          return (
            <div key={col.id} className={`flex-shrink-0 w-72 flex flex-col rounded-2xl border ${col.border} bg-slate-900/60`}
              onDragOver={handleDragOver}
              onDrop={e => handleDrop(e, col.id)}
            >
              {/* Column Header */}
              <div className={`flex items-center gap-2 px-4 py-3 border-b border-slate-800/50`}>
                <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                <span className={`text-xs font-bold ${col.color}`}>{col.label}</span>
                <span className="ml-auto text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">{colTasks.length}</span>
                <button onClick={() => { setShowAddTask(col.id); setNewTaskTitle(''); }}
                  className="text-slate-500 hover:text-slate-300 transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Tasks */}
              <div className="flex-1 p-3 space-y-2.5 overflow-y-auto">
                {/* Quick Add Input */}
                {showAddTask === col.id && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                    <textarea
                      autoFocus
                      value={newTaskTitle}
                      onChange={e => setNewTaskTitle(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addQuickTask(col.id); } if (e.key === 'Escape') setShowAddTask(null); }}
                      placeholder="Task title... (Enter to add)"
                      rows={2}
                      className="w-full bg-slate-700/50 border border-slate-600 rounded-xl p-2 text-sm text-slate-200 placeholder:text-slate-500 outline-none focus:border-violet-500 resize-none"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => addQuickTask(col.id)}
                        className="flex-1 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs rounded-lg transition-colors font-semibold">
                        Add Task
                      </button>
                      <button onClick={() => setShowAddTask(null)}
                        className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-400 text-xs rounded-lg transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {colTasks.map(task => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    onDragStart={handleDragStart}
                    onClick={() => setSelectedTask(task)}
                  />
                ))}

                {colTasks.length === 0 && showAddTask !== col.id && (
                  <div className="border-2 border-dashed border-slate-800 rounded-xl p-6 text-center text-slate-600 text-xs">
                    Drop tasks here
                  </div>
                )}
              </div>

              {/* Add Task Footer */}
              {showAddTask !== col.id && (
                <button onClick={() => { setShowAddTask(col.id); setNewTaskTitle(''); }}
                  className="flex items-center gap-2 px-4 py-3 text-xs text-slate-500 hover:text-slate-300 transition-colors border-t border-slate-800/50">
                  <Plus className="w-3.5 h-3.5" /> Add Task
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Task Detail Modal */}
      <AnimatePresence>
        {selectedTask && (
          <TaskDetailModal
            task={selectedTask}
            projectId={projectId}
            employees={employees}
            onClose={() => setSelectedTask(null)}
            onSaved={(updated: any) => {
              setTasks(prev => prev.map(t => t._id === updated._id ? updated : t));
              setSelectedTask(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function TaskDetailModal({ task, projectId, employees, onClose, onSaved }: any) {
  const [data, setData] = useState({ ...task });
  const [saving, setSaving] = useState(false);
  const [newComment, setNewComment] = useState('');

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/projects/${projectId}/tasks/${task._id}`, {
        method: 'PUT',
        headers: getHeaders() as any,
        body: JSON.stringify({ ...data, companyId: 'company_001' })
      });
      const json = await res.json();
      if (json.success) onSaved(json.data);
    } catch (_) {}
    setSaving(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-slate-900 border border-slate-700/60 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl"
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded-lg">{task.type || 'Task'}</span>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-auto p-5 space-y-4">
          <input
            value={data.title || ''}
            onChange={e => setData((d: any) => ({ ...d, title: e.target.value }))}
            className="text-xl font-bold text-white bg-transparent border-b border-slate-700 pb-2 w-full outline-none focus:border-violet-500"
          />

          <textarea
            value={data.description || ''}
            onChange={e => setData((d: any) => ({ ...d, description: e.target.value }))}
            placeholder="Add description..."
            rows={3}
            className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-sm text-slate-300 outline-none focus:border-violet-500 resize-none"
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Status</label>
              <select value={data.status || ''} onChange={e => setData((d: any) => ({ ...d, status: e.target.value, kanbanColumn: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none">
                {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Priority</label>
              <select value={data.priority || ''} onChange={e => setData((d: any) => ({ ...d, priority: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none">
                {['Low', 'Medium', 'High', 'Urgent'].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Assignee</label>
              <select value={data.assigneeId || ''} onChange={e => {
                const emp = employees.find((em: any) => em._id === e.target.value);
                setData((d: any) => ({ ...d, assigneeId: e.target.value, assigneeName: emp?.fullName || '' }));
              }} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none">
                <option value="">Unassigned</option>
                {employees.map((e: any) => <option key={e._id} value={e._id}>{e.fullName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Due Date</label>
              <input type="date" value={data.dueDate || ''} onChange={e => setData((d: any) => ({ ...d, dueDate: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Story Points</label>
              <input type="number" value={data.storyPoints || 0} onChange={e => setData((d: any) => ({ ...d, storyPoints: +e.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Est. Hours</label>
              <input type="number" value={data.estimatedHours || 0} onChange={e => setData((d: any) => ({ ...d, estimatedHours: +e.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none" />
            </div>
          </div>

          {/* Comments */}
          {(data.comments || []).length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 mb-2">Comments</h4>
              <div className="space-y-2">
                {data.comments.map((c: any, i: number) => (
                  <div key={i} className="flex gap-2">
                    <div className="w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center text-xs text-white flex-shrink-0">
                      {c.authorName?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 bg-slate-800/50 rounded-xl p-2">
                      <p className="text-xs font-medium text-slate-300">{c.authorName}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{c.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-slate-800 flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white border border-slate-700 rounded-xl transition-colors">Cancel</button>
          <button onClick={save} disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Task
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
