"use client";

import React, { useState, useEffect } from 'react';
import { 
  Calendar, CheckSquare, Clock, AlertCircle, FileText, Send, 
  MessageSquare, Edit3, CheckCircle, RefreshCw, X, ChevronRight 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Comment {
  authorEmail: string;
  authorName: string;
  authorRole: string;
  content: string;
  createdAt: string;
}

interface DailyUpdate {
  _id?: string;
  date: string;
  yesterdaysWork: string;
  todaysPlan: string;
  blockers?: string;
  status: 'Draft' | 'Submitted' | 'Pending Review' | 'Reviewed';
  reviewedBy?: string;
  reviewedAt?: string;
  comments: Comment[];
  createdAt?: string;
  updatedAt?: string;
}

interface DailyWorkUpdatesTabProps {
  profileData: any;
  addNotification: (msg: string) => void;
}

export function DailyWorkUpdatesTab({ profileData, addNotification }: DailyWorkUpdatesTabProps) {
  const [history, setHistory] = useState<DailyUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedReport, setSelectedReport] = useState<DailyUpdate | null>(null);

  // Form States
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [yesterdaysWork, setYesterdaysWork] = useState('');
  const [todaysPlan, setTodaysPlan] = useState('');
  const [blockers, setBlockers] = useState('');
  const [editId, setEditId] = useState<string | null>(null);

  // Comments State
  const [newComment, setNewComment] = useState('');
  const [commenting, setCommenting] = useState(false);

  // Load history from API
  const fetchHistory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/daily-updates/my', { headers });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);

        // Prefill form if there's a draft for today
        const todayStr = new Date().toISOString().split('T')[0];
        const todayDraft = data.find((u: DailyUpdate) => {
          const uDateStr = new Date(u.date).toISOString().split('T')[0];
          return uDateStr === todayStr && u.status === 'Draft';
        });

        if (todayDraft) {
          setYesterdaysWork(todayDraft.yesterdaysWork);
          setTodaysPlan(todayDraft.todaysPlan);
          setBlockers(todayDraft.blockers || '');
          setEditId(todayDraft._id || null);
          setFormDate(todayStr);
        }
      }
    } catch (err) {
      console.error('Failed to fetch DSR history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Handle Form Submit (Save Draft or Submit Update)
  const handleSubmit = async (status: 'Draft' | 'Submitted') => {
    if (!yesterdaysWork.trim() || !todaysPlan.trim()) {
      addNotification('Please fill in Yesterday\'s Work and Today\'s Plan fields.');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const payload = {
        date: formDate,
        yesterdaysWork: yesterdaysWork.trim(),
        todaysPlan: todaysPlan.trim(),
        blockers: blockers.trim(),
        status: status === 'Submitted' ? 'Pending Review' : 'Draft' // Matches roles flow
      };

      const res = await fetch('/api/daily-updates', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        addNotification(status === 'Submitted' ? 'Daily Status Report submitted!' : 'Draft update saved.');
        
        // Reset form if submitted
        if (status === 'Submitted') {
          setYesterdaysWork('');
          setTodaysPlan('');
          setBlockers('');
          setEditId(null);
          setFormDate(new Date().toISOString().split('T')[0]);
        }
        
        fetchHistory();
      } else {
        const errorData = await res.json();
        addNotification(errorData.error || 'Failed to save DSR.');
      }
    } catch (err) {
      console.error(err);
      addNotification('Error connecting to database to save DSR.');
    } finally {
      setSubmitting(false);
    }
  };

  // Load a report for editing (Only drafts)
  const handleEdit = (report: DailyUpdate) => {
    setYesterdaysWork(report.yesterdaysWork);
    setTodaysPlan(report.todaysPlan);
    setBlockers(report.blockers || '');
    setFormDate(new Date(report.date).toISOString().split('T')[0]);
    setEditId(report._id || null);
    addNotification('Loaded update details to the editor form.');
  };

  // Add Comment
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
        addNotification('Comment added successfully!');
        
        // Refresh history list too
        setHistory(prev => prev.map(item => item._id === selectedReport._id ? resData.report : item));
      } else {
        addNotification('Failed to add comment.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCommenting(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Title Header */}
      <div>
        <h2 className="text-xl font-black uppercase tracking-widest text-slate-900 dark:text-white">Daily Status Reports (DSR)</h2>
        <p className="text-[10px] font-bold text-slate-455 dark:text-slate-500 mt-1 uppercase tracking-wider leading-none">
          Submit daily work updates, track achievements and blockers, and maintain productivity logs.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Submit Status Report Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="saas-card bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900/90 dark:to-slate-950/70 border border-slate-205/30 dark:border-slate-800/80 rounded-[28px] p-6 shadow-md">
            <div className="flex justify-between items-center border-b border-slate-150/45 dark:border-slate-800/60 pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 border border-blue-500/10">
                  <CheckSquare className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">
                  {editId ? 'Edit Daily Update Log' : 'Create Daily Status Report'}
                </h3>
              </div>
              <span className="text-[9px] font-mono bg-slate-50 dark:bg-slate-850 text-slate-550 dark:text-slate-400 px-2.5 py-1 rounded-lg border border-slate-100 dark:border-slate-800/60 font-bold uppercase tracking-wider">
                Date: {new Date(formDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
            </div>

            <div className="space-y-4">
              {/* Date Input */}
              <div className="saas-input-group">
                <label className="saas-label">Update Date</label>
                <input 
                  type="date"
                  value={formDate}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="saas-input placeholder:text-[10px] placeholder:font-semibold placeholder:text-slate-400/55"
                />
              </div>

              {/* Yesterday's Work */}
              <div className="saas-input-group">
                <label className="saas-label">Yesterday's Work / Accomplishments</label>
                <textarea
                  rows={4}
                  value={yesterdaysWork}
                  onChange={(e) => setYesterdaysWork(e.target.value)}
                  placeholder="* Bullet points of what you finished yesterday...&#10;* Fixed attendance alignment bug&#10;* Completed HR dashboard design"
                  className="saas-textarea placeholder:text-[10px] placeholder:font-semibold placeholder:text-slate-400/55"
                />
              </div>

              {/* Today's Plan */}
              <div className="saas-input-group">
                <label className="saas-label">Today's Target Plan</label>
                <textarea
                  rows={4}
                  value={todaysPlan}
                  onChange={(e) => setTodaysPlan(e.target.value)}
                  placeholder="* What are you working on today?&#10;* Create DSR module backend models&#10;* Build dashboard feedback views"
                  className="saas-textarea placeholder:text-[10px] placeholder:font-semibold placeholder:text-slate-400/55"
                />
              </div>

              {/* Blockers */}
              <div className="saas-input-group">
                <label className="saas-label">Active Blockers / Issues (Optional)</label>
                <textarea
                  rows={2}
                  value={blockers}
                  onChange={(e) => setBlockers(e.target.value)}
                  placeholder="Any blockers holding you back? e.g. Waiting for Brevo API access keys"
                  className="saas-textarea placeholder:text-[10px] placeholder:font-semibold placeholder:text-slate-400/55"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSubmit('Draft')}
                  className="saas-btn-secondary"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSubmit('Submitted')}
                  className="saas-btn-primary"
                >
                  {submitting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  Submit Update
                </button>
              </div>
            </div>
          </div>
        </div>
 
        {/* Right Side: Timeline & Logs */}
        <div className="space-y-6">
          <div className="saas-card bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900/90 dark:to-slate-950/70 border border-slate-205/30 dark:border-slate-800/80 rounded-[28px] p-6 shadow-md flex flex-col min-h-[480px]">
            <div className="flex items-center gap-2 border-b border-slate-150/45 dark:border-slate-800/60 pb-4 mb-4">
              <Clock className="w-4 h-4 text-slate-400" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">
                My Update History
              </h3>
            </div>

            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2" />
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Loading history...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                <div className="p-3.5 bg-slate-500/5 dark:bg-slate-500/10 rounded-full border border-slate-500/10 mb-3">
                  <FileText className="w-8 h-8 text-slate-405 dark:text-slate-550" />
                </div>
                <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">No Updates Submitted</p>
                <p className="text-[9.5px] text-slate-450 mt-1 max-w-[180px] leading-relaxed mx-auto">Submit your first daily status report using the form editor.</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-4 max-h-[420px] pr-1 scrollbar-thin scrollbar-thumb-slate-205 dark:scrollbar-thumb-slate-850">
                {history.map((item) => {
                  const itemDateStr = new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                  
                  return (
                    <div 
                      key={item._id}
                      onClick={() => setSelectedReport(item)}
                      className="group p-4 bg-slate-50/50 dark:bg-slate-850/20 dark:hover:bg-slate-850/40 border border-slate-100/40 dark:border-slate-800/40 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-700/65 rounded-2xl cursor-pointer transition-all duration-300 relative flex flex-col gap-2.5 shadow-sm"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-800 dark:text-slate-250 uppercase tracking-wider">
                          {itemDateStr}
                        </span>
                        <span className={cn(
                          "text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded border shrink-0",
                          item.status === 'Reviewed' ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.05)]" :
                          item.status === 'Pending Review' ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 shadow-[0_0_12px_rgba(59,130,246,0.05)]" :
                          item.status === 'Submitted' ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 shadow-[0_0_12px_rgba(99,102,241,0.05)]" :
                          "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.05)]"
                        )}>
                          {item.status === 'Pending Review' ? 'Under Review' : item.status}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-505 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        <strong className="text-slate-800 dark:text-slate-300 font-extrabold uppercase tracking-wide text-[9px]">Yesterday:</strong> {item.yesterdaysWork}
                      </div>

                      <div className="flex justify-between items-center text-[8.5px] text-slate-450 font-bold border-t border-slate-150/40 dark:border-slate-800/60 pt-2 mt-0.5 uppercase tracking-widest">
                        <span className="flex items-center gap-1 text-[8px]">
                          <MessageSquare className="w-3 h-3 text-blue-500" /> {item.comments.length} Comments
                        </span>
                        
                        {item.status === 'Draft' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(item);
                            }}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-750 flex items-center gap-1 uppercase font-black tracking-widest cursor-pointer border-none bg-transparent"
                          >
                            <Edit3 className="w-3.5 h-3.5" /> Edit Draft
                          </button>
                        )}
                        {item.status !== 'Draft' && (
                          <span className="text-slate-400 uppercase tracking-widest flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform duration-300">
                            Details <ChevronRight className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Details View Modal */}
      <AnimatePresence>
        {selectedReport && (
          <div className="fixed inset-0 z-[250] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-neutral-50/95 dark:bg-slate-905/95 backdrop-blur-md w-full max-w-lg rounded-[32px] p-6 shadow-2xl relative border border-slate-200/50 dark:border-slate-800/80 max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setSelectedReport(null)}
                className="absolute top-4 right-4 p-2.5 bg-slate-105 dark:bg-slate-800/50 hover:bg-rose-500 hover:text-white rounded-xl text-slate-405 dark:text-slate-500 transition-all cursor-pointer border-none"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2.5 border-b border-slate-150/45 dark:border-slate-800/60 pb-4 mb-4">
                <Calendar className="w-5 h-5 text-blue-500" />
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Daily Report Details</h4>
                  <p className="text-[9.5px] font-bold text-slate-450 uppercase mt-0.5">
                    {new Date(selectedReport.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* Report sections */}
              <div className="space-y-4 text-xs text-left">
                <div>
                  <span className="text-[9px] font-black text-slate-400 dark:text-slate-555 uppercase tracking-widest block mb-1">Yesterday's Accomplishments</span>
                  <div className="p-4 bg-slate-50/50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-2xl text-slate-850 dark:text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">
                    {selectedReport.yesterdaysWork}
                  </div>
                </div>

                <div>
                  <span className="text-[9px] font-black text-slate-400 dark:text-slate-555 uppercase tracking-widest block mb-1">Today's Target Plan</span>
                  <div className="p-4 bg-slate-50/50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-2xl text-slate-850 dark:text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">
                    {selectedReport.todaysPlan}
                  </div>
                </div>

                {selectedReport.blockers && (
                  <div>
                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-555 uppercase tracking-widest block mb-1">Blockers / Challenges</span>
                    <div className="p-4 bg-rose-500/5 dark:bg-rose-955/10 border border-rose-100/50 dark:border-rose-900/10 rounded-2xl text-rose-700 dark:text-rose-400 leading-relaxed font-sans whitespace-pre-wrap">
                      {selectedReport.blockers}
                    </div>
                  </div>
                )}

                {/* Review section if exists */}
                {selectedReport.status === 'Reviewed' && (
                  <div className="p-4 bg-emerald-500/5 dark:bg-emerald-955/10 border border-emerald-100/50 dark:border-emerald-900/10 rounded-2xl flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                    <div>
                      <p className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest leading-none">Report Approved & Reviewed</p>
                      <p className="text-[9px] text-slate-500 dark:text-slate-450 mt-2 leading-none font-bold">Reviewed by <strong>{selectedReport.reviewedBy}</strong> {selectedReport.reviewedAt && `on ${new Date(selectedReport.reviewedAt).toLocaleDateString()}`}</p>
                    </div>
                  </div>
                )}

                {/* Comments Section */}
                <div className="pt-4 border-t border-slate-150/45 dark:border-slate-800/60">
                  <span className="text-[9.5px] font-black text-slate-400 dark:text-slate-555 uppercase tracking-widest block mb-3">Comments Feed ({selectedReport.comments.length})</span>
                  
                  {selectedReport.comments.length === 0 ? (
                    <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider italic text-center py-4">No comments have been posted yet.</p>
                  ) : (
                    <div className="space-y-3 max-h-[160px] overflow-y-auto pr-1 no-scrollbar mb-4">
                      {selectedReport.comments.map((comment, idx) => (
                        <div 
                          key={idx}
                          className={cn(
                            "p-3 rounded-2xl border text-[11px] leading-relaxed",
                            comment.authorEmail.toLowerCase() === profileData.email.toLowerCase()
                              ? "bg-blue-550/5 border-blue-500/10 text-slate-800 dark:text-slate-200 ml-8 text-right"
                              : "bg-slate-50/50 dark:bg-slate-950 border-slate-100 dark:border-slate-850 text-slate-700 dark:text-slate-350 mr-8 text-left"
                          )}
                        >
                          <div className="flex justify-between items-center mb-1 text-[8.5px] text-slate-450 font-bold uppercase tracking-wide">
                            <span>{comment.authorName} ({comment.authorRole})</span>
                            <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="whitespace-pre-wrap">{comment.content}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Comment Form */}
                  <form onSubmit={handleAddComment} className="flex gap-2 pt-3 border-t border-slate-150/45 dark:border-slate-800/60">
                    <input 
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Type comment or feedback..."
                      className="saas-input"
                    />
                    <button 
                      type="submit"
                      disabled={commenting || !newComment.trim()}
                      className="px-4.5 bg-blue-650 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center transition-all disabled:opacity-50 shrink-0 cursor-pointer border-none"
                    >
                      {commenting ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
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
