"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Loader2, X, Save, DollarSign, CheckCircle2, Clock, AlertTriangle, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const API = '';
function getHeaders() {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('hr_system_token') || '';
  const companyId = localStorage.getItem('companyId') || 'company_001';
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'x-company-id': companyId };
}

const CATEGORIES = ['Labor', 'Software', 'Travel', 'Hardware', 'Marketing', 'Other'];
const CAT_COLORS: Record<string, string> = {
  Labor: '#8b5cf6', Software: '#3b82f6', Travel: '#f59e0b',
  Hardware: '#10b981', Marketing: '#ec4899', Other: '#6b7280'
};

interface Props {
  projectId: string;
  project: any;
}

export default function BudgetTab({ projectId, project }: Props) {
  const [budget, setBudget] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ category: 'Labor', description: '', amount: '', date: new Date().toISOString().split('T')[0], vendor: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/projects/${projectId}/budget`, { headers: getHeaders() as any });
      const json = await res.json();
      if (json.success) setBudget(json.data);
    } catch (_) {}
    setLoading(false);
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const addExpense = async () => {
    if (!form.description || !form.amount) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/projects/${projectId}/budget/expense`, {
        method: 'POST',
        headers: getHeaders() as any,
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount), companyId: 'company_001' })
      });
      const json = await res.json();
      if (json.success) { setBudget(json.data); setShowAdd(false); setForm({ category: 'Labor', description: '', amount: '', date: new Date().toISOString().split('T')[0], vendor: '' }); }
    } catch (_) {}
    setSaving(false);
  };

  const approveExpense = async (expenseId: string, status: string) => {
    try {
      const res = await fetch(`${API}/api/projects/${projectId}/budget/expense/${expenseId}/approve`, {
        method: 'PATCH',
        headers: getHeaders() as any,
        body: JSON.stringify({ companyId: 'company_001', status })
      });
      const json = await res.json();
      if (json.success) setBudget(json.data);
    } catch (_) {}
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-violet-400 animate-spin" /></div>;

  const b = budget || {};
  const expenses = b.expenses || [];
  const approved = expenses.filter((e: any) => e.status === 'Approved');
  const pending = expenses.filter((e: any) => e.status === 'Pending');
  const usedBudget = b.usedBudget || 0;
  const approvedBudget = b.approvedBudget || project.approvedBudget || 0;
  const budgetPct = approvedBudget > 0 ? Math.round((usedBudget / approvedBudget) * 100) : 0;

  // Category breakdown for pie
  const catData = CATEGORIES.map(cat => ({
    name: cat,
    value: approved.filter((e: any) => e.category === cat).reduce((s: number, e: any) => s + e.amount, 0)
  })).filter(d => d.value > 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-white">Budget Tracker</h2>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-colors">
          <Plus className="w-4 h-4" /> Add Expense
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Budget', value: `₹${(b.totalBudget || 0).toLocaleString()}`, color: 'text-white', bg: 'bg-slate-800/50' },
          { label: 'Approved Budget', value: `₹${approvedBudget.toLocaleString()}`, color: 'text-blue-400', bg: 'bg-blue-500/5' },
          { label: 'Used Budget', value: `₹${usedBudget.toLocaleString()}`, color: budgetPct > 90 ? 'text-red-400' : 'text-emerald-400', bg: budgetPct > 90 ? 'bg-red-500/5' : 'bg-emerald-500/5' },
          { label: 'Remaining', value: `₹${Math.max(0, approvedBudget - usedBudget).toLocaleString()}`, color: 'text-violet-400', bg: 'bg-violet-500/5' },
        ].map(c => (
          <div key={c.label} className={`${c.bg} border border-slate-800/60 rounded-2xl p-4`}>
            <p className="text-xs text-slate-400 mb-1">{c.label}</p>
            <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Budget Progress */}
      <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-300 font-medium">Budget Utilization</span>
          <span className={`text-sm font-bold ${budgetPct > 90 ? 'text-red-400' : budgetPct > 70 ? 'text-amber-400' : 'text-emerald-400'}`}>{budgetPct}%</span>
        </div>
        <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, budgetPct)}%` }} transition={{ duration: 0.8 }}
            className={`h-full rounded-full ${budgetPct > 90 ? 'bg-red-500' : budgetPct > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
        </div>
        {pending.length > 0 && (
          <p className="text-xs text-amber-400 mt-2">⚠ {pending.length} pending expense{pending.length !== 1 ? 's' : ''} awaiting approval</p>
        )}
      </div>

      {/* Charts + Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Pie */}
        {catData.length > 0 && (
          <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">By Category</h3>
            <div className="flex items-center gap-3">
              <ResponsiveContainer width={100} height={100}>
                <PieChart>
                  <Pie data={catData} cx="50%" cy="50%" innerRadius={25} outerRadius={45} paddingAngle={3} dataKey="value">
                    {catData.map((entry, i) => <Cell key={i} fill={CAT_COLORS[entry.name] || '#6b7280'} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 flex-1">
                {catData.map(d => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CAT_COLORS[d.name] }} />
                      <span className="text-slate-400">{d.name}</span>
                    </div>
                    <span className="text-white font-semibold">₹{d.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Expenses Table */}
        <div className={`${catData.length > 0 ? 'lg:col-span-2' : 'lg:col-span-3'} bg-slate-900 border border-slate-800/60 rounded-2xl overflow-hidden`}>
          <div className="p-4 border-b border-slate-800/50">
            <h3 className="text-sm font-semibold text-slate-300">Expenses ({expenses.length})</h3>
          </div>
          {expenses.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">No expenses added yet</div>
          ) : (
            <div className="overflow-auto max-h-64">
              <table className="w-full">
                <thead className="sticky top-0 bg-slate-900">
                  <tr className="border-b border-slate-800/50">
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">Description</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">Category</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500">Amount</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">Status</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/30">
                  {expenses.map((exp: any) => (
                    <tr key={exp._id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="px-4 py-3 text-sm text-slate-300 truncate max-w-36">{exp.description}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ backgroundColor: `${CAT_COLORS[exp.category]}20`, color: CAT_COLORS[exp.category] }}>
                          {exp.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-white">₹{exp.amount?.toLocaleString()}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{exp.date}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          exp.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400' :
                          exp.status === 'Rejected' ? 'bg-red-500/10 text-red-400' :
                          'bg-amber-500/10 text-amber-400'
                        }`}>{exp.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        {exp.status === 'Pending' && (
                          <div className="flex items-center gap-1">
                            <button onClick={() => approveExpense(exp._id, 'Approved')} className="text-xs text-emerald-400 hover:text-emerald-300">✓</button>
                            <button onClick={() => approveExpense(exp._id, 'Rejected')} className="text-xs text-red-400 hover:text-red-300">✕</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Expense Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) setShowAdd(false); }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-700/60 rounded-2xl w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between p-5 border-b border-slate-800">
                <h2 className="text-base font-bold text-white">Add Expense</h2>
                <button onClick={() => setShowAdd(false)}><X className="w-5 h-5 text-slate-400 hover:text-white" /></button>
              </div>
              <div className="p-5 space-y-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-violet-500">
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Description *</label>
                  <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="What was this expense for?"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-violet-500" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Amount (₹) *</label>
                    <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                      placeholder="0.00" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-violet-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Date</label>
                    <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-violet-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Vendor (optional)</label>
                  <input value={form.vendor} onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))}
                    placeholder="Vendor name"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-violet-500" />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-800">
                <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm text-slate-400 border border-slate-700 rounded-xl">Cancel</button>
                <button onClick={addExpense} disabled={saving || !form.description || !form.amount}
                  className="flex items-center gap-2 px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Add Expense
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
