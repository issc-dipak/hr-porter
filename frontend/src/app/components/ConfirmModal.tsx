"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'warning' | 'info';
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  type = 'danger'
}: ConfirmModalProps) {
  // Select color scheme & icon based on type
  const theme = {
    danger: {
      icon: <AlertCircle className="w-5 h-5" />,
      iconBg: "bg-red-500/10 text-red-500",
      btnBg: "bg-red-600 hover:bg-red-700 shadow-red-500/20 text-white",
      borderColor: "border-red-100 dark:border-red-950/30"
    },
    warning: {
      icon: <AlertTriangle className="w-5 h-5" />,
      iconBg: "bg-amber-500/10 text-amber-500",
      btnBg: "bg-amber-600 hover:bg-amber-700 shadow-amber-500/20 text-white",
      borderColor: "border-amber-100 dark:border-amber-950/30"
    },
    info: {
      icon: <Info className="w-5 h-5" />,
      iconBg: "bg-blue-500/10 text-blue-500",
      btnBg: "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20 text-white",
      borderColor: "border-blue-100 dark:border-blue-950/30"
    }
  }[type];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", duration: 0.35 }}
            className={`relative w-full max-w-sm overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border ${theme.borderColor} rounded-3xl p-6 shadow-2xl space-y-4 text-left`}
          >
            {/* Close Button */}
            <button
              onClick={onCancel}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors border-none cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Title & Icon Header */}
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-full shrink-0 ${theme.iconBg}`}>
                {theme.icon}
              </div>
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white leading-tight">
                {title}
              </h3>
            </div>

            {/* Description Message */}
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed pr-2">
              {message}
            </p>

            {/* Actions Footer */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer active:scale-95 transition-all border-none"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className={`px-4 py-2.5 ${theme.btnBg} rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer shadow-md active:scale-95 transition-all border-none`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
