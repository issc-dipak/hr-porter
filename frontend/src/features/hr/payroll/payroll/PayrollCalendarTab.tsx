"use client";

import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, ShieldAlert, Award, DollarSign
} from 'lucide-react';
import { cn } from "@/lib/utils";

interface CalendarEvent {
  day: number;
  title: string;
  type: 'payout' | 'tax' | 'pf' | 'audit' | 'deadline';
  description: string;
}

export default function PayrollCalendarTab() {
  const [currentMonth, setCurrentMonth] = useState('May 2026');
  
  const events: CalendarEvent[] = [
    { day: 1, title: 'Monthly Roll-Over', type: 'audit', description: 'Monthly payroll draft cycle auto-generates.' },
    { day: 5, title: 'Attendance Audit', type: 'deadline', description: 'HR syncs biometric attendance logs.' },
    { day: 10, title: 'ESI & PF Filing', type: 'pf', description: 'Statutory government PF/ESI filing due date.' },
    { day: 15, title: 'Reimbursement Audit', type: 'audit', description: 'Deadline for approving employee business expenses.' },
    { day: 25, title: 'Salary Payout Release', type: 'payout', description: 'Trigger automatic corporate wallet payout release.' },
    { day: 30, title: 'TDS Tax Submission', type: 'tax', description: 'TDS tax deduction submission for all departments.' },
  ];

  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Payroll Calendar & Schedules</h3>
          <p className="text-[10px] text-slate-400 font-bold mt-0.5 uppercase tracking-wider">Plan salary releases, compliance deadlines, and statutory filing calendars.</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-850 p-1.5 rounded-xl border border-slate-200/50 dark:border-slate-800">
          <button className="p-1 hover:bg-white dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-all">
            <ChevronLeft className="w-4 h-4 text-slate-500" />
          </button>
          <span className="text-[10px] font-black uppercase tracking-widest px-3 text-slate-700 dark:text-slate-200">{currentMonth}</span>
          <button className="p-1 hover:bg-white dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-all">
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 saas-card bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-805 rounded-[2rem] p-6 shadow-sm" style={{ overflow: 'visible' }}>
          <div className="grid grid-cols-7 gap-2 text-center mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <span key={d} className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{d}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {/* Adding empty offset days to start May 2026 on Friday (offset = 5 days) */}
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={`offset-${idx}`} className="aspect-square bg-slate-50/20 dark:bg-slate-900/10 rounded-xl" />
            ))}
            {daysInMonth.map((day) => {
              const dayEvent = events.find(e => e.day === day);
              const colIndex = (day - 1 + 5) % 7;
              const horizontalAlign = 
                colIndex <= 1 ? "left-0 translate-x-0" :
                colIndex >= 5 ? "right-0 left-auto translate-x-0" :
                "left-1/2 -translate-x-1/2";

              return (
                <div 
                  key={day}
                  className={cn(
                    "aspect-square p-2 border border-slate-100 dark:border-slate-850 rounded-2xl text-left flex flex-col justify-between transition-all group relative hover:border-blue-500/20 hover:bg-blue-50/5",
                    dayEvent ? "bg-slate-50/50 dark:bg-slate-800/40" : "bg-white dark:bg-slate-900"
                  )}
                >
                  <span className={cn(
                    "text-[10px] font-black leading-none",
                    dayEvent ? "text-blue-600 dark:text-blue-400" : "text-slate-400"
                  )}>
                    {day}
                  </span>

                  {dayEvent && (
                    <>
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        dayEvent.type === 'payout' ? 'bg-emerald-500' :
                        dayEvent.type === 'tax' ? 'bg-amber-500' :
                        dayEvent.type === 'pf' ? 'bg-indigo-500' : 'bg-blue-500'
                      )} />
                      <div className={cn(
                        "absolute w-48 text-white rounded-xl p-2.5 shadow-2xl text-[9px] font-bold leading-normal border border-slate-800 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-20",
                        day <= 10 ? "top-full mt-2" : "bottom-full mb-2",
                        horizontalAlign
                      )} style={{ background: '#0f172a' }}>
                        <p className="font-black uppercase text-[8px] tracking-wider mb-0.5 text-blue-400">{dayEvent.title}</p>
                        <p className="text-slate-400">{dayEvent.description}</p>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Schedule List */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-black text-slate-455 uppercase tracking-widest">Upcoming Deadlines</h4>
          
          <div className="space-y-3.5">
            {events.map((e, idx) => (
              <div 
                key={idx} 
                className="p-4 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-2xl flex items-start gap-3.5 transition-all hover:-translate-y-0.5"
              >
                <div className={cn(
                  "p-2.5 rounded-xl border shrink-0",
                  e.type === 'payout' ? 'bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-500' :
                  e.type === 'tax' ? 'bg-amber-50 border-amber-100 text-amber-605 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-500' :
                  'bg-indigo-50 border-indigo-100 text-indigo-600 dark:bg-indigo-950/20 dark:border-indigo-900/30 dark:text-indigo-500'
                )}>
                  {e.type === 'payout' ? <DollarSign className="w-4 h-4" /> :
                   e.type === 'tax' ? <ShieldAlert className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">
                      May {e.day}
                    </span>
                    <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-wider">{e.title}</span>
                  </div>
                  <p className="text-[9px] text-slate-400 font-bold mt-1 tracking-normal leading-normal">{e.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
