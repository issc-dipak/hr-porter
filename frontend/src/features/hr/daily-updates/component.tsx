"use client";

import React, { useState, useEffect } from 'react';
import { 
  FileText, CheckCircle, AlertCircle, Users, Search, Filter, 
  Download, MessageSquare, Check, X, RefreshCw, Calendar, ChevronRight,
  Send, Edit3, CheckSquare, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { PastelStatCard } from '@/components/ui/PastelStatCard';

interface Comment {
  authorEmail: string;
  authorName: string;
  authorRole: string;
  content: string;
  createdAt: string;
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
  comments: Comment[];
  createdAt: string;
}

interface AnalyticsStats {
  updatedToday: number;
  missingToday: number;
  totalPending: number;
  totalReviewed: number;
}

interface HRDailyUpdatesProps {
  addNotification?: (msg: string) => void;
  profile?: any;
}

export default function DailyUpdatesManagement({ addNotification = () => {}, profile }: HRDailyUpdatesProps) {
  const [updates, setUpdates] = useState<DailyUpdate[]>([]);
  const [stats, setStats] = useState<AnalyticsStats>({
    updatedToday: 0,
    missingToday: 0,
    totalPending: 0,
    totalReviewed: 0
  });

  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<DailyUpdate | null>(null);

  // Filters State
  const [deptFilter, setDeptFilter] = useState('');
  const [emailFilter, setEmailFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Comment Form State
  const [newComment, setNewComment] = useState('');
  const [commenting, setCommenting] = useState(false);
  const [reviewing, setReviewing] = useState(false);



  // Load reports and stats from backend
  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // 1. Fetch Analytics Stats
      const statsRes = await fetch('/api/daily-updates/analytics', { headers });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats({
          updatedToday: statsData.updatedToday,
          missingToday: statsData.missingToday,
          totalPending: statsData.totalPending,
          totalReviewed: statsData.totalReviewed
        });
      }

      // 2. Fetch Status Reports
      const params = new URLSearchParams();
      if (deptFilter) params.append('department', deptFilter);
      if (emailFilter) params.append('employeeEmail', emailFilter);
      if (dateFilter) params.append('date', dateFilter);
      if (searchQuery) params.append('search', searchQuery);

      const updatesRes = await fetch(`/api/daily-updates?${params.toString()}`, { headers });
      if (updatesRes.ok) {
        const updatesData = await updatesRes.json();
        // Filter out drafts since HR only reviews submitted updates
        setUpdates(updatesData.filter((u: DailyUpdate) => u.status !== 'Draft'));
      }
    } catch (err) {
      console.error('Error fetching HR updates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [deptFilter, emailFilter, dateFilter, searchQuery]);

  // Mark Report as Reviewed
  const handleReview = async (reportId: string) => {
    setReviewing(true);
    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/daily-updates/${reportId}/review`, {
        method: 'POST',
        headers
      });

      if (res.ok) {
        const resData = await res.json();
        addNotification('Employee Daily Status Report reviewed and approved!');
        
        // Refresh detail view if open
        if (selectedReport && selectedReport._id === reportId) {
          setSelectedReport(resData.report);
        }

        // Refresh lists
        fetchData();
      } else {
        addNotification('Failed to submit review.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setReviewing(false);
    }
  };

  // Add Comment feedback
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
        addNotification('Review comment posted successfully!');
        
        // Refresh local list
        setUpdates(prev => prev.map(item => item._id === selectedReport._id ? resData.report : item));
      } else {
        addNotification('Failed to save comment.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCommenting(false);
    }
  };

  // Export filtered DSR list to CSV
  const handleExportCSV = () => {
    const csvHeaders = 'Employee,Email,Department,Date,Yesterday\'s Work,Today\'s Plan,Blockers,Status\n';
    const csvRows = updates.map(u => {
      const cleanYesterday = u.yesterdaysWork.replace(/"/g, '""').replace(/\n/g, ' ');
      const cleanToday = u.todaysPlan.replace(/"/g, '""').replace(/\n/g, ' ');
      const cleanBlocker = (u.blockers || '').replace(/"/g, '""').replace(/\n/g, ' ');
      return `"${u.employeeName}","${u.employeeEmail}","${u.department}","${new Date(u.date).toLocaleDateString()}",` + 
             `"${cleanYesterday}","${cleanToday}","${cleanBlocker}","${u.status}"`;
    }).join('\n');

    const blob = new Blob([csvHeaders + csvRows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HR_Daily_Status_Reports_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    addNotification('Daily updates logs exported successfully!');
  };

  return (
    <div className="space-y-6 font-sans p-5 lg:p-6 max-w-6xl mx-auto">
      {/* Page Title */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 w-full flex-wrap">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
            Employee Status Dashboard
          </h2>
          <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider max-w-xl break-words whitespace-normal">
            Monitor incoming daily reports, add review feedback, and track blockers across departments.
          </p>
        </div>

        <button 
          onClick={handleExportCSV}
          disabled={updates.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-650 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-50 shadow-md shadow-blue-500/10 cursor-pointer animate-in fade-in"
        >
          <Download className="w-3.5 h-3.5" /> Export Logs
        </button>
      </div>

      {/* Analytics KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left animate-in fade-in duration-300">
        {[
          { label: 'Updates Today', value: stats.updatedToday.toString(), icon: FileText, accent: '#3B82F6', sub: 'Submitted work updates today' },
          { label: 'Pending Review', value: stats.totalPending.toString(), icon: AlertCircle, accent: '#F59E0B', sub: 'Awaiting HR/Admin evaluation' },
          { label: 'Reviewed Updates', value: stats.totalReviewed.toString(), icon: CheckCircle, accent: '#10B981', sub: 'Approved daily reports' },
          { label: 'Missing Today', value: stats.missingToday.toString(), icon: Users, accent: '#F43F5E', sub: 'Employees yet to report' }
        ].map((stat, idx) => (
          <PastelStatCard key={idx} icon={stat.icon} label={stat.label} value={stat.value} sub={stat.sub} accent={stat.accent} />
        ))}
      </div>

      {/* Main content table & filter */}
      <div className="saas-card bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900/90 dark:to-slate-950/70 border border-slate-205/30 dark:border-slate-800/80 rounded-[28px] p-6 shadow-md text-left">
        
        {/* Filters Panel Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-150/45 dark:border-slate-800/60 pb-5 mb-5 w-full">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-650 shrink-0 border border-blue-500/10">
              <Filter className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-905 dark:text-white">Filter & Search Logs</h3>
              <p className="text-[9.5px] font-bold text-slate-400 dark:text-slate-550 uppercase mt-0.5">Narrow down status reports</p>
            </div>
          </div>
          
          {/* Quick Search */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search by name, tasks, blockers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-105/50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/60 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-500/50"
            />
          </div>
        </div>

        {/* Filters Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-widest">Department</label>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-202/55 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500/50"
            >
              <option value="">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="Product">Product</option>
              <option value="Design">Design</option>
              <option value="Marketing">Marketing</option>
              <option value="Sales">Sales</option>
              <option value="HR">Human Resources</option>
              <option value="Operations">Operations</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-widest">Employee Email</label>
            <input 
              type="text"
              placeholder="e.g. employee@company.com"
              value={emailFilter}
              onChange={(e) => setEmailFilter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500/50"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-widest">Log Date</label>
            <input 
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-850 dark:text-slate-200 focus:outline-none focus:border-blue-500/50"
            />
          </div>
        </div>

        {/* Status reports Table/List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Loading reports...</p>
          </div>
        ) : updates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 bg-slate-500/5 dark:bg-slate-500/10 rounded-full border border-slate-500/10 mb-4">
              <FileText className="w-10 h-10 text-slate-400 dark:text-slate-600" />
            </div>
            <h4 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest">No Status Reports Found</h4>
            <p className="text-[10px] text-slate-450 mt-1.5 max-w-xs leading-relaxed">No employee updates matched the filter criteria or none have been submitted today.</p>
          </div>
        ) : (
          <div className="space-y-3.5">
            <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 text-[8.5px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800/80">
              <div className="col-span-3">Employee & Department</div>
              <div className="col-span-2">Date</div>
              <div className="col-span-5">Yesterday / Today's Plan</div>
              <div className="col-span-2 text-right">Status / Details</div>
            </div>

            <div className="space-y-3">
              {updates.map((item) => (
                <div 
                  key={item._id}
                  onClick={() => setSelectedReport(item)}
                  className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-white dark:hover:bg-slate-900 border border-slate-100/50 dark:border-slate-800/60 hover:border-slate-200 dark:hover:border-slate-750 rounded-2xl cursor-pointer transition-all duration-300 shadow-sm"
                >
                  <div className="col-span-3 text-left">
                    <span className="text-[11px] font-black text-slate-800 dark:text-white uppercase tracking-wide block">{item.employeeName}</span>
                    <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">{item.department}</span>
                  </div>

                  <div className="col-span-2 text-left">
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-350 block">
                      {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>

                  <div className="col-span-5 text-left min-w-0 pr-2">
                    <div className="text-[11.5px] text-slate-700 dark:text-slate-350 line-clamp-1 leading-relaxed">
                      <strong className="text-slate-900 dark:text-slate-200 font-extrabold uppercase text-[8px] tracking-widest mr-1">Y:</strong> 
                      {item.yesterdaysWork}
                    </div>
                    <div className="text-[11.5px] text-slate-700 dark:text-slate-350 line-clamp-1 leading-relaxed mt-0.5">
                      <strong className="text-slate-900 dark:text-slate-200 font-extrabold uppercase text-[8px] tracking-widest mr-1">T:</strong> 
                      {item.todaysPlan}
                    </div>
                  </div>

                  <div className="col-span-2 flex items-center gap-3 shrink-0 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-800 justify-between md:justify-start">
                    <span className={cn(
                      "text-[8px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded border",
                      item.status === 'Reviewed' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                      "bg-blue-500/10 text-blue-500 border-blue-500/20"
                    )}>
                      {item.status === 'Pending Review' ? 'Pending' : item.status}
                    </span>

                    <span className="text-slate-400 hover:text-slate-200 transition-colors uppercase text-[9px] font-black tracking-widest flex items-center gap-1">
                      Details <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
                className="absolute top-4 right-4 p-2 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 dark:text-slate-500 transition-all cursor-pointer border-none"
              >
                <X className="w-4.5 h-4.5" />
              </button>

              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-805 pb-4 mb-4">
                <Calendar className="w-5 h-5 text-blue-650" />
                <div className="text-left">
                  <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white">{selectedReport.employeeName}</h4>
                  <p className="text-[9.5px] font-bold text-slate-450 uppercase mt-0.5">
                    {selectedReport.department} • {new Date(selectedReport.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-xs text-left">
                {/* Yesterday */}
                <div>
                  <span className="text-[8.5px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-widest block mb-1">Yesterday's Accomplishments</span>
                  <div className="p-3 bg-slate-50/50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-2xl text-slate-855 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {selectedReport.yesterdaysWork}
                  </div>
                </div>

                {/* Today */}
                <div>
                  <span className="text-[8.5px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-widest block mb-1">Today's Target Plan</span>
                  <div className="p-3 bg-slate-50/50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-2xl text-slate-855 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {selectedReport.todaysPlan}
                  </div>
                </div>

                {/* Blockers */}
                {selectedReport.blockers && (
                  <div>
                    <span className="text-[8.5px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-widest block mb-1">Active Blockers</span>
                    <div className="p-3 bg-rose-500/5 dark:bg-rose-955/10 border border-rose-100/50 dark:border-rose-900/10 rounded-2xl text-rose-700 dark:text-rose-400 leading-relaxed whitespace-pre-wrap">
                      {selectedReport.blockers}
                    </div>
                  </div>
                )}

                {/* Review status actions */}
                <div className="pt-2">
                  {selectedReport.status === 'Reviewed' ? (
                    <div className="p-3.5 bg-emerald-500/5 dark:bg-emerald-950/15 border border-emerald-100/50 dark:border-emerald-900/10 rounded-2xl flex items-center gap-3">
                      <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                      <div>
                        <p className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider leading-none">Status Approved & Reviewed</p>
                        <p className="text-[9px] text-slate-500 dark:text-slate-450 mt-1.5 leading-none">Reviewed by <strong>{selectedReport.reviewedBy}</strong> {selectedReport.reviewedAt && `on ${new Date(selectedReport.reviewedAt).toLocaleDateString()}`}</p>
                      </div>
                    </div>
                  ) : (
                    selectedReport.employeeEmail?.toLowerCase() !== profile?.email?.toLowerCase() && (
                      <button
                        type="button"
                        disabled={reviewing}
                        onClick={() => handleReview(selectedReport._id)}
                        className="w-full py-2.5 bg-blue-650 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md shadow-blue-500/10 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer border-none"
                      >
                        {reviewing ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        Mark as Reviewed & Approved
                      </button>
                    )
                  )}
                </div>

                {/* Comments feed */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80">
                  <span className="text-[9px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-widest block mb-3">Review Comments ({selectedReport.comments ? selectedReport.comments.length : 0})</span>
                  
                  {selectedReport.comments && selectedReport.comments.length > 0 && (
                    <div className="space-y-3 max-h-[150px] overflow-y-auto pr-1 no-scrollbar mb-4">
                      {selectedReport.comments.map((comment, idx) => (
                        <div 
                          key={idx}
                          className={cn(
                            "p-3 rounded-2xl border text-[11px] leading-relaxed",
                            comment.authorRole === 'HR' || comment.authorRole === 'Admin'
                              ? "bg-blue-500/5 border-blue-500/10 text-slate-850 dark:text-slate-200 ml-8 text-right"
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
                      placeholder="Add reviewer feedback or query..."
                      className="flex-1 bg-slate-50 dark:bg-slate-955 border border-slate-100 dark:border-slate-850 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-slate-250 focus:outline-none focus:border-blue-650"
                    />
                    <button 
                      type="submit"
                      disabled={commenting || !newComment.trim()}
                      className="px-3 bg-blue-650 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center transition-all disabled:opacity-50 shrink-0 cursor-pointer border-none"
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
