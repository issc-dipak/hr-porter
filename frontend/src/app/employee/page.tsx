"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Home, Clock, Leaf, FileText, MessageSquare, HelpCircle,
  Network, CreditCard, Receipt, TrendingUp, Settings,
  User, CheckCircle, AlertCircle, Calendar, ChevronDown,
  Play, Square, Coffee, Bell, Star, Send, Loader2
} from "lucide-react";
import { Sidebar, SidebarItem } from "../components/popuptech/Sidebar";
import { Card } from "../components/popuptech/Card";

const SIDEBAR_ITEMS: SidebarItem[] = [
  { id: "overview", label: "Overview", icon: <Home className="w-4 h-4" /> },
  { id: "attendance", label: "Attendance Hub", icon: <Clock className="w-4 h-4" /> },
  { id: "leaves", label: "Leaves", icon: <Leaf className="w-4 h-4" /> },
  { id: "dsr", label: "Daily Status Reports", icon: <FileText className="w-4 h-4" /> },
  { id: "chat", label: "Workplace Chat", icon: <MessageSquare className="w-4 h-4" /> },
  { id: "helpdesk", label: "Help Desk", icon: <HelpCircle className="w-4 h-4" /> },
  { id: "orgchart", label: "Org Chart", icon: <Network className="w-4 h-4" /> },
  { id: "payroll", label: "Payroll & Slips", icon: <CreditCard className="w-4 h-4" /> },
  { id: "expenses", label: "Expenses & Claims", icon: <Receipt className="w-4 h-4" /> },
  { id: "performance", label: "Performance", icon: <TrendingUp className="w-4 h-4" /> },
  { id: "settings", label: "Settings", icon: <Settings className="w-4 h-4" /> },
];

const mockEmployee = {
  name: "Dipak Sharma",
  department: "Technology",
  designation: "Senior Software Engineer",
  netSalary: "₹1,24,500",
  leavesLeft: 12,
  performanceRating: 4.2,
  unreadAnnouncements: 3,
};

const mockHelpTickets = [
  { id: "HLT-1042", title: "Laptop fan making noise", status: "In Progress", priority: "Medium", updated: "2h ago" },
  { id: "HLT-1031", title: "Access to design tool required", status: "Resolved", priority: "Low", updated: "1d ago" },
  { id: "HLT-1019", title: "Email signature update", status: "Open", priority: "Low", updated: "3d ago" },
];

const mockActionItems = [
  { id: 1, type: "document", label: "Upload updated resume (required by HR)", urgent: true },
  { id: 2, type: "training", label: "Complete POSH Policy Training — due July 5", urgent: true },
  { id: 3, type: "document", label: "Submit Q2 appraisal self-assessment form", urgent: false },
  { id: 4, type: "training", label: "Cybersecurity awareness module (30 min)", urgent: false },
];

function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="text-[13px] font-mono text-[#6B7280]">
      {now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
    </span>
  );
}

function AttendanceWidget() {
  const [clockedIn, setClockedIn] = useState(false);
  const [onBreak, setOnBreak] = useState(false);
  const [clockInTime, setClockInTime] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [breakStart, setBreakStart] = useState<Date | null>(null);
  const [totalBreak, setTotalBreak] = useState(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (clockedIn && !onBreak && clockInTime) {
      interval = setInterval(() => {
        setElapsed(Math.floor((Date.now() - clockInTime.getTime()) / 1000) - totalBreak);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [clockedIn, onBreak, clockInTime, totalBreak]);

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const handleClockIn = () => {
    setClockInTime(new Date());
    setClockedIn(true);
    setElapsed(0);
  };

  const handleClockOut = () => {
    setClockedIn(false);
    setOnBreak(false);
    setClockInTime(null);
    setTotalBreak(0);
    setElapsed(0);
  };

  const handleBreak = () => {
    if (!onBreak) {
      setBreakStart(new Date());
      setOnBreak(true);
    } else {
      const added = breakStart ? Math.floor((Date.now() - breakStart.getTime()) / 1000) : 0;
      setTotalBreak((prev) => prev + added);
      setBreakStart(null);
      setOnBreak(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-[#6B7280]">
            Today, {new Date().toLocaleDateString("en-IN", { weekday: "long", month: "short", day: "numeric" })}
          </span>
          {clockedIn ? (
            <span className="text-2xl font-bold text-[#1A1A1A] font-mono mt-1">{formatTime(elapsed)}</span>
          ) : (
            <span className="text-2xl font-bold text-[#1A1A1A] mt-1">Not Clocked In</span>
          )}
        </div>
        <LiveClock />
      </div>

      <div className="flex gap-2 flex-wrap">
        {!clockedIn ? (
          <button
            onClick={handleClockIn}
            className="flex items-center gap-2 px-4 py-2 bg-[#16A34A] text-white text-[13px] font-semibold rounded-lg hover:bg-[#15803d] transition-colors duration-150"
          >
            <Play className="w-3.5 h-3.5" /> Clock In
          </button>
        ) : (
          <>
            <button
              onClick={handleBreak}
              className={`flex items-center gap-2 px-4 py-2 text-[13px] font-semibold rounded-lg transition-colors duration-150 ${
                onBreak
                  ? "bg-[#D97706] text-white hover:bg-[#b45309]"
                  : "bg-[#F5F5F5] text-[#D97706] border border-[#D97706]/30 hover:bg-[#D97706]/10"
              }`}
            >
              <Coffee className="w-3.5 h-3.5" />
              {onBreak ? "Resume Work" : "Take Break"}
            </button>
            <button
              onClick={handleClockOut}
              className="flex items-center gap-2 px-4 py-2 bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/20 text-[13px] font-semibold rounded-lg hover:bg-[#DC2626]/20 transition-colors duration-150"
            >
              <Square className="w-3.5 h-3.5" /> Clock Out
            </button>
          </>
        )}
      </div>

      {clockedIn && (
        <div className="flex gap-4 mt-1 text-[12px] text-[#6B7280]">
          <span>Break: <strong className="text-[#D97706]">{formatTime(totalBreak)}</strong></span>
          <span>Status: <strong className={onBreak ? "text-[#D97706]" : "text-[#16A34A]"}>{onBreak ? "On Break" : "Active"}</strong></span>
        </div>
      )}
    </div>
  );
}

function DSRForm() {
  const [form, setForm] = useState({
    yesterday: "",
    today: "",
    blockers: "",
    status: "On Track",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.yesterday.trim() || !form.today.trim()) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1200);
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-center">
        <CheckCircle className="w-8 h-8 text-[#16A34A]" />
        <p className="text-[14px] font-semibold text-[#1A1A1A]">Daily update submitted!</p>
        <p className="text-[13px] text-[#6B7280]">Your status report has been saved successfully.</p>
        <button
          onClick={() => setSubmitted(false)}
          className="mt-2 text-[12px] text-[#6B2E1F] hover:underline"
        >
          Submit another update
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-semibold uppercase tracking-widest text-[#6B7280]">
          Yesterday's Accomplishments <span className="text-[#DC2626]">*</span>
        </label>
        <textarea
          rows={2}
          placeholder="What did you complete yesterday?"
          value={form.yesterday}
          onChange={(e) => setForm({ ...form, yesterday: e.target.value })}
          className="w-full px-3 py-2 text-[13px] border border-[#E5E5E5] rounded-lg resize-none focus:outline-none focus:border-[#6B2E1F]/40 focus:ring-1 focus:ring-[#6B2E1F]/20 transition-all duration-150 placeholder:text-[#C4C4C4] text-[#1A1A1A]"
          required
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-semibold uppercase tracking-widest text-[#6B7280]">
          Today's Target <span className="text-[#DC2626]">*</span>
        </label>
        <textarea
          rows={2}
          placeholder="What are you planning to work on today?"
          value={form.today}
          onChange={(e) => setForm({ ...form, today: e.target.value })}
          className="w-full px-3 py-2 text-[13px] border border-[#E5E5E5] rounded-lg resize-none focus:outline-none focus:border-[#6B2E1F]/40 focus:ring-1 focus:ring-[#6B2E1F]/20 transition-all duration-150 placeholder:text-[#C4C4C4] text-[#1A1A1A]"
          required
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-semibold uppercase tracking-widest text-[#6B7280]">
          Blockers <span className="text-[#C4C4C4] normal-case font-normal not-italic">(Optional)</span>
        </label>
        <textarea
          rows={1}
          placeholder="Any blockers or dependencies?"
          value={form.blockers}
          onChange={(e) => setForm({ ...form, blockers: e.target.value })}
          className="w-full px-3 py-2 text-[13px] border border-[#E5E5E5] rounded-lg resize-none focus:outline-none focus:border-[#6B2E1F]/40 focus:ring-1 focus:ring-[#6B2E1F]/20 transition-all duration-150 placeholder:text-[#C4C4C4] text-[#1A1A1A]"
        />
      </div>
      <div className="flex items-end gap-3">
        <div className="flex flex-col gap-1 flex-1">
          <label className="text-[11px] font-semibold uppercase tracking-widest text-[#6B7280]">Status</label>
          <div className="relative">
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full appearance-none px-3 py-2 pr-8 text-[13px] border border-[#E5E5E5] rounded-lg focus:outline-none focus:border-[#6B2E1F]/40 bg-white text-[#1A1A1A]"
            >
              <option value="On Track">🟢 On Track</option>
              <option value="At Risk">🟡 At Risk</option>
              <option value="Blocked">🔴 Blocked</option>
              <option value="Completed">✅ Completed</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280] pointer-events-none" />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2 bg-[#6B2E1F] text-white text-[13px] font-semibold rounded-lg hover:bg-[#5a2519] transition-colors duration-150 disabled:opacity-70"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          {loading ? "Submitting..." : "Submit"}
        </button>
      </div>
    </form>
  );
}

function TicketStatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string }> = {
    "Open": { bg: "bg-[#D97706]/10", text: "text-[#D97706]" },
    "In Progress": { bg: "bg-[#6B2E1F]/10", text: "text-[#6B2E1F]" },
    "Resolved": { bg: "bg-[#16A34A]/10", text: "text-[#16A34A]" },
    "Closed": { bg: "bg-[#6B7280]/10", text: "text-[#6B7280]" },
  };
  const style = map[status] || map["Open"];
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${style.bg} ${style.text}`}>
      {status}
    </span>
  );
}

export default function EmployeePanelPage() {
  const [activePage, setActivePage] = useState("overview");
  const router = useRouter();

  const handleRoleSwitch = (role: "Employee" | "HR" | "Admin") => {
    if (role === "HR") router.push("/hr");
    if (role === "Admin") router.push("/admin2");
  };

  return (
    <div className="flex h-screen bg-[#F5F5F5] font-[system-ui,Inter,sans-serif] text-[#1A1A1A]">
      <Sidebar
        items={SIDEBAR_ITEMS}
        activeItem={activePage}
        onItemClick={setActivePage}
        panelName="Employee Panel"
        role="Employee"
        userName={mockEmployee.name}
        userDept={mockEmployee.department}
        onRoleSwitch={handleRoleSwitch}
      />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">

          {/* Welcome Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-[#6B7280]">
                {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </span>
              <h1 className="text-2xl font-bold text-[#1A1A1A]">
                Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, Dipak 👋
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#6B2E1F]/10 text-[#6B2E1F] text-[12px] font-semibold">
                  <User className="w-3 h-3" /> {mockEmployee.department}
                </span>
                <span className="text-[12px] text-[#6B7280]">{mockEmployee.designation}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {mockEmployee.unreadAnnouncements > 0 && (
                <div className="relative">
                  <button className="w-9 h-9 rounded-lg bg-white border border-[#E5E5E5] flex items-center justify-center hover:bg-[#F5F5F5] transition-colors shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
                    <Bell className="w-4 h-4 text-[#6B7280]" />
                  </button>
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#DC2626] rounded-full flex items-center justify-center text-[9px] font-bold text-white">
                    {mockEmployee.unreadAnnouncements}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Priority Stats Row (Attendance + Net Salary larger) */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Attendance — spans 3 cols */}
            <div className="lg:col-span-3">
              <Card
                accentColor="primary"
                className="h-full"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-[#6B2E1F]/10 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-[#6B2E1F]" />
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-[#6B7280]">Attendance Today</span>
                </div>
                <AttendanceWidget />
              </Card>
            </div>

            {/* Net Salary — spans 2 cols */}
            <div className="lg:col-span-2">
              <Card
                accentColor="success"
                className="h-full"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-[#16A34A]/10 flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-[#16A34A]" />
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-[#6B7280]">Net Salary</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[32px] font-bold text-[#1A1A1A] leading-none">{mockEmployee.netSalary}</span>
                  <span className="text-[13px] text-[#6B7280]">Per month · June 2026</span>
                  <div className="mt-3 flex gap-3 text-[12px]">
                    <div className="flex flex-col">
                      <span className="text-[#6B7280]">Basic</span>
                      <span className="font-semibold text-[#1A1A1A]">₹72,000</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[#6B7280]">HRA</span>
                      <span className="font-semibold text-[#1A1A1A]">₹28,800</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[#6B7280]">Deductions</span>
                      <span className="font-semibold text-[#DC2626]">-₹18,300</span>
                    </div>
                  </div>
                  <button className="mt-3 text-[12px] font-semibold text-[#6B2E1F] hover:underline text-left transition-all duration-150">
                    View payslip →
                  </button>
                </div>
              </Card>
            </div>
          </div>

          {/* Secondary Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card
              title="Leaves Left"
              value={mockEmployee.leavesLeft}
              subtext="6 earned · 4 casual · 2 sick"
              accentColor="warning"
              icon={<Leaf className="w-5 h-5" />}
            />
            <Card
              title="Performance Rating"
              accentColor="success"
              icon={<Star className="w-5 h-5" />}
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-[#1A1A1A]">{mockEmployee.performanceRating}</span>
                  <span className="text-[13px] text-[#6B7280]">/ 5.0</span>
                </div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span
                      key={s}
                      className={`text-[14px] ${s <= Math.round(mockEmployee.performanceRating) ? "text-[#D97706]" : "text-[#E5E5E5]"}`}
                    >★</span>
                  ))}
                </div>
                <span className="text-[12px] text-[#6B7280]">Q2 2026 · Mid-year review</span>
              </div>
            </Card>
            <Card
              title="Announcements"
              value={mockEmployee.unreadAnnouncements}
              subtext="Unread company-wide messages"
              accentColor="error"
              icon={<Bell className="w-5 h-5" />}
            />
          </div>

          {/* Bottom section: DSR + Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Daily Work Update Form */}
            <div className="lg:col-span-3">
              <Card accentColor="primary" className="h-full">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-[#6B2E1F]/10 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-[#6B2E1F]" />
                  </div>
                  <div>
                    <p className="text-[15px] font-semibold text-[#1A1A1A]">My Daily Work Update</p>
                    <p className="text-[12px] text-[#6B7280]">Submit your DSR for today</p>
                  </div>
                </div>
                <DSRForm />
              </Card>
            </div>

            {/* Right column: Action Items + Help Desk */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              {/* Pending Action Items */}
              <Card accentColor="warning">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-[#D97706]/10 flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 text-[#D97706]" />
                  </div>
                  <div>
                    <p className="text-[15px] font-semibold text-[#1A1A1A]">Pending Action Items</p>
                    <p className="text-[12px] text-[#6B7280]">{mockActionItems.length} items need attention</p>
                  </div>
                </div>
                {mockActionItems.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-4 text-center">
                    <CheckCircle className="w-8 h-8 text-[#16A34A]" />
                    <p className="text-[13px] text-[#6B7280]">All clear! No pending items.</p>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {mockActionItems.map((item) => (
                      <li key={item.id} className="flex items-start gap-2.5 text-[13px]">
                        <span className={`mt-0.5 flex-shrink-0 ${item.urgent ? "text-[#DC2626]" : "text-[#D97706]"}`}>
                          {item.urgent ? <AlertCircle className="w-3.5 h-3.5" /> : <Calendar className="w-3.5 h-3.5" />}
                        </span>
                        <span className={`text-[13px] leading-snug ${item.urgent ? "text-[#1A1A1A] font-medium" : "text-[#4B5563]"}`}>
                          {item.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

              {/* Help Desk Tickets */}
              <Card accentColor="none">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#F5F5F5] flex items-center justify-center">
                      <HelpCircle className="w-4 h-4 text-[#6B7280]" />
                    </div>
                    <p className="text-[15px] font-semibold text-[#1A1A1A]">Help Desk</p>
                  </div>
                  <button className="text-[12px] font-semibold text-[#6B2E1F] hover:underline">+ New</button>
                </div>
                {mockHelpTickets.length === 0 ? (
                  <p className="text-[13px] text-[#6B7280] text-center py-3">No tickets raised yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {mockHelpTickets.map((t) => (
                      <li key={t.id} className="flex items-center justify-between gap-2 py-2 border-b border-[#F0F0F0] last:border-0">
                        <div className="flex flex-col min-w-0">
                          <span className="text-[12px] text-[#6B7280] font-mono">{t.id}</span>
                          <span className="text-[13px] font-medium text-[#1A1A1A] leading-tight truncate">{t.title}</span>
                          <span className="text-[11px] text-[#9CA3AF]">{t.updated}</span>
                        </div>
                        <TicketStatusBadge status={t.status} />
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
