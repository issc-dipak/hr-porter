"use client";

import React, { useMemo } from 'react';
import { 
  UserCheck, DollarSign, Clock, Briefcase, ArrowRight, Award
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { cn } from "@/lib/utils";
import { PastelStatCard } from '@/components/ui/PastelStatCard';
import { motion } from 'framer-motion';
import { IJob, IReferral } from './types';

interface DashboardOverviewProps {
  jobs: IJob[];
  referrals: IReferral[];
  totalBonusEarned: number;
  pendingBonusAmount: number;
  aiRecommendedJobs: IJob[];
  hasApplied: (job: IJob) => boolean;
  handleApplyInternally: (job: IJob) => void;
  setActiveSubTab: (tab: 'dashboard' | 'internal-jobs' | 'my-referrals' | 'career-growth' | 'profile-grow' | 'interviews-conduct') => void;
}

export default function DashboardOverview({
  jobs,
  referrals,
  totalBonusEarned,
  pendingBonusAmount,
  aiRecommendedJobs,
  hasApplied,
  handleApplyInternally,
  setActiveSubTab
}: DashboardOverviewProps) {
  
  const stats = useMemo(() => [
    { label: 'Referrals Submitted', value: referrals.length, icon: UserCheck, color: 'text-blue-650 dark:text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Bonus Earned', value: `₹${totalBonusEarned.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Pending Bonuses', value: `₹${pendingBonusAmount.toLocaleString()}`, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Internal Applications', value: jobs.filter(hasApplied).length, icon: Briefcase, color: 'text-indigo-500', bg: 'bg-indigo-500/10' }
  ], [referrals, totalBonusEarned, pendingBonusAmount, jobs, hasApplied]);

  const conversionRate = useMemo(() => {
    if (referrals.length === 0) return 0;
    return Math.round((referrals.filter(r => r.status === 'Selected').length / referrals.length) * 100);
  }, [referrals]);

  return (
    <div className="space-y-6">
      {/* Stat cards grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
        {[
          { label: 'Referrals Submitted', value: referrals.length.toString(), icon: UserCheck, accent: '#3B82F6', sub: 'Candidates you referred' },
          { label: 'Bonus Earned', value: `₹${totalBonusEarned.toLocaleString()}`, icon: DollarSign, accent: '#10B981', sub: 'Paid referral rewards' },
          { label: 'Pending Bonuses', value: `₹${pendingBonusAmount.toLocaleString()}`, icon: Clock, accent: '#F59E0B', sub: 'Awaiting candidate milestones' },
          { label: 'Internal Applications', value: jobs.filter(hasApplied).length.toString(), icon: Briefcase, accent: '#8B5CF6', sub: 'Jobs you applied to' }
        ].map((stat, idx) => (
          <PastelStatCard key={idx} icon={stat.icon} label={stat.label} value={stat.value} sub={stat.sub} accent={stat.accent} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left col: AI Recommended roles & Applications */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Recommendations card */}
          <div className="p-5 bg-slate-100 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-850 dark:to-slate-950 text-slate-800 dark:text-white rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md dark:shadow-xl space-y-4 relative overflow-hidden text-left">
            <div className="absolute top-0 right-0 w-44 h-44 bg-slate-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex justify-between items-center">
              <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                Internal Opportunities
              </span>
              <button 
                onClick={() => setActiveSubTab('profile-grow')}
                className="text-[9.5px] font-black uppercase text-blue-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-white flex items-center gap-1 cursor-pointer bg-transparent border-none"
              >
                Adjust Skills <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-1">
              <h4 className="text-sm font-black tracking-tight text-slate-900 dark:text-white leading-none">Internal Career Growth Opportunities</h4>
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Top positions matching your customized skillset
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {aiRecommendedJobs.slice(0, 2).map((job) => (
                <div key={job._id || job.id} className="p-3.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-2xl flex justify-between items-center gap-4 hover:bg-slate-100 dark:hover:bg-white/10 transition-all">
                  <div className="space-y-1 text-left">
                    <div className="flex items-center gap-2">
                      <strong className="text-xs font-black text-slate-900 dark:text-white">{job.title}</strong>
                      <span className="px-1.5 py-0.5 bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/20 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[8px] font-black rounded-md">{job.aiScore}% Match</span>
                    </div>
                    <p className="text-[9.5px] text-slate-500 dark:text-slate-400">
                      {job.dept} • {job.location} • {job.salary}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {hasApplied(job) ? (
                      <span className="px-3 py-1.5 bg-slate-800 text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-wider">Applied</span>
                    ) : (
                      <button 
                        onClick={() => handleApplyInternally(job)}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer border-none"
                      >
                        Apply
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Referrals Tracker list card */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-150/40 dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
            <div>
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Active Referral Applications</h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Real-time status updates of referred candidates</p>
            </div>

            <div className="space-y-3">
              {referrals.slice(0, 3).map((ref) => (
                <div key={ref.id} className="p-3 bg-slate-50 dark:bg-slate-850 rounded-2xl flex items-center justify-between border border-transparent hover:border-slate-200 dark:hover:border-slate-750">
                  <div>
                    <strong className="block text-xs text-slate-850 dark:text-white font-black">{ref.name}</strong>
                    <span className="text-[9.5px] text-slate-400">{ref.role} • Submitted on {ref.date}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider",
                      ref.status === 'Selected' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' :
                      ref.status === 'Interview Scheduled' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400' :
                      'bg-amber-100 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                    )}>
                      {ref.status}
                    </span>
                    <span className="text-[10px] font-black text-emerald-600">₹{ref.bonus.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right col: Referral Analytics pie & Quick Referral submit shortcut */}
        <div className="space-y-6">
          {/* Referral conversion status */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-150/40 dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
            <div>
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Referral Stats Share</h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Application progression metrics</p>
            </div>

            <div className="h-44 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={[
                      { name: 'Selected', value: referrals.filter(r => r.status === 'Selected').length },
                      { name: 'In Progress', value: referrals.filter(r => r.status !== 'Selected').length }
                    ]} 
                    innerRadius={50} 
                    outerRadius={65} 
                    paddingAngle={3} 
                    dataKey="value"
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#2563eb" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Conversion</span>
                <span className="text-base font-black text-slate-900 dark:text-white">
                  {conversionRate}%
                </span>
              </div>
            </div>
          </div>

          {/* Career Ladder Progression status */}
          <div className="p-5 bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-950 text-slate-800 dark:text-white rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-md dark:shadow-none">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Next Transfer Level</h4>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Promotional track to Principal Engineer / Team Lead
            </p>
            
            <div className="space-y-2">
              <div className="flex justify-between text-[9px] font-bold text-slate-500 dark:text-slate-300">
                <span>Skills criteria match</span>
                <span>80% Completed</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden border border-slate-200/50 dark:border-none">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: '80%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
