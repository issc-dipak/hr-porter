"use client";

import React from 'react';
import { Star, Target, Zap, Edit3, Eye, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";

interface PerformanceReviewCardProps {
  item: any;
  idx: number;
  handleOpenModal: (type: 'add' | 'edit' | 'history', item?: any) => void;
  handleDeleteReview: (id: string) => void;
}

export default function PerformanceReviewCard({
  item,
  idx,
  handleOpenModal,
  handleDeleteReview
}: PerformanceReviewCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: idx * 0.05 }}
      className="group bg-white dark:bg-slate-900 rounded-[1.5rem] p-6 border border-slate-150/40 dark:border-slate-800 shadow-sm hover:shadow-2xl transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6 text-left"
    >
      <div className="flex items-center gap-6 flex-1">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center font-black text-slate-700 dark:text-slate-300 text-lg shadow-sm">
          {item.avatar || 'U'}
        </div>
        <div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight mb-1">{item.name}</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{item.dept}</p>
          <div className={cn(
            "px-3 py-1 rounded-xl text-[8px] font-black uppercase tracking-widest w-fit",
            item.status === 'Top Performer' ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450" :
            item.status === 'Under Review' ? "bg-rose-50 dark:bg-rose-955/20 text-rose-600 dark:text-rose-455" :
            "bg-blue-50 dark:bg-blue-955/20 text-blue-600 dark:text-blue-450"
          )}>
            {item.status}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 lg:gap-12 flex-[1.5]">
        <div className="space-y-1">
          <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] flex items-center gap-2">
            <Star className="w-3 h-3 text-amber-500" /> Rating
          </p>
          <p className="text-xl font-black text-slate-900 dark:text-white">{item.rating}<span className="text-slate-400 text-xs font-bold">/5.0</span></p>
        </div>
        <div className="space-y-1">
          <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] flex items-center gap-2">
            <Target className="w-3 h-3 text-blue-500" /> Goals
          </p>
          <p className="text-xl font-black text-slate-900 dark:text-white">{item.goals}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] flex items-center gap-2">
            <Zap className="w-3 h-3 text-emerald-500" /> Review
          </p>
          <p className="text-xs font-black text-slate-700 dark:text-slate-300">{item.lastReview || 'Released'}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end lg:self-center">
        <button 
          onClick={() => handleOpenModal('history', item)}
          className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-blue-650 hover:bg-blue-50 rounded-xl transition-all cursor-pointer border border-transparent"
          title="Growth History"
        >
          <Eye className="w-4 h-4" />
        </button>
        <button 
          onClick={() => handleOpenModal('edit', item)}
          className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-blue-650 hover:bg-blue-50 rounded-xl transition-all cursor-pointer border border-transparent"
          title="Edit Assessment"
        >
          <Edit3 className="w-4 h-4" />
        </button>
        <button 
          onClick={() => handleDeleteReview(item._id)}
          className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer border border-transparent"
          title="Remove Assessment"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
