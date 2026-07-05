"use client";

import React from 'react';
import { 
  X, Briefcase, ArrowRight, Link, Loader2, 
  CheckCircle2, Sparkles, MapPin, Building2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";

interface OpportunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedJob: any;
  isApplying: boolean;
  setIsApplying: React.Dispatch<React.SetStateAction<boolean>>;
  applyingJobId: number | null;
  handleJobSubmit: (e: React.FormEvent) => void;
}

export const OpportunityModal = ({
  isOpen,
  onClose,
  selectedJob,
  isApplying,
  setIsApplying,
  applyingJobId,
  handleJobSubmit
}: OpportunityModalProps) => {
  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        transition={{ type: "spring", damping: 25, stiffness: 220 }}
        className="bg-white dark:bg-slate-900 rounded-[2.5rem] md:rounded-[3rem] shadow-2xl relative overflow-hidden border border-slate-100 dark:border-slate-800/80 flex flex-col max-h-[90vh] max-w-full md:max-w-[440px] w-full mx-4 md:mx-0"
      >
        {/* Sleek Top Accent and Decorative Grid Pattern */}
        <div className="absolute top-0 left-0 right-0 h-[100px] bg-gradient-to-b from-blue-500/10 via-blue-500/2 to-transparent pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0">
          <div className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-teal-500" />
        </div>
        
        {/* Header Block */}
        <div className="px-8 pt-8 pb-6 flex justify-between items-start border-b border-slate-50 dark:border-slate-800/50 shrink-0 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
              <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em]">
                {isApplying ? 'Apply Now' : 'Internal Opening'}
              </span>
            </div>
            <h3 className="text-xl font-black text-slate-950 dark:text-white tracking-tight mt-1">
              {isApplying ? 'Join Our Team' : 'Career Growth'}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-2xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all shadow-sm border border-slate-100 dark:border-slate-800 hover:border-rose-100 dark:hover:border-rose-950/30"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-8 overflow-y-auto no-scrollbar relative z-10">
          <AnimatePresence mode="wait">
            {!isApplying ? (
              <motion.div 
                key="details"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Job Summary Banner */}
                <div className="flex items-center gap-4 p-5 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-100/50 dark:border-slate-800/50">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-500/20">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-base font-black text-slate-950 dark:text-white leading-tight truncate">{selectedJob?.title}</h4>
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-slate-400 font-bold text-[10px] uppercase tracking-wider mt-1.5">
                      <span className="flex items-center gap-1 text-slate-500"><Building2 className="w-3.5 h-3.5" />{selectedJob?.dept}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-blue-500"><MapPin className="w-3.5 h-3.5" />{selectedJob?.location}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {/* Overview Card */}
                  <div className="p-6 bg-slate-50/50 dark:bg-slate-800/20 rounded-[2rem] border border-slate-100/40 dark:border-slate-800/30">
                    <h5 className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400 mb-3 leading-none">Role Overview</h5>
                    <p className="text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed font-medium">{selectedJob?.description}</p>
                  </div>
                  
                  {/* Requirements Card */}
                  <div className="p-6 bg-slate-50/50 dark:bg-slate-800/20 rounded-[2rem] border border-slate-100/40 dark:border-slate-800/30">
                    <h5 className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400 mb-3.5 leading-none">Key Requirements</h5>
                    <ul className="space-y-3">
                      {selectedJob?.requirements.map((req: string, i: number) => (
                        <li key={i} className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-3 font-medium leading-relaxed">
                          <div className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center shrink-0 text-emerald-500 mt-0.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </div>
                          <span className="flex-1">{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Primary Transition CTA */}
                <button 
                  onClick={() => setIsApplying(true)}
                  className="w-full relative group overflow-hidden py-5 bg-slate-950 dark:bg-white text-white dark:text-slate-900 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Apply for this position
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </button>
              </motion.div>
            ) : (
              <form 
                onSubmit={handleJobSubmit}
                className="space-y-6"
              >
                <div className="space-y-5">
                  {/* Statement Input */}
                  <div className="space-y-2.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Your Statement of Interest</label>
                    <textarea 
                      rows={4}
                      required
                      className="w-full p-6 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-[2rem] text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500/50 focus:bg-white dark:focus:bg-slate-800 transition-all shadow-inner placeholder:text-slate-400 resize-none"
                      placeholder="Why are you a good fit for this role?"
                    />
                  </div>
                  
                  {/* Supporting Links */}
                  <div className="space-y-2.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Supporting Links (Optional)</label>
                    <div className="relative group">
                      <Link className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                      <input 
                        type="text" 
                        className="w-full pl-14 pr-6 py-5 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-[2rem] text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500/50 focus:bg-white dark:focus:bg-slate-800 transition-all shadow-inner placeholder:text-slate-400"
                        placeholder="Portfolio, LinkedIn, etc."
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Action Button */}
                <button 
                  type="submit"
                  disabled={applyingJobId !== null}
                  className="w-full py-5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:scale-100"
                >
                  {applyingJobId !== null ? (
                    <>
                      <Loader2 className="w-4.5 h-4.5 animate-spin" />
                      Submitting Application...
                    </>
                  ) : (
                    <>
                      Submit Application
                      <CheckCircle2 className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};
