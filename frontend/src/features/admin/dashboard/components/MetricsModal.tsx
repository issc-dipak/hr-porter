"use client";

import React from 'react';
import { X, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MetricsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MetricsModal = ({ isOpen, onClose }: MetricsModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-2xl bg-white/95 dark:bg-slate-905/95 backdrop-blur-md rounded-[32px] shadow-2xl border border-slate-200/50 dark:border-slate-800/80 p-8 overflow-hidden"
          >
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Advanced Metrics</h2>
                <p className="text-slate-550 text-xs font-semibold uppercase tracking-wider mt-0.5">Granular department performance and allocation</p>
              </div>
              <button 
                onClick={onClose}
                className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-rose-500/10 dark:hover:bg-rose-500/15 transition-all cursor-pointer border-none"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="p-5 bg-slate-50/60 dark:bg-slate-850/30 rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-inner">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Resource Efficiency</p>
                <h3 className="text-3xl font-black text-blue-650 dark:text-blue-400 leading-none">92.4%</h3>
                <div className="mt-3.5 flex items-center gap-1.5 text-[9px] font-extrabold text-emerald-500 uppercase tracking-wider">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  +4.2% from last month
                </div>
              </div>
              <div className="p-5 bg-slate-50/60 dark:bg-slate-850/30 rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-inner">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Churn Rate</p>
                <h3 className="text-3xl font-black text-rose-600 dark:text-rose-400 leading-none">1.8%</h3>
                <div className="mt-3.5 flex items-center gap-1.5 text-[9px] font-extrabold text-emerald-500 uppercase tracking-wider">
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  -0.5% improvement
                </div>
              </div>
            </div>

            <div className="space-y-5">
              {[
                { label: 'Cloud Infrastructure', val: '₹12.4L', p: 85 },
                { label: 'Marketing Burn', val: '₹4.2L', p: 40 },
                { label: 'Operational Costs', val: '₹8.9L', p: 65 },
              ].map((item, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                    <span className="text-slate-500">{item.label}</span>
                    <span className="text-slate-900 dark:text-white font-extrabold">{item.val}</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 dark:bg-slate-950 rounded-full p-0.5 border border-slate-200/40 dark:border-slate-800/60 overflow-hidden shadow-inner">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${item.p}%` }}
                      transition={{ duration: 0.8, delay: i * 0.1 }}
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full shadow-md shadow-blue-500/20"
                    />
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={onClose}
              className="w-full mt-8 py-3.5 bg-gradient-to-r from-slate-900 to-slate-950 dark:from-white dark:to-slate-100 text-white dark:text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-md hover:shadow-lg transition-all border-none cursor-pointer active:scale-98"
            >
              Close Metrics View
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
