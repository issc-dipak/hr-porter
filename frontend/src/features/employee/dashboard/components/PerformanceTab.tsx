"use client";

import React, { useState } from 'react';
import { 
  Award, Sparkles, Target, Brain, Calendar, Zap, 
  BookOpen, Clock, Shield, LayoutGrid, BarChart3, 
  X, Plus, CheckCircle2, CheckCircle, FileText, Users, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";
import { PastelStatCard } from '@/components/ui/PastelStatCard';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend, RadarChart, PolarGrid, PolarAngleAxis, 
  PolarRadiusAxis, Radar, BarChart, Bar
} from 'recharts';

interface PerformanceTabProps {
  profileData?: {
    name: string;
    email: string;
    designation: string;
    department: string;
  };
  addNotification?: (msg: string) => void;
}

export function PerformanceTab({ profileData, addNotification = () => {} }: PerformanceTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'kpis' | 'skills' | 'achievements'>('overview');
  const [loading, setLoading] = useState(true);

  // Dynamic metrics state
  const [attendanceScore, setAttendanceScore] = useState(0);
  const [leaveBalance, setLeaveBalance] = useState(24); // out of 24
  const [workingHoursAvg, setWorkingHoursAvg] = useState(0); // hrs/day
  const [goalAchievementRate, setGoalAchievementRate] = useState(0); // 0% goals completed

  // Monthly Attendance Trend (initialized dynamically to last 6 months)
  const [monthlyAttendanceData, setMonthlyAttendanceData] = useState(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      return { month: monthNames[d.getMonth()], attendance: 0 };
    });
  });

  // Working Hours Summary (Weekly Trend)
  const [workingHoursData, setWorkingHoursData] = useState([
    { day: 'Mon', activeHours: 0, targetHours: 8.0, overtime: 0 },
    { day: 'Tue', activeHours: 0, targetHours: 8.0, overtime: 0 },
    { day: 'Wed', activeHours: 0, targetHours: 8.0, overtime: 0 },
    { day: 'Thu', activeHours: 0, targetHours: 8.0, overtime: 0 },
    { day: 'Fri', activeHours: 0, targetHours: 8.0, overtime: 0 }
  ]);

  // Performance Review History
  const [reviewHistory, setReviewHistory] = useState<any[]>([]);

  // Interactive Goals State
  const [goals, setGoals] = useState<any[]>([]);

  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalCategory, setNewGoalCategory] = useState('Skill Development');
  const [showGoalModal, setShowGoalModal] = useState(false);

  // Training & Coaching Shelf
  const [completedTrainings, setCompletedTrainings] = useState<any[]>([]);

  const [inProgressTrainings, setInProgressTrainings] = useState<any[]>([]);

  // 360 Feedback Competencies Matrix (Radar Chart)
  const [skillsGrowthData, setSkillsGrowthData] = useState([
    { subject: 'Technical Depth', current: 95, previous: 85 },
    { subject: 'Delivery Speed', current: 88, previous: 82 },
    { subject: 'Collaboration', current: 92, previous: 90 },
    { subject: 'Problem Solving', current: 96, previous: 88 },
    { subject: 'Ownership', current: 90, previous: 85 },
    { subject: 'Adaptability', current: 85, previous: 80 }
  ]);

  // Awards & Recognition Cabinet
  const [awards, setAwards] = useState<any[]>([]);

  // Manager Feedback Timeline
  const [feedbackTimeline, setFeedbackTimeline] = useState<any[]>([]);

  // Leave history logs
  const [leaveHistory, setLeaveHistory] = useState<any[]>([]);

  // Load real backend data
  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('hr_system_token');
        const headers: HeadersInit = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const employeeName = profileData?.name || '';
        if (!employeeName) return;

        // 1. Fetch Attendance logs
        const attendanceRes = await fetch('/api/attendance', { headers });
        if (attendanceRes.ok) {
          const logs = await attendanceRes.json();
          if (Array.isArray(logs) && logs.length > 0) {
            const totalDays = logs.length;
            const presentDays = logs.filter(a => ['Present', 'On Time', 'Late'].includes(a.status)).length;
            setAttendanceScore(Number(((presentDays / totalDays) * 100).toFixed(1)));

            // Calculate average hours
            let totalHrs = 0;
            let countHrs = 0;
            const weeklyDays: Record<string, { active: number; count: number }> = {
              'Mon': { active: 0, count: 0 },
              'Tue': { active: 0, count: 0 },
              'Wed': { active: 0, count: 0 },
              'Thu': { active: 0, count: 0 },
              'Fri': { active: 0, count: 0 }
            };

            const monthMap: Record<string, { present: number; total: number }> = {};
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

            logs.forEach(log => {
              if (log.duration) {
                const match = log.duration.match(/(\d+)h\s*(\d+)m/);
                if (match) {
                  const hours = parseInt(match[1], 10);
                  const minutes = parseInt(match[2], 10);
                  const active = hours + minutes / 60;
                  totalHrs += active;
                  countHrs++;

                  if (log.date) {
                    const d = new Date(log.date);
                    const dayIndex = d.getDay();
                    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                    const name = dayNames[dayIndex];
                    if (weeklyDays[name]) {
                      weeklyDays[name].active += active;
                      weeklyDays[name].count++;
                    }
                  }
                }
              }

              if (log.date) {
                const d = new Date(log.date);
                const mName = monthNames[d.getMonth()];
                if (!monthMap[mName]) monthMap[mName] = { present: 0, total: 0 };
                monthMap[mName].total++;
                if (['Present', 'On Time', 'Late'].includes(log.status)) {
                  monthMap[mName].present++;
                }
              }
            });

            if (countHrs > 0) {
              setWorkingHoursAvg(Number((totalHrs / countHrs).toFixed(1)));
            }

            const updatedWorkingHours = Object.entries(weeklyDays).map(([day, val]) => {
              const avg = val.count > 0 ? Number((val.active / val.count).toFixed(1)) : 0;
              return {
                day,
                activeHours: avg,
                targetHours: 8.0,
                overtime: Math.max(0, Number((avg - 8.0).toFixed(1)))
              };
            });
            setWorkingHoursData(updatedWorkingHours);

            const last6Months = Array.from({ length: 6 }, (_, i) => {
              const d = new Date();
              d.setMonth(d.getMonth() - (5 - i));
              return monthNames[d.getMonth()];
            });
            const updatedMonthlyAttendance = last6Months.map(month => {
              const m = monthMap[month];
              return {
                month,
                attendance: m && m.total > 0 ? Number(((m.present / m.total) * 100).toFixed(1)) : 0
              };
            });
            setMonthlyAttendanceData(updatedMonthlyAttendance);
          } else {
            setAttendanceScore(0);
            setWorkingHoursAvg(0);
            setWorkingHoursData([
              { day: 'Mon', activeHours: 0, targetHours: 8.0, overtime: 0 },
              { day: 'Tue', activeHours: 0, targetHours: 8.0, overtime: 0 },
              { day: 'Wed', activeHours: 0, targetHours: 8.0, overtime: 0 },
              { day: 'Thu', activeHours: 0, targetHours: 8.0, overtime: 0 },
              { day: 'Fri', activeHours: 0, targetHours: 8.0, overtime: 0 }
            ]);
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const last6Months = Array.from({ length: 6 }, (_, i) => {
              const d = new Date();
              d.setMonth(d.getMonth() - (5 - i));
              return monthNames[d.getMonth()];
            });
            setMonthlyAttendanceData(last6Months.map(month => ({ month, attendance: 0 })));
          }
        }

        // 2. Fetch Tasks / Goals (assigned by HR + self-added)
        const tasksRes = await fetch('/api/tasks', { headers });
        if (tasksRes.ok) {
          const allTasks = await tasksRes.json();
          if (Array.isArray(allTasks)) {
            const empEmail = profileData?.email || '';
            // Match by name (case-insensitive) OR by assigned email
            const myTasks = allTasks.filter(t => {
              if (!t.assignedTo) return false;
              const nameMatch = t.assignedTo.toLowerCase() === employeeName.toLowerCase();
              const emailMatch = empEmail && t.assignedToEmail && t.assignedToEmail.toLowerCase() === empEmail.toLowerCase();
              return nameMatch || emailMatch;
            });

            const doneCount = myTasks.filter(t => t.status === 'Done').length;
            const totalCount = myTasks.length;
            setGoalAchievementRate(totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0);

            const mappedGoals = myTasks.map(t => ({
              id: t._id,
              title: t.title,
              category: t.dept || 'General',
              progress: t.completionPercent || (t.status === 'Done' ? 100 : 0),
              deadline: t.due ? new Date(t.due).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : 'No Deadline',
              status: t.status === 'Done' ? 'Completed' : t.status === 'To Do' ? 'Pending' : 'In Progress'
            }));
            setGoals(mappedGoals);
          }
        }

        // 3. Fetch Leaves
        const leavesRes = await fetch('/api/leaves', { headers });
        if (leavesRes.ok) {
          const allLeaves = await leavesRes.json();
          if (Array.isArray(allLeaves)) {
            const mappedLeaves = allLeaves.map(l => ({
              type: l.type,
              duration: l.duration || '1 Day',
              dates: l.date,
              status: l.status
            }));
            setLeaveHistory(mappedLeaves);

            let approvedDays = 0;
            allLeaves.forEach(l => {
              if (l.status === 'Approved') {
                const daysMatch = (l.duration || '').match(/(\d+)/);
                approvedDays += daysMatch ? parseInt(daysMatch[1], 10) : 1;
              }
            });
            setLeaveBalance(Math.max(0, 24 - approvedDays));
          }
        }

        // 4. Fetch Reviews & Appraisals
        const reviewsRes = await fetch('/api/performance', { headers });
        if (reviewsRes.ok) {
          const allReviews = await reviewsRes.json();
          if (Array.isArray(allReviews)) {
            const myReviews = allReviews.filter(r => r.name && r.name.toLowerCase() === employeeName.toLowerCase());
            if (myReviews.length > 0) {
              const formattedHistory = myReviews.map((rev, index) => ({
                cycle: rev.lastReview ? `Appraisal - ${rev.lastReview}` : `Cycle review #${myReviews.length - index}`,
                score: rev.rating || 4.5,
                rating: rev.status || 'Meets Expectations',
                reviewer: 'Direct Supervisor'
              }));
              setReviewHistory(formattedHistory);

              const timeline = myReviews.map((rev, idx) => ({
                id: rev._id || idx,
                manager: 'Direct Supervisor',
                date: rev.lastReview || new Date(rev.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                feedback: rev.goals ? `Target details: ${rev.goals}` : `Logged under department ${rev.dept}`,
                rating: rev.rating || 4.5
              }));
              setFeedbackTimeline(timeline);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load performance analytics from API:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profileData]);

  // Handle adding self-improvement goals
  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;

    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const payload = {
        title: newGoalTitle,
        assignedTo: profileData?.name || 'Self',
        dept: profileData?.department || 'General',
        due: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString()
      };

      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const result = await res.json();
        const createdTask = result.task;

        const newGoalObj = {
          id: createdTask._id || `goal-${Date.now()}`,
          title: createdTask.title,
          category: createdTask.dept || newGoalCategory,
          progress: 0,
          deadline: new Date(createdTask.due).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }),
          status: 'Pending'
        };

        setGoals([newGoalObj, ...goals]);
        addNotification('Self-improvement goal logged to database successfully!');
      } else {
        const error = await res.json();
        addNotification(`Error: ${error.error || 'Failed to submit'}`);
      }
    } catch (err) {
      console.error(err);
      addNotification('Server error while saving goal');
    }

    setNewGoalTitle('');
    setShowGoalModal(false);
  };

  // Handle goal progress slider change
  const handleUpdateProgress = async (id: string, val: number) => {
    setGoals(prev => prev.map(g => {
      if (g.id === id) {
        const nextStatus = val === 100 ? 'Completed' : val > 0 ? 'In Progress' : 'Pending';
        return { ...g, progress: val, status: nextStatus };
      }
      return g;
    }));

    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const nextStatus = val === 100 ? 'Done' : val > 0 ? 'In Progress' : 'To Do';
      await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          completionPercent: val,
          status: nextStatus
        })
      });
    } catch (err) {
      console.error('Failed to update progress on backend:', err);
    }
  };

  // Export report as CSV file
  const handleExportCSV = () => {
    const headers = 'Goal Title,Category,Progress,Deadline,Status\n';
    const rows = goals.map(g => `"${g.title}","${g.category}",${g.progress}%,"${g.deadline}","${g.status}"`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${profileData?.name || 'Employee'}_Performance_Insights.csv`;
    a.click();
    addNotification('Performance summary report exported successfully!');
  };

  const completedGoals = goals.filter(g => g.status === 'Completed').length;
  const pendingGoals = goals.length - completedGoals;

  return (
    <div className="space-y-8 font-sans printable-performance">
      
      {/* Printable Sheet Style */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-performance, .printable-performance * {
            visibility: visible;
          }
          .printable-performance {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            background: white !important;
            color: black !important;
          }
          .print-invisible {
            display: none !important;
          }
        }
      `}} />

      {/* Title & Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white font-sans uppercase">
            Performance Center
          </h2>
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5 uppercase tracking-wider">
            Review corporate KPIs, track goals alignment, competence vectors, and training roadmaps.
          </p>
        </div>

        <div className="flex items-center gap-2 print-invisible">
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
          >
            <Award className="w-3.5 h-3.5 text-indigo-400 animate-pulse" /> Print Summary
          </button>
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md shadow-blue-500/10 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Export Data
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
        {[
          { label: 'Attendance Score', value: `${attendanceScore}%`, icon: CheckCircle, accent: '#3B82F6', sub: '✓ Target SLA Compliant' },
          { label: 'Goals Completed', value: `${goalAchievementRate}%`, icon: Target, accent: '#8B5CF6', sub: `${completedGoals} Completed · ${pendingGoals} Pending` },
          { label: 'Leave Balance', value: `${leaveBalance} Days`, icon: Calendar, accent: '#10B981', sub: 'Out of 24 allocated/year' },
          { label: 'Avg Active Hours', value: `${workingHoursAvg} hrs`, icon: Clock, accent: '#F59E0B', sub: 'Daily Target: 8.0 hrs' }
        ].map((stat, idx) => (
          <PastelStatCard key={idx} icon={stat.icon} label={stat.label} value={stat.value} sub={stat.sub} accent={stat.accent} />
        ))}
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-200/40 dark:border-slate-800 w-fit max-w-full overflow-x-auto scrollbar-none shadow-inner print-invisible">
        {[
          { id: 'overview', label: 'Attendance & Analytics', icon: LayoutGrid },
          { id: 'kpis', label: 'KPIs & Smart Goals', icon: Target },
          { id: 'skills', label: 'Skills Radar & Appraisal Reviews', icon: Brain },
          { id: 'achievements', label: 'Awards & Development Hub', icon: Award }
        ].map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveSubTab(t.id as any)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[8.5px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer border-none whitespace-nowrap shrink-0",
              activeSubTab === t.id 
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm" 
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            )}
          >
            <t.icon className={cn("w-3.5 h-3.5 shrink-0", activeSubTab === t.id ? "text-slate-900 dark:text-slate-100" : "text-slate-400")} />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Sub-tab Workspaces */}
      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">
          
          {/* Subtab 1: Attendance & Analytics */}
          {activeSubTab === 'overview' && (
            <motion.div
              key="overview-sub"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Attendance Trend Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl space-y-4 shadow-sm">
                  <div>
                    <h3 className="text-[10.5px] font-black text-slate-900 dark:text-white uppercase tracking-widest">
                      Monthly Attendance Progression
                    </h3>
                    <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">SLA Attendance trends over the last 6 months.</p>
                  </div>

                  <div className="h-[220px] w-full">
                    <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 1, height: 1 }}>
                      <AreaChart data={monthlyAttendanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.07} />
                        <XAxis dataKey="month" stroke="#64748B" fontSize={9} tickLine={false} />
                        <YAxis stroke="#64748B" fontSize={9} domain={[90, 100]} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '10px' }} />
                        <Area name="Attendance Rate (%)" type="monotone" dataKey="attendance" stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#colorAttendance)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Working Hours Weekly Distribution Chart */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl space-y-4 shadow-sm">
                  <div>
                    <h3 className="text-[10.5px] font-black text-slate-900 dark:text-white uppercase tracking-widest">
                      Active Hours vs Target
                    </h3>
                    <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">Weekly hours layout with overtime diagnostics.</p>
                  </div>

                  <div className="h-[220px] w-full">
                    <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 1, height: 1 }}>
                      <BarChart data={workingHoursData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.07} />
                        <XAxis dataKey="day" stroke="#64748B" fontSize={9} tickLine={false} />
                        <YAxis stroke="#64748B" fontSize={9} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '10px' }} />
                        <Legend wrapperStyle={{ fontSize: '9px', textTransform: 'uppercase', fontWeight: 'bold' }} />
                        <Bar name="Active Hours" dataKey="activeHours" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                        <Bar name="Overtime" dataKey="overtime" fill="#10B981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>

              {/* Leave History Analytics */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl space-y-4 shadow-sm">
                <div>
                  <h3 className="text-[10.5px] font-black text-slate-900 dark:text-white uppercase tracking-widest">
                    Leave History Analytics
                  </h3>
                  <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">Summary of approved leave logs during the current calendar year.</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-[9px] font-black uppercase text-slate-450 tracking-wider">
                        <th className="pb-2.5">Leave Type</th>
                        <th className="pb-2.5">Duration</th>
                        <th className="pb-2.5">Dates Range</th>
                        <th className="pb-2.5">Approval Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs font-medium">
                      {leaveHistory.map((leave, index) => (
                        <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                          <td className="py-3 font-extrabold text-slate-900 dark:text-white">{leave.type}</td>
                          <td className="py-3 text-slate-600 dark:text-slate-300 font-mono">{leave.duration}</td>
                          <td className="py-3 text-slate-450">{leave.dates}</td>
                          <td className="py-3">
                            <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full text-[8.5px] font-black uppercase tracking-wider">
                              {leave.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* Subtab 2: KPIs & Smart Goals */}
          {activeSubTab === 'kpis' && (
            <motion.div
              key="kpis-sub"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Core KPIs target meters */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl space-y-5 shadow-sm">
                  <div>
                    <h3 className="text-[10.5px] font-black text-slate-900 dark:text-white uppercase tracking-widest">
                      Corporate Assigned KPIs
                    </h3>
                    <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">SLA performance benchmarks assigned by HR.</p>
                  </div>

                  <div className="space-y-4">
                    {[
                      { name: 'Core Task Delivery Rate', actual: 95, target: 90 },
                      { name: 'Code Stability (Bug Free Sprints)', actual: 88, target: 85 },
                      { name: 'Code Review Response Latency', actual: 92, target: 90 },
                      { name: 'Onboarding & Knowledge Transfer', actual: 80, target: 80 }
                    ].map((kpi, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                          <span>{kpi.name}</span>
                          <span className={cn(
                            "font-black",
                            kpi.actual >= kpi.target ? "text-emerald-600 dark:text-emerald-400" : "text-amber-500"
                          )}>{kpi.actual}% / {kpi.target}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative">
                          <div className="h-full bg-slate-200 dark:bg-slate-700 absolute left-0 top-0" style={{ width: `${kpi.target}%` }} />
                          <div className={cn("h-full absolute left-0 top-0", kpi.actual >= kpi.target ? "bg-emerald-500" : "bg-amber-500")} style={{ width: `${kpi.actual}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Goals Alignment cabinet */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl space-y-4 shadow-sm">
                  <div className="flex justify-between items-center print-invisible">
                    <div>
                      <h3 className="text-[10.5px] font-black text-slate-900 dark:text-white uppercase tracking-widest">
                        Smart Self-Development Goals
                      </h3>
                      <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">Goals mapped dynamically into active development cycles.</p>
                    </div>

                    <button
                      onClick={() => setShowGoalModal(true)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-blue-500/10"
                    >
                      <Plus className="w-3.5 h-3.5" /> New Goal
                    </button>
                  </div>

                  <div className="space-y-4.5">
                    {goals.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                          <Target className="w-6 h-6 text-slate-400" />
                        </div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No Goals Assigned</p>
                        <p className="text-[9px] text-slate-400 mt-1">HR will assign performance goals to you. You can also add self-improvement goals.</p>
                      </div>
                    ) : goals.map(g => (
                      <div 
                        key={g.id} 
                        className="p-4 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 rounded-2xl space-y-3"
                      >
                        <div className="flex justify-between items-start gap-3">
                          <div>
                            <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 bg-blue-500/10 text-blue-650 dark:text-blue-400 border border-blue-500/20 rounded">
                              {g.category}
                            </span>
                            <h4 className="text-xs font-black text-slate-900 dark:text-white mt-1.5">{g.title}</h4>
                          </div>

                          <div className="text-right shrink-0">
                            <span className={cn(
                              "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border",
                              g.status === 'Completed' ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                              g.status === 'In Progress' ? "bg-blue-500/10 text-blue-650 border-blue-500/20" : "bg-slate-500/10 text-slate-400 border-slate-700"
                            )}>
                              {g.status}
                            </span>
                            <span className="block text-[8px] font-mono text-slate-450 uppercase mt-1">Due: {g.deadline}</span>
                          </div>
                        </div>

                        {/* Progress slider */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[9px] font-bold text-slate-500">
                            <span>Fulfillment Level</span>
                            <span className="text-slate-900 dark:text-white font-extrabold">{g.progress}%</span>
                          </div>
                          
                          <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={g.progress}
                            onChange={(e) => handleUpdateProgress(g.id, Number(e.target.value))}
                            className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none print-invisible"
                          />
                          <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden hidden print:block">
                            <div className="h-full bg-blue-600" style={{ width: `${g.progress}%` }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* Subtab 3: Skills Radar & Appraisal Reviews */}
          {activeSubTab === 'skills' && (
            <motion.div
              key="skills-sub"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Radar Skill vectors */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl space-y-4 flex flex-col justify-between shadow-sm">
                  <div>
                    <h3 className="text-[10.5px] font-black text-slate-900 dark:text-white uppercase tracking-widest">
                      Competency Matrix Mapping
                    </h3>
                    <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">360° radar view of current skills growth compared to Q4 baseline.</p>
                  </div>

                  <div className="h-[240px] w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 1, height: 1 }}>
                      <RadarChart cx="50%" cy="50%" outerRadius="75%" data={skillsGrowthData}>
                        <PolarGrid stroke="#475569" strokeWidth={0.5} opacity={0.3} />
                        <PolarAngleAxis dataKey="subject" stroke="#64748B" fontSize={8} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#64748B" fontSize={8} />
                        <Radar name="Current Cycle" dataKey="current" stroke="#2563EB" fill="#2563EB" fillOpacity={0.2} />
                        <Radar name="Previous Cycle" dataKey="previous" stroke="#64748B" fill="#64748B" fillOpacity={0.05} />
                        <Legend wrapperStyle={{ fontSize: '8px', textTransform: 'uppercase', fontWeight: 'bold' }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Performance Review Scores and appraisal logs */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl space-y-4 shadow-sm">
                  <div>
                    <h3 className="text-[10.5px] font-black text-slate-900 dark:text-white uppercase tracking-widest">
                      Official Appraisal Review Scores
                    </h3>
                    <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">Archived formal review ratings logged in database by HR.</p>
                  </div>

                  <div className="space-y-4">
                    {reviewHistory.map((rev, index) => (
                      <div 
                        key={index}
                        className="p-4 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-3"
                      >
                        <div>
                          <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase">{rev.cycle}</h4>
                          <span className="text-[9px] text-slate-450 mt-1 block">Reviewed by: {rev.reviewer}</span>
                        </div>

                        <div className="text-left sm:text-right shrink-0">
                          <span className="px-2.5 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-650 dark:text-blue-400 rounded-full text-[9px] font-black uppercase tracking-wider">
                            {rev.rating}
                          </span>
                          <span className="block text-[11px] font-black text-slate-900 dark:text-white mt-1">Score: {rev.score} / 5.0</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Manager Feedback Timeline */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl space-y-5 shadow-sm">
                <div>
                  <h3 className="text-[10.5px] font-black text-slate-900 dark:text-white uppercase tracking-widest">
                    Manager Feedback Timeline
                  </h3>
                  <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">Consolidated timeline of direct supervisor comments and recommendations.</p>
                </div>

                <div className="relative border-l-2 border-slate-100 dark:border-slate-800/80 ml-3 pl-6 space-y-6 text-left">
                  {feedbackTimeline.map((feed) => (
                    <div key={feed.id} className="relative">
                      {/* Timeline dot */}
                      <div className="absolute -left-[31px] top-1.5 w-2.5 h-2.5 bg-blue-600 rounded-full border-4 border-white dark:border-slate-900 shadow-sm" />
                      
                      <div className="space-y-1">
                        <div className="flex justify-between items-center flex-wrap gap-2">
                          <span className="text-xs font-black text-slate-900 dark:text-white uppercase">{feed.manager}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[9.5px] font-black text-emerald-600 font-mono">Rating: {feed.rating}/5</span>
                            <span className="text-[8.5px] font-bold text-slate-405">{feed.date}</span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-355 leading-relaxed italic pt-1">
                          "{feed.feedback}"
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Subtab 4: Awards & Development Hub */}
          {activeSubTab === 'achievements' && (
            <motion.div
              key="achievements-sub"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Badges showcase shelf */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl space-y-4 shadow-sm">
                  <h3 className="text-[10.5px] font-black text-slate-900 dark:text-white uppercase tracking-widest">
                    Awards & Recognition Cabinet
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {awards.map((badge, idx) => (
                      <div 
                        key={idx} 
                        className="p-4 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 rounded-2xl hover:border-blue-500/20 hover:shadow-sm transition-all duration-300 flex gap-4"
                      >
                        <div className={cn("p-2.5 rounded-xl shrink-0 h-fit border", badge.color)}>
                          <badge.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase leading-none">{badge.title}</h4>
                          <span className="text-[8px] font-black text-blue-650 dark:text-blue-400 mt-2 block tracking-widest uppercase">{badge.type}</span>
                          <p className="text-[9.5px] text-slate-500 dark:text-slate-400 leading-relaxed mt-1.5">{badge.desc}</p>
                          <span className="text-[8px] font-bold text-slate-405 block mt-2">Unlocked {badge.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Training & Coaching Hub */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl space-y-4 shadow-sm flex flex-col justify-between">
                  <div className="space-y-4">
                    <h3 className="text-[10.5px] font-black text-slate-900 dark:text-white uppercase tracking-widest">
                      Training Completion Status
                    </h3>

                    {/* Active Trainings */}
                    <div className="space-y-3.5">
                      <span className="text-[8px] font-black text-slate-550 dark:text-slate-500 uppercase tracking-widest block">In Progress Courses</span>
                      {inProgressTrainings.map(t => (
                        <div key={t.id} className="space-y-1.5">
                          <div className="flex justify-between text-[10px] font-bold text-slate-600 dark:text-slate-400">
                            <span className="truncate max-w-[70%]">{t.name}</span>
                            <span className="font-mono">{t.progress}%</span>
                          </div>
                          <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-600 rounded-full" style={{ width: `${t.progress}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Completed Trainings list */}
                    <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                      <span className="text-[8px] font-black text-slate-550 dark:text-slate-500 uppercase tracking-widest block">Completed Courses</span>
                      <div className="space-y-2">
                        {completedTrainings.map(t => (
                          <div 
                            key={t.id} 
                            className="flex justify-between items-center p-2.5 bg-slate-500/5 dark:bg-slate-850/5 border border-slate-100 dark:border-slate-850/30 rounded-xl"
                          >
                            <div className="flex items-center gap-2">
                              <BookOpen className="w-4 h-4 text-emerald-500" />
                              <div className="text-left">
                                <h4 className="text-[10px] font-bold text-slate-900 dark:text-white leading-tight">{t.name}</h4>
                                <span className="text-[8px] text-slate-450 block mt-0.5">{t.duration} • Completed {t.date}</span>
                              </div>
                            </div>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* New Self-Improvement Goal Modal Overlay */}
      <AnimatePresence>
        {showGoalModal && (
          <div className="fixed inset-0 z-[200] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl relative border border-slate-100 dark:border-slate-800"
            >
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-4">Set Self-Improvement Goal</h3>

              <form onSubmit={handleAddGoal} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Goal Title</label>
                  <input 
                    type="text" 
                    value={newGoalTitle}
                    onChange={e => setNewGoalTitle(e.target.value)}
                    required
                    placeholder="e.g. Learn System Architecture Design"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Category</label>
                  <select 
                    value={newGoalCategory}
                    onChange={e => setNewGoalCategory(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                  >
                    <option value="Skill Development">Skill Development</option>
                    <option value="Technical Excellence">Technical Excellence</option>
                    <option value="Leadership & Initiative">Leadership & Initiative</option>
                    <option value="Quality Assurance">Quality Assurance</option>
                  </select>
                </div>

                <div className="flex gap-2.5 pt-3">
                  <button 
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer border border-transparent"
                  >
                    Confirm Goal
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowGoalModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 dark:text-white text-slate-650 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer border border-transparent"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
