"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";
import { Calendar, Clock, FileText, CheckCircle2, AlertCircle, X, Briefcase, Award } from 'lucide-react';

interface LeaveDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLeave: any;
}

export const LeaveDetailsModal = ({ isOpen, onClose, selectedLeave }: LeaveDetailsModalProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && selectedLeave && (
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
              className="relative z-10 w-full max-w-[340px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 overflow-hidden"
            >
              {/* Top Close Button */}
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-all duration-200 cursor-pointer border-none"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              <div className="flex flex-col items-center text-center space-y-4">
                {/* Profile Avatar */}
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-650 flex items-center justify-center text-base font-black text-white shadow-md shadow-blue-500/20 ring-2 ring-blue-500/10">
                  {selectedLeave.employee[0].toUpperCase()}
                </div>

                {/* Employee & Dept */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white capitalize leading-tight">
                    {selectedLeave.employee}
                  </h3>
                  <span className="mt-1 inline-block text-[8px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest bg-blue-55 dark:bg-blue-950/40 px-2 py-0.5 rounded-md border border-blue-100/30 dark:border-blue-900/20">
                    {selectedLeave.dept}
                  </span>
                </div>
                
                {/* Details Grid */}
                <div className="w-full grid grid-cols-2 gap-2 pt-1">
                  {/* Type */}
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-850 rounded-xl text-left space-y-1">
                    <div className="flex items-center gap-1 text-slate-400 dark:text-slate-550">
                      <Briefcase className="w-3 h-3" />
                      <span className="text-[7.5px] font-bold uppercase tracking-wider">Type</span>
                    </div>
                    <p className="text-[11px] font-bold text-slate-900 dark:text-white truncate">
                      {selectedLeave.type}
                    </p>
                  </div>

                  {/* Duration */}
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-850 rounded-xl text-left space-y-1">
                    <div className="flex items-center gap-1 text-slate-400 dark:text-slate-550">
                      <Clock className="w-3 h-3" />
                      <span className="text-[7.5px] font-bold uppercase tracking-wider">Duration</span>
                    </div>
                    <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400 truncate">
                      {selectedLeave.duration}
                    </p>
                  </div>

                  {/* Date */}
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-850 rounded-xl text-left space-y-1">
                    <div className="flex items-center gap-1 text-slate-400 dark:text-slate-550">
                      <Calendar className="w-3 h-3" />
                      <span className="text-[7.5px] font-bold uppercase tracking-wider">Date</span>
                    </div>
                    <p className="text-[11px] font-bold text-slate-900 dark:text-white truncate">
                      {selectedLeave.date}
                    </p>
                  </div>

                  {/* Status */}
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-850 rounded-xl text-left space-y-1">
                    <div className="flex items-center gap-1 text-slate-400 dark:text-slate-550">
                      <Award className="w-3 h-3" />
                      <span className="text-[7.5px] font-bold uppercase tracking-wider">Status</span>
                    </div>
                    <div>
                      <span className={cn(
                        "inline-block px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border",
                        selectedLeave.status === 'Approved' ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" :
                        selectedLeave.status === 'Pending' ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" : 
                        "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                      )}>
                        {selectedLeave.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Reason Block */}
                <div className="w-full text-left space-y-1">
                  <div className="flex items-center gap-1 text-slate-400 dark:text-slate-550 px-1">
                    <FileText className="w-3 h-3" />
                    <span className="text-[7.5px] font-bold uppercase tracking-widest">Reason for leave</span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-850 rounded-xl">
                    <p className="text-[11.5px] font-medium text-slate-700 dark:text-slate-350 leading-relaxed italic">
                      "{selectedLeave.reason || 'No reason specified.'}"
                    </p>
                  </div>
                </div>

                {/* Bottom Action Button */}
                <button 
                  onClick={onClose}
                  className="w-full mt-1.5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-205 text-white dark:text-slate-900 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all hover:scale-[1.01] active:scale-95 cursor-pointer border-none shadow-md shadow-slate-950/5 dark:shadow-none"
                >
                  Close Details
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

