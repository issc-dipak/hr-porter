"use client";

import React from 'react';
import { Shield, ShieldCheck, Briefcase, UserCircle, CheckCircle2 } from 'lucide-react';
import { cn } from "@/lib/utils";

type Role = 'Admin' | 'HR' | 'Employee';

interface RoleSimulatorProps {
  userRole: Role;
  setUserRole: (role: Role) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function RoleSimulator({ userRole, setUserRole, activeTab, setActiveTab }: RoleSimulatorProps) {
  const roles: { id: Role; label: string; icon: any; desc: string; color: string }[] = [
    { id: 'Admin', label: 'Administrator', icon: Shield, desc: 'Full system access & user management', color: 'text-rose-500' },
    { id: 'HR', label: 'HR Manager', icon: Briefcase, desc: 'Recruitment & Payroll management', color: 'text-blue-500' },
    { id: 'Employee', label: 'Employee', icon: UserCircle, desc: 'Personal dashboard & self-service', color: 'text-emerald-500' },
  ];

  return (
    <div className="p-4.5 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-[1.5rem] space-y-4 text-left">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">System Role Simulator</h3>
          <p className="text-slate-500 text-[10px] font-medium uppercase tracking-widest">Switch roles to test permissions</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {roles.map((role) => (
          <button
            key={role.id}
            onClick={() => {
              setUserRole(role.id);
              if (role.id === 'Employee' && activeTab === 'Credentials') {
                setActiveTab('Profile');
              }
            }}
            className={cn(
              "p-4.5 text-left rounded-xl border-2 transition-all relative overflow-hidden group cursor-pointer",
              userRole === role.id 
                ? "border-blue-600 bg-white dark:bg-slate-900 shadow-xl scale-105 z-10" 
                : "border-transparent bg-slate-100 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800"
            )}
          >
            {userRole === role.id && (
              <div className="absolute top-3 right-3 text-blue-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            )}
            <role.icon className={cn("w-6 h-6 mb-3", role.color)} />
            <p className="font-black text-slate-900 dark:text-white tracking-tight text-xs">{role.label}</p>
            <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 leading-relaxed">{role.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
