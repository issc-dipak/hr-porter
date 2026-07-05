"use client";

import React from 'react';
import { cn } from "@/lib/utils";

interface NotificationsTabProps {
  notifications: any;
  setNotifications: React.Dispatch<React.SetStateAction<any>>;
}

export default function NotificationsTab({ notifications, setNotifications }: NotificationsTabProps) {
  const notificationItems = [
    { id: 'email', label: 'Email Alerts' },
    { id: 'push', label: 'Mobile Push' },
    { id: 'payroll', label: 'Payroll Alerts' },
  ];

  const handleToggle = (id: string) => {
    setNotifications((prev: any) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="space-y-3 text-left">
      {notificationItems.map((item) => (
        <div 
          key={item.id} 
          className="flex items-center justify-between p-4.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100/50 dark:border-slate-800/40"
        >
          <p className="text-xs font-black text-slate-900 dark:text-white">{item.label}</p>
          <button 
            onClick={() => handleToggle(item.id)}
            className={cn(
              "w-12 h-6 rounded-full p-1 transition-all",
              notifications[item.id] ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-700"
            )}
          >
            <div className={cn(
              "w-4 h-4 bg-white rounded-full transition-all",
              notifications[item.id] ? "translate-x-6" : "translate-x-0"
            )} />
          </button>
        </div>
      ))}
    </div>
  );
}
