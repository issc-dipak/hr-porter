"use client";

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Sparkles, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

export default function HrAiAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Hi there! I am your HR AI Assistant. How can I help you manage your workspace today?',
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

  const fetchDashboardData = async () => {
    const token = localStorage.getItem('hr_system_token');
    const res = await fetch('/api/employee/dashboard', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch data');
    return res.json();
  };

  const handleAction = async (action: string) => {
    // Add user message
    const userMsg: Message = {
      id: Math.random().toString(),
      sender: 'user',
      text: action,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const data = await fetchDashboardData();
      let reply = "";

      if (action.toLowerCase().includes('leave')) {
        const remaining = data.profile?.remainingLeaves ?? 22;
        reply = `You have ${remaining} days of remaining leaves for this year. This includes Casual, Sick, and Earned leaves. You can request leaves from the Leave tab!`;
      } else if (action.toLowerCase().includes('payslip') || action.toLowerCase().includes('payroll')) {
        const salary = data.payroll?.currentSalary ?? 38400;
        reply = `Your current net monthly salary is ₹${salary.toLocaleString()}. The next payroll cycle is scheduled for ${data.payroll?.nextPayrollDate ?? 'the end of this month'}.`;
      } else if (action.toLowerCase().includes('attendance')) {
        const checkIn = data.attendance?.today?.checkIn || 'Not Checked In yet';
        const workingHours = data.attendance?.today?.duration || '0h 00m';
        reply = `Today's Attendance status: Check-In: ${checkIn}. Active working hours: ${workingHours}. Make sure to clock out when wrapping up today!`;
      } else if (action.toLowerCase().includes('ticket')) {
        const count = data.tickets?.openCount ?? 0;
        reply = `You currently have ${count} open support tickets. You can create a new support ticket in the Help Desk section on the dashboard.`;
      } else if (action.toLowerCase().includes('holiday')) {
        const holidays = data.events?.filter((e: any) => e.type === 'Holiday') || [];
        const holList = holidays.map((h: any) => `${h.name} (${new Date(h.date).toLocaleDateString()})`).join(', ');
        reply = holidays.length > 0 
          ? `Upcoming holidays: ${holList}.` 
          : "There are no company holidays registered in the immediate future.";
      } else {
        reply = "I understand! I can help you retrieve your leave balance, download payslips, check active attendance, raise support tickets, and view corporate holidays. Select one of the quick options or ask a specific question.";
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
        text: 'Sorry, I encountered an issue fetching your HR profile details. Please try again.',
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

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-750 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 hover:scale-105 active:scale-95 transition-all z-[400] cursor-pointer border-none"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </button>

      {/* Chat window panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-[360px] h-[500px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden z-[400]"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider leading-none">HR AI Assistant</h4>
                  <span className="text-[9px] text-blue-100/80 font-bold uppercase tracking-wider">Online • Real-time Sync</span>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white bg-transparent border-none cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 no-scrollbar bg-slate-50/50 dark:bg-slate-950/20">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`p-3 rounded-2xl text-[11px] leading-relaxed max-w-[85%] ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-150/45 dark:border-slate-750/30'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-bl-none border border-slate-150/45 dark:border-slate-750/30 flex gap-1">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick action buttons */}
            <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-150/45 dark:border-slate-800/60 flex flex-wrap gap-1.5">
              <button
                onClick={() => handleAction('Show My Leave Balance')}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-650 dark:text-slate-300 rounded-lg text-[9px] font-bold uppercase tracking-wider border border-slate-200/50 dark:border-slate-700/60 cursor-pointer"
              >
                Leave Balance
              </button>
              <button
                onClick={() => handleAction('Download Payslip')}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-650 dark:text-slate-300 rounded-lg text-[9px] font-bold uppercase tracking-wider border border-slate-200/50 dark:border-slate-700/60 cursor-pointer"
              >
                Salary Snapshot
              </button>
              <button
                onClick={() => handleAction('Check Attendance')}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-650 dark:text-slate-300 rounded-lg text-[9px] font-bold uppercase tracking-wider border border-slate-200/50 dark:border-slate-700/60 cursor-pointer"
              >
                Attendance Status
              </button>
              <button
                onClick={() => handleAction('Raise Ticket')}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-650 dark:text-slate-300 rounded-lg text-[9px] font-bold uppercase tracking-wider border border-slate-200/50 dark:border-slate-700/60 cursor-pointer"
              >
                Support Tickets
              </button>
              <button
                onClick={() => handleAction('View Holidays')}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-650 dark:text-slate-300 rounded-lg text-[9px] font-bold uppercase tracking-wider border border-slate-200/50 dark:border-slate-700/60 cursor-pointer"
              >
                Holidays List
              </button>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="p-3 bg-white dark:bg-slate-900 border-t border-slate-150/45 dark:border-slate-800/60 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask your AI assistant..."
                className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800/50 text-[11px] rounded-xl border border-slate-200/50 dark:border-slate-700/60 focus:outline-none focus:border-blue-500 text-slate-800 dark:text-white"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="w-9 h-9 bg-blue-650 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center disabled:opacity-50 transition-all cursor-pointer border-none"
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
