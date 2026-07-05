"use client";

import React, { useState, useMemo } from 'react';
import { 
  Edit2, Search, Percent, X, TrendingUp, IndianRupee, 
  Building2, User, Briefcase, ChevronDown, RefreshCw, BadgeCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import SalaryRevisionModal from './SalaryRevisionModal';

interface SalaryStructuresTabProps {
  employees: any[];
  fetchEmployees: () => Promise<void>;
  userRole?: string;
}

function fmt(n: number) {
  return `₹${(n || 0).toLocaleString('en-IN')}`;
}

const EMPLOYMENT_TYPES = ['Full-Time', 'Part-Time', 'Contract', 'Intern', 'Consultant'];

export default function SalaryStructuresTab({ employees, fetchEmployees, userRole = 'HR' }: SalaryStructuresTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployeeForSalary, setSelectedEmployeeForSalary] = useState<any | null>(null);
  const [isEditingSalary, setIsEditingSalary] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionEmployee, setRevisionEmployee] = useState<any | null>(null);

  const [salaryForm, setSalaryForm] = useState({
    basic: 0,
    hra: 0,
    medicalAllowance: 0,
    travelAllowance: 0,
    specialAllowance: 0,
    otherEarnings: 0,
    bonus: 0,
    pf: 0,
    esi: 0,
    professionalTax: 0,
    tds: 0,
    otherDeductions: 0,
    employmentType: 'Full-Time',
  });

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => 
      emp.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.empId?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [employees, searchTerm]);

  const calculatedSalary = useMemo(() => {
    const { basic, hra, medicalAllowance, travelAllowance, specialAllowance, otherEarnings, bonus, pf, esi, professionalTax, tds, otherDeductions } = salaryForm;
    const grossSalary = Number(basic) + Number(hra) + Number(medicalAllowance) + Number(travelAllowance) + Number(specialAllowance) + Number(otherEarnings) + Number(bonus);
    const totalDeductions = Number(pf) + Number(esi) + Number(professionalTax) + Number(tds) + Number(otherDeductions);
    const netSalary = Math.max(0, grossSalary - totalDeductions);
    const monthlyCTC = grossSalary + Number(pf);
    return { grossSalary, totalDeductions, netSalary, monthlyCTC, annualCTC: monthlyCTC * 12 };
  }, [salaryForm]);

  const openEditor = (emp: any) => {
    const s = emp.salaryStructure || {};
    setSelectedEmployeeForSalary(emp);
    setSalaryForm({
      basic: s.basic || 0,
      hra: s.hra || 0,
      medicalAllowance: s.medicalAllowance || 1250,
      travelAllowance: s.travelAllowance || 1600,
      specialAllowance: s.specialAllowance || s.allowance || 0,
      otherEarnings: s.otherEarnings || 0,
      bonus: s.bonus || 0,
      pf: s.pf || 0,
      esi: s.esi || 0,
      professionalTax: s.professionalTax || 200,
      tds: s.tds || s.tax || 0,
      otherDeductions: s.otherDeductions || 0,
      employmentType: s.employmentType || 'Full-Time',
    });
    setIsEditingSalary(true);
  };

  const handleSaveSalaryStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeForSalary) return;
    setIsSaving(true);
    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // Use new salary API endpoint
      const res = await fetch('/api/payroll/salary', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          employeeId: selectedEmployeeForSalary._id,
          salaryStructure: salaryForm,
        })
      });

      if (res.ok) {
        await fetchEmployees();
        setIsEditingSalary(false);
        setSelectedEmployeeForSalary(null);
      } else {
        // Fallback to old employee endpoint
        const res2 = await fetch(`/api/employees/${selectedEmployeeForSalary._id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ salaryStructure: { ...salaryForm, net: calculatedSalary.netSalary, ...calculatedSalary } })
        });
        if (res2.ok) {
          await fetchEmployees();
          setIsEditingSalary(false);
          setSelectedEmployeeForSalary(null);
        }
      }
    } catch (err) {
      console.error('Failed to save salary structure:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Employee Wage Directory</h3>
          <p className="text-[10px] text-slate-400 font-bold mt-0.5">Configure compensation packages and statutory deductions for each employee.</p>
        </div>
        <div className="relative min-w-[260px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search employee..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none focus:border-blue-500/50"
          />
        </div>
      </div>

      {/* Employee Cards */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800">
                {['Employee', 'Employment', 'Basic', 'HRA + Allowances', 'Deductions', 'Gross', 'Net Pay', 'Monthly CTC', 'Annual CTC', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-[8px] font-black text-slate-400 uppercase tracking-[0.15em] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-xs text-slate-400 font-bold uppercase">No employees found</td>
                </tr>
              ) : filteredEmployees.map((emp) => {
                const s = emp.salaryStructure || { basic: 0, hra: 0, allowance: 0, pf: 0, tax: 0, net: 0 };
                const gross = s.grossSalary || ((s.basic || 0) + (s.hra || 0) + (s.medicalAllowance || 0) + (s.travelAllowance || 0) + (s.specialAllowance || s.allowance || 0) + (s.otherEarnings || 0) + (s.bonus || 0));
                const deductions = s.totalDeductions || ((s.pf || 0) + (s.esi || 0) + (s.professionalTax || 0) + (s.tds || s.tax || 0) + (s.otherDeductions || 0));
                const net = s.net || Math.max(0, gross - deductions);
                const ctcMonthly = s.monthlyCTC || (gross + (s.pf || 0));
                const ctcAnnual = s.annualCTC || (ctcMonthly * 12);
                return (
                  <tr key={emp._id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[9px] font-black shrink-0">
                          {emp.fullName?.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                        </div>
                        <div>
                          <p className="text-[11px] font-black text-slate-900 dark:text-white">{emp.fullName}</p>
                          <p className="text-[8.5px] text-slate-400 font-bold">{emp.designation}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 text-[7.5px] font-black uppercase rounded-full whitespace-nowrap">
                        {s.employmentType || 'Full-Time'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[11px] font-black text-slate-800 dark:text-slate-200 whitespace-nowrap">{fmt(s.basic || 0)}</td>
                    <td className="px-4 py-3 text-[11px] font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">{fmt((s.hra || 0) + (s.medicalAllowance || 0) + (s.travelAllowance || 0) + (s.specialAllowance || s.allowance || 0))}</td>
                    <td className="px-4 py-3 text-[11px] font-bold text-rose-500 whitespace-nowrap">-{fmt(deductions)}</td>
                    <td className="px-4 py-3 text-[11px] font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">{fmt(gross)}</td>
                    <td className="px-4 py-3 text-[11px] font-black text-emerald-600 whitespace-nowrap">{fmt(net)}</td>
                    <td className="px-4 py-3 text-[11px] font-black text-blue-600 whitespace-nowrap">{fmt(ctcMonthly)}</td>
                    <td className="px-4 py-3 text-[10px] font-bold text-slate-500 whitespace-nowrap">{fmt(ctcAnnual)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={() => openEditor(emp)}
                          className="px-2 py-1 bg-slate-100 hover:bg-blue-600 hover:text-white dark:bg-slate-800 dark:hover:bg-blue-600 dark:text-slate-350 rounded-lg text-[8px] font-black uppercase tracking-widest cursor-pointer transition-all flex items-center gap-1 whitespace-nowrap"
                        >
                          <Edit2 className="w-2.5 h-2.5" /> Setup
                        </button>
                        {['Admin', 'HR'].includes(userRole) && (
                          <button
                            onClick={() => { setRevisionEmployee(emp); setShowRevisionModal(true); }}
                            className="px-2 py-1 bg-blue-50 hover:bg-blue-600 hover:text-white dark:bg-blue-900/20 dark:hover:bg-blue-600 text-blue-600 rounded-lg text-[8px] font-black uppercase tracking-widest cursor-pointer transition-all flex items-center gap-1 whitespace-nowrap"
                          >
                            <TrendingUp className="w-2.5 h-2.5" /> Revise
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Setup salary structures */}
      <AnimatePresence>
        {isEditingSalary && selectedEmployeeForSalary && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/50 dark:border-slate-800 overflow-hidden max-h-[92vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-800 to-slate-900">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                    <IndianRupee className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">Configure Wage Package</h3>
                    <p className="text-[9px] text-slate-400 font-bold mt-0.5">{selectedEmployeeForSalary.fullName} · {selectedEmployeeForSalary.designation}</p>
                  </div>
                </div>
                <button onClick={() => { setIsEditingSalary(false); setSelectedEmployeeForSalary(null); }} className="p-1.5 hover:bg-white/10 rounded-lg cursor-pointer transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleSaveSalaryStructure} className="p-5 space-y-5">
                {/* Employment Type */}
                <div>
                  <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Employment Type</label>
                  <div className="flex flex-wrap gap-2">
                    {EMPLOYMENT_TYPES.map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setSalaryForm(prev => ({ ...prev, employmentType: type }))}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-[8.5px] font-black uppercase tracking-widest transition-all cursor-pointer border",
                          salaryForm.employmentType === type
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-blue-300'
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  {/* Earnings */}
                  <div className="space-y-3">
                    <h4 className="text-[8.5px] font-black text-emerald-600 uppercase tracking-widest border-b border-emerald-200 dark:border-emerald-900/30 pb-1.5 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> Earnings Components
                    </h4>
                    {[
                      { key: 'basic', label: 'Basic Salary' },
                      { key: 'hra', label: 'HRA Allowance' },
                      { key: 'medicalAllowance', label: 'Medical Allowance' },
                      { key: 'travelAllowance', label: 'Travel Allowance' },
                      { key: 'specialAllowance', label: 'Special Allowance' },
                      { key: 'otherEarnings', label: 'Other Earnings' },
                      { key: 'bonus', label: 'Monthly Bonus' },
                    ].map(field => (
                      <div key={field.key}>
                        <label className="block text-[7.5px] font-black text-slate-400 uppercase tracking-widest mb-1">{field.label} (₹)</label>
                        <input 
                          type="number"
                          min={0}
                          className="saas-input w-full px-2.5 py-1.5 text-[11px] font-bold"
                          value={(salaryForm as any)[field.key]}
                          onChange={e => setSalaryForm(prev => ({ ...prev, [field.key]: Number(e.target.value) }))}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Deductions */}
                  <div className="space-y-3">
                    <h4 className="text-[8.5px] font-black text-rose-500 uppercase tracking-widest border-b border-rose-200 dark:border-rose-900/30 pb-1.5 flex items-center gap-1">
                      <Percent className="w-3 h-3" /> Statutory Deductions
                    </h4>
                    {[
                      { key: 'pf', label: 'Provident Fund (PF)' },
                      { key: 'esi', label: 'ESIC' },
                      { key: 'professionalTax', label: 'Professional Tax' },
                      { key: 'tds', label: 'TDS / Income Tax' },
                      { key: 'otherDeductions', label: 'Other Deductions' },
                    ].map(field => (
                      <div key={field.key}>
                        <label className="block text-[7.5px] font-black text-slate-400 uppercase tracking-widest mb-1">{field.label} (₹)</label>
                        <input 
                          type="number"
                          min={0}
                          className="saas-input w-full px-2.5 py-1.5 text-[11px] font-bold"
                          value={(salaryForm as any)[field.key]}
                          onChange={e => setSalaryForm(prev => ({ ...prev, [field.key]: Number(e.target.value) }))}
                        />
                      </div>
                    ))}

                    {/* Live Calculator */}
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-slate-800 rounded-xl border border-blue-100 dark:border-slate-700 space-y-1.5">
                      <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                        <Percent className="w-2.5 h-2.5" /> Live Calculator
                      </p>
                      {[
                        { label: 'Gross Salary', value: calculatedSalary.grossSalary, color: 'text-slate-700 dark:text-slate-200' },
                        { label: 'Total Deductions', value: calculatedSalary.totalDeductions, color: 'text-rose-500' },
                        { label: 'Net Take-home', value: calculatedSalary.netSalary, color: 'text-emerald-600 font-black' },
                        { label: 'Monthly CTC', value: calculatedSalary.monthlyCTC, color: 'text-blue-600 font-black' },
                        { label: 'Annual CTC', value: calculatedSalary.annualCTC, color: 'text-purple-600 font-black' },
                      ].map(item => (
                        <div key={item.label} className="flex justify-between items-center">
                          <span className="text-[8px] font-bold text-slate-500">{item.label}</span>
                          <span className={cn("text-[10px]", item.color)}>{fmt(item.value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
                  <button
                    type="button"
                    onClick={() => { setIsEditingSalary(false); setSelectedEmployeeForSalary(null); }}
                    className="px-5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-lg text-[8.5px] font-black uppercase tracking-widest cursor-pointer active:scale-95 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg text-[8.5px] font-black uppercase tracking-widest cursor-pointer shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2"
                  >
                    {isSaving ? <><RefreshCw className="w-3 h-3 animate-spin" /> Saving...</> : <><BadgeCheck className="w-3 h-3" /> Save Wage Settings</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Salary Revision Modal */}
      <AnimatePresence>
        {showRevisionModal && revisionEmployee && (
          <SalaryRevisionModal
            employee={revisionEmployee}
            onClose={() => { setShowRevisionModal(false); setRevisionEmployee(null); }}
            onSuccess={() => fetchEmployees()}
            userRole={userRole}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
