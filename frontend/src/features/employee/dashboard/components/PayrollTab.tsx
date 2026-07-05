"use client";

import React from 'react';
import { Eye } from 'lucide-react';
import { cn } from "@/lib/utils";

interface PayrollTabProps {
  payrolls: any[];
  setShowSlipModal: (pay: any) => void;
}

export function PayrollTab({
  payrolls,
  setShowSlipModal
}: PayrollTabProps) {
  return (
    <div className="space-y-6 text-left">
      <div>
        <h2 className="text-xl font-black uppercase tracking-widest text-slate-900 dark:text-white">Payroll Hub</h2>
        <p className="text-[10px] font-bold text-slate-450 dark:text-slate-500 mt-1 uppercase tracking-wider leading-none">Check monthly salary distributions, earnings, deductions, or download certified PDF slips.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: CTC breakdown */}
        <div className="saas-card bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900/90 dark:to-slate-950/70 border border-slate-205/30 dark:border-slate-800/80 p-6 rounded-[28px] shadow-md space-y-6">
          <h3 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">CTC Breakdown</h3>
          
          <div className="space-y-4">
            {[
              { label: 'Basic Salary', value: '₹55,000', percentage: '60%' },
              { label: 'House Rent Allowance (HRA)', value: '₹22,000', percentage: '24%' },
              { label: 'Special Allowance', value: '₹8,000', percentage: '9%' },
              { label: 'Provident Fund (PF) contribution', value: '₹6,600', percentage: '7%' }
            ].map((item, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <span>{item.label}</span>
                  <span className="font-black text-slate-900 dark:text-white">{item.value} ({item.percentage})</span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-950 rounded-full p-0.5 border border-slate-200/40 dark:border-slate-800/60 overflow-hidden shadow-inner">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full shadow-md shadow-blue-500/20" style={{ width: item.percentage }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Payslips history table */}
        <div className="lg:col-span-2 saas-card bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900/90 dark:to-slate-950/70 border border-slate-205/30 dark:border-slate-800/80 p-6 rounded-[28px] shadow-md space-y-6">
          <h3 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Payslips Archive</h3>
          
          <div className="saas-table-container">
            <table className="saas-table">
              <thead className="saas-table-thead">
                <tr>
                  <th className="saas-table-th">Month</th>
                  <th className="saas-table-th">Basic Pay</th>
                  <th className="saas-table-th">Allowances</th>
                  <th className="saas-table-th">Net Salary</th>
                  <th className="saas-table-th">Action</th>
                </tr>
              </thead>
              <tbody>
                {payrolls.length === 0 ? (
                  <tr className="saas-table-row">
                    <td colSpan={5} className="saas-table-td text-center text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase py-10">
                      No payroll cycles generated yet.
                    </td>
                  </tr>
                ) : (
                  payrolls.map((pay) => (
                    <tr key={pay._id || pay.id} className="saas-table-row">
                      <td className="saas-table-td font-extrabold text-slate-900 dark:text-white uppercase">{pay.month}</td>
                      <td className="saas-table-td text-slate-505 dark:text-slate-400 font-extrabold">₹{pay.basicSalary?.toLocaleString() || '55,000'}</td>
                      <td className="saas-table-td text-slate-550 dark:text-slate-400 font-extrabold">₹{pay.allowances?.toLocaleString() || '15,000'}</td>
                      <td className="saas-table-td font-black text-slate-950 dark:text-white">₹{pay.netSalary?.toLocaleString()}</td>
                      <td className="saas-table-td">
                        <button 
                          onClick={() => setShowSlipModal(pay)}
                          className="px-4 py-2 bg-blue-500/10 text-blue-650 dark:text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-500/15 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Slip
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
