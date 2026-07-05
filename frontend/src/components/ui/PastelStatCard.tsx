"use client";

import React from "react";
import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface PastelStatCardProps {
  icon?: React.ComponentType<any>;
  label: string;
  value: string | number;
  sub?: string;
  accent: string; // hex color e.g. '#3B82F6'
  onClick?: () => void;
  className?: string;
}

// Maps hex accent → pastel Tailwind gradient classes
const accentToPastel: Record<string, { bg: string; border: string }> = {
  "#3B82F6": { bg: "from-blue-100    to-blue-50    dark:from-blue-950/40    dark:to-blue-900/20",    border: "border-blue-200    dark:border-blue-800/50"    },
  "#6366F1": { bg: "from-indigo-100  to-indigo-50  dark:from-indigo-950/40  dark:to-indigo-900/20",  border: "border-indigo-200  dark:border-indigo-800/50"  },
  "#10B981": { bg: "from-emerald-100 to-emerald-50 dark:from-emerald-950/40 dark:to-emerald-900/20", border: "border-emerald-200 dark:border-emerald-800/50" },
  "#8B5CF6": { bg: "from-violet-100  to-violet-50  dark:from-violet-950/40  dark:to-violet-900/20",  border: "border-violet-200  dark:border-violet-800/50"  },
  "#7C3AED": { bg: "from-violet-100  to-violet-50  dark:from-violet-950/40  dark:to-violet-900/20",  border: "border-violet-200  dark:border-violet-800/50"  },
  "#F97316": { bg: "from-orange-100  to-orange-50  dark:from-orange-950/40  dark:to-orange-900/20",  border: "border-orange-200  dark:border-orange-800/50"  },
  "#F43F5E": { bg: "from-rose-100    to-rose-50    dark:from-rose-950/40    dark:to-rose-900/20",    border: "border-rose-200    dark:border-rose-800/50"    },
  "#06B6D4": { bg: "from-cyan-100    to-cyan-50    dark:from-cyan-950/40    dark:to-cyan-900/20",    border: "border-cyan-200    dark:border-cyan-800/50"    },
  "#F59E0B": { bg: "from-amber-100   to-amber-50   dark:from-amber-950/40   dark:to-amber-900/20",   border: "border-amber-200   dark:border-amber-800/50"   },
  "#EC4899": { bg: "from-pink-100    to-pink-50    dark:from-pink-950/40    dark:to-pink-900/20",    border: "border-pink-200    dark:border-pink-800/50"    },
  "#14B8A6": { bg: "from-teal-100    to-teal-50    dark:from-teal-950/40    dark:to-teal-900/20",    border: "border-teal-200    dark:border-teal-800/50"    },
  "#D946EF": { bg: "from-fuchsia-100 to-fuchsia-50 dark:from-fuchsia-950/40 dark:to-fuchsia-900/20", border: "border-fuchsia-200 dark:border-fuchsia-800/50" },
  "#A855F7": { bg: "from-purple-100  to-purple-50  dark:from-purple-950/40  dark:to-purple-900/20",  border: "border-purple-200  dark:border-purple-800/50"  },
};

const fallback = {
  bg:     "from-slate-100 to-slate-50 dark:from-slate-800/40 dark:to-slate-900/20",
  border: "border-slate-200 dark:border-slate-700/50",
};

export const PastelStatCard = ({
  icon: Icon,
  label,
  value,
  sub,
  accent,
  onClick,
  className,
}: PastelStatCardProps) => {
  const theme = accentToPastel[accent] ?? fallback;

  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-gradient-to-br",
        theme.bg,
        "border",
        theme.border,
        "rounded-xl px-4 py-3 flex flex-col gap-1.5 overflow-hidden",
        "shadow-[0_2px_10px_-3px_rgba(0,0,0,0.06)]",
        "transition-all duration-200 hover:scale-[1.015] hover:shadow-md",
        onClick ? "cursor-pointer select-none" : "",
        className
      )}
    >
      {/* Icon */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: accent + "22" }}
      >
        {Icon ? (
          <Icon className="w-4 h-4" style={{ color: accent }} />
        ) : (
          <HelpCircle className="w-4 h-4" style={{ color: accent }} />
        )}
      </div>

      {/* Value + Label */}
      <div className="space-y-0.5">
        <div className="text-[22px] font-bold text-slate-900 dark:text-white tracking-tight leading-none">
          {value}
        </div>
        <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 leading-tight">
          {label}
        </div>
      </div>

      {/* Sub text */}
      {sub && (
        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-tight">
          {sub}
        </div>
      )}
    </div>
  );
};
