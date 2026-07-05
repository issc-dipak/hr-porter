import React from 'react';
import { useUIStore } from '@/store/uiStore';
import { AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function ConfirmModal() {
  const { confirmModal, closeConfirm } = useUIStore();

  if (!confirmModal) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeConfirm}
          className="absolute inset-0 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm"
        />

        {/* Modal Box */}
        <motion.div
          initial={{ scale: 0.95, y: 15, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.95, y: 15, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/85 p-6 rounded-[28px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.35)] z-10 text-left font-outfit"
        >
          {/* Close button */}
          <button 
            onClick={closeConfirm}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl bg-slate-50 dark:bg-slate-850/40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Icon + Title */}
          <div className="flex gap-4 items-start">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 border border-amber-500/10">
              <AlertTriangle className="w-5 h-5 animate-bounce" />
            </div>
            <div className="space-y-1.5 pr-6">
              <h3 className="text-[15px] font-black text-slate-900 dark:text-white uppercase tracking-wider leading-none">
                {confirmModal.title || 'Confirm Action'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                {confirmModal.message}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/60">
            <button
              onClick={closeConfirm}
              className="px-4 py-2 bg-slate-50 dark:bg-slate-850/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-205 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider rounded-xl text-slate-650 dark:text-slate-400 cursor-pointer transition-all"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                confirmModal.onConfirm();
                closeConfirm();
              }}
              className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black uppercase tracking-wider rounded-xl shadow-lg shadow-rose-600/10 cursor-pointer transition-all active:scale-95"
            >
              Delete
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
