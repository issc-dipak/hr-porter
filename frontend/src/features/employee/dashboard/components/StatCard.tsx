"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: React.ComponentType<any>;
  label: string;
  value: string;
  color: string;
  onClick?: () => void;
}

export const StatCard = ({ icon: Icon, label, value, color, onClick }: StatCardProps) => {
  // Premium gradient themes based on color prop
  const themeMap: Record<string, {
    cardBg: string;
    cardBorder: string;
    iconText: string;
    iconBg: string;
    iconBorder: string;
    iconGlow: string;
    labelColor: string;
    valueColor: string;
    unitColor: string;
  }> = {
    'bg-blue-500': {
      cardBg: 'bg-gradient-to-r from-blue-600 to-indigo-500 border-transparent text-white',
      cardBorder: 'border-transparent',
      iconText: 'text-blue-600',
      iconBg: 'bg-white',
      iconBorder: 'border-transparent',
      iconGlow: 'shadow-sm',
      labelColor: 'text-white/85',
      valueColor: 'text-white',
      unitColor: 'text-white/70'
    },
    'bg-emerald-500': {
      cardBg: 'bg-gradient-to-r from-emerald-500 to-teal-500 border-transparent text-white',
      cardBorder: 'border-transparent',
      iconText: 'text-emerald-600',
      iconBg: 'bg-white',
      iconBorder: 'border-transparent',
      iconGlow: 'shadow-sm',
      labelColor: 'text-white/85',
      valueColor: 'text-white',
      unitColor: 'text-white/70'
    },
    'bg-purple-500': {
      cardBg: 'bg-gradient-to-r from-purple-600 to-indigo-650 border-transparent text-white',
      cardBorder: 'border-transparent',
      iconText: 'text-purple-600',
      iconBg: 'bg-white',
      iconBorder: 'border-transparent',
      iconGlow: 'shadow-sm',
      labelColor: 'text-white/85',
      valueColor: 'text-white',
      unitColor: 'text-white/70'
    },
    'bg-rose-500': {
      cardBg: 'bg-gradient-to-r from-rose-500 to-pink-500 border-transparent text-white',
      cardBorder: 'border-transparent',
      iconText: 'text-rose-600',
      iconBg: 'bg-white',
      iconBorder: 'border-transparent',
      iconGlow: 'shadow-sm',
      labelColor: 'text-white/85',
      valueColor: 'text-white',
      unitColor: 'text-white/70'
    },
    'bg-amber-500': {
      cardBg: 'bg-gradient-to-r from-amber-500 to-orange-550 border-transparent text-white',
      cardBorder: 'border-transparent',
      iconText: 'text-orange-600',
      iconBg: 'bg-white',
      iconBorder: 'border-transparent',
      iconGlow: 'shadow-sm',
      labelColor: 'text-white/85',
      valueColor: 'text-white',
      unitColor: 'text-white/70'
    },
    'bg-orange-500': {
      cardBg: 'bg-gradient-to-r from-amber-500 to-orange-550 border-transparent text-white',
      cardBorder: 'border-transparent',
      iconText: 'text-orange-600',
      iconBg: 'bg-white',
      iconBorder: 'border-transparent',
      iconGlow: 'shadow-sm',
      labelColor: 'text-white/85',
      valueColor: 'text-white',
      unitColor: 'text-white/70'
    }
  };

  const currentTheme = themeMap[color] || {
    cardBg: 'bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900/90 dark:to-slate-950/70',
    cardBorder: 'border-slate-200/30 dark:border-slate-800/80 text-slate-900 dark:text-white',
    iconText: 'text-slate-650 dark:text-slate-350',
    iconBg: 'bg-slate-500/10',
    iconBorder: 'border-slate-500/20',
    iconGlow: '',
    labelColor: 'text-slate-400 dark:text-slate-500',
    valueColor: 'text-slate-900 dark:text-white',
    unitColor: 'text-slate-450 dark:text-slate-550'
  };

  const valueParts = value.split(' ');
  const valueNumber = valueParts[0];
  const valueLabel = valueParts.slice(1).join(' ');

  return (
    <motion.div 
      whileHover={{ y: -3, scale: 1.01 }}
      onClick={onClick}
      className={cn(
        "p-5 relative overflow-hidden group rounded-[22px] shadow-sm transition-all duration-300 border",
        currentTheme.cardBg,
        currentTheme.cardBorder,
        onClick && "cursor-pointer active:scale-95"
      )}
    >
      {/* Premium Glassmorphic Bubbles */}
      <div 
        className="absolute -right-8 -top-8 w-24 h-24 rounded-full opacity-[0.08] group-hover:opacity-[0.15] transition-all duration-500 blur-xl pointer-events-none"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.4)' }}
      />
      <div 
        className="absolute -left-6 -bottom-6 w-16 h-16 rounded-full opacity-[0.04] group-hover:opacity-[0.08] transition-all duration-500 blur-lg pointer-events-none"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.4)' }}
      />
      
      <div className="relative z-10 flex items-center gap-4">
        <div className={cn(
          "w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border shadow-sm transition-transform duration-300 group-hover:rotate-3",
          currentTheme.iconBg,
          currentTheme.iconBorder,
          currentTheme.iconText,
          currentTheme.iconGlow
        )}>
          <Icon className="w-5 h-5" />
        </div>
        
        <div className="min-w-0 flex-1">
          <p className={cn("text-[9px] font-black uppercase tracking-[0.15em] mb-1.5 truncate", currentTheme.labelColor)}>
            {label}
          </p>
          <div className="flex items-baseline gap-1">
            <span className={cn("text-xl font-black tracking-tight leading-none", currentTheme.valueColor)}>
              {valueNumber}
            </span>
            {valueLabel && (
              <span className={cn("text-[10px] font-bold uppercase tracking-wide", currentTheme.unitColor)}>
                {valueLabel}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
