"use client";

import React from 'react';
import { 
  Eye, Edit2, Briefcase, Mail, Fingerprint, Calendar, Shield, Power, Trash2, MoreVertical
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";

interface EmployeeCardProps {
  emp: any;
  openModal: (type: 'add' | 'edit' | 'details' | 'delete', employee?: any) => void;
  viewType?: 'grid' | 'list';
}

const getDeptColors = (dept: string) => {
  const d = (dept || '').toLowerCase();
  if (d.includes('engineering') || d.includes('tech')) {
    return {
      bg: 'bg-violet-550/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
      gradient: 'from-violet-500 to-indigo-500',
      glow: 'shadow-violet-500/10',
      emoji: '💻',
      accent: '#8B5CF6'
    };
  }
  if (d.includes('design') || d.includes('product')) {
    return {
      bg: 'bg-pink-550/10 text-pink-600 dark:text-pink-400 border-pink-500/20',
      gradient: 'from-pink-500 to-rose-500',
      glow: 'shadow-pink-500/10',
      emoji: '🎨',
      accent: '#EC4899'
    };
  }
  if (d.includes('sales') || d.includes('marketing')) {
    return {
      bg: 'bg-amber-550/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      gradient: 'from-amber-500 to-orange-500',
      glow: 'shadow-amber-500/10',
      emoji: '📈',
      accent: '#F59E0B'
    };
  }
  if (d.includes('hr') || d.includes('talent')) {
    return {
      bg: 'bg-emerald-550/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      gradient: 'from-emerald-500 to-teal-500',
      glow: 'shadow-emerald-500/10',
      emoji: '🌿',
      accent: '#10B981'
    };
  }
  if (d.includes('management') || d.includes('admin')) {
    return {
      bg: 'bg-blue-550/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      gradient: 'from-blue-500 to-cyan-500',
      glow: 'shadow-blue-500/10',
      emoji: '👑',
      accent: '#3B82F6'
    };
  }
  return {
    bg: 'bg-slate-550/10 text-slate-650 dark:text-slate-400 border-slate-500/20',
    gradient: 'from-slate-500 to-slate-650',
    glow: 'shadow-slate-500/10',
    emoji: '📁',
    accent: '#64748B'
  };
};

const getRoleColors = (role: string) => {
  const r = (role || '').toLowerCase();
  if (r.includes('admin') || r.includes('super')) {
    return "bg-rose-500/10 text-rose-600 dark:text-rose-455 border-rose-500/20";
  }
  if (r.includes('hr') || r.includes('manager')) {
    return "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20";
  }
  return "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20";
};

export default function EmployeeCard({ emp, openModal, viewType = 'grid' }: EmployeeCardProps) {
  const status = (emp.status || '').toLowerCase();
  const isOnboarding = ['invited', 'profile pending', 'documents pending', 'verification pending', 'approved'].includes(status);
  const progress = emp.onboardingProgress || 0;
  const colors = getDeptColors(emp.dept);
  const roleStyles = getRoleColors(emp.role);

  // Status Indicator Dot Color Helper
  const statusDotClass = cn(
    "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 shadow-sm z-10",
    isOnboarding ? "bg-blue-500 animate-pulse" :
    ['active', 'probation', 'on leave'].includes(status) ? "bg-emerald-500 animate-pulse" :
    status === 'suspended' ? "bg-amber-500" :
    ['terminated', 'resigned', 'deleted'].includes(status) ? "bg-rose-500" : "bg-slate-400"
  );

  const renderAvatar = (sizeClass: string) => {
    const avatarUrl = emp.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(emp.name || emp.email)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffdfbf`;
    return (
      <div className={cn("rounded-full overflow-hidden border border-slate-200 dark:border-slate-800 ring-4 ring-indigo-500/10 dark:ring-indigo-500/5 bg-slate-50 dark:bg-slate-800 flex items-center justify-center", sizeClass)}>
        <img src={avatarUrl} alt={emp.name} className="w-full h-full object-cover" />
      </div>
    );
  };

  const renderEmpId = () => {
    const rawId = emp.empId || (emp.id ? String(emp.id).slice(-4) : '');
    return rawId.toUpperCase().startsWith('EMP-') ? `#${rawId}` : `#EMP-${rawId}`;
  };

  // Render List/Row View
  if (viewType === 'list') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.25 }}
        style={{ borderLeft: `4px solid ${colors.accent}` }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.015)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.05)] hover:border-slate-300 dark:hover:border-slate-700 group transition-all duration-300"
      >
        {/* Left Section: Avatar Squircle + Details */}
        <div className="flex gap-4 items-center min-w-0 sm:w-[260px] shrink-0">
          <div className="relative shrink-0">
            {renderAvatar("w-12 h-12")}
            <span className={statusDotClass} />
          </div>

          <div className="space-y-1 min-w-0 flex-1">
            <h3 className="text-[13.5px] font-black text-slate-850 dark:text-white leading-tight group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors truncate capitalize font-outfit">
              {emp.name}
            </h3>
            <p className="text-[9.5px] text-blue-500 dark:text-blue-400 font-bold uppercase tracking-wider truncate">
              {emp.designation}
            </p>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={cn("inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider border", colors.bg)}>
                {colors.emoji} {emp.dept}
              </span>
              <span className={cn("inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider border", roleStyles)}>
                {emp.role || 'Employee'}
              </span>
            </div>
          </div>
        </div>

        {/* Middle Section: Meta Info Columns */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2.5 text-[10.5px] text-slate-500 dark:text-slate-400 font-semibold flex-1 min-w-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800/45 pt-3 sm:pt-0">
          {/* Email */}
          <div className="flex items-center gap-2 min-w-0 max-w-[190px] flex-1 truncate">
            <Mail className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="truncate font-mono text-slate-600 dark:text-slate-300 font-medium">{emp.email}</span>
          </div>

          {isOnboarding ? (
            <>
              {/* Setup Status */}
              <div className="flex items-center gap-2 shrink-0">
                <div>
                  <p className="text-[7px] text-slate-405 dark:text-slate-555 uppercase font-black tracking-widest leading-none mb-1">Status</p>
                  <span className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider border",
                    status === 'invited' && "bg-blue-500/10 text-blue-500 border-blue-500/20",
                    status === 'profile pending' && "bg-amber-500/10 text-amber-500 border-amber-500/20",
                    status === 'documents pending' && "bg-orange-500/10 text-orange-500 border-orange-500/20",
                    status === 'verification pending' && "bg-purple-500/10 text-purple-500 border-purple-500/20",
                    status === 'approved' && "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                  )}>
                    {emp.status}
                  </span>
                </div>
              </div>

              {/* Progress */}
              <div className="flex flex-col gap-1 flex-1 min-w-[110px] max-w-[150px] shrink-0">
                <div className="flex justify-between items-center text-[7px] text-slate-400 dark:text-slate-505 uppercase font-black tracking-widest leading-none mb-1">
                  <span>Setup Progress</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-650 rounded-full transition-all duration-550" 
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Employee ID */}
              <div className="flex items-center gap-2 shrink-0">
                <Fingerprint className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <p className="text-[7px] text-slate-405 dark:text-slate-505 uppercase font-black tracking-widest leading-none mb-0.5">EMP ID</p>
                  <p className="font-black text-slate-700 dark:text-slate-200 leading-none">{renderEmpId()}</p>
                </div>
              </div>

              {/* Joined/Deleted Date */}
              <div className="flex items-center gap-2 shrink-0">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <p className="text-[7px] text-slate-405 dark:text-slate-555 uppercase font-black tracking-widest leading-none mb-0.5">
                    {emp.isDeletedRecord ? "DELETED" : "JOINED"}
                  </p>
                  <p className="font-black text-slate-700 dark:text-slate-200 leading-none">{emp.joining}</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right Section: Actions */}
        <div className="flex gap-2 items-center justify-end border-t sm:border-t-0 border-slate-100 dark:border-slate-800/45 pt-3 sm:pt-0 shrink-0 w-full sm:w-auto font-outfit">
          {emp.isDeletedRecord ? (
            <button 
              onClick={() => openModal('details', emp)}
              className="px-3.5 py-2 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100/50 rounded-xl text-[9px] font-black uppercase tracking-widest hover:shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
            >
              <Eye className="w-3.5 h-3.5" />
              Details (Archived)
            </button>
          ) : (
            <>
              <button 
                onClick={() => openModal('details', emp)}
                className="px-3.5 py-2 bg-blue-50 dark:bg-blue-955/20 border border-blue-200 dark:border-blue-800/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100/50 rounded-xl text-[9px] font-black uppercase tracking-widest hover:shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
              >
                <Eye className="w-3.5 h-3.5" />
                Details
              </button>
              <button 
                onClick={() => openModal('edit', emp)}
                className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-700 text-slate-500 hover:text-blue-500 dark:hover:text-blue-400 rounded-xl transition-all cursor-pointer border border-slate-200/50 dark:border-slate-800 hover:border-blue-200/50 dark:hover:border-slate-700 shrink-0"
                title="Edit Employee"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => openModal('delete', emp)}
                className="p-2 bg-slate-50 hover:bg-rose-50 dark:bg-slate-800/50 dark:hover:bg-rose-950/20 text-slate-500 hover:text-rose-500 rounded-xl transition-all cursor-pointer border border-slate-200/50 dark:border-slate-800 hover:border-rose-200/50 dark:hover:border-rose-950/30 shrink-0"
                title="Manage Lifecycle"
              >
                <Power className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </motion.div>
    );
  }

  // Render Box/Grid View
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col justify-between p-5 rounded-[24px] bg-slate-900/40 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/80 shadow-[0_4px_20px_rgba(0,0,0,0.015)] hover:shadow-[0_12px_30px_rgba(99,102,241,0.1)] hover:border-indigo-500/30 dark:hover:border-indigo-500/30 hover:-translate-y-1 group transition-all duration-300 min-h-[295px] relative"
    >
      {/* Kebab options at top right */}
      <button 
        type="button"
        onClick={() => openModal('edit', emp)}
        className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer p-1 rounded-lg hover:bg-slate-800/40"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      <div className="space-y-4">
        {/* Top: Avatar Squircle + Initials */}
        <div className="flex flex-col items-center text-center gap-3">
          <div className="relative shrink-0">
            {renderAvatar("w-20 h-20")}
            <span className={cn(statusDotClass, "w-4 h-4 border-background bg-accent-emerald status-pulse")} />
          </div>

          {/* Name & Title */}
          <div className="space-y-1 w-full min-w-0">
            <h3 className="text-[16px] font-black text-slate-850 dark:text-white leading-snug group-hover:text-indigo-400 transition-colors truncate capitalize font-outfit">
              {emp.name}
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-400 font-bold truncate leading-none">
              {emp.designation}
            </p>
          </div>
        </div>

        {/* Detailed Metadata rows */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 space-y-2.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
          <div className="flex items-center gap-2.5">
            <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />
            <span className={cn("inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border", colors.bg)}>
              {colors.emoji} {emp.dept}
            </span>
          </div>
          <div className="flex items-center gap-2.5 min-w-0">
            <Mail className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="truncate font-mono text-slate-650 dark:text-slate-350">{emp.email}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="capitalize">{emp.isDeletedRecord ? "Deleted" : "Joined"} {emp.joining ? new Date(emp.joining).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Footer Area: ID on Left, Action Links on Right */}
      <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 w-full shrink-0">
        <span className="text-[9.5px] font-mono font-bold text-slate-450 dark:text-slate-500">{renderEmpId()}</span>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => openModal('details', emp)}
            className="text-[11px] font-black text-slate-600 dark:text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 hover:underline cursor-pointer"
          >
            Details
          </button>
          {!emp.isDeletedRecord && (
            <button 
              onClick={() => openModal('edit', emp)}
              className="text-[11px] font-black text-slate-600 dark:text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 hover:underline cursor-pointer"
            >
              Edit
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
