"use client";

import React, { useState, useMemo } from 'react';
import { 
  Check, X, Search, Landmark, Receipt, ArrowRight, CheckCircle2, AlertCircle, Wallet
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { usePermission } from '@/context/PermissionContext';

interface WorkflowTabProps {
  payroll: any[];
  fetchPayroll: () => Promise<void>;
  wallet: any;
  fetchWallet: () => Promise<void>;
  userRole?: string;
}

export default function WorkflowTab({ payroll, fetchPayroll, wallet, fetchWallet, userRole = 'HR' }: WorkflowTabProps) {
  const { can } = usePermission();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('May 2026');

  const uniqueMonths = useMemo(() => {
    const months = Array.from(new Set(payroll.map(p => p.month)));
    if (months.length > 0 && !months.includes(selectedMonth)) {
      setSelectedMonth(months[0] as string);
    }
    return months.length > 0 ? months : ['May 2026', 'April 2026', 'March 2026'];
  }, [payroll]);

  const filteredPayroll = useMemo(() => {
    return payroll.filter(row => {
      const matchesSearch = row.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            row.employee.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesMonth = row.month === selectedMonth;
      return matchesSearch && matchesMonth;
    });
  }, [payroll, searchTerm, selectedMonth]);

  const handleUpdatePayrollStatus = async (id: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const targetSlip = payroll.find(p => p._id === id);

      if (newStatus === 'Paid' && targetSlip) {
        const currentBalance = wallet?.balance ?? 0;
        if (currentBalance < targetSlip.net) {
          alert(`Insufficient Wallet Balance! Required: ₹${targetSlip.net.toLocaleString()}, Available: ₹${currentBalance.toLocaleString()}. Please deposit funds first.`);
          return;
        }

        const walletRes = await fetch('/api/wallet', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            amount: targetSlip.net,
            paymentId: `PAYOUT-${id.slice(-6).toUpperCase()}`,
            type: 'Debit',
            description: `Salary Payout to ${targetSlip.employeeName} (${targetSlip.month})`
          })
        });

        if (!walletRes.ok) {
          alert("Failed to process payout debit from corporate wallet.");
          return;
        }

        await fetchWallet();
      }

      const res = await fetch(`/api/payroll/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        await fetchPayroll();
      }
    } catch (err) {
      console.error('Failed to update payroll status:', err);
    }
  };

  const handleBulkUpdateStatus = async (month: string, fromStatus: string, toStatus: string) => {
    const items = payroll.filter(p => p.month === month && p.status === fromStatus);
    if (items.length === 0) return;

    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      if (toStatus === 'Paid') {
        const totalNet = items.reduce((acc, p) => acc + p.net, 0);
        const currentBalance = wallet?.balance ?? 0;
        if (currentBalance < totalNet) {
          alert(`Insufficient Wallet Balance for bulk payout! Required: ₹${totalNet.toLocaleString()}, Available: ₹${currentBalance.toLocaleString()}. Please deposit funds first.`);
          return;
        }

        const walletRes = await fetch('/api/wallet', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            amount: totalNet,
            paymentId: `PAYOUT-BULK-${month.replace(' ', '-').toUpperCase()}`,
            type: 'Debit',
            description: `Bulk Salary Payout - ${items.length} employees (${month})`
          })
        });

        if (!walletRes.ok) {
          alert("Failed to process bulk payout debit from corporate wallet.");
          return;
        }

        await fetchWallet();
      }

      const promises = items.map(p => 
        fetch(`/api/payroll/${p._id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ status: toStatus })
        })
      );
      await Promise.all(promises);
      await fetchPayroll();
    } catch (err) {
      console.error('Failed bulk status update:', err);
    }
  };

  const workflowStages = [
    { stage: 'Draft', title: 'Draft Payroll', desc: 'Calculated but unverified', color: 'border-t-slate-400 bg-slate-500/5' },
    { stage: 'Pending Approval', title: 'Awaiting Audit', desc: 'Sent to Finance Team', color: 'border-t-amber-500 bg-amber-500/5' },
    { stage: 'Approved', title: 'Ready to Transfer', desc: 'Approved for payout', color: 'border-t-blue-500 bg-blue-500/5' },
    { stage: 'Paid', title: 'Disbursed', desc: 'Bank transfer complete', color: 'border-t-emerald-500 bg-emerald-500/5' }
  ];

  return (
    <div className="space-y-4 text-left">
      {/* Wallet Balance Info Header */}
      <div className="p-3 bg-slate-900 text-white rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 border border-slate-800 shadow-md">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-650/20 rounded-lg">
            <Wallet className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <span className="text-[8px] text-slate-400 font-black uppercase tracking-wider block">Corporate Wallet Balance</span>
            <span className="text-xs font-black text-blue-400 leading-none">₹{wallet?.balance?.toLocaleString() ?? '0'}</span>
          </div>
        </div>
        <div className="text-[7.5px] font-black uppercase tracking-widest text-slate-400 bg-slate-800 px-2.5 py-1.5 rounded-md">
          Razorpay Instant Settlement Active
        </div>
      </div>

      {/* Search and Month Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <select 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-lg text-[10px] font-black outline-none text-slate-900 dark:text-white"
          >
            {uniqueMonths.map((m: any) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <div className="min-w-[180px]">
            <input 
              type="text" 
              placeholder="Search processed pay..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-bold outline-none focus:border-blue-500/50 w-full"
            />
          </div>
        </div>
      </div>

      {/* Kanban Stages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
        {workflowStages.map(({ stage, title, desc, color }) => {
          const items = filteredPayroll.filter(p => p.status === stage);
          const totalCost = items.reduce((acc, c) => acc + c.net, 0);

          return (
            <div key={stage} className={cn("rounded-xl border-t-4 border border-slate-200/50 dark:border-slate-800 p-3.5 flex flex-col h-[390px] shadow-sm", color)}>
              <div className="pb-2.5 border-b border-slate-200 dark:border-slate-800/80 mb-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-wider">{title}</h4>
                  <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[8px] font-black text-slate-500">{items.length}</span>
                </div>
                <p className="text-[7.5px] text-slate-455 dark:text-slate-400 font-bold uppercase mt-0.5">{desc}</p>

                {/* Bulk Actions */}
                {items.length > 0 && (
                  <div className="mt-2.5">
                    {stage === 'Draft' && (
                      <button 
                        onClick={() => handleBulkUpdateStatus(selectedMonth, 'Draft', 'Pending Approval')}
                        className="submit-finance-btn w-full py-1 text-white rounded-md text-[8px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-sm text-center"
                      >
                        Submit to Finance ({items.length})
                      </button>
                    )}
                    {stage === 'Pending Approval' && (
                      can('payroll.process_salary') ? (
                        <button 
                          onClick={() => handleBulkUpdateStatus(selectedMonth, 'Pending Approval', 'Approved')}
                          className="w-full py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-[8px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-sm text-center"
                        >
                          Bulk Approve ({items.length})
                        </button>
                      ) : (
                        <div className="w-full py-1 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-450 rounded-md text-[8px] font-black uppercase tracking-widest text-center border border-amber-100 dark:border-transparent select-none">
                          Awaiting Manager Audit
                        </div>
                      )
                    )}
                    {stage === 'Approved' && (
                      can('payroll.release_salary') ? (
                        <button 
                          onClick={() => handleBulkUpdateStatus(selectedMonth, 'Approved', 'Paid')}
                          className="w-full py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-[8px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-blue-500/10 text-center"
                        >
                          Bulk Wallet Disbursal
                        </button>
                      ) : (
                        <div className="w-full py-1 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-450 rounded-md text-[8px] font-black uppercase tracking-widest text-center border border-blue-100 dark:border-transparent select-none">
                          Awaiting Payout Release
                        </div>
                      )
                    )}
                    {stage === 'Paid' && (
                      <div className="w-full py-1 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 rounded-md text-[8px] font-black uppercase tracking-widest text-center border border-emerald-100 dark:border-transparent">
                        Cycle Total: ₹{totalCost.toLocaleString()}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Cards List */}
              <div className="flex-1 space-y-2.5 overflow-y-auto">
                {items.map((p) => (
                  <div key={p._id} className="p-3 bg-white dark:bg-slate-900 border border-slate-150/40 dark:border-slate-800 rounded-lg shadow-sm space-y-2 group hover:border-blue-500/20 transition-all text-left">
                    <div>
                      <h5 className="text-[11px] font-black text-slate-900 dark:text-white truncate">{p.employeeName}</h5>
                      <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest mt-0.5 block">{p.employee.split('@')[0]}</span>
                    </div>
                    <div className="flex justify-between items-baseline border-t border-slate-50 dark:border-slate-800/60 pt-1.5 text-[9px] font-bold">
                      <span className="text-slate-400 font-medium">Net Pay:</span>
                      <span className="text-slate-900 dark:text-white font-black">₹{p.net.toLocaleString()}</span>
                    </div>

                    {/* Stage Actions */}
                    <div className="flex items-center justify-end gap-1.5 pt-1.5 border-t border-slate-50 dark:border-slate-800/60">
                      {stage === 'Draft' && (
                        <button 
                          onClick={() => handleUpdatePayrollStatus(p._id, 'Pending Approval')}
                          className="p-1 hover:bg-slate-150 rounded-md cursor-pointer transition-all ml-auto text-slate-500"
                          title="Submit to Finance"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {stage === 'Pending Approval' && (
                        can('payroll.process_salary') ? (
                          <>
                            <button 
                              onClick={() => handleUpdatePayrollStatus(p._id, 'Approved')}
                              className="p-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-md cursor-pointer hover:bg-emerald-600 hover:text-white transition-all"
                              title="Approve"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button 
                              onClick={() => handleUpdatePayrollStatus(p._id, 'Draft')}
                              className="p-1 bg-rose-50 text-rose-605 rounded-md cursor-pointer hover:bg-rose-600 hover:text-white transition-all"
                              title="Reject to Draft"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </>
                        ) : (
                          <span className="text-[7px] font-black uppercase text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                            Pending Audit
                          </span>
                        )
                      )}
                      {stage === 'Approved' && (
                        can('payroll.release_salary') ? (
                          <button 
                            onClick={() => handleUpdatePayrollStatus(p._id, 'Paid')}
                            className="p-1 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md cursor-pointer flex items-center gap-1 text-[7.5px] font-black uppercase tracking-widest transition-all"
                          >
                            <CheckCircle2 className="w-3 h-3" /> Disburse
                          </button>
                        ) : (
                          <span className="text-[7px] font-black uppercase text-blue-500 bg-blue-50 dark:bg-blue-950/20 px-2 py-0.5 rounded">
                            Approved
                          </span>
                        )
                      )}
                      {stage === 'Paid' && (
                        <span className="text-[7px] font-black uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-450 px-1.5 py-0.5 rounded-md inline-flex items-center gap-1 w-full justify-center">
                          <Check className="w-2.5 h-2.5" /> Transferred
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {items.length === 0 && (
                  <div className="h-full flex items-center justify-center py-10 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Lane Empty</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
