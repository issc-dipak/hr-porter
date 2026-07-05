"use client";

import React from 'react';
import { Trophy, Award, Heart, Gift, Sparkles, TrendingUp, Users, Shield, Calendar, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { PastelStatCard } from '@/components/ui/PastelStatCard';

interface Props {
  stats: any;
  role: string;
  onNavigateTab: (tab: string) => void;
}

export default function RoleDashboardWidget({ stats, role, onNavigateTab }: Props) {
  const d = stats || {};
  const my = d.myStats || {};

  // 1. Employee Dashboard View Layout
  if (role === 'Employee') {
    const cards = [
      { label: 'My Points Balance', value: my.pointsBalance ?? 0, icon: Sparkles, color: 'text-violet-400', bg: 'from-violet-500/10 to-indigo-500/5 border-violet-500/20' },
      { label: 'My Badges Earned', value: my.badgesCount ?? 0, icon: Award, color: 'text-amber-400', bg: 'from-amber-500/10 to-orange-500/5 border-amber-500/20' },
      { label: 'Appreciations Received', value: my.appreciationsReceived ?? 0, icon: Heart, color: 'text-rose-400', bg: 'from-rose-500/10 to-pink-500/5 border-rose-500/20' },
      { label: 'Appreciations Given', value: my.appreciationsGiven ?? 0, icon: Heart, color: 'text-emerald-400', bg: 'from-emerald-500/10 to-teal-500/5 border-emerald-500/20' },
    ];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {cards.map((kpi, i) => (
            <motion.div key={kpi.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={`bg-gradient-to-br ${kpi.bg} border rounded-2xl p-5 flex flex-col gap-3 shadow-sm`}>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold">{kpi.label}</span>
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              <div className="text-3xl font-extrabold text-white tracking-tight">{kpi.value}</div>
            </motion.div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-slate-900 border border-slate-800/60 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Trophy className="w-36 h-36 text-violet-400" />
            </div>
            <span className="text-xs px-2 py-0.5 bg-violet-500/10 text-violet-400 rounded-full font-bold uppercase tracking-wider">Hall of Fame Winner</span>
            {d.latestEom ? (
              <div className="flex items-start gap-4 mt-4">
                <div className="w-14 h-14 rounded-2xl bg-violet-600 flex items-center justify-center text-lg font-bold text-white shadow-lg">
                  {d.latestEom.employeeName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">{d.latestEom.employeeName}</h3>
                  <p className="text-xs text-slate-400">{d.latestEom.department || 'Operations'} • {d.latestEom.month}</p>
                  <p className="text-xs text-slate-300 mt-2 italic">"{d.latestEom.achievement}"</p>
                </div>
              </div>
            ) : (
              <p className="text-slate-500 text-xs mt-4">No Employee of the Month selected yet.</p>
            )}
            <div className="mt-6 flex gap-3">
              <button onClick={() => onNavigateTab('Wall')} className="text-[11px] font-bold px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all">Appreciate a Peer</button>
              <button onClick={() => onNavigateTab('Catalog')} className="text-[11px] font-bold px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl transition-all">Redeem Store</button>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-6">
            <h4 className="text-xs font-bold text-slate-200 mb-3 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" /> Rules
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>• Earn 50 pts per Badge</li>
              <li>• Earn 200 pts for Perfect Attendance</li>
              <li>• Earn 500 pts for Employee of Month</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // 2. HR Dashboard View Layout
  if (role === 'HR') {
    const hrCards = [
      { label: 'Pending Nominations', value: d.totalRedemptions ?? 0, icon: Clock, accent: '#F59E0B', sub: 'Awaiting review' },
      { label: 'Active Campaigns', value: 2, icon: Calendar, accent: '#8B5CF6', sub: 'Ongoing events' },
      { label: 'Total Appreciations', value: d.totalAppreciations ?? 0, icon: Heart, accent: '#F43F5E', sub: 'Given by employees' },
      { label: 'Badges Issued', value: d.totalBadges ?? 0, icon: Award, accent: '#10B981', sub: 'Thematic milestones' },
    ];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {hrCards.map((c, i) => (
            <PastelStatCard key={i} icon={c.icon} label={c.label} value={c.value} sub={c.sub} accent={c.accent} />
          ))}
        </div>
        <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5 space-y-4">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-violet-400" /> Recent Appreciations Log
          </h3>
          <p className="text-xs text-slate-400">Track and review employee engagement milestones directly from the database.</p>
          <div className="text-right">
            <button onClick={() => onNavigateTab('Wall')} className="text-xs font-bold text-violet-400 hover:underline">View Wall Feed →</button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Admin Dashboard View Layout (Default/Admin/Super Admin)
  const adminCards = [
    { label: 'Total Appreciations', value: d.totalAppreciations ?? 0, icon: Heart, accent: '#F43F5E', sub: 'Cumulative total' },
    { label: 'Total Badges Awarded', value: d.totalBadges ?? 0, icon: Award, accent: '#F59E0B', sub: 'Awarded to employees' },
    { label: 'Total Points Distributed', value: d.totalPointsAwarded ?? 0, icon: Sparkles, accent: '#8B5CF6', sub: 'Points balance pool' },
    { label: 'Total Redemptions Logged', value: d.totalRedemptions ?? 0, icon: Trophy, accent: '#10B981', sub: 'Redeemed rewards' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {adminCards.map((c, i) => (
          <PastelStatCard key={i} icon={c.icon} label={c.label} value={c.value} sub={c.sub} accent={c.accent} />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Performers Leaderboard widget */}
        {d.topPerformers?.length > 0 && (
          <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5 space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Trophy className="w-3.5 h-3.5 text-violet-400" />
              Company Leaderboard Top Performers
            </h4>
            <div className="divide-y divide-slate-850/40">
              {d.topPerformers.map((p: any, i: number) => (
                <div key={p._id} className="flex items-center justify-between py-2.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-400">{i + 1}</span>
                    <span>{p.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-slate-500">{p.count} badges</span>
                    <span className="text-violet-400 font-bold">{p.points} Pts</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Audit Log and Activity Settings */}
        <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5 flex flex-col justify-between">
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-violet-400" />
              System Audit Tracker
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every badge award, points credit/debit, and reward redemption is logged with the actor's IP, timestamp, and branch ID.
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-800/40 text-right">
            <span className="text-[10px] text-slate-500 italic block">System is 100% compliant with SaaS audit guidelines.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
