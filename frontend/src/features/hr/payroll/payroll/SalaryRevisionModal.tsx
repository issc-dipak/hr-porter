"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { X, TrendingUp, TrendingDown, Award, RefreshCw, ChevronDown, AlertCircle, CheckCircle2, IndianRupee, Calendar, User, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { usePermission } from '@/context/PermissionContext';

interface SalaryRevisionModalProps {
  employee: any;
  onClose: () => void;
  onSuccess: () => void;
  userRole?: string;
}

const REVISION_TYPES = [
  { value: 'Annual Increment', label: 'Annual Increment', icon: RefreshCw, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  { value: 'Promotion', label: 'Promotion', icon: Award, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  { value: 'Increment', label: 'Merit Increment', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  { value: 'Decrement', label: 'Salary Revision (↓)', icon: TrendingDown, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20' },
  { value: 'Custom', label: 'Custom Revision', icon: FileText, color: 'text-slate-500', bg: 'bg-slate-50 dark:bg-slate-800' },
];

function fmt(n: number) {
  return `₹${(n || 0).toLocaleString('en-IN')}`;
}

export default function SalaryRevisionModal({ employee, onClose, onSuccess, userRole = 'HR' }: SalaryRevisionModalProps) {
  const { can } = usePermission();
  const oldS = employee?.salaryStructure || {};

  const [revisionType, setRevisionType] = useState('Annual Increment');
  const [incrementMode, setIncrementMode] = useState<'percent' | 'amount'>('percent');
  const [incrementValue, setIncrementValue] = useState(10);
  const [reason, setReason] = useState('');
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [approvedBy, setApprovedBy] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'configure' | 'review'>('configure');

  // Manual new salary form (used when mode is 'manual')
  const [manualMode, setManualMode] = useState(false);
  const [newSalaryForm, setNewSalaryForm] = useState({
    basic: oldS.basic || 0,
    hra: oldS.hra || 0,
    medicalAllowance: oldS.medicalAllowance || 1250,
    travelAllowance: oldS.travelAllowance || 1600,
    specialAllowance: oldS.specialAllowance || oldS.allowance || 0,
    otherEarnings: oldS.otherEarnings || 0,
    bonus: oldS.bonus || 0,
    pf: oldS.pf || 0,
    esi: oldS.esi || 0,
    professionalTax: oldS.professionalTax || 200,
    tds: oldS.tds || oldS.tax || 0,
    otherDeductions: oldS.otherDeductions || 0,
  });

  // Calculate old salary
  const oldGross = (oldS.basic || 0) + (oldS.hra || 0) + (oldS.medicalAllowance || 0) + (oldS.travelAllowance || 0) + (oldS.specialAllowance || oldS.allowance || 0) + (oldS.otherEarnings || 0) + (oldS.bonus || 0);
  const oldDeductions = (oldS.pf || 0) + (oldS.esi || 0) + (oldS.professionalTax || 0) + (oldS.tds || oldS.tax || 0) + (oldS.otherDeductions || 0);
  const oldNet = Math.max(0, oldGross - oldDeductions);
  const oldMonthlyCTC = oldGross + (oldS.pf || 0);

  // Calculate new salary based on increment
  const newSalary = useMemo(() => {
    if (manualMode) {
      const gross = Object.values(newSalaryForm).slice(0, 7).reduce((s: number, v) => s + Number(v), 0);
      const deductions = (newSalaryForm.pf) + (newSalaryForm.esi) + (newSalaryForm.professionalTax) + (newSalaryForm.tds) + (newSalaryForm.otherDeductions);
      const net = Math.max(0, gross - deductions);
      const monthlyCTC = gross + newSalaryForm.pf;
      return { ...newSalaryForm, grossSalary: gross, totalDeductions: deductions, netSalary: net, monthlyCTC, annualCTC: monthlyCTC * 12 };
    }

    // Auto-calculate based on increment
    let factor = 1;
    if (incrementMode === 'percent') {
      factor = 1 + (incrementValue / 100);
    }

    const applyFactor = (v: number) => incrementMode === 'percent' ? Math.round(v * factor) : v;
    const addAmount = (v: number, share: number) => incrementMode === 'amount' ? Math.round(v + share) : v;

    const basicShare = oldMonthlyCTC > 0 ? (oldS.basic || 0) / oldMonthlyCTC : 0.5;

    const newBasic = incrementMode === 'percent'
      ? applyFactor(oldS.basic || 0)
      : (oldS.basic || 0) + Math.round(incrementValue * basicShare);

    const newHra = Math.round(newBasic * 0.4);
    const newSpecial = incrementMode === 'percent'
      ? applyFactor(oldS.specialAllowance || oldS.allowance || 0)
      : addAmount(oldS.specialAllowance || oldS.allowance || 0, incrementValue * 0.2);

    const ns = {
      basic: newBasic,
      hra: newHra,
      medicalAllowance: oldS.medicalAllowance || 1250,
      travelAllowance: oldS.travelAllowance || 1600,
      specialAllowance: newSpecial,
      otherEarnings: oldS.otherEarnings || 0,
      bonus: oldS.bonus || 0,
      pf: Math.round(newBasic * 0.12),
      esi: oldS.esi || 0,
      professionalTax: oldS.professionalTax || 200,
      tds: oldS.tds || oldS.tax || 0,
      otherDeductions: oldS.otherDeductions || 0,
    };

    const gross = ns.basic + ns.hra + ns.medicalAllowance + ns.travelAllowance + ns.specialAllowance + ns.otherEarnings + ns.bonus;
    const deductions = ns.pf + ns.esi + ns.professionalTax + ns.tds + ns.otherDeductions;
    const net = Math.max(0, gross - deductions);
    const monthlyCTC = gross + ns.pf;
    return { ...ns, grossSalary: gross, totalDeductions: deductions, netSalary: net, monthlyCTC, annualCTC: monthlyCTC * 12 };
  }, [manualMode, newSalaryForm, incrementMode, incrementValue, oldS, oldMonthlyCTC]);

  const incrementAmount = newSalary.monthlyCTC - oldMonthlyCTC;
  const incrementPercent = oldMonthlyCTC > 0 ? ((incrementAmount / oldMonthlyCTC) * 100).toFixed(1) : '0';
  const isPositive = incrementAmount >= 0;

  const handleSubmit = async () => {
    if (!reason) { setError('Please provide a reason for this revision.'); return; }
    setError('');
    setSubmitting(true);
    try {
      const token = localStorage.getItem('hr_system_token');
      const res = await fetch('/api/payroll/salary/revision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          employeeId: employee._id,
          revisionType,
          newSalary,
          reason,
          effectiveDate,
          approvedBy,
          notes,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Failed to create revision');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create revision. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/50 dark:border-slate-800 overflow-hidden max-h-[92vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-blue-600 to-indigo-600">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
              <IndianRupee className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Salary Revision</h3>
              <p className="text-[9px] text-blue-200 font-bold uppercase tracking-widest mt-0.5">{employee?.fullName} · {employee?.designation}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/15 rounded-lg transition-colors cursor-pointer">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex border-b border-slate-200 dark:border-slate-800">
          {['configure', 'review'].map((s, i) => (
            <button key={s} onClick={() => step === 'review' && setStep(s as any)} className={cn(
              "flex-1 py-2.5 text-[9px] font-black uppercase tracking-widest transition-all",
              step === s ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            )}>
              {i + 1}. {s === 'configure' ? 'Configure Revision' : 'Review & Submit'}
            </button>
          ))}
        </div>

        <div className="p-5 space-y-5">
          {step === 'configure' ? (
            <>
              {/* Current Salary Summary */}
              <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2.5">Current Salary</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Monthly CTC', value: fmt(oldMonthlyCTC) },
                    { label: 'Gross Salary', value: fmt(oldGross) },
                    { label: 'Net Take-home', value: fmt(oldNet) },
                  ].map(item => (
                    <div key={item.label}>
                      <p className="text-[7.5px] text-slate-400 uppercase font-bold">{item.label}</p>
                      <p className="text-sm font-black text-slate-900 dark:text-white">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Revision Type */}
              <div>
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-2">Revision Type</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {REVISION_TYPES.map(rt => (
                    <button
                      key={rt.value}
                      type="button"
                      onClick={() => setRevisionType(rt.value)}
                      className={cn(
                        "flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all cursor-pointer",
                        revisionType === rt.value
                          ? `${rt.bg} border-current ${rt.color} shadow-sm`
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      )}
                    >
                      <rt.icon className={cn("w-3.5 h-3.5 shrink-0", revisionType === rt.value ? rt.color : 'text-slate-400')} />
                      <span className={cn("text-[9px] font-black uppercase tracking-wide", revisionType === rt.value ? rt.color : 'text-slate-500 dark:text-slate-400')}>{rt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Increment Method Toggle */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Salary Adjustment</label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setManualMode(false)}
                      className={cn("px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all cursor-pointer", !manualMode ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500')}
                    >Auto</button>
                    <button
                      type="button"
                      onClick={() => setManualMode(true)}
                      className={cn("px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all cursor-pointer", manualMode ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500')}
                    >Manual</button>
                  </div>
                </div>

                {!manualMode ? (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <button onClick={() => setIncrementMode('percent')} className={cn("flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer", incrementMode === 'percent' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500')}>% Percentage</button>
                      <button onClick={() => setIncrementMode('amount')} className={cn("flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer", incrementMode === 'amount' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500')}>₹ Fixed Amount</button>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min={incrementMode === 'percent' ? -100 : -500000}
                        max={incrementMode === 'percent' ? 200 : 5000000}
                        value={incrementValue}
                        onChange={e => setIncrementValue(Number(e.target.value))}
                        className="saas-input flex-1 px-3 py-2 text-sm font-black"
                      />
                      <span className="text-[11px] font-black text-slate-500 min-w-[30px]">{incrementMode === 'percent' ? '%' : '₹/mo'}</span>
                    </div>
                    <div className={cn("flex items-center gap-2 p-3 rounded-xl", isPositive ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-rose-50 dark:bg-rose-900/20')}>
                      {isPositive ? <TrendingUp className="w-4 h-4 text-emerald-500 shrink-0" /> : <TrendingDown className="w-4 h-4 text-rose-500 shrink-0" />}
                      <span className={cn("text-xs font-black", isPositive ? 'text-emerald-600' : 'text-rose-600')}>
                        {isPositive ? '+' : ''}{fmt(incrementAmount)}/month ({isPositive ? '+' : ''}{incrementPercent}%)
                      </span>
                      <span className="text-[9px] text-slate-500 ml-auto">New CTC: {fmt(newSalary.monthlyCTC)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800">
                    {[
                      { key: 'basic', label: 'Basic Salary' },
                      { key: 'hra', label: 'HRA' },
                      { key: 'medicalAllowance', label: 'Medical Allowance' },
                      { key: 'travelAllowance', label: 'Travel Allowance' },
                      { key: 'specialAllowance', label: 'Special Allowance' },
                      { key: 'otherEarnings', label: 'Other Earnings' },
                      { key: 'bonus', label: 'Bonus' },
                      { key: 'pf', label: 'PF Deduction' },
                      { key: 'esi', label: 'ESIC' },
                      { key: 'professionalTax', label: 'Prof. Tax' },
                      { key: 'tds', label: 'TDS / Income Tax' },
                      { key: 'otherDeductions', label: 'Other Deductions' },
                    ].map(field => (
                      <div key={field.key}>
                        <label className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest block mb-1">{field.label}</label>
                        <input
                          type="number"
                          value={(newSalaryForm as any)[field.key]}
                          onChange={e => setNewSalaryForm(prev => ({ ...prev, [field.key]: Number(e.target.value) }))}
                          className="saas-input w-full px-2.5 py-1.5 text-[11px] font-bold"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Meta fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Effective Date *</label>
                  <input
                    type="date"
                    value={effectiveDate}
                    onChange={e => setEffectiveDate(e.target.value)}
                    className="saas-input w-full px-3 py-2 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Approved By</label>
                  <input
                    type="text"
                    value={approvedBy}
                    onChange={e => setApprovedBy(e.target.value)}
                    placeholder="Manager / HR Lead name"
                    className="saas-input w-full px-3 py-2 text-xs font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Reason for Revision *</label>
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  rows={2}
                  placeholder="e.g., Annual performance review increment, Promoted to Senior Engineer..."
                  className="saas-input w-full px-3 py-2 text-xs font-bold resize-none"
                />
              </div>
              <div>
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Internal Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Optional notes for internal reference..."
                  className="saas-input w-full px-3 py-2 text-xs font-bold"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!reason) { setError('Please provide a reason.'); return; }
                  setError('');
                  setStep('review');
                }}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[9.5px] font-black uppercase tracking-widest cursor-pointer shadow-lg shadow-blue-600/20 transition-all active:scale-[0.99]"
              >
                Review Revision →
              </button>
            </>
          ) : (
            <>
              {/* Review Step */}
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-3">Revision Summary</p>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div><p className="text-[7.5px] text-slate-400 font-bold uppercase">Employee</p><p className="font-black text-slate-900 dark:text-white">{employee?.fullName}</p></div>
                    <div><p className="text-[7.5px] text-slate-400 font-bold uppercase">Revision Type</p><p className="font-black text-slate-900 dark:text-white">{revisionType}</p></div>
                    <div><p className="text-[7.5px] text-slate-400 font-bold uppercase">Effective Date</p><p className="font-black text-slate-900 dark:text-white">{effectiveDate}</p></div>
                    <div><p className="text-[7.5px] text-slate-400 font-bold uppercase">Approved By</p><p className="font-black text-slate-900 dark:text-white">{approvedBy || 'Pending'}</p></div>
                  </div>
                </div>

                {/* Before/After Salary Comparison */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-rose-50 dark:bg-rose-900/10 rounded-xl border border-rose-200 dark:border-rose-900/30">
                    <p className="text-[7.5px] font-black text-rose-500 uppercase tracking-widest mb-2">Before</p>
                    {[
                      { l: 'Monthly CTC', v: fmt(oldMonthlyCTC) },
                      { l: 'Gross', v: fmt(oldGross) },
                      { l: 'Net Pay', v: fmt(oldNet) },
                    ].map(r => (
                      <div key={r.l} className="flex justify-between items-center py-0.5">
                        <span className="text-[8px] text-slate-500 font-bold">{r.l}</span>
                        <span className="text-[10px] font-black text-slate-700 dark:text-slate-300">{r.v}</span>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-200 dark:border-emerald-900/30">
                    <p className="text-[7.5px] font-black text-emerald-500 uppercase tracking-widest mb-2">After</p>
                    {[
                      { l: 'Monthly CTC', v: fmt(newSalary.monthlyCTC) },
                      { l: 'Gross', v: fmt(newSalary.grossSalary) },
                      { l: 'Net Pay', v: fmt(newSalary.netSalary) },
                    ].map(r => (
                      <div key={r.l} className="flex justify-between items-center py-0.5">
                        <span className="text-[8px] text-slate-500 font-bold">{r.l}</span>
                        <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">{r.v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={cn("p-3 rounded-xl flex items-center gap-3", isPositive ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/30' : 'bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-900/30')}>
                  {isPositive ? <TrendingUp className="w-5 h-5 text-emerald-500 shrink-0" /> : <TrendingDown className="w-5 h-5 text-rose-500 shrink-0" />}
                  <div>
                    <p className={cn("text-sm font-black", isPositive ? 'text-emerald-600' : 'text-rose-600')}>
                      {isPositive ? '+' : ''}{fmt(incrementAmount)} per month
                    </p>
                    <p className="text-[8px] text-slate-500 font-bold">{isPositive ? '+' : ''}{incrementPercent}% change · Annual impact: {isPositive ? '+' : ''}{fmt(incrementAmount * 12)}</p>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-xl">
                  <p className="text-[8px] font-black text-amber-600 uppercase tracking-widest mb-1">Reason</p>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">{reason}</p>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 rounded-xl">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <p className="text-[10px] font-bold text-rose-600">{error}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button onClick={() => setStep('configure')} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer transition-all">
                    ← Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer shadow-lg shadow-blue-600/20 transition-all active:scale-[0.99] flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Submitting...</>
                    ) : (
                      <><CheckCircle2 className="w-3.5 h-3.5" /> {can('payroll.release_salary') ? 'Apply Revision' : 'Submit for Approval'}</>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
