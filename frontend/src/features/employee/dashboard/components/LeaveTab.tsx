"use client";

import React from 'react';
import { Calendar, Plus, Briefcase } from 'lucide-react';
import { cn } from "@/lib/utils";
import { PastelStatCard } from '@/components/ui/PastelStatCard';
import { motion } from 'framer-motion';

interface LeaveTabProps {
  totalLeavesLimit: number;
  approvedCount: number;
  remainingLeaves: number;
  myLeaves: any[];
  setShowLeaveModal: (show: boolean) => void;
  calendarWidget?: React.ReactNode;
}

export function LeaveTab({
  totalLeavesLimit,
  approvedCount,
  remainingLeaves,
  myLeaves,
  setShowLeaveModal,
  calendarWidget
}: LeaveTabProps) {
  // Custom theme colors for metrics
  const metricConfigs = [
    { 
      label: 'Yearly Allowance', 
      value: `${totalLeavesLimit} Days`, 
      text: 'text-blue-600 dark:text-blue-400', 
      bg: 'bg-blue-500/10', 
      border: 'border-blue-500/20' 
    },
    { 
      label: 'Leaves Approved', 
      value: `${approvedCount} Days`, 
      text: 'text-emerald-600 dark:text-emerald-400', 
      bg: 'bg-emerald-500/10', 
      border: 'border-emerald-500/20' 
    },
    { 
      label: 'Remaining Balance', 
      value: `${remainingLeaves} Days`, 
      text: 'text-purple-600 dark:text-purple-400', 
      bg: 'bg-purple-500/10', 
      border: 'border-purple-500/20' 
    },
  ];

  return (
    <div className="space-y-6 text-left">
      {/* Redesigned compact premium header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2">
        <div>
          <h2 className="text-xl font-black uppercase tracking-widest text-slate-900 dark:text-white">Leaves Portal</h2>
          <p className="text-[10px] font-bold text-slate-450 dark:text-slate-500 mt-1 uppercase tracking-wider leading-none">
            Book paid off-times, view balances, or track approval pipelines.
          </p>
        </div>
        <button 
          onClick={() => setShowLeaveModal(true)} 
          className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-650 hover:scale-[1.02] text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-md shadow-blue-500/10 cursor-pointer flex items-center gap-1.5 border-none"
        >
          <Plus className="w-3.5 h-3.5" /> Request Time Off
        </button>
      </div>

      <div className={cn("grid grid-cols-1 gap-6", calendarWidget ? "lg:grid-cols-3" : "")}>
        <div className={cn("space-y-6", calendarWidget ? "lg:col-span-2" : "")}>
          {/* Sleeker and more compact leave stats metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            {[
              { 
                label: 'Yearly Allowance', 
                value: `${totalLeavesLimit} Days`, 
                accent: '#3B82F6',
                sub: 'Annual holiday pool'
              },
              { 
                label: 'Leaves Approved', 
                value: `${approvedCount} Days`, 
                accent: '#10B981',
                sub: 'Days approved by HR'
              },
              { 
                label: 'Remaining Balance', 
                value: `${remainingLeaves} Days`, 
                accent: '#8B5CF6',
                sub: 'Available leaves to apply'
              },
            ].map((stat, idx) => (
          <PastelStatCard key={idx} icon={stat.icon} label={stat.label} value={stat.value} sub={stat.sub || stat.desc} accent={stat.accent} />
        ))}
          </div>

          {/* Premium compact leaves timeline/history */}
          <div className="saas-card bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900/90 dark:to-slate-950/70 border border-slate-205/30 dark:border-slate-800/80 p-3.5 rounded-[28px] shadow-md space-y-3">
            <div className="flex justify-between items-center pb-1">
              <h3 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-1.5 select-none">
                <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
                My Leave Journey
              </h3>
              <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-full select-none">
                {myLeaves.length} {myLeaves.length === 1 ? 'Request' : 'Requests'}
              </span>
            </div>

            <div className="saas-table-container saas-table-compact !border-none !bg-transparent !shadow-none !rounded-none">
              <table className="saas-table">
                <thead className="saas-table-thead">
                  <tr>
                    <th className="saas-table-th">Dates</th>
                    <th className="saas-table-th">Leave Type</th>
                    <th className="saas-table-th text-center">Duration</th>
                    <th className="saas-table-th">Reason</th>
                    <th className="saas-table-th text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {myLeaves.length === 0 ? (
                    <tr className="saas-table-row">
                      <td colSpan={5} className="saas-table-td text-center text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase py-10">
                        No time-off requests applied yet.
                      </td>
                    </tr>
                  ) : (
                    myLeaves.map((leave) => (
                      <tr key={leave.id || leave._id} className="saas-table-row">
                        <td className="saas-table-td">
                          <div className="flex items-center gap-1.5 whitespace-nowrap">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                            <span className="font-extrabold text-slate-900 dark:text-white uppercase text-[10px] tracking-wide leading-tight">{leave.date}</span>
                          </div>
                          <div className="text-[7.5px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-0.5 leading-none pl-3 whitespace-nowrap">
                            Applied: {leave.createdAt ? new Date(leave.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="saas-table-td whitespace-nowrap">
                          {(() => {
                            const typeLower = (leave.type || '').toLowerCase();
                            if (typeLower.includes('sick')) {
                              return (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[8.5px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-455 border border-rose-500/15">
                                  🤒 Sick
                                </span>
                              );
                            }
                            if (typeLower.includes('casual')) {
                              return (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[8.5px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-455 border border-amber-500/15">
                                  🌴 Casual
                                </span>
                              );
                            }
                            if (typeLower.includes('maternity') || typeLower.includes('paternity') || typeLower.includes('parental')) {
                              return (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[8.5px] font-black uppercase tracking-wider bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/15">
                                  🍼 Parental
                                </span>
                              );
                            }
                            return (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[8.5px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/15">
                                📅 {leave.type}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="saas-table-td text-center">
                          <span className="inline-block text-[9px] font-extrabold text-slate-900 dark:text-white px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md border border-slate-205/30 dark:border-slate-850/50 whitespace-nowrap">
                            {leave.duration} {leave.duration === 1 ? 'Day' : 'Days'}
                          </span>
                        </td>
                        <td 
                          className="saas-table-td text-slate-500 dark:text-slate-400 font-medium normal-case max-w-[120px] truncate whitespace-nowrap"
                          title={leave.reason}
                        >
                          {leave.reason}
                        </td>
                        <td className="saas-table-td text-right">
                          <span className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border",
                            leave.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.05)]' :
                            leave.status === 'Pending' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.05)]' :
                            'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 shadow-[0_0_12px_rgba(239,68,68,0.05)]'
                          )}>
                            <span className={cn(
                              "w-1 h-1 rounded-full",
                              leave.status === 'Approved' ? "bg-emerald-500 animate-pulse" :
                              leave.status === 'Pending' ? "bg-amber-500 animate-pulse" :
                              "bg-rose-500"
                            )} />
                            {leave.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {calendarWidget && (
          <div className="lg:col-span-1">
            {calendarWidget}
          </div>
        )}
      </div>
    </div>
  );
}
