"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, Search, Landmark, Receipt, X, Printer, Zap, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";

interface PayrollSheetsTabProps {
  payroll: any[];
  employees: any[];
  fetchPayroll: () => Promise<void>;
  setSelectedPayslip: (slip: any) => void;
  userRole?: string;
}

export default function PayrollSheetsTab({ 
  payroll, 
  employees, 
  fetchPayroll,
  setSelectedPayslip,
  userRole = 'HR'
}: PayrollSheetsTabProps) {
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('May 2026');
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);

  // Modals & Process States
  const [isProcessingPayroll, setIsProcessingPayroll] = useState(false);
  const [payrollForm, setPayrollForm] = useState({
    employeeEmail: '',
    month: 'May 2026',
    workingDays: 30,
    overtimeHours: 0,
    bonus: 0,
    otherDeductions: 0
  });

  // Sync default employee when list loads
  useEffect(() => {
    if (employees.length > 0 && !payrollForm.employeeEmail) {
      setPayrollForm(prev => ({ ...prev, employeeEmail: employees[0].email }));
    }
  }, [employees]);

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

  const calculatedPayrollPreview = useMemo(() => {
    const emp = employees.find(e => e.email === payrollForm.employeeEmail);
    if (!emp) return null;

    const struct = emp.salaryStructure || {
      basic: 30000, hra: 10000, allowance: 5000, bonus: 0, pf: 3600, esi: 1000, tax: 2000, otherDeductions: 0
    };

    const totalDays = 30;
    const workDays = Number(payrollForm.workingDays);
    const leaveDeductions = workDays < totalDays ? Math.round((struct.basic / totalDays) * (totalDays - workDays)) : 0;

    const basicSalary = Math.max(0, struct.basic - leaveDeductions);
    const overtimePay = Number(payrollForm.overtimeHours) * 500; // Overtime rate: ₹500/hr
    const bonusPay = Number(payrollForm.bonus) + Number(struct.bonus || 0);

    const gross = basicSalary + Number(struct.hra) + Number(struct.allowance) + overtimePay + bonusPay;
    const deductions = Number(struct.pf) + Number(struct.esi) + Number(struct.tax) + Number(payrollForm.otherDeductions);
    const net = Math.max(0, gross - deductions);

    return {
      employee: emp.email,
      employeeName: emp.fullName,
      month: payrollForm.month,
      basic: basicSalary,
      hra: struct.hra,
      allowance: struct.allowance,
      bonus: bonusPay,
      overtime: overtimePay,
      pf: struct.pf,
      esi: struct.esi,
      tax: struct.tax,
      otherDeductions: Number(payrollForm.otherDeductions) + Number(struct.otherDeductions || 0),
      leaveDeductions,
      gross,
      net,
      workingDays: workDays,
      status: 'Draft'
    };
  }, [payrollForm, employees]);

  const handleProcessPayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!calculatedPayrollPreview) return;

    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/payroll', {
        method: 'POST',
        headers,
        body: JSON.stringify(calculatedPayrollPreview)
      });
      if (res.ok) {
        alert("Draft payroll generated successfully!");
        await fetchPayroll();
        setIsProcessingPayroll(false);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to generate draft payroll");
      }
    } catch (err: any) {
      console.error('Failed to create payroll record:', err);
      alert("Failed to connect to the server. Please try again.");
    }
  };

  const handleBulkAutoGenerate = async () => {
    setIsBulkGenerating(true);
    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/payroll/generate', {
        method: 'POST',
        headers,
        body: JSON.stringify({ month: selectedMonth })
      });
      if (res.ok) {
        const data = await res.json();
        alert(data.message || "Bulk payroll generated successfully!");
        await fetchPayroll();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to generate bulk payroll");
      }
    } catch (err) {
      console.error('Failed bulk auto-generate:', err);
    } finally {
      setIsBulkGenerating(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header filter options */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <select 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl text-xs font-black outline-none text-slate-900 dark:text-white"
          >
            {uniqueMonths.map((m: any) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <div className="min-w-[200px]">
            <input 
              type="text" 
              placeholder="Search processed pay..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none focus:border-blue-500/50"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={handleBulkAutoGenerate}
            disabled={isBulkGenerating}
            className="px-4.5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-650 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer shadow-lg shadow-indigo-500/10 transition-all active:scale-95 flex items-center gap-1.5 disabled:opacity-70"
          >
            {isBulkGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Auto-Processing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-amber-400 fill-amber-400" /> Bulk Auto-Generate
              </>
            )}
          </button>

          <button 
            onClick={() => {
              if (employees.length > 0) {
                setPayrollForm(prev => ({ ...prev, employeeEmail: employees[0].email }));
              }
              setIsProcessingPayroll(true);
            }}
            className="px-4.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer shadow-lg shadow-blue-500/20 transition-all active:scale-95 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Process Monthly Pay
          </button>
        </div>
      </div>      {/* Sheets Listing */}
      <div className="saas-card bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-805 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-855">
                <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Employee</th>
                <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Working Days</th>
                <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Gross Salary</th>
                <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Deductions</th>
                <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Net Takehome</th>
                <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Payslip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredPayroll.map((row) => {
                const gross = row.basic + (row.hra || 0) + (row.allowance || 0) + (row.bonus || 0) + (row.overtime || 0);
                const ded = (row.tax || 0) + (row.pf || 0) + (row.esi || 0) + (row.otherDeductions || 0);
                
                return (
                  <tr key={row._id} className="group hover:bg-slate-50/55 dark:hover:bg-slate-800/20 transition-all">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7.5 h-7.5 rounded-lg bg-blue-50 dark:bg-slate-800 flex items-center justify-center font-black text-blue-600 text-xs">
                          <Landmark className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="font-black text-slate-900 dark:text-white text-xs leading-tight">{row.employeeName}</p>
                          <p className="text-[9px] text-slate-400 font-bold mt-0.5">{row.employee}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[11px] font-bold text-slate-500">{row.workingDays || 30} / 30 Days</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-205">₹{gross.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3 text-rose-505">
                      <span className="text-[11px] font-bold">-₹{ded.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-black text-blue-600">₹{row.net.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[7.5px] font-black uppercase tracking-wider inline-flex items-center gap-1",
                        row.status === 'Paid' 
                          ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-500" 
                          : row.status === 'Draft'
                          ? "bg-slate-100 dark:bg-slate-800 text-slate-500"
                          : "bg-amber-50 dark:bg-amber-955/20 text-amber-600 dark:text-amber-500"
                      )}>
                        <span className={cn("w-1 h-1 rounded-full", row.status === 'Paid' ? "bg-emerald-500" : row.status === 'Draft' ? "bg-slate-400" : "bg-amber-500")} />
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button 
                        onClick={() => setSelectedPayslip(row)}
                        className="print-action-btn px-2 py-1 border rounded-lg text-[8.5px] font-black uppercase tracking-widest cursor-pointer transition-all active:scale-95 flex items-center gap-1"
                      >
                        <Printer className="w-3 h-3" /> Print
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredPayroll.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-xs font-black uppercase text-slate-400">
                    No processed records for this cycle.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Process payroll */}
      <AnimatePresence>
        {isProcessingPayroll && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="process-payroll-modal w-full max-w-md rounded-2xl p-5 shadow-2xl relative overflow-hidden max-h-[92vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-100 dark:border-slate-800 mb-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2">
                  <Receipt className="w-4.5 h-4.5 text-blue-600" />
                  Process Employee Monthly Pay
                </h3>
                <button 
                  onClick={() => setIsProcessingPayroll(false)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleProcessPayroll} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Select Employee</label>
                    <select 
                      required
                      className="saas-input w-full px-2.5 py-1.5 text-[11px] cursor-pointer outline-none text-slate-700 dark:text-slate-300 border border-slate-150/40 rounded-lg"
                      value={payrollForm.employeeEmail}
                      onChange={(e) => setPayrollForm({ ...payrollForm, employeeEmail: e.target.value })}
                    >
                      {employees.length === 0 ? (
                        <option value="" disabled>Loading employees...</option>
                      ) : (
                        <>
                          <option value="" disabled>-- Select Employee --</option>
                          {employees.map(emp => (
                            <option key={emp._id} value={emp.email}>{emp.fullName} ({emp.email.split('@')[0]})</option>
                          ))}
                        </>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Payroll Month</label>
                    <select 
                      required
                      className="saas-input w-full px-2.5 py-1.5 text-[11px] cursor-pointer outline-none text-slate-700 dark:text-slate-300 border border-slate-150/40 rounded-lg"
                      value={payrollForm.month}
                      onChange={(e) => setPayrollForm({ ...payrollForm, month: e.target.value })}
                    >
                      {['May 2026', 'April 2026', 'March 2026', 'January 2024'].map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Working Days (of 30)</label>
                    <input 
                      type="number" 
                      required
                      min={0}
                      max={30}
                      className="saas-input w-full px-2.5 py-1.5 text-[11px] border border-slate-150/40 rounded-lg outline-none"
                      value={payrollForm.workingDays}
                      onChange={(e) => setPayrollForm({ ...payrollForm, workingDays: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Overtime Hours (₹500/hr)</label>
                    <input 
                      type="number" 
                      required
                      min={0}
                      className="saas-input w-full px-2.5 py-1.5 text-[11px] border border-slate-150/40 rounded-lg outline-none"
                      value={payrollForm.overtimeHours}
                      onChange={(e) => setPayrollForm({ ...payrollForm, overtimeHours: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Extra Bonus (One-time)</label>
                    <input 
                      type="number" 
                      required
                      min={0}
                      className="saas-input w-full px-2.5 py-1.5 text-[11px] border border-slate-150/40 rounded-lg outline-none"
                      value={payrollForm.bonus}
                      onChange={(e) => setPayrollForm({ ...payrollForm, bonus: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Other Deductions</label>
                    <input 
                      type="number" 
                      required
                      min={0}
                      className="saas-input w-full px-2.5 py-1.5 text-[11px] border border-slate-150/40 rounded-lg outline-none"
                      value={payrollForm.otherDeductions}
                      onChange={(e) => setPayrollForm({ ...payrollForm, otherDeductions: Number(e.target.value) })}
                    />
                  </div>
                </div>

                {calculatedPayrollPreview && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-750 space-y-2">
                    <h4 className="text-[8.5px] font-black text-slate-455 uppercase tracking-widest border-b pb-1.5">Calculated Payroll Summary</h4>
                    <div className="grid grid-cols-2 gap-y-1.5 text-[9.5px] font-bold text-slate-600 dark:text-slate-350">
                      <div className="flex justify-between pr-3"><span>Basic Pay (Adjusted):</span> <span className="text-slate-900 dark:text-white">₹{calculatedPayrollPreview.basic.toLocaleString()}</span></div>
                      <div className="flex justify-between pr-3"><span>Leaves Deducted:</span> <span className="text-rose-500">-₹{calculatedPayrollPreview.leaveDeductions.toLocaleString()}</span></div>
                      <div className="flex justify-between pr-3"><span>Overtime Earned:</span> <span className="text-emerald-500">+₹{calculatedPayrollPreview.overtime.toLocaleString()}</span></div>
                      <div className="flex justify-between pr-3"><span>Total Deduct (PF/ESI/Tax):</span> <span className="text-rose-500">-₹{(calculatedPayrollPreview.pf + calculatedPayrollPreview.esi + calculatedPayrollPreview.tax).toLocaleString()}</span></div>
                    </div>
                    <div className="pt-1.5 border-t flex justify-between items-center">
                      <span className="text-[8.5px] font-black text-slate-400 uppercase">Calculated Net take-home</span>
                      <span className="text-sm font-black text-blue-600">₹{calculatedPayrollPreview.net.toLocaleString()}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button 
                    type="submit" 
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-755 text-white rounded-lg text-[8.5px] font-black uppercase tracking-widest cursor-pointer shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                  >
                    Generate Draft Payroll
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setIsProcessingPayroll(false)}
                    className="px-5 py-2 bg-slate-100 dark:bg-slate-800 text-[8.5px] font-black text-slate-550 dark:text-slate-400 hover:bg-slate-205 dark:hover:bg-slate-700 rounded-lg cursor-pointer active:scale-95 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
