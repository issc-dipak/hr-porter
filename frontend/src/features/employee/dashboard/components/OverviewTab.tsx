"use client";

import React, { useState, useEffect } from 'react';
import { 
  Clock, Calendar, DollarSign, Target, Megaphone, 
  AlertCircle, ShieldAlert, Award, BookOpen, MessageSquare, 
  Send, Sparkles, Plus, Download, FileText, CheckCircle2,
  PartyPopper, GraduationCap, Landmark, GitBranch, CheckCheck, ChevronRight,
  Mail, Settings, Play, ArrowRight, UserCheck, Briefcase, HelpCircle, Eye, Search
} from 'lucide-react';
import { EmailLogModal } from '../../../admin/dashboard/components/EmailLogModal';
import { cn } from "@/lib/utils";
import { PastelStatCard } from '@/components/ui/PastelStatCard';
import { NotificationBellDropdown } from '../../../admin/dashboard/components/NotificationBellDropdown';

interface OverviewTabProps {
  profileData: any;
  isCheckedIn: boolean;
  isOnBreak: boolean;
  secondsWorked: number;
  breakSeconds: number;
  TARGET_SECONDS: number;
  formatTime: (sec: number) => string;
  toggleBreak: () => void;
  isCheckedInToggler: () => void;
  remainingLeaves: number;
  announcements: any[];
  jobs: any[];
  setActiveTab: (tab: string) => void;
  setShowLeaveModal: (show: boolean) => void;
  profile?: any;
  onOpenMessenger?: () => void;
  hoursLogged: string;
  sickLeavesAllowed: string;
  performanceRating: string;
  checkInTime?: string | null;
  hrViewAsEmployee?: boolean;
  onSwitchToHR?: () => void;
  onOpenSearch?: () => void;
}

export function OverviewTab({
  profileData,
  isCheckedIn,
  isOnBreak,
  secondsWorked,
  breakSeconds,
  TARGET_SECONDS,
  formatTime,
  toggleBreak,
  isCheckedInToggler,
  remainingLeaves: initialRemainingLeaves,
  announcements: initialAnnouncements,
  jobs,
  setActiveTab,
  setShowLeaveModal,
  profile,
  onOpenMessenger,
  hoursLogged,
  sickLeavesAllowed,
  performanceRating,
  checkInTime,
  hrViewAsEmployee = false,
  onSwitchToHR,
  onOpenSearch
}: OverviewTabProps) {
  const [liveDateTime, setLiveDateTime] = useState('');
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  
  // Dashboard state loaded from custom endpoint
  const [dbData, setDbData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Daily work update form state
  const [yesterdayWork, setYesterdayWork] = useState('');
  const [todayPlan, setTodayPlan] = useState('');
  const [blockers, setBlockers] = useState('');
  const [status, setStatus] = useState('In Progress');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Sync Date/Time
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLiveDateTime(now.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }) + ' • ' + now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch consolidated dashboard data
  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('hr_system_token');
      const res = await fetch('/api/employee/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDbData(data);
      }
    } catch (err) {
      console.error("Failed to load dashboard endpoint data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [profileData.name]);

  // Handle Work Update Submission
  const handleWorkUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!yesterdayWork.trim() || !todayPlan.trim()) {
      showNotice("Please fill in yesterday's accomplishments and today's plan.");
      return;
    }

    setSubmitLoading(true);
    try {
      const token = localStorage.getItem('hr_system_token');
      const res = await fetch('/api/work-updates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          yesterdaysWork: yesterdayWork.trim(),
          todaysPlan: todayPlan.trim(),
          blockers: blockers.trim(),
          status: status
        })
      });

      if (res.ok) {
        showNotice("Work update submitted successfully!");
        setYesterdayWork('');
        setTodayPlan('');
        setBlockers('');
        loadDashboardData();
      } else {
        showNotice("Failed to submit work update.");
      }
    } catch (err) {
      showNotice("Error submitting work update.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const showNotice = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Extract variables safely
  const attendanceToday = dbData?.attendance?.today;
  const leaveBalance = dbData?.leave || { casual: 8, sick: 12, earned: 10 };
  const payrollSummary = dbData?.payroll || { currentSalary: 38400, nextPayrollDate: '2026-06-30' };
  const perfData = dbData?.performance || { rating: '4.8', goalCompletion: 85 };
  const unreadAnnCount = dbData?.announcements?.unreadCount || 0;
  const eventsList = dbData?.events || [];
  const ticketsList = dbData?.tickets?.list || [];
  const growthData = dbData?.growth || { coursesCompleted: 4, certificatesEarned: 2, progress: 72 };
  const recognitionData = dbData?.recognition || { employeeOfMonth: 'raj r patil', kudosReceived: 3, badges: [] };

  return (
    <div className="space-y-6 text-left">
      {/* Toast Notice */}
      {notification && (
        <div className="fixed top-6 right-6 z-[500] px-4 py-3 bg-slate-900 text-white rounded-2xl shadow-xl text-xs font-semibold flex items-center gap-2 border border-slate-800">
          <Sparkles className="w-4 h-4 text-yellow-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header welcome row */}
      <div className={cn(
        "relative flex flex-col lg:flex-row lg:items-center justify-between gap-4 px-5 py-4 rounded-3xl overflow-visible",
        "bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl",
        "border border-slate-200/70 dark:border-slate-800/70",
        "shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.25)]"
      )}>
        {/* Mesh gradient blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
          <div className="absolute -top-8 -left-8 w-44 h-44 rounded-full blur-3xl opacity-[0.07] bg-violet-500" />
          <div className="absolute -bottom-6 right-20 w-36 h-36 rounded-full bg-indigo-400 blur-3xl opacity-[0.045]" />
        </div>

        {/* Left: Brand Identity Block */}
        <div className="flex items-center gap-4 min-w-0 relative">
          {/* Icon badge */}
          <div className="relative flex-shrink-0">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br from-violet-500 via-violet-600 to-indigo-700 shadow-xl shadow-violet-500/20 relative overflow-hidden">
              <div className="absolute inset-0 opacity-40" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 60%)' }} />
              <GraduationCap className="w-6 h-6 text-white relative z-10 drop-shadow" />
            </div>
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-black tracking-tight leading-none font-outfit text-slate-900 dark:text-white">
              My Workspace — <span className="text-violet-650 dark:text-violet-400 font-extrabold">{profileData.name || 'Employee'}</span>
            </h1>
            <p className="text-[10px] font-semibold text-slate-400 mt-1.5 tracking-wide leading-normal">
              Personal productivity, attendance checkpoints, and task logs
            </p>
          </div>
        </div>

        {/* Right: Controls Toolbar */}
        <div className="flex items-center gap-2 shrink-0 relative">
          {hrViewAsEmployee && onSwitchToHR && (
            <button 
              onClick={onSwitchToHR}
              className="px-3.5 h-8 bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-650 hover:to-indigo-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer border-none shadow-sm active:scale-95 transition-all flex items-center justify-center"
            >
              Back to HR View
            </button>
          )}

          <div className="flex items-center gap-2">
            {/* Search */}
            <button
              type="button"
              onClick={onOpenSearch}
              title="Search Workspace (Ctrl+K)"
              className="group flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50/70 hover:bg-white dark:bg-slate-800/40 dark:hover:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 transition-all duration-200 cursor-pointer active:scale-95 shadow-sm"
            >
              <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 transition-all duration-200 group-hover:scale-110" />
            </button>

            {/* Settings */}
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              title="Settings Dashboard"
              className="group flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50/70 hover:bg-white dark:bg-slate-800/40 dark:hover:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 transition-all duration-200 cursor-pointer active:scale-95 shadow-sm"
            >
              <Settings className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-100 group-hover:rotate-90 transition-all duration-300" />
            </button>

            {/* Email */}
            <button
              type="button"
              onClick={() => setIsEmailModalOpen(true)}
              title="System Emails Inbox"
              className="group flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50/70 hover:bg-white dark:bg-slate-800/40 dark:hover:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 transition-all duration-200 cursor-pointer active:scale-95 shadow-sm"
            >
              <Mail className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 transition-all duration-200 group-hover:scale-110" />
            </button>

            {/* Notification bell */}
            <div className="relative">
              <NotificationBellDropdown 
                onNavigate={(page) => setActiveTab(page === 'dashboard' ? 'overview' : page)}
                triggerClassName="group flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50/70 hover:bg-white dark:bg-slate-800/40 dark:hover:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 transition-all duration-200 cursor-pointer active:scale-95 shadow-sm text-slate-400 hover:text-slate-900 dark:hover:text-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: MY OVERVIEW */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Attendance Status", value: isCheckedIn ? "Active Shift" : "Checked Out", desc: isCheckedIn ? `In: ${checkInTime || '-'}` : "Ready to check in", icon: Clock, accent: "#8B5CF6" },
          { label: "Working Hours Today", value: isCheckedIn ? formatTime(secondsWorked) : "00:00:00", desc: "Target: 8.0 Hrs", icon: Clock, accent: "#10B981" },
          { label: "My Leave Balance", value: `${initialRemainingLeaves} Days`, desc: "Total accrued leaves", icon: Calendar, accent: "#F59E0B" },
          { label: "Performance Rating", value: `${perfData.rating} / 5.0`, desc: `${perfData.goalCompletion}% goal met`, icon: Target, accent: "#F43F5E" },
          { label: "Active Projects", value: "Assigned", desc: "View my project cards", icon: Briefcase, accent: "#3B82F6" },
          { label: "Reward Points", value: `${recognitionData.kudosReceived || 0} Kudos`, desc: `${recognitionData.badges?.length || 0} active badges`, icon: Award, accent: "#6366F1" }
        ].map((card, i) => (
          <PastelStatCard key={i} icon={card.icon} label={card.label} value={card.value} sub={card.desc} accent={card.accent} />
        ))}
      </div>

      {/* SECTION 2: TODAY'S FOCUS & MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left main workspace (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Today's Focus Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-violet-500/10 flex items-center justify-center">
                  <Play className="w-3.5 h-3.5 text-violet-500" />
                </div>
                <div>
                  <h3 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Today's Focus & Priorities</h3>
                  <p className="text-[8px] text-slate-400 font-bold uppercase">Start timer on your priority actions</p>
                </div>
              </div>
              <button 
                onClick={isCheckedInToggler}
                className={cn(
                  "px-3 py-1 rounded-xl text-[8.5px] font-black uppercase tracking-wider transition-all border cursor-pointer active:scale-95",
                  isCheckedIn 
                    ? "bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/40 text-rose-600" 
                    : "bg-sky-50 dark:bg-sky-950/20 border-sky-200 dark:border-sky-800/40 text-sky-600"
                )}
              >
                {isCheckedIn ? 'Clock Out' : 'Clock In Now'}
              </button>
            </div>

            <div className="space-y-2">
              <div className="p-3 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800/40 flex justify-between items-center text-[10px]">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <div>
                    <span className="font-black text-slate-800 dark:text-white uppercase">Active Log Status</span>
                    <p className="text-[8px] text-slate-400 mt-0.5">Logged {isCheckedIn ? formatTime(secondsWorked) : '0h 0m'} of your 8-hour shift</p>
                  </div>
                </div>
                {isCheckedIn && (
                  <button onClick={toggleBreak} className="px-2.5 py-1 bg-violet-600 hover:bg-violet-750 text-white rounded-lg text-[8px] font-bold border-none transition-all cursor-pointer">
                    {isOnBreak ? 'Resume Work' : 'Go On Break'}
                  </button>
                )}
              </div>

              {/* Tasks to focus on */}
              <div className="p-3 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800/40 flex justify-between items-center text-[10px]">
                <div className="flex items-center gap-2.5">
                  <CheckCheck className="w-4 h-4 text-violet-500" />
                  <div>
                    <span className="font-black text-slate-800 dark:text-white uppercase">Daily Status Report</span>
                    <p className="text-[8px] text-slate-400 mt-0.5">Submit accomplishments update to your manager before close of day</p>
                  </div>
                </div>
                <button onClick={() => setActiveTab('daily-updates')} className="px-2.5 py-1 bg-slate-200/60 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg text-[8px] font-bold border-none transition-all cursor-pointer">Submit Update</button>
              </div>
            </div>
          </div>

          {/* DSR Submission */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-blue-600" />
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Daily Status Update</h3>
            </div>
            
            <form onSubmit={handleWorkUpdateSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[8px] font-black text-slate-400 uppercase mb-1">Accomplishments</label>
                  <textarea
                    rows={2}
                    value={yesterdayWork}
                    onChange={e => setYesterdayWork(e.target.value)}
                    placeholder="Finished tasks..."
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/60 dark:border-slate-800 text-xs focus:outline-none focus:border-blue-500 text-slate-850 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[8px] font-black text-slate-400 uppercase mb-1">Today's Focus</label>
                  <textarea
                    rows={2}
                    value={todayPlan}
                    onChange={e => setTodayPlan(e.target.value)}
                    placeholder="Active tasks today..."
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/60 dark:border-slate-800 text-xs focus:outline-none focus:border-blue-500 text-slate-850 dark:text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button type="submit" disabled={submitLoading} className="px-4 py-2 bg-blue-650 hover:bg-blue-700 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border-none cursor-pointer">
                  {submitLoading ? 'Posting...' : 'Log Update'}
                </button>
              </div>
            </form>
          </div>

          {/* Announcements & Feed */}
          {initialAnnouncements?.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white mb-3">Broadcasts &amp; News</h3>
              <div className="space-y-2">
                {initialAnnouncements.slice(0, 3).map((ann: any, idx: number) => (
                  <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-850/50 text-[10px]">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-black text-slate-800 dark:text-white">{ann.title}</span>
                      <span className="text-[7.5px] text-slate-400">{ann.createdAt ? new Date(ann.createdAt).toLocaleDateString() : 'Today'}</span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">{ann.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right side widgets (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Calendar events */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white mb-3">Calendar &amp; Birthdays</h3>
            <div className="space-y-2">
              {eventsList.length === 0 ? (
                <div className="py-4 text-center text-slate-400 text-[10px]">No upcoming events.</div>
              ) : (
                eventsList.map((evt: any, idx: number) => (
                  <div key={idx} className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl flex items-center gap-2.5 text-[10px]">
                    <span className="text-sm">{evt.type === 'Birthday' ? '🎂' : '🎉'}</span>
                    <div className="min-w-0">
                      <span className="font-black text-slate-800 dark:text-white block truncate">{evt.name}</span>
                      <p className="text-[7px] text-slate-400 uppercase font-bold tracking-wider mt-0.5">{evt.type} • {evt.date}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Actions Shortcuts */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white mb-3">Workspace Actions</h3>
            <div className="grid grid-cols-2 gap-2 text-[9px]">
              <button onClick={() => setShowLeaveModal(true)} className="py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold uppercase transition-all cursor-pointer">Apply Leave</button>
              <button onClick={() => setActiveTab('helpdesk')} className="py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold uppercase transition-all cursor-pointer">Raise Ticket</button>
              <button onClick={() => setActiveTab('payroll')} className="py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold uppercase transition-all cursor-pointer">View Payslip</button>
              <button onClick={() => setActiveTab('daily-updates')} className="py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold uppercase transition-all cursor-pointer">Open Tasks</button>
            </div>
          </div>

          {/* Kudos / Recognition */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white mb-3">Rewards &amp; Badges</h3>
            <div className="flex flex-wrap gap-1.5">
              {recognitionData.badges?.map((badge: string, i: number) => (
                <span key={i} className="px-2 py-0.5 bg-violet-500/10 text-violet-650 dark:text-violet-400 rounded-lg text-[8px] font-bold uppercase">{badge}</span>
              ))}
            </div>
            <p className="text-[8px] text-slate-400 mt-3 font-semibold uppercase tracking-wider">Employee of the Month: {recognitionData.employeeOfMonth || 'Not selected'}</p>
          </div>

        </div>

      </div>
      <EmailLogModal isOpen={isEmailModalOpen} onClose={() => setIsEmailModalOpen(false)} />
    </div>
  );
}
