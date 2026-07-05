"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Receipt } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from "@/lib/utils";
import { useUIStore } from '@/store/uiStore';
import { usePermission } from '@/context/PermissionContext';

// Import modular payroll subcomponents
import PayslipModal from './payroll/PayslipModal';
import EmployeeView from './payroll/EmployeeView';
import PayrollDashboard from './payroll/PayrollDashboard';
import SalaryStructuresTab from './payroll/SalaryStructuresTab';
import SalaryManagementTab from './payroll/SalaryManagementTab';
import PayrollSheetsTab from './payroll/PayrollSheetsTab';
import WorkflowTab from './payroll/WorkflowTab';
import ReimbursementsTab from './payroll/ReimbursementsTab';
import PayrollCalendarTab from './payroll/PayrollCalendarTab';
import PayrollReportsTab from './payroll/PayrollReportsTab';
import PayrollAuditTab from './payroll/PayrollAuditTab';

export default function PayrollPage({ userRole = 'HR', profile }: { userRole?: string, profile?: any }) {
  const { can } = usePermission();
  const { selectedBranchId } = useUIStore();
  // Global States
  const [payroll, setPayroll] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'salaryManagement' | 'salaryStructures' | 'payrollSheets' | 'workflow' | 'reimbursements' | 'calendar' | 'reports' | 'audit'>('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<any | null>(null);
  const [wallet, setWallet] = useState<any>(null);

  // Initial/Reactive Fetches
  useEffect(() => {
    fetchPayroll();
    fetchEmployees();
    fetchWallet();
  }, [selectedBranchId]);

  const fetchWallet = async () => {
    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/wallet', { headers });
      if (res.ok) {
        const data = await res.json();
        setWallet(data);
      }
    } catch (err) {
      console.error('Failed to fetch wallet:', err);
    }
  };

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      let url = '/api/employees';
      if (selectedBranchId) {
        url += `?branchId=${selectedBranchId}`;
      }
      const res = await fetch(url, { headers });
      console.log('[Payroll] fetchEmployees status:', res.status);
      if (res.ok) {
        const data = await res.json();
        console.log('[Payroll] fetchEmployees data count:', data?.length);
        setEmployees(Array.isArray(data) ? data : []);
      } else {
        const errBody = await res.json().catch(() => ({}));
        console.error('[Payroll] fetchEmployees error:', res.status, errBody);
      }
    } catch (err) {
      console.error('Failed to fetch employees:', err);
    }
  };

  const fetchPayroll = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      let url = '/api/payroll';
      if (selectedBranchId) {
        url += `?branchId=${selectedBranchId}`;
      }
      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        setPayroll(data);
      }
    } catch (err) {
      console.error('Failed to fetch payroll slips:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Filters for Employee private view
  const employeePayrollData = useMemo(() => {
    return payroll.filter(row => row.employee.toLowerCase() === (profile?.email || 'emp@hr.com').toLowerCase());
  }, [payroll, profile]);

  const activeEmployeeRecord = useMemo(() => {
    return employeePayrollData[0] || {
      employee: profile?.email || 'emp@hr.com',
      employeeName: profile?.name || 'Rahul Sharma',
      month: 'May 2026',
      basic: 60000,
      hra: 20000,
      allowance: 8000,
      bonus: 0,
      overtime: 0,
      pf: 4000,
      esi: 1000,
      tax: 6000,
      otherDeductions: 0,
      gross: 88000,
      net: 77000,
      status: 'Paid'
    };
  }, [employeePayrollData, profile]);

  // Dashboard Stats Calculations for HR view
  const dashboardStats = useMemo(() => {
    const totalPayout = payroll.filter(p => p.status === 'Paid').reduce((acc, curr) => acc + curr.net, 0);
    const pendingApproval = payroll.filter(p => p.status === 'Pending Approval').reduce((acc, curr) => acc + curr.net, 0);
    const monthlyExpenses = payroll.reduce((acc, curr) => acc + curr.gross, 0);
    const totalEmployeesProcessed = new Set(payroll.map(p => p.employee)).size;

    return {
      totalPayout,
      pendingApproval,
      monthlyExpenses,
      totalEmployeesProcessed
    };
  }, [payroll]);

  // -------------------------------------------------------------
  // RENDER EMPLOYEE SALARY STATUS VIEW
  // -------------------------------------------------------------
  if (!can('payroll.view')) {
    return (
      <div className="p-5 lg:p-6 max-w-7xl mx-auto space-y-6 min-h-screen bg-transparent dark:bg-transparent">
        <EmployeeView 
          activeEmployeeRecord={activeEmployeeRecord}
          employeePayrollData={employeePayrollData}
          setSelectedPayslip={setSelectedPayslip}
          profile={profile}
        />
        
        {/* Dynamic Printable PDF Payslip View Modal */}
        <AnimatePresence>
          {selectedPayslip && <PayslipModal slip={selectedPayslip} onClose={() => setSelectedPayslip(null)} />}
        </AnimatePresence>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER ADMIN / HR / FINANCE VIEW
  // -------------------------------------------------------------
  return (
    <div className="p-5 lg:p-6 max-w-7xl mx-auto space-y-6 min-h-screen bg-transparent dark:bg-transparent">
      {/* Header & Main Tabs */}
      <div className="flex flex-col gap-4 pb-4 border-b border-slate-200 dark:border-slate-800 text-left w-full">
        {/* Title block */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0 shadow-sm border border-blue-500/10">
            <Receipt className="w-5.5 h-5.5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">
              Payroll & Comp Center
            </h1>
            <p className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mt-1.5 leading-none">
              Compensation & Ledger
            </p>
          </div>
        </div>

        {/* Description (Full width, long length) */}
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-3xl break-words whitespace-normal leading-relaxed">
          Enterprise dashboard for salary structures, monthly payroll processing, and multi-stage workflow approvals.
        </p>

        {/* Navigation Tabs */}
        <div className="premium-nav-container mt-2">
          {(['dashboard', 'salaryManagement', 'salaryStructures', 'payrollSheets', 'workflow', 'reimbursements', 'calendar', 'reports', 'audit'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "premium-nav-item active:scale-[0.98]",
                activeTab === tab ? "premium-nav-item-active" : ""
              )}
            >
              <span>
                {tab === 'salaryManagement' ? 'Salary Mgmt' :
                 tab === 'salaryStructures' ? 'Structures' : 
                 tab === 'payrollSheets' ? 'Sheets' : 
                 tab === 'workflow' ? 'Workflow' : 
                 tab === 'reimbursements' ? 'Reimbursements' : 
                 tab === 'calendar' ? 'Calendar' :
                 tab === 'reports' ? 'Reports' :
                 tab === 'audit' ? 'Audit Logs' : tab}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic Tab Contents */}
      {isLoading ? (
        <div className="py-20 text-center text-xs font-black uppercase tracking-widest text-slate-400">Loading Payroll Vault Data...</div>
      ) : (
        <div className="min-h-[400px]">
          {activeTab === 'dashboard' && (
            <PayrollDashboard 
              dashboardStats={dashboardStats} 
              wallet={wallet} 
              fetchWallet={fetchWallet} 
              userRole={userRole} 
              payroll={payroll}
              employees={employees}
            />
          )}
          {activeTab === 'salaryManagement' && (
            <SalaryManagementTab userRole={userRole} />
          )}
          {activeTab === 'salaryStructures' && (
            <SalaryStructuresTab employees={employees} fetchEmployees={fetchEmployees} userRole={userRole} />
          )}
          {activeTab === 'payrollSheets' && (
            <PayrollSheetsTab 
              payroll={payroll} 
              employees={employees} 
              fetchPayroll={fetchPayroll} 
              setSelectedPayslip={setSelectedPayslip}
              userRole={userRole}
            />
          )}
          {activeTab === 'workflow' && (
            <WorkflowTab payroll={payroll} fetchPayroll={fetchPayroll} wallet={wallet} fetchWallet={fetchWallet} userRole={userRole} />
          )}
          {activeTab === 'reimbursements' && (
            <ReimbursementsTab userRole={userRole} />
          )}
          {activeTab === 'calendar' && (
            <PayrollCalendarTab />
          )}
          {activeTab === 'reports' && (
            <PayrollReportsTab payroll={payroll} userRole={userRole} />
          )}
          {activeTab === 'audit' && (
            <PayrollAuditTab />
          )}
        </div>
      )}

      {/* Dynamic Printable PDF Payslip View Modal */}
      <AnimatePresence>
        {selectedPayslip && <PayslipModal slip={selectedPayslip} onClose={() => setSelectedPayslip(null)} />}
      </AnimatePresence>
    </div>
  );
}
