"use client";

import React from 'react';
import { X, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";

interface LeaveRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  leaveReason: string;
  setLeaveReason: React.Dispatch<React.SetStateAction<string>>;
  leaveType: string;
  setLeaveType: React.Dispatch<React.SetStateAction<string>>;
  leaveDates: string;
  setLeaveDates: React.Dispatch<React.SetStateAction<string>>;
  onSubmit: (type: string, date: string, reason: string) => void;
}

export const LeaveRequestModal = ({
  isOpen,
  onClose,
  leaveReason,
  setLeaveReason,
  leaveType,
  setLeaveType,
  leaveDates,
  setLeaveDates,
  onSubmit
}: LeaveRequestModalProps) => {
  if (!isOpen) return null;

  const handleSubmit = () => {
    onSubmit(leaveType, leaveDates, leaveReason);
    alert('Leave Request Submitted Successfully! ✨');
    setLeaveReason('');
    onClose();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 10 }}
        className="bg-neutral-50 dark:bg-slate-900 rounded-[2.5rem] md:rounded-[3rem] shadow-2xl relative overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh] max-w-full md:max-w-md w-full mx-4 md:mx-0"
      >
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-600" />
        </div>
               <div className="p-6 flex justify-between items-center border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div>
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] leading-none">
              Request Leave
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 dark:hover:bg-rose-500/15 border border-slate-200/55 dark:border-slate-800 hover:border-rose-500/30 transition-all cursor-pointer active:scale-95 bg-transparent"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-6 space-y-5 overflow-y-auto no-scrollbar flex-1">
          {/* Leave Type Selector */}
          <div className="space-y-2">
            <label className="text-[9.5px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Leave Type</label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              className="w-full p-4 bg-slate-50 dark:bg-slate-850 border border-slate-200/55 dark:border-slate-800 rounded-[1.25rem] text-xs font-black text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all cursor-pointer"
            >
              <option value="Annual Leave">Annual Leave</option>
              <option value="Sick Leave">Sick Leave</option>
              <option value="Casual Leave">Casual Leave</option>
              <option value="Maternity/Paternity Leave">Maternity/Paternity Leave</option>
              <option value="Unpaid Leave">Unpaid Leave</option>
            </select>
          </div>

          {/* Leave Dates Input */}
          <div className="space-y-2">
            <label className="text-[9.5px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Dates Range</label>
            <input
              type="text"
              value={leaveDates}
              onChange={(e) => setLeaveDates(e.target.value)}
              className="w-full p-4 bg-slate-50 dark:bg-slate-850 border border-slate-200/55 dark:border-slate-800 rounded-[1.25rem] text-xs font-black text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-[10px] placeholder:font-semibold placeholder:text-slate-400/55"
              placeholder="e.g. Jun 12-14"
            />
          </div>

          {/* Reason Input */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-blue-500" />
              <label className="text-[9.5px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Description / Reason</label>
            </div>
            <textarea 
              rows={4}
              value={leaveReason}
              onChange={(e) => setLeaveReason(e.target.value)}
              className="w-full p-5 bg-slate-50 dark:bg-slate-850/50 border border-slate-200/55 dark:border-slate-800 rounded-[1.5rem] text-[11px] font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-[10px] placeholder:font-semibold placeholder:text-slate-400/55 resize-none"
              placeholder="Please provide a brief context here..."
            />
          </div>
        </div>

        {/* Fixed Footer Actions */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800/80 flex gap-4 shrink-0 bg-slate-50/40 dark:bg-slate-950/20">
          <button 
            type="button"
            onClick={onClose}
            className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-550 dark:text-slate-400 rounded-2xl font-black uppercase tracking-widest text-[9.5px] hover:bg-slate-200 dark:hover:bg-slate-750 transition-all border-none cursor-pointer active:scale-98"
          >
            Cancel
          </button>
          <button 
            type="button"
            onClick={handleSubmit}
            className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest text-[9.5px] shadow-lg shadow-blue-500/15 active:scale-98 transition-all border-none cursor-pointer"
          >
            Submit Now
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
