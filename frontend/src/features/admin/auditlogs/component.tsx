"use client";

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Search, Filter, Calendar, User, 
  Terminal, Globe, Sparkles, Loader2, RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";

interface IAuditLog {
  _id?: string;
  action: string;
  performedBy: string;
  details: string;
  ipAddress: string;
  createdAt: string;
}

export function AuditLogsPage() {
  const [logs, setLogs] = useState<IAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('All');

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/auditlogs', { headers });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(l => {
    const matchesSearch = l.action.toLowerCase().includes(search.toLowerCase()) || 
                          l.performedBy.toLowerCase().includes(search.toLowerCase()) ||
                          l.details.toLowerCase().includes(search.toLowerCase());
    const matchesAction = actionFilter === 'All' || l.action.includes(actionFilter);
    return matchesSearch && matchesAction;
  });

  return (
    <div className="p-4 sm:p-5 lg:p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex justify-between items-start w-full md:w-auto gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-500 animate-pulse shrink-0" />
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase font-outfit">Audit Trail Compliance</h1>
            </div>
            <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
              Enterprise system event logs, access tracking, and governance operations.
            </p>
          </div>
          
          <div className="md:hidden shrink-0">
            <button 
              onClick={fetchLogs}
              className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 active:scale-95 transition-all shadow-sm cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="hidden md:block">
          <button 
            onClick={fetchLogs}
            className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 active:scale-95 transition-all shadow-sm cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Info Warning */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-4 flex items-start sm:items-center gap-3 shadow-md shadow-blue-500/10 border-none">
        <Terminal className="w-5 h-5 text-white shrink-0 mt-0.5 sm:mt-0" />
        <p className="text-[10px] font-black uppercase tracking-widest text-white dark:text-white leading-relaxed">
          System audit logs are immutable records reserved for SOC2/ISO27001 regulatory compliance.
        </p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
        <div className="flex-1 w-full md:max-w-md">
          <input 
            type="text" 
            placeholder="Search action, administrator email, detail snippet..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="saas-input w-full pr-4 py-2 text-xs placeholder:text-[10px] placeholder:font-semibold placeholder:text-slate-450/40"
          />
        </div>

        <div className="premium-nav-container">
          {['All', 'Employee', 'Payroll', 'Leave', 'Asset'].map((action) => (
            <button
              key={action}
              onClick={() => setActionFilter(action)}
              className={cn(
                "premium-nav-item active:scale-[0.98]",
                actionFilter === action ? "premium-nav-item-active" : ""
              )}
            >
              <span>{action}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table / Card List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Loading audit history...</p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="saas-card py-20 flex flex-col items-center justify-center text-center max-w-lg mx-auto">
          <ShieldCheck className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
          <h3 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">No Records Found</h3>
          <p className="text-xs text-slate-400 mt-2 px-6">
            There are no log events recorded in the system audit stream.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
          
          {/* Mobile Cards View */}
          <div className="block sm:hidden divide-y divide-slate-100 dark:divide-slate-800">
            {filteredLogs.map((log) => (
              <div key={log._id} className="p-4 space-y-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-all">
                <div className="flex items-center justify-between gap-2">
                  <span className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider ${
                    log.action.includes('Create') || log.action.includes('Add') ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400' :
                    log.action.includes('Update') || log.action.includes('Approve') ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400' :
                    'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400'
                  }`}>
                    {log.action}
                  </span>
                  <span className="text-[10px] text-slate-550 dark:text-slate-400 font-extrabold font-mono">
                    {new Date(log.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="space-y-1.5 text-left">
                  <div className="flex items-center gap-1.5 text-xs text-slate-800 dark:text-slate-200">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-extrabold">{log.performedBy}</span>
                  </div>
                  <p className="text-[11px] text-slate-650 dark:text-slate-300 leading-relaxed font-medium bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800/60 break-words">
                    {log.details}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[10px] pt-1">
                  <span className="text-slate-500 font-mono flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-blue-500" />
                    {log.ipAddress}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-50 dark:bg-slate-800/40">
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Action Type</th>
                  <th className="px-6 py-4">Performed By</th>
                  <th className="px-6 py-4">Security Details</th>
                  <th className="px-6 py-4">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-semibold">
                {filteredLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                    <td className="px-6 py-4 text-slate-500 font-bold whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider ${
                        log.action.includes('Create') || log.action.includes('Add') ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400' :
                        log.action.includes('Update') || log.action.includes('Approve') ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400' :
                        'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-800 dark:text-slate-200 font-extrabold">{log.performedBy}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300 leading-normal max-w-xs truncate" title={log.details}>
                      {log.details}
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-mono text-[10px] flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-blue-500" />
                      {log.ipAddress}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
