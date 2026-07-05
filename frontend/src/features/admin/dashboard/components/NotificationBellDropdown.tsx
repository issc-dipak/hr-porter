"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, FileText, DollarSign, HelpCircle, Megaphone, 
  CheckSquare, ArrowRight, CheckCheck, RefreshCw, MessageSquare,
  Receipt, ListTodo, BookOpen, UserPlus
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { useSystemNotificationStore } from '@/store/useSystemNotificationStore';
import { useChatStore } from '@/store/chatStore';
import { motion, AnimatePresence } from 'framer-motion';

const typeConfig: Record<string, { icon: any; color: string }> = {
  leave:          { icon: FileText,       color: 'text-blue-500 bg-blue-500/10 dark:bg-blue-500/5 border-blue-500/20' },
  payroll:        { icon: DollarSign,     color: 'text-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/5 border-emerald-500/20' },
  ticket:         { icon: HelpCircle,     color: 'text-amber-500 bg-amber-500/10 dark:bg-amber-500/5 border-amber-500/20' },
  announcement:   { icon: Megaphone,      color: 'text-purple-500 bg-purple-500/10 dark:bg-purple-500/5 border-purple-500/20' },
  'daily-update': { icon: CheckSquare,    color: 'text-rose-500 bg-rose-500/10 dark:bg-rose-500/5 border-rose-500/20' },
  message:        { icon: MessageSquare,  color: 'text-indigo-500 bg-indigo-500/10 dark:bg-indigo-500/5 border-indigo-500/20' },
  expense:        { icon: Receipt,        color: 'text-orange-500 bg-orange-500/10 dark:bg-orange-500/5 border-orange-500/20' },
  task:           { icon: ListTodo,       color: 'text-teal-500 bg-teal-500/10 dark:bg-teal-500/5 border-teal-500/20' },
  policy:         { icon: BookOpen,       color: 'text-violet-500 bg-violet-500/10 dark:bg-violet-500/5 border-violet-500/20' },
  recruitment:    { icon: UserPlus,       color: 'text-cyan-500 bg-cyan-500/10 dark:bg-cyan-500/5 border-cyan-500/20' },
  other:          { icon: Bell,           color: 'text-slate-500 bg-slate-500/10 dark:bg-slate-500/5 border-slate-500/20' }
};

interface NotificationBellDropdownProps {
  onNavigate: (page: string) => void;
  align?: 'left' | 'right';
  triggerClassName?: string;
}

export function NotificationBellDropdown({ onNavigate, align = 'right', triggerClassName }: NotificationBellDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // System Notifications
  const { 
    notifications: systemNotifications, 
    markRead: markSystemRead, 
    markAllRead: markAllSystemRead,
    fetchNotifications: fetchSystemNotifications 
  } = useSystemNotificationStore();

  // Chat Notifications
  const {
    notifications: chatNotifications,
    markNotificationsRead: markChatRead,
    loadNotifications: fetchChatNotifications
  } = useChatStore();

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRefreshing(true);
    await Promise.all([
      fetchSystemNotifications(),
      fetchChatNotifications()
    ]);
    setTimeout(() => setIsRefreshing(false), 550);
  };

  const handleNotificationClick = async (notif: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);

    if (notif.isChat && notif.chatDetails) {
      const isDm = notif.chatDetails.type === 'direct_message';
      if (isDm) {
        await markChatRead(undefined, notif.chatDetails.senderEmail);
        localStorage.setItem('chat_recipient_email', notif.chatDetails.senderEmail);
      } else {
        await markChatRead(notif.chatDetails.entityId);
        useChatStore.getState().setActiveConversation(notif.chatDetails.entityId);
      }
      onNavigate('messages');
    } else {
      await markSystemRead(notif.id);
      if (notif.targetPage) {
        onNavigate(notif.targetPage);
      }
    }
  };

  const handleClearAll = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await Promise.all([
      markAllSystemRead(),
      markChatRead() // passing no arguments marks all chat notifications read on DB
    ]);
  };

  const formatTimeAgo = (dateStr: string) => {
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return 'Yesterday';
      return `${diffDays}d ago`;
    } catch (e) {
      return '';
    }
  };

  // Combine and sort both lists chronologically (newest first)
  const unifiedNotifications = [
    ...systemNotifications.map(n => ({
      id: n._id,
      title: n.title,
      content: n.content,
      type: n.type,
      targetPage: n.targetPage,
      createdAt: n.createdAt,
      isChat: false
    })),
    ...chatNotifications.map(n => ({
      id: n._id,
      title: `New Message from ${n.senderName}`,
      content: n.content,
      type: 'message',
      targetPage: 'messages',
      createdAt: n.createdAt,
      isChat: true,
      chatDetails: {
        entityId: n.entityId,
        senderEmail: n.senderEmail,
        type: n.type
      }
    }))
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Filter tabs config
  const filterTabs = [
    { key: 'all',         label: 'All' },
    { key: 'leave',       label: 'Leave' },
    { key: 'payroll',     label: 'Payroll' },
    { key: 'ticket',      label: 'Tickets' },
    { key: 'task',        label: 'Tasks' },
    { key: 'expense',     label: 'Expense' },
    { key: 'message',     label: 'Messages' },
  ];

  const filteredNotifications = activeFilter === 'all'
    ? unifiedNotifications
    : unifiedNotifications.filter(n => n.type === activeFilter);

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          triggerClassName || "flex items-center justify-center w-10 h-10 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/80 rounded-xl hover:shadow-md hover:border-slate-300/55 transition-all cursor-pointer relative active:scale-95 text-slate-600 dark:text-slate-350"
        )}
        title="Corporate Updates"
      >
        <Bell className={cn("w-4.5 h-4.5", unifiedNotifications.length > 0 && "animate-wiggle text-blue-500")} />
        
        {unifiedNotifications.length > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[8px] font-black text-white ring-2 ring-white dark:ring-slate-900">
            {unifiedNotifications.length}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={cn(
              "absolute mt-2.5 w-80 rounded-[20px] shadow-2xl z-50 overflow-hidden text-left flex flex-col max-h-[420px] border border-slate-200 dark:border-slate-800",
              align === 'right' ? 'right-0' : 'left-0'
            )}
            style={{
              backgroundColor: 'var(--surface-muted, #111827)',
              color: 'var(--foreground, #ffffff)'
            }}
          >
            {/* Header */}
            <div className="flex justify-between items-center p-3.5 border-b border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/40 shrink-0">
              <span className="text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-1.5">
                Corporate Updates
              </span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all disabled:opacity-50 cursor-pointer border-none bg-transparent"
                >
                  <RefreshCw className={cn("w-3 h-3", isRefreshing && "animate-spin")} />
                </button>
                {unifiedNotifications.length > 0 && (
                  <button 
                    onClick={handleClearAll}
                    className="flex items-center gap-0.5 text-[8.5px] font-black uppercase tracking-widest text-emerald-650 dark:text-emerald-450 hover:bg-emerald-500/10 px-2 py-1 rounded transition-all border-none bg-transparent cursor-pointer"
                  >
                    <CheckCheck className="w-3 h-3" />
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-1 px-3 pb-2 pt-1 overflow-x-auto no-scrollbar shrink-0 border-b border-slate-100 dark:border-slate-850">
              {filterTabs.map(tab => {
                const tabCount = tab.key === 'all'
                  ? unifiedNotifications.length
                  : unifiedNotifications.filter(n => n.type === tab.key).length;
                return (
                  <button
                    key={tab.key}
                    onClick={(e) => { e.stopPropagation(); setActiveFilter(tab.key); }}
                    className={cn(
                      "flex items-center gap-1 px-2.5 py-1 rounded-lg text-[8.5px] font-black uppercase tracking-wider whitespace-nowrap transition-all border-none cursor-pointer",
                      activeFilter === tab.key
                        ? "bg-blue-500 text-white shadow-sm"
                        : "bg-transparent text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-700 dark:hover:text-slate-300"
                    )}
                  >
                    {tab.label}
                    {tabCount > 0 && (
                      <span className={cn(
                        "text-[7px] font-black px-1 rounded-full",
                        activeFilter === tab.key ? "bg-white/25 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                      )}>
                        {tabCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* List Body */}
            <div className="flex-1 overflow-y-auto no-scrollbar py-1 space-y-0.5">
              {filteredNotifications.length === 0 ? (
                <div className="py-10 flex flex-col items-center justify-center text-center px-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-2.5 border border-slate-100 dark:border-slate-800/65">
                    <Bell className="w-5 h-5" />
                  </div>
                  <h4 className="text-[9.5px] font-black text-slate-900 dark:text-white uppercase tracking-wider">All caught up</h4>
                  <p className="text-[8.5px] text-slate-450 dark:text-slate-500 mt-1 max-w-[180px] leading-normal">
                    {activeFilter === 'all' ? 'No new system alerts or actions needed.' : `No ${activeFilter} notifications.`}
                  </p>
                </div>
              ) : (
                filteredNotifications.map((notif) => {
                  const config = typeConfig[notif.type] || typeConfig.other;
                  const IconComponent = config.icon;

                  return (
                    <div 
                      key={notif.id}
                      onClick={(e) => handleNotificationClick(notif, e)}
                      className="flex items-center gap-3 px-3.5 py-3 hover:bg-slate-50 dark:hover:bg-slate-850/30 transition-all duration-200 cursor-pointer group text-left relative"
                    >
                      {/* Left Icon */}
                      <div className={cn(
                        "w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105",
                        config.color
                      )}>
                        <IconComponent className="w-4 h-4" />
                      </div>

                      {/* Content details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline gap-1.5">
                          <span className="text-[9px] font-black text-slate-800 dark:text-white uppercase tracking-tight truncate">
                            {notif.title}
                          </span>
                          <span className="text-[8px] text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wider shrink-0">
                            {formatTimeAgo(notif.createdAt)}
                          </span>
                        </div>
                        <p className="text-[9.5px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                          {notif.content}
                        </p>
                      </div>

                      {/* Right Indicator Icon */}
                      <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 text-slate-350 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
                        <ArrowRight className="w-3 h-3 text-blue-500" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
