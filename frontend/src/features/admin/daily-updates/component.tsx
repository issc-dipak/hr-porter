"use client";

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Users, Clock, AlertCircle, Send, Download, 
  MessageSquare, ChevronRight, X, Calendar, Search, Filter, CheckCircle, RefreshCw, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { PastelStatCard } from '@/components/ui/PastelStatCard';
import { 
  ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend 
} from 'recharts';

interface MissingEmployee {
  name: string;
  email: string;
  department: string;
  designation: string;
  profilePicture?: string;
}

interface DeptProductivity {
  department: string;
  updated: number;
  total: number;
  percentage: number;
}

interface WeeklyActivity {
  day: string;
  date: string;
  count: number;
}

interface DailyUpdate {
  _id: string;
  date: string;
  employeeName: string;
  employeeEmail: string;
  department: string;
  yesterdaysWork: string;
  todaysPlan: string;
  blockers?: string;
  status: 'Draft' | 'Submitted' | 'Pending Review' | 'Reviewed';
  reviewedBy?: string;
  reviewedAt?: string;
  comments: any[];
  createdAt: string;
}

interface AdminAnalyticsProps {
  addNotification?: (msg: string) => void;
}

export default function DailyUpdatesAnalytics({ addNotification = () => {} }: AdminAnalyticsProps) {
  const [activeTab, setActiveTab] = useState<'analytics' | 'missing' | 'feed'>('analytics');
  
  // Dashboard Analytics States
  const [updatedToday, setUpdatedToday] = useState(0);
  const [missingToday, setMissingToday] = useState(0);
  const [totalPending, setTotalPending] = useState(0);
  const [totalReviewed, setTotalReviewed] = useState(0);
  const [totalEmployees, setTotalEmployees] = useState(0);
  
  const [missingList, setMissingList] = useState<MissingEmployee[]>([]);
  const [deptProductivity, setDeptProductivity] = useState<DeptProductivity[]>([]);
  const [weeklyActivity, setWeeklyActivity] = useState<WeeklyActivity[]>([]);
  const [allUpdates, setAllUpdates] = useState<DailyUpdate[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<DailyUpdate | null>(null);

  // Feed filters
  const [deptFilter, setDeptFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');


  const [newComment, setNewComment] = useState('');
  const [commenting, setCommenting] = useState(false);
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);

  // Load analytics & feed from database
  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // 1. Fetch Admin Analytics
      const res = await fetch('/api/daily-updates/analytics', { headers });
      if (res.ok) {
        const data = await res.json();
        setUpdatedToday(data.updatedToday);
        setMissingToday(data.missingToday);
        setTotalPending(data.totalPending);
        setTotalReviewed(data.totalReviewed);
        setTotalEmployees(data.totalEmployees);
        setMissingList(data.missingEmployees);
        setDeptProductivity(data.departmentProductivity);
        setWeeklyActivity(data.weeklyActivityTrend);
      }

      // 2. Fetch Company Feed (Admin sees HR + Employee)
      const feedRes = await fetch('/api/daily-updates/company', { headers });
      if (feedRes.ok) {
        const feedData = await feedRes.json();
        setAllUpdates(feedData.filter((u: DailyUpdate) => u.status !== 'Draft'));
      }
    } catch (err) {
      console.error('Failed to load admin analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Send Email Reminder for Missing Updates
  const handleSendReminder = async (empEmail: string, empName: string) => {
    setSendingReminder(empEmail);
    try {
      // Trigger notification email directly via helper
      const res = await fetch('/api/notifications/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: empEmail,
          message: `Dear ${empName}, you have not submitted your Daily Status Report (DSR) today. Please log in and post your update to avoid missing daily status logs.`,
          type: 'task' // categorized under task reminders
        })
      });
      if (res.ok) {
        addNotification(`Daily report reminder email dispatched to ${empName}!`);
      } else {
        addNotification('Could not dispatch reminder email.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSendingReminder(null);
    }
  };

  // Add Comment on selected report
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport || !newComment.trim()) return;

    setCommenting(true);
    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/daily-updates/${selectedReport._id}/comments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ content: newComment.trim() })
      });

      if (res.ok) {
        const resData = await res.json();
        setSelectedReport(resData.report);
        setNewComment('');
        addNotification('Comment posted successfully!');
        
        // Refresh local feed lists
        setAllUpdates(prev => prev.map(item => item._id === selectedReport._id ? resData.report : item));
      } else {
        addNotification('Failed to add comment.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCommenting(false);
    }
  };


  const filteredUpdates = allUpdates.filter(u => {
    const matchesDept = deptFilter ? u.department === deptFilter : true;
    const matchesQuery = searchQuery ? (
      u.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.yesterdaysWork.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.todaysPlan.toLowerCase().includes(searchQuery.toLowerCase())
    ) : true;
    return matchesDept && matchesQuery;
  });

  return (
    <div className="space-y-6 font-sans p-5 lg:p-6 max-w-6xl mx-auto">
      {/* Title Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 w-full flex-wrap">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
            Workforce Productivity Hub
          </h2>
          <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider max-w-xl break-words whitespace-normal">
            Review company activity, track engagement metrics, and compile AI status reports from employee logs.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="premium-nav-container print:hidden">
          {[
            { id: 'analytics', label: 'Analytics & Trends', icon: BarChart3 },
            { id: 'missing', label: 'Missing Logs', icon: AlertCircle },
            { id: 'feed', label: 'Company Feed', icon: MessageSquare }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "premium-nav-item active:scale-[0.98]",
                activeTab === tab.id ? "premium-nav-item-active" : ""
              )}
            >
              <tab.icon className="w-3 h-3 shrink-0" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
        {[
          { label: 'Updated Today', value: `${updatedToday} / ${totalEmployees}`, icon: CheckCircle, accent: '#3B82F6', sub: 'Submitted updates today' },
          { label: 'Missing Updates', value: missingToday, icon: Users, accent: '#F43F5E', sub: 'Awaiting reports' },
          { label: 'Compliance Rate', value: `${totalEmployees > 0 ? Math.round((updatedToday / totalEmployees) * 100) : 100}%`, icon: Clock, accent: '#10B981', sub: 'Submission percentage' },
          { label: 'Pending Review', value: totalPending, icon: AlertCircle, accent: '#F59E0B', sub: 'Pending admin approval' }
        ].map((stat, idx) => (
          <PastelStatCard key={idx} icon={stat.icon} label={stat.label} value={stat.value} sub={stat.sub || stat.desc} accent={stat.accent} />
        ))}
      </div>

      {/* Main Tab Workspace Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-[10px] font-black text-slate-450 uppercase tracking-widest">Loading Analytics Dashboard...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            
            {/* TAB 1: Analytics & Charts */}
            {activeTab === 'analytics' && (
              <motion.div
                key="analytics-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Department Productivity chart */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        Department DSR Completion Rates
                      </h3>
                      <p className="text-[9px] text-slate-450 mt-0.5">Percentage of employees in each department who logged updates today.</p>
                    </div>

                    <div className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={deptProductivity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.1} />
                          <XAxis dataKey="department" stroke="#64748B" fontSize={9} tickLine={false} />
                          <YAxis stroke="#64748B" fontSize={9} tickLine={false} />
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                          <Bar name="Compliance (%)" dataKey="percentage" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={40} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Submission Trends Chart */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        Weekly Submission Volume Trend
                      </h3>
                      <p className="text-[9px] text-slate-450 mt-0.5">Number of daily reports completed across the last 7 calendar days.</p>
                    </div>

                    <div className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={weeklyActivity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.1} />
                          <XAxis dataKey="day" stroke="#64748B" fontSize={9} tickLine={false} />
                          <YAxis stroke="#64748B" fontSize={9} tickLine={false} />
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                          <Line name="Reports Completed" type="monotone" dataKey="count" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 2: Missing updates list */}
            {activeTab === 'missing' && (
              <motion.div
                key="missing-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div>
                  <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Missing Reports Directory
                  </h3>
                  <p className="text-[9px] text-slate-450 mt-0.5">List of active employees who have not registered a status report today.</p>
                </div>

                {missingList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <CheckCircle className="w-10 h-10 text-emerald-505 mb-2.5" />
                    <p className="text-sm font-black text-slate-800 dark:text-white uppercase">100% Submission Compliance</p>
                    <p className="text-[10px] text-slate-450 mt-1 uppercase">All active employees have submitted their status reports today!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {missingList.map((emp) => (
                      <div 
                        key={emp.email}
                        className="p-4 bg-slate-50/50 dark:bg-slate-850/15 border border-slate-100/50 dark:border-slate-800/40 rounded-2xl flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                            {emp.name.slice(0,2)}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-black text-slate-850 dark:text-white truncate">{emp.name}</h4>
                            <p className="text-[9px] text-slate-450 dark:text-slate-500 font-bold truncate uppercase mt-0.5">{emp.designation} • {emp.department}</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={sendingReminder === emp.email}
                          onClick={() => handleSendReminder(emp.email, emp.name)}
                          className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer shrink-0 disabled:opacity-50"
                        >
                          {sendingReminder === emp.email ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <Send className="w-3 h-3" />
                          )}
                          Remind
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB 3: Company Feed */}
            {activeTab === 'feed' && (
              <motion.div
                key="feed-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-5"
              >
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-100 dark:border-slate-800/60 pb-4 mb-2">
                  <div>
                    <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      Company Update Feed
                    </h3>
                    <p className="text-[9px] text-slate-450 mt-0.5">Timeline feed showing DSR status logs submitted by both Employees and HR users.</p>
                  </div>

                  <div className="flex gap-3 shrink-0">
                    <select
                      value={deptFilter}
                      onChange={(e) => setDeptFilter(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl px-3 py-1.5 text-[10px] font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-650 cursor-pointer"
                    >
                      <option value="">All Departments</option>
                      <option value="Engineering">Engineering</option>
                      <option value="Sales">Sales</option>
                      <option value="HR">HR</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Finance">Finance</option>
                    </select>

                    <input 
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search updates..."
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl px-3 py-1.5 text-[10px] text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-blue-650"
                    />
                  </div>
                </div>

                {filteredUpdates.length === 0 ? (
                  <div className="text-center py-12 text-slate-450">
                    <FileText className="w-9 h-9 mx-auto mb-2.5 text-slate-350 dark:text-slate-700" />
                    <p className="text-xs font-black uppercase">No Status Logs Found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredUpdates.map(item => (
                      <div 
                        key={item._id}
                        onClick={() => setSelectedReport(item)}
                        className="p-4 bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-850/15 dark:hover:bg-slate-850/30 border border-slate-100/50 dark:border-slate-800/40 hover:border-slate-200 dark:hover:border-slate-750 rounded-2xl cursor-pointer transition-all duration-150 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                      >
                        <div className="space-y-2 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-black text-slate-900 dark:text-white uppercase">{item.employeeName}</span>
                            <span className="text-[9px] font-bold text-slate-455 uppercase tracking-widest">• {item.department}</span>
                            <span className="text-[9px] font-bold text-slate-455 uppercase tracking-widest">• {new Date(item.date).toLocaleDateString()}</span>
                          </div>
                          
                          <div className="text-[11.5px] text-slate-550 dark:text-slate-400 line-clamp-2 leading-relaxed">
                            <strong className="text-slate-750 dark:text-slate-300">Yesterday:</strong> {item.yesterdaysWork}
                          </div>
                          <div className="text-[11.5px] text-slate-550 dark:text-slate-400 line-clamp-2 leading-relaxed">
                            <strong className="text-slate-750 dark:text-slate-300">Today:</strong> {item.todaysPlan}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-805 justify-between md:justify-start">
                          <span className={cn(
                            "text-[8px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded border",
                            item.status === 'Reviewed' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                            "bg-blue-500/10 text-blue-500 border-blue-500/20"
                          )}>
                            {item.status === 'Pending Review' ? 'Pending' : item.status}
                          </span>
                          <span className="text-slate-400 uppercase text-[9px] font-black tracking-widest flex items-center gap-1">
                            Details <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        )}
      </div>

      {/* Details drawer Overlay */}
      <AnimatePresence>
        {selectedReport && (
          <div className="fixed inset-0 z-[250] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-neutral-50 dark:bg-slate-900 w-full max-w-lg rounded-3xl p-6 shadow-2xl relative border border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setSelectedReport(null)}
                className="absolute top-4 right-4 p-2 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 dark:text-slate-500 transition-all cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>

              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-805 pb-4 mb-4">
                <Calendar className="w-5 h-5 text-blue-650" />
                <div>
                  <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white">{selectedReport.employeeName}</h4>
                  <p className="text-[9.5px] font-bold text-slate-450 uppercase mt-0.5">
                    {selectedReport.department} • {new Date(selectedReport.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                {/* Yesterday */}
                <div>
                  <span className="text-[8.5px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-widest block mb-1">Yesterday's Accomplishments</span>
                  <div className="p-3 bg-slate-50/50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-2xl text-slate-850 dark:text-slate-350 leading-relaxed whitespace-pre-wrap">
                    {selectedReport.yesterdaysWork}
                  </div>
                </div>

                {/* Today */}
                <div>
                  <span className="text-[8.5px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-widest block mb-1">Today's Target Plan</span>
                  <div className="p-3 bg-slate-50/50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-2xl text-slate-850 dark:text-slate-350 leading-relaxed whitespace-pre-wrap">
                    {selectedReport.todaysPlan}
                  </div>
                </div>

                {/* Blockers */}
                {selectedReport.blockers && (
                  <div>
                    <span className="text-[8.5px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-widest block mb-1">Active Blockers</span>
                    <div className="p-3 bg-rose-500/5 dark:bg-rose-950/10 border border-rose-100/50 dark:border-rose-900/10 rounded-2xl text-rose-700 dark:text-rose-350 leading-relaxed whitespace-pre-wrap">
                      {selectedReport.blockers}
                    </div>
                  </div>
                )}

                {/* Comments feed */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80">
                  <span className="text-[9px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-widest block mb-3">Review Comments ({selectedReport.comments.length})</span>
                  
                  {selectedReport.comments.length > 0 && (
                    <div className="space-y-3 max-h-[150px] overflow-y-auto pr-1 no-scrollbar mb-4">
                      {selectedReport.comments.map((comment, idx) => (
                        <div 
                          key={idx}
                          className={cn(
                            "p-3 rounded-2xl border text-[11px] leading-relaxed",
                            comment.authorRole === 'HR' || comment.authorRole === 'Admin'
                              ? "bg-blue-500/5 border-blue-500/10 text-slate-800 dark:text-slate-200 ml-8 text-right"
                              : "bg-slate-50/50 dark:bg-slate-950 border-slate-100 dark:border-slate-850 text-slate-700 dark:text-slate-350 mr-8 text-left"
                          )}
                        >
                          <div className="flex justify-between items-center mb-1 text-[8.5px] text-slate-455 font-bold">
                            <span>{comment.authorName} ({comment.authorRole})</span>
                            <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="whitespace-pre-wrap">{comment.content}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add feedback comment form */}
                  <form onSubmit={handleAddComment} className="flex gap-2 pt-2 border-t border-slate-105 dark:border-slate-800/40">
                    <input 
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add comment or feedback..."
                      className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-650"
                    />
                    <button 
                      type="submit"
                      disabled={commenting || !newComment.trim()}
                      className="px-3 bg-blue-650 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center transition-all disabled:opacity-50 shrink-0 cursor-pointer"
                    >
                      {commenting ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <MessageSquare className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
