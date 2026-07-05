"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, Building2, CreditCard, Leaf, ScrollText,
  Puzzle, ShieldCheck, Settings, Megaphone, Search, CheckCircle,
  XCircle, AlertTriangle, Database, Activity, Lock, Eye, EyeOff,
  ChevronDown, Send, RefreshCw, Shield, Bell, Filter
} from "lucide-react";
import { Sidebar, SidebarItem } from "../components/popuptech/Sidebar";
import { Card } from "../components/popuptech/Card";

const SIDEBAR_ITEMS: SidebarItem[] = [
  { id: "dashboard", label: "System Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: "users", label: "User & Role Management", icon: <Users className="w-4 h-4" /> },
  { id: "departments", label: "Department Setup", icon: <Building2 className="w-4 h-4" /> },
  { id: "payroll-config", label: "Payroll Configuration", icon: <CreditCard className="w-4 h-4" /> },
  { id: "leave-policy", label: "Leave Policy Settings", icon: <Leaf className="w-4 h-4" /> },
  { id: "auditlogs", label: "Audit Logs", icon: <ScrollText className="w-4 h-4" /> },
  { id: "integrations", label: "Integrations", icon: <Puzzle className="w-4 h-4" /> },
  { id: "security", label: "Security & Permissions", icon: <ShieldCheck className="w-4 h-4" /> },
  { id: "company", label: "Company Settings", icon: <Settings className="w-4 h-4" /> },
  { id: "broadcast", label: "Broadcast Announcements", icon: <Megaphone className="w-4 h-4" /> },
];

type UserRole = "Employee" | "HR" | "Admin";

const initialUsers = [
  { id: "USR-001", name: "Dipak Sharma", email: "dipak@popuptech.in", dept: "Technology", role: "Employee" as UserRole, active: true, lastLogin: "2m ago" },
  { id: "USR-002", name: "Nisha Agarwal", email: "nisha@popuptech.in", dept: "HR", role: "HR" as UserRole, active: true, lastLogin: "1h ago" },
  { id: "USR-003", name: "Ravi Kumar", email: "ravi@popuptech.in", dept: "Finance", role: "Employee" as UserRole, active: true, lastLogin: "3h ago" },
  { id: "USR-004", name: "Priya Mehta", email: "priya@popuptech.in", dept: "Design", role: "Employee" as UserRole, active: false, lastLogin: "2d ago" },
  { id: "USR-005", name: "Admin System", email: "admin@popuptech.in", dept: "IT", role: "Admin" as UserRole, active: true, lastLogin: "30m ago" },
  { id: "USR-006", name: "Ananya Singh", email: "ananya@popuptech.in", dept: "Technology", role: "HR" as UserRole, active: true, lastLogin: "5h ago" },
];

const auditLogs = [
  { id: "AUD-501", action: "Role Changed", detail: "Ananya Singh → HR (from Employee)", user: "Admin System", time: "2 min ago", severity: "warning" },
  { id: "AUD-500", action: "Payroll Updated", detail: "June 2026 payroll batch processed — ₹1.4Cr", user: "Nisha Agarwal", time: "1 hour ago", severity: "info" },
  { id: "AUD-499", action: "Policy Updated", detail: "Work From Home Policy v2.3 published", user: "Nisha Agarwal", time: "3 hours ago", severity: "info" },
  { id: "AUD-498", action: "User Deactivated", detail: "Priya Mehta account suspended", user: "Admin System", time: "2 days ago", severity: "error" },
  { id: "AUD-497", action: "Permission Revoked", detail: "Payroll export access removed from Ravi Kumar", user: "Admin System", time: "3 days ago", severity: "warning" },
  { id: "AUD-496", action: "Backup Completed", detail: "Full system backup — 2.1GB, encrypted", user: "System Scheduler", time: "6 hours ago", severity: "success" },
];

const failedLogins = [
  { email: "ravi@popuptech.in", attempts: 3, lastAttempt: "45m ago", ip: "192.168.1.14", blocked: false },
  { email: "unknown@test.com", attempts: 7, lastAttempt: "2h ago", ip: "45.33.221.8", blocked: true },
  { email: "priya@popuptech.in", attempts: 2, lastAttempt: "3h ago", ip: "192.168.1.22", blocked: false },
];

const severityStyles: Record<string, { dot: string; bg: string; text: string }> = {
  warning: { dot: "bg-[#D97706]", bg: "bg-[#D97706]/10", text: "text-[#D97706]" },
  error: { dot: "bg-[#DC2626]", bg: "bg-[#DC2626]/10", text: "text-[#DC2626]" },
  info: { dot: "bg-[#6B2E1F]", bg: "bg-[#6B2E1F]/10", text: "text-[#6B2E1F]" },
  success: { dot: "bg-[#16A34A]", bg: "bg-[#16A34A]/10", text: "text-[#16A34A]" },
};

const roleBadge: Record<UserRole, { bg: string; text: string }> = {
  Employee: { bg: "bg-[#16A34A]/10", text: "text-[#16A34A]" },
  HR: { bg: "bg-[#D97706]/10", text: "text-[#D97706]" },
  Admin: { bg: "bg-[#DC2626]/10", text: "text-[#DC2626]" },
};

function RoleToggle({ current, onChange }: { current: UserRole; onChange: (r: UserRole) => void }) {
  const roles: UserRole[] = ["Employee", "HR", "Admin"];
  return (
    <div className="flex rounded-md border border-[#E5E5E5] overflow-hidden text-[10px] font-semibold">
      {roles.map((r) => (
        <button
          key={r}
          onClick={() => onChange(r)}
          className={`px-2 py-1 transition-colors duration-150 ${current === r ? "bg-[#6B2E1F] text-white" : "bg-white text-[#6B7280] hover:bg-[#F5F5F5]"}`}
        >
          {r}
        </button>
      ))}
    </div>
  );
}

function AnnouncementBroadcaster() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [target, setTarget] = useState("All Employees");
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    if (!title || !body) return;
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setTitle("");
      setBody("");
    }, 3000);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-semibold uppercase tracking-widest text-[#6B7280]">Announcement Title</label>
        <input
          type="text"
          placeholder="e.g., Office Closed on July 4th"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="px-3 py-2 text-[13px] border border-[#E5E5E5] rounded-lg focus:outline-none focus:border-[#6B2E1F]/40 focus:ring-1 focus:ring-[#6B2E1F]/20 transition-all duration-150 text-[#1A1A1A] placeholder:text-[#C4C4C4]"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-semibold uppercase tracking-widest text-[#6B7280]">Message</label>
        <textarea
          rows={3}
          placeholder="Write your announcement here..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="px-3 py-2 text-[13px] border border-[#E5E5E5] rounded-lg resize-none focus:outline-none focus:border-[#6B2E1F]/40 focus:ring-1 focus:ring-[#6B2E1F]/20 transition-all duration-150 text-[#1A1A1A] placeholder:text-[#C4C4C4]"
        />
      </div>
      <div className="flex gap-3 items-end">
        <div className="flex flex-col gap-1 flex-1">
          <label className="text-[11px] font-semibold uppercase tracking-widest text-[#6B7280]">Target Audience</label>
          <div className="relative">
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full appearance-none px-3 py-2 pr-8 text-[13px] border border-[#E5E5E5] rounded-lg focus:outline-none focus:border-[#6B2E1F]/40 bg-white text-[#1A1A1A]"
            >
              <option>All Employees</option>
              <option>HR Team Only</option>
              <option>Engineering</option>
              <option>Management</option>
              <option>All Managers</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280] pointer-events-none" />
          </div>
        </div>
        <button
          onClick={handleSend}
          className="flex items-center gap-2 px-4 py-2 bg-[#6B2E1F] text-white text-[13px] font-semibold rounded-lg hover:bg-[#5a2519] transition-colors duration-150 disabled:opacity-70"
          disabled={!title || !body}
        >
          <Send className="w-3.5 h-3.5" />
          {sent ? "Sent!" : "Broadcast"}
        </button>
      </div>

      {/* Live Preview */}
      {(title || body) && (
        <div className="mt-1 p-3 rounded-lg border border-[#E5E5E5] bg-[#FAFAFA]">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7280] mb-2 block">Preview</span>
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#6B2E1F] flex items-center justify-center flex-shrink-0">
              <Megaphone className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[14px] font-semibold text-[#1A1A1A]">{title || "Untitled Announcement"}</span>
              <span className="text-[12px] text-[#6B7280]">To: {target}</span>
              <p className="text-[13px] text-[#4B5563] mt-1">{body}</p>
            </div>
          </div>
        </div>
      )}

      {sent && (
        <div className="flex items-center gap-2 px-3 py-2 bg-[#16A34A]/10 text-[#16A34A] rounded-lg text-[13px] font-semibold">
          <CheckCircle className="w-4 h-4" /> Announcement broadcast successfully!
        </div>
      )}
    </div>
  );
}

export default function AdminPanelPage() {
  const [activePage, setActivePage] = useState("dashboard");
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const router = useRouter();

  const handleRoleSwitch = (role: "Employee" | "HR" | "Admin") => {
    if (role === "Employee") router.push("/employee");
    if (role === "HR") router.push("/hr");
  };

  const handleRoleChange = (id: string, newRole: UserRole) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role: newRole } : u)));
  };

  const handleToggleActive = (id: string) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, active: !u.active } : u)));
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.dept.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = users.filter((u) => u.active).length;
  const pendingHR = 3;
  const systemAlerts = 2;

  return (
    <div className="flex h-screen bg-[#F5F5F5] font-[system-ui,Inter,sans-serif] text-[#1A1A1A]">
      <Sidebar
        items={SIDEBAR_ITEMS}
        activeItem={activePage}
        onItemClick={setActivePage}
        panelName="Admin Panel"
        role="Admin"
        userName="Admin System"
        userDept="IT"
        onRoleSwitch={handleRoleSwitch}
      />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">

          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-widest text-[#6B7280]">
                PopupTech HR Core — Admin Console
              </span>
              <h1 className="text-2xl font-bold text-[#1A1A1A] mt-1">System Dashboard</h1>
              <p className="text-[14px] text-[#6B7280]">Full system health and control center</p>
            </div>
            <button className="flex items-center gap-2 px-3 py-2 bg-white border border-[#E5E5E5] text-[13px] font-semibold rounded-lg hover:bg-[#F5F5F5] transition-colors shadow-[0_1px_3px_rgba(0,0,0,0.08)] text-[#6B7280]">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          {/* System Health Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card
              title="Active Users"
              value={activeCount}
              subtext={`${users.length - activeCount} inactive`}
              accentColor="success"
              icon={<Activity className="w-5 h-5" />}
            />
            <Card
              title="Pending HR Approvals"
              value={pendingHR}
              subtext="Needs admin review"
              accentColor="warning"
              icon={<Bell className="w-5 h-5" />}
            />
            <Card
              title="System Alerts"
              value={systemAlerts}
              subtext="2 critical, 0 warnings"
              accentColor="error"
              icon={<AlertTriangle className="w-5 h-5" />}
            />
            <Card
              title="Last Backup"
              accentColor="none"
              icon={<Database className="w-5 h-5" />}
            >
              <div className="flex flex-col gap-0.5 mt-1">
                <span className="text-[15px] font-bold text-[#1A1A1A]">6h ago</span>
                <span className="text-[12px] text-[#16A34A] font-medium">✓ Successful</span>
                <span className="text-[11px] text-[#6B7280]">2.1GB · Encrypted</span>
              </div>
            </Card>
          </div>

          {/* User Management Table + Audit Log */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* User Management */}
            <div className="lg:col-span-3">
              <Card accentColor="primary" className="h-full">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#6B2E1F]/10 flex items-center justify-center">
                      <Users className="w-4 h-4 text-[#6B2E1F]" />
                    </div>
                    <div>
                      <p className="text-[15px] font-semibold text-[#1A1A1A]">User Management</p>
                      <p className="text-[12px] text-[#6B7280]">{users.length} total users</p>
                    </div>
                  </div>
                </div>

                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9CA3AF]" />
                  <input
                    type="text"
                    placeholder="Search by name, email, or department..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-[13px] border border-[#E5E5E5] rounded-lg focus:outline-none focus:border-[#6B2E1F]/40 focus:ring-1 focus:ring-[#6B2E1F]/20 transition-all duration-150 text-[#1A1A1A] placeholder:text-[#C4C4C4]"
                  />
                </div>

                {filteredUsers.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-6 text-center">
                    <Search className="w-8 h-8 text-[#E5E5E5]" />
                    <p className="text-[13px] text-[#6B7280]">No users match your search.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredUsers.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-[#F5F5F5] hover:bg-[#EEEEEE] transition-colors duration-150"
                      >
                        <div className="w-8 h-8 rounded-full bg-[#6B2E1F] flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold text-[10px]">
                            {u.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                          </span>
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-semibold text-[#1A1A1A] truncate">{u.name}</span>
                            {!u.active && (
                              <span className="inline-flex px-1.5 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider bg-[#6B7280]/10 text-[#6B7280]">
                                Inactive
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-[#6B7280] truncate">{u.email} · {u.dept}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <RoleToggle
                            current={u.role}
                            onChange={(r) => handleRoleChange(u.id, r)}
                          />
                          <button
                            onClick={() => handleToggleActive(u.id)}
                            className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-colors duration-150 ${u.active
                              ? "bg-[#DC2626]/10 text-[#DC2626] hover:bg-[#DC2626]/20"
                              : "bg-[#16A34A]/10 text-[#16A34A] hover:bg-[#16A34A]/20"
                              }`}
                          >
                            {u.active ? "Deactivate" : "Activate"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* Audit Log Feed */}
            <div className="lg:col-span-2">
              <Card accentColor="warning" className="h-full">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-[#D97706]/10 flex items-center justify-center">
                    <ScrollText className="w-4 h-4 text-[#D97706]" />
                  </div>
                  <div>
                    <p className="text-[15px] font-semibold text-[#1A1A1A]">Audit Log</p>
                    <p className="text-[12px] text-[#6B7280]">Recent critical actions</p>
                  </div>
                </div>
                <ul className="space-y-3">
                  {auditLogs.map((log) => {
                    const sev = severityStyles[log.severity];
                    return (
                      <li key={log.id} className="flex items-start gap-2.5 pb-3 border-b border-[#F0F0F0] last:border-0 last:pb-0">
                        <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${sev.dot}`} />
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-semibold text-[#1A1A1A]">{log.action}</span>
                            <span className={`inline-flex px-1.5 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider ${sev.bg} ${sev.text}`}>
                              {log.severity}
                            </span>
                          </div>
                          <span className="text-[12px] text-[#4B5563] leading-snug">{log.detail}</span>
                          <div className="flex items-center gap-1.5 text-[11px] text-[#9CA3AF]">
                            <span>{log.user}</span>
                            <span>·</span>
                            <span>{log.time}</span>
                            <span className="text-[10px] font-mono text-[#C4C4C4]">#{log.id}</span>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            </div>
          </div>

          {/* Security Panel + Announcement Broadcaster */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Security Panel */}
            <div className="lg:col-span-2">
              <Card accentColor="error" className="h-full">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-[#DC2626]/10 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-[#DC2626]" />
                  </div>
                  <div>
                    <p className="text-[15px] font-semibold text-[#1A1A1A]">Security Panel</p>
                    <p className="text-[12px] text-[#6B7280]">Login activity & 2FA status</p>
                  </div>
                </div>

                {/* 2FA Status */}
                <div className="mb-4 p-3 rounded-lg bg-[#F5F5F5] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[#6B7280]" />
                    <div>
                      <p className="text-[13px] font-semibold text-[#1A1A1A]">2FA Coverage</p>
                      <p className="text-[11px] text-[#6B7280]">4 of 6 users enrolled</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[18px] font-bold text-[#16A34A]">67%</span>
                    <span className="text-[10px] text-[#6B7280]">coverage</span>
                  </div>
                </div>

                {/* 2FA Progress Bar */}
                <div className="mb-4">
                  <div className="h-2 bg-[#E5E5E5] rounded-full overflow-hidden">
                    <div className="h-full bg-[#16A34A] rounded-full" style={{ width: "67%" }} />
                  </div>
                  <p className="text-[11px] text-[#DC2626] mt-1.5 font-medium">⚠ 2 users without 2FA: Ravi Kumar, Priya Mehta</p>
                </div>

                {/* Failed Login Attempts */}
                <p className="text-[11px] font-semibold uppercase tracking-widest text-[#6B7280] mb-2">Failed Login Attempts</p>
                <ul className="space-y-2">
                  {failedLogins.map((fl, i) => (
                    <li key={i} className="flex items-start justify-between gap-2 text-[12px] pb-2 border-b border-[#F0F0F0] last:border-0 last:pb-0">
                      <div className="flex flex-col min-w-0">
                        <span className="font-mono text-[11px] text-[#1A1A1A] truncate">{fl.email}</span>
                        <span className="text-[#6B7280]">IP: {fl.ip} · {fl.lastAttempt}</span>
                      </div>
                      <div className="flex flex-col items-end flex-shrink-0">
                        <span className="font-bold text-[#DC2626]">{fl.attempts}x</span>
                        {fl.blocked && (
                          <span className="text-[9px] font-semibold uppercase tracking-wider bg-[#DC2626]/10 text-[#DC2626] px-1.5 py-0.5 rounded-full">Blocked</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>

            {/* Announcement Broadcaster */}
            <div className="lg:col-span-3">
              <Card accentColor="none" className="h-full">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-[#F5F5F5] flex items-center justify-center">
                    <Megaphone className="w-4 h-4 text-[#6B7280]" />
                  </div>
                  <div>
                    <p className="text-[15px] font-semibold text-[#1A1A1A]">Broadcast Announcement</p>
                    <p className="text-[12px] text-[#6B7280]">Send company-wide messages</p>
                  </div>
                </div>
                <AnnouncementBroadcaster />
              </Card>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
