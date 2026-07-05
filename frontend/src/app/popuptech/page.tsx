"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { Users, BarChart3, ShieldCheck, ArrowRight, Building2 } from "lucide-react";

const panels = [
  {
    route: "/employee",
    role: "Employee",
    name: "Employee Panel",
    description: "Track attendance, submit DSR, view payslips, manage leaves and claims.",
    icon: <Users className="w-6 h-6" />,
    badge: { bg: "bg-[#16A34A]/10", text: "text-[#16A34A]", border: "border-[#16A34A]/20" },
    accentBorder: "border-l-[#16A34A]",
  },
  {
    route: "/hr",
    role: "HR",
    name: "HR Panel",
    description: "Manage leaves, onboarding pipeline, performance reviews, payroll and recruitment.",
    icon: <BarChart3 className="w-6 h-6" />,
    badge: { bg: "bg-[#D97706]/10", text: "text-[#D97706]", border: "border-[#D97706]/20" },
    accentBorder: "border-l-[#D97706]",
  },
  {
    route: "/admin2",
    role: "Admin",
    name: "Admin Panel",
    description: "System dashboard, user & role management, audit logs, security and policy control.",
    icon: <ShieldCheck className="w-6 h-6" />,
    badge: { bg: "bg-[#DC2626]/10", text: "text-[#DC2626]", border: "border-[#DC2626]/20" },
    accentBorder: "border-l-[#DC2626]",
  },
];

export default function PopupTechHRCore() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#F5F5F5] font-[system-ui,Inter,sans-serif] flex flex-col items-center justify-center px-6 py-16">
      {/* Brand Header */}
      <div className="flex flex-col items-center gap-3 mb-12">
        <div className="w-14 h-14 rounded-2xl bg-[#6B2E1F] flex items-center justify-center shadow-[0_4px_12px_rgba(107,46,31,0.25)]">
          <Building2 className="w-7 h-7 text-white" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#1A1A1A]">PopupTech HR Core</h1>
          <p className="text-[14px] text-[#6B7280] mt-1">Select your role to enter the right panel</p>
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <div className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
          <span className="text-[12px] text-[#6B7280]">All systems operational</span>
        </div>
      </div>

      {/* Panel Cards */}
      <div className="w-full max-w-3xl grid grid-cols-1 sm:grid-cols-3 gap-5">
        {panels.map((panel) => (
          <button
            key={panel.route}
            onClick={() => router.push(panel.route)}
            className={`
              group text-left bg-white border border-[#E5E5E5] border-l-4 ${panel.accentBorder}
              rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)]
              p-5 flex flex-col gap-3
              transition-all duration-150 ease-out
              hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] hover:scale-[1.02]
            `}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${panel.badge.bg} ${panel.badge.text}`}>
              {panel.icon}
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[15px] font-semibold text-[#1A1A1A]">{panel.name}</span>
                <ArrowRight className="w-4 h-4 text-[#C4C4C4] group-hover:text-[#6B2E1F] transition-colors duration-150 group-hover:translate-x-0.5 transform" />
              </div>
              <span className={`inline-flex self-start px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-widest ${panel.badge.bg} ${panel.badge.text}`}>
                {panel.role}
              </span>
            </div>
            <p className="text-[13px] text-[#6B7280] leading-relaxed">{panel.description}</p>
          </button>
        ))}
      </div>

      {/* Footer */}
      <p className="mt-12 text-[11px] text-[#9CA3AF] text-center">
        PopupTech HR Core · Built with precision · 2026
      </p>
    </div>
  );
}
