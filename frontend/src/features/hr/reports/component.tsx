"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  BarChart3, Users, Clock, FileText, Briefcase, Target, DollarSign,
  TrendingUp, Sparkles, Plus, Download, Calendar, UserCheck, 
  Send, Bot, User, CheckCircle, AlertCircle, Mail, Award, X, ArrowRight, Clipboard
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PastelStatCard } from '@/components/ui/PastelStatCard';
import { cn } from "@/lib/utils";
import { useUIStore } from '@/store/uiStore';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, BarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts';

export default function ReportsPage() {
  const { selectedBranchId } = useUIStore();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'workforce' | 'attendance' | 'leaves' | 'payroll' | 'recruitment' | 'performance'>('workforce');
  
  // Data States
  const [overviewData, setOverviewData] = useState<any>(null);
  const [workforceData, setWorkforceData] = useState<any>(null);
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [leavesData, setLeavesData] = useState<any>(null);
  const [payrollData, setPayrollData] = useState<any>(null);
  const [recruitmentData, setRecruitmentData] = useState<any>(null);
  const [performanceData, setPerformanceData] = useState<any>(null);
  
  const [attendancePeriod, setAttendancePeriod] = useState<'Daily' | 'Weekly' | 'Monthly' | 'Yearly'>('Weekly');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const setToastMessage = (msg: string | null) => {
    if (msg) {
      useUIStore.getState().triggerToast(msg);
    }
  };

  // Scheduling state
  const [scheduleForm, setScheduleForm] = useState({
    email: '',
    reportType: 'all',
    frequency: 'Weekly',
    time: '09:00'
  });
  const [activeSchedules, setActiveSchedules] = useState<any[]>([]);

  const fetchSchedules = async () => {
    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/reports/schedules', { headers });
      if (res.ok) {
        const data = await res.json();
        const mapped = data.map((s: any) => ({
          id: s._id || s.id,
          email: s.email,
          reportType: s.reportType,
          frequency: s.frequency,
          time: s.time
        }));
        setActiveSchedules(mapped);
      }
    } catch (err) {
      console.error('Failed to fetch report schedules:', err);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchSchedules();
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const queryParams = selectedBranchId ? `&branchId=${selectedBranchId}` : '';
      const branchOnlyQuery = selectedBranchId ? `?branchId=${selectedBranchId}` : '';

      const [overviewRes, workforceRes, attendanceRes, leavesRes, payrollRes, recruitmentRes, performanceRes] = await Promise.all([
        fetch(`/api/reports/dashboard${branchOnlyQuery}`, { headers }),
        fetch(`/api/reports/workforce${branchOnlyQuery}`, { headers }),
        fetch(`/api/reports/attendance?period=${attendancePeriod}${queryParams}`, { headers }),
        fetch(`/api/reports/leaves${branchOnlyQuery}`, { headers }),
        fetch(`/api/reports/payroll${branchOnlyQuery}`, { headers }),
        fetch(`/api/reports/recruitment${branchOnlyQuery}`, { headers }),
        fetch(`/api/reports/performance${branchOnlyQuery}`, { headers })
      ]);
      
      if (overviewRes.ok) setOverviewData(await overviewRes.json());
      if (workforceRes.ok) setWorkforceData(await workforceRes.json());
      if (attendanceRes.ok) setAttendanceData(await attendanceRes.json());
      if (leavesRes.ok) setLeavesData(await leavesRes.json());
      if (payrollRes.ok) setPayrollData(await payrollRes.json());
      if (recruitmentRes.ok) setRecruitmentData(await recruitmentRes.json());
      if (performanceRes.ok) setPerformanceData(await performanceRes.json());
    } catch (error) {
      console.error('Failed to fetch report metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [attendancePeriod, selectedBranchId]);



  // Export handlers
  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const branchQuery = selectedBranchId ? `&branchId=${selectedBranchId}` : '';
      if (format === 'pdf') {
        const res = await fetch(`/api/reports/export/pdf?type=${activeTab}${branchQuery}`, { headers });
        if (!res.ok) throw new Error('Failed to fetch PDF report');
        const html = await res.text();
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
          triggerToast(`Print preview initialized for ${activeTab.toUpperCase()}`);
        }
      } else {
        const endpoint = `/api/reports/export/${format}?type=${activeTab}${branchQuery}`;
        const res = await fetch(endpoint, { headers });
        if (!res.ok) throw new Error(`Failed to export ${format.toUpperCase()}`);
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${activeTab}_report_${new Date().toISOString().split('T')[0]}.${format === 'csv' ? 'csv' : 'xls'}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        triggerToast(`Downloaded ${format.toUpperCase()} report successfully`);
      }
    } catch (err: any) {
      console.error(err);
      alert(`Failed to export report: ${err.message}`);
    }
  };

  // Schedule email handler
  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleForm.email) return;
    
    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const res = await fetch('/api/reports/schedules', {
        method: 'POST',
        headers,
        body: JSON.stringify(scheduleForm)
      });
      
      if (res.ok) {
        setScheduleForm({
          email: '',
          reportType: 'all',
          frequency: 'Weekly',
          time: '09:00'
        });
        triggerToast('Report delivery schedule registered successfully');
        await fetchSchedules();
      } else {
        const errData = await res.json();
        alert(`Failed to register schedule: ${errData.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      console.error(err);
      alert('Error registering schedule.');
    }
  };

  const handleRemoveSchedule = async (id: any) => {
    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const res = await fetch(`/api/reports/schedules/${id}`, {
        method: 'DELETE',
        headers
      });
      
      if (res.ok) {
        triggerToast('Scheduled delivery removed');
        await fetchSchedules();
      } else {
        const errData = await res.json();
        alert(`Failed to delete schedule: ${errData.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      console.error(err);
      alert('Error removing schedule.');
    }
  };



  if (!mounted) return null;

  return (
    <div className="p-5 lg:p-6 max-w-7xl mx-auto space-y-6 min-h-screen text-left relative font-sans">
      
      {/* Toast Banner — rendered via portal */}
      {/* Main Header Area */}
      <div className="flex flex-col gap-4 pb-4 border-b border-slate-200 dark:border-slate-800 text-left w-full print:hidden">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 w-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-sm border border-indigo-500/10">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">
                HRMS Reports & Insights
              </h1>
              <p className="text-[9px] font-black text-indigo-605 dark:text-indigo-400 uppercase tracking-widest mt-1.5 leading-none">
                Analytics & Metrics Hub
              </p>
            </div>
          </div>
 
          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={() => setShowScheduleModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-md transition-all active:scale-95 cursor-pointer border border-slate-250 dark:border-slate-800"
            >
              <Mail className="w-3.5 h-3.5" /> Setup Report Digest
            </button>
            
            <div className="flex bg-slate-105 dark:bg-slate-850 p-0.5 rounded-lg border border-slate-205 dark:border-slate-800">
              {['csv', 'excel', 'pdf'].map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => handleExport(fmt as any)}
                  className="px-2.5 py-1 rounded-md text-[8px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-200 transition-all cursor-pointer flex items-center gap-1"
                >
                  <Download className="w-3 h-3" /> {fmt}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-3xl break-words whitespace-normal leading-relaxed">
          Enterprise metrics, attendance compliance, payroll audits, and predictive talent analytics.
        </p>
      </div>      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 text-left">
        {[
          { 
            label: 'Total Active Staff', 
            value: overviewData?.totalEmployees ?? '0', 
            desc: 'Active in database', 
            icon: Users,
            accent: '#3B82F6'
          },
          { 
            label: 'Present Today', 
            value: overviewData?.presentToday ?? '0', 
            desc: 'Current daily presence', 
            icon: UserCheck,
            accent: '#10B981'
          },
          { 
            label: 'New Hires (Month)', 
            value: overviewData?.newHires ?? '0', 
            desc: 'Joined this month', 
            icon: Plus,
            accent: '#8B5CF6'
          },
          { 
            label: 'Pending Leaves', 
            value: overviewData?.pendingLeaves ?? '0', 
            desc: 'Awaiting reviews', 
            icon: Clock,
            accent: '#F59E0B'
          },
          { 
            label: 'Net Monthly Payroll', 
            value: `₹${((overviewData?.monthlyPayrollCost ?? 0) / 100000).toFixed(2)}L`, 
            desc: `Gross: ₹${(overviewData?.monthlyPayrollCost ?? 0).toLocaleString()}`, 
            icon: DollarSign,
            accent: '#F43F5E'
          },
          { 
            label: 'Open Vacancies', 
            value: overviewData?.openPositions ?? '0', 
            desc: 'Active postings', 
            icon: Briefcase,
            accent: '#D946EF'
          }
        ].map((stat, idx) => (
          <PastelStatCard key={idx} icon={stat.icon} label={stat.label} value={stat.value} sub={stat.desc} accent={stat.accent} />
        ))}
      </div>

      {/* Sub Navigation Tab */}
      <div className="premium-nav-container print:hidden">
        {[
          { id: 'workforce', label: 'Workforce', icon: Users },
          { id: 'attendance', label: 'Attendance', icon: Clock },
          { id: 'leaves', label: 'Leaves', icon: FileText },
          { id: 'payroll', label: 'Payroll', icon: DollarSign },
          { id: 'recruitment', label: 'Recruitment', icon: Briefcase },
          { id: 'performance', label: 'Performance', icon: Target },
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

      {/* Loader */}
      {loading ? (
        <div className="h-96 flex flex-col items-center justify-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Loading aggregate HR reports...</p>
        </div>
      ) : (
        <div className="space-y-6">

          {/* 1. Workforce Analytics Tab */}
          {activeTab === 'workforce' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Growth Area Chart */}
              <div className="saas-card bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-808 rounded-2xl p-4 shadow-sm lg:col-span-2 space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-900 dark:text-white">Employee Growth & Hires Trend</h4>
                    <p className="text-[7.5px] text-slate-400 font-bold uppercase mt-0.5">Cumulative active headcount over join months</p>
                  </div>
                  <span className="text-[8px] font-black bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded uppercase tracking-wider">Growth Trend</span>
                </div>
                <div className="h-64">
                  {workforceData?.growthTrend && workforceData.growthTrend.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={workforceData.growthTrend} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-slate-800" />
                        <XAxis dataKey="month" tick={{ fontSize: 9, fontWeight: 'bold', fill: '#94A3B8' }} />
                        <YAxis tick={{ fontSize: 9, fontWeight: 'bold', fill: '#94A3B8' }} />
                        <Tooltip contentStyle={{ fontSize: 10, fontWeight: 'bold', borderRadius: 8, backgroundColor: '#0F172A', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF' }} />
                        <Area type="monotone" dataKey="total" stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#colorGrowth)" name="Cumulative Headcount" />
                        <Area type="monotone" dataKey="hired" stroke="#10B981" strokeWidth={1} fillOpacity={0} name="Hired In Month" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-[10px] uppercase font-bold text-slate-400">No workforce growth data logged yet</div>
                  )}
                </div>
              </div>

              {/* Department Spread & Ratios */}
              <div className="saas-card bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-808 rounded-2xl p-4 shadow-sm space-y-4">
                <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-900 dark:text-white">Department Headcount Spreads</h4>
                  <p className="text-[7.5px] text-slate-400 font-bold uppercase mt-0.5">Personnel cluster distributions</p>
                </div>
                <div className="h-44 flex items-center justify-center">
                  {workforceData?.departmentDistribution && workforceData.departmentDistribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={workforceData.departmentDistribution}
                          dataKey="count"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={65}
                          paddingAngle={3}
                        >
                          {workforceData.departmentDistribution.map((entry: any, index: number) => {
                            const colors = ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#F43F5E', '#14B8A6'];
                            return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                          })}
                        </Pie>
                        <Tooltip contentStyle={{ fontSize: 9, fontWeight: 'bold' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-[9px] uppercase font-bold text-slate-400">No personnel records found</div>
                  )}
                </div>
                <div className="space-y-2 border-t border-slate-100 dark:border-slate-800/80 pt-3 max-h-36 overflow-y-auto no-scrollbar">
                  {workforceData?.departmentDistribution?.map((item: any, idx: number) => {
                    const colors = ['bg-blue-600', 'bg-emerald-600', 'bg-amber-600', 'bg-purple-600', 'bg-rose-600', 'bg-teal-600'];
                    return (
                      <div key={idx} className="flex justify-between items-center text-[8.5px] font-black uppercase tracking-wider">
                        <span className="flex items-center gap-1.5 text-slate-500">
                          <span className={cn("w-2 h-2 rounded-full", colors[idx % colors.length])} />
                          {item.name}
                        </span>
                        <span className="text-slate-800 dark:text-slate-200">{item.count} ({item.percentage}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Demographics Card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:col-span-3">
                <div className="saas-card bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-808 rounded-2xl p-4 shadow-sm">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Retention Health Index</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-none">{workforceData?.summary?.retentionRate ?? 0}%</h3>
                    <span className="text-[8px] font-black text-emerald-500 uppercase flex items-center">Optimal</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${workforceData?.summary?.retentionRate ?? 0}%` }} />
                  </div>
                  <p className="text-[7.5px] text-slate-400 font-bold uppercase mt-2 leading-relaxed">Percentage of active employees retained over the total headcount history.</p>
                </div>

                <div className="saas-card bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-808 rounded-2xl p-4 shadow-sm">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Gender Representation</span>
                  <div className="space-y-2 mt-3">
                    {workforceData?.genderDistribution?.map((item: any, idx: number) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-[8px] font-black uppercase tracking-wider text-slate-500">
                          <span>{item.gender}</span>
                          <span className="text-slate-800 dark:text-white">{item.count} ({item.percentage}%)</span>
                        </div>
                        <div className="w-full bg-slate-105 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full", item.gender === 'Male' ? 'bg-blue-500' : item.gender === 'Female' ? 'bg-pink-500' : 'bg-amber-500')} style={{ width: `${item.percentage}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="saas-card bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-808 rounded-2xl p-4 shadow-sm">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Geography / Offices</span>
                  <div className="space-y-2 mt-3 max-h-24 overflow-y-auto no-scrollbar">
                    {workforceData?.locationDistribution?.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-[8.5px] font-black uppercase tracking-wider">
                        <span className="text-slate-500">{item.location}</span>
                        <span className="text-slate-800 dark:text-white">{item.count} Staff</span>
                      </div>
                    ))}
                    {(!workforceData?.locationDistribution || workforceData.locationDistribution.length === 0) && (
                      <div className="text-[9px] uppercase font-bold text-slate-400 py-2">No location parameters logged</div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* 2. Attendance Reports Tab */}
          {activeTab === 'attendance' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-808 p-4 rounded-2xl shadow-sm">
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-900 dark:text-white">Attendance Audit Range</h4>
                  <p className="text-[7.5px] text-slate-400 font-bold uppercase mt-0.5">Define cycle duration range parameters</p>
                </div>
                <div className="flex bg-slate-105 dark:bg-slate-850 p-0.5 rounded-lg border border-slate-205 dark:border-slate-800">
                  {['Daily', 'Weekly', 'Monthly', 'Yearly'].map((p) => (
                    <button
                      key={p}
                      onClick={() => setAttendancePeriod(p as any)}
                      className={cn(
                        "px-2.5 py-1 rounded-md text-[8px] font-black uppercase tracking-widest transition-all cursor-pointer",
                        attendancePeriod === p 
                          ? "bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-sm"
                          : "text-slate-405 hover:text-slate-600 dark:hover:text-slate-202"
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Timeline chart */}
                <div className="saas-card bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-808 rounded-2xl p-4 shadow-sm lg:col-span-2 space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-900 dark:text-white">Daily Presence Rate Trend</h4>
                      <p className="text-[7.5px] text-slate-400 font-bold uppercase mt-0.5">Average attendance percentages</p>
                    </div>
                    <span className="text-[8px] font-black bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded uppercase tracking-wider">Presence Rate %</span>
                  </div>
                  <div className="h-64">
                    {attendanceData?.timeline && attendanceData.timeline.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={attendanceData.timeline} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorPresence" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-slate-800" />
                          <XAxis dataKey="label" tick={{ fontSize: 9, fontWeight: 'bold', fill: '#94A3B8' }} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 9, fontWeight: 'bold', fill: '#94A3B8' }} />
                          <Tooltip contentStyle={{ fontSize: 10, fontWeight: 'bold', borderRadius: 8, backgroundColor: '#0F172A', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF' }} />
                          <Area type="monotone" dataKey="percentage" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorPresence)" name="Attendance Rate %" />
                          <Area type="monotone" dataKey="overtime" stroke="#8B5CF6" strokeWidth={1} fillOpacity={0} name="Overtime logged" />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-[10px] uppercase font-bold text-slate-400">No attendance history logged for this range</div>
                    )}
                  </div>
                </div>

                {/* Department attendance rates */}
                <div className="saas-card bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-808 rounded-2xl p-4 shadow-sm space-y-4">
                  <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-900 dark:text-white">Department Compliance Rate</h4>
                    <p className="text-[7.5px] text-slate-400 font-bold uppercase mt-0.5">Average attendance percentage by team</p>
                  </div>
                  <div className="h-64">
                    {attendanceData?.departmentAttendanceTrends && attendanceData.departmentAttendanceTrends.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={attendanceData.departmentAttendanceTrends} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-slate-800" />
                          <XAxis dataKey="department" tick={{ fontSize: 9, fontWeight: 'bold', fill: '#94A3B8' }} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 9, fontWeight: 'bold', fill: '#94A3B8' }} />
                          <Tooltip contentStyle={{ fontSize: 9, fontWeight: 'bold' }} />
                          <Bar dataKey="percentage" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Attendance Rate %">
                            {attendanceData.departmentAttendanceTrends.map((entry: any, index: number) => {
                              const colors = ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#F43F5E'];
                              return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                            })}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-[10px] uppercase font-bold text-slate-400">No logs generated today</div>
                    )}
                  </div>
                </div>

                {/* Sub cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 lg:col-span-3">
                  <div className="saas-card bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-808 rounded-2xl p-4 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl shrink-0">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[8px] font-black text-slate-450 dark:text-slate-400 uppercase tracking-widest block">Present Count</span>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white leading-none mt-1">{attendanceData?.summary?.present ?? 0} Staff</h3>
                    </div>
                  </div>

                  <div className="saas-card bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-808 rounded-2xl p-4 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-rose-500/10 text-rose-500 rounded-2xl shrink-0">
                      <X className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[8px] font-black text-slate-455 dark:text-slate-400 uppercase tracking-widest block">Absent Count</span>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white leading-none mt-1">{attendanceData?.summary?.absent ?? 0} Staff</h3>
                    </div>
                  </div>

                  <div className="saas-card bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-808 rounded-2xl p-4 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl shrink-0">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[8px] font-black text-slate-450 dark:text-slate-400 uppercase tracking-widest block">Late Arrivals</span>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white leading-none mt-1">{attendanceData?.summary?.late ?? 0} Cycles</h3>
                    </div>
                  </div>

                  <div className="saas-card bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-808 rounded-2xl p-4 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-purple-500/10 text-purple-500 rounded-2xl shrink-0">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[8px] font-black text-slate-450 dark:text-slate-400 uppercase tracking-widest block">Logged Overtime</span>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white leading-none mt-1">+{attendanceData?.summary?.overtime ?? 0} Hours</h3>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* 3. Leave Reports Tab */}
          {activeTab === 'leaves' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Leave summary ratios */}
              <div className="saas-card bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-808 rounded-2xl p-4 shadow-sm flex flex-col justify-between space-y-4">
                <div className="pb-3 border-b border-slate-105 dark:border-slate-800">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-900 dark:text-white">Leave Status Overview</h4>
                  <p className="text-[7.5px] text-slate-400 font-bold uppercase mt-0.5">Approved, pending and rejected reviews</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-center">
                    <span className="text-[8px] font-black text-emerald-500 uppercase tracking-wider">Approved</span>
                    <h4 className="text-lg font-black text-slate-900 dark:text-white mt-1">{leavesData?.summary?.approved ?? 0}</h4>
                  </div>
                  <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl text-center">
                    <span className="text-[8px] font-black text-amber-500 uppercase tracking-wider">Pending</span>
                    <h4 className="text-lg font-black text-slate-900 dark:text-white mt-1">{leavesData?.summary?.pending ?? 0}</h4>
                  </div>
                  <div className="p-3 bg-rose-500/5 border border-rose-500/10 rounded-xl text-center">
                    <span className="text-[8px] font-black text-rose-500 uppercase tracking-wider">Rejected</span>
                    <h4 className="text-lg font-black text-slate-900 dark:text-white mt-1">{leavesData?.summary?.rejected ?? 0}</h4>
                  </div>
                </div>
                <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3">
                  <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-450 dark:text-slate-400">
                    <span>Total Logs Analyzed</span>
                    <span className="text-slate-900 dark:text-white font-black">{leavesData?.summary?.total ?? 0} Requests</span>
                  </div>
                </div>
              </div>

              {/* Leave Types Bar Chart */}
              <div className="saas-card bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-808 rounded-2xl p-4 shadow-sm space-y-4">
                <div className="pb-3 border-b border-slate-101 dark:border-slate-800">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-900 dark:text-white">Leave Category distribution</h4>
                  <p className="text-[7.5px] text-slate-400 font-bold uppercase mt-0.5">Types of leaves taken by staff</p>
                </div>
                <div className="h-44">
                  {leavesData?.leaveTypes && leavesData.leaveTypes.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={leavesData.leaveTypes} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-slate-800" />
                        <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 'bold', fill: '#94A3B8' }} />
                        <YAxis tick={{ fontSize: 9, fontWeight: 'bold', fill: '#94A3B8' }} />
                        <Tooltip contentStyle={{ fontSize: 9, fontWeight: 'bold' }} />
                        <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Total requests" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-[10px] uppercase font-bold text-slate-400">No leave categories documented</div>
                  )}
                </div>
              </div>

              {/* Department Leave Usage */}
              <div className="saas-card bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-808 rounded-2xl p-4 shadow-sm space-y-4">
                <div className="pb-3 border-b border-slate-101 dark:border-slate-800">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-900 dark:text-white">Department Leave Utilization</h4>
                  <p className="text-[7.5px] text-slate-400 font-bold uppercase mt-0.5">Approved leave logs by department</p>
                </div>
                <div className="h-44">
                  {leavesData?.departmentUsage && leavesData.departmentUsage.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={leavesData.departmentUsage} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-slate-800" />
                        <XAxis dataKey="department" tick={{ fontSize: 9, fontWeight: 'bold', fill: '#94A3B8' }} />
                        <YAxis tick={{ fontSize: 9, fontWeight: 'bold', fill: '#94A3B8' }} />
                        <Tooltip contentStyle={{ fontSize: 9, fontWeight: 'bold' }} />
                        <Bar dataKey="count" fill="#F43F5E" radius={[4, 4, 0, 0]} name="Approved leaves" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-[10px] uppercase font-bold text-slate-400">No approved leaves logged</div>
                  )}
                </div>
              </div>

              {/* Leave Monthly Trends */}
              <div className="saas-card bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-808 rounded-2xl p-4 shadow-sm lg:col-span-3 space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-900 dark:text-white">Monthly Leave Trend</h4>
                    <p className="text-[7.5px] text-slate-400 font-bold uppercase mt-0.5">Chronological request volumes over months</p>
                  </div>
                  <span className="text-[8px] font-black bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 px-2 py-0.5 rounded uppercase tracking-wider">Leave Activity</span>
                </div>
                <div className="h-56">
                  {leavesData?.trends && leavesData.trends.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={leavesData.trends} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorLeavesTrend" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#F43F5E" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-slate-800" />
                        <XAxis dataKey="month" tick={{ fontSize: 9, fontWeight: 'bold', fill: '#94A3B8' }} />
                        <YAxis tick={{ fontSize: 9, fontWeight: 'bold', fill: '#94A3B8' }} />
                        <Tooltip contentStyle={{ fontSize: 10, fontWeight: 'bold', borderRadius: 8, backgroundColor: '#0F172A', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF' }} />
                        <Area type="monotone" dataKey="count" stroke="#F43F5E" strokeWidth={2} fillOpacity={1} fill="url(#colorLeavesTrend)" name="Total Request logs" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-[10px] uppercase font-bold text-slate-400">No leave trends logged yet</div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* 4. Payroll Reports Tab */}
          {activeTab === 'payroll' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Payroll History Bar Chart */}
              <div className="saas-card bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-808 rounded-2xl p-4 shadow-sm lg:col-span-2 space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-900 dark:text-white">Monthly Wages and Costs Trend</h4>
                    <p className="text-[7.5px] text-slate-400 font-bold uppercase mt-0.5">Gross vs Net wage disbursement histories</p>
                  </div>
                  <span className="text-[8px] font-black bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded uppercase tracking-wider">Wage ledger</span>
                </div>
                <div className="h-64">
                  {payrollData?.history && payrollData.history.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={payrollData.history} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-slate-800" />
                        <XAxis dataKey="month" tick={{ fontSize: 9, fontWeight: 'bold', fill: '#94A3B8' }} />
                        <YAxis tick={{ fontSize: 9, fontWeight: 'bold', fill: '#94A3B8' }} tickFormatter={(v) => `₹${v/100000}L`} />
                        <Tooltip contentStyle={{ fontSize: 10, fontWeight: 'bold', borderRadius: 8, backgroundColor: '#0F172A', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF' }} />
                        <Bar dataKey="gross" fill="#2563EB" radius={[4, 4, 0, 0]} name="Gross Payroll Cost" />
                        <Bar dataKey="net" fill="#10B981" radius={[4, 4, 0, 0]} name="Net Wages Disbursed" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-[10px] uppercase font-bold text-slate-400">No processed pay periods logged</div>
                  )}
                </div>
              </div>

              {/* Salary bands card */}
              <div className="saas-card bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-808 rounded-2xl p-4 shadow-sm space-y-4">
                <div className="pb-3 border-b border-slate-101 dark:border-slate-800">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-900 dark:text-white">Salary distribution bands</h4>
                  <p className="text-[7.5px] text-slate-400 font-bold uppercase mt-0.5">Spread of employee net salary ranges</p>
                </div>
                <div className="h-64">
                  {payrollData?.salaryDistribution && payrollData.salaryDistribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={payrollData.salaryDistribution} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-slate-800" />
                        <XAxis dataKey="band" tick={{ fontSize: 9, fontWeight: 'bold', fill: '#94A3B8' }} />
                        <YAxis tick={{ fontSize: 9, fontWeight: 'bold', fill: '#94A3B8' }} />
                        <Tooltip contentStyle={{ fontSize: 9, fontWeight: 'bold' }} />
                        <Bar dataKey="count" fill="#F59E0B" radius={[4, 4, 0, 0]} name="Employees Count" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-[10px] uppercase font-bold text-slate-400">No salary ranges calculated</div>
                  )}
                </div>
              </div>

              {/* Sub totals */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:col-span-3">
                <div className="saas-card bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-808 rounded-2xl p-4 shadow-sm">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Aggregate Net Payroll</span>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">₹{(payrollData?.summary?.totalPayroll ?? 0).toLocaleString()}</h3>
                  <p className="text-[7.5px] text-slate-400 font-bold uppercase mt-1 leading-relaxed">Sum total of net salaries generated across all historical pay cycles.</p>
                </div>
                <div className="saas-card bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-808 rounded-2xl p-4 shadow-sm">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Incentives / Bonuses Paid</span>
                  <h3 className="text-2xl font-black text-emerald-500 mt-1">₹{(payrollData?.summary?.totalBonuses ?? 0).toLocaleString()}</h3>
                  <p className="text-[7.5px] text-slate-400 font-bold uppercase mt-1 leading-relaxed">Performance bonuses and allowance add-ons distributed.</p>
                </div>
                <div className="saas-card bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-808 rounded-2xl p-4 shadow-sm">
                  <span className="text-[8px] font-black text-slate-455 dark:text-slate-400 uppercase tracking-widest">Deductions (PF+Tax+ESI)</span>
                  <h3 className="text-2xl font-black text-rose-500 mt-1">₹{(payrollData?.summary?.totalDeductions ?? 0).toLocaleString()}</h3>
                  <p className="text-[7.5px] text-slate-400 font-bold uppercase mt-1 leading-relaxed">Provident fund, tax withholdings, ESI contributions, and unpaid leaves.</p>
                </div>
              </div>

            </div>
          )}

          {/* 5. Recruitment Reports Tab */}
          {activeTab === 'recruitment' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Funnel conversion bar chart */}
              <div className="saas-card bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-808 rounded-2xl p-4 shadow-sm lg:col-span-2 space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-900 dark:text-white">Hiring Pipeline Funnel Conversion</h4>
                    <p className="text-[7.5px] text-slate-400 font-bold uppercase mt-0.5">Applicant counts moving across stages</p>
                  </div>
                  <span className="text-[8px] font-black bg-indigo-50 dark:bg-indigo-950/20 text-indigo-650 dark:text-indigo-400 px-2 py-0.5 rounded uppercase tracking-wider">Hiring Pipeline</span>
                </div>
                <div className="h-64">
                  {recruitmentData?.funnel && recruitmentData.funnel.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={recruitmentData.funnel} margin={{ top: 10, right: 5, left: -25, bottom: 0 }} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" className="dark:stroke-slate-800" />
                        <XAxis type="number" tick={{ fontSize: 9, fontWeight: 'bold', fill: '#94A3B8' }} />
                        <YAxis dataKey="stage" type="category" tick={{ fontSize: 9, fontWeight: 'bold', fill: '#94A3B8' }} />
                        <Tooltip contentStyle={{ fontSize: 9, fontWeight: 'bold' }} />
                        <Bar dataKey="count" fill="#8B5CF6" radius={[0, 4, 4, 0]} name="Candidates count">
                          {recruitmentData.funnel.map((entry: any, index: number) => {
                            const colors = ['#2563EB', '#3B82F6', '#8B5CF6', '#EC4899', '#10B981'];
                            return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-[10px] uppercase font-bold text-slate-400">No applicants logged in candidate pool</div>
                  )}
                </div>
              </div>

              {/* Active vacancies & applicant list */}
              <div className="saas-card bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-808 rounded-2xl p-4 shadow-sm flex flex-col justify-between space-y-4">
                <div className="pb-3 border-b border-slate-101 dark:border-slate-800">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-900 dark:text-white">Active Positions & Demand</h4>
                  <p className="text-[7.5px] text-slate-400 font-bold uppercase mt-0.5">Top vacancies and inbound application counts</p>
                </div>
                <div className="overflow-y-auto max-h-60 no-scrollbar space-y-2.5">
                  {recruitmentData?.positions?.map((pos: any, idx: number) => (
                    <div key={idx} className="p-2.5 bg-slate-50 dark:bg-slate-850 rounded-xl flex justify-between items-center border border-slate-100 dark:border-slate-800">
                      <div className="min-w-0">
                        <h4 className="text-[10px] font-black text-slate-850 dark:text-white truncate">{pos.title}</h4>
                        <span className="text-[7.5px] text-slate-400 font-bold uppercase tracking-wider">{pos.dept}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[9.5px] font-black text-blue-600 dark:text-blue-400 block">{pos.applicants} Apps</span>
                        <span className={cn(
                          "px-1 py-0.5 rounded text-[6px] font-black uppercase tracking-wider inline-block mt-0.5",
                          pos.status === 'Active' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-650' : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                        )}>
                          {pos.status}
                        </span>
                      </div>
                    </div>
                  ))}
                  {(!recruitmentData?.positions || recruitmentData.positions.length === 0) && (
                    <div className="text-[9px] uppercase font-bold text-slate-405 text-center py-8">No vacancies logged in database</div>
                  )}
                </div>
                <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3 flex justify-between text-[8px] font-black uppercase text-slate-400">
                  <span>Open Careers: {recruitmentData?.summary?.openPositions ?? 0}</span>
                  <span>Received Applications: {recruitmentData?.summary?.applicationsReceived ?? 0}</span>
                </div>
              </div>

            </div>
          )}

          {/* 6. Performance Reports Tab */}
          {activeTab === 'performance' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Average Ratings by Department */}
              <div className="saas-card bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-808 rounded-2xl p-4 shadow-sm lg:col-span-2 space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-900 dark:text-white">Department Appraisal Score Averages</h4>
                    <p className="text-[7.5px] text-slate-400 font-bold uppercase mt-0.5">Weighted average score out of 5.0</p>
                  </div>
                  <span className="text-[8px] font-black bg-yellow-50 dark:bg-yellow-950/20 text-yellow-600 dark:text-yellow-450 px-2 py-0.5 rounded uppercase tracking-wider">SLA Performance</span>
                </div>
                <div className="h-64">
                  {performanceData?.departmentPerformance && performanceData.departmentPerformance.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={performanceData.departmentPerformance} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-slate-800" />
                        <XAxis dataKey="department" tick={{ fontSize: 9, fontWeight: 'bold', fill: '#94A3B8' }} />
                        <YAxis domain={[0, 5]} tick={{ fontSize: 9, fontWeight: 'bold', fill: '#94A3B8' }} />
                        <Tooltip contentStyle={{ fontSize: 9, fontWeight: 'bold' }} />
                        <Bar dataKey="average" fill="#F59E0B" radius={[4, 4, 0, 0]} name="Avg Rating Rating">
                          {performanceData.departmentPerformance.map((entry: any, index: number) => {
                            const colors = ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#F43F5E'];
                            return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-[10px] uppercase font-bold text-slate-400">No appraisal department metrics stored</div>
                  )}
                </div>
              </div>

              {/* Rating distribution bands */}
              <div className="saas-card bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-808 rounded-2xl p-4 shadow-sm space-y-4">
                <div className="pb-3 border-b border-slate-101 dark:border-slate-800">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-900 dark:text-white">Talent rating distribution bands</h4>
                  <p className="text-[7.5px] text-slate-400 font-bold uppercase mt-0.5">Headcounts spread in performance curves</p>
                </div>
                <div className="h-64">
                  {performanceData?.ratingDistribution && performanceData.ratingDistribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={performanceData.ratingDistribution} margin={{ top: 10, right: 5, left: -25, bottom: 0 }} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" className="dark:stroke-slate-800" />
                        <XAxis type="number" tick={{ fontSize: 9, fontWeight: 'bold', fill: '#94A3B8' }} />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 8, fontWeight: 'bold', fill: '#94A3B8' }} width={120} />
                        <Tooltip contentStyle={{ fontSize: 9, fontWeight: 'bold' }} />
                        <Bar dataKey="count" fill="#2563EB" radius={[0, 4, 4, 0]} name="Employees Count" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-[10px] uppercase font-bold text-slate-400">No talent distributions logged</div>
                  )}
                </div>
              </div>

              {/* Top performers directory list */}
              <div className="saas-card bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-808 rounded-2xl p-4 shadow-sm lg:col-span-3 space-y-4">
                <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-900 dark:text-white">Talent Hall of Fame: Outstanding Performers</h4>
                  <p className="text-[7.5px] text-slate-400 font-bold uppercase mt-0.5">Top-rated active team members (Rating &gt;= 4.5)</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-850 text-[8px] uppercase text-slate-405 font-black">
                        <th className="py-2 text-left">Staff Member</th>
                        <th className="py-2 text-left">Department</th>
                        <th className="py-2 text-left">Appraisal Score</th>
                        <th className="py-2 text-right">Fulfillment status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-850/50">
                      {performanceData?.topPerformers?.map((p: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20">
                          <td className="py-3 font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-yellow-500/10 text-yellow-550 flex items-center justify-center">
                              <Award className="w-3.5 h-3.5" />
                            </div>
                            {p.name}
                          </td>
                          <td className="py-3 text-slate-500 font-semibold uppercase text-[10px]">{p.department}</td>
                          <td className="py-3">
                            <span className="font-mono font-black text-amber-500">★ {Number(p.rating).toFixed(1)}</span>
                          </td>
                          <td className="py-3 text-right">
                            <span className="px-2 py-0.5 bg-yellow-50 dark:bg-yellow-950/20 text-yellow-600 rounded-[6px] text-[7.5px] font-black uppercase tracking-wider inline-block">
                              {p.status || 'Top Performer'}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {(!performanceData?.topPerformers || performanceData.topPerformers.length === 0) && (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-slate-400 font-bold text-[9px] uppercase">No outstanding appraisals recorded in current review cycles</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

        </div>
      )}

      {/* Setup Email schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-[200] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-7 max-w-lg w-full border border-slate-150/40 dark:border-slate-808 shadow-2xl space-y-6 relative overflow-hidden text-left">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex justify-between items-center pb-3.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 rounded-xl border border-blue-100/10">
                  <Mail className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">Scheduled Report Digest</h3>
                  <p className="text-[8px] text-slate-400 font-bold uppercase mt-0.5">Configure automated recurring email delivery</p>
                </div>
              </div>
              <button 
                onClick={() => setShowScheduleModal(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer transition-colors"
              >
                <X className="w-4.5 h-4.5 text-slate-400" />
              </button>
            </div>
            
            <form onSubmit={handleAddSchedule} className="space-y-4">
              <div>
                <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Recipient email address</label>
                <input 
                  type="email" 
                  required
                  placeholder="e.g. executives@company.com" 
                  value={scheduleForm.email}
                  onChange={(e) => setScheduleForm({...scheduleForm, email: e.target.value})}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-808 rounded-xl font-semibold outline-none focus:bg-white text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Analytical scope</label>
                  <select 
                    value={scheduleForm.reportType}
                    onChange={(e) => setScheduleForm({...scheduleForm, reportType: e.target.value})}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-808 rounded-xl font-semibold outline-none text-xs cursor-pointer"
                  >
                    <option value="all">Full Enterprise Report Digest</option>
                    <option value="workforce">Workforce analytics only</option>
                    <option value="attendance">Daily Presence logs only</option>
                    <option value="leaves">Leave approvals count</option>
                    <option value="payroll">Payroll costs ledger</option>
                    <option value="recruitment">Recruitment and Funnels</option>
                    <option value="performance">Talent Appraisals directory</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Delivery Frequency</label>
                  <select 
                    value={scheduleForm.frequency}
                    onChange={(e) => setScheduleForm({...scheduleForm, frequency: e.target.value})}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-808 rounded-xl font-semibold outline-none text-xs cursor-pointer"
                  >
                    <option>Daily</option>
                    <option>Weekly</option>
                    <option>Monthly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Execution hour time (24h format)</label>
                  <input 
                    type="time" 
                    required
                    value={scheduleForm.time}
                    onChange={(e) => setScheduleForm({...scheduleForm, time: e.target.value})}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-808 rounded-xl font-semibold outline-none text-xs cursor-pointer"
                  />
                </div>
                <div className="flex items-end">
                  <button 
                    type="submit"
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer shadow-lg shadow-blue-500/10 active:scale-95 transition-all"
                  >
                    Schedule Delivery
                  </button>
                </div>
              </div>
            </form>

            {/* Active schedules ledger */}
            <div className="border-t border-slate-100 dark:border-slate-800/85 pt-4">
              <h4 className="text-[9px] font-black uppercase tracking-wider text-slate-900 dark:text-white mb-2">Active digest schedules</h4>
              <div className="max-h-32 overflow-y-auto no-scrollbar space-y-2">
                {activeSchedules.map((sch) => (
                  <div key={sch.id} className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-center text-[9px] font-bold text-slate-700 dark:text-slate-300">
                    <div className="min-w-0">
                      <span className="text-slate-900 dark:text-white truncate block">{sch.email}</span>
                      <span className="text-[7.5px] text-slate-450 font-bold uppercase tracking-wider">
                        Scope: {sch.reportType.toUpperCase()} | Every {sch.frequency} at {sch.time}
                      </span>
                    </div>
                    <button 
                      onClick={() => handleRemoveSchedule(sch.id)}
                      className="p-1 hover:bg-slate-105 dark:hover:bg-slate-800 rounded text-rose-500 cursor-pointer transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {activeSchedules.length === 0 && (
                  <div className="text-[8px] uppercase font-bold text-slate-400 py-3 text-center">No automated reports configured</div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-750 dark:text-white rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer transition-all active:scale-95 border border-slate-200/40"
              >
                Close Configuration
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
