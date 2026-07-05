"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Clock, CheckCircle2, AlertTriangle, Calendar as CalendarIcon, FileText,
  MessageSquare, BarChart3, Loader2, Play, Pause, Square, Plus, Send,
  Paperclip, ExternalLink, ChevronRight, LayoutGrid, CheckSquare,
  History, Settings, User, Building, Trash2, ArrowUpRight, Flame, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie } from 'recharts';

const API = '';
const STATUS_OPTIONS = ['To Do', 'In Progress', 'Code Review', 'QA Testing', 'Completed'];

function getHeaders() {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('hr_system_token') || '';
  const companyId = localStorage.getItem('companyId') || 'company_001';
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'x-company-id': companyId };
}

interface Props {
  profile: any;
  employees: any[];
}

export default function EmployeeWorkspace({ profile, employees }: Props) {
  const employeeId = profile?._id || profile?.id || '';
  const employeeName = profile?.fullName || profile?.name || 'Employee';

  const [activeTab, setActiveTab] = useState<'dashboard' | 'tasks' | 'projects' | 'time' | 'files' | 'discussions' | 'reports'>('dashboard');
  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [timeLogs, setTimeLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Discussions States
  const [activities, setActivities] = useState<any[]>([]);
  const [selectedProjectIdForDiscussion, setSelectedProjectIdForDiscussion] = useState('');
  const [discussionComment, setDiscussionComment] = useState('');
  const [postingDiscussion, setPostingDiscussion] = useState(false);
  const [loadingDiscussions, setLoadingDiscussions] = useState(false);

  // Timer States
  const [runningTimer, setRunningTimer] = useState<any>(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [selectedTaskForTimer, setSelectedTaskForTimer] = useState('');
  const [timerNote, setTimerNote] = useState('');

  // Form states
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<any>(null);
  const [manualTime, setManualTime] = useState({ taskId: '', durationHours: '', date: new Date().toISOString().split('T')[0], note: '' });
  const [newComment, setNewComment] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  const fetchDiscussions = useCallback(async (projId: string) => {
    if (!projId) return;
    setLoadingDiscussions(true);
    try {
      const res = await fetch(`${API}/api/projects/${projId}/activity?limit=50`, { headers: getHeaders() as any });
      const json = await res.json();
      if (json.success) {
        setActivities(json.data || []);
      }
    } catch (_) {}
    setLoadingDiscussions(false);
  }, []);

  // Load employee data
  const loadData = useCallback(async () => {
    if (!employeeId) return;
    setLoading(true);
    try {
      const [projRes, tasksRes, logsRes, timerRes] = await Promise.all([
        fetch(`${API}/api/projects`, { headers: getHeaders() as any }),
        fetch(`${API}/api/projects`, { headers: getHeaders() as any }).then(async (r) => {
          // Find all tasks assigned to me across projects
          const pData = await r.json();
          const allTasks: any[] = [];
          if (pData.success && pData.data) {
            for (const p of pData.data) {
              const tRes = await fetch(`${API}/api/projects/${p._id}/tasks?assigneeId=${employeeId}`, { headers: getHeaders() as any });
              const tJson = await tRes.json();
              if (tJson.success) allTasks.push(...tJson.data);
            }
          }
          return { success: true, data: allTasks };
        }),
        fetch(`${API}/api/timelogs/employee/${employeeId}`, { headers: getHeaders() as any }),
        fetch(`${API}/api/timelogs/running/${employeeId}`, { headers: getHeaders() as any })
      ]);

      const [projJson, tasksJson, logsJson, timerJson] = await Promise.all([
        projRes.json(),
        tasksRes,
        logsRes.json(),
        timerRes.json()
      ]);

      if (projJson.success) {
        // filter projects where employee is a team member
        const myProjects = (projJson.data || []).filter((p: any) =>
          p.projectManagerId === employeeId ||
          (p.teamMembers || []).some((m: any) => m.employeeId === employeeId)
        );
        setProjects(myProjects);
        if (myProjects.length > 0 && !selectedProjectIdForDiscussion) {
          setSelectedProjectIdForDiscussion(myProjects[0]._id);
          fetchDiscussions(myProjects[0]._id);
        }
      }
      if (tasksJson.success) setTasks(tasksJson.data || []);
      if (logsJson.success) setTimeLogs(logsJson.data || []);
      if (timerJson.success && timerJson.isRunning) {
        setRunningTimer(timerJson.data);
        const elapsed = Math.round((Date.now() - new Date(timerJson.data.startTime).getTime()) / 1000);
        setTimerSeconds(elapsed);
      } else {
        setRunningTimer(null);
      }
    } catch (_) {}
    setLoading(false);
  }, [employeeId, selectedProjectIdForDiscussion, fetchDiscussions]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (selectedProjectIdForDiscussion) {
      fetchDiscussions(selectedProjectIdForDiscussion);
    }
  }, [selectedProjectIdForDiscussion, fetchDiscussions]);

  const handlePostDiscussion = async () => {
    if (!selectedProjectIdForDiscussion || !discussionComment.trim()) return;
    setPostingDiscussion(true);
    try {
      const res = await fetch(`${API}/api/projects/${selectedProjectIdForDiscussion}/comments`, {
        method: 'POST',
        headers: getHeaders() as any,
        body: JSON.stringify({
          actorId: employeeId,
          actorName: employeeName,
          content: discussionComment
        })
      });
      const json = await res.json();
      if (json.success) {
        setDiscussionComment('');
        fetchDiscussions(selectedProjectIdForDiscussion);
      }
    } catch (_) {}
    setPostingDiscussion(false);
  };

  // Timer Tick
  useEffect(() => {
    let interval: any;
    if (runningTimer) {
      interval = setInterval(() => {
        setTimerSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [runningTimer]);

  // Start Timer
  const handleStartTimer = async () => {
    if (!selectedTaskForTimer) return;
    const task = tasks.find(t => t._id === selectedTaskForTimer);
    try {
      const res = await fetch(`${API}/api/timelogs/start`, {
        method: 'POST',
        headers: getHeaders() as any,
        body: JSON.stringify({
          employeeId,
          employeeName,
          projectId: task?.projectId,
          projectName: task?.projectName,
          taskId: task?._id,
          taskName: task?.title,
          note: timerNote,
          isBillable: true
        })
      });
      const json = await res.json();
      if (json.success) {
        setRunningTimer(json.data);
        setTimerSeconds(0);
        setTimerNote('');
      }
    } catch (_) {}
  };

  // Stop Timer
  const handleStopTimer = async () => {
    try {
      const res = await fetch(`${API}/api/timelogs/stop`, {
        method: 'POST',
        headers: getHeaders() as any,
        body: JSON.stringify({ employeeId })
      });
      const json = await res.json();
      if (json.success) {
        setRunningTimer(null);
        loadData();
      }
    } catch (_) {}
  };

  // Log Manual Time
  const handleManualTimeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTime.taskId || !manualTime.durationHours) return;
    const task = tasks.find(t => t._id === manualTime.taskId);
    try {
      const res = await fetch(`${API}/api/timelogs/start`, {
        method: 'POST',
        headers: getHeaders() as any,
        body: JSON.stringify({
          employeeId,
          employeeName,
          projectId: task?.projectId,
          projectName: task?.projectName,
          taskId: task?._id,
          taskName: task?.title,
          duration: parseFloat(manualTime.durationHours) * 60,
          date: manualTime.date,
          note: manualTime.note,
          isManualEntry: true,
          isBillable: true,
          status: 'Pending'
        })
      });
      const json = await res.json();
      if (json.success) {
        setManualTime({ taskId: '', durationHours: '', date: new Date().toISOString().split('T')[0], note: '' });
        loadData();
      }
    } catch (_) {}
  };

  // Task Status Update
  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    const task = tasks.find(t => t._id === taskId);
    if (!task) return;
    try {
      const res = await fetch(`${API}/api/projects/${task.projectId}/tasks/${taskId}`, {
        method: 'PUT',
        headers: getHeaders() as any,
        body: JSON.stringify({ status: newStatus, kanbanColumn: newStatus })
      });
      const json = await res.json();
      if (json.success) {
        setTasks(prev => prev.map(t => t._id === taskId ? json.data : t));
        if (selectedTaskDetail?._id === taskId) setSelectedTaskDetail(json.data);
      }
    } catch (_) {}
  };

  // Add Comment to Task
  const handleAddComment = async (taskId: string) => {
    if (!newComment.trim()) return;
    const task = tasks.find(t => t._id === taskId);
    if (!task) return;
    try {
      const res = await fetch(`${API}/api/projects/${task.projectId}/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: getHeaders() as any,
        body: JSON.stringify({
          authorId: employeeId,
          authorName: employeeName,
          content: newComment
        })
      });
      const json = await res.json();
      if (json.success) {
        setTasks(prev => prev.map(t => t._id === taskId ? json.data : t));
        setSelectedTaskDetail(json.data);
        setNewComment('');
      }
    } catch (_) {}
  };

  const getWeeklyChartData = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const sums = [0, 0, 0, 0, 0, 0, 0];
    
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    timeLogs.forEach(log => {
      const logDate = new Date(log.date);
      if (logDate >= startOfWeek) {
        const dayIdx = logDate.getDay();
        sums[dayIdx] += (log.duration || 0) / 60;
      }
    });

    return days.map((day, i) => ({
      name: day,
      hours: parseFloat(sums[i].toFixed(1))
    }));
  };

  const formatTimerTime = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
          <p className="text-slate-400 text-sm">Loading Workspace...</p>
        </div>
      </div>
    );
  }

  // Dashboard Stats
  const pendingTasks = tasks.filter(t => t.status !== 'Completed');
  const urgentTasks = pendingTasks.filter(t => t.priority === 'Urgent' || t.priority === 'High');
  const completedTasks = tasks.filter(t => t.status === 'Completed');

  // Weekly hours logged calculation
  const weeklyHours = timeLogs
    .filter(log => {
      const logDate = new Date(log.date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return logDate >= weekAgo;
    })
    .reduce((sum, log) => sum + (log.duration || 0), 0) / 60;

  return (
    <div className="flex flex-col h-full bg-slate-950 min-h-screen text-slate-100 pb-20">
      
      {/* ── Active Timer Bar (Sticky Top/Float) ── */}
      <div className="mx-6 mt-4">
        {runningTimer ? (
          <div className="bg-gradient-to-r from-violet-600/90 to-indigo-600/90 border border-violet-500/40 rounded-2xl p-4 flex items-center justify-between shadow-xl shadow-violet-500/10 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center animate-pulse">
                <Clock className="w-4 h-4 text-emerald-400 animate-spin" style={{ animationDuration: '6s' }} />
              </div>
              <div>
                <p className="text-xs text-violet-200">Active Timer</p>
                <p className="text-sm font-bold text-white truncate max-w-xs">{runningTimer.taskName}</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <span className="text-2xl font-mono font-black tracking-wider text-white">{formatTimerTime(timerSeconds)}</span>
              <button
                onClick={handleStopTimer}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95"
              >
                <Square className="w-3.5 h-3.5" /> Stop Timer
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                <Clock className="w-4 h-4 text-slate-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold">Ready to work?</p>
                <p className="text-xs text-slate-500">Select a task and start the tracker</p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-1 max-w-md min-w-0">
              <select
                value={selectedTaskForTimer}
                onChange={e => setSelectedTaskForTimer(e.target.value)}
                className="flex-1 min-w-0 max-w-[200px] bg-slate-800 border border-slate-700/80 rounded-xl px-3 py-2 text-xs outline-none text-slate-200 focus:border-violet-500 truncate"
              >
                <option value="">Choose task...</option>
                {tasks.map(t => (
                  <option key={t._id} value={t._id}>{t.title} ({t.projectName}) [{t.status}]</option>
                ))}
              </select>
              <input
                value={timerNote}
                onChange={e => setTimerNote(e.target.value)}
                placeholder="What are you working on?"
                className="flex-1 bg-slate-800 border border-slate-700/80 rounded-xl px-3 py-2 text-xs outline-none text-slate-200 focus:border-violet-500"
              />
              <button
                onClick={handleStartTimer}
                disabled={!selectedTaskForTimer}
                className="flex items-center gap-1 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-40"
              >
                <Play className="w-3 h-3 fill-current" /> Start
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Tabs Navigation ── */}
      <div className="flex items-center gap-1 overflow-x-auto px-6 mt-4 border-b border-slate-800/60 pb-2">
        {[
          { id: 'dashboard', label: 'My Workspace', icon: LayoutGrid },
          { id: 'tasks', label: 'My Tasks', icon: CheckSquare },
          { id: 'projects', label: 'Assigned Projects', icon: FileText },
          { id: 'time', label: 'Time Tracking', icon: Clock },
          { id: 'discussions', label: 'Discussions', icon: MessageSquare },
          { id: 'reports', label: 'My Reports', icon: BarChart3 },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-violet-600/10 text-violet-400 border border-violet-500/20 shadow shadow-violet-500/5'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab View Render ── */}
      <div className="px-6 mt-6 flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === 'dashboard' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Columns (Stats + Tasks) */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Top Stats Row */}
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: 'Weekly Hours', value: `${weeklyHours.toFixed(1)}h`, icon: Clock, color: 'text-violet-400 bg-violet-500/10' },
                      { label: 'Pending Tasks', value: pendingTasks.length, icon: AlertTriangle, color: 'text-amber-400 bg-amber-500/10' },
                      { label: 'Completed Tasks', value: completedTasks.length, icon: CheckCircle2, color: 'text-emerald-400 bg-emerald-500/10' },
                    ].map(card => (
                      <div key={card.label} className="bg-slate-900 border border-slate-800/60 rounded-2xl p-4 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{card.label}</p>
                          <p className="text-2xl font-black text-white mt-1">{card.value}</p>
                        </div>
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.color}`}>
                          <card.icon className="w-4.5 h-4.5" />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Today's Tasks */}
                  <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-slate-200">Today's Focus Tasks</h3>
                      {urgentTasks.length > 0 && (
                        <span className="flex items-center gap-1 text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full font-semibold">
                          <Flame className="w-3.5 h-3.5 fill-current" /> {urgentTasks.length} Urgent
                        </span>
                      )}
                    </div>
                    {pendingTasks.length === 0 ? (
                      <div className="text-center py-10 text-slate-500 text-xs">No pending tasks assigned to you. Enjoy your day! 🎉</div>
                    ) : (
                      <div className="space-y-3">
                        {pendingTasks.slice(0, 5).map(task => (
                          <div key={task._id} className="bg-slate-800/40 hover:bg-slate-800/80 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between gap-4 transition-colors">
                            <div className="min-w-0">
                              <p className="text-xs text-violet-400 font-medium mb-0.5">{task.projectName}</p>
                              <p className="text-sm font-bold text-slate-200 truncate">{task.title}</p>
                              {task.dueDate && <p className="text-xs text-slate-500 mt-1">Due {task.dueDate}</p>}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <select
                                value={task.status}
                                onChange={e => updateTaskStatus(task._id, e.target.value)}
                                className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs text-slate-300 outline-none"
                              >
                                <option value="To Do">To Do</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Code Review">Code Review</option>
                                <option value="QA Testing">QA Testing</option>
                                <option value="Completed">Completed</option>
                              </select>
                              <button onClick={() => setSelectedTaskDetail(task)} className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300">
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Columns (Projects list + Progress logs) */}
                <div className="space-y-6">
                  {/* Assigned Projects */}
                  <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5">
                    <h3 className="text-sm font-bold text-slate-200 mb-4">My Projects</h3>
                    {projects.length === 0 ? (
                      <div className="text-center py-6 text-slate-500 text-xs">No active projects assigned to you.</div>
                    ) : (
                      <div className="space-y-3">
                        {projects.slice(0, 4).map(proj => (
                          <div key={proj._id} className="space-y-2 pb-3 border-b border-slate-800/50 last:border-b-0 last:pb-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-200 truncate max-w-36">{proj.name}</span>
                              <span className="text-[10px] text-slate-500 font-mono">{proj.projectCode}</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-slate-400">
                              <span>Manager: {proj.projectManagerName || 'HR Core Team'}</span>
                              <span className="font-semibold">{proj.completionPercent || 0}%</span>
                            </div>
                            <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-violet-600 rounded-full" style={{ width: `${proj.completionPercent || 0}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Quick Manual Entry Form */}
                  <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5">
                    <h3 className="text-sm font-bold text-slate-200 mb-3">Quick Manual Log</h3>
                    <form onSubmit={handleManualTimeSubmit} className="space-y-3">
                      <select
                        value={manualTime.taskId}
                        onChange={e => setManualTime(f => ({ ...f, taskId: e.target.value }))}
                        className="w-full bg-slate-800 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none"
                      >
                        <option value="">Select task...</option>
                        {tasks.map(t => (
                          <option key={t._id} value={t._id}>{t.title} ({t.projectName}) [{t.status}]</option>
                        ))}
                      </select>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          step="0.5"
                          value={manualTime.durationHours}
                          onChange={e => setManualTime(f => ({ ...f, durationHours: e.target.value }))}
                          placeholder="Hours (e.g. 2.5)"
                          className="w-full bg-slate-800 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none"
                          onInput={(e: any) => {
                            setManualTime(f => ({ ...f, durationHours: e.target.value }));
                          }}
                        />
                        <input
                          type="date"
                          value={manualTime.date}
                          onChange={e => setManualTime(f => ({ ...f, date: e.target.value }))}
                          className="w-full bg-slate-800 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none"
                        />
                      </div>
                      <input
                        value={manualTime.note}
                        onChange={e => setManualTime(f => ({ ...f, note: e.target.value }))}
                        placeholder="Log details..."
                        className="w-full bg-slate-800 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none"
                      />
                      <button
                        type="submit"
                        disabled={!manualTime.taskId || !manualTime.durationHours}
                        className="w-full py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-40"
                      >
                        Submit Log
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* ── My Tasks View ── */}
            {activeTab === 'tasks' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="text-base font-bold text-white">Assigned Tasks</h3>
                  <div className="flex gap-2">
                    {STATUS_OPTIONS.map(s => {
                      const count = tasks.filter(t => t.status === s).length;
                      return (
                        <span key={s} className="text-xs bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-slate-400">
                          {s}: <strong className="text-white">{count}</strong>
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tasks.map(task => {
                    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Completed';
                    return (
                      <div
                        key={task._id}
                        className="bg-slate-900 border border-slate-800/80 hover:border-violet-500/30 rounded-2xl p-4 flex flex-col justify-between h-48 transition-all group"
                      >
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] text-violet-400 font-semibold">{task.projectName}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                              task.priority === 'Urgent' ? 'bg-red-500/10 text-red-400' :
                              task.priority === 'High' ? 'bg-orange-500/10 text-orange-400' :
                              'bg-slate-800 text-slate-400'
                            }`}>{task.priority}</span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-200 line-clamp-2 group-hover:text-white">{task.title}</h4>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-800/50 mt-4">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            task.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400' :
                            task.status === 'In Progress' ? 'bg-blue-500/10 text-blue-400' :
                            'bg-slate-800 text-slate-450'
                          }`}>{task.status}</span>
                          {task.dueDate && (
                            <span className={`text-xs ${isOverdue ? 'text-red-400 font-semibold' : 'text-slate-500'}`}>
                              {isOverdue && '⚠️ '}
                              {task.dueDate}
                            </span>
                          )}
                          <button onClick={() => setSelectedTaskDetail(task)} className="text-xs text-violet-400 hover:text-violet-300 font-semibold flex items-center gap-0.5">
                            Workspace <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Assigned Projects View ── */}
            {activeTab === 'projects' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map(proj => (
                  <div key={proj._id} className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] text-slate-500 font-mono">{proj.projectCode}</span>
                        <span className="text-xs text-violet-400 font-semibold">{proj.status}</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-200">{proj.name}</h4>
                      {proj.description && <p className="text-xs text-slate-500 mt-2 line-clamp-2">{proj.description}</p>}
                    </div>

                    <div className="space-y-2 mt-4 pt-4 border-t border-slate-800/50">
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>Timeline:</span>
                        <span>{proj.startDate || '—'} to {proj.endDate || '—'}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>Project Manager:</span>
                        <span>{proj.projectManagerName || 'Core Lab'}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>Tasks Completed:</span>
                        <span>{proj.tasksCompleted || 0} / {proj.tasksTotal || 0}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Time Tracking View ── */}
            {activeTab === 'time' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Time log history */}
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800/60 rounded-2xl overflow-hidden">
                  <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-200">Timesheet Logs</h3>
                    <span className="text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-400">Past 50 records</span>
                  </div>
                  <div className="overflow-auto max-h-[500px]">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-800/50">
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">Task Name</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">Date</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400">Hours</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/30">
                        {timeLogs.map((log: any) => (
                          <tr key={log._id} className="hover:bg-slate-800/20">
                            <td className="px-4 py-3 text-xs text-slate-200 font-semibold truncate max-w-40">{log.taskName || 'Timer Session'}</td>
                            <td className="px-4 py-3 text-xs text-slate-400">{log.date}</td>
                            <td className="px-4 py-3 text-xs text-right font-semibold text-white">{((log.duration || 0) / 60).toFixed(2)}h</td>
                            <td className="px-4 py-3">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                                log.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400' :
                                log.status === 'Rejected' ? 'bg-red-500/10 text-red-400' :
                                'bg-amber-500/10 text-amber-400'
                              }`}>{log.status}</span>
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-500 max-w-32 truncate">{log.note || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Log manual form on side */}
                <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5 h-fit">
                  <h3 className="text-sm font-bold text-slate-200 mb-4">Manual Entry Submission</h3>
                  <form onSubmit={handleManualTimeSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Assigned Task *</label>
                      <select
                        value={manualTime.taskId}
                        onChange={e => setManualTime(f => ({ ...f, taskId: e.target.value }))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                      >
                        <option value="">Select task...</option>
                        {tasks.map(t => (
                          <option key={t._id} value={t._id}>{t.title} ({t.projectName}) [{t.status}]</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Duration (Hours) *</label>
                      <input
                        type="number"
                        step="0.5"
                        value={manualTime.durationHours}
                        onChange={e => setManualTime(f => ({ ...f, durationHours: e.target.value }))}
                        placeholder="e.g. 4.5"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Date</label>
                      <input
                        type="date"
                        value={manualTime.date}
                        onChange={e => setManualTime(f => ({ ...f, date: e.target.value }))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Log Description Notes</label>
                      <textarea
                        value={manualTime.note}
                        onChange={e => setManualTime(f => ({ ...f, note: e.target.value }))}
                        rows={3}
                        placeholder="What did you build or resolve?"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 outline-none resize-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!manualTime.taskId || !manualTime.durationHours}
                      className="w-full py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-40"
                    >
                      Submit for Approval
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Discussions / Group Board */}
            {activeTab === 'discussions' && (
              <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-6 space-y-4 max-w-4xl mx-auto shadow-lg">
                <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-200">Team Discussions Board</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Post status updates and communicate with project managers.</p>
                  </div>
                  {/* Project Selector for discussions */}
                  <select
                    value={selectedProjectIdForDiscussion}
                    onChange={e => setSelectedProjectIdForDiscussion(e.target.value)}
                    className="bg-slate-800 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-violet-500 min-w-48"
                  >
                    {projects.map(p => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {/* Discussions Feed List */}
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                  {loadingDiscussions ? (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
                    </div>
                  ) : activities.length === 0 ? (
                    <div className="border border-slate-800/80 rounded-xl p-8 bg-slate-950/20 text-center text-slate-500 text-xs">
                      No discussions or activities logged yet. Type below to start the conversation!
                    </div>
                  ) : (
                    activities.map((act: any) => (
                      <div key={act._id} className="p-3 bg-slate-950/30 rounded-xl border border-slate-850 flex gap-3 items-start">
                        <div className="w-7 h-7 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-[10px] font-bold text-violet-400 shrink-0 uppercase">
                          {(act.actorName || 'U').substring(0, 2)}
                        </div>
                        <div className="flex-1 space-y-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-200">{act.actorName}</span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {new Date(act.createdAt).toLocaleString(undefined, { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-slate-350 break-words leading-relaxed">
                            {act.action === 'posted a comment' ? act.entityName : `${act.action} ${act.entity} (${act.entityName || ''})`}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Discussion Input */}
                <div className="flex gap-3 items-end pt-2 border-t border-slate-800/50">
                  <textarea
                    value={discussionComment}
                    onChange={e => setDiscussionComment(e.target.value)}
                    placeholder="Ask a question or post an update..."
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-violet-500 resize-none"
                    rows={2}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handlePostDiscussion();
                      }
                    }}
                  />
                  <button
                    onClick={handlePostDiscussion}
                    disabled={postingDiscussion || !discussionComment.trim() || !selectedProjectIdForDiscussion}
                    className="p-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-xl transition-all shadow-md active:scale-95 shrink-0"
                  >
                    {postingDiscussion ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Personal Reports */}
            {activeTab === 'reports' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5 shadow-lg">
                  <h3 className="text-sm font-bold text-slate-200 mb-4">Completed vs Pending Tasks</h3>
                  <div className="flex justify-around items-center h-48">
                    <div className="text-center bg-slate-950/20 p-4 border border-slate-800/50 rounded-xl min-w-32">
                      <p className="text-4xl font-black text-emerald-400">{completedTasks.length}</p>
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-1.5">Completed</p>
                    </div>
                    <div className="text-center bg-slate-950/20 p-4 border border-slate-800/50 rounded-xl min-w-32">
                      <p className="text-4xl font-black text-amber-400">{pendingTasks.length}</p>
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-1.5">Pending</p>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5 shadow-lg">
                  <h3 className="text-sm font-bold text-slate-200 mb-4">Hours Logged Timeline</h3>
                  <div className="h-48">
                    {timeLogs.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                        No timeline chart data logged this week.
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={getWeeklyChartData()} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                          <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                            labelStyle={{ color: '#94a3b8', fontSize: '11px', fontWeight: 'bold' }}
                            itemStyle={{ color: '#f8fafc', fontSize: '11px' }}
                          />
                          <Area type="monotone" dataKey="hours" name="Hours Logged" stroke="#8b5cf6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorHours)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* Task Work Detail Modal */}
      <AnimatePresence>
        {selectedTaskDetail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) setSelectedTaskDetail(null); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-slate-700/60 rounded-2xl w-full max-w-xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between p-5 border-b border-slate-850">
                <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded">{selectedTaskDetail.projectName}</span>
                <button onClick={() => setSelectedTaskDetail(null)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>

              <div className="flex-1 overflow-auto p-5 space-y-4">
                <h3 className="text-base font-bold text-white leading-snug">{selectedTaskDetail.title}</h3>
                {selectedTaskDetail.description && (
                  <p className="text-xs text-slate-400 bg-slate-850/50 p-3 rounded-xl border border-slate-800/40 leading-relaxed">{selectedTaskDetail.description}</p>
                )}

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 block mb-1">Status Workflow</span>
                    <select
                      value={selectedTaskDetail.status}
                      onChange={e => updateTaskStatus(selectedTaskDetail._id, e.target.value)}
                      className="w-full bg-slate-800 border border-slate-750 rounded-lg px-2 py-1.5 text-slate-200 outline-none"
                    >
                      <option value="To Do">Todo</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Code Review">Review / Deliverables</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-1">Due Date</span>
                    <span className="text-slate-350 block font-medium mt-1">{selectedTaskDetail.dueDate || 'No deadline'}</span>
                  </div>
                </div>

                {/* Subtask / checklist items */}
                {selectedTaskDetail.checklist?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-400 mb-2">Checklist Details</h4>
                    <div className="space-y-2">
                      {selectedTaskDetail.checklist.map((item: any) => (
                        <label key={item._id} className="flex items-center gap-2 text-xs text-slate-300">
                          <input type="checkbox" checked={item.completed} className="accent-violet-500" readOnly />
                          <span>{item.item}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Comments feed inside task */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-slate-400">Comments & Deliverables</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {(selectedTaskDetail.comments || []).map((comm: any, idx: number) => (
                      <div key={idx} className="flex gap-2">
                        <div className="w-5 h-5 rounded-full bg-violet-600 text-[10px] text-white flex items-center justify-center font-bold">{comm.authorName?.charAt(0)}</div>
                        <div className="bg-slate-800/60 rounded-xl p-2 flex-1">
                          <div className="flex justify-between text-[9px] text-slate-500">
                            <strong>{comm.authorName}</strong>
                            <span>{new Date(comm.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-xs text-slate-300 mt-0.5">{comm.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <input
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      placeholder="Comment content or deliverable URL..."
                      className="flex-1 bg-slate-800 border border-slate-750 rounded-xl px-3 py-1.5 text-xs text-slate-200 outline-none"
                    />
                    <button onClick={() => handleAddComment(selectedTaskDetail._id)} className="p-1.5 bg-violet-600 hover:bg-violet-500 rounded-xl text-white">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
