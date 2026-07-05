"use client";

import React, { useState } from 'react';
import { Key, Mail, RefreshCcw } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function CredentialsTab() {
  const [empCredentials, setEmpCredentials] = useState([
    { id: 'EMP001', name: 'Arjun Singh', role: 'HR', username: 'arjun.hr', pass: '********' },
    { id: 'EMP002', name: 'Sanya Gupta', role: 'Employee', username: 'sanya.emp', pass: '********' },
    { id: 'EMP003', name: 'Rahul Varma', role: 'Employee', username: 'rahul.emp', pass: '********' },
  ]);

  const handleRevealPass = (id: string) => {
    setEmpCredentials((prev: any) => prev.map((c: any) => 
      c.id === id ? { ...c, pass: c.pass === '********' ? 'Pass@123' : '********' } : c
    ));
  };

  return (
    <div className="space-y-6 text-left">
      <div className="p-6 bg-slate-900 text-white rounded-[1.5rem] shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/10 blur-[100px] rounded-full -mr-20 -mt-20" />
        <div className="relative z-10">
          <h3 className="text-xl font-black tracking-tight mb-1">Login Credentials</h3>
          <p className="text-slate-400 text-xs font-medium">Generate and manage access for your team members.</p>
        </div>
      </div>

      <div className="space-y-3">
        {empCredentials.map((cred) => (
          <div key={cred.id} className="p-6 bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 shadow-sm group">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center font-black text-xs text-slate-500 shrink-0">
                  {cred.id}
                </div>
                <div>
                  <h4 className="font-black text-slate-900 dark:text-white tracking-tight text-xs">{cred.name}</h4>
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest block w-fit mt-1",
                    cred.role === 'HR' ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                  )}>{cred.role}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end">
                <div className="space-y-0.5">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Username</p>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{cred.username}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Password</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-mono font-bold text-slate-900 dark:text-white">{cred.pass}</p>
                    <button 
                      onClick={() => handleRevealPass(cred.id)}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                      title="Reveal Password"
                    >
                      <RefreshCcw className="w-3.5 h-3.5 text-blue-600" />
                    </button>
                  </div>
                </div>
                <button 
                  onClick={() => alert(`Sending credentials email to ${cred.username}@company.com`)}
                  className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg md:opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                  title="Email Credentials"
                >
                  <Mail className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
