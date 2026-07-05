"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Loader2, X, Save, AlertTriangle, Shield, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API = '';
function getHeaders() {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('hr_system_token') || '';
  const companyId = localStorage.getItem('companyId') || 'company_001';
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'x-company-id': companyId };
}

const CATEGORIES = ['Technical', 'Financial', 'Resource', 'Timeline', 'Scope', 'External', 'Other'];
const PROBABILITIES = ['Low', 'Medium', 'High'];
const IMPACTS = ['Low', 'Medium', 'High', 'Critical'];
const STATUSES = ['Open', 'Mitigating', 'Resolved', 'Closed', 'Accepted'];

const SEVERITY_COLORS: Record<string, string> = {
  Low: 'bg-emerald-500/10 text-emerald-400',
  Medium: 'bg-amber-500/10 text-amber-400',
  High: 'bg-orange-500/10 text-orange-400',
  Critical: 'bg-red-500/10 text-red-400',
};

const STATUS_COLORS: Record<string, string> = {
  Open: 'bg-red-500/10 text-red-400',
  Mitigating: 'bg-amber-500/10 text-amber-400',
  Resolved: 'bg-emerald-500/10 text-emerald-400',
  Closed: 'bg-slate-500/10 text-slate-400',
  Accepted: 'bg-blue-500/10 text-blue-400',
};

interface Props {
  projectId: string;
  employees: any[];
}

export default function RiskTab({ projectId, employees }: Props) {
  const [risks, setRisks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', category: 'Technical',
    probability: 'Medium', impact: 'Medium', status: 'Open',
    ownerId: '', ownerName: '', mitigation: '', dueDate: ''
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/projects/${projectId}/risks`, { headers: getHeaders() as any });
      const json = await res.json();
      if (json.success) setRisks(json.data || []);
    } catch (_) {}
    setLoading(false);
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const addRisk = async () => {
    if (!form.title) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/projects/${projectId}/risks`, {
        method: 'POST',
        headers: getHeaders() as any,
        body: JSON.stringify({ ...form, companyId: 'company_001' })
      });
      const json = await res.json();
      if (json.success) { setRisks(prev => [json.data, ...prev]); setShowAdd(false); }
    } catch (_) {}
    setSaving(false);
  };

  const updateStatus = async (riskId: string, status: string) => {
    try {
      const res = await fetch(`${API}/api/projects/${projectId}/risks/${riskId}`, {
        method: 'PUT',
        headers: getHeaders() as any,
        body: JSON.stringify({ status, companyId: 'company_001', resolvedAt: status === 'Resolved' ? new Date().toISOString() : undefined })
      });
      const json = await res.json();
      if (json.success) setRisks(prev => prev.map(r => r._id === riskId ? json.data : r));
    } catch (_) {}
  };

  const openRisks = risks.filter(r => ['Open', 'Mitigating'].includes(r.status));
  const resolvedRisks = risks.filter(r => ['Resolved', 'Closed', 'Accepted'].includes(r.status));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white">Risk Register</h2>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">{openRisks.length} Open</span>
            <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">{resolvedRisks.length} Resolved</span>
          </div>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-colors">
          <Plus className="w-4 h-4" /> Add Risk
        </button>
      </div>

      {/* Risk Matrix Summary */}
      {risks.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {['Low', 'Medium', 'High', 'Critical'].map(sev => {
            const count = risks.filter(r => r.severityLevel === sev && ['Open', 'Mitigating'].includes(r.status)).length;
            return (
              <div key={sev} className={`rounded-xl p-3 border ${SEVERITY_COLORS[sev].replace('text-', 'border-').replace('/10', '/20').replace('bg-', 'bg-')}`}>
                <div className={`text-xl font-bold ${SEVERITY_COLORS[sev].split(' ')[1]}`}>{count}</div>
                <div className="text-xs text-slate-400 mt-0.5">{sev} Severity</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Risks List */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-violet-400 animate-spin" /></div>
      ) : risks.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Shield className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>No risks logged</p>
          <button onClick={() => setShowAdd(true)} className="mt-3 text-violet-400 text-sm">+ Log first risk</button>
        </div>
      ) : (
        <div className="space-y-3">
          {risks.map((risk, i) => (
            <motion.div key={risk._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${SEVERITY_COLORS[risk.severityLevel] || SEVERITY_COLORS.Low}`}>
                      {risk.severityLevel} Risk
                    </span>
                    <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded">{risk.category}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[risk.status] || ''}`}>{risk.status}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-200">{risk.title}</h3>
                  {risk.description && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{risk.description}</p>}
                  {risk.mitigation && (
                    <div className="mt-2 p-2 bg-slate-800/50 rounded-lg">
                      <p className="text-xs text-slate-500 font-medium">Mitigation:</p>
                      <p className="text-xs text-slate-400">{risk.mitigation}</p>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <div className="text-right">
                    <div className="text-xs text-slate-500 mb-1">P × I = Score</div>
                    <div className={`text-lg font-bold ${risk.severity >= 8 ? 'text-red-400' : risk.severity >= 4 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {risk.severity}
                    </div>
                  </div>
                  {risk.status !== 'Resolved' && risk.status !== 'Closed' && (
                    <select value={risk.status} onChange={e => updateStatus(risk._id, e.target.value)}
                      className="text-xs bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-300 outline-none">
                      {STATUSES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-800/50">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs text-slate-500">Probability: <strong className="text-slate-300">{risk.probability}</strong></span>
                  <span className="text-xs text-slate-500">Impact: <strong className="text-slate-300">{risk.impact}</strong></span>
                  {risk.ownerName && <span className="text-xs text-slate-500">Owner: <strong className="text-slate-300">{risk.ownerName}</strong></span>}
                  {risk.dueDate && <span className="text-xs text-slate-500">Due: {risk.dueDate}</span>}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Risk Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) setShowAdd(false); }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-700/60 rounded-2xl w-full max-w-lg shadow-2xl">
              <div className="flex items-center justify-between p-5 border-b border-slate-800">
                <h2 className="text-base font-bold text-white">Log Risk</h2>
                <button onClick={() => setShowAdd(false)}><X className="w-5 h-5 text-slate-400 hover:text-white" /></button>
              </div>
              <div className="p-5 space-y-3 max-h-[65vh] overflow-auto">
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Risk title *" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-violet-500" />
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Risk description" rows={2}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-violet-500 resize-none" />
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Category', field: 'category', options: CATEGORIES },
                    { label: 'Probability', field: 'probability', options: PROBABILITIES },
                    { label: 'Impact', field: 'impact', options: IMPACTS },
                    { label: 'Status', field: 'status', options: STATUSES },
                  ].map(f => (
                    <div key={f.field}>
                      <label className="block text-xs text-slate-400 mb-1.5">{f.label}</label>
                      <select value={(form as any)[f.field]} onChange={e => setForm(fv => ({ ...fv, [f.field]: e.target.value }))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-violet-500">
                        {f.options.map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Owner</label>
                    <select value={form.ownerId} onChange={e => {
                      const emp = employees.find((em: any) => em._id === e.target.value);
                      setForm(f => ({ ...f, ownerId: e.target.value, ownerName: emp?.fullName || '' }));
                    }} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-violet-500">
                      <option value="">Unassigned</option>
                      {employees.map((e: any) => <option key={e._id} value={e._id}>{e.fullName}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Due Date</label>
                    <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-violet-500" />
                  </div>
                </div>
                <textarea value={form.mitigation} onChange={e => setForm(f => ({ ...f, mitigation: e.target.value }))}
                  placeholder="Mitigation plan" rows={2}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-violet-500 resize-none" />
              </div>
              <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-800">
                <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm text-slate-400 border border-slate-700 rounded-xl">Cancel</button>
                <button onClick={addRisk} disabled={saving || !form.title}
                  className="flex items-center gap-2 px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                  Log Risk
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
