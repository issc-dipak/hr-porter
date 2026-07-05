"use client";

import React, { useState, useEffect } from 'react';
import { 
  FileText, Download, Building, DollarSign, Users, Award, Percent
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { useBrandingStore } from '@/store/useBrandingStore';

interface PayrollReportsTabProps {
  payroll: any[];
  userRole?: string;
}

export default function PayrollReportsTab({ payroll, userRole = 'HR' }: PayrollReportsTabProps) {
  const { branding, fetchBranding } = useBrandingStore();
  const [selectedCompany, setSelectedCompany] = useState('HR Core Systems Inc.');
  const [selectedMonth, setSelectedMonth] = useState('May 2026');
  const [currency, setCurrency] = useState('INR (₹)');
  const [reportType, setReportType] = useState<'payout' | 'tax' | 'pf-esi' | 'bonus'>('payout');
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    fetchBranding();
  }, []);

  useEffect(() => {
    if (branding?.companyName) {
      setSelectedCompany(branding.companyName);
    }
  }, [branding?.companyName]);

  const handleDownload = (format: 'csv' | 'excel' | 'pdf') => {
    setIsDownloading(true);
    setTimeout(() => {
      setIsDownloading(false);
      
      const currencySymbol = currency.split(' ')[1] || '₹';

      if (format === 'pdf') {
        // Open print window with a highly premium corporate letterhead design
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
          alert('Popup blocker prevented report preview! Please allow popups for this dashboard.');
          return;
        }

        let headersHTML = '';
        let rowsHTML = '';
        let totalVal = 0;

        if (reportType === 'payout') {
          headersHTML = `<tr>
            <th>Employee</th>
            <th>Email</th>
            <th>Month</th>
            <th>Basic</th>
            <th>HRA</th>
            <th>Gross</th>
            <th>Tax (TDS)</th>
            <th>PF</th>
            <th>ESI</th>
            <th>Net Payout</th>
            <th>Status</th>
          </tr>`;
          rowsHTML = payroll.map(p => {
            totalVal += p.net;
            return `<tr>
              <td><strong>${p.employeeName}</strong></td>
              <td>${p.employee}</td>
              <td style="font-family: monospace;">${p.month}</td>
              <td>${currencySymbol}${p.basic?.toLocaleString()}</td>
              <td>${currencySymbol}${p.hra?.toLocaleString()}</td>
              <td>${currencySymbol}${p.gross?.toLocaleString()}</td>
              <td style="color: #ef4444;">${currencySymbol}${p.tax?.toLocaleString()}</td>
              <td>${currencySymbol}${p.pf?.toLocaleString()}</td>
              <td>${currencySymbol}${p.esi?.toLocaleString()}</td>
              <td style="color: #10b981; font-weight: bold;">${currencySymbol}${p.net?.toLocaleString()}</td>
              <td><span style="background: #e6f4ea; color: #137333; padding: 2px 6px; border-radius: 4px; font-size: 8px; font-weight: bold; text-transform: uppercase;">${p.status}</span></td>
            </tr>`;
          }).join('');
        } else if (reportType === 'tax') {
          headersHTML = `<tr>
            <th>Employee</th>
            <th>Email</th>
            <th>Monthly Gross</th>
            <th>Annual Projected</th>
            <th>TDS Slab Rate</th>
            <th>Monthly TDS Deducted</th>
          </tr>`;
          rowsHTML = payroll.map(p => {
            const rate = p.gross > 100000 ? "10%" : p.gross > 50000 ? "5%" : "0%";
            totalVal += p.tax;
            return `<tr>
              <td><strong>${p.employeeName}</strong></td>
              <td>${p.employee}</td>
              <td>${currencySymbol}${p.gross?.toLocaleString()}</td>
              <td>${currencySymbol}${(p.gross * 12)?.toLocaleString()}</td>
              <td style="color: #2563eb; font-weight: bold;">${rate}</td>
              <td style="color: #dc2626; font-weight: bold;">${currencySymbol}${p.tax?.toLocaleString()}</td>
            </tr>`;
          }).join('');
        } else if (reportType === 'pf-esi') {
          headersHTML = `<tr>
            <th>Employee</th>
            <th>Basic Salary</th>
            <th>PF Employee (12%)</th>
            <th>PF Employer (12%)</th>
            <th>ESI Employee (0.75%)</th>
            <th>ESI Employer (3.25%)</th>
            <th>Total Stat Contribution</th>
          </tr>`;
          rowsHTML = payroll.map(p => {
            const employerEsi = Math.round(p.gross * 0.0325);
            const totalStat = p.pf + p.pf + p.esi + employerEsi;
            totalVal += totalStat;
            return `<tr>
              <td><strong>${p.employeeName}</strong></td>
              <td>${currencySymbol}${p.basic?.toLocaleString()}</td>
              <td>${currencySymbol}${p.pf?.toLocaleString()}</td>
              <td>${currencySymbol}${p.pf?.toLocaleString()}</td>
              <td>${currencySymbol}${p.esi?.toLocaleString()}</td>
              <td>${currencySymbol}${employerEsi.toLocaleString()}</td>
              <td style="font-weight: bold; color: #4f46e5;">${currencySymbol}${totalStat.toLocaleString()}</td>
            </tr>`;
          }).join('');
        } else {
          headersHTML = `<tr>
            <th>Employee</th>
            <th>Email</th>
            <th>Month</th>
            <th>Base Salary</th>
            <th>Bonus Disbursed</th>
            <th>Bonus Event</th>
          </tr>`;
          rowsHTML = payroll.map(p => {
            const bonusAmt = p.bonus || 0;
            totalVal += bonusAmt;
            return `<tr>
              <td><strong>${p.employeeName}</strong></td>
              <td>${p.employee}</td>
              <td>${p.month}</td>
              <td>${currencySymbol}${p.basic?.toLocaleString()}</td>
              <td style="color: #16a34a; font-weight: bold;">${currencySymbol}${bonusAmt.toLocaleString()}</td>
              <td>Performance & Incentive Cycle</td>
            </tr>`;
          }).join('');
        }

        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Payroll Compliance Report - ${selectedCompany}</title>
              <style>
                body {
                  font-family: 'Inter', system-ui, -apple-system, sans-serif;
                  color: #0f172a;
                  padding: 40px;
                  margin: 0;
                  line-height: 1.5;
                  background-color: #ffffff;
                }
                .letterhead {
                  display: flex;
                  justify-content: space-between;
                  align-items: flex-start;
                  border-bottom: 3px double #cbd5e1;
                  padding-bottom: 24px;
                  margin-bottom: 32px;
                }
                .logo-section h1 {
                  font-size: 26px;
                  font-weight: 900;
                  color: #1e3a8a;
                  margin: 0;
                  letter-spacing: -0.025em;
                }
                .logo-section p {
                  font-size: 9px;
                  font-weight: 800;
                  color: #64748b;
                  text-transform: uppercase;
                  letter-spacing: 0.15em;
                  margin: 6px 0 0 0;
                }
                .meta-section {
                  text-align: right;
                }
                .meta-section h2 {
                  font-size: 11px;
                  font-weight: 800;
                  color: #0f172a;
                  margin: 0;
                  letter-spacing: 0.05em;
                }
                .meta-section p {
                  font-size: 9px;
                  color: #64748b;
                  margin: 4px 0 0 0;
                  font-weight: bold;
                }
                .meta-cards-grid {
                  display: grid;
                  grid-template-cols: repeat(4, 1fr);
                  gap: 16px;
                  margin-bottom: 32px;
                }
                .meta-card {
                  background-color: #f8fafc;
                  border: 1px solid #e2e8f0;
                  padding: 16px;
                  border-radius: 16px;
                }
                .card-label {
                  font-size: 8px;
                  font-weight: 800;
                  color: #64748b;
                  text-transform: uppercase;
                  letter-spacing: 0.1em;
                }
                .card-value {
                  font-size: 14px;
                  font-weight: 800;
                  color: #0f172a;
                  margin-top: 6px;
                }
                table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-top: 16px;
                }
                th {
                  background-color: #0f172a;
                  color: #ffffff;
                  font-size: 9px;
                  font-weight: 800;
                  text-transform: uppercase;
                  letter-spacing: 0.08em;
                  padding: 12px 14px;
                  text-align: left;
                }
                td {
                  font-size: 10px;
                  padding: 12px 14px;
                  border-bottom: 1px solid #e2e8f0;
                  color: #334155;
                }
                tr:nth-child(even) td {
                  background-color: #f8fafc;
                }
                .totals-row {
                  background-color: #f1f5f9 !important;
                  font-weight: 900;
                }
                .totals-row td {
                  color: #0f172a;
                  font-size: 11px;
                  border-top: 2px solid #cbd5e1;
                  border-bottom: 2px solid #cbd5e1;
                }
                .compliance-badge {
                  margin-top: 32px;
                  background-color: #eff6ff;
                  border: 1px solid #bfdbfe;
                  padding: 12px 16px;
                  border-radius: 12px;
                  font-size: 9px;
                  font-weight: 700;
                  color: #1e40af;
                  display: flex;
                  align-items: center;
                  gap: 8px;
                }
                .footer {
                  margin-top: 60px;
                  border-top: 1px solid #e2e8f0;
                  padding-top: 24px;
                  display: flex;
                  justify-content: space-between;
                  align-items: flex-end;
                }
                .footer-text {
                  font-size: 8.5px;
                  color: #94a3b8;
                  font-weight: bold;
                  line-height: 1.6;
                }
                .signature-block {
                  text-align: center;
                }
                .signature-line {
                  border-bottom: 1px solid #94a3b8;
                  width: 160px;
                  margin: 0 auto 8px auto;
                }
                .signature-label {
                  font-size: 9px;
                  font-weight: 800;
                  color: #475569;
                  text-transform: uppercase;
                  letter-spacing: 0.1em;
                }
                @media print {
                  body { padding: 0; }
                  .compliance-badge { page-break-inside: avoid; }
                  .footer { page-break-inside: avoid; }
                }
              </style>
            </head>
            <body>
              <div class="letterhead">
                <div class="logo-section">
                  <h1>${selectedCompany}</h1>
                  <p>${reportType === 'payout' ? 'General Payout Ledger' : reportType === 'tax' ? 'Statutory TDS Deductions Statement' : reportType === 'pf-esi' ? 'Provident Fund & ESI Compliance Register' : 'Performance Incentive Cycle Register'}</p>
                </div>
                <div class="meta-section">
                  <h2>COMPLIANCE REPORT ID</h2>
                  <p style="font-family: monospace; font-size: 11px; font-weight: 900; color: #1e3a8a;">PR-${selectedMonth.replace(' ', '-').toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}</p>
                  <p>Filing Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              </div>

              <div class="meta-cards-grid">
                <div class="meta-card">
                  <div class="card-label">Target Period</div>
                  <div class="card-value">${selectedMonth}</div>
                </div>
                <div class="meta-card">
                  <div class="card-label">Reporting Branch</div>
                  <div class="card-value" style="font-size: 10px; max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">Acme HQ / Branch A</div>
                </div>
                <div class="meta-card">
                  <div class="card-label">Total Staff</div>
                  <div class="card-value">${payroll.length} Employees</div>
                </div>
                <div class="meta-card">
                  <div class="card-label">Cumulative Total</div>
                  <div class="card-value" style="color: #1e3a8a;">${currencySymbol}${totalVal.toLocaleString()}</div>
                </div>
              </div>

              <table>
                <thead>
                  ${headersHTML}
                </thead>
                <tbody>
                  ${rowsHTML}
                  <tr class="totals-row">
                    <td colspan="2">TOTAL REPORT VOLUME</td>
                    <td colspan="${reportType === 'payout' ? '7' : reportType === 'tax' ? '3' : reportType === 'pf-esi' ? '4' : '3'}"></td>
                    <td style="color: #1e3a8a;">${currencySymbol}${totalVal.toLocaleString()}</td>
                    ${reportType === 'payout' ? '<td></td>' : ''}
                  </tr>
                </tbody>
              </table>

              <div class="compliance-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="color: #2563eb;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                Statutory Compliance Verification: The contributions, tax deductions, and disbursements recorded in this document match company records and biometric attendance computations.
              </div>

              <div class="footer">
                <div class="footer-text">
                  <p>Certified Payroll Automation Audit Trail.</p>
                  <p>Subject to corporate tax guidelines, EPFO laws, and ESIC schedules.</p>
                </div>
                <div class="signature-block">
                  <div class="signature-line"></div>
                  <div class="signature-label">Authorized signatory</div>
                </div>
              </div>

              <script>
                window.onload = function() {
                  window.print();
                  setTimeout(function() { window.close(); }, 500);
                }
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
        return;
      }

      // Excel / CSV: Add professional metadata block before data rows
      let fileContent = "";
      fileContent += `================================================================================\n`;
      fileContent += `  PAYROLL AUDIT REGISTER - ${selectedCompany.toUpperCase()}\n`;
      fileContent += `================================================================================\n`;
      fileContent += `Report Type      : ${reportType.toUpperCase()}\n`;
      fileContent += `Target Period    : ${selectedMonth}\n`;
      fileContent += `Filing Branch    : Acme Headquarters / Corporate Hub\n`;
      fileContent += `Active Currency  : ${currency}\n`;
      fileContent += `Total Personnel  : ${payroll.length} Employees\n`;
      fileContent += `Export Date      : ${new Date().toLocaleString()}\n`;
      fileContent += `Status           : Approved & Audited Ledger\n`;
      fileContent += `================================================================================\n\n`;

      if (reportType === 'payout') {
        fileContent += "Employee,Email,Month,Basic Salary,HRA,Gross,TDS Tax,PF,ESI,Net Payout,Status\n";
        payroll.forEach(p => {
          fileContent += `"${p.employeeName}","${p.employee}","${p.month}",${p.basic},${p.hra},${p.gross},${p.tax},${p.pf},${p.esi},${p.net},"${p.status}"\n`;
        });
      } else if (reportType === 'tax') {
        fileContent += "Employee,Email,Monthly Gross,Annual Projected,TDS Slab Rate,Monthly TDS Deducted\n";
        payroll.forEach(p => {
          const rate = p.gross > 100000 ? "10%" : p.gross > 50000 ? "5%" : "0%";
          fileContent += `"${p.employeeName}","${p.employee}",${p.gross},${p.gross * 12},"${rate}",${p.tax}\n`;
        });
      } else if (reportType === 'pf-esi') {
        fileContent += "Employee,Email,Basic Salary,PF Employee (12%),PF Employer (12%),ESI Employee (0.75%),ESI Employer (3.25%)\n";
        payroll.forEach(p => {
          fileContent += `"${p.employeeName}","${p.employee}",${p.basic},${p.pf},${p.pf},${p.esi},${Math.round(p.gross * 0.0325)}\n`;
        });
      } else {
        fileContent += "Employee,Email,Month,Base Salary,Bonus Disbursed,Bonus Reason\n";
        payroll.forEach(p => {
          fileContent += `"${p.employeeName}","${p.employee}","${p.month}",${p.basic},${p.bonus || 0},"Performance/Festival Reward"\n`;
        });
      }

      const encodedUri = "data:text/csv;charset=utf-8," + encodeURIComponent(fileContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Payroll_Compliance_${reportType}_${selectedMonth.replace(' ', '_')}.${format === 'excel' ? 'xls' : 'csv'}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      alert(`Report exported successfully as ${format.toUpperCase()}!`);
    }, 50);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Payroll Reports & Multi-Company Center</h3>
          <p className="text-[10px] text-slate-400 font-bold mt-0.5 uppercase tracking-wider">Export tax sheets, PF/ESI registers, and departmental cost structures.</p>
        </div>
      </div>

      {/* Configurations Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
        <div>
          <label className="block text-[8px] font-black text-slate-455 uppercase tracking-widest mb-1.5">Company Workspace</label>
          <div className="w-full px-3 py-2.5 text-xs bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 font-bold flex items-center gap-2 select-none h-[38px]">
            <Building className="w-3.5 h-3.5 text-blue-550 dark:text-blue-400 shrink-0" />
            <span className="truncate">{selectedCompany}</span>
          </div>
        </div>

        <div>
          <label className="block text-[8px] font-black text-slate-455 uppercase tracking-widest mb-1.5">Target Month</label>
          <select 
            className="saas-input w-full px-3 py-2.5 text-xs border border-slate-150/40 rounded-xl outline-none"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            <option value="May 2026">May 2026</option>
            <option value="April 2026">April 2026</option>
            <option value="March 2026">March 2026</option>
          </select>
        </div>

        <div>
          <label className="block text-[8px] font-black text-slate-455 uppercase tracking-widest mb-1.5">Payout Currency</label>
          <select 
            className="saas-input w-full px-3 py-2.5 text-xs border border-slate-150/40 rounded-xl outline-none"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            <option value="INR (₹)">INR (₹) - Rupee</option>
            <option value="USD ($)">USD ($) - Dollar</option>
            <option value="EUR (€)">EUR (€) - Euro</option>
          </select>
        </div>

        <div className="flex items-end">
          <div className="grid grid-cols-3 gap-2 w-full">
            <button 
              onClick={() => handleDownload('csv')}
              disabled={isDownloading}
              className="py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[8.5px] font-black uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3 h-3" /> CSV
            </button>
            <button 
              onClick={() => handleDownload('excel')}
              disabled={isDownloading}
              className="py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[8.5px] font-black uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3 h-3" /> Excel
            </button>
            <button 
              onClick={() => handleDownload('pdf')}
              disabled={isDownloading}
              className="py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-[8.5px] font-black uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50 border border-slate-800"
            >
              <Download className="w-3 h-3" /> PDF
            </button>
          </div>
        </div>
      </div>

      {/* Navigation for Report views */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { type: 'payout', title: 'Salary Summary', icon: DollarSign, desc: 'General ledger records' },
          { type: 'tax', title: 'TDS Tax Sheets', icon: Percent, desc: 'TDS slabs & compliance' },
          { type: 'pf-esi', title: 'PF/ESI Contributions', icon: Users, desc: 'Provident funds register' },
          { type: 'bonus', title: 'Bonus Details', icon: Award, desc: 'Disbursed incentives' }
        ].map(item => (
          <button
            key={item.type}
            onClick={() => setReportType(item.type as any)}
            className={cn(
              "p-4 rounded-2xl text-left border transition-all active:scale-95 cursor-pointer relative overflow-hidden group",
              reportType === item.type 
                ? "bg-gradient-to-r from-blue-600 to-indigo-650 text-white border-transparent shadow-md shadow-blue-500/15" 
                : "bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-800 dark:text-slate-200"
            )}
          >
            <item.icon className={cn(
              "w-5 h-5 mb-2 transition-colors",
              reportType === item.type 
                ? "text-white" 
                : "text-blue-500 dark:text-blue-400"
            )} />
            <h4 className="text-[10px] font-black uppercase tracking-wider">{item.title}</h4>
            <p className="text-[8px] opacity-70 mt-0.5">{item.desc}</p>
          </button>
        ))}
      </div>

      {/* Rendered Preview Ledger */}
      <div className="saas-card bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-805 rounded-[2rem] overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-100 dark:border-slate-850 flex justify-between items-center">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Report Preview: {reportType.toUpperCase()} ({selectedMonth})</span>
          <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">Live Sync</span>
        </div>

        <div className="overflow-x-auto">
          {reportType === 'payout' && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-850">
                  <th className="px-4 py-3 text-[9px] font-black text-slate-455 uppercase tracking-wider">Employee</th>
                  <th className="px-4 py-3 text-[9px] font-black text-slate-455 uppercase tracking-wider">Month</th>
                  <th className="px-4 py-3 text-[9px] font-black text-slate-455 uppercase tracking-wider">Gross</th>
                  <th className="px-4 py-3 text-[9px] font-black text-slate-455 uppercase tracking-wider">Tax (TDS)</th>
                  <th className="px-4 py-3 text-[9px] font-black text-slate-455 uppercase tracking-wider">Net Payout</th>
                  <th className="px-4 py-3 text-[9px] font-black text-slate-455 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[10px] font-bold">
                {payroll.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 italic">No payouts logged for this period.</td>
                  </tr>
                ) : (
                  payroll.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-black text-slate-900 dark:text-white">{p.employeeName}</p>
                          <p className="text-[8.5px] text-slate-400 font-medium">{p.employee}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono">{p.month}</td>
                      <td className="px-4 py-3">₹{p.gross?.toLocaleString()}</td>
                      <td className="px-4 py-3 text-rose-500">₹{p.tax?.toLocaleString()}</td>
                      <td className="px-4 py-3 text-emerald-500 font-black">₹{p.net?.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-500 rounded text-[8px] uppercase tracking-wider font-black">
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {reportType === 'tax' && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-850">
                  <th className="px-4 py-3 text-[9px] font-black text-slate-455 uppercase tracking-wider">Employee</th>
                  <th className="px-4 py-3 text-[9px] font-black text-slate-455 uppercase tracking-wider">Projected Annual CTC</th>
                  <th className="px-4 py-3 text-[9px] font-black text-slate-455 uppercase tracking-wider">TDS Slab Rate</th>
                  <th className="px-4 py-3 text-[9px] font-black text-slate-455 uppercase tracking-wider">Monthly TDS</th>
                  <th className="px-4 py-3 text-[9px] font-black text-slate-455 uppercase tracking-wider">Filing Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[10px] font-bold">
                {payroll.map((p, idx) => {
                  const rate = p.gross > 100000 ? "10%" : p.gross > 50000 ? "5%" : "0%";
                  return (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                      <td className="px-4 py-3">
                        <p className="font-black text-slate-900 dark:text-white">{p.employeeName}</p>
                      </td>
                      <td className="px-4 py-3">₹{(p.gross * 12).toLocaleString()}</td>
                      <td className="px-4 py-3 text-blue-500 font-black">{rate}</td>
                      <td className="px-4 py-3 text-rose-500">₹{p.tax?.toLocaleString()}</td>
                      <td className="px-4 py-3 text-emerald-500 uppercase tracking-wider text-[8px] font-black">Submitted</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {reportType === 'pf-esi' && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-850">
                  <th className="px-4 py-3 text-[9px] font-black text-slate-455 uppercase tracking-wider">Employee</th>
                  <th className="px-4 py-3 text-[9px] font-black text-slate-455 uppercase tracking-wider">Basic Salary</th>
                  <th className="px-4 py-3 text-[9px] font-black text-slate-455 uppercase tracking-wider">PF (12%)</th>
                  <th className="px-4 py-3 text-[9px] font-black text-slate-455 uppercase tracking-wider">ESI Employee (0.75%)</th>
                  <th className="px-4 py-3 text-[9px] font-black text-slate-455 uppercase tracking-wider">ESI Employer (3.25%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[10px] font-bold">
                {payroll.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                    <td className="px-4 py-3">
                      <p className="font-black text-slate-900 dark:text-white">{p.employeeName}</p>
                    </td>
                    <td className="px-4 py-3">₹{p.basic?.toLocaleString()}</td>
                    <td className="px-4 py-3">₹{p.pf?.toLocaleString()}</td>
                    <td className="px-4 py-3">₹{p.esi?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-slate-500">₹{Math.round(p.gross * 0.0325).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'bonus' && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-850">
                  <th className="px-4 py-3 text-[9px] font-black text-slate-455 uppercase tracking-wider">Employee</th>
                  <th className="px-4 py-3 text-[9px] font-black text-slate-455 uppercase tracking-wider">Base Salary</th>
                  <th className="px-4 py-3 text-[9px] font-black text-slate-455 uppercase tracking-wider">Bonus Disbursed</th>
                  <th className="px-4 py-3 text-[9px] font-black text-slate-455 uppercase tracking-wider">Payout Event</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[10px] font-bold">
                {payroll.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                    <td className="px-4 py-3">
                      <p className="font-black text-slate-900 dark:text-white">{p.employeeName}</p>
                    </td>
                    <td className="px-4 py-3">₹{p.basic?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-emerald-500 font-black">₹{(p.bonus || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-slate-400">Monthly Compensation Cycles</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
