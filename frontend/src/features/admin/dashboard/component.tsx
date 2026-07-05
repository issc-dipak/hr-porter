"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Users, Clock, FileText, DollarSign, TrendingUp, Calendar, 
  Loader2, Sparkles, Briefcase, Search, Filter, CheckCircle2, 
  XCircle, ArrowUpRight, ArrowDownRight, AlertTriangle, Gift, 
  Award, ChevronRight, ChevronDown, RefreshCcw, Mail, MapPin, FileDown, 
  MessageSquare, ShieldCheck, UserCheck, AlertCircle, HelpCircle,
  FileSpreadsheet, Lock, UserMinus, ShieldAlert, Plus, HelpCircle as HelpIcon,
  BookOpen, Network, CheckSquare, Trash2, Laptop, Settings, Building2,
  ArrowLeftRight, UserCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PastelStatCard } from '@/components/ui/PastelStatCard';
import { cn } from "@/lib/utils";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

// Modular admin sub-components
import { StatCard } from './components/StatCard';
import HrAdminAiAssistant from './components/HrAdminAiAssistant';
import { NotificationBellDropdown } from './components/NotificationBellDropdown';
import { EmailLogModal } from './components/EmailLogModal';

import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';

export default function DashboardPage({ 
  role = 'HR',
  setCurrentPage,
  onSwitchToEmployee,
  onOpenSearch
}: { 
  role?: string;
  setCurrentPage?: (page: string) => void;
  onSwitchToEmployee?: () => void;
  onOpenSearch?: () => void;
}) {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [liveDateTime, setLiveDateTime] = useState('');
  const setToastMsg = (msg: string | null) => {
    if (msg) {
      useUIStore.getState().triggerToast(msg);
    }
  };
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [branches, setBranches] = useState<any[]>([]);
  const { selectedBranchId, selectedBranch, setSelectedBranch } = useUIStore();
  const { profile, userRole } = useAuthStore();

  const isBranchLocked = userRole === 'HR' && !!profile?.branchId;

  // Active Sub-Tab Workspace
  const [activeSubTab, setActiveSubTab] = useState<string>('overview');
  const [orgTreeData, setOrgTreeData] = useState<any[]>([]);
  const [loadingTree, setLoadingTree] = useState(false);

  // Export center state
  const [selectedExportType, setSelectedExportType] = useState<'workforce' | 'attendance' | 'leaves' | 'payroll'>('workforce');
  const [selectedExportFormat, setSelectedExportFormat] = useState<'pdf' | 'excel' | 'csv'>('csv');
  const [isExporting, setIsExporting] = useState(false);
  const [isTypeMenuOpen, setIsTypeMenuOpen] = useState(false);
  const [isFormatMenuOpen, setIsFormatMenuOpen] = useState(false);
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
  const typeMenuRef = useRef<HTMLDivElement>(null);
  const formatMenuRef = useRef<HTMLDivElement>(null);
  const branchDropdownRef = useRef<HTMLDivElement>(null);

  // Search & Filter States
  const [auditSearchQuery, setAuditSearchQuery] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('All');
  
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [announcementCategory, setAnnouncementCategory] = useState('General');
  const [isPostingAnnouncement, setIsPostingAnnouncement] = useState(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (typeMenuRef.current && !typeMenuRef.current.contains(event.target as Node)) {
        setIsTypeMenuOpen(false);
      }
      if (formatMenuRef.current && !formatMenuRef.current.contains(event.target as Node)) {
        setIsFormatMenuOpen(false);
      }
      if (branchDropdownRef.current && !branchDropdownRef.current.contains(event.target as Node)) {
        setIsBranchDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Action Center tabs state
  const [actionTab, setActionTab] = useState<'leaves' | 'corrections' | 'documents' | 'onboarding' | 'escalations'>('leaves');

  // DSR Filters state
  const [dsrSearchQuery, setDsrSearchQuery] = useState('');
  const [dsrDeptFilter, setDsrDeptFilter] = useState('All');
  const [dsrDateFilter, setDsrDateFilter] = useState('');

  // Attendance Trend chart timeframe
  const [attendanceTimeframe, setAttendanceTimeframe] = useState<'Week' | 'Month' | 'Year'>('Month');

  // Local data fetching for precise attendance trends calculation
  const [employeesList, setEmployeesList] = useState<any[]>([]);
  const [attendanceList, setAttendanceList] = useState<any[]>([]);

  // Format date and clock
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

  // Fetch command center data from consolidated backend endpoint
  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const isAdmin = role === 'Admin' || role === 'Company Admin';
      const endpoint = isAdmin ? '/api/admin/dashboard' : '/api/hr/dashboard';
      const url = new URL(window.location.origin + endpoint);
      url.searchParams.append('t', String(Date.now()));
      if (selectedBranchId) {
        url.searchParams.append('branchId', selectedBranchId);
      }

      const res = await fetch(url.toString(), { headers });
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
      }
    } catch (e) {
      console.error("Failed to fetch dashboard data:", e);
    } finally {
      setLoadingDashboard(false);
    }
  };

  // Fetch local historical data for chart trend calculations
  const fetchHistoricalData = async () => {
    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      let empUrl = `/api/employees?t=${Date.now()}`;
      let attUrl = `/api/attendance?t=${Date.now()}`;
      if (selectedBranchId) {
        empUrl += `&branchId=${selectedBranchId}`;
        attUrl += `&branchId=${selectedBranchId}`;
      }

      // Fetch employee directory and attendance history in parallel to prevent request waterfalls
      const [empRes, attRes] = await Promise.all([
        fetch(empUrl, { headers }),
        fetch(attUrl, { headers })
      ]);

      if (empRes.ok) {
        const empData = await empRes.json();
        if (Array.isArray(empData)) {
          setEmployeesList(empData);
        }
      }

      if (attRes.ok) {
        const attData = await attRes.json();
        if (Array.isArray(attData)) {
          setAttendanceList(attData);
        }
      }
    } catch (e) {
      console.error("Failed to fetch historical attendance data:", e);
    }
  };

  // Fetch office branches registry list
  useEffect(() => {
    const token = localStorage.getItem('hr_system_token');
    if (token) {
      fetch('/api/branches', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setBranches(data);
        }
      })
      .catch(err => console.error("Failed to load branches for dashboard filter:", err));
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    fetchHistoricalData();

    const interval = setInterval(() => {
      fetchDashboardData();
      fetchHistoricalData();
    }, 30000);
    return () => clearInterval(interval);
  }, [role, selectedBranchId]);

  useEffect(() => {
    if (activeSubTab === 'workforce') {
      const fetchOrgTree = async () => {
        setLoadingTree(true);
        try {
          const token = localStorage.getItem('hr_system_token');
          const res = await fetch(`/api/organization-chart/tree?t=${Date.now()}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setOrgTreeData(data);
          }
        } catch (err) {
          console.error("Failed to fetch Org Chart tree:", err);
        } finally {
          setLoadingTree(false);
        }
      };
      fetchOrgTree();
    }
  }, [activeSubTab]);

  // Handle Copilot Command state routing
  const handleCopilotCommand = (cmd: string) => {
    const query = cmd.toLowerCase();
    if (query.includes('attendance')) {
      setActiveSubTab('overview');
    } else if (query.includes('payroll')) {
      setActiveSubTab('payroll');
    } else if (query.includes('inactive') || query.includes('performance') || query.includes('summary')) {
      setActiveSubTab('workforce');
    } else if (query.includes('approvals')) {
      setActiveSubTab('overview');
      setActionTab('leaves');
    } else if (query.includes('hiring') || query.includes('recruit')) {
      setActiveSubTab('recruitment');
    } else if (query.includes('growth')) {
      setActiveSubTab('overview');
    }
  };

  const handleHrAction = async (type: 'leave' | 'ticket' | 'document' | 'correction' | 'onboarding', id: string, action: 'approve' | 'reject') => {
    setToastMsg(`Processing ${action} action...`);
    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;



      const res = await fetch('/api/hr/action', {
        method: 'POST',
        headers,
        body: JSON.stringify({ type, id, action })
      });
      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          setToastMsg(`Successfully ${action === 'approve' ? 'approved' : 'rejected'} ${type}!`);
          fetchDashboardData();
        } else {
          setToastMsg(`Action failed: ${result.error || 'Unknown error'}`);
        }
      } else {
        setToastMsg('Failed to communicate with HR backend service.');
      }
    } catch (e) {
      console.error("Error triggering HR action:", e);
      setToastMsg('Network error while processing HR action.');
    } finally {
      setTimeout(() => setToastMsg(null), 3000);
    }
  };

  // Handle post announcement
  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementTitle.trim() || !announcementContent.trim()) return;

    setIsPostingAnnouncement(true);
    setToastMsg('Publishing announcement...');

    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: announcementTitle,
          content: announcementContent,
          category: announcementCategory,
          postedBy: role === 'HR' ? 'HR Manager' : 'Admin'
        })
      });

      if (res.ok) {
        setToastMsg('Announcement published successfully!');
        setAnnouncementTitle('');
        setAnnouncementContent('');
        fetchDashboardData();
      } else {
        setToastMsg('Failed to post announcement.');
      }
    } catch (err) {
      console.error(err);
      setToastMsg('Error connecting to announcements service.');
    } finally {
      setIsPostingAnnouncement(false);
      setTimeout(() => setToastMsg(null), 3000);
    }
  };

  // Export Report Handler (supports PDF, CSV, Excel)
  const handleExportReport = async () => {
    setIsExporting(true);
    setToastMsg(`Exporting ${selectedExportType} report as ${selectedExportFormat.toUpperCase()}...`);
    
    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      if (selectedExportFormat === 'pdf') {
        let url = `/api/reports/export/pdf?type=${selectedExportType}`;
        if (selectedBranchId) url += `&branchId=${selectedBranchId}`;
        const res = await fetch(url, { headers });
        if (!res.ok) throw new Error('Failed to export PDF');
        const html = await res.text();
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
        }
        setToastMsg('Report generated and opened for printing.');
      } else {
        const formatPath = selectedExportFormat === 'excel' ? 'excel' : 'csv';
        let url = `/api/reports/export/${formatPath}?type=${selectedExportType}`;
        if (selectedBranchId) url += `&branchId=${selectedBranchId}`;
        const res = await fetch(url, { headers });
        if (!res.ok) throw new Error(`Failed to export ${selectedExportFormat.toUpperCase()}`);
        
        const blob = await res.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        
        const ext = selectedExportFormat === 'excel' ? 'xls' : 'csv';
        a.download = `${selectedExportType}_report_${new Date().toISOString().split('T')[0]}.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
        setToastMsg('Report downloaded successfully!');
      }
      setTimeout(() => setToastMsg(null), 3000);
    } catch (err: any) {
      console.error(err);
      setToastMsg(`Export failed: ${err.message}`);
      setTimeout(() => setToastMsg(null), 3000);
    } finally {
      setIsExporting(false);
    }
  };

  // Helper calculations for local trends
  const getWeeklyAttendance = (attendance: any[], totalEmps: number) => {
    const counts = [0, 0, 0, 0, 0, 0, 0];
    if (!attendance || attendance.length === 0) return counts;
    const today = new Date();
    const currentDay = today.getDay();
    const distanceToMon = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(today);
    monday.setDate(today.getDate() + distanceToMon);
    monday.setHours(0,0,0,0);

    const daysOfWeek = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d.toDateString();
    });

    attendance.forEach((att: any) => {
      const date = att.date || att.createdAt;
      if (!date) return;
      const attDateStr = new Date(date).toDateString();
      const dayIdx = daysOfWeek.indexOf(attDateStr);
      if (dayIdx !== -1) {
        counts[dayIdx]++;
      }
    });

    const denominator = Math.max(1, totalEmps);
    return counts.map(c => Math.min(100, Math.round((c / denominator) * 100)));
  };

  const getMonthlyAttendance = (attendance: any[], totalEmps: number) => {
    const counts = Array(12).fill(0);
    if (!attendance || attendance.length === 0) return counts;
    const currentYear = new Date().getFullYear();
    const monthDateMaps: Record<number, Set<string>> = {};
    for (let m = 0; m < 12; m++) {
      monthDateMaps[m] = new Set();
    }

    attendance.forEach((att: any) => {
      const date = att.date || att.createdAt;
      if (!date) return;
      const d = new Date(date);
      if (d.getFullYear() === currentYear) {
        const month = d.getMonth();
        counts[month]++;
        monthDateMaps[month].add(d.toDateString());
      }
    });

    const denominator = Math.max(1, totalEmps);
    return counts.map((c, m) => {
      const uniqueDays = monthDateMaps[m].size || 1;
      const avgPresent = c / uniqueDays;
      return Math.min(100, Math.round((avgPresent / denominator) * 100));
    });
  };

  const getYearlyQuarterlyAttendance = (attendance: any[], totalEmps: number) => {
    const counts = Array(12).fill(0);
    if (!attendance || attendance.length === 0) return counts;
    const quarterMaps: Record<number, Set<string>> = {};
    for (let i = 0; i < 12; i++) quarterMaps[i] = new Set();

    const today = new Date();
    const currentYear = today.getFullYear();

    attendance.forEach((att: any) => {
      const date = att.date || att.createdAt;
      if (!date) return;
      const d = new Date(date);
      const diffYears = currentYear - d.getFullYear();
      if (diffYears >= 0 && diffYears < 3) {
        const q = Math.floor(d.getMonth() / 3);
        const index = 11 - ((2 - diffYears) * 4 + (3 - q));
        if (index >= 0 && index < 12) {
          counts[index]++;
          quarterMaps[index].add(d.toDateString());
        }
      }
    });

    const denominator = Math.max(1, totalEmps);
    return counts.map((c, idx) => {
      const uniqueDays = quarterMaps[idx].size || 1;
      const avgPresent = c / uniqueDays;
      return Math.min(100, Math.round((avgPresent / denominator) * 100));
    });
  };

  const chartData = useMemo(() => {
    const totalEmps = employeesList.length || 10;
    return {
      'Week': getWeeklyAttendance(attendanceList, totalEmps),
      'Month': getMonthlyAttendance(attendanceList, totalEmps),
      'Year': getYearlyQuarterlyAttendance(attendanceList, totalEmps)
    };
  }, [attendanceList, employeesList]);

  // Compute DSR filtered updates
  const filteredDsrUpdates = useMemo(() => {
    let list = dashboardData?.dsr?.updates || [];
    if (dsrSearchQuery) {
      list = list.filter((u: any) => u.name?.toLowerCase().includes(dsrSearchQuery.toLowerCase()));
    }
    if (dsrDeptFilter && dsrDeptFilter !== 'All') {
      list = list.filter((u: any) => u.dept?.toLowerCase() === dsrDeptFilter.toLowerCase());
    }
    if (dsrDateFilter) {
      list = list.filter((u: any) => {
        if (!u.date) return false;
        const itemDate = new Date(u.date).toISOString().split('T')[0];
        return itemDate === dsrDateFilter;
      });
    }
    return list;
  }, [dashboardData, dsrSearchQuery, dsrDeptFilter, dsrDateFilter]);

  // Filter Audit Logs
  const filteredAuditLogs = useMemo(() => {
    let list = dashboardData?.auditLogs || [];
    if (auditSearchQuery) {
      list = list.filter((log: any) => 
        log.user?.toLowerCase().includes(auditSearchQuery.toLowerCase()) || 
        log.details?.toLowerCase().includes(auditSearchQuery.toLowerCase())
      );
    }
    if (auditActionFilter && auditActionFilter !== 'All') {
      list = list.filter((log: any) => log.action?.toLowerCase().includes(auditActionFilter.toLowerCase()));
    }
    return list;
  }, [dashboardData, auditSearchQuery, auditActionFilter]);

  // Recursive renderer for Org Chart node
  const renderTreeNode = (node: any) => {
    return (
      <div key={node._id} className="pl-3.5 border-l border-slate-200 dark:border-slate-800 space-y-1.5 mt-2">
        <div className="p-2 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-xl flex items-center gap-2 shadow-sm max-w-[280px]">
          {node.profilePicture ? (
            <img src={node.profilePicture} className="w-5.5 h-5.5 rounded-full object-cover shrink-0" />
          ) : (
            <div className="w-5.5 h-5.5 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center text-[8.5px] font-black shrink-0 uppercase">
              {node.fullName.charAt(0)}
            </div>
          )}
          <div className="min-w-0">
            <span className="text-[9px] font-black text-slate-800 dark:text-white block leading-none truncate">{node.fullName}</span>
            <span className="text-[7px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5 truncate">{node.designation}</span>
          </div>
        </div>
        {node.children && node.children.length > 0 && (
          <div className="space-y-1.5">
            {node.children.map((child: any) => renderTreeNode(child))}
          </div>
        )}
      </div>
    );
  };

  const isAdmin = role === 'Admin' || role === 'Company Admin';
  const kpis = dashboardData?.kpis || {};
  const health = dashboardData?.companyHealth || {};
  const company = dashboardData?.companyDetails || dashboardData?.subscription || {};

  // Define tabs dynamically based on role
  const subTabs = isAdmin ? [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'workforce', label: 'Workforce Analytics', icon: Users },
    { id: 'payroll', label: 'Payroll & Cost', icon: DollarSign },
    { id: 'recruitment', label: 'Recruitment Analytics', icon: Briefcase },
    { id: 'security', label: 'Security & Audits', icon: ShieldCheck },
    { id: 'system', label: 'System Admin & Storage', icon: Settings }
  ] : [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'attendance', label: 'Attendance Hub', icon: Clock },
    { id: 'leave', label: 'Leave Center', icon: FileText },
    { id: 'recruitment', label: 'Recruitment Pipeline', icon: Briefcase },
    { id: 'lifecycle', label: 'Lifecycle & Onboarding', icon: UserCheck },
    { id: 'support', label: 'Employee Support', icon: HelpCircle },
    { id: 'engagement', label: 'Engagement', icon: Award }
  ];

  // Validate activeTab for current role
  useEffect(() => {
    const isValidTab = subTabs.some(tab => tab.id === activeSubTab);
    if (!isValidTab) {
      setActiveSubTab('overview');
    }
  }, [subTabs, activeSubTab]);

  if (loadingDashboard && !dashboardData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-4" />
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">Initializing Control Center...</h3>
      </div>
    );
  }

  // Handle Admin governance actions
  const handleAdminAction = async (actionType: string, targetId?: string, data?: any) => {
    setToastMsg(`Running admin action: ${actionType}...`);
    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/admin/action', {
        method: 'POST',
        headers,
        body: JSON.stringify({ actionType, targetId, data })
      });
      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          setToastMsg(`Admin action ${actionType} completed successfully!`);
          fetchDashboardData();
        } else {
          setToastMsg(`Action failed: ${result.error || 'Unknown error'}`);
        }
      } else {
        setToastMsg('Failed to communicate with Admin backend service.');
      }
    } catch (e) {
      console.error("Error triggering admin action:", e);
      setToastMsg('Network error while processing admin action.');
    } finally {
      setTimeout(() => setToastMsg(null), 3000);
    }
  };

  // Premium Executive Command Center - renderAdminDashboard
  const renderAdminDashboard = () => {
    const kpis = dashboardData?.kpis || {};
    const health = dashboardData?.companyHealth || {};
    const security = dashboardData?.security || {};
    const subscription = dashboardData?.subscription || {};
    const system = dashboardData?.systemHealth || {};
    const activityFeed = dashboardData?.activityFeed || [];
    const auditLogsSummary = dashboardData?.auditLogsSummary || [];
    const roleSummary = dashboardData?.roleSummary || {};

    const storagePercent = (() => {
      const usageStr = subscription.storageUsage || '0 GB / 10 GB';
      const parsed = parseFloat(usageStr.split(' ')[0]) || 0;
      return Math.min(100, Math.max(0.5, (parsed / 10) * 100));
    })();

    const filteredAudit = auditLogsSummary.filter((log: any) => {
      const query = auditSearchQuery.toLowerCase();
      const matchQuery = !query || 
        log.user?.toLowerCase().includes(query) || 
        log.action?.toLowerCase().includes(query) ||
        log.details?.toLowerCase().includes(query);
      const filter = auditActionFilter;
      const matchFilter = filter === 'All' || 
        (filter === 'Employee' && log.action?.includes('EMPLOYEE')) ||
        (filter === 'Payroll' && log.action?.includes('PAYROLL')) ||
        (filter === 'Leave' && log.action?.includes('LEAVE')) ||
        (filter === 'Recruitment' && log.action?.includes('JOB')) ||
        (filter === 'Login' && log.action?.includes('LOGIN'));
      return matchQuery && matchFilter;
    });

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSubTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          className="space-y-5"
        >
          {activeSubTab === 'overview' && (
            <div className="space-y-5">

              {/* ══════════════════════════════════════════════
                  EXECUTIVE KPI STRIP
              ══════════════════════════════════════════════ */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-[13px] font-bold text-slate-900 dark:text-white tracking-tight">Executive Overview</h2>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Live company-wide metrics · refreshes every 30s</p>
                  </div>
                  <button
                    onClick={fetchDashboardData}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white border border-slate-200 dark:border-slate-700 rounded-lg transition-all cursor-pointer bg-transparent"
                  >
                    <RefreshCcw className="w-3 h-3" />
                    Refresh
                  </button>
                </div>

                {/* Primary KPI Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
                  <StatCard icon={Users} label="Total Employees" value={kpis.totalEmployees || 0}
                    trend={`+${health.employeeGrowth || 0}% this month`} trendType="up" color="bg-blue-500"
                    sparkline={[40,45,48,52,49,55,58,kpis.totalEmployees||60]} onRefresh={fetchDashboardData}
                  />
                  <StatCard icon={UserCheck} label="Active Today"
                    value={Math.round((kpis.totalEmployees||0) * Math.max(0.1, (health.attendance||0)/100)) || 0}
                    trend={`${health.attendance||0}% attendance rate`} trendType="up" color="bg-emerald-500"
                    sparkline={[60,68,72,65,80,75,82,health.attendance||75]} onRefresh={fetchDashboardData}
                  />
                  <StatCard icon={Network} label="Departments" value={kpis.activeDepartments || 0}
                    trend="Active operational units" trendType="neutral" color="bg-indigo-500"
                    onRefresh={fetchDashboardData}
                  />
                  <StatCard icon={DollarSign} label="Monthly Payroll"
                    value={kpis.monthlyPayroll >= 100000
                      ? `₹${(kpis.monthlyPayroll/100000).toFixed(1)}L`
                      : `₹${(kpis.monthlyPayroll||0).toLocaleString('en-IN')}`}
                    trend="Total salary disbursement" trendType="up" color="bg-purple-500"
                    sparkline={[30,35,32,38,40,36,42,50]} onRefresh={fetchDashboardData}
                  />
                  <StatCard icon={Briefcase} label="Open Roles" value={kpis.openRecruitments || 0}
                    trend={`+${health.hiringGrowth||0}% vs last month`} trendType="up" color="bg-orange-500"
                    onRefresh={fetchDashboardData}
                  />
                </div>

                {/* Secondary KPI row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                  {[
                    { icon: Award, label: 'Health Score', value: `${health.orgHealthScore||92}%`, sub: 'Composite wellness index', accent: '#10B981' },
                    { icon: HelpCircle, label: 'Open Tickets', value: kpis.openTickets||0, sub: 'Unresolved helpdesk items', accent: '#F43F5E' },
                    { icon: ShieldCheck, label: 'Retention Rate', value: `${health.retentionRate||0}%`, sub: 'Company-wide retention', accent: '#6366F1' },
                    { icon: UserCheck, label: 'HR Managers', value: kpis.totalHrManagers||0, sub: 'Active HR operators', accent: '#8B5CF6' },
                  ].map((kpi, i) => {
                    const KpiIcon = kpi.icon;
                    return (
                      <motion.div key={i}
                        whileHover={{ y: -2, boxShadow: '0 12px 30px rgba(0,0,0,0.07)' }}
                        transition={{ duration: 0.16 }}
                        className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl px-4 py-3.5 flex items-center gap-3 shadow-[0_2px_12px_-3px_rgba(0,0,0,0.04)]"
                      >
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: kpi.accent + '14' }}>
                          <KpiIcon className="w-4 h-4" style={{ color: kpi.accent }} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[18px] font-black text-slate-900 dark:text-white leading-none">{kpi.value}</div>
                          <div className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 mt-0.5">{kpi.label}</div>
                          <div className="text-[9px] text-slate-400 mt-0.5 truncate">{kpi.sub}</div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* ══════════════════════════════════════════════
                  MAIN WORKSPACE: 9-col center + 3-col sidebar
              ══════════════════════════════════════════════ */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">

                {/* ═════ CENTER WORKSPACE (9 cols) ═════ */}
                <div className="xl:col-span-9 space-y-4">

                  {/* Row 1: Company Health + Workforce Lifecycle */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                    {/* Company Health Score */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-2xl p-5 shadow-[0_2px_12px_-3px_rgba(0,0,0,0.04)]">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: '#10B98114', border: '1px solid #10B98122' }}>
                            <Award className="w-3.5 h-3.5 text-emerald-500" />
                          </div>
                          <div>
                            <h3 className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wide">Company Health</h3>
                            <p className="text-[10px] text-slate-400 mt-0.5">Composite organizational wellness</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-black text-slate-900 dark:text-white">{health.orgHealthScore||92}<span className="text-xs font-semibold text-slate-400 ml-0.5">%</span></div>
                          <div className="text-[9px] text-emerald-500 font-bold uppercase tracking-wide">Healthy</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mb-4">
                        <div className="relative w-16 h-16 flex-shrink-0">
                          <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
                            <circle cx="32" cy="32" r="26" fill="none" strokeWidth="5" className="stroke-slate-100 dark:stroke-slate-800" />
                            <circle cx="32" cy="32" r="26" fill="none" strokeWidth="5"
                              stroke="#10B981" strokeLinecap="round"
                              strokeDasharray={163.36}
                              strokeDashoffset={163.36 - (163.36 * (health.orgHealthScore||92)) / 100}
                              className="transition-all duration-1000"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-[10px] font-black text-slate-900 dark:text-white">{health.orgHealthScore||92}%</span>
                          </div>
                        </div>
                        <div className="flex-1 grid grid-cols-3 gap-x-2 gap-y-1">
                          {[
                            { label: 'Attendance', value: `${health.attendance||0}%` },
                            { label: 'Performance', value: `${health.performance||0}%` },
                            { label: 'Retention', value: `${health.retentionRate||0}%`, positive: true },
                            { label: 'Growth', value: `+${health.employeeGrowth||0}%`, positive: true },
                            { label: 'Leave', value: `${health.leave||0}%` },
                            { label: 'Attrition', value: `${health.attritionRate||0}%`, negative: true },
                          ].map((m, i) => (
                            <div key={i} className="text-center py-0.5">
                              <div className={cn("text-[12px] font-black leading-none",
                                m.positive ? 'text-emerald-500' : m.negative ? 'text-rose-500' : 'text-slate-900 dark:text-white'
                              )}>{m.value}</div>
                              <div className="text-[8px] text-slate-400 font-medium uppercase tracking-wide mt-0.5">{m.label}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        {[
                          { label: 'Attendance Rate', value: health.attendance||0, color: '#6366F1' },
                          { label: 'Retention Rate', value: health.retentionRate||0, color: '#10B981' },
                          { label: 'Performance Score', value: health.performance||0, color: '#3B82F6' },
                        ].map((bar, i) => (
                          <div key={i} className="flex items-center gap-2.5">
                            <div className="text-[9px] font-medium text-slate-400 w-24 flex-shrink-0">{bar.label}</div>
                            <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${bar.value}%` }}
                                transition={{ duration: 0.8, delay: i * 0.1 }}
                                className="h-full rounded-full"
                                style={{ backgroundColor: bar.color, opacity: 0.75 }}
                              />
                            </div>
                            <div className="text-[9px] font-bold text-slate-600 dark:text-slate-300 w-8 text-right">{bar.value}%</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Workforce Lifecycle */}
                    {dashboardData?.lifecycle ? (
                      <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-2xl p-5 shadow-[0_2px_12px_-3px_rgba(0,0,0,0.04)]">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-xl flex items-center justify-center"
                              style={{ backgroundColor: '#3B82F614', border: '1px solid #3B82F622' }}>
                              <Users className="w-3.5 h-3.5 text-blue-500" />
                            </div>
                            <div>
                              <h3 className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wide">Workforce Lifecycle</h3>
                              <p className="text-[10px] text-slate-400 mt-0.5">Employee status distribution</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-black text-slate-900 dark:text-white">
                              {(dashboardData.lifecycle.activeCount||0)+(dashboardData.lifecycle.suspendedCount||0)+(dashboardData.lifecycle.resignedCount||0)+(dashboardData.lifecycle.terminatedCount||0)}
                            </div>
                            <div className="text-[8px] text-slate-400 uppercase tracking-wide font-semibold">Total</div>
                          </div>
                        </div>

                        <div className="space-y-2.5">
                          {(() => {
                            const total = Math.max(1,
                              (dashboardData.lifecycle.activeCount||0)+(dashboardData.lifecycle.suspendedCount||0)+
                              (dashboardData.lifecycle.resignedCount||0)+(dashboardData.lifecycle.terminatedCount||0)+
                              (dashboardData.lifecycle.archivedCount||0)
                            );
                            return [
                              { label: 'Active', value: dashboardData.lifecycle.activeCount||0, accent: '#10B981' },
                              { label: 'Suspended', value: dashboardData.lifecycle.suspendedCount||0, accent: '#F59E0B' },
                              { label: 'Resigned', value: dashboardData.lifecycle.resignedCount||0, accent: '#8B5CF6' },
                              { label: 'Terminated', value: dashboardData.lifecycle.terminatedCount||0, accent: '#F43F5E' },
                              { label: 'Archived', value: dashboardData.lifecycle.archivedCount||0, accent: '#64748B' },
                            ].map((item, i) => {
                              const pct = Math.round((item.value/total)*100);
                              return (
                                <div key={i} className="flex items-center gap-2.5">
                                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.accent }} />
                                  <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 w-16">{item.label}</div>
                                  <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${pct}%` }}
                                      transition={{ duration: 0.7, delay: i * 0.08 }}
                                      className="h-full rounded-full"
                                      style={{ backgroundColor: item.accent, opacity: 0.65 }}
                                    />
                                  </div>
                                  <div className="text-[10px] font-black text-slate-700 dark:text-slate-200 w-6 text-right">{item.value}</div>
                                </div>
                              );
                            });
                          })()}
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2">
                          {[
                            { label: 'Pending Exits', value: dashboardData.lifecycle.pendingExits||0, accent: '#3B82F6' },
                            { label: 'Resignations', value: dashboardData.lifecycle.pendingResignations||0, accent: '#8B5CF6' },
                            { label: 'On Leave Today', value: dashboardData.lifecycle.statusOverview?.['On Leave']||0, accent: '#F59E0B' },
                          ].map((card, i) => (
                            <div key={i} className="text-center">
                              <div className="text-lg font-black" style={{ color: card.accent }}>{card.value}</div>
                              <div className="text-[8px] text-slate-400 font-medium uppercase tracking-wide mt-0.5 leading-tight">{card.label}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-2xl p-5 flex items-center justify-center">
                        <div className="text-center text-slate-400">
                          <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                          <p className="text-[10px] font-semibold uppercase tracking-wide">Loading lifecycle data...</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Attendance Trend Chart */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-2xl p-5 shadow-[0_2px_12px_-3px_rgba(0,0,0,0.04)]">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: '#6366F114', border: '1px solid #6366F122' }}>
                          <Clock className="w-3.5 h-3.5 text-indigo-500" />
                        </div>
                        <div>
                          <h3 className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wide">Attendance Trend</h3>
                          <p className="text-[10px] text-slate-400 mt-0.5">Workforce presence analysis over time</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/60 rounded-xl p-1">
                        {(['Week','Month','Year'] as const).map(tf => (
                          <button key={tf} onClick={() => setAttendanceTimeframe(tf)}
                            className={cn(
                              "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wide transition-all cursor-pointer border-0",
                              attendanceTimeframe === tf
                                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                                : "text-slate-500 dark:text-slate-400 bg-transparent"
                            )}>{tf}</button>
                        ))}
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={168}>
                      <BarChart
                        data={(() => {
                          const rawData = chartData[attendanceTimeframe];
                          if (attendanceTimeframe === 'Week') {
                            return ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d,i) => ({ day: d, pct: rawData[i]||0 }));
                          } else if (attendanceTimeframe === 'Month') {
                            return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((d,i) => ({ day: d, pct: rawData[i]||0 }));
                          } else {
                            const labels: string[] = [];
                            const now = new Date();
                            for (let i=11;i>=0;i--) {
                              const d = new Date(now.getFullYear(), Math.floor(now.getMonth()/3)*3 - i*3, 1);
                              labels.push(`Q${Math.floor(d.getMonth()/3)+1}'${String(d.getFullYear()).slice(2)}`);
                            }
                            return labels.map((d,i) => ({ day: d, pct: rawData[i]||0 }));
                          }
                        })()}
                        margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                      >
                        <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#94A3B8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} domain={[0,100]} tickFormatter={v => `${v}%`} />
                        <Tooltip
                          contentStyle={{ fontSize: 10, borderRadius: 10, border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', padding: '6px 10px' }}
                          formatter={(v: any) => [`${v}%`, 'Attendance']}
                        />
                        <Bar dataKey="pct" fill="#6366F1" radius={[4,4,0,0]} opacity={0.75} maxBarSize={30} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Action Center - Pending Approvals */}
                  {dashboardData?.actionCenter && (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-2xl p-5 shadow-[0_2px_12px_-3px_rgba(0,0,0,0.04)]">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: '#F59E0B14', border: '1px solid #F59E0B22' }}>
                            <CheckSquare className="w-3.5 h-3.5 text-amber-500" />
                          </div>
                          <div>
                            <h3 className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wide">Action Center</h3>
                            <p className="text-[10px] text-slate-400 mt-0.5">Pending approvals &amp; escalations</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/60 rounded-xl p-1 self-start sm:self-auto flex-wrap">
                          {([
                            { id: 'leaves', label: 'Leaves' },
                            { id: 'corrections', label: 'Corrections' },
                            { id: 'documents', label: 'Docs' },
                            { id: 'onboarding', label: 'Onboarding' },
                            { id: 'escalations', label: 'Escalations' },
                          ] as const).map(t => (
                            <button key={t.id} onClick={() => setActionTab(t.id)}
                              className={cn(
                                "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wide transition-all cursor-pointer border-0",
                                actionTab === t.id
                                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                                  : "text-slate-500 dark:text-slate-400 bg-transparent"
                              )}>{t.label}</button>
                          ))}
                        </div>
                      </div>

                      <div className="max-h-[260px] overflow-y-auto">
                        {actionTab === 'leaves' && (
                          !dashboardData.actionCenter.pendingLeaves?.length ? (
                            <div className="py-8 text-center text-[10px] text-slate-400 font-medium flex flex-col items-center gap-2">
                              <CheckCircle2 className="w-6 h-6 text-emerald-400/60" />No pending leave requests
                            </div>
                          ) : dashboardData.actionCenter.pendingLeaves.map((l: any) => (
                            <div key={l.id} className="flex items-center justify-between py-2.5 border-b border-slate-50 dark:border-slate-800/40 last:border-0 gap-3">
                              <div className="min-w-0">
                                <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate">{l.name}</div>
                                <div className="text-[9px] text-slate-400 mt-0.5">{l.type} · {l.date}</div>
                              </div>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <button onClick={() => handleHrAction('leave', l.id, 'approve')}
                                  className="px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wide bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 hover:bg-emerald-100 border border-emerald-100 dark:border-emerald-800/40 transition-all cursor-pointer">✓ Approve</button>
                                <button onClick={() => handleHrAction('leave', l.id, 'reject')}
                                  className="px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wide bg-rose-50 dark:bg-rose-900/30 text-rose-600 hover:bg-rose-100 border border-rose-100 dark:border-rose-800/40 transition-all cursor-pointer">✕ Reject</button>
                              </div>
                            </div>
                          ))
                        )}
                        {actionTab === 'corrections' && (
                          !dashboardData.actionCenter.pendingCorrections?.length ? (
                            <div className="py-8 text-center text-[10px] text-slate-400 font-medium flex flex-col items-center gap-2">
                              <CheckCircle2 className="w-6 h-6 text-emerald-400/60" />No pending attendance corrections
                            </div>
                          ) : dashboardData.actionCenter.pendingCorrections.map((c: any) => (
                            <div key={c.id} className="flex items-center justify-between py-2.5 border-b border-slate-50 dark:border-slate-800/40 last:border-0 gap-3">
                              <div className="min-w-0">
                                <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate">{c.name}</div>
                                <div className="text-[9px] text-slate-400 mt-0.5">{c.date} · Check-in: {c.timeIn}</div>
                              </div>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <button onClick={() => handleHrAction('correction', c.id, 'approve')}
                                  className="px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wide bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 hover:bg-emerald-100 border border-emerald-100 dark:border-emerald-800/40 transition-all cursor-pointer">✓ Approve</button>
                                <button onClick={() => handleHrAction('correction', c.id, 'reject')}
                                  className="px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wide bg-rose-50 dark:bg-rose-900/30 text-rose-600 hover:bg-rose-100 border border-rose-100 dark:border-rose-800/40 transition-all cursor-pointer">✕ Reject</button>
                              </div>
                            </div>
                          ))
                        )}
                        {actionTab === 'documents' && (
                          !dashboardData.actionCenter.pendingDocuments?.length ? (
                            <div className="py-8 text-center text-[10px] text-slate-400 font-medium flex flex-col items-center gap-2">
                              <CheckCircle2 className="w-6 h-6 text-emerald-400/60" />All documents verified
                            </div>
                          ) : dashboardData.actionCenter.pendingDocuments.map((d: any) => (
                            <div key={d.id} className="flex items-center justify-between py-2.5 border-b border-slate-50 dark:border-slate-800/40 last:border-0">
                              <div className="min-w-0">
                                <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate">{d.name}</div>
                                <div className="text-[9px] text-slate-400 mt-0.5">{d.docs?.join(', ')}</div>
                              </div>
                              <button onClick={() => handleHrAction('document', d.id, 'approve')}
                                className="flex-shrink-0 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wide bg-blue-50 dark:bg-blue-900/30 text-blue-600 hover:bg-blue-100 border border-blue-100 dark:border-blue-800/40 transition-all cursor-pointer">Review</button>
                            </div>
                          ))
                        )}
                        {actionTab === 'onboarding' && (
                          !dashboardData.actionCenter.pendingOnboarding?.length ? (
                            <div className="py-8 text-center text-[10px] text-slate-400 font-medium flex flex-col items-center gap-2">
                              <CheckCircle2 className="w-6 h-6 text-emerald-400/60" />No onboarding pending
                            </div>
                          ) : dashboardData.actionCenter.pendingOnboarding.map((e: any) => (
                            <div key={e.id} className="flex items-center justify-between py-2.5 border-b border-slate-50 dark:border-slate-800/40 last:border-0">
                              <div className="min-w-0">
                                <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate">{e.name}</div>
                                <div className="text-[9px] text-slate-400 mt-0.5">{e.designation}</div>
                              </div>
                              <button onClick={() => handleHrAction('onboarding', e.id, 'approve')}
                                className="flex-shrink-0 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wide bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 hover:bg-emerald-100 border border-emerald-100 dark:border-emerald-800/40 transition-all cursor-pointer">Activate</button>
                            </div>
                          ))
                        )}
                        {actionTab === 'escalations' && (
                          !dashboardData.actionCenter.pendingEscalations?.length ? (
                            <div className="py-8 text-center text-[10px] text-slate-400 font-medium flex flex-col items-center gap-2">
                              <CheckCircle2 className="w-6 h-6 text-emerald-400/60" />No escalated tickets
                            </div>
                          ) : dashboardData.actionCenter.pendingEscalations.map((t: any) => (
                            <div key={t.id} className="flex items-center justify-between py-2.5 border-b border-slate-50 dark:border-slate-800/40 last:border-0">
                              <div className="min-w-0">
                                <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate">{t.subject}</div>
                                <div className="text-[9px] text-slate-400 mt-0.5">{t.name}</div>
                              </div>
                              <span className="flex-shrink-0 px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wide bg-rose-50 dark:bg-rose-900/30 text-rose-600 border border-rose-100 dark:border-rose-800/40">{t.priority||'High'}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* Latest Announcements */}
                  {dashboardData?.announcements?.length > 0 && (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-2xl p-5 shadow-[0_2px_12px_-3px_rgba(0,0,0,0.04)]">
                      <div className="flex items-center gap-2.5 mb-4">
                        <div className="w-7 h-7 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: '#3B82F614', border: '1px solid #3B82F622' }}>
                          <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                        </div>
                        <div>
                          <h3 className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wide">Latest Announcements</h3>
                          <p className="text-[10px] text-slate-400 mt-0.5">Company-wide broadcasts</p>
                        </div>
                      </div>
                      <div className="space-y-0">
                        {dashboardData.announcements.slice(0, 5).map((ann: any) => (
                          <div key={ann.id} className="py-2.5 border-b border-slate-50 dark:border-slate-800/40 last:border-0">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate">{ann.title}</div>
                                <div className="text-[9px] text-slate-400 mt-0.5 line-clamp-1">{ann.content}</div>
                              </div>
                              <span className="flex-shrink-0 text-[9px] text-slate-400">
                                {new Date(ann.createdAt).toLocaleDateString('en-US', { day:'numeric', month:'short' })}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>

                {/* ═════ RIGHT SIDEBAR (3 cols) ═════ */}
                <div className="xl:col-span-3 space-y-4">

                  {/* AI Insights Panel */}
                  <div className="bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-700 rounded-2xl p-5 text-white relative overflow-hidden shadow-lg shadow-indigo-500/15">
                    <div className="absolute inset-0 pointer-events-none"
                      style={{ backgroundImage: 'radial-gradient(circle at 85% 15%, rgba(255,255,255,0.12) 0%, transparent 55%), radial-gradient(circle at 15% 85%, rgba(139,92,246,0.3) 0%, transparent 60%)' }} />
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">
                          <Sparkles className="w-3.5 h-3.5 text-white" />
                        </div>
                        <h3 className="text-[11px] font-bold uppercase tracking-wide">AI Insights</h3>
                        <span className="ml-auto text-[8px] bg-white/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">LIVE</span>
                      </div>
                      <div className="space-y-2.5">
                        {[
                          {
                            icon: '⚠️',
                            title: 'Attrition Risk',
                            body: `${health.attritionRate||0}% attrition detected. ${(health.attritionRate||0) > 10 ? 'Consider an engagement survey.' : 'Within healthy range.'}`,
                          },
                          {
                            icon: '📈',
                            title: 'Hiring Momentum',
                            body: `${health.hiringGrowth||0}% growth in applications. Pipeline is ${(health.hiringGrowth||0) > 0 ? 'expanding' : 'stable'}.`,
                          },
                          {
                            icon: '🏥',
                            title: 'Wellness Score',
                            body: `Org health at ${health.orgHealthScore||92}%. ${(health.attendance||0) < 80 ? 'Attendance needs attention.' : 'Attendance is healthy.'}`,
                          },
                        ].map((insight, i) => (
                          <div key={i} className="bg-white/10 hover:bg-white/15 rounded-xl p-3 backdrop-blur-sm transition-colors">
                            <div className="flex items-start gap-2">
                              <span className="text-sm mt-0.5">{insight.icon}</span>
                              <div>
                                <div className="text-[10px] font-bold">{insight.title}</div>
                                <div className="text-[9px] opacity-80 mt-0.5 leading-relaxed">{insight.body}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Governance Activity Feed */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-2xl p-5 shadow-[0_2px_12px_-3px_rgba(0,0,0,0.04)]">
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="w-7 h-7 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: '#6366F114', border: '1px solid #6366F122' }}>
                        <Network className="w-3.5 h-3.5 text-indigo-500" />
                      </div>
                      <div>
                        <h3 className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wide">Activity Feed</h3>
                        <p className="text-[10px] text-slate-400 mt-0.5">Recent admin actions</p>
                      </div>
                    </div>
                    <div className="space-y-0 max-h-[220px] overflow-y-auto pr-1">
                      {activityFeed.length === 0 ? (
                        <div className="py-6 flex flex-col items-center gap-2 text-slate-400">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400/60" />
                          <span className="text-[9px] font-semibold uppercase tracking-wide">No recent activity</span>
                        </div>
                      ) : (
                        activityFeed.map((act: any) => (
                          <div key={act.id} className="flex items-start gap-2 py-2 border-b border-slate-50 dark:border-slate-800/40 last:border-0">
                            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <div className="text-[10px] font-semibold text-slate-800 dark:text-slate-200 leading-snug line-clamp-1">{act.activity}</div>
                              <div className="text-[9px] text-slate-400 mt-0.5">by {act.user}</div>
                            </div>
                            <span className="text-[8px] text-slate-400 flex-shrink-0 mt-0.5">{new Date(act.timestamp).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* System Health Monitor */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-2xl p-5 shadow-[0_2px_12px_-3px_rgba(0,0,0,0.04)]">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: '#3B82F614', border: '1px solid #3B82F622' }}>
                          <Laptop className="w-3.5 h-3.5 text-blue-500" />
                        </div>
                        <h3 className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wide">System Health</h3>
                      </div>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wide border",
                        system.status === 'Operational'
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border-emerald-100 dark:border-emerald-800/30'
                          : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 border-rose-100 dark:border-rose-800/30'
                      )}>
                        {system.status || 'Operational'}
                      </span>
                    </div>

                    {/* Status indicators */}
                    <div className="space-y-0">
                      {[
                        { label: 'MongoDB', value: system.dbStatus||'Connected', ok: system.dbStatus !== 'Disconnected' },
                        { label: 'Heap Memory', value: system.memoryUsage||'—', ok: true },
                        { label: 'Admins', value: String(roleSummary.adminCount||0), ok: true },
                        { label: 'HR Managers', value: String(roleSummary.hrCount||0), ok: true },
                      ].map((row, i) => (
                        <div key={i} className="flex items-center justify-between py-1.5 border-b border-slate-50 dark:border-slate-800/40 last:border-0">
                          <span className="text-[9px] font-medium text-slate-400">{row.label}</span>
                          <div className="flex items-center gap-1.5">
                            <div className={cn("w-1.5 h-1.5 rounded-full", row.ok ? "bg-emerald-400" : "bg-rose-400")} />
                            <span className="text-[9px] font-bold text-slate-700 dark:text-slate-300">{row.value}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Storage bar */}
                    <div className="mt-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-medium text-slate-400">Storage</span>
                        <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300">{subscription.storageUsage||'0 GB / 10 GB'}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${storagePercent}%`, backgroundColor: '#3B82F6', opacity: 0.65 }} />
                      </div>
                    </div>

                    <button onClick={() => handleAdminAction('diagnostics')}
                      className="mt-3 w-full py-1.5 text-[9px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-all cursor-pointer">
                      Run Diagnostics
                    </button>
                  </div>

                  {/* Billing & Plan */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-2xl p-5 shadow-[0_2px_12px_-3px_rgba(0,0,0,0.04)]">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: '#10B98114', border: '1px solid #10B98122' }}>
                          <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                        </div>
                        <h3 className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wide">Billing & Plan</h3>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wide"
                        style={{ backgroundColor: '#10B98112', color: '#059669', border: '1px solid #10B98120' }}>
                        {subscription.status||'Active'}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {[
                        { label: 'Plan', value: subscription.plan||'Enterprise' },
                        { label: 'Cycle', value: subscription.billingCycle||'Monthly' },
                        { label: 'Renews', value: subscription.nextBillingDate||'—' },
                      ].map((row, i) => (
                        <div key={i} className="flex items-center justify-between py-1 border-b border-slate-50 dark:border-slate-800/40 last:border-0">
                          <span className="text-[9px] font-medium text-slate-400 uppercase tracking-wide">{row.label}</span>
                          <span className="text-[9px] font-bold text-slate-700 dark:text-slate-300 truncate ml-2 text-right max-w-[120px]">{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Project Stats */}
                  {dashboardData?.projectStats && (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-2xl p-5 shadow-[0_2px_12px_-3px_rgba(0,0,0,0.04)]">
                      <div className="flex items-center gap-2.5 mb-4">
                        <div className="w-7 h-7 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: '#F59E0B14', border: '1px solid #F59E0B22' }}>
                          <Briefcase className="w-3.5 h-3.5 text-amber-500" />
                        </div>
                        <div>
                          <h3 className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wide">Project Overview</h3>
                          <p className="text-[10px] text-slate-400 mt-0.5">Live project health across all teams</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        {[
                          { label: 'Total', value: dashboardData.projectStats.total, color: '#6366F1' },
                          { label: 'Active', value: dashboardData.projectStats.active, color: '#10B981' },
                          { label: 'Completed', value: dashboardData.projectStats.completed, color: '#3B82F6' },
                          { label: 'Delayed', value: dashboardData.projectStats.delayed, color: '#F43F5E' },
                        ].map((s, i) => (
                          <div key={i} className="rounded-xl border border-slate-100 dark:border-slate-800 p-2.5 text-center">
                            <div className="text-base font-black leading-none" style={{ color: s.color }}>{s.value}</div>
                            <div className="text-[8px] font-semibold text-slate-400 uppercase tracking-wide mt-0.5">{s.label}</div>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-medium text-slate-400">Avg Completion</span>
                        <span className="text-[10px] font-black text-amber-500">{dashboardData.projectStats.avgCompletion}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${dashboardData.projectStats.avgCompletion}%`, backgroundColor: '#F59E0B', opacity: 0.7 }} />
                      </div>
                      {dashboardData.projectStats.recent?.length > 0 && (
                        <div className="mt-3 space-y-1.5">
                          {dashboardData.projectStats.recent.map((p: any, i: number) => (
                            <div key={i} className="flex items-center justify-between py-1 border-b border-slate-50 dark:border-slate-800/40 last:border-0">
                              <div className="min-w-0 flex-1">
                                <div className="text-[10px] font-semibold text-slate-700 dark:text-slate-200 truncate">{p.name}</div>
                                <div className="text-[8px] text-slate-400">{p.teamSize} members</div>
                              </div>
                              <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                                <span className={cn(
                                  "px-1.5 py-0.5 rounded-full text-[7px] font-bold uppercase tracking-wide",
                                  p.healthScore >= 70 ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                                  p.healthScore >= 40 ? "bg-amber-50 text-amber-600 border border-amber-100" :
                                  "bg-rose-50 text-rose-600 border border-rose-100"
                                )}>{p.completionPercent}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════
              WORKFORCE ANALYTICS SUB-TAB
          ══════════════════════════════════════════════ */}
          {activeSubTab === 'workforce' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[13px] font-bold text-slate-900 dark:text-white tracking-tight">Workforce Analytics</h2>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium">Role distribution, growth trends &amp; org hierarchy</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-7 space-y-4">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-2xl p-5">
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#3B82F614', border: '1px solid #3B82F622' }}>
                        <Users className="w-3.5 h-3.5 text-blue-500" />
                      </div>
                      <div>
                        <h3 className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wide">Workforce Roster</h3>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">User role distribution across your organisation</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: 'Active Users', value: roleSummary.activeUsers || 0, accent: '#3B82F6' },
                        { label: 'Admins', value: roleSummary.adminCount || 0, accent: '#6366F1' },
                        { label: 'HR Managers', value: roleSummary.hrCount || 0, accent: '#10B981' },
                        { label: 'Employees', value: roleSummary.employeeCount || 0, accent: '#8B5CF6' },
                      ].map((item, i) => (
                        <div key={i} className="rounded-xl border border-slate-100 dark:border-slate-800 p-3.5 hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
                          <div className="text-xl font-black mb-1" style={{ color: item.accent }}>{item.value}</div>
                          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{item.label}</div>
                          <div className="mt-2 h-0.5 rounded-full" style={{ backgroundColor: item.accent, opacity: 0.25 }} />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-2xl p-5">
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#10B98114', border: '1px solid #10B98122' }}>
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                      </div>
                      <div>
                        <h3 className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wide">Growth &amp; Attrition</h3>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">30-day performance index</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-slate-100 dark:border-slate-800 p-4">
                        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Workforce Growth</div>
                        <div className="text-2xl font-black text-emerald-500 mb-1">+{health.employeeGrowth || 0}%</div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">Based on active onboarding vs exit transitions in the last 30 days.</p>
                      </div>
                      <div className="rounded-xl border border-slate-100 dark:border-slate-800 p-4">
                        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Retention Index</div>
                        <div className="text-2xl font-black text-blue-500 mb-1">{health.retentionRate || 0}%</div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">Attrition rate: <span className="text-rose-500 font-bold">{health.attritionRate || 0}%</span> company-wide.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-2xl p-5 flex flex-col">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#6366F114', border: '1px solid #6366F122' }}>
                      <Network className="w-3.5 h-3.5 text-indigo-500" />
                    </div>
                    <div>
                      <h3 className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wide">Operational Hierarchy</h3>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Live org tree preview</p>
                    </div>
                  </div>
                  <div className="flex-1 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/40 dark:bg-slate-950/20 p-3 overflow-y-auto min-h-[200px] max-h-[280px]">
                    {orgTreeData.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center gap-2 text-slate-400">
                        <Network className="w-5 h-5 opacity-30" />
                        <span className="text-[10px] font-semibold uppercase tracking-wide">Loading hierarchy...</span>
                      </div>
                    ) : (
                      orgTreeData.map(rootNode => renderTreeNode(rootNode))
                    )}
                  </div>
                  <button onClick={() => setCurrentPage && setCurrentPage('orgchart')}
                    className="mt-4 w-full py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-all cursor-pointer">
                    Open Full Hierarchy Chart
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════
              PAYROLL & COST SUB-TAB
          ══════════════════════════════════════════════ */}
          {activeSubTab === 'payroll' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[13px] font-bold text-slate-900 dark:text-white tracking-tight">Payroll &amp; Cost</h2>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium">Financial governance metrics and disbursement overview</p>
                </div>
                <button onClick={() => setCurrentPage && setCurrentPage('payroll')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold text-slate-500 border border-slate-200 dark:border-slate-700 hover:border-slate-300 rounded-lg transition-all cursor-pointer bg-transparent hover:text-slate-900 dark:hover:text-white">
                  Open Payroll Console
                </button>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-7 space-y-4">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-2xl p-5">
                    <div className="flex items-center gap-2.5 mb-5">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#10B98114', border: '1px solid #10B98122' }}>
                        <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                      </div>
                      <div>
                        <h3 className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wide">Governance Financials</h3>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Current period disbursement summary</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Monthly Payroll', value: `₹${(kpis.monthlyPayroll || 0).toLocaleString('en-IN')}`, accent: '#10B981', sub: 'Total salary disbursement' },
                        { label: 'Provident Fund', value: `₹${(kpis.pfContribution || 0).toLocaleString('en-IN')}`, accent: '#6366F1', sub: 'PF contribution (12%)' },
                        { label: 'Tax Deductions', value: `₹${(kpis.taxDeductions || 0).toLocaleString('en-IN')}`, accent: '#F43F5E', sub: 'TDS withheld this month' },
                      ].map((item, i) => (
                        <div key={i} className="rounded-xl border border-slate-100 dark:border-slate-800 p-4">
                          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">{item.label}</div>
                          <div className="text-xl font-black mb-1" style={{ color: item.accent }}>{item.value}</div>
                          <div className="text-[9px] text-slate-400">{item.sub}</div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 rounded-xl border border-slate-100 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-800/20">
                      <div className="text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1">Strategic Cost Analysis</div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">Admins can review tax configurations, salary structures and PF parameters under Settings. Any structural cost adjustments are automatically logged to the audit trail.</p>
                    </div>
                  </div>
                </div>
                <div className="lg:col-span-5 space-y-4">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-2xl p-5">
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#3B82F614', border: '1px solid #3B82F622' }}>
                        <CheckSquare className="w-3.5 h-3.5 text-blue-500" />
                      </div>
                      <h3 className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wide">Governance Checkpoints</h3>
                    </div>
                    <div className="space-y-3">
                      {[
                        { title: 'Verify monthly payroll disbursements', sub: 'Automated checks configured' },
                        { title: 'PF & TDS ledger records audit', sub: 'Compliant with Mongoose schema mappings' },
                        { title: 'Salary structure review', sub: 'Updated each billing cycle' },
                      ].map((item, i) => (
                        <div key={i} className="flex items-start gap-3 py-2.5 border-b border-slate-50 dark:border-slate-800/40 last:border-0">
                          <div className="w-4 h-4 rounded-full bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800/40 flex items-center justify-center flex-shrink-0 mt-px">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                          </div>
                          <div>
                            <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-200">{item.title}</div>
                            <div className="text-[9px] text-slate-400 mt-0.5 uppercase tracking-wide font-medium">{item.sub}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════
              RECRUITMENT ANALYTICS SUB-TAB
          ══════════════════════════════════════════════ */}
          {activeSubTab === 'recruitment' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[13px] font-bold text-slate-900 dark:text-white tracking-tight">Recruitment Analytics</h2>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium">Talent acquisition pipeline and hiring funnel performance</p>
                </div>
                <button onClick={() => setCurrentPage && setCurrentPage('recruitment')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold text-slate-500 border border-slate-200 dark:border-slate-700 hover:border-slate-300 rounded-lg transition-all cursor-pointer bg-transparent hover:text-slate-900 dark:hover:text-white">
                  Manage Funnels
                </button>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-7 space-y-4">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-2xl p-5">
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#3B82F614', border: '1px solid #3B82F622' }}>
                        <Briefcase className="w-3.5 h-3.5 text-blue-500" />
                      </div>
                      <div>
                        <h3 className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wide">Talent Acquisition</h3>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Live pipeline metrics</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="rounded-xl border border-slate-100 dark:border-slate-800 p-4">
                        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Active Vacancies</div>
                        <div className="text-2xl font-black text-indigo-500 leading-none">{kpis.openRecruitments || 0}</div>
                        <div className="text-[9px] text-slate-400 mt-1">Open job postings</div>
                      </div>
                      <div className="rounded-xl border border-slate-100 dark:border-slate-800 p-4">
                        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Hiring Growth</div>
                        <div className="text-2xl font-black text-emerald-500 leading-none">+{health.hiringGrowth || 0}%</div>
                        <div className="text-[9px] text-slate-400 mt-1">vs last period</div>
                      </div>
                    </div>
                    {/* Real pipeline funnel */}
                    {dashboardData?.recruitmentFunnel && (
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        {[
                          { label: 'Applied', value: dashboardData.recruitmentFunnel.sourced, accent: '#6366F1' },
                          { label: 'Interviews', value: dashboardData.recruitmentFunnel.interview, accent: '#3B82F6' },
                          { label: 'Offers', value: dashboardData.recruitmentFunnel.offer, accent: '#F59E0B' },
                          { label: 'Hired', value: dashboardData.recruitmentFunnel.hired, accent: '#10B981' },
                          { label: 'Screening', value: dashboardData.recruitmentFunnel.screening, accent: '#8B5CF6' },
                          { label: 'Rejected', value: dashboardData.recruitmentFunnel.rejected, accent: '#F43F5E' },
                        ].map((f, i) => (
                          <div key={i} className="rounded-xl border border-slate-100 dark:border-slate-800 p-3 text-center">
                            <div className="text-lg font-black leading-none" style={{ color: f.accent }}>{f.value}</div>
                            <div className="text-[8px] font-semibold text-slate-400 uppercase tracking-wide mt-1">{f.label}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="rounded-xl border border-slate-100 dark:border-slate-800 p-3.5 bg-slate-50/50 dark:bg-slate-800/20">
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">Real-time pipeline updates are available in the Recruitment module. Source breakdown is computed from live application data.</p>
                    </div>
                  </div>
                </div>
                <div className="lg:col-span-5">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-2xl p-5 h-full">
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#10B98114', border: '1px solid #10B98122' }}>
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                      </div>
                      <div>
                        <h3 className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wide">ATS Sourcing Channels</h3>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Candidate source breakdown</p>
                      </div>
                    </div>
                    <div className="space-y-2.5">
                      {(() => {
                        const sources = dashboardData?.recruitmentSources || [];
                        const accentPalette = ['#0A66C2','#6366F1','#10B981','#F59E0B','#F43F5E','#8B5CF6','#3B82F6'];
                        if (sources.length === 0) {
                          return (
                            <div className="py-6 text-center text-slate-400">
                              <TrendingUp className="w-5 h-5 mx-auto mb-2 opacity-30" />
                              <p className="text-[10px] font-semibold uppercase tracking-wide">No applications recorded yet</p>
                            </div>
                          );
                        }
                        return sources.slice(0, 6).map((s: any, i: number) => (
                          <div key={i} className="flex items-center gap-3">
                            <div className="text-[10px] font-medium text-slate-500 w-28 flex-shrink-0 truncate">{s.label}</div>
                            <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${s.pct}%`, backgroundColor: accentPalette[i % accentPalette.length], opacity: 0.65 }} />
                            </div>
                            <div className="text-[10px] font-bold text-slate-600 dark:text-slate-300 w-8 text-right">{s.pct}%</div>
                          </div>
                        ));
                      })()}
                    </div>
                    <p className="text-[9px] text-slate-400 mt-4">Live data from {dashboardData?.recruitmentFunnel?.sourced || 0} total applications in your ATS.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════
              SECURITY & AUDIT SUB-TAB
          ══════════════════════════════════════════════ */}
          {activeSubTab === 'security' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[13px] font-bold text-slate-900 dark:text-white tracking-tight">Security &amp; Audits</h2>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium">Login events, security alerts and full system audit trail</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-2xl p-5">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#3B82F614', border: '1px solid #3B82F622' }}>
                      <Lock className="w-3.5 h-3.5 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wide">Security Oversight</h3>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">24-hour security parameter snapshot</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Failed Logins (24h)', value: security.failedAttempts || 0, accent: '#F43F5E' },
                      { label: 'Password Resets', value: security.passwordResets || 0, accent: '#F59E0B' },
                      { label: 'Suspended Accounts', value: security.lockedAccounts || 0, accent: '#64748B' },
                    ].map((item, i) => (
                      <div key={i} className="rounded-xl border border-slate-100 dark:border-slate-800 p-4">
                        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">{item.label}</div>
                        <div className="text-2xl font-black leading-none" style={{ color: item.accent }}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="md:col-span-5 bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-2xl p-5 flex flex-col">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#F43F5E14', border: '1px solid #F43F5E22' }}>
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                    </div>
                    <h3 className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wide">Active Alerts</h3>
                  </div>
                  <div className="flex-1 space-y-2 overflow-y-auto">
                    {!security.alerts || security.alerts.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center gap-2 text-slate-400 py-4">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400/60" />
                        <span className="text-[10px] font-semibold uppercase tracking-wide">No active security alerts</span>
                      </div>
                    ) : (
                      security.alerts.map((al: any) => (
                        <div key={al.id} className="flex items-center justify-between gap-3 py-2 border-b border-slate-100 dark:border-slate-800/50 last:border-0">
                          <div className="min-w-0">
                            <div className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 truncate">{al.action}</div>
                            <div className="text-[9px] text-slate-400 mt-0.5">{al.user} · {al.ipAddress}</div>
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-900/30 text-rose-600 text-[9px] font-bold uppercase tracking-wide border border-rose-100 dark:border-rose-800/40 flex-shrink-0">{al.severity}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-2xl p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#6366F114', border: '1px solid #6366F122' }}>
                      <FileText className="w-3.5 h-3.5 text-indigo-500" />
                    </div>
                    <div>
                      <h3 className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wide">System Audit Trail</h3>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Track modifications across the company directory, database and settings</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                      <input type="text" placeholder="Search logs..." value={auditSearchQuery}
                        onChange={e => setAuditSearchQuery(e.target.value)}
                        className="pl-7 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] focus:outline-none text-slate-800 dark:text-white"
                      />
                    </div>
                    <select value={auditActionFilter} onChange={e => setAuditActionFilter(e.target.value)}
                      className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] focus:outline-none text-slate-800 dark:text-white font-medium">
                      <option value="All">All Actions</option>
                      <option value="Employee">Employee Changes</option>
                      <option value="Payroll">Payroll</option>
                      <option value="Leave">Leaves</option>
                      <option value="Recruitment">Recruitment</option>
                      <option value="Login">Logins</option>
                    </select>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800">
                        {['User', 'Action', 'Details', 'IP Address', 'Timestamp'].map((h, i) => (
                          <th key={i} className={cn("pb-2.5 text-[9px] font-semibold text-slate-400 uppercase tracking-wider", i === 4 && 'text-right')}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAudit.length === 0 ? (
                        <tr><td colSpan={5} className="py-8 text-center text-[10px] text-slate-400 font-medium">No audit trails logged.</td></tr>
                      ) : (
                        filteredAudit.map((log: any) => (
                          <tr key={log.id} className="border-b border-slate-50 dark:border-slate-800/40 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                            <td className="py-2.5 text-[11px] font-semibold text-slate-800 dark:text-slate-200">{log.user}</td>
                            <td className="py-2.5">
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/40">{log.action}</span>
                            </td>
                            <td className="py-2.5 text-[10px] text-slate-500 dark:text-slate-400 max-w-[200px] truncate">{log.details}</td>
                            <td className="py-2.5 text-[10px] text-slate-400 font-mono">{log.ipAddress}</td>
                            <td className="py-2.5 text-[10px] text-slate-400 text-right">{new Date(log.timestamp).toLocaleString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════
              SYSTEM ADMIN & STORAGE SUB-TAB
          ══════════════════════════════════════════════ */}
          {activeSubTab === 'system' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[13px] font-bold text-slate-900 dark:text-white tracking-tight">System Admin &amp; Storage</h2>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium">Infrastructure health, storage usage and role distribution</p>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-7 space-y-4">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#3B82F614', border: '1px solid #3B82F622' }}>
                          <Laptop className="w-3.5 h-3.5 text-blue-500" />
                        </div>
                        <div>
                          <h3 className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wide">System Management</h3>
                          <p className="text-[10px] text-slate-400 mt-0.5">Live infrastructure parameters</p>
                        </div>
                      </div>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide border",
                        system.status === 'Operational'
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border-emerald-100 dark:border-emerald-800/30'
                          : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 border-rose-100 dark:border-rose-800/30'
                      )}>{system.status || 'Operational'}</span>
                    </div>
                    <div className="space-y-0">
                      {[
                        { label: 'MongoDB Status', value: system.dbStatus || 'Connected', accent: '#10B981' },
                        { label: 'Heap Memory Allocation', value: system.memoryUsage || '120 MB', accent: '#3B82F6' },
                        { label: 'Total Audit Log Entries', value: String(auditLogsSummary.length), accent: '#6366F1' },
                      ].map((row, i) => (
                        <div key={i} className="flex items-center justify-between py-2.5 border-b border-slate-50 dark:border-slate-800/40 last:border-0">
                          <span className="text-[10px] font-medium text-slate-400">{row.label}</span>
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: row.accent }} />
                            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200">{row.value}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-medium text-slate-400">SaaS Storage Footprint</span>
                        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200">{subscription.storageUsage || '0 GB / 10 GB'}</span>
                      </div>
                      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${storagePercent}%`, backgroundColor: '#3B82F6', opacity: 0.65 }} />
                      </div>
                      <p className="text-[9px] text-slate-400">Storage calculations update every 30s based on document collection byte-size.</p>
                    </div>
                    <button onClick={() => handleAdminAction('garbage_collection')}
                      className="mt-4 w-full py-2 text-[10px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800/40 rounded-xl transition-all cursor-pointer">
                      Clear Cached Logs &amp; Optimize Storage
                    </button>
                  </div>
                </div>
                <div className="lg:col-span-5">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-2xl p-5 h-full">
                    <div className="flex items-center gap-2.5 mb-5">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#8B5CF614', border: '1px solid #8B5CF622' }}>
                        <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
                      </div>
                      <div>
                        <h3 className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wide">Role Distribution</h3>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Active users by access level</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {[
                        { label: 'Company Admins', value: roleSummary.adminCount || 0, accent: '#6366F1', total: roleSummary.activeUsers || 1 },
                        { label: 'HR Managers', value: roleSummary.hrCount || 0, accent: '#10B981', total: roleSummary.activeUsers || 1 },
                        { label: 'Registered Employees', value: roleSummary.employeeCount || 0, accent: '#3B82F6', total: roleSummary.activeUsers || 1 },
                      ].map((row, i) => {
                        const pct = Math.round((row.value / Math.max(1, row.total)) * 100);
                        return (
                          <div key={i}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{row.label}</span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[13px] font-black text-slate-900 dark:text-white">{row.value}</span>
                                <span className="text-[9px] text-slate-400">({pct}%)</span>
                              </div>
                            </div>
                            <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: row.accent, opacity: 0.65 }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-medium text-slate-400">Total Active Users</span>
                        <span className="text-lg font-black text-slate-900 dark:text-white">{roleSummary.activeUsers || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    );
  };

  const renderHrDashboard = () => {
    const kpis = dashboardData?.kpis || {};
    const health = dashboardData?.companyHealth || {};
    const leavesToday = dashboardData?.leavesToday || [];
    const attendanceExceptions = dashboardData?.attendanceExceptions || [];
    const probationEmployees = dashboardData?.probationEmployees || [];
    const birthdaysList = dashboardData?.birthdaysList || [];
    const anniversariesList = dashboardData?.anniversariesList || [];
    const exitTrackingList = dashboardData?.exitTrackingList || [];
    const actionCenter = dashboardData?.actionCenter || {};
    const dsr = dashboardData?.dsr || {};
    const satisfactionScore = dashboardData?.satisfactionScore || 88;
    const workforce = dashboardData?.workforce || {};
    const recruitments = dashboardData?.recruitments || {};
    const projectStats = dashboardData?.projectStats || {};

    const filteredDsrUpdates = dashboardData?.dsr?.updates || [];

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSubTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          {/* TAB 1: OVERVIEW */}
          {activeSubTab === 'overview' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
              {/* Left main pane (9 cols) */}
              <div className="xl:col-span-9 space-y-4">
                
                {/* 1️⃣ HR KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "Total Employees", val: kpis.totalEmployees?.count || 0, desc: `Active: ${kpis.totalEmployees?.active || 0}`, color: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-950/20", icon: Users, accent: "#8B5CF6" },
                    { label: "Present Today", val: kpis.attendanceOverview?.present || 0, desc: `WFH: ${kpis.attendanceOverview?.wfh || 0}`, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/20", icon: Clock, accent: "#10B981" },
                    { label: "Absent Today", val: kpis.attendanceOverview?.absent || 0, desc: `Late: ${kpis.attendanceOverview?.late || 0}`, color: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-950/20", icon: AlertCircle, accent: "#F43F5E" },
                    { label: "On Leave", val: kpis.pendingLeaves?.approvedToday || 0, desc: `Pending: ${kpis.pendingLeaves?.pending || 0}`, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/20", icon: FileText, accent: "#F59E0B" }
                  ].map((card, i) => (
                    <PastelStatCard key={i} icon={card.icon} label={card.label} value={card.val} sub={card.desc} accent={card.accent} />
                  ))}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "Late Arrivals", val: kpis.attendanceOverview?.late || 0, desc: "Exception check-in", color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-950/20", icon: Clock, accent: "#F97316" },
                    { label: "New Joiners", val: kpis.totalEmployees?.newJoiners || 0, desc: "This month onboarding", color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-950/20", icon: UserCheck, accent: "#6366F1" },
                    { label: "Exits Tracker", val: exitTrackingList.length, desc: "Pending offboardings", color: "text-slate-500", bg: "bg-slate-100 dark:bg-slate-800/40", icon: UserMinus, accent: "#7C3AED" },
                    { label: "Pending Approvals", val: (actionCenter.pendingLeaves?.length || 0) + (actionCenter.pendingCorrections?.length || 0) + (actionCenter.pendingDocuments?.length || 0), desc: "Awaiting HR Action", color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/20", icon: CheckSquare, accent: "#F59E0B" }
                  ].map((card, i) => (
                    <PastelStatCard key={i} icon={card.icon} label={card.label} value={card.val} sub={card.desc} accent={card.accent} />
                  ))}
                </div>

                {/* 2️⃣ Employee Lifecycle / Dashboard Panels */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Attendance & Leaves quick overview */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-2xl p-4">
                    <h3 className="text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-500" />
                      Attendance Anomalies Today
                    </h3>
                    <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                      {attendanceExceptions.length === 0 ? (
                        <div className="py-8 text-center text-slate-400 text-[10px]">
                          All employee check-ins are verified and clear.
                        </div>
                      ) : (
                        attendanceExceptions.slice(0, 4).map((ex: any, idx: number) => (
                          <div key={idx} className="p-2 bg-slate-50 dark:bg-slate-850/40 rounded-xl border border-slate-100 dark:border-slate-800/40 flex justify-between items-center text-[9.5px]">
                            <div>
                              <span className="font-black text-slate-800 dark:text-white">{ex.name}</span>
                              <span className="text-[7px] text-slate-400 font-bold block">In: {ex.timeIn} | Out: {ex.timeOut}</span>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-amber-500/10 text-amber-600 border border-amber-500/10">
                              {ex.status}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Pending Approvals quick-list */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-2xl p-4">
                    <h3 className="text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
                      Pending HR Leaves Queue
                    </h3>
                    <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                      {(!actionCenter.pendingLeaves || actionCenter.pendingLeaves.length === 0) ? (
                        <div className="py-8 text-center text-slate-400 text-[10px]">
                          No leave requests awaiting decision.
                        </div>
                      ) : (
                        actionCenter.pendingLeaves.slice(0, 3).map((l: any) => (
                          <div key={l.id} className="p-2 bg-slate-50 dark:bg-slate-850/40 rounded-xl border border-slate-100 dark:border-slate-800/40 flex justify-between items-center text-[9.5px]">
                            <div className="min-w-0">
                              <span className="font-black text-slate-800 dark:text-white truncate block">{l.name}</span>
                              <span className="text-[7.5px] text-slate-400 font-bold uppercase block">{l.type} | {l.date}</span>
                            </div>
                            <div className="flex gap-1">
                              <button onClick={() => handleHrAction('leave', l.id, 'reject')} className="px-2 py-0.5 bg-rose-500/10 text-rose-600 hover:bg-rose-600 hover:text-white rounded-md text-[8px] font-bold border-none transition-all cursor-pointer">Deny</button>
                              <button onClick={() => handleHrAction('leave', l.id, 'approve')} className="px-2 py-0.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-md text-[8px] font-bold border-none transition-all cursor-pointer">Approve</button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>

                {/* 3️⃣ Action Center Tabbed Panel */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-2xl p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800/60 pb-3">
                    <div>
                      <h3 className="text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-widest">HR Action Center</h3>
                      <p className="text-[8px] text-slate-400 font-bold uppercase mt-0.5">Manage workforce approvals &amp; verify credentials</p>
                    </div>
                    <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/40 p-0.5 rounded-lg border border-slate-200/50 dark:border-slate-800 overflow-x-auto shrink-0 mt-2 sm:mt-0">
                      {(['leaves', 'corrections', 'documents', 'onboarding'] as const).map(tab => (
                        <button
                          key={tab}
                          onClick={() => setActionTab(tab as any)}
                          className={cn(
                            "px-2.5 py-1 rounded-md text-[8px] font-black uppercase tracking-wider transition-all cursor-pointer border-none",
                            actionTab === tab ? "bg-violet-600 text-white shadow-md" : "text-slate-450 hover:text-slate-700 dark:hover:text-slate-300"
                          )}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {actionTab === 'leaves' && (
                      (!actionCenter.pendingLeaves || actionCenter.pendingLeaves.length === 0) ? (
                        <div className="py-6 text-center text-slate-400 text-[10px]">No pending leave requests.</div>
                      ) : (
                        actionCenter.pendingLeaves.map((l: any) => (
                          <div key={l.id} className="p-2.5 bg-slate-50 dark:bg-slate-850/30 rounded-xl border border-slate-100/50 dark:border-slate-800/20 flex justify-between items-center text-[9.5px]">
                            <div>
                              <span className="font-black text-slate-800 dark:text-white">{l.name}</span>
                              <span className="text-[8px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded ml-2 uppercase tracking-wide">{l.dept}</span>
                              <p className="text-[8px] text-slate-450 mt-0.5">Requested {l.type} for {l.date}</p>
                              <p className="text-[8.5px] text-slate-500 italic mt-0.5">"{l.reason}"</p>
                            </div>
                            <div className="flex gap-1.5 shrink-0">
                              <button onClick={() => handleHrAction('leave', l.id, 'reject')} className="px-2.5 py-1 bg-slate-100 hover:bg-rose-500 hover:text-white dark:bg-slate-800 text-slate-600 dark:text-slate-350 rounded-lg text-[8px] font-bold border-none transition-all cursor-pointer">Reject</button>
                              <button onClick={() => handleHrAction('leave', l.id, 'approve')} className="px-2.5 py-1 bg-violet-600 text-white hover:bg-violet-700 rounded-lg text-[8px] font-bold border-none transition-all cursor-pointer">Approve</button>
                            </div>
                          </div>
                        ))
                      )
                    )}

                    {actionTab === 'corrections' && (
                      (!actionCenter.pendingCorrections || actionCenter.pendingCorrections.length === 0) ? (
                        <div className="py-6 text-center text-slate-400 text-[10px]">No attendance corrections.</div>
                      ) : (
                        actionCenter.pendingCorrections.map((c: any) => (
                          <div key={c.id} className="p-2.5 bg-slate-50 dark:bg-slate-850/30 rounded-xl border border-slate-100/50 dark:border-slate-800/20 flex justify-between items-center text-[9.5px]">
                            <div>
                              <span className="font-black text-slate-800 dark:text-white">{c.name}</span>
                              <p className="text-[8px] text-slate-450 mt-0.5">Correction requested for {c.date} (Clock In: {c.timeIn})</p>
                            </div>
                            <div className="flex gap-1.5 shrink-0">
                              <button onClick={() => handleHrAction('correction', c.id, 'reject')} className="px-2.5 py-1 bg-slate-100 hover:bg-rose-500 hover:text-white dark:bg-slate-800 text-slate-600 dark:text-slate-355 rounded-lg text-[8px] font-bold border-none transition-all cursor-pointer">Reject</button>
                              <button onClick={() => handleHrAction('correction', c.id, 'approve')} className="px-2.5 py-1 bg-violet-600 text-white hover:bg-violet-700 rounded-lg text-[8px] font-bold border-none transition-all cursor-pointer">Verify</button>
                            </div>
                          </div>
                        ))
                      )
                    )}

                    {actionTab === 'documents' && (
                      (!actionCenter.pendingDocuments || actionCenter.pendingDocuments.length === 0) ? (
                        <div className="py-6 text-center text-slate-400 text-[10px]">All employee files verified.</div>
                      ) : (
                        actionCenter.pendingDocuments.map((d: any) => (
                          <div key={d.id} className="p-2.5 bg-slate-50 dark:bg-slate-850/30 rounded-xl border border-slate-100/50 dark:border-slate-800/20 flex justify-between items-center text-[9.5px]">
                            <div>
                              <span className="font-black text-slate-800 dark:text-white">{d.name}</span>
                              <p className="text-[8px] text-slate-450 mt-0.5">Verification required: {d.docs?.join(', ')}</p>
                            </div>
                            <div className="flex gap-1.5 shrink-0">
                              <button onClick={() => handleHrAction('document', d.id, 'reject')} className="px-2.5 py-1 bg-slate-100 hover:bg-rose-500 hover:text-white dark:bg-slate-800 text-slate-600 dark:text-slate-355 rounded-lg text-[8px] font-bold border-none transition-all cursor-pointer">Reject</button>
                              <button onClick={() => handleHrAction('document', d.id, 'approve')} className="px-2.5 py-1 bg-violet-600 text-white hover:bg-violet-700 rounded-lg text-[8px] font-bold border-none transition-all cursor-pointer">Verify</button>
                            </div>
                          </div>
                        ))
                      )
                    )}

                    {actionTab === 'onboarding' && (
                      (!actionCenter.pendingOnboarding || actionCenter.pendingOnboarding.length === 0) ? (
                        <div className="py-6 text-center text-slate-400 text-[10px]">All checklists cleared.</div>
                      ) : (
                        actionCenter.pendingOnboarding.map((o: any) => (
                          <div key={o.id} className="p-2.5 bg-slate-50 dark:bg-slate-850/30 rounded-xl border border-slate-100/50 dark:border-slate-800/20 flex justify-between items-center text-[9.5px]">
                            <div>
                              <span className="font-black text-slate-800 dark:text-white">{o.name}</span>
                              <span className="text-[8px] font-semibold text-slate-400 ml-2">{o.designation}</span>
                            </div>
                            <button onClick={() => handleHrAction('onboarding', o.id, 'approve')} className="px-2.5 py-1 bg-violet-600 text-white hover:bg-violet-700 rounded-lg text-[8px] font-bold border-none transition-all cursor-pointer">Complete Checks</button>
                          </div>
                        ))
                      )
                    )}
                  </div>
                </div>

              </div>

              {/* Right Sidebar (3 cols) */}
              <div className="xl:col-span-3 space-y-4">
                
                {/* AI Insights & Assistant */}
                <div className="bg-gradient-to-br from-indigo-900 via-purple-950 to-slate-950 border border-indigo-950 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
                  <div className="absolute inset-0 bg-cover bg-center opacity-10 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 80% 20%, rgba(255,255,255,0.15) 0%, transparent 60%)" }} />
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="w-7.5 h-7.5 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                        <Sparkles className="w-4 h-4 text-violet-300 animate-pulse" />
                      </div>
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-white">AI Assistant</h4>
                        <p className="text-[8px] font-bold text-indigo-200/80 uppercase tracking-wider">Automated Insights</p>
                      </div>
                      <span className="ml-auto text-[8px] font-black bg-white/15 text-indigo-100 border border-white/10 px-2.5 py-1 rounded-full uppercase tracking-widest shadow-sm">HR Pulse</span>
                    </div>

                    <div className="space-y-2.5">
                      <div className="bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl p-3 transition-all text-[9.5px]">
                        <div className="font-bold flex items-center gap-1.5 text-amber-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                          Attrition Risk Detector
                        </div>
                        <p className="text-indigo-100/90 mt-1.5 leading-relaxed">Attrition score stands at {health.attritionRate || 0}%. Retention parameters are within safe margins.</p>
                      </div>

                      <div className="bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl p-3 transition-all text-[9.5px]">
                        <div className="font-bold flex items-center gap-1.5 text-emerald-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Sourcing Analytics
                        </div>
                        <p className="text-indigo-100/90 mt-1.5 leading-relaxed">Recruitment channels report +{health.hiringGrowth || 0}% expansion in inbound applications.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Calendar, Schedule, Birthdays */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
                  <h3 className="text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-500" />
                    Today's Schedule &amp; Events
                  </h3>
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {birthdaysList.length === 0 && anniversariesList.length === 0 ? (
                      <div className="py-6 text-center text-[10px] text-slate-400">No events scheduled today.</div>
                    ) : (
                      <>
                        {birthdaysList.map((b: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-2 p-2 bg-blue-500/5 border border-blue-500/10 rounded-xl text-[9px]">
                            <Gift className="w-3 h-3 text-blue-500" />
                            <div className="min-w-0">
                              <div className="font-bold text-slate-700 dark:text-slate-200 truncate">{b.name}</div>
                              <div className="text-[7.5px] text-slate-400 uppercase font-bold tracking-wider">Birthday Celebration</div>
                            </div>
                          </div>
                        ))}
                        {anniversariesList.map((a: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-2 p-2 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-[9px]">
                            <Award className="w-3 h-3 text-emerald-500" />
                            <div className="min-w-0">
                              <div className="font-bold text-slate-700 dark:text-slate-200 truncate">{a.name}</div>
                              <div className="text-[7.5px] text-slate-400 uppercase font-bold tracking-wider">Work Anniversary</div>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: ATTENDANCE HUB */}
          {activeSubTab === 'attendance' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                
                {/* Weekly/Monthly/Yearly Attendance charts */}
                <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-[11px] font-black text-slate-850 dark:text-white uppercase tracking-widest">Attendance Engagement Metrics</h3>
                      <p className="text-[8px] text-slate-400 uppercase font-bold tracking-wider mt-0.5">Live participation records</p>
                    </div>
                    <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/40 p-0.5 rounded-lg border border-slate-200/50 dark:border-slate-800">
                      {(['Week', 'Month', 'Year'] as const).map(t => (
                        <button
                          key={t}
                          onClick={() => setAttendanceTimeframe(t)}
                          className={cn(
                            "px-2.5 py-0.5 rounded-md text-[7px] font-black uppercase tracking-wider cursor-pointer border-none transition-all",
                            attendanceTimeframe === t ? "bg-violet-600 text-white" : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-350"
                          )}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="h-44 flex items-end justify-between gap-1 mt-6">
                    {chartData[attendanceTimeframe].map((h, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end">
                        <div className="absolute -top-7 bg-slate-950 text-white font-mono text-[8px] px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          {h}%
                        </div>
                        <div 
                          className="w-full bg-gradient-to-t from-violet-600 to-indigo-500 rounded-t-lg transition-all group-hover:from-violet-500 shadow-sm min-h-[4px]"
                          style={{ height: `${h}%` }}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                    {attendanceTimeframe === 'Week' ? (
                      ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => <span key={d} className="flex-1 text-center">{d}</span>)
                    ) : attendanceTimeframe === 'Month' ? (
                      ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => <span key={m} className="flex-1 text-center">{m}</span>)
                    ) : (
                      ['Q1', 'Q2', 'Q3', 'Q4', 'Q1', 'Q2', 'Q3', 'Q4', 'Q1', 'Q2', 'Q3', 'Q4'].map((q, i) => <span key={i} className="flex-1 text-center">{q}</span>)
                    )}
                  </div>
                </div>

                {/* Shift log anomalies */}
                <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col h-[280px]">
                  <h3 className="text-[11px] font-black text-slate-850 dark:text-white uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-500" />
                    Missing Clock Records
                  </h3>
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                    {attendanceExceptions.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400">
                        <CheckCircle2 className="w-6 h-6 text-emerald-500/60 mb-2" />
                        <span className="text-[8.5px] font-bold uppercase tracking-wider">All shifts clear</span>
                      </div>
                    ) : (
                      attendanceExceptions.map((ex: any, idx: number) => (
                        <div key={idx} className="p-2 bg-slate-50 dark:bg-slate-850/40 rounded-xl border border-slate-100 dark:border-slate-800/40 flex justify-between items-center text-[9px]">
                          <div>
                            <span className="font-black text-slate-850 dark:text-white">{ex.name}</span>
                            <span className="text-[7.5px] text-slate-450 block">{ex.date}</span>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[8px] font-black bg-rose-500/10 text-rose-600 border border-rose-500/15">
                            {ex.timeOut === '-' ? 'Missing Check Out' : 'Late Arrival'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: LEAVE CENTER */}
          {activeSubTab === 'leave' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              
              {/* Leaves Queue */}
              <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                <h3 className="text-[11px] font-black text-slate-850 dark:text-white uppercase tracking-widest pb-3 border-b border-slate-100 dark:border-slate-800/60 mb-3 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-violet-500" />
                  Leave Request Approvals
                </h3>
                <div className="space-y-3">
                  {(!actionCenter.pendingLeaves || actionCenter.pendingLeaves.length === 0) ? (
                    <div className="py-12 text-center text-slate-400">
                      <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500/60 mb-2" />
                      <span className="text-[9px] font-black uppercase tracking-wider block">No leave requests to review.</span>
                    </div>
                  ) : (
                    actionCenter.pendingLeaves.map((l: any) => (
                      <div key={l.id} className="p-3.5 bg-slate-50 dark:bg-slate-850/50 border border-slate-200/10 rounded-2xl flex justify-between items-center text-[9.5px]">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-850 dark:text-white">{l.name}</span>
                            <span className="text-[7.5px] font-bold bg-violet-500/10 text-violet-600 dark:text-violet-400 px-2 py-0.5 rounded-full uppercase tracking-wider">{l.dept}</span>
                          </div>
                          <p className="text-[8px] text-slate-400 font-bold uppercase mt-1">Requested {l.type} on {l.date}</p>
                          <p className="text-[9px] text-slate-500 italic mt-1">"{l.reason}"</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleHrAction('leave', l.id, 'reject')} className="px-3 py-1.5 bg-slate-150 hover:bg-rose-500 hover:text-white dark:bg-slate-800 text-slate-600 dark:text-slate-350 rounded-xl text-[8.5px] font-bold border-none transition-all cursor-pointer">Deny</button>
                          <button onClick={() => handleHrAction('leave', l.id, 'approve')} className="px-3 py-1.5 bg-violet-600 text-white hover:bg-violet-700 rounded-xl text-[8.5px] font-bold border-none transition-all cursor-pointer">Approve</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Leaves Today */}
              <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col h-[320px]">
                <h3 className="text-[11px] font-black text-slate-850 dark:text-white uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                  On Leave Today ({leavesToday.length})
                </h3>
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {leavesToday.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                      <span className="text-[9px] uppercase tracking-wider font-bold">No leaves today</span>
                    </div>
                  ) : (
                    leavesToday.map((lt: any, idx: number) => (
                      <div key={idx} className="p-2 bg-slate-50 dark:bg-slate-850/40 rounded-xl border border-slate-100 dark:border-slate-800/40 flex justify-between items-center text-[9px]">
                        <div>
                          <span className="font-black text-slate-850 dark:text-white">{lt.name}</span>
                          <span className="text-[7.5px] text-slate-400 block">{lt.dept}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/10">Active Leave</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: RECRUITMENT PIPELINE */}
          {activeSubTab === 'recruitment' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              
              {/* Active Jobs Pipelines */}
              <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                <h3 className="text-[11px] font-black text-slate-850 dark:text-white uppercase tracking-widest pb-3 border-b border-slate-100 dark:border-slate-800/60 mb-3 flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-violet-500" />
                  Active Recruitment Pipelines
                </h3>
                <div className="space-y-3">
                  {!recruitments.activeJobsList || recruitments.activeJobsList.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-[10px]">No active publishes found.</div>
                  ) : (
                    recruitments.activeJobsList.map((j: any, idx: number) => (
                      <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-850/50 border border-slate-200/10 rounded-xl flex justify-between items-center text-[9.5px]">
                        <div>
                          <span className="font-black text-slate-805 dark:text-white">{j.title}</span>
                          <p className="text-[8px] text-slate-400 font-bold uppercase mt-0.5">{j.dept} | Published {new Date(j.date).toLocaleDateString()}</p>
                        </div>
                        <span className="px-2.5 py-1 bg-violet-500/10 text-violet-600 font-black text-[9px] uppercase tracking-wider rounded-lg">
                          {j.applicants || 0} Candidates
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Sourced/Interview stages Funnel */}
              <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                <h3 className="text-[11px] font-black text-slate-850 dark:text-white uppercase tracking-widest mb-4 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                  ATS Application Stages
                </h3>
                
                {recruitments.funnel && (
                  <div className="space-y-3.5 text-[9.5px]">
                    {[
                      { label: "Sourced candidates", val: recruitments.funnel.sourced, color: "bg-blue-500" },
                      { label: "Interviews scheduled", val: recruitments.funnel.interview, color: "bg-indigo-500" },
                      { label: "Offers sent", val: recruitments.funnel.offer, color: "bg-violet-500" },
                      { label: "Joined crew", val: recruitments.funnel.hired, color: "bg-emerald-500" }
                    ].map((step, idx) => {
                      const totalSourced = recruitments.funnel?.sourced || 1;
                      const pct = Math.round((step.val / totalSourced) * 100);
                      return (
                        <div key={idx}>
                          <div className="flex justify-between font-bold text-slate-450 mb-1">
                            <span>{step.label}</span>
                            <span className="font-black text-slate-800 dark:text-white">{step.val} ({pct}%)</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className={cn("h-full rounded-full", step.color)} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 5: LIFECYCLE & ONBOARDING */}
          {activeSubTab === 'lifecycle' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              
              {/* Probation & Welcome Kit checks */}
              <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                <h3 className="text-[11px] font-black text-slate-850 dark:text-white uppercase tracking-widest pb-3 border-b border-slate-100 dark:border-slate-800/60 mb-3">
                  Probationary Employees Review ({probationEmployees.length})
                </h3>
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {probationEmployees.length === 0 ? (
                    <div className="py-6 text-center text-slate-400 text-[10px]">No employees on probation.</div>
                  ) : (
                    probationEmployees.map((pe: any, idx: number) => (
                      <div key={idx} className="p-2.5 bg-slate-50 dark:bg-slate-850/40 rounded-xl border border-slate-100 dark:border-slate-800/40 flex justify-between items-center text-[9px]">
                        <div>
                          <span className="font-black text-slate-850 dark:text-white">{pe.name}</span>
                          <span className="text-[7.5px] text-slate-400 block">{pe.department} | Joined {new Date(pe.date).toLocaleDateString()}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/10">Under Review</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Offboarding / Resignation Pipeline */}
              <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                <h3 className="text-[11px] font-black text-slate-850 dark:text-white uppercase tracking-widest pb-3 border-b border-slate-100 dark:border-slate-800/60 mb-3">
                  Offboarding &amp; Exit Clearances
                </h3>
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {exitTrackingList.length === 0 ? (
                    <div className="py-6 text-center text-slate-400 text-[10px]">No active resignation flows.</div>
                  ) : (
                    exitTrackingList.map((ex: any) => (
                      <div key={ex.id} className="p-2.5 bg-slate-50 dark:bg-slate-850/40 rounded-xl border border-slate-100 dark:border-slate-800/40 flex justify-between items-center text-[9px]">
                        <div>
                          <span className="font-black text-slate-850 dark:text-white">{ex.name}</span>
                          <span className="text-[7.5px] text-slate-400 block">{ex.department}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/10">{ex.status}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 6: EMPLOYEE SUPPORT */}
          {activeSubTab === 'support' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <h3 className="text-[11px] font-black text-slate-850 dark:text-white uppercase tracking-widest pb-3 border-b border-slate-100 dark:border-slate-800/60 mb-4">
                Active Employee Helpdesk Tickets
              </h3>
              <div className="space-y-2">
                {(!actionCenter.pendingEscalations || actionCenter.pendingEscalations.length === 0) ? (
                  <div className="py-8 text-center text-slate-400 text-[10px]">No open support tickets.</div>
                ) : (
                  actionCenter.pendingEscalations.map((e: any) => (
                    <div key={e.id} className="p-3 bg-slate-50 dark:bg-slate-850/40 border border-slate-200/10 rounded-xl flex justify-between items-center text-[9.5px]">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-slate-800 dark:text-white">{e.name}</span>
                          <span className="text-[7px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded uppercase tracking-wider">{e.priority} priority</span>
                        </div>
                        <p className="text-[8.5px] text-slate-450 mt-1">Ticket Subject: "{e.subject}"</p>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <button onClick={() => handleHrAction('ticket', e.id, 'reject')} className="px-2.5 py-1 bg-slate-100 hover:bg-rose-500 hover:text-white dark:bg-slate-800 text-slate-655 dark:text-slate-355 rounded-lg text-[8px] font-bold border-none transition-all cursor-pointer">Dismiss</button>
                        <button onClick={() => handleHrAction('ticket', e.id, 'approve')} className="px-2.5 py-1 bg-violet-600 text-white hover:bg-violet-700 rounded-lg text-[8px] font-bold border-none transition-all cursor-pointer">Resolve</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 7: ENGAGEMENT & REWARDS */}
          {activeSubTab === 'engagement' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              
              {/* Satisfaction Score progress circle */}
              <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-2xl p-5 flex flex-col items-center justify-center text-center">
                <h3 className="text-[11px] font-black text-slate-850 dark:text-white uppercase tracking-widest self-start mb-4">
                  Workforce Engagement Index
                </h3>
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="64" cy="64" r="54" className="stroke-slate-100 dark:stroke-slate-800 fill-none" strokeWidth="6"/>
                    <circle 
                      cx="64" 
                      cy="64" 
                      r="54" 
                      className="stroke-violet-600 fill-none transition-all duration-1000" 
                      strokeWidth="6"
                      strokeDasharray={339.29}
                      strokeDashoffset={339.29 - (339.29 * satisfactionScore) / 100}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-slate-800 dark:text-white">{satisfactionScore}%</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Satisfaction</span>
                  </div>
                </div>
                <p className="text-[9px] text-slate-450 mt-4 leading-relaxed">Engagement ratios are based on employee survey completions, DSR participation, and recognition nominations.</p>
              </div>

              {/* Birthdays & Anniversaries logs */}
              <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                <h3 className="text-[11px] font-black text-slate-850 dark:text-white uppercase tracking-widest mb-3">
                  Work Anniversaries &amp; Birthdays
                </h3>
                <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                  {birthdaysList.length === 0 && anniversariesList.length === 0 ? (
                    <div className="py-8 text-center text-slate-450 text-[10px]">No upcoming events for the period.</div>
                  ) : (
                    <>
                      {birthdaysList.map((b: any, idx: number) => (
                        <div key={`b-${idx}`} className="flex justify-between items-center p-2 bg-blue-500/5 border border-blue-500/10 rounded-xl text-[9px]">
                          <span className="font-black text-slate-850 dark:text-white">{b.name}</span>
                          <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-blue-500/10 text-blue-600">Birthday on {new Date(b.date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</span>
                        </div>
                      ))}
                      {anniversariesList.map((ann: any, idx: number) => (
                        <div key={`ann-${idx}`} className="flex justify-between items-center p-2 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-[9px]">
                          <span className="font-black text-slate-850 dark:text-white">{ann.name}</span>
                          <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-emerald-500/10 text-emerald-600">Anniversary: {new Date(ann.date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <div className="p-3 lg:p-4 max-w-7xl mx-auto space-y-3.5 min-h-screen text-slate-800 dark:text-slate-200">
      
      {/* Dashboard Header — Ultra Premium Redesign */}
      <div className="relative z-30 mb-4">
        <div className={cn(
          "relative flex flex-col lg:flex-row lg:items-center justify-between gap-4 px-6 py-5 rounded-3xl overflow-visible transition-all duration-300",
          "bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl",
          "border border-slate-200/60 dark:border-slate-800/80",
          "shadow-[0_8px_32px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.25)]"
        )}>
          {/* Top highlight gradient border */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500 rounded-t-3xl" />

          {/* Mesh gradient blobs */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
            <div className={cn("absolute -top-12 -left-12 w-48 h-48 rounded-full blur-3xl opacity-[0.06]", role === 'HR' ? 'bg-violet-500' : 'bg-blue-500')} />
            <div className="absolute -bottom-8 right-24 w-40 h-40 rounded-full bg-emerald-400 blur-3xl opacity-[0.04]" />
          </div>

          {/* ── Left: Brand Identity Block ── */}
          <div className="flex items-center gap-4 min-w-0 relative">
            {/* Icon badge */}
            <div className="relative flex-shrink-0">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center shadow-md relative overflow-hidden",
                role === 'HR'
                  ? "bg-gradient-to-br from-violet-500 via-violet-600 to-indigo-700 shadow-violet-500/10"
                  : "bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-600 shadow-blue-500/10"
              )}>
                <div className="absolute inset-0 opacity-30" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 60%)' }} />
                {role === 'HR'
                  ? <Users className="w-5.5 h-5.5 text-white relative z-10 drop-shadow-sm" />
                  : <Briefcase className="w-5.5 h-5.5 text-white relative z-10 drop-shadow-sm" />
                }
              </div>
              {/* Live dot */}
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900 shadow-md shadow-emerald-500/30" />
              </span>
            </div>

            {/* Title & meta */}
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className={cn(
                  "text-[19px] font-black tracking-tight leading-none font-outfit bg-clip-text text-transparent",
                  role === 'HR'
                    ? "bg-gradient-to-r from-violet-900 via-indigo-600 to-violet-900 dark:from-violet-400 dark:via-indigo-300 dark:to-violet-400"
                    : "bg-gradient-to-r from-blue-900 via-cyan-600 to-blue-900 dark:from-blue-400 dark:via-cyan-300 dark:to-blue-400"
                )}>
                  {role === 'HR' ? 'HR Operations Center' : 'Company Command Center'}
                </h1>
              </div>
              <div className="flex items-center gap-2 mt-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                <span>
                  {role === 'HR' ? '👋 Welcome back,' : '👋 Welcome,'}&nbsp;
                  <span className="text-slate-800 dark:text-slate-200 font-extrabold">
                    {role === 'HR' ? 'HR Manager' : (role.toLowerCase().endsWith('admin') ? role : `${role} Admin`)}
                  </span>
                </span>
                <span className="text-slate-300 dark:text-slate-700 font-normal">|</span>
                <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-black">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                  Live System
                </span>
              </div>
            </div>
          </div>

          {/* ── Right: Controls Toolbar ── */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Branch Selector */}
            <div ref={branchDropdownRef} className="relative">
              <button
                disabled={isBranchLocked}
                onClick={() => setIsBranchDropdownOpen(!isBranchDropdownOpen)}
                className={cn(
                  "group flex h-8.5 items-center gap-2.5 px-3.5 rounded-xl border text-[8.5px] font-extrabold uppercase tracking-wider transition-all duration-200 select-none shadow-sm",
                  "bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm",
                  isBranchLocked
                    ? "opacity-60 cursor-default text-slate-400"
                    : "hover:bg-white dark:hover:bg-slate-800 hover:border-blue-400/40 hover:text-slate-900 dark:hover:text-white cursor-pointer active:scale-[0.98] text-slate-650 dark:text-slate-300"
                )}
              >
                <Building2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span className="truncate max-w-[120px]">
                  {branches.find((b: any) => b._id === selectedBranchId)?.branchName || 'All Branches'}
                </span>
                {!isBranchLocked && (
                  <ChevronDown className={cn("w-3 h-3 text-slate-400 transition-transform duration-200 ml-0.5", isBranchDropdownOpen && "rotate-180")} />
                )}
              </button>

              <AnimatePresence>
                {isBranchDropdownOpen && !isBranchLocked && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 4 }}
                    transition={{ duration: 0.12, ease: "easeOut" }}
                    className="absolute left-0 top-full mt-2 z-[999] min-w-[175px] bg-white/95 dark:bg-slate-950/95 border border-slate-200/50 dark:border-slate-800/80 shadow-[0_12px_32px_-4px_rgba(0,0,0,0.1)] dark:shadow-[0_12px_32px_-4px_rgba(0,0,0,0.35)] rounded-2xl p-1.5 backdrop-blur-xl"
                  >
                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 px-2.5 py-1.5">Office Branches</p>
                    <button
                      onClick={() => { setSelectedBranch(null); setIsBranchDropdownOpen(false); }}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all duration-150 cursor-pointer border-0 outline-none bg-transparent text-left active:scale-[0.98]",
                        selectedBranchId === ''
                          ? "bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                          : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/50"
                      )}
                    >
                      <span>All Office Branches</span>
                      {selectedBranchId === '' && <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />}
                    </button>
                    {branches.map((b: any) => (
                      <button
                        key={b._id}
                        onClick={() => { setSelectedBranch({ id: b._id, name: b.branchName }); setIsBranchDropdownOpen(false); }}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all duration-150 cursor-pointer border-0 outline-none bg-transparent text-left active:scale-[0.98]",
                          selectedBranchId === b._id
                            ? "bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                            : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/50"
                        )}
                      >
                        <span className="truncate">{b.branchName}</span>
                        {selectedBranchId === b._id && <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>


            {/* Ultra Premium Export Popover */}
            <div className="relative" ref={typeMenuRef}>
              <button
                onClick={() => setIsTypeMenuOpen(!isTypeMenuOpen)}
                className={cn(
                  "group flex h-8.5 items-center gap-2 px-3.5 rounded-xl border text-[8.5px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-sm select-none",
                  isTypeMenuOpen
                    ? "bg-slate-100 dark:bg-slate-800 border-blue-500/45 text-blue-600 dark:text-blue-400"
                    : "bg-slate-50/70 hover:bg-white dark:bg-slate-800/40 dark:hover:bg-slate-800 border-slate-200/50 dark:border-slate-700/50 text-slate-650 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                <FileDown className="w-3.5 h-3.5 text-blue-500 group-hover:scale-110 transition-transform duration-200" />
                <span>Export Report</span>
                <ChevronDown className={cn("w-3 h-3 text-slate-400 transition-transform duration-200 ml-0.5", isTypeMenuOpen && "rotate-180")} />
              </button>

              <AnimatePresence>
                {isTypeMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 4 }}
                    transition={{ duration: 0.12, ease: "easeOut" }}
                    className="absolute right-0 top-full mt-2 z-[999] w-[260px] bg-white/98 dark:bg-slate-950/98 border border-slate-200/60 dark:border-slate-800/80 shadow-[0_16px_36px_-6px_rgba(0,0,0,0.12)] dark:shadow-[0_16px_36px_-6px_rgba(0,0,0,0.45)] rounded-2xl p-4 backdrop-blur-xl space-y-4"
                  >
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">1. Select Data Type</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {(['workforce', 'attendance', 'leaves', 'payroll'] as const).map((t) => (
                          <button
                            key={t}
                            onClick={() => setSelectedExportType(t)}
                            className={cn(
                              "flex flex-col items-start p-2 rounded-xl border text-[10px] font-bold transition-all duration-150 cursor-pointer text-left active:scale-[0.97]",
                              selectedExportType === t
                                ? "bg-blue-50/50 dark:bg-blue-950/30 border-blue-500/50 text-blue-600 dark:text-blue-400"
                                : "bg-transparent border-slate-100 dark:border-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/50"
                            )}
                          >
                            <span className="capitalize">{t}</span>
                            <span className="text-[7.5px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">
                              {t === 'workforce' && 'Employees info'}
                              {t === 'attendance' && 'Daily logs'}
                              {t === 'leaves' && 'Requests & stats'}
                              {t === 'payroll' && 'Salary slips'}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">2. Choose Format</p>
                      <div className="flex bg-slate-50 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-100 dark:border-slate-800">
                        {(['csv', 'excel', 'pdf'] as const).map((fmt) => (
                          <button
                            key={fmt}
                            onClick={() => setSelectedExportFormat(fmt)}
                            className={cn(
                              "flex-1 py-1 rounded-md text-[9px] font-black uppercase tracking-wider text-center transition-all cursor-pointer",
                              selectedExportFormat === fmt
                                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-bold"
                                : "text-slate-500 hover:text-slate-855 dark:hover:text-slate-200"
                            )}
                          >
                            {fmt === 'excel' ? 'Excel' : fmt.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        handleExportReport();
                        setIsTypeMenuOpen(false);
                      }}
                      disabled={isExporting}
                      className="w-full flex h-9 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-700 text-white text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-60 cursor-pointer border-none active:scale-[0.98] shadow-md shadow-blue-500/10"
                    >
                      {isExporting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <FileDown className="w-4 h-4" />
                          <span>Download Report</span>
                        </>
                      )}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Utility icon cluster - Circular Separated glass design */}
            <div className="flex items-center gap-2 ml-1">
              {/* Search */}
              <button
                type="button"
                onClick={onOpenSearch}
                title="Search Workspace (Ctrl+K)"
                className="group flex h-8.5 w-8.5 items-center justify-center rounded-xl bg-slate-50/70 hover:bg-white dark:bg-slate-800/40 dark:hover:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 transition-all duration-200 cursor-pointer active:scale-95 shadow-sm"
              >
                <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 transition-all duration-200 group-hover:scale-110" />
              </button>

              {/* Settings */}
              <button
                type="button"
                onClick={() => setCurrentPage && setCurrentPage('settings')}
                title="Settings"
                className="group flex h-8.5 w-8.5 items-center justify-center rounded-xl bg-slate-50/70 hover:bg-white dark:bg-slate-800/40 dark:hover:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 transition-all duration-200 cursor-pointer active:scale-95 shadow-sm"
              >
                <Settings className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-100 group-hover:rotate-45 transition-all duration-300" />
              </button>

              {/* Email */}
              <button
                type="button"
                onClick={() => setIsEmailModalOpen(true)}
                title="System Inbox"
                className="group flex h-8.5 w-8.5 items-center justify-center rounded-xl bg-slate-50/70 hover:bg-white dark:bg-slate-800/40 dark:hover:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 transition-all duration-200 cursor-pointer active:scale-95 shadow-sm"
              >
                <Mail className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 transition-all duration-200 group-hover:scale-110" />
              </button>

              {/* Notification bell */}
              <div className="relative">
                <NotificationBellDropdown
                  onNavigate={(page) => setCurrentPage && setCurrentPage(page)}
                  triggerClassName="group flex h-8.5 w-8.5 items-center justify-center rounded-xl bg-slate-50/70 hover:bg-white dark:bg-slate-800/40 dark:hover:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 transition-all duration-200 cursor-pointer active:scale-95 shadow-sm text-slate-400 hover:text-slate-900 dark:hover:text-white"
                />
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Sub-Tab Navigation Bar */}
      <div className="premium-nav-container scrollbar-none z-20 relative print:hidden mt-2">
        {subTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={cn(
                "premium-nav-item active:scale-[0.98]",
                isActive ? "premium-nav-item-active" : ""
              )}
            >
              <Icon className="w-3 h-3 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {isAdmin ? renderAdminDashboard() : renderHrDashboard()}

      {/* Floating AI widget at the bottom */}
      <HrAdminAiAssistant onCommandExecuted={handleCopilotCommand} />

      <EmailLogModal isOpen={isEmailModalOpen} onClose={() => setIsEmailModalOpen(false)} />
    </div>
  );
}
