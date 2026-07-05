"use client";

import React from 'react';
import { Check, X, MoreHorizontal, User, Mail, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";

interface LeaveRequest {
  id: string | number;
  employee: string;
  type: string;
  days: number;
  status: string;
  dept: string;
}

interface RecentRequestsProps {
  leaveRequests: LeaveRequest[];
  handleLeaveAction: (id: string | number, status: string) => void;
  openMenuId: string | number | null;
  setOpenMenuId: (id: string | number | null) => void;
  onViewProfile?: (employeeName: string) => void;
  onMessageEmployee?: (employeeName: string) => void;
  onDownloadPDF?: (leave: LeaveRequest) => void;
  onViewLedger?: () => void;
}

export const RecentRequests = ({ 
  leaveRequests, 
  handleLeaveAction, 
  openMenuId, 
  setOpenMenuId,
  onViewProfile,
  onMessageEmployee,
  onDownloadPDF,
  onViewLedger
}: RecentRequestsProps) => {
  return (
    <div className="saas-card bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900/90 dark:to-slate-950/70 border border-slate-205/30 dark:border-slate-800/80 rounded-[24px] p-5 shadow-md relative overflow-hidden group">
      <div className="flex justify-between items-center mb-5">
        <div>
          <h2 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-1.5">
            Recent Requests
          </h2>
          <p className="text-[9px] text-slate-450 font-bold uppercase tracking-wider mt-0.5">Action required for pending approvals</p>
        </div>
        <button 
          onClick={() => onViewLedger?.()}
          className="text-blue-600 dark:text-blue-400 text-[8.5px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 px-3 py-1 bg-blue-500/5 dark:bg-blue-500/10 hover:bg-blue-500/10 dark:hover:bg-blue-500/15 border border-blue-500/10 rounded-xl transition-all cursor-pointer"
        >
          View Ledger
        </button>
      </div>
      <div className="space-y-2.5">
        {leaveRequests.length === 0 ? (
          <div className="text-center py-6 text-slate-400 dark:text-slate-500 text-[9px] font-bold uppercase tracking-wider">
            No pending requests
          </div>
        ) : (
          leaveRequests.map((leave) => (
            <div key={leave.id} className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50/50 dark:bg-slate-850/30 hover:bg-white dark:hover:bg-slate-800/60 border border-slate-100/40 dark:border-slate-800/40 hover:border-slate-200 dark:hover:border-slate-700/65 transition-all duration-300 group">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-650 flex items-center justify-center font-black text-white text-[11px] shadow-md shadow-blue-500/10 shrink-0">
                  {(leave.employee || 'U')[0]}
                </div>
                <div>
                  <h4 className="font-black text-slate-900 dark:text-white text-[11px] tracking-tight leading-tight uppercase">{leave.employee || 'Unknown Employee'}</h4>
                  <p className="text-[8.5px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                    {leave.type} <span className="text-blue-500 dark:text-blue-400">• {leave.days} DAYS</span>
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3.5">
                <AnimatePresence mode="wait">
                  {leave.status === 'Pending' ? (
                    <motion.div 
                      key="actions"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="flex items-center gap-1.5"
                    >
                       <button 
                         onClick={() => handleLeaveAction(leave.id, 'Approved')}
                         className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 hover:text-white rounded-xl border border-emerald-500/10 hover:border-emerald-500 transition-all active:scale-90 shadow-sm cursor-pointer"
                       >
                         <Check className="w-3.5 h-3.5" />
                       </button>
                       <button 
                         onClick={() => handleLeaveAction(leave.id, 'Rejected')}
                         className="p-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white rounded-xl border border-rose-500/10 hover:border-rose-500 transition-all active:scale-90 shadow-sm cursor-pointer"
                       >
                         <X className="w-3.5 h-3.5" />
                       </button>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="status"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={cn(
                        "text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest border",
                        leave.status === 'Approved' 
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]" 
                          : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 shadow-[0_0_15px_rgba(239,68,68,0.05)]"
                      )}
                    >
                      {leave.status}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="relative">
                  <button 
                    onClick={() => setOpenMenuId(openMenuId === leave.id ? null : leave.id)}
                    className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 rounded-xl transition-all cursor-pointer border-none"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                  
                  <AnimatePresence>
                    {openMenuId === leave.id && (
                      <>
                        <motion.div 
                          initial={{ opacity: 0 }} 
                          animate={{ opacity: 1 }} 
                          exit={{ opacity: 0 }} 
                          onClick={() => setOpenMenuId(null)}
                          className="fixed inset-0 z-20" 
                        />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: 10 }}
                          className="absolute right-0 mt-1 w-44 bg-white/95 dark:bg-slate-905/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/50 dark:border-slate-800/80 p-1.5 z-30"
                        >
                           {[
                             { label: 'View Full Profile', icon: User, action: () => onViewProfile?.(leave.employee) },
                             { label: 'Message Employee', icon: Mail, action: () => onMessageEmployee?.(leave.employee) },
                             { label: 'Download PDF', icon: Download, action: () => onDownloadPDF?.(leave) },
                           ].map((item, i) => (
                             <button 
                               key={i}
                               onClick={() => { item.action(); setOpenMenuId(null); }}
                               className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-blue-500/5 dark:hover:bg-blue-500/10 rounded-xl transition-all text-[9px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer border-none"
                             >
                               <item.icon className="w-3.5 h-3.5" />
                               {item.label}
                             </button>
                           ))}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
