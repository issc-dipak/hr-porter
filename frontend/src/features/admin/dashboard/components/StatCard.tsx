"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: React.ComponentType<any>;
  label: string;
  value: string | number;
  trend: string;
  trendType: "up" | "down" | "neutral";
  color: string;
  onRefresh?: () => void;
  growth?: number;
  sparkline?: number[];
  onClick?: () => void;
  loading?: boolean;
}

// ── Tiny SVG Sparkline ──────────────────────────────────────────────
function Sparkline({ data, accentColor }: { data: number[]; accentColor: string }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const W = 54; const H = 22;

  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - 2 - ((v - min) / range) * (H - 4);
    return [+x.toFixed(1), +y.toFixed(1)] as [number, number];
  });

  const poly = pts.map(p => p.join(",")).join(" ");
  const area = `M ${pts[0].join(",")} ${pts.map(p => `L ${p.join(",")}`).join(" ")} L ${W},${H} L 0,${H} Z`;
  const last = pts[pts.length - 1];

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="overflow-visible flex-shrink-0">
      <defs>
        <linearGradient id={`sg-${accentColor.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accentColor} stopOpacity="0.12" />
          <stop offset="100%" stopColor={accentColor} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sg-${accentColor.replace('#','')})`} />
      <polyline
        points={poly}
        fill="none"
        stroke={accentColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.75"
      />
      <circle cx={last[0]} cy={last[1]} r="2" fill={accentColor} opacity="0.9" />
    </svg>
  );
}

// ── Animated counter ────────────────────────────────────────────────
function AnimatedCount({ value }: { value: string | number }) {
  const raw = typeof value === "string" ? parseFloat(value.replace(/[^0-9.]/g, "")) : value;
  const pfx = typeof value === "string" ? (value.match(/^[^\d]*/)?.[0] ?? "") : "";
  const sfx = typeof value === "string" ? (value.match(/[^\d.]+$/)?.[0] ?? "") : "";
  const [cur, setCur] = useState(0);

  useEffect(() => {
    if (isNaN(raw) || raw === 0) { setCur(0); return; }
    let frame = 0;
    const step = raw / 32;
    const tid = setInterval(() => {
      frame += step;
      if (frame >= raw) { setCur(raw); clearInterval(tid); }
      else { setCur(Math.floor(frame)); }
    }, 18);
    return () => clearInterval(tid);
  }, [raw]);

  if (typeof value === "string" && isNaN(raw)) return <span>{value}</span>;
  return <span>{pfx}{cur.toLocaleString("en-IN")}{sfx}</span>;
}

// ── Color accent map ────────────────────────────────────────────────
const accentMap: Record<string, string> = {
  "bg-blue-500":    "#3B82F6",
  "bg-indigo-500":  "#6366F1",
  "bg-emerald-500": "#10B981",
  "bg-purple-500":  "#8B5CF6",
  "bg-orange-500":  "#F97316",
  "bg-rose-500":    "#F43F5E",
  "bg-cyan-500":    "#06B6D4",
  "bg-violet-500":  "#7C3AED",
  "bg-amber-500":   "#F59E0B",
  "bg-pink-500":    "#EC4899",
  "bg-teal-500":    "#14B8A6",
};

// ── Color pastel bg map ─────────────────────────────────────────────
const pastelMap: Record<string, { bg: string; border: string; iconBg: string }> = {
  "bg-blue-500":    { bg: "from-blue-100 to-blue-50 dark:from-blue-950/40 dark:to-blue-900/20",    border: "border-blue-200 dark:border-blue-800/50",    iconBg: "#3B82F620" },
  "bg-indigo-500":  { bg: "from-indigo-100 to-indigo-50 dark:from-indigo-950/40 dark:to-indigo-900/20",  border: "border-indigo-200 dark:border-indigo-800/50",  iconBg: "#6366F120" },
  "bg-emerald-500": { bg: "from-emerald-100 to-emerald-50 dark:from-emerald-950/40 dark:to-emerald-900/20", border: "border-emerald-200 dark:border-emerald-800/50", iconBg: "#10B98120" },
  "bg-purple-500":  { bg: "from-purple-100 to-purple-50 dark:from-purple-950/40 dark:to-purple-900/20",  border: "border-purple-200 dark:border-purple-800/50",  iconBg: "#8B5CF620" },
  "bg-orange-500":  { bg: "from-orange-100 to-orange-50 dark:from-orange-950/40 dark:to-orange-900/20",  border: "border-orange-200 dark:border-orange-800/50",  iconBg: "#F9731620" },
  "bg-rose-500":    { bg: "from-rose-100 to-rose-50 dark:from-rose-950/40 dark:to-rose-900/20",    border: "border-rose-200 dark:border-rose-800/50",    iconBg: "#F43F5E20" },
  "bg-cyan-500":    { bg: "from-cyan-100 to-cyan-50 dark:from-cyan-950/40 dark:to-cyan-900/20",    border: "border-cyan-200 dark:border-cyan-800/50",    iconBg: "#06B6D420" },
  "bg-violet-500":  { bg: "from-violet-100 to-violet-50 dark:from-violet-950/40 dark:to-violet-900/20",  border: "border-violet-200 dark:border-violet-800/50",  iconBg: "#7C3AED20" },
  "bg-amber-500":   { bg: "from-amber-100 to-amber-50 dark:from-amber-950/40 dark:to-amber-900/20",   border: "border-amber-200 dark:border-amber-800/50",   iconBg: "#F59E0B20" },
  "bg-pink-500":    { bg: "from-pink-100 to-pink-50 dark:from-pink-950/40 dark:to-pink-900/20",    border: "border-pink-200 dark:border-pink-800/50",    iconBg: "#EC489920" },
  "bg-teal-500":    { bg: "from-teal-100 to-teal-50 dark:from-teal-950/40 dark:to-teal-900/20",    border: "border-teal-200 dark:border-teal-800/50",    iconBg: "#14B8A620" },
};

// ── StatCard ────────────────────────────────────────────────────────
export const StatCard = ({
  icon: Icon,
  label,
  value,
  trend,
  trendType,
  color,
  onRefresh,
  growth,
  sparkline,
  onClick,
  loading = false,
}: StatCardProps) => {
  const accent = accentMap[color] ?? "#3B82F6";
  const pastel = pastelMap[color] ?? { bg: "from-blue-100 to-blue-50 dark:from-blue-950/40 dark:to-blue-900/20", border: "border-blue-200 dark:border-blue-800/50", iconBg: "#3B82F620" };
  const defaultSparkline = sparkline ?? [28, 42, 35, 58, 48, 72, 64, 70];

  if (loading) {
    return (
      <div className="rounded-xl h-[112px] animate-pulse bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50" />
    );
  }

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -2, boxShadow: `0 12px 30px rgba(0,0,0,0.08), 0 4px 12px ${accent}20` }}
      whileTap={{ scale: 0.985 }}
      transition={{ duration: 0.16, ease: "easeOut" }}
      className={cn(
        `bg-gradient-to-br ${pastel.bg}`,
        `border ${pastel.border}`,
        "rounded-2xl px-5 pt-4.5 pb-4 flex flex-col gap-3 overflow-hidden",
        "shadow-[0_2px_12px_-2px_rgba(0,0,0,0.06)]",
        "transition-shadow duration-200",
        onClick ? "cursor-pointer select-none" : "cursor-default"
      )}
    >
      {/* Row 1: icon + sparkline */}
      <div className="flex items-start justify-between">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: accent + "22" }}
        >
          <Icon className="w-4 h-4" style={{ color: accent }} />
        </div>
        <div className="opacity-90 mt-0.5">
          <Sparkline data={defaultSparkline} accentColor={accent} />
        </div>
      </div>

      {/* Row 2: main number + label */}
      <div className="space-y-1">
        <div className="text-[25px] font-bold text-slate-900 dark:text-white tracking-tight leading-none">
          <AnimatedCount value={value} />
        </div>
        <div className="text-[11px] font-medium text-slate-600 dark:text-slate-300 leading-tight">
          {label}
        </div>
      </div>

      {/* Row 3: trend description */}
      {trend && (
        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-tight truncate">
          {trend}
        </div>
      )}
    </motion.div>
  );
};

