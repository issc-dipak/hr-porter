"use client";

import React from 'react';
import { 
  FileText, DollarSign, HelpCircle, Megaphone, CheckSquare, 
  Bell, ArrowRight, CheckCheck, RefreshCw, Receipt, ListTodo, BookOpen, UserPlus
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { useSystemNotificationStore } from '@/store/useSystemNotificationStore';

const typeConfig: Record<string, { icon: any; color: string }> = {
  leave:          { icon: FileText,    color: 'text-blue-500 bg-blue-500/10 dark:bg-blue-500/5 border-blue-500/20' },
  payroll:        { icon: DollarSign,  color: 'text-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/5 border-emerald-500/20' },
  ticket:         { icon: HelpCircle,  color: 'text-amber-500 bg-amber-500/10 dark:bg-amber-500/5 border-amber-500/20' },
  announcement:   { icon: Megaphone,   color: 'text-purple-500 bg-purple-500/10 dark:bg-purple-500/5 border-purple-500/20' },
  'daily-update': { icon: CheckSquare, color: 'text-rose-500 bg-rose-500/10 dark:bg-rose-500/5 border-rose-500/20' },
  expense:        { icon: Receipt,     color: 'text-orange-500 bg-orange-500/10 dark:bg-orange-500/5 border-orange-500/20' },
  task:           { icon: ListTodo,    color: 'text-teal-500 bg-teal-500/10 dark:bg-teal-500/5 border-teal-500/20' },
  policy:         { icon: BookOpen,    color: 'text-violet-500 bg-violet-500/10 dark:bg-violet-500/5 border-violet-500/20' },
  recruitment:    { icon: UserPlus,    color: 'text-cyan-500 bg-cyan-500/10 dark:bg-cyan-500/5 border-cyan-500/20' },
  other:          { icon: Bell,        color: 'text-slate-500 bg-slate-500/10 dark:bg-slate-500/5 border-slate-500/20' }
};

interface NotificationsCardProps {
  onNavigate: (page: string) => void;
  className?: string;
}

export function NotificationsCard({ onNavigate, className }: NotificationsCardProps) {
  const { 
    notifications, 
    markRead, 
    markAllRead,
    fetchNotifications 
  } = useSystemNotificationStore();

  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchNotifications();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const handleNotificationClick = async (notif: any) => {
    await markRead(notif._id);
    if (notif.targetPage) {
      onNavigate(notif.targetPage);
    }
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

  return (
    <div className={cn(
      "saas-card flex flex-col p-5 relative overflow-hidden bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/80 shadow-md rounded-[24px] transition-all",
      className
    )}>
      {/* Glow Effects */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-2xl rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500/5 blur-2xl rounded-full pointer-events-none" />

      {/* Header */}
      <div className="flex justify-between items-center mb-5 shrink-0 relative z-10">
        <div className="flex items-center gap-2">
          <h2 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5 text-blue-500 animate-swing" />
            Corporate Updates
          </h2>
          {notifications.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-500 text-white animate-pulse">
              {notifications.length} New
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/85 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all active:scale-95 disabled:opacity-50 cursor-pointer border-none bg-transparent"
            title="Refresh notifications"
          >
            <RefreshCw className={cn("w-3 h-3", isRefreshing && "animate-spin")} />
          </button>
          {notifications.length > 0 && (
            <button 
              onClick={() => markAllRead()}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[9.5px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-all border-none bg-transparent active:scale-95 cursor-pointer"
            >
              <CheckCheck className="w-3 h-3" />
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto no-scrollbar min-h-[220px] max-h-[360px] space-y-2.5 pr-0.5 relative z-10">
        {notifications.length === 0 ? (
          <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-3 border border-slate-100 dark:border-slate-800/65">
              <Bell className="w-6 h-6" />
            </div>
            <h4 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-wider">All caught up</h4>
            <p className="text-[9.5px] text-slate-400 dark:text-slate-500 mt-1 max-w-[200px] leading-relaxed">
              No new corporate updates or action items at the moment.
            </p>
          </div>
        ) : (
          notifications.map((notif) => {
            const config = typeConfig[notif.type] || typeConfig.other;
            const IconComponent = config.icon;

            return (
              <div 
                key={notif._id}
                onClick={() => handleNotificationClick(notif)}
                className="flex items-center gap-3.5 p-3.5 bg-slate-50/50 dark:bg-slate-850/20 rounded-2xl border border-slate-100 dark:border-slate-800/40 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-700/65 hover:shadow-sm transition-all duration-300 group cursor-pointer relative overflow-hidden"
              >
                {/* Type Indicator Line */}
                <div className="absolute top-0 bottom-0 left-0 w-[3px] bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Left Icon */}
                <div className={cn(
                  "w-8.5 h-8.5 rounded-xl border flex items-center justify-center shrink-0 shadow-sm",
                  config.color
                )}>
                  <IconComponent className="w-4.5 h-4.5" />
                </div>

                {/* Title & Description */}
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="text-[9.5px] font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">
                      {notif.title}
                    </span>
                    <span className="text-[8.5px] text-slate-400 dark:text-slate-550 font-bold uppercase tracking-wider shrink-0">
                      {formatTimeAgo(notif.createdAt)}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {notif.content}
                  </p>
                </div>

                {/* Right Arrow */}
                <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-slate-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
