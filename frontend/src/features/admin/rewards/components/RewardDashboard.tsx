"use client";

import React from 'react';
import { Trophy, Award, Gift, Sparkles, TrendingUp, Users, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  stats: any;
  loading: boolean;
  onNavigateTab: (tab: string) => void;
}

export default function RewardDashboard({ stats, loading, onNavigateTab }: Props) {
  const d = stats || {};
  const my = d.myStats || {};

  const kpis = [
    { label: 'My Points Balance', value: my.pointsBalance ?? 0, icon: Sparkles, color: 'text-violet-400', bg: 'from-violet-500/10 to-indigo-500/5 border-violet-500/20' },
    { label: 'My Badges Earned', value: my.badgesCount ?? 0, icon: Award, color: 'text-amber-400', bg: 'from-amber-500/10 to-orange-500/5 border-amber-500/20' },
    { label: 'Appreciations Received', value: my.appreciationsReceived ?? 0, icon: Heart, color: 'text-rose-400', bg: 'from-rose-500/10 to-pink-500/5 border-rose-500/20' },
    { label: 'Appreciations Given', value: my.appreciationsGiven ?? 0, icon: Heart, color: 'text-emerald-400', bg: 'from-emerald-500/10 to-teal-500/5 border-emerald-500/20' },
  ];

  const adminKpis = [
    { label: 'Total Appreciations', value: d.totalAppreciations ?? 0, icon: Heart, color: 'text-rose-400' },
    { label: 'Total Badges Awarded', value: d.totalBadges ?? 0, icon: Award, color: 'text-amber-400' },
    { label: 'Total Points Claimed', value: d.totalPointsRedeemed ?? 0, icon: Gift, color: 'text-violet-400' },
    { label: 'Total Redemptions', value: d.totalRedemptions ?? 0, icon: Trophy, color: 'text-emerald-400' },
  ];

  return (
    <div className="space-y-6">
      {/* ── My Wallet Summary ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`bg-gradient-to-br ${kpi.bg} border rounded-2xl p-5 flex flex-col gap-3`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-semibold">{kpi.label}</span>
              <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
            </div>
            <div className="text-3xl font-extrabold text-white tracking-tight">{kpi.value}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Employee of the Month Hero Card ── */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800/60 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Trophy className="w-48 h-48 text-violet-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs px-2 py-0.5 bg-violet-500/10 text-violet-400 rounded-full font-bold uppercase tracking-wider">Hall of Fame</span>
              <span className="text-xs text-slate-500">🏆 Employee of the Month</span>
            </div>
            {d.latestEom ? (
              <div className="flex items-start gap-4 mt-2">
                <div className="w-16 h-16 rounded-2xl bg-violet-600 flex items-center justify-center text-xl font-bold text-white shadow-lg">
                  {d.latestEom.employeeName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-100">{d.latestEom.employeeName}</h3>
                  <p className="text-xs text-slate-400">{d.latestEom.department || 'Operations'} • {d.latestEom.month}</p>
                  <p className="text-sm text-slate-300 mt-2 italic">"{d.latestEom.achievement}"</p>
                </div>
              </div>
            ) : (
              <div className="py-6 text-slate-500 text-sm">
                No Employee of the Month announced yet for this period.
              </div>
            )}
          </div>
          <div className="mt-6 flex gap-3 flex-wrap">
            <button onClick={() => onNavigateTab('Wall')} className="text-xs font-semibold px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all">
              Appreciate a Peer
            </button>
            <button onClick={() => onNavigateTab('Catalog')} className="text-xs font-semibold px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl transition-all">
              Redeem My Points
            </button>
          </div>
        </div>

        {/* ── Quick Rules Card ── */}
        <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-400" />
              How to Earn Points
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                <span>Earn <strong>50+ pts</strong> when awarded a project Badge.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                <span>Earn <strong>200+ pts</strong> for perfect attendance milestones.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                <span>Earn <strong>500 pts</strong> for Employee of the Month award.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                <span>Helping team members on tasks.</span>
              </li>
            </ul>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-500">
            <span>Points cannot be converted to cash.</span>
          </div>
        </div>
      </div>

      {/* ── Admin Analytics Section ── */}
      {stats && (
        <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-violet-400" />
            Company Recognition Overview
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {adminKpis.map((kpi) => (
              <div key={kpi.label} className="p-4 bg-slate-800/40 border border-slate-800/50 rounded-xl">
                <div className="text-xs text-slate-500 font-semibold">{kpi.label}</div>
                <div className={`text-xl font-bold mt-1 ${kpi.color}`}>{kpi.value}</div>
              </div>
            ))}
          </div>

          {/* Top recognized employee leaderboard summary */}
          {d.topPerformers?.length > 0 && (
            <div className="pt-4 border-t border-slate-800/60">
              <h4 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">Top Recognized Employees</h4>
              <div className="space-y-2">
                {d.topPerformers.map((p: any, i: number) => (
                  <div key={p._id} className="flex items-center justify-between text-xs text-slate-300 p-2 bg-slate-800/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-400">{i + 1}</span>
                      <span>{p.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-slate-500">{p.count} badges</span>
                      <span className="text-violet-400 font-bold">{p.points} pts</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
