"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users, IndianRupee, TrendingUp, TrendingDown, Clock, CheckCircle2,
  XCircle, Search, Filter, RefreshCw, Eye, Edit2, Award,
  ArrowUpRight, ArrowDownRight, Building2, Calendar, AlertCircle,
  Download, ChevronRight, BadgeCheck, Banknote, BarChart3, History
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { PastelStatCard } from '@/components/ui/PastelStatCard';
import SalaryRevisionModal from './SalaryRevisionModal';

import { authHeaders } from '@/lib/apiClient';

interface SalaryManagementTabProps {
  userRole?: string;
}

function fmt(n: number) {
  return `₹${(n || 0).toLocaleString('en-IN')}`;
}

function fmtK(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n}`;
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; dot: string }> = {
  'Active': { color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', dot: 'bg-emerald-500' },
  'Inactive': { color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-800', dot: 'bg-slate-400' },
  'Pending': { color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', dot: 'bg-amber-500' },
  'Approved': { color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', dot: 'bg-emerald-500' },
  'Rejected': { color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/20', dot: 'bg-rose-500' },
};

export default function SalaryManagementTab({ userRole = 'HR' }: SalaryManagementTabProps) {
  const [employees, setEmployees] = useState<any[]>([]);
  const [revisions, setRevisions] = useState<any[]>([]);
  const [totalPayrollCost, setTotalPayrollCost] = useState(0);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [pendingRevisions, setPendingRevisions] = useState(0);
  const [loading, setLoading] = useState(true);
  const [revisionsLoading, setRevisionsLoading] = useState(false);

  const [activeView, setActiveView] = useState<'overview' | 'revisions' | 'history'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [revisionStatusFilter, setRevisionStatusFilter] = useState('All');

  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [selectedRevision, setSelectedRevision] = useState<any | null>(null);
  const [processingRevision, setProcessingRevision] = useState<string | null>(null);

  const fetchSalaryData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/payroll/salary', { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.employees || []);
        setTotalPayrollCost(data.totalPayrollCost || 0);
        setTotalEmployees(data.totalEmployees || 0);
        setPendingRevisions(data.pendingRevisions || 0);
      }
    } catch (err) {
      console.error('Failed to fetch salary data:', err);
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  const fetchRevisions = useCallback(async () => {
    setRevisionsLoading(true);
    try {
      const statusQ = revisionStatusFilter !== 'All' ? `?status=${revisionStatusFilter}` : '';
      const res = await fetch(`/api/payroll/salary/revision${statusQ}`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setRevisions(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch revisions:', err);
    } finally {
      setRevisionsLoading(false);
    }
  }, [authHeaders, revisionStatusFilter]);

  useEffect(() => { fetchSalaryData(); }, [fetchSalaryData]);
  useEffect(() => { if (activeView === 'revisions' || activeView === 'history') fetchRevisions(); }, [activeView, fetchRevisions, revisionStatusFilter]);

  const handleRevisionAction = async (revisionId: string, action: 'approve' | 'reject') => {
    setProcessingRevision(revisionId);
    try {
      const res = await fetch('/api/payroll/salary/revision', {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ revisionId, action }),
      });
      if (res.ok) {
        await fetchRevisions();
        await fetchSalaryData();
      }
    } catch (err) {
      console.error('Failed to process revision:', err);
    } finally {
      setProcessingRevision(null);
    }
  };

  // Filtered employees
  const departments = useMemo(() => ['All', ...Array.from(new Set(employees.map(e => e.department).filter(Boolean)))], [employees]);
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchSearch = !searchTerm || emp.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) || emp.empId?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchDept = deptFilter === 'All' || emp.department === deptFilter;
      return matchSearch && matchDept;
    });
  }, [employees, searchTerm, deptFilter]);

  const avgSalary = totalEmployees > 0 ? Math.round(totalPayrollCost / totalEmployees) : 0;
  const approvedRevisions = revisions.filter(r => r.status === 'Approved').length;

  return (
    <div className="space-y-5 text-left">
      {/* Header Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-left">
        {[
          { label: 'Total Monthly Payroll', value: fmtK(totalPayrollCost), sub: `${fmtK(totalPayrollCost * 12)} annually`, icon: Banknote, accent: '#3B82F6' },
          { label: 'Total Employees', value: totalEmployees.toString(), sub: 'On payroll', icon: Users, accent: '#10B981' },
          { label: 'Average Monthly CTC', value: fmtK(avgSalary), sub: `${fmtK(avgSalary * 12)} avg annual`, icon: BarChart3, accent: '#8B5CF6' },
          { label: 'Pending Revisions', value: pendingRevisions.toString(), sub: 'Awaiting approval', icon: Clock, accent: '#F59E0B' },
        ].map((stat, idx) => (
          <PastelStatCard key={idx} icon={stat.icon} label={stat.label} value={stat.value} sub={stat.sub || stat.desc} accent={stat.accent} />
        ))}
      </div>

      {/* Sub-navigation */}
      <div className="flex items-center justify-between">
        <div className="flex bg-slate-100 dark:bg-slate-900 p-0.5 rounded-xl border border-slate-200 dark:border-slate-800 w-fit">
          {[
            { key: 'overview', label: 'Salary Overview', icon: Users },
            { key: 'revisions', label: 'Revisions', icon: TrendingUp, badge: pendingRevisions > 0 ? pendingRevisions : null },
            { key: 'history', label: 'History', icon: History },
          ].map(view => (
            <button key={view.key} onClick={() => setActiveView(view.key as any)}
              className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[8.5px] font-black uppercase tracking-widest transition-all cursor-pointer relative",
                activeView === view.key ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              )}>
              <view.icon className="w-3 h-3" />
              {view.label}
              {view.badge && <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white text-[7px] font-black rounded-full flex items-center justify-center">{view.badge}</span>}
            </button>
          ))}
        </div>
        <button
          onClick={fetchSalaryData}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-[8.5px] font-black uppercase tracking-widest text-slate-500 transition-all cursor-pointer"
        >
          <RefreshCw className={cn("w-3 h-3", loading && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {/* == OVERVIEW: Employee Salary Table == */}
      {activeView === 'overview' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, email, or EMP ID..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="saas-input w-full pl-9 pr-4 py-2 text-xs font-bold"
              />
            </div>
            <select
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
              className="saas-input px-3 py-2 text-xs font-bold cursor-pointer min-w-[140px]"
            >
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800">
                    {['Employee', 'Department', 'Employment', 'Basic', 'Gross Salary', 'Deductions', 'Net Pay', 'Monthly CTC', 'Annual CTC', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-[8px] font-black text-slate-400 uppercase tracking-[0.15em] whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 10 }).map((_, j) => (
                          <td key={j} className="px-4 py-3">
                            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-16" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-12 text-center">
                        <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs font-bold text-slate-400 uppercase">No employees found</p>
                      </td>
                    </tr>
                  ) : filteredEmployees.map(emp => {
                    const s = emp.salaryStructure || {};
                    const gross = s.grossSalary || ((s.basic || 0) + (s.hra || 0) + (s.medicalAllowance || 0) + (s.travelAllowance || 0) + (s.specialAllowance || s.allowance || 0) + (s.otherEarnings || 0) + (s.bonus || 0));
                    const deductions = s.totalDeductions || ((s.pf || 0) + (s.esi || 0) + (s.professionalTax || 0) + (s.tds || s.tax || 0) + (s.otherDeductions || 0));
                    const net = s.net || Math.max(0, gross - deductions);
                    const ctcMonthly = s.monthlyCTC || (gross + (s.pf || 0));
                    const ctcAnnual = s.annualCTC || (ctcMonthly * 12);

                    return (
                      <tr key={emp._id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[9px] font-black shrink-0">
                              {emp.fullName?.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                            </div>
                            <div>
                              <p className="text-[11px] font-black text-slate-900 dark:text-white leading-none">{emp.fullName}</p>
                              <p className="text-[8.5px] text-slate-400 font-bold mt-0.5">{emp.empId || emp.email?.split('@')[0]}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300">{emp.department}</p>
                          <p className="text-[8.5px] text-slate-400">{emp.designation}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 text-[8px] font-black uppercase rounded-full">
                            {s.employmentType || 'Full-Time'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[11px] font-black text-slate-800 dark:text-slate-200">{fmt(s.basic || 0)}</td>
                        <td className="px-4 py-3 text-[11px] font-bold text-slate-700 dark:text-slate-300">{fmt(gross)}</td>
                        <td className="px-4 py-3 text-[11px] font-bold text-rose-500">-{fmt(deductions)}</td>
                        <td className="px-4 py-3 text-[11px] font-black text-emerald-600">{fmt(net)}</td>
                        <td className="px-4 py-3 text-[11px] font-black text-blue-600">{fmt(ctcMonthly)}</td>
                        <td className="px-4 py-3 text-[10px] font-bold text-slate-500">{fmt(ctcAnnual)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            {['Admin', 'HR'].includes(userRole) && (
                              <button
                                onClick={() => { setSelectedEmployee(emp); setShowRevisionModal(true); }}
                                className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 rounded-lg text-[8px] font-black uppercase tracking-widest cursor-pointer transition-all flex items-center gap-1"
                              >
                                <TrendingUp className="w-2.5 h-2.5" /> Revise
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* == REVISIONS: Pending/All Revisions == */}
      {activeView === 'revisions' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <select value={revisionStatusFilter} onChange={e => setRevisionStatusFilter(e.target.value)} className="saas-input px-3 py-2 text-xs font-bold cursor-pointer">
              {['All', 'Pending', 'Approved', 'Rejected'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {revisionsLoading ? (
            <div className="py-12 text-center text-xs font-black uppercase tracking-widest text-slate-400 animate-pulse">Loading revisions...</div>
          ) : revisions.length === 0 ? (
            <div className="py-16 text-center">
              <TrendingUp className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No {revisionStatusFilter === 'All' ? '' : revisionStatusFilter.toLowerCase()} revisions found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {revisions.map(rev => {
                const isPositive = rev.incrementAmount >= 0;
                const sc = STATUS_CONFIG[rev.status] || STATUS_CONFIG['Pending'];
                return (
                  <motion.div key={rev._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-black shrink-0">
                          {rev.employeeName?.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-black text-slate-900 dark:text-white">{rev.employeeName}</p>
                            <span className={cn("px-2 py-0.5 text-[7.5px] font-black uppercase tracking-widest rounded-full flex items-center gap-1", sc.bg, sc.color)}>
                              <span className={cn("w-1.5 h-1.5 rounded-full", sc.dot)} />
                              {rev.status}
                            </span>
                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 text-[7.5px] font-black uppercase tracking-widest rounded-full">{rev.revisionType}</span>
                          </div>
                          <p className="text-[9px] text-slate-400 font-bold mt-0.5">{rev.department} · {rev.designation}</p>
                          <p className="text-[10px] text-slate-500 mt-1.5 font-medium">{rev.reason}</p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <div className={cn("flex items-center gap-1 px-3 py-1.5 rounded-lg", isPositive ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-rose-50 dark:bg-rose-900/20')}>
                          {isPositive ? <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" /> : <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />}
                          <span className={cn("text-xs font-black", isPositive ? 'text-emerald-600' : 'text-rose-600')}>
                            {isPositive ? '+' : ''}{fmt(rev.incrementAmount)}/mo
                          </span>
                          <span className={cn("text-[8.5px] font-bold", isPositive ? 'text-emerald-500' : 'text-rose-500')}>({isPositive ? '+' : ''}{rev.incrementPercent}%)</span>
                        </div>
                        <div className="text-right">
                          <p className="text-[7.5px] text-slate-400 font-bold uppercase">Effective</p>
                          <p className="text-[9px] font-black text-slate-600 dark:text-slate-300">{new Date(rev.effectiveDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        </div>
                      </div>
                    </div>

                    {/* CTC Comparison */}
                    <div className="mt-4 grid grid-cols-3 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                      {[
                        { label: 'Old Monthly CTC', value: fmt(rev.oldSalary?.monthlyCTC || 0), color: 'text-slate-600' },
                        { label: 'New Monthly CTC', value: fmt(rev.newSalary?.monthlyCTC || 0), color: 'text-blue-600' },
                        { label: 'Net Take-home (New)', value: fmt(rev.newSalary?.netSalary || 0), color: 'text-emerald-600' },
                      ].map(item => (
                        <div key={item.label}>
                          <p className="text-[7.5px] text-slate-400 font-bold uppercase">{item.label}</p>
                          <p className={cn("text-[11px] font-black", item.color)}>{item.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    {rev.status === 'Pending' && ['Admin', 'HR'].includes(userRole) && (
                      <div className="mt-3 flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <button
                          onClick={() => handleRevisionAction(rev._id, 'approve')}
                          disabled={processingRevision === rev._id}
                          className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[8.5px] font-black uppercase tracking-widest cursor-pointer transition-all disabled:opacity-60"
                        >
                          {processingRevision === rev._id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                          Approve & Apply
                        </button>
                        <button
                          onClick={() => handleRevisionAction(rev._id, 'reject')}
                          disabled={processingRevision === rev._id}
                          className="flex items-center gap-1.5 px-4 py-1.5 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 text-rose-600 rounded-lg text-[8.5px] font-black uppercase tracking-widest cursor-pointer transition-all disabled:opacity-60"
                        >
                          <XCircle className="w-3 h-3" /> Reject
                        </button>
                        <span className="text-[8px] text-slate-400 font-bold ml-auto">Submitted: {new Date(rev.createdAt).toLocaleDateString('en-IN')}</span>
                      </div>
                    )}

                    {rev.status === 'Approved' && (
                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                        <BadgeCheck className="w-4 h-4 text-emerald-500" />
                        <span className="text-[9px] text-emerald-600 font-black">Approved by {rev.approvedBy || 'Admin'} · Applied to payroll</span>
                      </div>
                    )}

                    {rev.status === 'Rejected' && rev.rejectionReason && (
                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                        <span className="text-[9px] text-rose-600 font-bold">Rejection Reason: {rev.rejectionReason}</span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* == HISTORY: Salary History Timeline == */}
      {activeView === 'history' && (
        <div className="space-y-4">
          {revisionsLoading ? (
            <div className="py-12 text-center text-xs font-black uppercase tracking-widest text-slate-400 animate-pulse">Loading history...</div>
          ) : revisions.length === 0 ? (
            <div className="py-16 text-center">
              <History className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No salary revision history found</p>
              <p className="text-[9px] text-slate-400 mt-1">Salary revisions will appear here once created.</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[19px] top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-800" />
              <div className="space-y-3">
                {revisions.map((rev, i) => {
                  const isPositive = rev.incrementAmount >= 0;
                  const sc = STATUS_CONFIG[rev.status] || STATUS_CONFIG['Pending'];
                  return (
                    <motion.div key={rev._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                      className="flex gap-4 relative"
                    >
                      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 border-2 border-white dark:border-slate-900", isPositive ? 'bg-emerald-500' : 'bg-rose-500')}>
                        {isPositive ? <TrendingUp className="w-4 h-4 text-white" /> : <TrendingDown className="w-4 h-4 text-white" />}
                      </div>
                      <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-xl p-4 shadow-sm mb-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-black text-slate-900 dark:text-white">{rev.employeeName}</p>
                              <span className={cn("px-2 py-0.5 text-[7px] font-black uppercase tracking-widest rounded-full flex items-center gap-1", sc.bg, sc.color)}>
                                <span className={cn("w-1 h-1 rounded-full", sc.dot)} />{rev.status}
                              </span>
                            </div>
                            <p className="text-[8.5px] text-slate-400 font-bold mt-0.5">{rev.revisionType} · {rev.department}</p>
                          </div>
                          <div className="text-right">
                            <p className={cn("text-xs font-black", isPositive ? 'text-emerald-600' : 'text-rose-500')}>
                              {isPositive ? '+' : ''}{fmt(rev.incrementAmount)}/mo
                            </p>
                            <p className="text-[8px] text-slate-400 font-bold">{new Date(rev.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-[8.5px]">
                          <span className="text-slate-500 font-bold">{fmt(rev.oldSalary?.monthlyCTC)} → <span className="text-blue-600 font-black">{fmt(rev.newSalary?.monthlyCTC)}</span></span>
                          <span className="text-slate-400">|</span>
                          <span className="text-slate-500">Effective: {new Date(rev.effectiveDate).toLocaleDateString('en-IN')}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Salary Revision Modal */}
      <AnimatePresence>
        {showRevisionModal && selectedEmployee && (
          <SalaryRevisionModal
            employee={selectedEmployee}
            onClose={() => { setShowRevisionModal(false); setSelectedEmployee(null); }}
            onSuccess={() => { fetchSalaryData(); fetchRevisions(); }}
            userRole={userRole}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
