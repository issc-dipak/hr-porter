"use client";
import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

interface HrAdminAiAssistantProps {
  onCommandExecuted?: (command: string) => void;
}

export default function HrAdminAiAssistant({ onCommandExecuted }: HrAdminAiAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Hello, HR Commander. I am your Admin Copilot. Select a command below or ask me any question about workforce, attendance, recruitment, or payroll.',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const fetchCommandData = async () => {
    const token = localStorage.getItem('hr_system_token');
    const res = await fetch('/api/hr/dashboard', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch command center metrics');
    return res.json();
  };

  const handleAction = async (action: string) => {
    const userMsg: Message = {
      id: Math.random().toString(),
      sender: 'user',
      text: action,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    // Trigger parent callback to automatically switch tabs if applicable
    if (onCommandExecuted) {
      onCommandExecuted(action);
    }

    try {
      const data = await fetchCommandData();
      let reply = "";

      const queryLower = action.toLowerCase();
      
      if (queryLower.includes('attendance summary')) {
        const present = data.kpis?.attendanceOverview?.present ?? 0;
        const absent = data.kpis?.attendanceOverview?.absent ?? 0;
        const wfh = data.kpis?.attendanceOverview?.wfh ?? 0;
        const late = data.kpis?.attendanceOverview?.late ?? 0;
        reply = `Today's Attendance Overview:\n• Present: ${present}\n• Absent: ${absent}\n• WFH: ${wfh}\n• Late Arrivals: ${late}\n\nAttendance Rate is sitting at ${data.companyHealth?.attendance ?? 95}%. I've switched your dashboard view to the Overview tab.`;
      } 
      else if (queryLower.includes('payroll report') || queryLower.includes('payroll summary')) {
        const total = data.kpis?.monthlyPayroll?.totalCost ?? 0;
        const pf = data.kpis?.monthlyPayroll?.pfContribution ?? 0;
        const tax = data.kpis?.monthlyPayroll?.taxDeductions ?? 0;
        reply = `Monthly Payroll Report:\n• Total Cost: ₹${total.toLocaleString('en-IN')}\n• PF Contribution: ₹${pf.toLocaleString('en-IN')}\n• Tax Deductions: ₹${tax.toLocaleString('en-IN')}\n• Upcoming Payroll Processing: ${data.kpis?.monthlyPayroll?.upcomingDate || '2026-06-30'}\n\nI've navigated you to the Payroll tab for full breakdown.`;
      } 
      else if (queryLower.includes('inactive employees')) {
        const count = data.kpis?.totalEmployees?.inactive ?? 0;
        reply = `There are currently ${count} inactive, suspended, or resigned employees on the platform. You can manage their records in the Workforce tab.`;
      } 
      else if (queryLower.includes('pending approvals')) {
        const leavesCount = data.actionCenter?.pendingLeaves?.length ?? 0;
        const docsCount = data.actionCenter?.pendingDocuments?.length ?? 0;
        const ticketCount = data.actionCenter?.pendingEscalations?.length ?? 0;
        const onboardingCount = data.actionCenter?.pendingOnboarding?.length ?? 0;
        reply = `Priority Action Approvals:\n• Pending Leaves: ${leavesCount}\n• Pending Document Verifications: ${docsCount}\n• Pending Onboarding Checks: ${onboardingCount}\n• Pending Escalations: ${ticketCount}\n\nPlease check the HR Action Center on the Overview tab to review them.`;
      } 
      else if (queryLower.includes('hiring analytics')) {
        const jobs = data.kpis?.openRecruitments?.activeJobs ?? 0;
        const apps = data.kpis?.openRecruitments?.applicationsReceived ?? 0;
        const funnel = data.kpis?.recruitments?.funnel || {};
        reply = `Hiring & Recruitment Analytics:\n• Active Jobs: ${jobs}\n• Applications Received: ${apps}\n• Funnel Stages:\n  - Sourced: ${funnel.sourced ?? 0}\n  - Interviewing: ${funnel.interview ?? 0}\n  - Offers Out: ${funnel.offer ?? 0}\n  - Candidates Hired: ${funnel.hired ?? 0}\n\nI've opened the Recruitment tab for sourcing channel progress charts.`;
      } 
      else if (queryLower.includes('company growth')) {
        const growth = data.companyHealth?.employeeGrowth ?? 0;
        const hiring = data.companyHealth?.hiringGrowth ?? 0;
        reply = `Company Growth Insights:\n• Employee Growth rate: +${growth}%\n• Hiring Growth rate: +${hiring}%\n• Active Headcount: ${data.kpis?.totalEmployees?.active ?? 0}\n• New Joiners (this month): ${data.kpis?.totalEmployees?.newJoiners ?? 0}`;
      } 
      else if (queryLower.includes('executive summary')) {
        const details = data.companyDetails || {};
        reply = `Executive Summary for ${details.companyName || 'HCP Index Labs'}:\n• Total Employees: ${data.kpis?.totalEmployees?.count ?? 0} (${data.kpis?.totalEmployees?.active ?? 0} Active)\n• HR Managers: ${data.kpis?.totalHrManagers?.count ?? 0}\n• Today's Attendance Rate: ${data.companyHealth?.attendance ?? 96}%\n• Open Support Tickets: ${data.kpis?.openTickets?.open ?? 0}\n• Monthly Payroll cost: ₹${(data.kpis?.monthlyPayroll?.totalCost || 0).toLocaleString('en-IN')}\n• Subscription Plan: ${details.subscriptionPlan}\n• Cloud Storage: ${details.storageUsage}`;
      } 
      else if (queryLower.includes('department performance')) {
        const health = data.departmentHealth || [];
        const breakdown = health.map((d: any) => `${d.department}: ${d.performanceScore}/100 rating (${d.attendanceRate}% Attendance)`).join('\n• ');
        reply = `Department Performance breakdown:\n• ${breakdown}\n\nReview this in detail under the Workforce and Overview tabs.`;
      } 
      else {
        reply = "I've logged your query. Let me know if you would like me to switch tabs or run analytical summaries regarding payroll, attendance, or security audits.";
      }

      setMessages(prev => [...prev, {
        id: Math.random().toString(),
        sender: 'ai',
        text: reply,
        timestamp: new Date()
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Math.random().toString(),
        sender: 'ai',
        text: 'Sorry, I had trouble connecting to the HR database. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const text = input;
    setInput('');
    handleAction(text);
  };

  const suggestedCommands = [
    { label: "Attendance Summary", cmd: "Show attendance summary" },
    { label: "Payroll Report", cmd: "Generate payroll report" },
    { label: "Inactive Employees", cmd: "Show inactive employees" },
    { label: "Pending Approvals", cmd: "Show pending approvals" },
    { label: "Hiring Analytics", cmd: "Show hiring analytics" },
    { label: "Company Growth", cmd: "Show company growth" },
    { label: "Executive Summary", cmd: "Generate executive summary" },
    { label: "Department Performance", cmd: "Show department performance" }
  ];

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all z-[400] cursor-pointer border-none"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-[360px] h-[500px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden z-[400]"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-4 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-350 animate-pulse" />
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider leading-none">Admin Copilot AI</h4>
                  <span className="text-[9px] text-emerald-100/80 font-bold uppercase tracking-wider">Company Command Desk</span>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white bg-transparent border-none cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Message Feed */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 no-scrollbar bg-slate-50/50 dark:bg-slate-950/20">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`p-3 rounded-2xl text-[11px] leading-relaxed max-w-[85%] whitespace-pre-line ${
                    msg.sender === 'user'
                      ? 'bg-emerald-600 text-white rounded-br-none'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-150/45 dark:border-slate-750/30 shadow-sm'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-bl-none border border-slate-150/45 dark:border-slate-750/30 flex gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Suggested Queries */}
            <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-150/45 dark:border-slate-800/60 flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto">
              {suggestedCommands.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAction(item.cmd)}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-650 dark:text-slate-300 rounded-lg text-[9px] font-bold uppercase tracking-wider border border-slate-200/50 dark:border-slate-700/60 cursor-pointer transition-all duration-150 hover:border-emerald-500/30"
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Input form */}
            <form onSubmit={handleSubmit} className="p-3 bg-white dark:bg-slate-900 border-t border-slate-150/45 dark:border-slate-800/60 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Type a command or ask a question..."
                className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800/50 text-[11px] rounded-xl border border-slate-200/50 dark:border-slate-700/60 focus:outline-none focus:border-emerald-500 text-slate-800 dark:text-white"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="w-9 h-9 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center justify-center disabled:opacity-50 transition-all cursor-pointer border-none"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
