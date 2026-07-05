"use client";

import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, Bot, Sparkles, Send, X, 
  HelpCircle, ShieldCheck, UserCheck, Trash2, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";
import { useAuthStore } from '@/store/authStore';

interface Message {
  role: 'user' | 'model';
  text: string;
}

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { token, userRole, profile } = useAuthStore();
  const userName = profile?.name || 'User';

  // Starter prompts based on Role
  const adminSuggestions = [
    "Configure auto SLA tracking",
    "Show audit log details guidelines",
    "Explain system rules parameters"
  ];

  const hrSuggestions = [
    "Draft policy update announcement",
    "Filter candidate profiles guide",
    "Check leave approval workflow"
  ];

  const employeeSuggestions = [
    "How to apply for leave?",
    "Check support ticket status",
    "What are referral benefits?"
  ];

  const getSuggestions = () => {
    if (userRole === 'Admin') return adminSuggestions;
    if (userRole === 'HR') return hrSuggestions;
    return employeeSuggestions;
  };

  const getRoleBranding = () => {
    if (userRole === 'Admin') {
      return {
        title: "Admin Assistant",
        tag: "System Admin Bot",
        themeColor: "from-indigo-600 to-purple-600",
        borderClass: "border-indigo-500/30",
        bgLight: "bg-indigo-500/10",
        textClass: "text-indigo-400",
        badgeBg: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
        glowColor: "rgba(99, 102, 241, 0.15)",
        icon: ShieldCheck,
        welcomeMessage: `Hello Administrator ${userName}! I am Admin-Bot. I can help guide you through platform settings, rule parameters (Auto SLA, AI ticketing), audit trail configurations, and system-wide guidelines. How can I help you manage the system today?`
      };
    }
    if (userRole === 'HR') {
      return {
        title: "HR Operations Bot",
        tag: "Talent & Staff Bot",
        themeColor: "from-emerald-600 to-teal-600",
        borderClass: "border-emerald-500/30",
        bgLight: "bg-emerald-500/10",
        textClass: "text-emerald-400",
        badgeBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        glowColor: "rgba(16, 185, 129, 0.15)",
        icon: UserCheck,
        welcomeMessage: `Hello HR Manager ${userName}! I am HR-Bot. I can assist you with candidate evaluation guidelines, summaries of employee leaves, recruitment workflows, or drafting announcement notices. How can I support your operations today?`
      };
    }
    return {
      title: "Employee Help Bot",
      tag: "Self-Service Help",
      themeColor: "from-blue-600 to-sky-600",
      borderClass: "border-blue-500/30",
      bgLight: "bg-blue-500/10",
      textClass: "text-blue-400",
      badgeBg: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      glowColor: "rgba(59, 130, 246, 0.15)",
      icon: HelpCircle,
      welcomeMessage: `Hello ${userName}! I am Employee-Bot. I can help you check general leave guidelines, office holiday calendars, guide you on how to submit leave requests, or raise helpdesk tickets. What can I help you with today?`
    };
  };

  const branding = getRoleBranding();

  // Populate first message if chat is empty
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          role: 'model',
          text: branding.welcomeMessage
        }
      ]);
    }
  }, [userRole, messages.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const getApiUrl = () => {
    if (process.env.NEXT_PUBLIC_BACKEND_URL) return process.env.NEXT_PUBLIC_BACKEND_URL;
    if (typeof window === 'undefined') return 'http://localhost:5000';
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') return 'http://localhost:5000';
    return `${window.location.protocol}//${hostname}:5000`;
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', text };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Map history excluding the last message we just added
      const historyPayload = messages.map(m => ({
        role: m.role,
        text: m.text
      }));

      const res = await fetch(`${getApiUrl()}/api/chatbot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || localStorage.getItem('hr_system_token') || ''}`
        },
        body: JSON.stringify({
          message: text,
          history: historyPayload
        })
      });

      if (!res.ok) {
        throw new Error(`Chatbot API returned status ${res.status}`);
      }

      const data = await res.json();
      setMessages(prev => [...prev, { role: 'model', text: data.response || 'No response returned.' }]);
    } catch (error) {
      console.error('Failed to get bot response:', error);
      setMessages(prev => [...prev, { role: 'model', text: 'Sorry, I am facing connectivity issues. Please try again in a moment.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: 'model',
        text: branding.welcomeMessage
      }
    ]);
  };

  const IconComponent = branding.icon;

  return (
    <>
      {/* Floating Toggle Button */}
      <div className="fixed bottom-6 right-6 z-[999]">
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            "w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-white cursor-pointer relative border",
            "bg-gradient-to-tr", branding.themeColor,
            "border-white/10"
          )}
          style={{
            boxShadow: `0 8px 30px ${branding.glowColor}`
          }}
        >
          {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
          
          {/* Subtle Pulse Rings */}
          <span className={cn("absolute inset-0 rounded-full bg-white/10 animate-ping -z-10", isOpen && "hidden")} />
        </motion.button>
      </div>

      {/* Slide-out Drawer Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 280 }}
            className={cn(
              "fixed bottom-20 sm:bottom-24 right-4 sm:right-6 w-[calc(100vw-32px)] sm:w-[400px] h-[520px] max-h-[calc(100vh-110px)] sm:max-h-[calc(100vh-130px)] rounded-[2rem] border shadow-2xl z-[999] overflow-hidden flex flex-col font-sans",
              "bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl",
              branding.borderClass
            )}
            style={{
              boxShadow: `0 20px 50px rgba(0,0,0,0.1), 0 0 40px ${branding.glowColor}`
            }}
          >
            {/* Header */}
            <div className={cn("p-5 flex items-center justify-between border-b relative overflow-hidden bg-gradient-to-r text-white", branding.themeColor)}>
              {/* Header Ambient Glow */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
              
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                  <IconComponent className="w-5.5 h-5.5 text-white" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider">{branding.title}</h3>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-white/10 text-white text-[8px] font-bold uppercase tracking-widest mt-1">
                    {branding.tag}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 relative z-10">
                <button
                  onClick={clearChat}
                  title="Clear Chat History"
                  className="p-1.5 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition-colors cursor-pointer border-none bg-transparent"
                >
                  <Trash2 className="w-4.5 h-4.5" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition-colors cursor-pointer border-none bg-transparent"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>

            {/* Conversation Flow */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4 no-scrollbar">
              {messages.map((msg, index) => {
                const isModel = msg.role === 'model';
                return (
                  <div
                    key={index}
                    className={cn(
                      "flex gap-2 max-w-[85%] items-start",
                      isModel ? "mr-auto" : "ml-auto flex-row-reverse"
                    )}
                  >
                    {isModel ? (
                      <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 bg-gradient-to-tr", branding.themeColor)}>
                        <Bot className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-black text-slate-600 dark:text-slate-300">
                          {userName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}

                    <div
                      className={cn(
                        "p-3.5 rounded-[1.25rem] text-xs leading-relaxed border shadow-sm",
                        isModel 
                          ? "bg-white/80 dark:bg-slate-900/60 border-slate-200/40 dark:border-slate-800/80 text-slate-800 dark:text-slate-100 rounded-tl-sm"
                          : "bg-blue-600 text-white border-blue-500 rounded-tr-sm"
                      )}
                    >
                      <p className="whitespace-pre-line font-medium">{msg.text}</p>
                    </div>
                  </div>
                );
              })}

              {/* Starter Suggestions inside Conversation Flow */}
              {messages.length === 1 && !isLoading && (
                <div className="pt-2 pl-9 space-y-2 max-w-[85%]">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Suggested Prompts</p>
                  <div className="flex flex-col gap-1.5">
                    {getSuggestions().map((sugg, i) => (
                      <button
                        key={i}
                        onClick={() => handleSendMessage(sugg)}
                        className={cn(
                          "w-full text-left p-2.5 rounded-xl border text-[11px] font-bold transition-all flex items-center justify-between group cursor-pointer bg-white/50 hover:bg-white dark:bg-slate-900/30 dark:hover:bg-slate-900/80 border-slate-200/50 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                        )}
                      >
                        <span>{sugg}</span>
                        <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-blue-500" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Loader Typing State */}
              {isLoading && (
                <div className="flex gap-2 max-w-[85%] items-start mr-auto">
                  <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 bg-gradient-to-tr", branding.themeColor)}>
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-white/80 dark:bg-slate-900/60 border border-slate-200/40 dark:border-slate-800/80 p-3.5 rounded-[1.25rem] rounded-tl-sm shadow-sm flex items-center gap-1.5 min-w-[60px]">
                    <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" />
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input bar */}
            <div className="p-4 border-t border-slate-200/40 dark:border-slate-800/40 flex items-center gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendMessage(inputValue);
                }}
                disabled={isLoading}
                placeholder="Ask anything..."
                className={cn(
                  "flex-1 h-11 bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 px-4 rounded-xl text-xs outline-none transition-all text-slate-800 dark:text-white",
                  "focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900"
                )}
              />
              <button
                onClick={() => handleSendMessage(inputValue)}
                disabled={!inputValue.trim() || isLoading}
                className={cn(
                  "w-11 h-11 rounded-xl flex items-center justify-center border-none text-white transition-all shadow-md shadow-blue-500/10 cursor-pointer active:scale-95",
                  inputValue.trim() ? "bg-blue-600 hover:bg-blue-500" : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 shadow-none cursor-default"
                )}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
