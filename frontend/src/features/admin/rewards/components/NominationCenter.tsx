"use client";

import React, { useState } from 'react';
import { Plus, Search, Calendar, CheckCircle2, XCircle, Loader2, Award, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  nominations: any[];
  employees: any[];
  role: string;
  myEmployeeId: string;
  onSubmitNomination: (data: { nomineeId: string; category: string; reason: string; evidence?: string }) => Promise<void>;
  onApproveNomination: (id: string, status: 'Approved' | 'Rejected', pointsRewarded: number) => Promise<void>;
}

export default function NominationCenter({ nominations, employees, role, myEmployeeId, onSubmitNomination, onApproveNomination }: Props) {
  const [showSubmit, setShowSubmit] = useState(false);
  const [nomineeId, setNomineeId] = useState('');
  const [category, setCategory] = useState('Employee of the Month');
  const [reason, setReason] = useState('');
  const [evidence, setEvidence] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Approval inputs
  const [pointsMap, setPointsMap] = useState<Record<string, number>>({});
  const [actioningId, setActioningId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomineeId || !reason) return;
    setSubmitting(true);
    await onSubmitNomination({ nomineeId, category, reason, evidence });
    setNomineeId('');
    setReason('');
    setEvidence('');
    setSubmitting(false);
    setShowSubmit(false);
  };

  const handleAction = async (nomId: string, status: 'Approved' | 'Rejected') => {
    setActioningId(nomId);
    const pts = pointsMap[nomId] || (category === 'Employee of the Month' ? 500 : 100);
    await onApproveNomination(nomId, status, pts);
    setActioningId(null);
  };

  const isNominator = ['Admin', 'HR', 'Manager', 'Reporting Manager'].includes(role);
  const isApprover = ['Admin', 'HR'].includes(role);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white">Recognition Nominations</h2>
          <p className="text-xs text-slate-400 mt-0.5">Submit team achievements for high-value points and Hall of Fame consideration.</p>
        </div>
        {isNominator && (
          <button onClick={() => setShowSubmit(true)}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-xl transition-all">
            <Plus className="w-4 h-4" /> Submit Nomination
          </button>
        )}
      </div>

      {/* ── Nominations Logs ── */}
      <div className="grid grid-cols-1 gap-4">
        {nominations.map((nom) => (
          <div key={nom._id} className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5 space-y-4">
            <div className="flex items-start justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-600/10 text-violet-400 border border-violet-500/20 flex items-center justify-center font-bold text-sm">
                  {nom.nomineeName.charAt(0)}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-200">{nom.nomineeName}</h4>
                  <p className="text-xs text-slate-400">{nom.nomineeDepartment || 'Operations'} • Nominated by {nom.nominatorName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2 py-0.5 bg-slate-850 text-slate-300 rounded font-semibold">{nom.category}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  nom.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                  nom.status === 'Rejected' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                  'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}>
                  {nom.status}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 bg-slate-950/40 p-3 rounded-xl border border-slate-850/60">
              {nom.reason}
            </p>

            {nom.evidence && (
              <div className="text-[10px] text-slate-500 pl-1">
                Evidence: <span className="text-slate-400">{nom.evidence}</span>
              </div>
            )}

            {/* Approver Panel */}
            {isApprover && nom.status === 'Pending' && (
              <div className="pt-3 border-t border-slate-850/40 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-[10px] text-slate-400 font-semibold">Reward Points</label>
                  <input
                    type="number"
                    value={pointsMap[nom._id] ?? 500}
                    onChange={e => setPointsMap(prev => ({ ...prev, [nom._id]: Number(e.target.value) }))}
                    className="w-16 bg-slate-800 border border-slate-700/60 rounded px-2 py-1 text-xs outline-none text-violet-400 font-bold"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAction(nom._id, 'Approved')}
                    disabled={actioningId === nom._id}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded-lg"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button
                    onClick={() => handleAction(nom._id, 'Rejected')}
                    disabled={actioningId === nom._id}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold rounded-lg"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              </div>
            )}

            {nom.status === 'Approved' && (
              <div className="text-[10px] text-slate-500 flex items-center gap-3">
                <span>Points Rewarded: <strong className="text-violet-400">{nom.pointsRewarded}</strong></span>
                <span>Approved by: <strong className="text-slate-300">{nom.approvedByName}</strong></span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Submit Nomination Modal ── */}
      {showSubmit && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-slate-900 border border-slate-700/60 rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-850 pb-3">
              <h3 className="text-sm font-bold text-white">Nominate Employee</h3>
              <button onClick={() => setShowSubmit(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Select Employee *</label>
                <select value={nomineeId} onChange={e => setNomineeId(e.target.value)} required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs outline-none text-slate-200">
                  <option value="">Choose nominee...</option>
                  {employees.filter(e => e._id !== myEmployeeId).map(e => (
                    <option key={e._id} value={e._id}>{e.fullName} ({e.department})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Award Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs outline-none text-slate-200">
                  <option>Employee of the Month</option>
                  <option>Star Leadership</option>
                  <option>Productivity Hero</option>
                  <option>Perfect Attendance</option>
                  <option>Peer Excellence</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Reason for Nomination *</label>
                <textarea value={reason} onChange={e => setReason(e.target.value)} required placeholder="Provide metrics, goals met, or reasons..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs outline-none text-slate-200" rows={3} />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Supporting Evidence link/note</label>
                <input value={evidence} onChange={e => setEvidence(e.target.value)} placeholder="Ticket IDs, project links..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs outline-none text-slate-200" />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setShowSubmit(false)} className="px-4 py-2 border border-slate-750 text-slate-400 rounded-xl text-xs">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Nomination'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
