"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, RefreshCcw, Download, Bell, Plus, ChevronDown,
  Users, UserPlus, Megaphone, DollarSign, Building2, GitBranch,
  Briefcase, Upload, X, CheckCircle2, AlertCircle, Info, Clock,
  Zap, Shield
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EnterpriseHeaderProps {
  companyName: string;
  activeBranch: string;
  adminName: string;
  adminAvatar?: string;
  onRefresh: () => void;
  onExport: () => void;
  onSearch?: (q: string) => void;
  branches?: { id: string; name: string }[];
  onBranchChange?: (id: string) => void;
  notifications?: { id: string; type: "info" | "warning" | "success" | "error"; message: string; time: string }[];
  onQuickAction?: (action: string) => void;
  isRefreshing?: boolean;
}

const quickActions = [
  { id: "add-employee",  icon: UserPlus,   label: "Add Employee",        color: "text-blue-400" },
  { id: "invite-hr",    icon: Users,       label: "Invite HR Manager",   color: "text-indigo-400" },
  { id: "announcement", icon: Megaphone,   label: "Create Announcement", color: "text-amber-400" },
  { id: "payroll",      icon: DollarSign,  label: "Run Payroll",         color: "text-emerald-400" },
  { id: "department",   icon: Building2,   label: "Add Department",      color: "text-purple-400" },
  { id: "branch",       icon: GitBranch,   label: "Add Branch",          color: "text-cyan-400" },
  { id: "job",          icon: Briefcase,   label: "Create Job Opening",  color: "text-orange-400" },
  { id: "import",       icon: Upload,      label: "Import Employees",    color: "text-rose-400" },
];

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const fmt = (n: number) => String(n).padStart(2, "0");
  const h = fmt(time.getHours()); const m = fmt(time.getMinutes()); const s = fmt(time.getSeconds());
  const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const dateStr = `${days[time.getDay()]}, ${time.getDate()} ${months[time.getMonth()]} ${time.getFullYear()}`;
  return (
    <div className="flex flex-col items-end leading-none">
      <span className="text-[13px] font-black text-white tracking-widest font-mono">{h}:{m}:{s}</span>
      <span className="text-[8px] text-slate-400 font-semibold tracking-wider mt-0.5">{dateStr}</span>
    </div>
  );
}

const notifIcons = { info: Info, warning: AlertCircle, success: CheckCircle2, error: AlertCircle };
const notifColors = { info: "text-blue-400", warning: "text-amber-400", success: "text-emerald-400", error: "text-rose-400" };

export const EnterpriseHeader = ({
  companyName, activeBranch, adminName, adminAvatar,
  onRefresh, onExport, onSearch, branches = [],
  onBranchChange, notifications = [], onQuickAction, isRefreshing = false
}: EnterpriseHeaderProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showBranch, setShowBranch] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const qaRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const branchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setShowSearch(true); setTimeout(() => searchRef.current?.focus(), 50); }
      if (e.key === "Escape") { setShowSearch(false); setShowQuickActions(false); setShowNotifs(false); setShowBranch(false); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (qaRef.current && !qaRef.current.contains(e.target as Node)) setShowQuickActions(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false);
      if (branchRef.current && !branchRef.current.contains(e.target as Node)) setShowBranch(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const unread = notifications.length;
  const initials = adminName ? adminName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) : "AD";

  return (
    <div className="relative">
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800/80 rounded-2xl px-5 py-3.5 flex items-center justify-between gap-4 shadow-2xl overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />

        <div className="flex items-center gap-3 min-w-0 flex-shrink-0">
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 flex-shrink-0">
            <Shield className="w-5 h-5 text-white" />
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-950" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-[13px] font-black text-white tracking-tight truncate max-w-[140px]">{companyName || "HR System"}</h1>
              <div ref={branchRef} className="relative">
                <button onClick={() => setShowBranch(v => !v)} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 hover:bg-indigo-500/25 transition-colors">
                  <GitBranch className="w-2.5 h-2.5 text-indigo-400" />
                  <span className="text-[8px] font-black text-indigo-300 uppercase tracking-wider">{activeBranch || "Main"}</span>
                  <ChevronDown className="w-2.5 h-2.5 text-indigo-400" />
                </button>
                <AnimatePresence>
                  {showBranch && branches.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                      className="absolute top-full left-0 mt-1.5 w-44 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50">
                      {branches.map(b => (
                        <button key={b.id} onClick={() => { onBranchChange?.(b.id); setShowBranch(false); }}
                          className="w-full px-3 py-2 text-left text-[10px] font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors flex items-center gap-2">
                          <GitBranch className="w-3 h-3 text-indigo-400" />{b.name}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[7.5px] text-emerald-400 font-bold uppercase tracking-widest">Live • System Active</span>
            </div>
          </div>
        </div>

        <div className="flex-1 max-w-sm hidden md:block">
          {showSearch ? (
            <motion.div initial={{ opacity: 0, scaleX: 0.9 }} animate={{ opacity: 1, scaleX: 1 }} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input ref={searchRef} value={searchQuery} onChange={e => { setSearchQuery(e.target.value); onSearch?.(e.target.value); }}
                placeholder="Search employees, payroll, leaves…"
                className="w-full bg-slate-800/80 border border-slate-600/50 rounded-xl pl-8 pr-8 py-2 text-[11px] text-white placeholder-slate-500 outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all" />
              <button onClick={() => { setShowSearch(false); setSearchQuery(""); }} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                <X className="w-3.5 h-3.5 text-slate-500 hover:text-white" />
              </button>
            </motion.div>
          ) : (
            <button onClick={() => { setShowSearch(true); setTimeout(() => searchRef.current?.focus(), 50); }}
              className="flex items-center gap-2 w-full bg-slate-800/40 border border-slate-700/50 rounded-xl px-3 py-2 text-[10px] text-slate-500 hover:border-slate-600 hover:bg-slate-800/60 transition-all group">
              <Search className="w-3.5 h-3.5" />
              <span>Search anything…</span>
              <kbd className="ml-auto px-1.5 py-0.5 rounded bg-slate-700/50 border border-slate-600/40 text-[7px] font-mono text-slate-500 group-hover:text-slate-400">⌘K</kbd>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="hidden lg:block mr-2"><LiveClock /></div>

          <button onClick={onRefresh} title="Refresh Dashboard"
            className="w-8 h-8 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center hover:bg-slate-700 hover:border-slate-600 transition-all text-slate-400 hover:text-white">
            <RefreshCcw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} />
          </button>

          <button onClick={onExport} title="Export Report"
            className="w-8 h-8 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center hover:bg-slate-700 hover:border-slate-600 transition-all text-slate-400 hover:text-white">
            <Download className="w-3.5 h-3.5" />
          </button>

          <div ref={notifRef} className="relative">
            <button onClick={() => setShowNotifs(v => !v)}
              className="relative w-8 h-8 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center hover:bg-slate-700 hover:border-slate-600 transition-all text-slate-400 hover:text-white">
              <Bell className="w-3.5 h-3.5" />
              {unread > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[7px] font-black flex items-center justify-center border border-slate-950">{unread > 9 ? "9+" : unread}</span>}
            </button>
            <AnimatePresence>
              {showNotifs && (
                <motion.div initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  className="absolute top-full right-0 mt-2 w-72 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden z-50">
                  <div className="px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Notifications</span>
                    {unread > 0 && <span className="text-[8px] bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-full px-1.5 py-0.5 font-bold">{unread} New</span>}
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-[10px] text-slate-500 font-semibold">All caught up 🎉</div>
                    ) : notifications.map(n => {
                      const NIcon = notifIcons[n.type];
                      return (
                        <div key={n.id} className="px-4 py-3 border-b border-slate-800/50 hover:bg-slate-800/50 transition-colors flex items-start gap-2.5">
                          <NIcon className={cn("w-3.5 h-3.5 mt-0.5 flex-shrink-0", notifColors[n.type])} />
                          <div className="min-w-0">
                            <p className="text-[9.5px] text-slate-300 font-semibold leading-snug">{n.message}</p>
                            <p className="text-[7.5px] text-slate-500 mt-0.5">{n.time}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div ref={qaRef} className="relative">
            <motion.button onClick={() => setShowQuickActions(v => !v)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-[9px] font-black uppercase tracking-wider shadow-lg shadow-indigo-500/30 transition-all border border-indigo-500/50">
              <Plus className="w-3 h-3" />
              <span className="hidden sm:inline">Quick Actions</span>
              <ChevronDown className={cn("w-2.5 h-2.5 transition-transform", showQuickActions && "rotate-180")} />
            </motion.button>
            <AnimatePresence>
              {showQuickActions && (
                <motion.div initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  className="absolute top-full right-0 mt-2 w-52 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden z-50">
                  <div className="px-4 py-2.5 border-b border-slate-800">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Zap className="w-3 h-3 text-indigo-400" />Quick Actions</span>
                  </div>
                  <div className="p-1.5 space-y-0.5">
                    {quickActions.map(a => (
                      <button key={a.id} onClick={() => { onQuickAction?.(a.id); setShowQuickActions(false); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-800 transition-colors text-left group">
                        <a.icon className={cn("w-3.5 h-3.5 flex-shrink-0 transition-transform group-hover:scale-110", a.color)} />
                        <span className="text-[10px] font-semibold text-slate-300 group-hover:text-white transition-colors">{a.label}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-black shadow-lg">
              {adminAvatar ? <img src={adminAvatar} className="w-full h-full rounded-xl object-cover" alt={adminName} /> : initials}
            </div>
            <div className="hidden lg:block">
              <div className="text-[10px] font-black text-white leading-none">{adminName || "Admin"}</div>
              <div className="text-[7.5px] text-slate-500 font-semibold mt-0.5">Super Admin</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
