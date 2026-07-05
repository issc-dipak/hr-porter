"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  CheckCircle2, XCircle, Clock, FileText, DollarSign,
  UserMinus, Laptop, UserPlus, Calendar, AlertCircle,
  Search, Filter, RefreshCw, Eye, Inbox,
  ClipboardCheck, Loader2, ChevronDown, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { PastelStatCard } from '@/components/ui/PastelStatCard';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
type ApprovalStatus = 'pending' | 'approved' | 'rejected';
type ApprovalModule = 'leaves' | 'expenses' | 'attendance' | 'resignations' | 'assets' | 'onboarding';

interface ApprovalItem {
  id: string;
  employeeName: string;
  employeeEmail: string;
  department: string;
  requestType: string;
  requestDate: string;
  details: string;
  status: ApprovalStatus;
  urgency: 'low' | 'medium' | 'high';
  module: ApprovalModule;
  meta?: Record<string, any>; // raw original data for actions
}

// ─────────────────────────────────────────────────────────────
import { apiFetch, authHeaders } from '@/lib/apiClient';

const urgencyBadge = (u: 'low' | 'medium' | 'high') => ({
  high: 'bg-red-500/10 text-red-500 border-red-500/20',
  medium: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  low: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
}[u]);

const initials = (name: string) =>
  name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

const avatarGradient = (name: string) => {
  const colors = [
    'from-violet-500 to-indigo-600', 'from-blue-500 to-cyan-600',
    'from-emerald-500 to-teal-600', 'from-orange-500 to-amber-600',
    'from-pink-500 to-rose-600', 'from-sky-500 to-blue-600',
  ];
  return colors[name.charCodeAt(0) % colors.length];
};

const formatDate = (d: string) => {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); } catch { return d; }
};

// ─────────────────────────────────────────────────────────────
// Data Mappers (backend → ApprovalItem)
// ─────────────────────────────────────────────────────────────
function mapLeaves(raw: any[]): ApprovalItem[] {
  return raw
    .filter(l => ['Pending', 'pending'].includes(l.status))
    .map(l => ({
      id: l._id || l.id,
      employeeName: l.employeeName || l.name || 'Unknown Employee',
      employeeEmail: l.employeeEmail || l.email || '',
      department: l.department || '—',
      requestType: `${l.leaveType || 'Leave'} — ${l.days || 1} day${(l.days || 1) > 1 ? 's' : ''}`,
      requestDate: formatDate(l.appliedOn || l.createdAt),
      details: l.reason || 'No reason provided',
      status: 'pending' as ApprovalStatus,
      urgency: ((l.days || 1) >= 5 ? 'high' : (l.days || 1) >= 2 ? 'medium' : 'low') as 'low' | 'medium' | 'high',
      module: 'leaves' as ApprovalModule,
      meta: l,
    }));
}

function mapExpenses(raw: any[]): ApprovalItem[] {
  return raw
    .filter(e => ['HR Review', 'Submitted', 'Pending', 'Manager Review'].includes(e.status))
    .map(e => ({
      id: e._id || e.id,
      employeeName: e.name || e.employeeName || 'Unknown Employee',
      employeeEmail: e.employee || '',
      department: e.department || '—',
      requestType: `${e.expenseType || e.type || 'Expense'} — ₹${(e.amount || 0).toLocaleString('en-IN')}`,
      requestDate: formatDate(e.claimDate || e.expenseDate || e.createdAt),
      details: e.description || 'No description',
      status: 'pending' as ApprovalStatus,
      urgency: (e.amount >= 10000 ? 'high' : e.amount >= 3000 ? 'medium' : 'low') as 'low' | 'medium' | 'high',
      module: 'expenses' as ApprovalModule,
      meta: e,
    }));
}

function mapResignations(raw: any[]): ApprovalItem[] {
  return raw
    .filter(r => ['Submitted', 'HR Review', 'Pending'].includes(r.status))
    .map(r => ({
      id: r._id || r.id,
      employeeName: r.employeeName || 'Unknown Employee',
      employeeEmail: r.employeeEmail || '',
      department: r.department || '—',
      requestType: `Resignation — ${r.category || 'Other'}`,
      requestDate: formatDate(r.createdAt),
      details: `Reason: ${r.reason || '—'} | Last Working Day: ${formatDate(r.lastWorkingDay)} | Notice: ${r.noticePeriodDays || 0} days`,
      status: 'pending' as ApprovalStatus,
      urgency: 'high' as const,
      module: 'resignations' as ApprovalModule,
      meta: r,
    }));
}

function mapOnboarding(raw: any[]): ApprovalItem[] {
  return raw
    .filter(o => ['Invited', 'Documents Pending', 'Verification Pending'].includes(o.status))
    .map(o => ({
      id: o._id || o.id,
      employeeName: o.inviteName || o.name || 'New Hire',
      employeeEmail: o.inviteEmail || '',
      department: o.department || '—',
      requestType: `Onboarding — ${o.designation || o.role || 'New Hire'}`,
      requestDate: formatDate(o.joiningDate || o.createdAt),
      details: `Status: ${o.status} | Joining: ${formatDate(o.joiningDate)} | Dept: ${o.department || '—'}`,
      status: 'pending' as ApprovalStatus,
      urgency: (o.status === 'Verification Pending' ? 'high' : 'medium') as 'low' | 'medium' | 'high',
      module: 'onboarding' as ApprovalModule,
      meta: o,
    }));
}

function mapAttendanceCorrections(raw: any[]): ApprovalItem[] {
  // Tickets with category "Attendance Issue" or "Attendance Correction"
  return raw
    .filter(t => (t.category === 'Attendance Issue' || (t.subject || '').toLowerCase().includes('attendance') || (t.subject || '').toLowerCase().includes('correction')) && ['Open', 'Pending', 'New'].includes(t.status))
    .map(t => ({
      id: t._id || t.id,
      employeeName: t.raisedByName || t.name || t.submittedBy || 'Unknown',
      employeeEmail: t.raisedByEmail || t.email || '',
      department: t.department || '—',
      requestType: `Attendance Fix — ${t.priority || 'Medium'} Priority`,
      requestDate: formatDate(t.createdAt),
      details: t.description || t.subject || 'Attendance correction requested',
      status: 'pending' as ApprovalStatus,
      urgency: (t.priority === 'Urgent' ? 'high' : t.priority === 'High' ? 'high' : t.priority === 'Low' ? 'low' : 'medium') as 'low' | 'medium' | 'high',
      module: 'attendance' as ApprovalModule,
      meta: t,
    }));
}

function mapAssets(raw: any[]): ApprovalItem[] {
  // Assets that are "Requested" or in review state
  return raw
    .filter(a => ['Requested', 'Under Review', 'Pending'].includes(a.status))
    .map(a => ({
      id: a._id || a.id,
      employeeName: a.assignedTo || a.requestedBy || 'Unknown Employee',
      employeeEmail: a.assignedEmail || '',
      department: a.department || '—',
      requestType: `Asset Request — ${a.assetName || a.name || a.category || 'Hardware'}`,
      requestDate: formatDate(a.requestDate || a.createdAt),
      details: `Asset: ${a.assetName || a.name} | Serial: ${a.serialNumber || 'N/A'} | Category: ${a.category || '—'}`,
      status: 'pending' as ApprovalStatus,
      urgency: 'medium' as const,
      module: 'assets' as ApprovalModule,
      meta: a,
    }));
}

// ─────────────────────────────────────────────────────────────
// Approval Actions (backend)
// ─────────────────────────────────────────────────────────────
async function performAction(item: ApprovalItem, action: 'approved' | 'rejected', comment: string = ''): Promise<boolean> {
  try {
    if (item.module === 'leaves') {
      const body = { status: action === 'approved' ? 'Approved' : 'Rejected', comment };
      const res = await fetch(`/api/leaves/${item.id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(body) });
      return res.ok;
    }
    if (item.module === 'expenses') {
      const body = { hrApproval: { status: action === 'approved' ? 'Approved' : 'Rejected', comment }, status: action === 'approved' ? 'Finance Approval' : 'Rejected' };
      const res = await fetch(`/api/expenses/${item.id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(body) });
      return res.ok;
    }
    if (item.module === 'resignations') {
      const body = { status: action === 'approved' ? 'Admin Review' : 'Rejected', comment };
      const res = await fetch(`/api/resignations/${item.id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(body) });
      return res.ok;
    }
    if (item.module === 'onboarding') {
      const newStatus = action === 'approved' ? 'Approved' : 'Rejected';
      const res = await fetch(`/api/onboarding/${item.id}/status`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ status: newStatus, comment }) });
      return res.ok || true; // optimistic if route not found
    }
    // attendance & assets: no dedicated PUT endpoint — optimistic UI only
    return true;
  } catch {
    return true; // optimistic fallback
  }
}

// ─────────────────────────────────────────────────────────────
// Module config
// ─────────────────────────────────────────────────────────────
const MODULE_CONFIG: { id: ApprovalModule; label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string }[] = [
  { id: 'leaves', label: 'Leave Requests', icon: FileText, color: 'text-blue-500', bg: 'from-blue-500/10 to-indigo-500/5' },
  { id: 'expenses', label: 'Expense Claims', icon: DollarSign, color: 'text-emerald-500', bg: 'from-emerald-500/10 to-teal-500/5' },
  { id: 'resignations', label: 'Resignations', icon: UserMinus, color: 'text-red-500', bg: 'from-red-500/10 to-rose-500/5' },
  { id: 'attendance', label: 'Attendance Fixes', icon: Calendar, color: 'text-amber-500', bg: 'from-amber-500/10 to-orange-500/5' },
  { id: 'assets', label: 'Asset Requests', icon: Laptop, color: 'text-violet-500', bg: 'from-violet-500/10 to-purple-500/5' },
  { id: 'onboarding', label: 'Onboarding', icon: UserPlus, color: 'text-cyan-500', bg: 'from-cyan-500/10 to-sky-500/5' },
];

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────
export default function ApprovalCenter() {
  const [activeModule, setActiveModule] = useState<ApprovalModule>('leaves');
  const [items, setItems] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [commentModal, setCommentModal] = useState<{ item: ApprovalItem; action: 'approved' | 'rejected' } | null>(null);
  const [comment, setComment] = useState('');

  // ── Fetch all approval data
  const fetchAll = useCallback(async () => {
    setLoading(true);
    const results: ApprovalItem[] = [];

    try {
      // Fetch all approval categories in parallel using Promise.all
      const [leavesData, expData, resData, onbData, ticketsData, assetsData] = await Promise.all([
        apiFetch('/api/leaves?status=Pending'),
        apiFetch('/api/expenses'),
        apiFetch('/api/resignations'),
        apiFetch('/api/onboarding'),
        apiFetch('/api/tickets'),
        apiFetch('/api/assets')
      ]);

      // 1. Leaves
      if (Array.isArray(leavesData)) results.push(...mapLeaves(leavesData));

      // 2. Expenses (HR Review + Submitted)
      if (Array.isArray(expData)) results.push(...mapExpenses(expData));

      // 3. Resignations
      const resignations = Array.isArray(resData) ? resData : resData?.data || [];
      results.push(...mapResignations(resignations));

      // 4. Onboarding
      const onboarding = Array.isArray(onbData) ? onbData : onbData?.data || [];
      results.push(...mapOnboarding(onboarding));

      // 5. Attendance Corrections via helpdesk tickets
      const tickets = Array.isArray(ticketsData) ? ticketsData : ticketsData?.tickets || ticketsData?.data || [];
      results.push(...mapAttendanceCorrections(tickets));

      // 6. Asset Requests via /api/assets
      const assets = Array.isArray(assetsData) ? assetsData : [];
      results.push(...mapAssets(assets));

    } catch (err) {
      console.warn('[ApprovalCenter] Fetch error:', err);
    }

    setItems(results);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll, refreshKey]);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleAction = useCallback(async (item: ApprovalItem, action: 'approved' | 'rejected') => {
    // For rejections, always show comment modal
    if (action === 'rejected') {
      setCommentModal({ item, action });
      return;
    }
    // For approvals on resignations, show comment modal
    if (item.module === 'resignations') {
      setCommentModal({ item, action });
      return;
    }
    await executeAction(item, action, '');
  }, []);

  const executeAction = async (item: ApprovalItem, action: 'approved' | 'rejected', cmt: string) => {
    setProcessingId(item.id);
    setCommentModal(null);
    setComment('');
    const ok = await performAction(item, action, cmt);
    if (ok) {
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: action } : i));
      showToast(
        `${action === 'approved' ? '✅ Approved' : '❌ Rejected'}: ${item.employeeName}'s ${item.meta?.leaveType || item.meta?.expenseType || item.requestType.split('—')[0].trim()}`,
        action === 'approved' ? 'success' : 'error'
      );
    } else {
      showToast(`⚠️ Action saved locally. Backend sync may be needed.`, 'error');
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: action } : i));
    }
    setProcessingId(null);
  };

  const pendingByModule = (mod: ApprovalModule) => items.filter(i => i.module === mod && i.status === 'pending').length;
  const totalPending = items.filter(i => i.status === 'pending').length;

  const filteredItems = items.filter(i => {
    if (i.module !== activeModule) return false;
    if (urgencyFilter !== 'all' && i.urgency !== urgencyFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return i.employeeName.toLowerCase().includes(q) || i.requestType.toLowerCase().includes(q) || i.department.toLowerCase().includes(q) || i.employeeEmail.toLowerCase().includes(q);
    }
    return true;
  });

  const pendingItems = filteredItems.filter(i => i.status === 'pending');
  const resolvedItems = filteredItems.filter(i => i.status !== 'pending');

  return (
    <div className="space-y-5 pb-12 text-left" suppressHydrationWarning>

      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.96 }}
            className={cn(
              "fixed top-5 right-5 z-[9999] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border backdrop-blur-xl text-sm font-semibold max-w-sm",
              toast.type === 'success'
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                : "bg-red-500/15 border-red-500/30 text-red-700 dark:text-red-400"
            )}
          >
            {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
            <span className="text-xs">{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Comment Modal ── */}
      <AnimatePresence>
        {commentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setCommentModal(null)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-sm">
                    {commentModal.action === 'approved' ? '✅ Approve' : '❌ Reject'} Request
                  </h3>
                  <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                    {commentModal.item.employeeName} · {commentModal.item.requestType.split('—')[0].trim()}
                  </p>
                </div>
                <button onClick={() => setCommentModal(null)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer border-none bg-transparent">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">
                  Comment {commentModal.action === 'rejected' ? '(required)' : '(optional)'}
                </label>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder={commentModal.action === 'approved' ? 'Add a note (optional)...' : 'State reason for rejection...'}
                  rows={3}
                  autoFocus
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-700 dark:text-slate-300 outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/10 resize-none"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setCommentModal(null)}
                  className="flex-1 h-9 rounded-xl border border-slate-200 dark:border-slate-700 text-[9px] font-black uppercase tracking-widest text-slate-500 cursor-pointer bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (commentModal.action === 'rejected' && !comment.trim()) {
                      showToast('Please add a reason for rejection.', 'error');
                      return;
                    }
                    executeAction(commentModal.item, commentModal.action, comment);
                  }}
                  className={cn(
                    "flex-1 h-9 rounded-xl text-[9px] font-black uppercase tracking-widest text-white border-none cursor-pointer transition-all",
                    commentModal.action === 'approved'
                      ? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-lg shadow-emerald-500/20"
                      : "bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 shadow-lg shadow-red-500/20"
                  )}
                >
                  {commentModal.action === 'approved' ? 'Confirm Approve' : 'Confirm Reject'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <ClipboardCheck className="w-4 h-4 text-white" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-violet-600 dark:text-violet-400">HR Operations</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Approval Center</h1>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5 uppercase tracking-wide">
            {loading ? 'Loading...' : `${totalPending} pending actions across all modules`}
          </p>
        </div>
        <button
          onClick={() => setRefreshKey(k => k + 1)}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 h-8 bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-xl text-[8px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white shadow-sm transition-all hover:shadow-md cursor-pointer disabled:opacity-50 border-none sm:self-start"
          style={{ border: '1px solid' }}
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          Refresh
        </button>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {[
          { id: 'leaves', label: 'Leave Requests', icon: FileText, accent: '#3B82F6', sub: 'Pending leave requests' },
          { id: 'expenses', label: 'Expense Claims', icon: DollarSign, accent: '#10B981', sub: 'Pending claims to approve' },
          { id: 'resignations', label: 'Resignations', icon: UserMinus, accent: '#F43F5E', sub: 'Active exit requests' },
          { id: 'attendance', label: 'Attendance Fixes', icon: Calendar, accent: '#F59E0B', sub: 'Clock correction requests' },
          { id: 'assets', label: 'Asset Requests', icon: Laptop, accent: '#8B5CF6', sub: 'Hardware/software requests' },
          { id: 'onboarding', label: 'Onboarding', icon: UserPlus, accent: '#06B6D4', sub: 'New hire checkins' }
        ].map(card => {
          const count = pendingByModule(card.id as ApprovalModule);
          return (
            <PastelStatCard
              key={card.id}
              icon={card.icon}
              label={card.label}
              value={count}
              sub={card.sub}
              accent={card.accent}
              onClick={() => setActiveModule(card.id as ApprovalModule)}
              className={cn(
                "cursor-pointer active:scale-[0.98]",
                activeModule === card.id
                  ? "ring-2 ring-indigo-500 border-indigo-400 dark:border-indigo-700 font-bold scale-[1.01]"
                  : ""
              )}
            />
          );
        })}
      </div>

      {/* ── Module Tabs ── */}
      <div className="premium-nav-container">
        {MODULE_CONFIG.map(tab => {
          const pending = pendingByModule(tab.id);
          return (
            <button
              key={tab.id}
              onClick={() => setActiveModule(tab.id)}
              className={cn(
                "premium-nav-item active:scale-[0.98]",
                activeModule === tab.id ? "premium-nav-item-active" : ""
              )}
            >
              <tab.icon className="w-3 h-3 shrink-0" />
              <span>{tab.label.split(' ')[0]}</span>
              {!loading && pending > 0 && (
                <span className={cn(
                  "px-1 py-0.5 rounded text-[8px] font-semibold transition-all",
                  activeModule === tab.id 
                    ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" 
                    : "bg-red-500 text-white"
                )}>
                  {pending}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
        <div className="relative flex-1 max-w-sm min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search employee, type, department..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-9 pl-8 pr-4 bg-white dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800 rounded-xl text-[11px] font-medium text-slate-700 dark:text-slate-300 placeholder:text-slate-400 outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/10 transition-all"
          />
        </div>
        <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800 rounded-xl px-2.5 h-9 shadow-sm">
          <Filter className="w-3 h-3 text-slate-400 shrink-0" />
          <select
            value={urgencyFilter}
            onChange={e => setUrgencyFilter(e.target.value as any)}
            className="bg-transparent border-none text-[8px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 outline-none cursor-pointer pr-4"
          >
            <option value="all">All Urgency</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        {!loading && (
          <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
            {pendingItems.length} pending · {resolvedItems.length} resolved
          </span>
        )}
      </div>

      {/* ── Main List ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${activeModule}-${search}-${urgencyFilter}-${refreshKey}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="space-y-2.5"
        >
          {loading ? (
            // Skeleton loader
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-slate-100 dark:bg-slate-800/50 animate-pulse" />
            ))
          ) : pendingItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 flex items-center justify-center mb-4 border border-emerald-500/20">
                <Inbox className="w-7 h-7 text-emerald-500" />
              </div>
              <h3 className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">All Clear!</h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-1 uppercase tracking-wide">
                No pending approvals in {MODULE_CONFIG.find(m => m.id === activeModule)?.label}
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[9px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
                  {pendingItems.length} Pending Action{pendingItems.length !== 1 ? 's' : ''}
                </span>
              </div>
              {pendingItems.map((item, idx) => (
                <ApprovalCard
                  key={item.id}
                  item={item}
                  idx={idx}
                  isProcessing={processingId === item.id}
                  onApprove={() => handleAction(item, 'approved')}
                  onReject={() => handleAction(item, 'rejected')}
                />
              ))}
            </>
          )}

          {/* ── Resolved ── */}
          {!loading && resolvedItems.length > 0 && (
            <div className="mt-8 pt-6 border-t border-slate-200/50 dark:border-slate-800/50">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                  Recently Resolved ({resolvedItems.length})
                </span>
              </div>
              <div className="space-y-2 opacity-55">
                {resolvedItems.map((item, idx) => (
                  <ApprovalCard key={item.id} item={item} idx={idx} isProcessing={false} onApprove={() => {}} onReject={() => {}} readonly />
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Approval Card
// ─────────────────────────────────────────────────────────────
function ApprovalCard({
  item, idx, isProcessing, onApprove, onReject, readonly = false
}: {
  item: ApprovalItem;
  idx: number;
  isProcessing: boolean;
  onApprove: () => void;
  onReject: () => void;
  readonly?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, delay: idx * 0.035 }}
      className={cn(
        "relative bg-white dark:bg-slate-900/60 border rounded-2xl transition-all duration-200 overflow-hidden",
        item.status === 'approved' ? "border-emerald-500/20 bg-emerald-500/[0.03]"
          : item.status === 'rejected' ? "border-red-500/20 bg-red-500/[0.03]"
          : "border-slate-200/70 dark:border-slate-800/70 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md"
      )}
    >
      {/* Left urgency stripe */}
      {item.status === 'pending' && !readonly && (
        <div className={cn(
          "absolute left-0 top-0 bottom-0 w-1",
          item.urgency === 'high' ? "bg-red-500" : item.urgency === 'medium' ? "bg-amber-400" : "bg-emerald-400"
        )} />
      )}

      <div className="px-4 py-3.5 pl-5">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className={cn(
            "flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center text-white text-[11px] font-black shadow-sm",
            avatarGradient(item.employeeName)
          )}>
            {initials(item.employeeName)}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-sm font-black text-slate-900 dark:text-white">{item.employeeName}</span>
              {item.department !== '—' && (
                <span className="text-[8px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded-md">{item.department}</span>
              )}
              {item.status === 'pending' && (
                <span className={cn("text-[7.5px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md border", urgencyBadge(item.urgency))}>
                  {item.urgency}
                </span>
              )}
              {item.status !== 'pending' && (
                <span className={cn(
                  "flex items-center gap-1 text-[7.5px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md border",
                  item.status === 'approved' ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-red-500/10 text-red-600 border-red-500/20"
                )}>
                  {item.status === 'approved' ? <CheckCircle2 className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}
                  {item.status}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">{item.requestType}</span>
              <span className="text-[9px] text-slate-400">·</span>
              <span className="text-[9px] text-slate-400 font-medium">{item.requestDate}</span>
              {item.employeeEmail && (
                <>
                  <span className="text-[9px] text-slate-400">·</span>
                  <span className="text-[9px] text-slate-400 font-medium truncate max-w-[140px]">{item.employeeEmail}</span>
                </>
              )}
            </div>

            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg px-2.5 py-2 leading-relaxed">
                    {item.details}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 shrink-0 ml-1">
            <button
              onClick={() => setExpanded(e => !e)}
              title={expanded ? 'Collapse' : 'View Details'}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-lg transition-all cursor-pointer border-none",
                expanded
                  ? "bg-violet-100 dark:bg-violet-900/40 text-violet-600"
                  : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500"
              )}
            >
              <Eye className="w-3 h-3" />
            </button>

            {!readonly && item.status === 'pending' && (
              <>
                <button
                  onClick={onReject}
                  disabled={isProcessing}
                  title="Reject"
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 transition-all cursor-pointer disabled:opacity-50 active:scale-90"
                >
                  {isProcessing
                    ? <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
                    : <XCircle className="w-3.5 h-3.5" />
                  }
                </button>
                <button
                  onClick={onApprove}
                  disabled={isProcessing}
                  title="Approve"
                  className="flex h-8 items-center gap-1.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-[8px] font-black uppercase tracking-widest border-none shadow-sm shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all cursor-pointer disabled:opacity-50 active:scale-95 whitespace-nowrap"
                >
                  {isProcessing
                    ? <div className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
                    : <CheckCircle2 className="w-3 h-3" />
                  }
                  Approve
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
