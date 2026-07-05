"use client";

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { cn } from "@/lib/utils";

interface ApplyLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: string;
  profile?: any;
  newLeave: {
    employee: string;
    type: string;
    duration: string;
    date: string;
    reason: string;
    dept: string;
  };
  setNewLeave: React.Dispatch<React.SetStateAction<any>>;
  handleApplyLeave: (e: React.FormEvent) => void;
}

export const ApplyLeaveModal = ({
  isOpen,
  onClose,
  userRole,
  profile,
  newLeave,
  setNewLeave,
  handleApplyLeave
}: ApplyLeaveModalProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isPaidLeave = !newLeave.type || newLeave.type.includes('Sick Leave') || newLeave.type.includes('Casual Leave') || newLeave.type.includes('Paid Leave');

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={onClose} 
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm pointer-events-auto" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 20 }} 
              className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
              <div className="p-5 px-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-900 dark:text-white">Apply for Leave</h2>
                <button 
                  onClick={onClose} 
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <form onSubmit={handleApplyLeave} className="p-5 px-6 space-y-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Employee Name</label>
                    <input 
                      required 
                      type="text" 
                      className="w-full mt-1 px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-blue-500/50 rounded-xl outline-none transition-all text-xs font-bold disabled:opacity-50" 
                      value={userRole === 'Employee' ? (profile?.name || 'Employee') : newLeave.employee} 
                      disabled={userRole === 'Employee'}
                      onChange={(e) => setNewLeave({...newLeave, employee: e.target.value})} 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Leave Type</label>
                      <select 
                        className="w-full mt-1 px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-blue-500/50 rounded-xl outline-none transition-all text-xs font-bold" 
                        value={newLeave.type} 
                        onChange={(e) => setNewLeave({...newLeave, type: e.target.value})}
                      >
                        <option value="Sick Leave">Sick Leave (Paid)</option>
                        <option value="Casual Leave">Casual Leave (Paid)</option>
                        <option value="Paid Leave">Paid Leave (Paid)</option>
                        <option value="Unpaid Leave">Unpaid Leave (Unpaid)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Department</label>
                      <select 
                        className="w-full mt-1 px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-blue-500/50 rounded-xl outline-none transition-all text-xs font-bold" 
                        value={newLeave.dept} 
                        onChange={(e) => setNewLeave({...newLeave, dept: e.target.value})}
                      >
                        <option>Engineering</option>
                        <option>HR</option>
                        <option>Design</option>
                        <option>Marketing</option>
                      </select>
                    </div>
                  </div>

                  {/* Dynamic Paid/Unpaid Helper Indicator Alert */}
                  <AnimatePresence mode="wait">
                    <motion.div 
                      key={isPaidLeave ? 'paid' : 'unpaid'}
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className={cn(
                        "p-3 py-2 rounded-xl text-[10px] font-semibold border flex items-center gap-2.5 transition-all duration-300",
                        isPaidLeave 
                          ? "bg-emerald-500/10 dark:bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" 
                          : "bg-amber-500/10 dark:bg-amber-500/5 text-amber-600 dark:text-amber-400 border-amber-500/20"
                      )}
                    >
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full shrink-0",
                        isPaidLeave 
                          ? "bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" 
                          : "bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                      )} />
                      <span>
                        {isPaidLeave 
                          ? "PAID LEAVE: Will count against Paid Leave quota." 
                          : "UNPAID LEAVE: Salary deduction will apply for this period."
                        }
                      </span>
                    </motion.div>
                  </AnimatePresence>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Date Range</label>
                      <input 
                        required 
                        type="text" 
                        placeholder="Jan 20 - Jan 21" 
                        className="w-full mt-1 px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-blue-500/50 rounded-xl outline-none transition-all text-xs font-bold" 
                        value={newLeave.date} 
                        onChange={(e) => setNewLeave({...newLeave, date: e.target.value})} 
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Duration</label>
                      <input 
                        required 
                        type="text" 
                        placeholder="2 Days" 
                        className="w-full mt-1 px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-blue-500/50 rounded-xl outline-none transition-all text-xs font-bold" 
                        value={newLeave.duration} 
                        onChange={(e) => setNewLeave({...newLeave, duration: e.target.value})} 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Reason for Leave</label>
                    <textarea 
                      required 
                      rows={2} 
                      className="w-full mt-1 px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-blue-500/50 rounded-xl outline-none transition-all text-xs font-bold resize-none" 
                      value={newLeave.reason} 
                      onChange={(e) => setNewLeave({...newLeave, reason: e.target.value})} 
                    />
                  </div>
                </div>
                <button 
                  type="submit" 
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 transition-all active:scale-95"
                >
                  Submit Request
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

