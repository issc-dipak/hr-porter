"use client";
import React, { useState, useEffect } from "react";
import { Menu, X, ChevronLeft } from "lucide-react";

export interface SidebarItem {
  icon: React.ReactNode;
  label: string;
  id: string;
}

interface SidebarProps {
  items: SidebarItem[];
  activeItem: string;
  onItemClick: (id: string) => void;
  panelName: string;
  panelSubtitle?: string;
  role: "Employee" | "HR" | "Admin";
  userName?: string;
  userDept?: string;
  onRoleSwitch?: (role: "Employee" | "HR" | "Admin") => void;
}

const roleBadgeColors: Record<string, { bg: string; text: string }> = {
  Employee: { bg: "bg-[#16A34A]/10", text: "text-[#16A34A]" },
  HR: { bg: "bg-[#D97706]/10", text: "text-[#D97706]" },
  Admin: { bg: "bg-[#DC2626]/10", text: "text-[#DC2626]" },
};

export const Sidebar: React.FC<SidebarProps> = ({
  items,
  activeItem,
  onItemClick,
  panelName,
  role,
  userName = "John Doe",
  userDept = "Technology",
  onRoleSwitch,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showRolePicker, setShowRolePicker] = useState(false);

  useEffect(() => {
    const check = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) setCollapsed(false);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const badge = roleBadgeColors[role] || roleBadgeColors.Employee;
  const sidebarWidth = collapsed ? "w-16" : "w-60";

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-[#E5E5E5] min-h-[64px]">
        {!collapsed && (
          <div className="flex flex-col min-w-0">
            <span className="text-[#6B2E1F] font-bold text-[15px] leading-tight truncate">
              PopupTech
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-[#6B7280] truncate">
              {panelName}
            </span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-[#6B2E1F] flex items-center justify-center mx-auto">
            <span className="text-white font-bold text-sm">P</span>
          </div>
        )}
        {!isMobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center hover:bg-[#F5F5F5] transition-colors duration-150 text-[#6B7280]"
          >
            <ChevronLeft className={`w-4 h-4 transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`} />
          </button>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {items.map((item) => {
          const isActive = activeItem === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onItemClick(item.id);
                if (isMobile) setMobileOpen(false);
              }}
              title={collapsed ? item.label : undefined}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left
                transition-all duration-150 ease-out group
                ${isActive
                  ? "bg-[#6B2E1F]/10 text-[#6B2E1F] font-semibold"
                  : "text-[#4B5563] hover:bg-[#F5F5F5] hover:text-[#1A1A1A]"
                }
                ${collapsed ? "justify-center" : ""}
              `}
            >
              <span className={`flex-shrink-0 w-4 h-4 ${isActive ? "text-[#6B2E1F]" : "text-[#6B7280] group-hover:text-[#1A1A1A]"} transition-colors duration-150`}>
                {item.icon}
              </span>
              {!collapsed && (
                <span className="text-[13px] leading-tight truncate">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Profile / Role Badge */}
      <div className="border-t border-[#E5E5E5] p-3 relative">
        {showRolePicker && onRoleSwitch && (
          <div className="absolute bottom-full left-2 right-2 mb-2 bg-white border border-[#E5E5E5] rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.12)] overflow-hidden z-50">
            {(["Employee", "HR", "Admin"] as const).map((r) => (
              <button
                key={r}
                onClick={() => { onRoleSwitch(r); setShowRolePicker(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2.5 text-left text-[13px] font-medium transition-colors hover:bg-[#F5F5F5] ${role === r ? "text-[#6B2E1F]" : "text-[#4B5563]"}`}
              >
                <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${roleBadgeColors[r].bg} ${roleBadgeColors[r].text}`}>
                  {r}
                </span>
                <span>Switch to {r}</span>
              </button>
            ))}
          </div>
        )}
        <button
          onClick={() => setShowRolePicker(!showRolePicker)}
          className={`w-full flex items-center gap-3 rounded-lg p-2 hover:bg-[#F5F5F5] transition-colors duration-150 ${collapsed ? "justify-center" : ""}`}
        >
          <div className="w-8 h-8 rounded-full bg-[#6B2E1F] flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-[12px]">
              {userName.split(" ").map(n => n[0]).join("").slice(0, 2)}
            </span>
          </div>
          {!collapsed && (
            <div className="flex flex-col items-start min-w-0 flex-1">
              <span className="text-[13px] font-semibold text-[#1A1A1A] truncate">{userName}</span>
              <span className={`inline-flex px-1.5 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider ${badge.bg} ${badge.text}`}>
                {role}
              </span>
            </div>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      {isMobile && (
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed top-4 left-4 z-40 w-10 h-10 bg-white border border-[#E5E5E5] rounded-lg flex items-center justify-center shadow-sm"
        >
          <Menu className="w-5 h-5 text-[#1A1A1A]" />
        </button>
      )}

      {/* Mobile overlay */}
      {isMobile && mobileOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="absolute top-0 left-0 h-full w-64 bg-white border-r border-[#E5E5E5] shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-[#6B7280]"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      {!isMobile && (
        <aside
          className={`hidden md:flex flex-col ${sidebarWidth} h-screen bg-white border-r border-[#E5E5E5] flex-shrink-0 transition-all duration-200 ease-out`}
        >
          <SidebarContent />
        </aside>
      )}
    </>
  );
};

export default Sidebar;
