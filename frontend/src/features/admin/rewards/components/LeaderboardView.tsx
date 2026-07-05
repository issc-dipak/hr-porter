"use client";

import React, { useState } from 'react';
import { Trophy, Award, Search, User } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  leaderboard: any[];
}

export default function LeaderboardView({ leaderboard }: Props) {
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  const filtered = leaderboard.filter((emp) => {
    const matchesSearch = emp.fullName.toLowerCase().includes(search.toLowerCase());
    const matchesDept = !deptFilter || emp.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  const departments = Array.from(new Set(leaderboard.map(e => e.department).filter(Boolean)));

  return (
    <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-6 space-y-6">
      {/* ── Filters ── */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-base font-bold text-white">Leaderboard Rankings</h2>
          <p className="text-xs text-slate-400 mt-0.5">Real-time stats of overall recognition points across departments.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search employee..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-800 border border-slate-700/60 rounded-xl text-xs text-slate-200 outline-none focus:border-violet-500 w-48"
            />
          </div>
          <select
            value={deptFilter}
            onChange={e => setDeptFilter(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700/60 rounded-xl text-xs text-slate-300 outline-none focus:border-violet-500"
          >
            <option value="">All Departments</option>
            {departments.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
      </div>

      {/* ── Rankings Table ── */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="border-b border-slate-850 text-slate-500 font-semibold uppercase tracking-wider">
              <th className="py-3 px-4 text-center w-16">Rank</th>
              <th className="py-3 px-4">Employee</th>
              <th className="py-3 px-4">Department</th>
              <th className="py-3 px-4">Designation</th>
              <th className="py-3 px-4 text-right">Points Wallet</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850/30 text-slate-300">
            {filtered.map((emp, i) => {
              const rank = i + 1;
              const isTopThree = rank <= 3;
              const trophyColor = rank === 1 ? 'text-amber-400' : rank === 2 ? 'text-slate-300' : 'text-amber-600';

              return (
                <tr key={emp._id} className="hover:bg-slate-800/10">
                  <td className="py-4 px-4 text-center">
                    {isTopThree ? (
                      <Trophy className={`w-5 h-5 mx-auto ${trophyColor} fill-current`} />
                    ) : (
                      <span className="font-semibold text-slate-500">{rank}</span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center font-bold">
                        {emp.fullName.charAt(0)}
                      </div>
                      <span className="font-bold text-slate-200">{emp.fullName}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-slate-400">{emp.department || 'Operations'}</td>
                  <td className="py-4 px-4 text-slate-500">{emp.designation || 'Staff'}</td>
                  <td className="py-4 px-4 text-right font-black text-violet-400 text-sm">{emp.rewardPoints || 0} Pts</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
