"use client";

import React, { useState } from 'react';
import { Award, Plus, Sparkles, Loader2, User, Trophy, ShieldAlert, Star } from 'lucide-react';
import { motion } from 'framer-motion';

// Mock list of lucide icons for selecting
const ICON_OPTIONS = ['Award', 'Trophy', 'Star', 'Zap', 'Shield', 'Flame', 'Heart', 'Cpu', 'Users', 'Target'];

interface Props {
  badges: any[];
  myBadges: any[];
  employees: any[];
  role: string;
  onAwardBadge: (data: { employeeId: string; badgeId: string; reason: string }) => Promise<void>;
  onCreateBadge: (data: { name: string; description: string; icon: string; points: number; criteria: string }) => Promise<void>;
}

export default function BadgeLibrary({ badges, myBadges, employees, role, onAwardBadge, onCreateBadge }: Props) {
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('Award');
  const [points, setPoints] = useState(50);
  const [criteria, setCriteria] = useState('');
  const [savingBadge, setSavingBadge] = useState(false);

  // Awarding states
  const [showAward, setShowAward] = useState<string | null>(null); // badgeId
  const [awardEmployeeId, setAwardEmployeeId] = useState('');
  const [awardReason, setAwardReason] = useState('');
  const [awarding, setAwarding] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description) return;
    setSavingBadge(true);
    await onCreateBadge({ name, description, icon, points, criteria });
    setName('');
    setDescription('');
    setIcon('Award');
    setPoints(50);
    setCriteria('');
    setSavingBadge(false);
    setShowCreate(false);
  };

  const handleAward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAward || !awardEmployeeId) return;
    setAwarding(true);
    await onAwardBadge({ badgeId: showAward, employeeId: awardEmployeeId, reason: awardReason });
    setAwardEmployeeId('');
    setAwardReason('');
    setAwarding(false);
    setShowAward(null);
  };

  const isManagerOrAbove = ['Admin', 'HR', 'Manager', 'Reporting Manager'].includes(role);

  return (
    <div className="space-y-6">
      {/* ── Section Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white">Badge Cabinet</h2>
          <p className="text-xs text-slate-400 mt-0.5">Collect achievement badges and unlock premium reward points.</p>
        </div>
        {role === 'Admin' && (
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-xl transition-all">
            <Plus className="w-4 h-4" /> Create Badge
          </button>
        )}
      </div>

      {/* ── My Badges Cabinet (for all employees) ── */}
      {myBadges.length > 0 && (
        <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5">
          <h3 className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider flex items-center gap-2">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />
            My Achievements ({myBadges.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {myBadges.map((eb) => (
              <motion.div key={eb._id} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="bg-slate-850 border border-slate-800/80 rounded-xl p-3 flex flex-col items-center text-center gap-1.5 hover:border-amber-500/20 transition-all">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-inner">
                  <Award className="w-5 h-5" />
                </div>
                <div className="text-[11px] font-bold text-slate-200 truncate w-full">{eb.badgeName}</div>
                <div className="text-[9px] text-slate-500 font-medium">+{eb.badgePoints} pts</div>
                <div className="text-[8px] text-slate-600 leading-tight mt-1">{eb.earnedDate}</div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ── Available Badge Library Catalog ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {badges.map((badge) => (
          <div key={badge._id} className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5 flex flex-col justify-between">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-violet-600/10 text-violet-400 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-200">{badge.name}</h4>
                <p className="text-xs text-slate-400 mt-1">{badge.description}</p>
                <div className="flex gap-2 mt-2">
                  <span className="text-[9px] px-2 py-0.5 bg-violet-500/10 text-violet-400 rounded-full font-bold">
                    {badge.points} Points
                  </span>
                  {badge.criteria && (
                    <span className="text-[9px] px-2 py-0.5 bg-slate-850 text-slate-400 rounded-full font-medium truncate max-w-32">
                      Goal: {badge.criteria}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {isManagerOrAbove && (
              <button onClick={() => setShowAward(badge._id)}
                className="w-full mt-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold rounded-xl transition-all">
                Award Badge
              </button>
            )}
          </div>
        ))}
      </div>

      {/* ── Create Badge Modal ── */}
      {showCreate && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-slate-900 border border-slate-700/60 rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-850 pb-3">
              <h3 className="text-sm font-bold text-white">Create Badge Definition</h3>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Badge Name *</label>
                <input value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Star Performer"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs outline-none text-slate-200" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Description *</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} required placeholder="Describe this achievement..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs outline-none text-slate-200" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Points Reward</label>
                  <input type="number" value={points} onChange={e => setPoints(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs outline-none text-slate-200" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Criteria Target</label>
                  <input value={criteria} onChange={e => setCriteria(e.target.value)} placeholder="Perfect attendance"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs outline-none text-slate-200" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 border border-slate-750 text-slate-400 rounded-xl text-xs">Cancel</button>
                <button type="submit" disabled={savingBadge} className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold">
                  {savingBadge ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Badge'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* ── Award Badge Modal ── */}
      {showAward && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-slate-900 border border-slate-700/60 rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-850 pb-3">
              <h3 className="text-sm font-bold text-white">Award Badge</h3>
              <button onClick={() => setShowAward(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleAward} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Select Employee *</label>
                <select value={awardEmployeeId} onChange={e => setAwardEmployeeId(e.target.value)} required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs outline-none text-slate-200">
                  <option value="">Choose employee...</option>
                  {employees.map(e => <option key={e._id} value={e._id}>{e.fullName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Reason for Award *</label>
                <textarea value={awardReason} onChange={e => setAwardReason(e.target.value)} required placeholder="Describe what they did..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs outline-none text-slate-200" />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setShowAward(null)} className="px-4 py-2 border border-slate-750 text-slate-400 rounded-xl text-xs">Cancel</button>
                <button type="submit" disabled={awarding} className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold">
                  {awarding ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Award Badge'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
