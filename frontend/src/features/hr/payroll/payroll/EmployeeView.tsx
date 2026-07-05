"use client";

import React, { useState, useEffect } from 'react';
import { 
  Printer, Wallet, Calendar, Percent, ShieldCheck, Landmark, Plus, AlertCircle, FileText, Link as LinkIcon,
  TrendingUp, TrendingDown, IndianRupee, History, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { cn } from "@/lib/utils";

interface EmployeeViewProps {
  activeEmployeeRecord: any;
  employeePayrollData: any[];
  setSelectedPayslip: (slip: any) => void;
  profile: any;
}

export default function EmployeeView({ 
  activeEmployeeRecord, 
  employeePayrollData, 
  setSelectedPayslip,
  profile 
}: EmployeeViewProps) {
  
  // Bank Details States & Handlers (Employee View)
  const [bankDetails, setBankDetails] = useState<{
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    accountHolderName: string;
  } | null>(null);
  const [isEditingBank, setIsEditingBank] = useState(false);
  const [bankForm, setBankForm] = useState({
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    accountHolderName: profile?.name || 'Rahul Sharma'
  });
  const [isSavingBank, setIsSavingBank] = useState(false);

  // Reimbursement States
  const [claims, setClaims] = useState<any[]>([]);
  const [claimForm, setClaimForm] = useState({
    type: 'Travel',
    amount: '',
    claimDate: new Date().toISOString().split('T')[0],
    description: '',
    receiptUrl: ''
  });
  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);

  // Salary Revision History
  const [salaryHistory, setSalaryHistory] = useState<any[]>([]);

  useEffect(() => {
    if (profile?.email) {
      fetchBankDetails();
      fetchClaims();
      fetchSalaryHistory();
    }
  }, [profile]);

  const fetchBankDetails = async () => {
    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`/api/payroll/bank?email=${profile.email}`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.bankDetails) {
          setBankDetails(data.bankDetails);
          setBankForm(data.bankDetails);
        }
      }
    } catch (err) {
      console.error('Failed to fetch bank details:', err);
    }
  };

  const fetchSalaryHistory = async () => {
    try {
      const token = localStorage.getItem('hr_system_token');
      if (!token) return;
      const res = await fetch('/api/payroll/salary/revision?status=Approved', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Filter to only show this employee's revisions
        const myRevisions = Array.isArray(data) 
          ? data.filter((r: any) => r.employeeEmail === profile.email).slice(0, 5)
          : [];
        setSalaryHistory(myRevisions);
      }
    } catch (err) {
      console.error('Failed to fetch salary history:', err);
    }
  };

  const handleSaveBankDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingBank(true);
    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/payroll/bank', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email: profile.email,
          bankDetails: bankForm
        })
      });
      if (res.ok) {
        const data = await res.json();
        setBankDetails(data.bankDetails);
        setIsEditingBank(false);
      }
    } catch (err) {
      console.error('Failed to save bank details:', err);
    } finally {
      setIsSavingBank(false);
    }
  };

  const fetchClaims = async () => {
    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`/api/reimbursement?email=${profile.email}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setClaims(data);
      }
    } catch (err) {
      console.error('Failed to fetch reimbursement claims:', err);
    }
  };

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimForm.amount || !claimForm.description) return;
    setIsSubmittingClaim(true);
    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/reimbursement', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          employee: profile.email,
          name: profile.name || 'Rahul Sharma',
          ...claimForm,
          amount: Number(claimForm.amount)
        })
      });
      if (res.ok) {
        setClaimForm({
          type: 'Travel',
          amount: '',
          claimDate: new Date().toISOString().split('T')[0],
          description: '',
          receiptUrl: ''
        });
        await fetchClaims();
      }
    } catch (err) {
      console.error('Failed to submit reimbursement claim:', err);
    } finally {
      setIsSubmittingClaim(false);
    }
  };

  const grossEarnings = (activeEmployeeRecord.basic || 0) + (activeEmployeeRecord.hra || 0) + 
    (activeEmployeeRecord.medicalAllowance || 0) + (activeEmployeeRecord.travelAllowance || 0) +
    (activeEmployeeRecord.specialAllowance || activeEmployeeRecord.allowance || 0) + 
    (activeEmployeeRecord.otherEarnings || 0) + (activeEmployeeRecord.bonus || 0) + (activeEmployeeRecord.overtime || 0);
  const totalDeductions = (activeEmployeeRecord.tds || activeEmployeeRecord.tax || 0) + 
    (activeEmployeeRecord.pf || 0) + (activeEmployeeRecord.esi || 0) + 
    (activeEmployeeRecord.professionalTax || 0) + (activeEmployeeRecord.otherDeductions || 0);
  const monthlyCTC = grossEarnings + (activeEmployeeRecord.pf || 0);
  const annualCTC = monthlyCTC * 12;

  return (
    <div className="space-y-8 text-left">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Salary & Compensations</h1>
          <p className="text-xs font-semibold text-slate-400 mt-1">Securely view your monthly earnings breakdown and download payslips.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setSelectedPayslip(activeEmployeeRecord)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
          >
            <Printer className="w-4 h-4" />
            View Printable Payslip
          </button>
        </div>
      </div>

      {/* Current Month Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Net Pay Card */}
        <div className="saas-card lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-3xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 bg-blue-600/[0.02] rounded-full blur-2xl transition-transform hover:scale-150 pointer-events-none" />
          <div className="relative z-10 flex flex-col justify-between h-full min-h-[180px]">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/40 rounded-xl w-fit">
                  <Wallet className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 border bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                  Salary Released
                </span>
              </div>
              <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400 mb-1">Net Take-Home Pay ({activeEmployeeRecord.month})</p>
              <h3 className="text-3.5xl font-black tracking-tight text-slate-900 dark:text-white">
                ₹{activeEmployeeRecord.net.toLocaleString()}
              </h3>
            </div>
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex justify-between items-center text-xs font-bold text-slate-400">
              <span>Gross Earned: ₹{grossEarnings.toLocaleString()}</span>
              <span>Tax/PF: ₹{totalDeductions.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Paid Leaves Left Card */}
        <div className="saas-card lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-3xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 bg-blue-600/[0.02] rounded-full blur-2xl transition-transform hover:scale-150 pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="p-3 bg-blue-105 dark:bg-blue-900/40 rounded-xl w-fit">
                <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 border bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 border-blue-100 dark:border-blue-900/40">
                Leaves Balance
              </span>
            </div>
            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400 mb-1">
              Paid Leaves Left (CY 2024)
            </p>
            <div className="flex items-baseline gap-2 mb-2">
              <h3 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                14
              </h3>
              <span className="text-xs font-bold text-slate-400">/ 20 Days Left</span>
            </div>
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-2 mt-4">
              <div className="h-full bg-blue-600 rounded-full animate-pulse" style={{ width: '70%' }} />
            </div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">70% of leave quota available</p>
          </div>
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 relative z-10 flex justify-between items-center text-xs font-bold text-slate-400">
            <span>Total Paid Quota: 20 Days</span>
            <span className="text-emerald-500 font-extrabold">Used: 6 Days</span>
          </div>
        </div>

        {/* Compact Salary Breakdown Card */}
        <div className="saas-card lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-3xl p-6 flex flex-col justify-between min-h-[260px]">
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Percent className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Salary Breakdown</h4>
            </div>
            <div className="space-y-1.5">
              {[
                { label: 'Basic Pay', value: activeEmployeeRecord.basic || 0, color: 'text-slate-700 dark:text-white' },
                { label: 'HRA', value: activeEmployeeRecord.hra || 0, color: 'text-slate-600' },
                { label: 'Medical Allowance', value: activeEmployeeRecord.medicalAllowance || 0, color: 'text-slate-600' },
                { label: 'Travel Allowance', value: activeEmployeeRecord.travelAllowance || 0, color: 'text-slate-600' },
                { label: 'Special Allowance', value: activeEmployeeRecord.specialAllowance || activeEmployeeRecord.allowance || 0, color: 'text-slate-600' },
                { label: 'Bonus', value: activeEmployeeRecord.bonus || 0, color: 'text-slate-600' },
              ].map(r => r.value > 0 && (
                <div key={r.label} className="flex justify-between text-xs font-bold">
                  <span className="text-slate-500">{r.label}</span>
                  <span className={r.color}>₹{r.value.toLocaleString()}</span>
                </div>
              ))}
              <div className="flex justify-between text-xs font-bold border-t border-dashed border-slate-200 dark:border-slate-800 pt-2 mt-1">
                <span className="text-slate-500">PF + ESI + Tax</span>
                <span className="text-rose-500 font-extrabold">-₹{totalDeductions.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-400">Monthly CTC</span>
              <span className="text-blue-600 font-black">₹{monthlyCTC.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-400">Annual CTC</span>
              <span className="text-purple-600 font-black">₹{annualCTC.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Salary History Timeline — only if there is history */}
      {salaryHistory.length > 0 && (
        <div className="saas-card bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-3xl p-6">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-xl"><History className="w-4 h-4 text-purple-600" /></div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Salary History</h3>
              <p className="text-[8px] text-slate-400 font-bold mt-0.5">Your past salary revisions and increments.</p>
            </div>
          </div>
          <div className="space-y-3">
            {salaryHistory.map((rev, i) => {
              const isPositive = (rev.incrementAmount || 0) >= 0;
              return (
                <div key={rev._id} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", isPositive ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-rose-100 dark:bg-rose-900/30')}>
                    {isPositive ? <ArrowUpRight className="w-4 h-4 text-emerald-600" /> : <ArrowDownRight className="w-4 h-4 text-rose-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[11px] font-black text-slate-900 dark:text-white">{rev.revisionType}</p>
                      <span className={cn("text-[9px] font-black", isPositive ? 'text-emerald-600' : 'text-rose-500')}>
                        {isPositive ? '+' : ''}₹{Math.abs(rev.incrementAmount || 0).toLocaleString()}/mo ({isPositive ? '+' : ''}{rev.incrementPercent}%)
                      </span>
                    </div>
                    <p className="text-[8.5px] text-slate-400 mt-0.5">{rev.reason}</p>
                    <p className="text-[8px] text-slate-400 mt-0.5">Effective: {new Date(rev.effectiveDate).toLocaleDateString('en-IN')}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[9px] font-black text-blue-600">₹{(rev.newSalary?.monthlyCTC || 0).toLocaleString()}</p>
                    <p className="text-[7.5px] text-slate-400">New CTC</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bank Account Settings Card */}
      <div className="saas-card bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-3xl p-8 relative overflow-hidden group my-8">
        <div className="absolute top-0 right-0 w-64 h-64 -mr-16 -mt-16 bg-blue-600/[0.01] rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-2xl text-blue-600 dark:text-blue-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Bank Account Details</h3>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5">Your primary bank details used for monthly salary payouts.</p>
              </div>
            </div>
            
            {!isEditingBank && bankDetails && (
              <button 
                onClick={() => {
                  setBankForm(bankDetails);
                  setIsEditingBank(true);
                }}
                className="print-action-btn px-3 py-1.5 border rounded-lg text-[8.5px] font-black uppercase tracking-widest transition-all active:scale-95 cursor-pointer"
              >
                Update Bank Details
              </button>
            )}
          </div>

          {/* Display / Form Mode */}
          {isEditingBank || !bankDetails ? (
            <form onSubmit={handleSaveBankDetails} className="mt-6 space-y-6 max-w-2xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[9px] font-black text-slate-455 uppercase tracking-widest mb-2">Account Holder Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Enter Account Holder Name"
                    className="saas-input w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white border border-slate-150/40 rounded-xl outline-none focus:border-blue-500/50"
                    value={bankForm.accountHolderName}
                    onChange={(e) => setBankForm({ ...bankForm, accountHolderName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-455 uppercase tracking-widest mb-2">Bank Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Enter Bank Name"
                    className="saas-input w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white border border-slate-150/40 rounded-xl outline-none focus:border-blue-500/50"
                    value={bankForm.bankName}
                    onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-455 uppercase tracking-widest mb-2">Account Number</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Enter Account Number"
                    className="saas-input w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white border border-slate-150/40 rounded-xl outline-none focus:border-blue-500/50"
                    value={bankForm.accountNumber}
                    onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-455 uppercase tracking-widest mb-2">IFSC Code</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Enter IFSC Code"
                    className="saas-input w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white border border-slate-150/40 rounded-xl outline-none focus:border-blue-500/50"
                    value={bankForm.ifscCode}
                    onChange={(e) => setBankForm({ ...bankForm, ifscCode: e.target.value.toUpperCase() })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button 
                  type="submit" 
                  disabled={isSavingBank}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                >
                  {isSavingBank ? 'Saving...' : 'Save Bank Details'}
                </button>
                {bankDetails && (
                  <button 
                    type="button" 
                    onClick={() => setIsEditingBank(false)}
                    className="px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-350 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          ) : (
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Account Holder</p>
                <p className="text-sm font-black text-slate-900 dark:text-white mt-1.5">{bankDetails.accountHolderName}</p>
              </div>
              <div>
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Bank Name</p>
                <p className="text-sm font-black text-slate-900 dark:text-white mt-1.5">{bankDetails.bankName}</p>
              </div>
              <div>
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Account Number</p>
                <p className="text-sm font-black text-slate-900 dark:text-white mt-1.5 font-mono">
                  •••• •••• •••• {bankDetails.accountNumber.slice(-4)}
                </p>
              </div>
              <div>
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">IFSC Code</p>
                <p className="text-sm font-black text-slate-900 dark:text-white mt-1.5 font-mono uppercase">{bankDetails.ifscCode}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Expense Reimbursements Segment */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 my-8">
        {/* Submit Claim Form */}
        <div className="saas-card lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-800/80 mb-4">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Submit Reimbursement</h3>
                <p className="text-[8px] font-bold text-slate-400 mt-0.5">File expense claims for verification.</p>
              </div>
            </div>

            <form onSubmit={handleSubmitClaim} className="space-y-4">
              <div>
                <label className="block text-[8px] font-black text-slate-455 uppercase tracking-widest mb-1">Expense Type</label>
                <select 
                  className="saas-input w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white border border-slate-150/40 rounded-xl outline-none"
                  value={claimForm.type}
                  onChange={(e) => setClaimForm({ ...claimForm, type: e.target.value })}
                >
                  <option value="Travel">Travel expenses</option>
                  <option value="Food">Food claims</option>
                  <option value="Medical">Medical bills</option>
                  <option value="Office">Office expenses</option>
                  <option value="Other">Other rewards</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[8px] font-black text-slate-455 uppercase tracking-widest mb-1">Amount (₹)</label>
                  <input 
                    type="number"
                    required
                    placeholder="e.g. 1500"
                    className="saas-input w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-xs font-bold border border-slate-150/40 rounded-xl outline-none"
                    value={claimForm.amount}
                    onChange={(e) => setClaimForm({ ...claimForm, amount: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[8px] font-black text-slate-455 uppercase tracking-widest mb-1">Date</label>
                  <input 
                    type="date"
                    required
                    className="saas-input w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-xs font-bold border border-slate-150/40 rounded-xl outline-none"
                    value={claimForm.claimDate}
                    onChange={(e) => setClaimForm({ ...claimForm, claimDate: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[8px] font-black text-slate-455 uppercase tracking-widest mb-1">Description</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Travel tickets to client office"
                  className="saas-input w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-xs font-bold border border-slate-150/40 rounded-xl outline-none"
                  value={claimForm.description}
                  onChange={(e) => setClaimForm({ ...claimForm, description: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[8px] font-black text-slate-455 uppercase tracking-widest mb-1">Receipt URL / Link (Optional)</label>
                <input 
                  type="url"
                  placeholder="e.g. https://drive.google.com/..."
                  className="saas-input w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-xs font-bold border border-slate-150/40 rounded-xl outline-none"
                  value={claimForm.receiptUrl}
                  onChange={(e) => setClaimForm({ ...claimForm, receiptUrl: e.target.value })}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingClaim}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer shadow-lg shadow-blue-500/10 active:scale-95 transition-all"
              >
                {isSubmittingClaim ? 'Submitting...' : 'Submit Claim'}
              </button>
            </form>
          </div>
        </div>

        {/* Claims List */}
        <div className="saas-card lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-3xl p-6 flex flex-col justify-between overflow-hidden">
          <div>
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800/80 mb-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white font-sans">Reimbursement History</h3>
              <span className="text-[8px] font-black bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded uppercase tracking-wider">{claims.length} Claims</span>
            </div>

            <div className="overflow-y-auto max-h-[290px] space-y-3 pr-1">
              {claims.length === 0 ? (
                <div className="py-20 text-center text-xs font-bold text-slate-400 italic">No reimbursement claims filed.</div>
              ) : (
                claims.map((claim) => (
                  <div key={claim._id} className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-slate-200/60 dark:bg-slate-800 text-slate-655 dark:text-slate-450 rounded text-[7.5px] font-black uppercase tracking-widest">
                          {claim.type}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400">{claim.claimDate}</span>
                      </div>
                      <p className="text-[11px] font-black text-slate-805 dark:text-slate-200 truncate mt-1">{claim.description}</p>
                      {claim.comment && (
                        <p className="text-[8.5px] font-semibold text-rose-500 mt-0.5">HR comment: {claim.comment}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-slate-900 dark:text-white">₹{claim.amount.toLocaleString()}</span>
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                        claim.status === 'Approved' ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-500" :
                        claim.status === 'Rejected' ? "bg-rose-50 text-rose-600 dark:bg-rose-955/20 dark:text-rose-500" :
                        "bg-amber-50 text-amber-600 dark:bg-amber-955/20 dark:text-amber-500"
                      )}>
                        {claim.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Historical Payslips Repository */}
      <div className="saas-card bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 dark:border-slate-850 flex justify-between items-center">
          <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Historical Payslips</h3>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{employeePayrollData.length} Payslips</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-850">
                <th className="px-6 py-4.5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Pay Cycle</th>
                <th className="px-6 py-4.5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Gross Salary</th>
                <th className="px-6 py-4.5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Deductions</th>
                <th className="px-6 py-4.5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Net take-home</th>
                <th className="px-6 py-4.5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                <th className="px-6 py-4.5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {employeePayrollData.map((row) => {
                const gross = row.basic + (row.hra || 0) + (row.allowance || 0) + (row.bonus || 0) + (row.overtime || 0);
                const ded = (row.tax || 0) + (row.pf || 0) + (row.esi || 0) + (row.otherDeductions || 0);
                
                return (
                  <tr 
                    key={row._id}
                    className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-all"
                  >
                    <td className="px-6 py-4.5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center font-black text-blue-600 dark:text-blue-400 text-xs shadow-sm">
                          <Landmark className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white text-sm">{row.month}</p>
                          <p className="text-[8px] text-slate-400 font-extrabold uppercase tracking-widest">Released: {new Date(row.updatedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4.5">
                      <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">₹{gross.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4.5">
                      <span className="text-sm font-semibold text-rose-500 dark:text-rose-400">-₹{ded.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4.5">
                      <span className="text-base font-black text-slate-900 dark:text-white">₹{row.net.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4.5">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest inline-flex items-center gap-2",
                        row.status === 'Paid' ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-500" : "bg-amber-50 dark:bg-amber-955/20 text-amber-600 dark:text-amber-500"
                      )}>
                        <div className={cn("w-1.5 h-1.5 rounded-full", row.status === 'Paid' ? "bg-emerald-500" : "bg-amber-500")} />
                        {row.status}
                      </span>
                    </td>
                    <td className="px-6 py-4.5">
                      <button 
                        onClick={() => setSelectedPayslip(row)}
                        className="print-action-btn flex items-center gap-1.5 px-2.5 py-1 border rounded-lg text-[8.5px] font-black uppercase tracking-widest transition-all active:scale-95 cursor-pointer"
                      >
                        <Printer className="w-3 h-3" />
                        Payslip
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
