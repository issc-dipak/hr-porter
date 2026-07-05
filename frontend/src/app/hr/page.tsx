"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3, Users, Clock, FileText, Briefcase, Target,
  Settings, LogOut, Bell, UserCheck, UserX, CheckCircle,
  XCircle, ChevronRight, Calendar, TrendingUp, Star,
  Megaphone, HelpCircle, ClipboardList, UserPlus, Search
} from "lucide-react";
import { Sidebar, SidebarItem } from "../components/popuptech/Sidebar";
import { Card } from "../components/popuptech/Card";

const SIDEBAR_ITEMS: SidebarItem[] = [
  { id: "dashboard", label: "Dashboard", icon: <BarChart3 className="w-4 h-4" /> },
  { id: "employees", label: "Employee Directory", icon: <Users className="w-4 h-4" /> },
  { id: "attendance", label: "Attendance Management", icon: <Clock className="w-4 h-4" /> },
  { id: "leaves", label: "Leave Approvals", icon: <ClipboardList className="w-4 h-4" /> },
  { id: "recruitment", label: "Recruitment & Onboarding", icon: <UserPlus className="w-4 h-4" /> },
  { id: "payroll", label: "Payroll Processing", icon: <FileText className="w-4 h-4" /> },
  { id: "performance", label: "Performance Reviews", icon: <Target className="w-4 h-4" /> },
  { id: "policies", label: "Policy & Documents", icon: <FileText className="w-4 h-4" /> },
  { id: "announcements", label: "Announcements", icon: <Megaphone className="w-4 h-4" /> },
  { id: "helpdesk", label: "Help Desk Tickets", icon: <HelpCircle className="w-4 h-4" /> },
  { id: "reports", label: "Reports & Analytics", icon: <TrendingUp className="w-4 h-4" /> },
];

const mockLeaveRequests = [
  { id: "LR-2041", name: "Priya Mehta", type: "Casual Leave", from: "Jul 5", to: "Jul 7", days: 3, dept: "Design", status: "Pending" },
  { id: "LR-2040", name: "Rahul Verma", type: "Sick Leave", from: "Jul 3", to: "Jul 3", days: 1, dept: "Engineering", status: "Pending" },
  { id: "LR-2039", name: "Sneha Kulkarni", type: "Earned Leave", from: "Jul 10", to: "Jul 14", days: 5, dept: "Marketing", status: "Pending" },
  { id: "LR-2038", name: "Arjun Nair", type: "Casual Leave", from: "Jul 2", to: "Jul 2", days: 1, dept: "Sales", status: "Approved" },
];

const mockOnboarding = [
  { id: 1, name: "Kiran Bose", role: "Product Designer", stage: "Applied", avatar: "KB" },
  { id: 2, name: "Sanjay Patel", role: "Backend Engineer", stage: "Interview", avatar: "SP" },
  { id: 3, name: "Meera Joshi", role: "HR Associate", stage: "Offer", avatar: "MJ" },
  { id: 4, name: "Rohit Das", role: "Data Analyst", stage: "Joined", avatar: "RD" },
  { id: 5, name: "Ananya Singh", role: "Frontend Engineer", stage: "Interview", avatar: "AS" },
];

const mockReviews = [
  { name: "Dipak Sharma", dept: "Technology", dueDate: "Jul 2", rating: 4.2, status: "Due Soon" },
  { name: "Lakshmi Rao", dept: "Finance", dueDate: "Jul 3", rating: 3.8, status: "Due Soon" },
  { name: "Farhan Sheikh", dept: "Marketing", dueDate: "Jul 5", rating: 4.5, status: "Upcoming" },
  { name: "Tanya Roy", dept: "Operations", dueDate: "Jul 7", rating: 3.5, status: "Upcoming" },
];

const deptData = [
  { name: "Engineering", count: 48, color: "#6B2E1F" },
  { name: "Design", count: 22, color: "#9B4F3F" },
  { name: "Marketing", count: 18, color: "#C46A57" },
  { name: "Finance", count: 15, color: "#D4866F" },
  { name: "HR", count: 12, color: "#E6A490" },
  { name: "Sales", count: 27, color: "#7A3528" },
];

const STAGE_COLORS: Record<string, { bg: string; text: string }> = {
  Applied: { bg: "bg-[#6B7280]/10", text: "text-[#6B7280]" },
  Interview: { bg: "bg-[#D97706]/10", text: "text-[#D97706]" },
  Offer: { bg: "bg-[#6B2E1F]/10", text: "text-[#6B2E1F]" },
  Joined: { bg: "bg-[#16A34A]/10", text: "text-[#16A34A]" },
};

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string }> = {
    Pending: { bg: "bg-[#D97706]/10", text: "text-[#D97706]" },
    Approved: { bg: "bg-[#16A34A]/10", text: "text-[#16A34A]" },
    Rejected: { bg: "bg-[#DC2626]/10", text: "text-[#DC2626]" },
  };
  const s = map[status] || map.Pending;
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${s.bg} ${s.text}`}>
      {status}
    </span>
  );
}

function BarChart({ data }: { data: typeof deptData }) {
  const maxCount = Math.max(...data.map((d) => d.count));
  return (
    <div className="flex items-end gap-3 h-36 mt-2">
      {data.map((d) => (
        <div key={d.name} className="flex flex-col items-center gap-1 flex-1">
          <span className="text-[10px] font-bold text-[#1A1A1A]">{d.count}</span>
          <div
            className="w-full rounded-t-md transition-all duration-300"
            style={{ height: `${(d.count / maxCount) * 100}%`, backgroundColor: d.color }}
          />
          <span className="text-[9px] text-[#6B7280] text-center leading-tight truncate w-full">{d.name}</span>
        </div>
      ))}
    </div>
  );
}

export default function HRPanelPage() {
  const [activePage, setActivePage] = useState("dashboard");
  const [approvals, setApprovals] = useState(mockLeaveRequests);
  const router = useRouter();

  const handleApprove = (id: string) => {
    setApprovals((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "Approved" } : r))
    );
  };

  const handleReject = (id: string) => {
    setApprovals((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "Rejected" } : r))
    );
  };

  const handleRoleSwitch = (role: "Employee" | "HR" | "Admin") => {
    if (role === "Employee") router.push("/employee");
    if (role === "Admin") router.push("/admin2");
  };

  const pendingCount = approvals.filter((a) => a.status === "Pending").length;

  return (
    <div className="flex h-screen bg-[#F5F5F5] font-[system-ui,Inter,sans-serif] text-[#1A1A1A]">
      <Sidebar
        items={SIDEBAR_ITEMS}
        activeItem={activePage}
        onItemClick={setActivePage}
        panelName="HR Panel"
        role="HR"
        userName="Nisha Agarwal"
        userDept="Human Resources"
        onRoleSwitch={handleRoleSwitch}
      />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">

          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-widest text-[#6B7280]">
                {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </span>
              <h1 className="text-2xl font-bold text-[#1A1A1A] mt-1">HR Dashboard</h1>
              <p className="text-[14px] text-[#6B7280]">Overview of your organization's HR metrics</p>
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-4 py-2 bg-[#6B2E1F] text-white text-[13px] font-semibold rounded-lg hover:bg-[#5a2519] transition-colors duration-150">
                <UserPlus className="w-4 h-4" /> Add Employee
              </button>
            </div>
          </div>

          {/* Org-wide Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card
              title="Total Employees"
              value="142"
              subtext="+4 this month"
              accentColor="primary"
              icon={<Users className="w-5 h-5" />}
            />
            <Card
              title="Pending Leave Approvals"
              value={pendingCount}
              subtext={`${pendingCount} require action`}
              accentColor="warning"
              icon={<ClipboardList className="w-5 h-5" />}
            />
            <Card
              title="Open Positions"
              value="7"
              subtext="3 in final interview"
              accentColor="none"
              icon={<Briefcase className="w-5 h-5" />}
            />
            <Card
              title="Today's Absentees"
              value="5"
              subtext="3.5% absence rate"
              accentColor="error"
              icon={<UserX className="w-5 h-5" />}
            />
          </div>

          {/* Two-column section */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Pending Approvals Table — wider */}
            <div className="lg:col-span-3">
              <Card accentColor="warning" className="h-full">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#D97706]/10 flex items-center justify-center">
                      <ClipboardList className="w-4 h-4 text-[#D97706]" />
                    </div>
                    <div>
                      <p className="text-[15px] font-semibold text-[#1A1A1A]">Pending Approvals</p>
                      <p className="text-[12px] text-[#6B7280]">Leave & document requests</p>
                    </div>
                  </div>
                  <button className="text-[12px] text-[#6B2E1F] font-semibold hover:underline">View all</button>
                </div>

                {approvals.filter(a => a.status === "Pending").length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-6 text-center">
                    <CheckCircle className="w-8 h-8 text-[#16A34A]" />
                    <p className="text-[13px] text-[#6B7280]">All caught up! No pending approvals.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[480px]">
                      <thead>
                        <tr className="border-b border-[#F0F0F0]">
                          <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#6B7280] pb-2 pr-3">Employee</th>
                          <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#6B7280] pb-2 pr-3">Type</th>
                          <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#6B7280] pb-2 pr-3">Duration</th>
                          <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#6B7280] pb-2">Status</th>
                          <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[#6B7280] pb-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {approvals.map((req) => (
                          <tr key={req.id} className="border-b border-[#F5F5F5] last:border-0 hover:bg-[#FAFAFA] transition-colors">
                            <td className="py-2.5 pr-3">
                              <div className="flex flex-col">
                                <span className="text-[13px] font-semibold text-[#1A1A1A]">{req.name}</span>
                                <span className="text-[11px] text-[#6B7280]">{req.dept}</span>
                              </div>
                            </td>
                            <td className="py-2.5 pr-3 text-[13px] text-[#4B5563]">{req.type}</td>
                            <td className="py-2.5 pr-3 text-[12px] text-[#6B7280]">
                              {req.from} – {req.to} <span className="text-[#1A1A1A] font-semibold">({req.days}d)</span>
                            </td>
                            <td className="py-2.5 pr-3">
                              <StatusBadge status={req.status} />
                            </td>
                            <td className="py-2.5 text-right">
                              {req.status === "Pending" ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => handleApprove(req.id)}
                                    className="flex items-center gap-1 px-2.5 py-1 bg-[#16A34A]/10 text-[#16A34A] text-[11px] font-semibold rounded-md hover:bg-[#16A34A]/20 transition-colors duration-150"
                                  >
                                    <CheckCircle className="w-3 h-3" /> Approve
                                  </button>
                                  <button
                                    onClick={() => handleReject(req.id)}
                                    className="flex items-center gap-1 px-2.5 py-1 bg-[#DC2626]/10 text-[#DC2626] text-[11px] font-semibold rounded-md hover:bg-[#DC2626]/20 transition-colors duration-150"
                                  >
                                    <XCircle className="w-3 h-3" /> Reject
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[11px] text-[#6B7280]">Processed</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </div>

            {/* Upcoming Reviews */}
            <div className="lg:col-span-2">
              <Card accentColor="success" className="h-full">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-[#16A34A]/10 flex items-center justify-center">
                    <Star className="w-4 h-4 text-[#16A34A]" />
                  </div>
                  <div>
                    <p className="text-[15px] font-semibold text-[#1A1A1A]">Upcoming Reviews</p>
                    <p className="text-[12px] text-[#6B7280]">Due this week</p>
                  </div>
                </div>
                {mockReviews.length === 0 ? (
                  <p className="text-[13px] text-[#6B7280] text-center py-4">No reviews due this week.</p>
                ) : (
                  <ul className="space-y-2.5">
                    {mockReviews.map((r, i) => (
                      <li key={i} className="flex items-center justify-between border-b border-[#F5F5F5] last:border-0 pb-2.5 last:pb-0">
                        <div className="flex flex-col">
                          <span className="text-[13px] font-semibold text-[#1A1A1A]">{r.name}</span>
                          <span className="text-[11px] text-[#6B7280]">{r.dept} · Due {r.dueDate}</span>
                        </div>
                        <div className="flex flex-col items-end gap-0.5">
                          <span className={`inline-flex px-1.5 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider ${r.status === "Due Soon" ? "bg-[#DC2626]/10 text-[#DC2626]" : "bg-[#D97706]/10 text-[#D97706]"}`}>
                            {r.status}
                          </span>
                          <span className="text-[11px] text-[#6B7280]">★ {r.rating}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          </div>

          {/* Onboarding Pipeline + Department Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Onboarding Pipeline */}
            <div className="lg:col-span-3">
              <Card accentColor="primary">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-[#6B2E1F]/10 flex items-center justify-center">
                    <UserPlus className="w-4 h-4 text-[#6B2E1F]" />
                  </div>
                  <div>
                    <p className="text-[15px] font-semibold text-[#1A1A1A]">Onboarding Pipeline</p>
                    <p className="text-[12px] text-[#6B7280]">{mockOnboarding.length} active candidates</p>
                  </div>
                </div>

                {/* Kanban-style stage headers */}
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {(["Applied", "Interview", "Offer", "Joined"] as const).map((stage) => {
                    const count = mockOnboarding.filter((c) => c.stage === stage).length;
                    return (
                      <div key={stage} className="flex flex-col items-center gap-1">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider ${STAGE_COLORS[stage].bg} ${STAGE_COLORS[stage].text}`}>
                          {stage}
                        </span>
                        <span className="text-[11px] text-[#6B7280]">{count} candidates</span>
                        <div className="w-full h-0.5 rounded-full mt-0.5" style={{ backgroundColor: stage === "Applied" ? "#9CA3AF" : stage === "Interview" ? "#D97706" : stage === "Offer" ? "#6B2E1F" : "#16A34A" }} />
                      </div>
                    );
                  })}
                </div>

                {/* Candidate list */}
                <div className="space-y-2">
                  {mockOnboarding.map((c) => (
                    <div key={c.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-[#F5F5F5] hover:bg-[#EEEEEE] transition-colors duration-150">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#6B2E1F] flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold text-[10px]">{c.avatar}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[13px] font-semibold text-[#1A1A1A]">{c.name}</span>
                          <span className="text-[11px] text-[#6B7280]">{c.role}</span>
                        </div>
                      </div>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider ${STAGE_COLORS[c.stage].bg} ${STAGE_COLORS[c.stage].text}`}>
                        {c.stage}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Department Headcount Chart */}
            <div className="lg:col-span-2">
              <Card accentColor="none" className="h-full">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-[#F5F5F5] flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-[#6B7280]" />
                  </div>
                  <div>
                    <p className="text-[15px] font-semibold text-[#1A1A1A]">Dept. Headcount</p>
                    <p className="text-[12px] text-[#6B7280]">142 employees across {deptData.length} teams</p>
                  </div>
                </div>
                <BarChart data={deptData} />
                {/* Legend */}
                <div className="mt-4 grid grid-cols-2 gap-1.5">
                  {deptData.map((d) => (
                    <div key={d.name} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="text-[11px] text-[#6B7280] truncate">{d.name} ({d.count})</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
