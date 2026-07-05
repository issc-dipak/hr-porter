"use client";

import React, { useState, useEffect } from 'react';
import { Printer, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useBrandingStore } from '@/store/useBrandingStore';

interface PayslipModalProps {
  slip: any;
  onClose: () => void;
}

export default function PayslipModal({ slip, onClose }: PayslipModalProps) {
  const [empDetails, setEmpDetails] = useState<any>(null);
  const { branding } = useBrandingStore();

  useEffect(() => {
    const fetchEmp = async () => {
      try {
        const token = localStorage.getItem('hr_system_token');
        const headers: HeadersInit = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        const res = await fetch('/api/employees', { headers });
        if (res.ok) {
          const list = await res.json();
          const match = list.find((e: any) => e.email === slip.employee || e.fullName === slip.employeeName);
          if (match) {
            setEmpDetails(match);
          }
        }
      } catch (err) {
        console.error("Failed to fetch employee details for payslip modal:", err);
      }
    };
    fetchEmp();
  }, [slip.employee, slip.employeeName]);

  const handlePrint = () => {
    window.print();
  };

  const basicVal = Number(slip.basic || slip.basicSalary || 0);
  const hraVal = Number(slip.hra || 0);
  const allowanceVal = Number(slip.allowance || slip.allowances || 0);
  const bonusVal = Number(slip.bonus || 0);
  const overtimeVal = Number(slip.overtime || 0);

  const pfVal = Number(slip.pf || 0);
  const esiVal = Number(slip.esi || 0);
  const taxVal = Number(slip.tax || slip.tds || 0);
  const lopVal = Number(slip.leaveDeductions || 0);
  const otherDeductVal = Number(slip.otherDeductions || 0);

  const grossEarnings = basicVal + hraVal + allowanceVal + bonusVal + overtimeVal;
  const totalDeductions = pfVal + esiVal + taxVal + lopVal + otherDeductVal;
  const netDisbursed = Number(slip.net || slip.netSalary || (grossEarnings - totalDeductions));

  const numberToWords = (num: number): string => {
    if (num === 0) return 'Zero Rupees Only';
    const a = [
      '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
      'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
    ];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    const convertLessThanThousand = (n: number): string => {
      if (n === 0) return '';
      if (n < 20) return a[n] + ' ';
      const temp = n % 100;
      if (temp < 20) {
        return a[Math.floor(n / 100)] + (n >= 100 ? ' Hundred ' : '') + a[temp] + ' ';
      }
      return a[Math.floor(n / 100)] + (n >= 100 ? ' Hundred ' : '') + b[Math.floor(temp / 10)] + ' ' + a[temp % 10] + ' ';
    };
    
    let word = '';
    let tempNum = Math.floor(num);
    
    if (tempNum >= 10000000) {
      word += convertLessThanThousand(Math.floor(tempNum / 10000000)) + 'Crore ';
      tempNum %= 10000000;
    }
    if (tempNum >= 100000) {
      word += convertLessThanThousand(Math.floor(tempNum / 100000)) + 'Lakh ';
      tempNum %= 100000;
    }
    if (tempNum >= 1000) {
      word += convertLessThanThousand(Math.floor(tempNum / 1000)) + 'Thousand ';
      tempNum %= 1000;
    }
    if (tempNum > 0) {
      word += convertLessThanThousand(tempNum);
    }
    
    return word.trim() + ' Rupees Only';
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4 print:p-0 print:bg-white print:static overflow-y-auto">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-slip, .printable-slip * {
            visibility: visible;
          }
          .printable-slip {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            background: white !important;
            color: black !important;
          }
          .print-hidden {
            display: none !important;
          }
        }
      `}} />
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="printable-slip w-full max-w-lg rounded-2xl p-4 shadow-2xl relative max-h-[92vh] overflow-y-auto print:max-h-full print:shadow-none print:p-0 print:rounded-none border border-slate-150/40 dark:border-slate-800/85 scrollbar-thin scrollbar-thumb-slate-205 dark:scrollbar-thumb-slate-800"
      >
        {/* Controls (Hidden in Print) */}
        <div className="print-hidden flex justify-between items-center pb-2.5 border-b border-slate-100 dark:border-slate-800 mb-3.5 print:hidden">
          <span className="text-[7.5px] font-black uppercase tracking-widest bg-blue-50 text-blue-650 dark:bg-slate-800 dark:text-blue-400 px-2 py-0.5 rounded-md">Payslip Preview</span>
          <div className="flex items-center gap-2">
            <button 
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-600 hover:bg-blue-755 text-white rounded-lg text-[7.5px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> Print / Save PDF
            </button>
            <button 
              onClick={onClose}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

        {/* PRINTABLE PAYSLIP CONTAINER */}
        <div className="space-y-3.5 text-slate-850 dark:text-slate-100 print:text-black">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-2 pb-2.5 border-b border-slate-200 dark:border-slate-805">
            <div className="text-left space-y-0.5">
              <div className="flex items-center gap-1.5">
                {branding.companyLogo ? (
                  <img src={branding.companyLogo} alt="Logo" className="h-6 w-auto object-contain" />
                ) : (
                  <div className="w-6.5 h-6.5 bg-blue-650 rounded-lg flex items-center justify-center font-black text-white text-[10px] print:bg-black">
                    {branding.companyShortName ? branding.companyShortName.substring(0,2).toUpperCase() : 'HC'}
                  </div>
                )}
                <div>
                  <h1 className="text-xs font-black tracking-tight text-slate-900 dark:text-white print:text-black uppercase">
                    {branding.companyName || 'HR CORE SYSTEMS INC.'}
                  </h1>
                  <p className="text-[6.5px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    {branding.companyTagline || 'ISO 27001 & 9001 Certified Enterprise Portal'}
                  </p>
                </div>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <h2 className="text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">PAY SLIP & ADVICE</h2>
              <p className="text-xs font-black text-blue-650 print:text-black uppercase mt-0.5">{slip.month}</p>
              <p className="text-[6.5px] font-mono text-slate-400 uppercase">SLIP ID: SLIP-{slip._id?.slice(-8).toUpperCase() || 'MOCK'}</p>
            </div>
          </div>

          {/* Personnel Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-2.5 gap-y-2 p-2.5 bg-slate-50/50 dark:bg-slate-850/30 rounded-lg border border-slate-100 dark:border-slate-800 print:bg-white print:border-none print:p-0">
            <div className="space-y-0.5 text-left">
              <span className="text-[6.5px] font-black text-slate-400 uppercase tracking-wider">Employee Name</span>
              <p className="text-[9.5px] font-black text-slate-800 dark:text-white print:text-black uppercase">{slip.employeeName}</p>
            </div>
            <div className="space-y-0.5 text-left">
              <span className="text-[6.5px] font-black text-slate-400 uppercase tracking-wider">Designation</span>
              <p className="text-[9.5px] font-semibold text-slate-655 dark:text-slate-350">{empDetails?.designation || slip.designation || 'Staff Member'}</p>
            </div>
            <div className="space-y-0.5 text-left">
              <span className="text-[6.5px] font-black text-slate-400 uppercase tracking-wider">Department</span>
              <p className="text-[9.5px] font-semibold text-slate-655 dark:text-slate-350">{empDetails?.department || slip.department || 'Operations'}</p>
            </div>
            <div className="space-y-0.5 text-left">
              <span className="text-[6.5px] font-black text-slate-400 uppercase tracking-wider">Employee Email</span>
              <p className="text-[9.5px] font-semibold text-slate-655 dark:text-slate-350 truncate">{slip.employee}</p>
            </div>

            <div className="space-y-0.5 text-left border-t border-slate-100 dark:border-slate-800/40 pt-1 md:border-t-0 md:pt-0">
              <span className="text-[6.5px] font-black text-slate-400 uppercase tracking-wider">Bank Account Info</span>
              <p className="text-[9.5px] font-semibold text-slate-655 dark:text-slate-350 uppercase">{empDetails?.bankName || 'HDFC Bank Ltd'}</p>
              <p className="text-[8px] text-slate-450 font-mono">A/c: ****{empDetails?.accountNumber?.slice(-4) || '7890'}</p>
            </div>
            <div className="space-y-0.5 text-left border-t border-slate-100 dark:border-slate-800/40 pt-1 md:border-t-0 md:pt-0">
              <span className="text-[6.5px] font-black text-slate-400 uppercase tracking-wider">IFSC Code</span>
              <p className="text-[9.5px] font-semibold text-slate-655 dark:text-slate-350 font-mono">{empDetails?.ifscCode || 'HDFC0001234'}</p>
            </div>
            <div className="space-y-0.5 text-left border-t border-slate-100 dark:border-slate-800/40 pt-1 md:border-t-0 md:pt-0">
              <span className="text-[6.5px] font-black text-slate-400 uppercase tracking-wider">UAN / PF Number</span>
              <p className="text-[9.5px] font-semibold text-slate-655 dark:text-slate-350 font-mono">UAN-10098{slip._id?.slice(-5) || '4029'}</p>
            </div>
            <div className="space-y-0.5 text-left border-t border-slate-100 dark:border-slate-800/40 pt-1 md:border-t-0 md:pt-0">
              <span className="text-[6.5px] font-black text-slate-400 uppercase tracking-wider">Month Paid Days</span>
              <p className="text-[9.5px] font-semibold text-slate-655 dark:text-slate-350">{slip.workingDays || 30} / 30 Days</p>
            </div>
          </div>

          {/* Calculations details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Earnings */}
            <div className="border border-slate-150/40 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
              <div className="bg-slate-50 dark:bg-slate-850 px-2.5 py-1 border-b border-slate-150/40 text-left">
                <span className="text-[7.5px] font-black uppercase tracking-widest text-slate-900 dark:text-white print:text-black">Earnings Summary</span>
              </div>
              <div className="p-2.5 space-y-1 text-[9.5px] text-left">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-500">Basic Salary (Adjusted):</span>
                  <span className="text-slate-800 dark:text-white print:text-black font-bold">₹{basicVal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-500">House Rent Allowance (HRA):</span>
                  <span className="text-slate-800 dark:text-white print:text-black font-bold">₹{hraVal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-500">Special Allowances:</span>
                  <span className="text-slate-800 dark:text-white print:text-black font-bold">₹{allowanceVal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-500">Performance Bonus:</span>
                  <span className="text-slate-800 dark:text-white print:text-black font-bold">₹{bonusVal.toLocaleString()}</span>
                </div>
                {overtimeVal > 0 && (
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-500">Overtime Payout:</span>
                    <span className="text-slate-800 dark:text-white print:text-black font-bold">₹{overtimeVal.toLocaleString()}</span>
                  </div>
                )}
                <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800/80 flex justify-between font-black text-slate-900 dark:text-white print:text-black">
                  <span>Gross Salary:</span>
                  <span>₹{grossEarnings.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Deductions */}
            <div className="border border-slate-150/40 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
              <div className="bg-slate-50 dark:bg-slate-850 px-2.5 py-1 border-b border-slate-150/40 text-left">
                <span className="text-[7.5px] font-black uppercase tracking-widest text-slate-900 dark:text-white print:text-black">Statutory Deductions</span>
              </div>
              <div className="p-2.5 space-y-1 text-[9.5px] text-left">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-500">Provident Fund (PF):</span>
                  <span className="text-rose-500 font-bold">₹{pfVal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-500">ESI Contribution:</span>
                  <span className="text-rose-500 font-bold">₹{esiVal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-500">TDS Income Tax:</span>
                  <span className="text-rose-500 font-bold">₹{taxVal.toLocaleString()}</span>
                </div>
                {lopVal > 0 && (
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-500">LOP Days Deductions:</span>
                    <span className="text-rose-500 font-bold">₹{lopVal.toLocaleString()}</span>
                  </div>
                )}
                {otherDeductVal > 0 && (
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-500">Other Deductions:</span>
                    <span className="text-rose-500 font-bold">₹{otherDeductVal.toLocaleString()}</span>
                  </div>
                )}
                <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800/80 flex justify-between font-black text-rose-600 dark:text-rose-500 print:text-black">
                  <span>Total Deductions:</span>
                  <span>₹{totalDeductions.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Final Net Pay Gradient Banner */}
          <div className="p-3 bg-slate-900 dark:bg-blue-900/20 text-white dark:text-blue-100 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 print:bg-white print:text-black print:border-y-2 print:border-black print:rounded-none print:p-2.5">
            <div className="text-left space-y-0.5">
              <p className="text-[7px] font-black uppercase tracking-widest text-slate-400 dark:text-blue-300">NET DISBURSED AMOUNT</p>
              <p className="text-[8.5px] font-black text-slate-300 dark:text-blue-200">{numberToWords(netDisbursed)}</p>
              <p className="text-[7px] font-bold text-slate-450 dark:text-slate-450 italic">Credited directly to the salary bank account above</p>
            </div>
            <div className="text-right w-full sm:w-auto border-t sm:border-t-0 pt-1.5 sm:pt-0 border-slate-800 flex sm:flex-col justify-between sm:justify-start items-center sm:items-end">
              <span className="text-[7px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">Disbursed net</span>
              <h3 className="text-base font-black text-white print:text-black">₹{netDisbursed.toLocaleString()}</h3>
            </div>
          </div>

          {/* Corporate note and Disclaimers */}
          <div className="flex justify-between items-end pt-2 text-[7.5px] font-bold text-slate-400 dark:text-slate-500">
            <div className="text-left">
              <p className="uppercase tracking-wider">Corporate Systems Protocol</p>
              {branding.companyAddress && (
                <p className="text-slate-400 font-medium uppercase mt-0.5 max-w-xs">{branding.companyAddress}</p>
              )}
              <p className="text-slate-800 dark:text-slate-200 print:text-black font-black mt-0.5">
                Certified Secure by {branding.companyShortName || 'HR Core'} Portal Finance Team
              </p>
            </div>
            <div className="text-right border-t border-slate-200 dark:border-slate-800 pt-1 w-36">
              <p className="text-slate-800 dark:text-slate-200 print:text-black font-black">Authorized Digital Signature</p>
              <p className="text-[6.5px] font-medium mt-0.5">No physical signature required</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
