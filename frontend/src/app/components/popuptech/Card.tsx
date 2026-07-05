"use client";
import React from "react";

type AccentColor = "primary" | "success" | "warning" | "error" | "none";

interface CardProps {
  title?: string;
  value?: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  accentColor?: AccentColor;
  className?: string;
  children?: React.ReactNode;
  wide?: boolean;
  onClick?: () => void;
}

const accentMap: Record<AccentColor, { border: string; iconBg: string; iconText: string }> = {
  primary: {
    border: "border-l-[#6B2E1F]",
    iconBg: "bg-[#6B2E1F]/10",
    iconText: "text-[#6B2E1F]",
  },
  success: {
    border: "border-l-[#16A34A]",
    iconBg: "bg-[#16A34A]/10",
    iconText: "text-[#16A34A]",
  },
  warning: {
    border: "border-l-[#D97706]",
    iconBg: "bg-[#D97706]/10",
    iconText: "text-[#D97706]",
  },
  error: {
    border: "border-l-[#DC2626]",
    iconBg: "bg-[#DC2626]/10",
    iconText: "text-[#DC2626]",
  },
  none: {
    border: "border-l-transparent",
    iconBg: "bg-[#F5F5F5]",
    iconText: "text-[#1A1A1A]",
  },
};

export const Card: React.FC<CardProps> = ({
  title,
  value,
  subtext,
  icon,
  accentColor = "none",
  className = "",
  children,
  onClick,
}) => {
  const accent = accentMap[accentColor];
  return (
    <div
      onClick={onClick}
      className={`
        bg-white border border-[#E5E5E5] border-l-4 ${accent.border}
        rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)]
        p-4 flex flex-col gap-2
        transition-all duration-150 ease-out
        hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] hover:scale-[1.01]
        ${onClick ? "cursor-pointer" : ""}
        ${className}
      `}
    >
      {(title || icon) && (
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1 min-w-0">
            {title && (
              <span className="text-[11px] font-semibold uppercase tracking-widest text-[#6B7280] truncate">
                {title}
              </span>
            )}
            {value !== undefined && (
              <span className="text-2xl font-bold text-[#1A1A1A] leading-tight">{value}</span>
            )}
            {subtext && (
              <span className="text-[13px] text-[#6B7280] leading-snug">{subtext}</span>
            )}
          </div>
          {icon && (
            <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${accent.iconBg} ${accent.iconText}`}>
              {icon}
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;
