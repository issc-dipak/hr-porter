"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Eye, Clock, AlertTriangle, Receipt, Calendar, TrendingUp, Package, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ApprovalItem {
  id: string;
  type: "leave" | "expense" | "correction" | "promotion" | "payroll" | "asset";
  employee: string;
  avatar?: string;
  dept: string;
  detail: string;
  amount?: string;
  date: string;
  urgency: "high" | "medium" | "low";
}

interface ApprovalCenterProps {
  leaves?: any[];
  expenses?: any[];
  corrections?: any[];
  onApprove?: (type: string, id: string) => void;
  onReject?: (type: string, id: string) => void;
  onView?: (type: string, id: string) => void;
  loading?: boolean;
}

const tabConfig = [
  { id: "leave",      label: "Leaves",     icon: Calendar,      color: "text-blue-400",   badgeBg: "bg-blue-500/20 border-blue-500/30 text-blue-400" },
  { id: "expense",    label: "Expenses",   icon: Receipt,       color: "text-amber-400",  badgeBg: "bg-amber-500/20 border-amber-500/30 text-amber-400" },
  { id: "correction", label: "Attendance", icon: Clock,         color: "text-purple-400", badgeBg: "bg-purple-500/20 border-purple-500/30 text-purple-400" },
  { id: "promotion",  label: "Promotions", icon: TrendingUp,    color: "text-emerald-400",badgeBg: "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" },
  { id: "asset",      label: "Assets",     icon: Package,       color: "text-rose-400",   badgeBg: "bg-rose-500/20 border-rose-500/30 text-rose-400" },
];

const urgencyConfig = {
  high:   { label: "Urgent",  color: "bg-rose-500/20 text-rose-400 border-rose-500/30" },
  medium: { label: "Normal",  color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  low:    { label: "Low",     color: "bg-slate-500/20 text-slate-400 border-slate-600/30" },
};

function getInitials(name: string) {
  return (name || "?").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

function ItemRow({ item, onApprove, onReject, onView }: {
  item: ApprovalItem;
  onApprove: () => void;
  onReject: () => void;
  onView: () => void;
}) {
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const urg = urgencyConfig[item.urgency];

  const handleApprove = async () => { setApproving(true); await new Promise(r => setTimeout(r, 500)); onApprove(); setApproving(false); };
  const handleReject = async () => { setRejecting(true); await new Promise(r => setTimeout(r, 400)); onReject(); setRejecting(false); };

  return (
    <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800/50 transition-all group border border-transparent hover:border-slate-700/50">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[9px] font-black flex-shrink-0">
        {item.avatar ? <img src={item.avatar} className="w-full h-full rounded-xl object-cover" /> : getInitials(item.employee)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[10px] font-bold text-white truncate">{item.employee}</span>
          <span className={cn("text-[7px] font-black px-1.5 py-0.5 rounded-full border", urg.color)}>{urg.label}</span>
        </div>
        <p className="text-[9px] text-slate-400 truncate">{item.detail}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[7.5px] text-slate-500">{item.dept}</span>
          {item.amount && <><span className="text-slate-700">•</span><span className="text-[7.5px] text-emerald-400 font-semibold">{item.amount}</span></>}
          <span className="text-slate-700">•</span>
          <span className="text-[7.5px] text-slate-500">{item.date}</span>
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onView} className="w-6 h-6 rounded-lg bg-slate-700/60 hover:bg-slate-600 flex items-center justify-center transition-colors" title="View">
          <Eye className="w-3 h-3 text-slate-400" />
        </button>
        <button onClick={handleApprove} disabled={approving} className="w-6 h-6 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/40 border border-emerald-500/30 flex items-center justify-center transition-colors" title="Approve">
          {approving ? <Loader2 className="w-3 h-3 text-emerald-400 animate-spin" /> : <Check className="w-3 h-3 text-emerald-400" />}
        </button>
        <button onClick={handleReject} disabled={rejecting} className="w-6 h-6 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 border border-rose-500/30 flex items-center justify-center transition-colors" title="Reject">
          {rejecting ? <Loader2 className="w-3 h-3 text-rose-400 animate-spin" /> : <X className="w-3 h-3 text-rose-400" />}
        </button>
      </div>
    </motion.div>
  );
}

export const ApprovalCenter = ({ leaves = [], expenses = [], corrections = [], onApprove, onReject, onView, loading }: ApprovalCenterProps) => {
  const [activeTab, setActiveTab] = useState("leave");

  const normalizeLeaves = (arr: any[]): ApprovalItem[] => arr.slice(0, 8).map(l => ({
    id: l._id || l.id || Math.random().toString(),
    type: "leave" as const,
    employee: l.employeeName || l.employee?.name || l.name || "Employee",
    dept: l.department || l.dept || "–",
    detail: `${l.leaveType || l.type || "Leave"} — ${l.startDate ? new Date(l.startDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : ""} to ${l.endDate ? new Date(l.endDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : ""}`,
    date: l.appliedAt ? new Date(l.appliedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "–",
    urgency: l.leaveType?.toLowerCase().includes("sick") ? "high" : "medium",
  }));

  const normalizeExpenses = (arr: any[]): ApprovalItem[] => arr.slice(0, 8).map(e => ({
    id: e._id || e.id || Math.random().toString(),
    type: "expense" as const,
    employee: e.employeeName || e.employee?.name || "Employee",
    dept: e.department || "–",
    detail: e.description || e.title || "Expense Claim",
    amount: e.amount ? `₹${Number(e.amount).toLocaleString("en-IN")}` : undefined,
    date: e.submittedAt ? new Date(e.submittedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "–",
    urgency: "medium" as const,
  }));

  const items: Record<string, ApprovalItem[]> = {
    leave: normalizeLeaves(leaves),
    expense: normalizeExpenses(expenses),
    correction: corrections.slice(0, 8).map(c => ({
      id: c._id || Math.random().toString(), type: "correction" as const,
      employee: c.employeeName || "Employee", dept: c.department || "–",
      detail: `Correction: ${c.date ? new Date(c.date).toLocaleDateString("en-IN") : "–"}`,
      date: c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "–",
      urgency: "low" as const,
    })),
    promotion: [],
    asset: [],
  };

  const currentItems = items[activeTab] || [];
  const totalPending = Object.values(items).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl overflow-hidden flex flex-col h-full">
      <div className="px-4 pt-4 pb-3 border-b border-slate-800/70">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-[11px] font-black text-white uppercase tracking-widest flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Approval Center
            </h2>
            <p className="text-[8px] text-slate-500 font-semibold mt-0.5">{totalPending} pending approvals require your attention</p>
          </div>
          {totalPending > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[9px] font-black">{totalPending}</span>
          )}
        </div>
        <div className="flex gap-1 overflow-x-auto scrollbar-none">
          {tabConfig.map(t => {
            const count = items[t.id]?.length || 0;
            const active = activeTab === t.id;
            return (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[8.5px] font-black uppercase tracking-wider transition-all whitespace-nowrap flex-shrink-0",
                  active ? "bg-slate-700 text-white border border-slate-600" : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50")}>
                <t.icon className={cn("w-3 h-3", active ? t.color : "text-slate-600")} />
                {t.label}
                {count > 0 && <span className={cn("text-[7px] px-1 rounded-full border font-black", active ? t.badgeBg : "bg-slate-700 text-slate-400 border-slate-600")}>{count}</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-0.5" style={{ maxHeight: 320 }}>
        {loading ? (
          <div className="flex items-center justify-center h-full py-8"><Loader2 className="w-5 h-5 text-slate-500 animate-spin" /></div>
        ) : currentItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-10 h-10 rounded-2xl bg-slate-800 flex items-center justify-center mb-3">
              <Check className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-[10px] font-bold text-slate-400">No pending {activeTab} approvals</p>
            <p className="text-[8px] text-slate-600 mt-1">You're all caught up!</p>
          </div>
        ) : (
          <AnimatePresence>
            {currentItems.map(item => (
              <ItemRow key={item.id} item={item}
                onApprove={() => onApprove?.(activeTab, item.id)}
                onReject={() => onReject?.(activeTab, item.id)}
                onView={() => onView?.(activeTab, item.id)} />
            ))}
          </AnimatePresence>
        )}
      </div>

      {currentItems.length > 0 && (
        <div className="px-4 py-2.5 border-t border-slate-800/70 flex items-center justify-between">
          <span className="text-[8px] text-slate-500 font-semibold">Showing {currentItems.length} items</span>
          <button className="flex items-center gap-1 text-[8.5px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
            View All <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
};
