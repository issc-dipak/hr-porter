"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Shield, Plus, Search, Filter, Calendar, User, 
  CheckCircle, AlertCircle, BookOpen, Sparkles, Loader2, RefreshCw,
  Users, CheckSquare, X, ChevronRight, FileText, Trash2, Clock, 
  Layers, CheckSquare2, FileCheck, ArrowLeft, History, Undo, ArrowRight,
  TrendingUp, BarChart3, PieChart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";
import { PastelStatCard } from '@/components/ui/PastelStatCard';

interface IPolicy {
  _id: string;
  title: string;
  category: string;
  description: string;
  content: string;
  effectiveDate: string;
  expiryDate?: string;
  visibilityScope: 'Entire Company' | 'Department Specific' | 'HR Only' | 'Leadership Only';
  targetDepartments: string[];
  status: 'Draft' | 'Under Review' | 'Approved' | 'Published' | 'Archived' | 'Expired';
  currentVersion: string;
  attachments: { name: string; url: string }[];
  createdAt: string;
  updatedAt: string;
}

interface IComplianceDetail {
  id: string;
  title: string;
  category: string;
  version: string;
  visibilityScope: string;
  targetCount: number;
  acknowledgedCount: number;
  complianceRate: number;
  acknowledgedList: {
    id: string;
    name: string;
    email: string;
    department: string;
    acknowledgedAt: string;
  }[];
  pendingList: {
    id: string;
    name: string;
    email: string;
    department: string;
  }[];
}

const CATEGORIES = [
  'Attendance Policy',
  'Leave Policy',
  'Payroll Policy',
  'Work From Home Policy',
  'IT & Security Policy',
  'Code Of Conduct',
  'Recruitment Policy',
  'Performance Policy',
  'Expense & Reimbursement Policy',
  'Resignation & Offboarding Policy'
];

const DEPARTMENTS = ['Engineering', 'Design', 'HR', 'Marketing', 'Sales', 'Finance'];

export default function CompanyPoliciesPage() {
  const [policies, setPolicies] = useState<IPolicy[]>([]);
  const [complianceData, setComplianceData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Search & Filter
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals & Panels
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<IPolicy | null>(null);
  const [showHistoryPanel, setShowHistoryPanel] = useState<IPolicy | null>(null);
  const [showCompliancePanel, setShowCompliancePanel] = useState<IComplianceDetail | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    category: 'Attendance Policy',
    description: '',
    content: '',
    effectiveDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    visibilityScope: 'Entire Company' as any,
    targetDepartments: [] as string[],
    status: 'Draft' as any,
    attachments: [] as { name: string; url: string }[],
    changeSummary: '',
    versionIncrement: 'minor' // minor or major
  });

  const [newAttachmentName, setNewAttachmentName] = useState('');
  const [newAttachmentUrl, setNewAttachmentUrl] = useState('');

  // Version History State
  const [historicalVersions, setHistoricalVersions] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    fetchPoliciesAndCompliance();
  }, []);

  const fetchPoliciesAndCompliance = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('hr_system_token');
      const headers = { 'Authorization': `Bearer ${token}` };

      // 1. Fetch policies
      const policyRes = await fetch('/api/policies', { headers });
      if (policyRes.ok) {
        const data = await policyRes.json();
        setPolicies(data);
      }

      // 2. Fetch compliance reports
      const complianceRes = await fetch('/api/policies/compliance', { headers });
      if (complianceRes.ok) {
        const data = await complianceRes.json();
        setComplianceData(data);
      }
    } catch (error) {
      console.error('Error loading policy data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAddDrawer = () => {
    setEditingPolicy(null);
    setFormData({
      title: '',
      category: 'Attendance Policy',
      description: '',
      content: '',
      effectiveDate: new Date().toISOString().split('T')[0],
      expiryDate: '',
      visibilityScope: 'Entire Company',
      targetDepartments: [],
      status: 'Draft',
      attachments: [],
      changeSummary: 'Initial creation',
      versionIncrement: 'minor'
    });
    setShowAddDrawer(true);
  };

  const handleOpenEditDrawer = (policy: IPolicy) => {
    setEditingPolicy(policy);
    setFormData({
      title: policy.title,
      category: policy.category,
      description: policy.description || '',
      content: policy.content || '',
      effectiveDate: policy.effectiveDate ? new Date(policy.effectiveDate).toISOString().split('T')[0] : '',
      expiryDate: policy.expiryDate ? new Date(policy.expiryDate).toISOString().split('T')[0] : '',
      visibilityScope: policy.visibilityScope,
      targetDepartments: policy.targetDepartments || [],
      status: policy.status,
      attachments: policy.attachments || [],
      changeSummary: '',
      versionIncrement: 'minor'
    });
    setShowAddDrawer(true);
  };

  const handleOpenHistoryPanel = async (policy: IPolicy) => {
    setShowHistoryPanel(policy);
    setIsLoadingHistory(true);
    try {
      const token = localStorage.getItem('hr_system_token');
      const res = await fetch(`/api/policies/${policy._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHistoricalVersions(data.versions || []);
        setAuditLogs(data.auditLogs || []);
      }
    } catch (error) {
      console.error('Error fetching version history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleOpenCompliance = (policy: IPolicy) => {
    if (!complianceData) return;
    const detail = complianceData.policiesCompliance?.find((pc: any) => pc.id === policy._id);
    if (detail) {
      setShowCompliancePanel(detail);
    } else {
      // Mock detail structure if compliance metrics are missing or not published
      setShowCompliancePanel({
        id: policy._id,
        title: policy.title,
        category: policy.category,
        version: policy.currentVersion,
        visibilityScope: policy.visibilityScope,
        targetCount: 0,
        acknowledgedCount: 0,
        complianceRate: 0,
        acknowledgedList: [],
        pendingList: []
      });
    }
  };

  const handleSavePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.category || !formData.effectiveDate) return;

    try {
      const token = localStorage.getItem('hr_system_token');
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const url = editingPolicy 
        ? `/api/policies/${editingPolicy._id}`
        : '/api/policies';

      const method = editingPolicy ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setShowAddDrawer(false);
        fetchPoliciesAndCompliance();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save policy');
      }
    } catch (err) {
      console.error('Failed to submit policy:', err);
    }
  };

  const handleDeletePolicy = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this policy? This action deletes all historical versions and acknowledgement compliance data.')) return;
    try {
      const token = localStorage.getItem('hr_system_token');
      const res = await fetch(`/api/policies/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchPoliciesAndCompliance();
        if (showHistoryPanel && showHistoryPanel._id === id) setShowHistoryPanel(null);
        if (showCompliancePanel && showCompliancePanel.id === id) setShowCompliancePanel(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRollback = async (versionStr: string) => {
    if (!showHistoryPanel) return;
    if (!window.confirm(`Are you sure you want to rollback the active content of "${showHistoryPanel.title}" to version ${versionStr}? This will create a new incremental version revision.`)) return;

    try {
      const token = localStorage.getItem('hr_system_token');
      const res = await fetch(`/api/policies/${showHistoryPanel._id}/rollback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ versionNumber: versionStr })
      });

      if (res.ok) {
        setShowHistoryPanel(null);
        fetchPoliciesAndCompliance();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to rollback version');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddAttachment = () => {
    if (!newAttachmentName || !newAttachmentUrl) return;
    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, { name: newAttachmentName, url: newAttachmentUrl }]
    }));
    setNewAttachmentName('');
    setNewAttachmentUrl('');
  };

  const handleRemoveAttachment = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== idx)
    }));
  };

  const toggleDeptTarget = (dept: string) => {
    setFormData(prev => {
      const targets = prev.targetDepartments.includes(dept)
        ? prev.targetDepartments.filter(d => d !== dept)
        : [...prev.targetDepartments, dept];
      return { ...prev, targetDepartments: targets };
    });
  };

  const filteredPolicies = policies.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || 
                          p.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = catFilter === 'All' || p.category === catFilter;
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const sum = complianceData?.summary || {
    totalPolicies: 0,
    draftCount: 0,
    publishedCount: 0,
    expiredCount: 0,
    underReviewCount: 0,
    totalEmployees: 0,
    pendingAcknowledgements: 0,
    acknowledgedCount: 0,
    overallComplianceRate: 0
  };

  return (
    <div className="p-4 sm:p-5 lg:p-6 max-w-7xl mx-auto space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-500 shrink-0" />
            <h1 className="text-xl sm:text-2xl font-black text-slate-905 dark:text-white tracking-tight uppercase font-outfit">Governance & Policies</h1>
          </div>
          <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
            Draft, publish, and track employee compliance on corporate rules, safety standards and organizational handbooks.
          </p>
        </div>

        <div className="flex gap-3 w-full sm:w-auto">
          <button 
            onClick={fetchPoliciesAndCompliance}
            className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 active:scale-95 transition-all shadow-sm cursor-pointer shrink-0"
          >
            <RefreshCw className="w-4.5 h-4.5" />
          </button>
          <button 
            onClick={handleOpenAddDrawer}
            className="saas-btn-primary cursor-pointer flex-1 sm:flex-none justify-center"
          >
            <Plus className="w-4 h-4" /> Create Policy
          </button>
        </div>
      </div>

      {/* Analytics widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 text-left">
        {[
          { label: 'Total policies', value: sum.totalPolicies, icon: Shield, accent: '#3B82F6', sub: 'All governance rules' },
          { label: 'Published', value: sum.publishedCount, icon: CheckCircle, accent: '#10B981', sub: 'Active & enforceable' },
          { label: 'Draft & review', value: sum.draftCount + sum.underReviewCount, icon: Clock, accent: '#F59E0B', sub: 'Awaiting approvals' },
          { label: 'Pending Acks', value: sum.pendingAcknowledgements, icon: AlertCircle, accent: '#F43F5E', sub: 'Awaiting signatures' },
          { label: 'Compliance Rate', value: `${sum.overallComplianceRate}%`, icon: TrendingUp, accent: '#10B981', sub: 'Target pool compliance' }
        ].map((stat, idx) => (
          <PastelStatCard key={idx} icon={stat.icon} label={stat.label} value={stat.value} sub={stat.sub} accent={stat.accent} />
        ))}
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
        <div className="flex-1 w-full md:max-w-md">
          <input 
            type="text" 
            placeholder="Search policies by title, description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="saas-input w-full pr-4 py-2 text-xs"
          />
        </div>

        <div className="flex gap-3 flex-wrap">
          <select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            className="saas-input py-1.5 px-3 text-xs bg-transparent border-slate-200 dark:border-slate-800 cursor-pointer"
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="saas-input py-1.5 px-3 text-xs bg-transparent border-slate-200 dark:border-slate-800 cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Under Review">Under Review</option>
            <option value="Approved">Approved</option>
            <option value="Published">Published</option>
            <option value="Archived">Archived</option>
            <option value="Expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Main Grid: Policy Cards */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Loading Governance Policies...</p>
        </div>
      ) : filteredPolicies.length === 0 ? (
        <div className="saas-card py-20 flex flex-col items-center justify-center text-center max-w-lg mx-auto">
          <Shield className="w-12 h-12 text-slate-355 dark:text-slate-700 mb-4 animate-pulse" />
          <h3 className="text-sm font-black text-slate-750 dark:text-slate-300 uppercase tracking-wider">No Policies Found</h3>
          <p className="text-xs text-slate-400 mt-2 px-6">
            Create compliance handbook templates, publish draft documents, or refine active search filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPolicies.map((policy) => {
            const detail = complianceData?.policiesCompliance?.find((pc: any) => pc.id === policy._id);
            const complianceRate = detail ? detail.complianceRate : 0;

            return (
              <div 
                key={policy._id}
                className="saas-card p-5 flex flex-col justify-between hover:border-slate-300/40 dark:hover:border-slate-700/60 transition-all duration-300 relative group overflow-hidden"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={cn(
                      "px-2 py-0.5 rounded-lg text-[8px] font-black uppercase border tracking-wider",
                      policy.status === 'Published' ? "bg-emerald-950/80 border-emerald-500/20 text-emerald-400" :
                      policy.status === 'Draft' ? "bg-slate-800 border-slate-700 text-slate-400" :
                      policy.status === 'Under Review' ? "bg-amber-955/80 border-amber-500/20 text-amber-400" :
                      "bg-blue-955/80 border-blue-500/20 text-blue-400"
                    )}>
                      {policy.status}
                    </span>

                    <span className="text-[10px] text-slate-400 font-bold">
                      v{policy.currentVersion}
                    </span>
                  </div>

                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight font-outfit line-clamp-1 mb-1">
                    {policy.title}
                  </h3>
                  <p className="text-[9px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3 leading-none">
                    {policy.category}
                  </p>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-4">
                    {policy.description || 'No description provided.'}
                  </p>

                  {/* Compliance Progress (Only for Published policies) */}
                  {policy.status === 'Published' && (
                    <div className="space-y-2 mb-4 bg-slate-50 dark:bg-slate-950/30 p-3 rounded-xl border border-slate-100 dark:border-slate-850">
                      <div className="flex items-center justify-between text-[9px] font-extrabold uppercase tracking-wider">
                        <span className="text-slate-400">Compliance Rate</span>
                        <span className={cn(
                          complianceRate >= 90 ? "text-emerald-500" :
                          complianceRate >= 50 ? "text-amber-500" : "text-rose-500"
                        )}>
                          {complianceRate}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            complianceRate >= 90 ? "bg-emerald-500" :
                            complianceRate >= 50 ? "bg-amber-500" : "bg-rose-500"
                          )}
                          style={{ width: `${complianceRate}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[8px] text-slate-400 font-bold uppercase leading-none">
                        <span>{detail?.acknowledgedCount || 0} signed</span>
                        <span>{detail?.targetCount || 0} target</span>
                      </div>
                    </div>
                  )}

                  {/* Policy Scope Details */}
                  <div className="grid grid-cols-2 gap-2 text-[9px] font-bold text-slate-450 uppercase mb-4 pt-3 border-t border-slate-100 dark:border-slate-850">
                    <div>
                      <span className="text-slate-400 block text-[8px] font-black tracking-wider leading-none">Visibility</span>
                      <span className="truncate block mt-1">{policy.visibilityScope}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[8px] font-black tracking-wider leading-none">Effective Date</span>
                      <span className="truncate block mt-1">{new Date(policy.effectiveDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-850 pt-3 flex gap-2 w-full">
                  <button 
                    onClick={() => handleOpenEditDrawer(policy)}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-805 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer border-none"
                  >
                    Edit
                  </button>

                  <button 
                    onClick={() => handleOpenHistoryPanel(policy)}
                    className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-805 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl transition-all cursor-pointer border-none"
                    title="Version History"
                  >
                    <History className="w-3.5 h-3.5" />
                  </button>

                  {policy.status === 'Published' && (
                    <button 
                      onClick={() => handleOpenCompliance(policy)}
                      className="p-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 dark:text-blue-400 rounded-xl transition-all cursor-pointer border-none"
                      title="Compliance Log"
                    >
                      <Users className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button 
                    onClick={() => handleDeletePolicy(policy._id)}
                    className="p-2 bg-rose-600/10 hover:bg-rose-605/20 text-rose-500 rounded-xl transition-all cursor-pointer border-none"
                    title="Delete Policy"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Drawer Panel */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showAddDrawer && (
          <div className="fixed inset-0 z-[9999] bg-slate-950/60 flex items-center justify-end p-0">
            {/* Backdrop click */}
            <div className="absolute inset-0" onClick={() => setShowAddDrawer(false)} />
            
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="bg-white dark:bg-slate-900 w-full max-w-xl h-full shadow-2xl relative border-l border-slate-100 dark:border-slate-800 flex flex-col justify-between"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-850 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-black text-slate-909 dark:text-white uppercase tracking-tight font-outfit">
                    {editingPolicy ? 'Update Policy' : 'Create Company Policy'}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5 tracking-wider">
                    {editingPolicy ? `Currently editing version ${editingPolicy.currentVersion}` : 'Draft new organizational guidelines'}
                  </p>
                </div>
                <button 
                  onClick={() => setShowAddDrawer(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 border-none cursor-pointer bg-transparent"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSavePolicy} className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Policy Title *</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="saas-input w-full px-3 py-2.5 text-xs" 
                    placeholder="e.g., Code of Conduct / Leave Carry Forward Rule"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Category *</label>
                    <select 
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="saas-input w-full px-3 py-2.5 text-xs cursor-pointer"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Status *</label>
                    <select 
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="saas-input w-full px-3 py-2.5 text-xs cursor-pointer"
                    >
                      <option value="Draft">Draft</option>
                      <option value="Under Review">Under Review</option>
                      <option value="Approved">Approved</option>
                      <option value="Published">Published</option>
                      <option value="Archived">Archived</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Short Description</label>
                  <textarea 
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="saas-input w-full px-3 py-2 text-xs h-16 resize-none" 
                    placeholder="Provide a quick summary of the policy rules..."
                  />
                </div>

                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Visibility Scope *</label>
                  <select 
                    value={formData.visibilityScope}
                    onChange={(e) => setFormData({ ...formData, visibilityScope: e.target.value as any })}
                    className="saas-input w-full px-3 py-2.5 text-xs cursor-pointer"
                  >
                    <option value="Entire Company">Entire Company</option>
                    <option value="Department Specific">Department Specific</option>
                    <option value="HR Only">HR Only</option>
                    <option value="Leadership Only">Leadership Only</option>
                  </select>
                </div>

                {formData.visibilityScope === 'Department Specific' && (
                  <div className="bg-slate-50 dark:bg-slate-950 p-4 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-2">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-2">Target Departments *</p>
                    <div className="grid grid-cols-3 gap-2">
                      {DEPARTMENTS.map(dept => {
                        const active = formData.targetDepartments.includes(dept);
                        return (
                          <button
                            type="button"
                            key={dept}
                            onClick={() => toggleDeptTarget(dept)}
                            className={cn(
                              "py-1.5 px-2 rounded-xl text-[9px] font-extrabold uppercase transition-all cursor-pointer border",
                              active 
                                ? "bg-blue-600/10 border-blue-500/30 text-blue-600 dark:text-blue-400" 
                                : "bg-white dark:bg-slate-900 border-slate-205 dark:border-slate-800 text-slate-500"
                            )}
                          >
                            {dept}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Effective Date *</label>
                    <input 
                      type="date" 
                      required 
                      value={formData.effectiveDate}
                      onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                      className="saas-input w-full px-3 py-2 text-xs" 
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Expiry Date (Optional)</label>
                    <input 
                      type="date" 
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                      className="saas-input w-full px-3 py-2 text-xs" 
                    />
                  </div>
                </div>

                {/* Content Editor */}
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Policy Content (Markdown / Rich Text Editor) *</label>
                  <textarea 
                    required
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="saas-input w-full p-4 text-xs h-64 font-mono leading-relaxed" 
                    placeholder="# Working Hours Policy&#10;&#10;Standard shifts are 9 hours including lunch.&#10;&#10;## Shift Timings&#10;- Morning Shift: 9:00 AM to 6:00 PM&#10;- Evening Shift: 2:00 PM to 11:00 PM"
                  />
                </div>

                {/* Attachments Section */}
                <div className="bg-slate-50 dark:bg-slate-950 p-4 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-3">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Attachments</p>
                  
                  {formData.attachments.length > 0 && (
                    <div className="space-y-2">
                      {formData.attachments.map((file, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-805 p-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300">
                          <span className="truncate max-w-[70%]">{file.name}</span>
                          <button 
                            type="button" 
                            onClick={() => handleRemoveAttachment(idx)}
                            className="text-rose-500 hover:text-rose-600 transition-colors p-1 bg-transparent border-none cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <input 
                      type="text" 
                      placeholder="Attachment Name" 
                      value={newAttachmentName}
                      onChange={(e) => setNewAttachmentName(e.target.value)}
                      className="saas-input px-2 py-1.5 text-[10px]"
                    />
                    <input 
                      type="text" 
                      placeholder="URL (e.g. Google Drive / S3)" 
                      value={newAttachmentUrl}
                      onChange={(e) => setNewAttachmentUrl(e.target.value)}
                      className="saas-input px-2 py-1.5 text-[10px]"
                    />
                  </div>
                  <button 
                    type="button" 
                    onClick={handleAddAttachment}
                    className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-705 dark:text-slate-300 rounded-xl text-[8px] font-black uppercase tracking-wider transition-all cursor-pointer border border-slate-205 dark:border-slate-800"
                  >
                    Add Attachment
                  </button>
                </div>

                {editingPolicy && (
                  <div className="bg-blue-500/5 p-4 border border-blue-500/10 rounded-2xl space-y-3">
                    <p className="text-[9px] font-black text-blue-500 uppercase tracking-wider">Revision History Metadata</p>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Version Revision</label>
                        <select 
                          value={formData.versionIncrement}
                          onChange={(e) => setFormData({ ...formData, versionIncrement: e.target.value })}
                          className="saas-input w-full px-2 py-1.5 text-[10px] cursor-pointer"
                        >
                          <option value="minor">Minor Increment (+0.1)</option>
                          <option value="major">Major Increment (+1.0)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Change Summary *</label>
                        <input 
                          type="text" 
                          required={editingPolicy && formData.content !== editingPolicy.content}
                          value={formData.changeSummary}
                          onChange={(e) => setFormData({ ...formData, changeSummary: e.target.value })}
                          className="saas-input w-full px-2 py-1.5 text-[10px]"
                          placeholder="e.g. Updated holiday dates"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </form>

              {/* Action buttons */}
              <div className="p-6 border-t border-slate-100 dark:border-slate-850 flex gap-4 bg-white dark:bg-slate-900 z-10">
                <button 
                  type="button" 
                  onClick={() => setShowAddDrawer(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-805 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer border-none"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={handleSavePolicy}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-md shadow-blue-500/10 border-none"
                >
                  {editingPolicy ? 'Update Policy' : 'Publish Policy'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>,
        document.body
      )}

      {/* Version History Drawer Panel */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showHistoryPanel && (
          <div className="fixed inset-0 z-[9999] bg-slate-950/60 flex items-center justify-end p-0">
            <div className="absolute inset-0" onClick={() => setShowHistoryPanel(null)} />
            
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="bg-white dark:bg-slate-900 w-full max-w-xl h-full shadow-2xl relative border-l border-slate-105 dark:border-slate-800 flex flex-col justify-between"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-850 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight font-outfit">Version History</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5 tracking-wider">
                    {showHistoryPanel.title}
                  </p>
                </div>
                <button 
                  onClick={() => setShowHistoryPanel(null)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 border-none cursor-pointer bg-transparent"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Version History & Audits Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
                {isLoadingHistory ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-450">Loading History...</p>
                  </div>
                ) : (
                  <>
                    {/* Versions list */}
                    <div className="space-y-4">
                      <p className="text-[9px] font-black text-slate-450 uppercase tracking-widest">Revisions Timeline</p>
                      
                      <div className="relative pl-6 border-l border-slate-200 dark:border-slate-800 ml-3 space-y-6">
                        {historicalVersions.map((ver, idx) => {
                          const isActive = ver.version === showHistoryPanel.currentVersion;
                          return (
                            <div key={ver._id} className="relative">
                              {/* Dot marker */}
                              <div className={cn(
                                "absolute -left-[31px] top-1 w-3 h-3 rounded-full border-2 bg-white dark:bg-slate-900",
                                isActive ? "border-blue-500 scale-125" : "border-slate-350 dark:border-slate-700"
                              )} />

                              <div className="bg-slate-50 dark:bg-slate-955/40 p-4 border border-slate-100 dark:border-slate-850 rounded-2xl flex flex-col justify-between gap-3">
                                <div>
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-black text-slate-900 dark:text-white uppercase">
                                      Version {ver.version}
                                    </span>
                                    
                                    {isActive && (
                                      <span className="px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:bg-blue-500/5 dark:text-blue-400 text-[8px] font-black uppercase tracking-wider rounded border border-blue-500/15">
                                        Active
                                      </span>
                                    )}
                                  </div>

                                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold italic">
                                    "{ver.changeSummary || 'No summary provided.'}"
                                  </p>

                                  <div className="flex items-center gap-4 text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-2.5">
                                    <span>By {ver.modifiedBy}</span>
                                    <span>{new Date(ver.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                                  </div>
                                </div>

                                {!isActive && (
                                  <button
                                    onClick={() => handleRollback(ver.version)}
                                    className="w-fit px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer border-none"
                                  >
                                    <Undo className="w-3 h-3" /> Rollback to this version
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Audit Logs Section */}
                    <div className="space-y-4 border-t border-slate-100 dark:border-slate-850 pt-6">
                      <p className="text-[9px] font-black text-slate-450 uppercase tracking-widest">Audit Trails</p>
                      
                      <div className="space-y-3.5">
                        {auditLogs.map((log) => (
                          <div key={log._id} className="flex justify-between items-start gap-4 text-xs bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 p-3.5 rounded-2xl">
                            <div className="space-y-1">
                              <span className={cn(
                                "px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border mr-2",
                                log.action === 'Published' || log.action === 'Approved' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" :
                                log.action === 'Created' ? "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400" :
                                log.action === 'Rollback' ? "bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400" :
                                "bg-slate-500/10 border-slate-500/20 text-slate-500"
                              )}>
                                {log.action}
                              </span>
                              
                              <p className="text-[10.5px] font-semibold text-slate-600 dark:text-slate-350 leading-relaxed mt-1">
                                {log.details}
                              </p>

                              <div className="flex gap-3 text-[9px] text-slate-400 font-bold uppercase mt-1">
                                <span>{log.user} ({log.role})</span>
                              </div>
                            </div>
                            
                            <span className="text-[8.5px] text-slate-405 font-bold uppercase shrink-0">
                              {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Action buttons */}
              <div className="p-6 border-t border-slate-100 dark:border-slate-805 bg-white dark:bg-slate-900 z-10">
                <button 
                  type="button" 
                  onClick={() => setShowHistoryPanel(null)}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-805 dark:hover:bg-slate-800 text-slate-705 dark:text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer border-none"
                >
                  Close History
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>,
        document.body
      )}

      {/* Compliance Detail Overlay Panel */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showCompliancePanel && (
          <div className="fixed inset-0 z-[9999] bg-slate-950/60 flex items-center justify-end p-0">
            <div className="absolute inset-0" onClick={() => setShowCompliancePanel(null)} />
            
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="bg-white dark:bg-slate-900 w-full max-w-2xl h-full shadow-2xl relative border-l border-slate-100 dark:border-slate-800 flex flex-col justify-between"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-850 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight font-outfit">Acknowledgement Compliance Log</h2>
                  <p className="text-[10px] font-bold text-slate-405 uppercase mt-0.5 tracking-wider">
                    {showCompliancePanel.title} (v{showCompliancePanel.version})
                  </p>
                </div>
                <button 
                  onClick={() => setShowCompliancePanel(null)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-650 dark:hover:text-slate-205 border-none cursor-pointer bg-transparent"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Compliance stats bar */}
              <div className="grid grid-cols-3 gap-4 p-6 bg-slate-50 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-855">
                <div className="text-center">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Overall compliance</span>
                  <p className="text-xl font-black text-emerald-500 mt-2 leading-none">{showCompliancePanel.complianceRate}%</p>
                </div>
                <div className="text-center border-x border-slate-200 dark:border-slate-800">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Acknowledged</span>
                  <p className="text-xl font-black text-blue-500 mt-2 leading-none">{showCompliancePanel.acknowledgedCount}</p>
                </div>
                <div className="text-center">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Pending</span>
                  <p className="text-xl font-black text-slate-400 mt-2 leading-none">
                    {showCompliancePanel.targetCount - showCompliancePanel.acknowledgedCount}
                  </p>
                </div>
              </div>

              {/* Lists container */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
                {/* Acknowledged list */}
                <div className="space-y-3">
                  <p className="text-[9px] font-black text-emerald-505 uppercase tracking-widest flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-500" /> Acknowledged Employees ({showCompliancePanel.acknowledgedList.length})
                  </p>
                  
                  {showCompliancePanel.acknowledgedList.length === 0 ? (
                    <p className="text-xs text-slate-400 font-semibold italic bg-slate-50 dark:bg-slate-950/20 p-4 border border-slate-100 dark:border-slate-850 rounded-2xl">
                      No employees have acknowledged this policy yet.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {showCompliancePanel.acknowledgedList.map((emp) => (
                        <div key={emp.id} className="flex justify-between items-center bg-slate-50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-850 p-3 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-300">
                          <div>
                            <p className="text-slate-900 dark:text-white uppercase text-[10px] font-black">{emp.name}</p>
                            <p className="text-[9px] text-slate-400 font-bold lowercase mt-0.5">{emp.email} • {emp.department}</p>
                          </div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase shrink-0">
                            {new Date(emp.acknowledgedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pending list */}
                <div className="space-y-3 border-t border-slate-100 dark:border-slate-855 pt-6">
                  <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-500" /> Pending Review & Sign-Off ({showCompliancePanel.pendingList.length})
                  </p>
                  
                  {showCompliancePanel.pendingList.length === 0 ? (
                    <p className="text-xs text-slate-400 font-semibold italic bg-slate-50 dark:bg-slate-950/20 p-4 border border-slate-100 dark:border-slate-850 rounded-2xl">
                      All targeted employees have successfully acknowledged this policy.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {showCompliancePanel.pendingList.map((emp) => (
                        <div key={emp.id} className="flex justify-between items-center bg-slate-50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-850 p-3 rounded-2xl text-xs font-bold text-slate-750 dark:text-slate-400">
                          <div>
                            <p className="text-slate-700 dark:text-slate-300 uppercase text-[10px] font-black">{emp.name}</p>
                            <p className="text-[9px] text-slate-400 font-bold lowercase mt-0.5">{emp.email} • {emp.department}</p>
                          </div>
                          <span className="px-2 py-0.5 bg-rose-500/10 text-rose-500 border border-rose-500/20 text-[8px] font-black uppercase tracking-wider rounded">
                            Pending
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="p-6 border-t border-slate-100 dark:border-slate-805 bg-white dark:bg-slate-900 z-10">
                <button 
                  type="button" 
                  onClick={() => setShowCompliancePanel(null)}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-805 dark:hover:bg-slate-800 text-slate-705 dark:text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer border-none"
                >
                  Close Compliance Log
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
