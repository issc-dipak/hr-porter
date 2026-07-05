"use client";

import React from 'react';
import { X, Trash2, Plus, Edit2, Check, MessageSquare, Building, Layout, Users, Clock, Calendar, CreditCard, Briefcase, Shield, Bell, Workflow, Server, Activity, Database, CheckCircle, Info, RefreshCw, Key, ShieldCheck, Heart, Sparkles, AlertCircle, FileText, Download, Search, Sun, Moon, Monitor, Palette } from 'lucide-react';
import { cn } from "@/lib/utils";
import { RolesPermissionsPage } from '@/features/admin/permissions/component';
import { useBrandingStore } from '@/store/useBrandingStore';

type Role = 'Admin' | 'HR' | 'Employee';

interface AdminTabsProps {
  activeCategory: string;
  companyBranding: {
    name: string;
    logo: string;
    timezone: string;
    currency: string;
    departments: string[];
  };
  setCompanyBranding: React.Dispatch<React.SetStateAction<any>>;
  usersList: any[];
  newUserFullName: string;
  setNewUserFullName: (val: string) => void;
  newUserEmail: string;
  setNewUserEmail: (val: string) => void;
  newUserPassword: string;
  setNewUserPassword: (val: string) => void;
  newUserRole: Role;
  setNewUserRole: (val: Role) => void;
  newUserDepartment: string;
  setNewUserDepartment: (val: string) => void;
  creatingUser: boolean;
  handleCreateUser: (e: React.FormEvent) => void;
  handleUpdateUserRole: (userId: string, role: string) => void;
  handleDeleteUser: (userId: string) => void;
  permissionsMatrix: Record<string, Record<string, boolean>>;
  setPermissionsMatrix: React.Dispatch<React.SetStateAction<any>>;
  payrollConfig: {
    salaryCycle: string;
    overtimeRate: string;
    taxRegime: string;
    bonusRules: string;
    autoRelease: boolean;
  };
  setPayrollConfig: React.Dispatch<React.SetStateAction<any>>;
  attendanceConfig: {
    shiftStart: string;
    shiftEnd: string;
    graceBuffer: string;
    maxBreakTime?: string;
    lateDeductionActive: boolean;
    biometricSync: boolean;
  };
  setAttendanceConfig: React.Dispatch<React.SetStateAction<any>>;
  leaveConfig: {
    leaveTypes: Array<{ name: string; days: number }>;
    holidayCalendar: Array<{ title: string; date: string }>;
    approvalFlow: string;
    hrMaxLeaves?: number;
    employeeMaxLeaves?: number;
  };
  setLeaveConfig: React.Dispatch<React.SetStateAction<any>>;
  newLeaveName: string;
  setNewLeaveName: (val: string) => void;
  newLeaveDays: number;
  setNewLeaveDays: (val: number) => void;
  newHolidayTitle: string;
  setNewHolidayTitle: (val: string) => void;
  newHolidayDate: string;
  setNewHolidayDate: (val: string) => void;
  recruitmentConfig: {
    interviewStages: string[];
    jobTemplates: Array<{ title: string; description: string }>;
  };
  setRecruitmentConfig: React.Dispatch<React.SetStateAction<any>>;
  newStageName: string;
  setNewStageName: (val: string) => void;
  newTemplateTitle: string;
  setNewTemplateTitle: (val: string) => void;
  newTemplateDesc: string;
  setNewTemplateDesc: (val: string) => void;
  securityConfig: {
    minPasswordLength: number;
    twoFactorAuthActive: boolean;
    sessionExpiryMinutes: number;
    ipRestrictions: string;
  };
  setSecurityConfig: React.Dispatch<React.SetStateAction<any>>;
  notificationConfig: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    hrAlerts: boolean;
    employeeReminders: boolean;
  };
  setNotificationConfig: React.Dispatch<React.SetStateAction<any>>;
  themeSettings: {
    defaultThemeMode: string;
    defaultLanguage: string;
  };
  setThemeSettings: React.Dispatch<React.SetStateAction<any>>;
  onThemeChange?: (useDark: boolean) => void;
  isDarkMode?: boolean;
  triggerToast: (msg: string) => void;
  onSaveSystemSettings?: (updates: { leave?: any; attendance?: any; company?: any }) => Promise<void>;
  chatConfig: {
    workspaceName: string;
    workspaceLogo: string;
    allowEmployeeChannelCreate: boolean;
    allowEmployeeChannelPrivateCreate: boolean;
    allowAnnouncementsPostAll: boolean;
    allowEmployeeEditDelete: boolean;
    restrictedKeywords: string;
  };
  setChatConfig: React.Dispatch<React.SetStateAction<any>>;
  onFieldChange?: () => void;
  orgConfig: {
    branches: string[];
    designations: string[];
    costCenters: string[];
  };
  setOrgConfig: React.Dispatch<React.SetStateAction<any>>;
  workflowConfig: {
    onboarding: any[];
    offboarding: any[];
  };
  setWorkflowConfig: React.Dispatch<React.SetStateAction<any>>;
  integrationsConfig: {
    google: string;
    m365: string;
    slack: string;
  };
  setIntegrationsConfig: React.Dispatch<React.SetStateAction<any>>;
  billingConfig: {
    plan: string;
    seats: number;
  };
  setBillingConfig: React.Dispatch<React.SetStateAction<any>>;
  backupConfig: {
    autoBackup: boolean;
    snapshots: any[];
  };
  setBackupConfig: React.Dispatch<React.SetStateAction<any>>;
}

export function AdminTabs({
  activeCategory,
  companyBranding,
  setCompanyBranding,
  usersList,
  newUserFullName,
  onFieldChange,
  orgConfig,
  setOrgConfig,
  workflowConfig,
  setWorkflowConfig,
  integrationsConfig,
  setIntegrationsConfig,
  billingConfig,
  setBillingConfig,
  backupConfig,
  setBackupConfig,
  setNewUserFullName,
  newUserEmail,
  setNewUserEmail,
  newUserPassword,
  setNewUserPassword,
  newUserRole,
  setNewUserRole,
  newUserDepartment,
  setNewUserDepartment,
  creatingUser,
  handleCreateUser,
  handleUpdateUserRole,
  handleDeleteUser,
  permissionsMatrix,
  setPermissionsMatrix,
  payrollConfig,
  setPayrollConfig,
  attendanceConfig,
  setAttendanceConfig,
  leaveConfig,
  setLeaveConfig,
  newLeaveName,
  setNewLeaveName,
  newLeaveDays,
  setNewLeaveDays,
  newHolidayTitle,
  setNewHolidayTitle,
  newHolidayDate,
  setNewHolidayDate,
  recruitmentConfig,
  setRecruitmentConfig,
  newStageName,
  setNewStageName,
  newTemplateTitle,
  setNewTemplateTitle,
  newTemplateDesc,
  setNewTemplateDesc,
  securityConfig,
  setSecurityConfig,
  notificationConfig,
  setNotificationConfig,
  themeSettings,
  setThemeSettings,
  onThemeChange,
  isDarkMode,
  triggerToast,
  onSaveSystemSettings,
  chatConfig,
  setChatConfig
}: AdminTabsProps) {
  const [editingHolIdx, setEditingHolIdx] = React.useState<number | null>(null);
  const [editHolTitle, setEditHolTitle] = React.useState('');
  const [editHolDate, setEditHolDate] = React.useState('');
  const { branding, updateBrandingState, saveBranding } = useBrandingStore();

  const [employees, setEmployees] = React.useState<any[]>([]);
  const [employeesSearch, setEmployeesSearch] = React.useState('');
  const [userDirectorySearch, setUserDirectorySearch] = React.useState('');
  const [dynamicRoles, setDynamicRoles] = React.useState<any[]>([]);

  const fetchDynamicRolesList = async () => {
    try {
      const token = localStorage.getItem('hr_system_token');
      const h = token ? { 'Authorization': `Bearer ${token}` } : undefined;
      const res = await fetch('/api/rbac/roles', { headers: h });
      if (res.ok) {
        const data = await res.json();
        const rolesArr = Array.isArray(data) ? data : data.roles || [];
        setDynamicRoles(rolesArr);
      }
    } catch (e) {
      console.error("Failed to fetch dynamic roles:", e);
    }
  };

  React.useEffect(() => {
    fetchDynamicRolesList();
  }, []);

  const fetchEmployeesList = async () => {
    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/employees', { headers });
      if (res.ok) {
        const data = await res.json();
        setEmployees(data);
      }
    } catch (e) {
      console.error("Failed to fetch employees in settings:", e);
    }
  };

  React.useEffect(() => {
    if (activeCategory === 'leaves') {
      fetchEmployeesList();
    }
  }, [activeCategory]);

  const handleUpdateEmployeeLeaveLimit = async (employeeId: string, newLimit: number) => {
    try {
      const token = localStorage.getItem('hr_system_token');
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
      const res = await fetch(`/api/employees/${employeeId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ maxLeaves: newLimit })
      });
      if (res.ok) {
        // Update local list
        setEmployees(prev => prev.map(emp => emp._id === employeeId ? { ...emp, maxLeaves: newLimit } : emp));
        triggerToast('Employee leave limit updated.');
      } else {
        triggerToast('Failed to update employee limit.');
      }
    } catch (e) {
      console.error(e);
      triggerToast('Error saving employee limit.');
    }
  };

  const handleSaveInlineHoliday = (idx: number) => {
    if (!editHolTitle.trim() || !editHolDate) {
      triggerToast('Please provide a title and date.');
      return;
    }
    const updated = leaveConfig.holidayCalendar.map((h, i) => {
      if (i === idx) {
        return { title: editHolTitle.trim(), date: editHolDate };
      }
      return h;
    });
    const newLeave = {
      ...leaveConfig,
      holidayCalendar: updated
    };
    setLeaveConfig(newLeave);
    if (onSaveSystemSettings) {
      onSaveSystemSettings({ leave: newLeave });
    }
    setEditingHolIdx(null);
    triggerToast('Holiday updated and saved to database.');
  };

  return (
    <>
      {/* Company Settings */}
      {activeCategory === 'company' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Company settings</h3>
            <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase">Establish organizational credentials, default branding and timezone settings</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Company Name</label>
              <input 
                type="text" 
                value={companyBranding.name}
                onChange={e => { onFieldChange?.(); setCompanyBranding({ ...companyBranding, name: e.target.value }); }}
                className="saas-input w-full px-3 py-2"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Company Logo URL</label>
              <input 
                type="text" 
                placeholder="Enter image URL..."
                value={companyBranding.logo}
                onChange={e => { onFieldChange?.(); setCompanyBranding({ ...companyBranding, logo: e.target.value }); }}
                className="saas-input w-full px-3 py-2"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Global Timezone</label>
              <select
                value={companyBranding.timezone}
                onChange={e => { onFieldChange?.(); setCompanyBranding({ ...companyBranding, timezone: e.target.value }); }}
                className="saas-input w-full px-3 py-2 cursor-pointer font-bold"
              >
                <option>UTC+05:30 (Kolkata)</option>
                <option>UTC+00:00 (London)</option>
                <option>UTC-08:00 (PST)</option>
                <option>UTC+08:00 (Singapore)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">System Currency</label>
              <select
                value={companyBranding.currency}
                onChange={e => { onFieldChange?.(); setCompanyBranding({ ...companyBranding, currency: e.target.value }); }}
                className="saas-input w-full px-3 py-2 cursor-pointer font-bold"
              >
                <option>INR (₹)</option>
                <option>USD ($)</option>
                <option>EUR (€)</option>
                <option>GBP (£)</option>
              </select>
            </div>
          </div>


        </div>
      )}

      {/* Users & Roles settings */}
      {activeCategory === 'roles' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Users & Roles</h3>
            <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase">Create corporate accounts, assign access configurations and edit permission credentials</p>
          </div>

          {/* Advanced Embedded Permissions Matrix */}
          <div className="pt-2">
            <RolesPermissionsPage embed={true} />
          </div>
        </div>
      )}

      {/* Payroll Settings */}
      {activeCategory === 'payroll' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Payroll Settings</h3>
            <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase">Manage salary payout frequencies, tax regime rules and overtime allowances</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Salary Release Cycle</label>
              <select
                value={payrollConfig.salaryCycle}
                onChange={e => { onFieldChange?.(); setPayrollConfig({ ...payrollConfig, salaryCycle: e.target.value }); }}
                className="saas-input w-full px-3 py-2 cursor-pointer font-bold"
              >
                <option>Monthly (1st)</option>
                <option>Monthly (Last Working Day)</option>
                <option>Bi-Weekly (Alternate Fridays)</option>
                <option>Weekly (Saturdays)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tax Bracket Structure</label>
              <select
                value={payrollConfig.taxRegime}
                onChange={e => { onFieldChange?.(); setPayrollConfig({ ...payrollConfig, taxRegime: e.target.value }); }}
                className="saas-input w-full px-3 py-2 cursor-pointer font-bold"
              >
                <option>Standard 2026</option>
                <option>FY 2026-27 New Tax Regime</option>
                <option>FY 2026-27 Old Tax Regime</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Overtime Hourly Rate multiplier</label>
              <input 
                type="text" 
                value={payrollConfig.overtimeRate}
                onChange={e => { onFieldChange?.(); setPayrollConfig({ ...payrollConfig, overtimeRate: e.target.value }); }}
                className="saas-input w-full px-3 py-2"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Bonus Pool Cap rules</label>
              <input 
                type="text" 
                value={payrollConfig.bonusRules}
                onChange={e => { onFieldChange?.(); setPayrollConfig({ ...payrollConfig, bonusRules: e.target.value }); }}
                className="saas-input w-full px-3 py-2"
              />
            </div>

            <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-850/50 rounded-2xl col-span-1 md:col-span-2">
              <div>
                <span className="font-black uppercase text-slate-900 dark:text-white">Auto release payroll approvals</span>
                <p className="text-[8.5px] text-slate-400 font-bold uppercase mt-0.5">Release net payslips at end of month cycle without manual trigger check</p>
              </div>
              <button
                type="button"
                onClick={() => { onFieldChange?.(); setPayrollConfig({ ...payrollConfig, autoRelease: !payrollConfig.autoRelease }); }}
                className={cn(
                  "w-10 h-6 rounded-full p-1 transition-all cursor-pointer",
                  payrollConfig.autoRelease ? "bg-blue-600 flex justify-end" : "bg-slate-200 dark:bg-slate-850 flex justify-start"
                )}
              >
                <span className="w-4 h-4 bg-white rounded-full shadow-sm" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Settings */}
      {activeCategory === 'attendance' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Attendance Settings</h3>
            <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase">Set corporate login timers, grace check-in ranges and biometric sync toggles</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Shift Hours (Start)</label>
              <input 
                type="text" 
                value={attendanceConfig.shiftStart}
                onChange={e => { onFieldChange?.(); setAttendanceConfig({ ...attendanceConfig, shiftStart: e.target.value }); }}
                onBlur={() => {
                  if (onSaveSystemSettings) onSaveSystemSettings({ attendance: attendanceConfig });
                }}
                className="saas-input w-full px-3 py-2 font-mono"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Shift Hours (End)</label>
              <input 
                type="text" 
                value={attendanceConfig.shiftEnd}
                onChange={e => { onFieldChange?.(); setAttendanceConfig({ ...attendanceConfig, shiftEnd: e.target.value }); }}
                onBlur={() => {
                  if (onSaveSystemSettings) onSaveSystemSettings({ attendance: attendanceConfig });
                }}
                className="saas-input w-full px-3 py-2 font-mono"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Late Arrival Grace Buffer</label>
              <input 
                type="text" 
                value={attendanceConfig.graceBuffer}
                onChange={e => { onFieldChange?.(); setAttendanceConfig({ ...attendanceConfig, graceBuffer: e.target.value }); }}
                onBlur={() => {
                  if (onSaveSystemSettings) onSaveSystemSettings({ attendance: attendanceConfig });
                }}
                className="saas-input w-full px-3 py-2"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Allowed Break Duration</label>
              <input 
                type="text" 
                value={attendanceConfig.maxBreakTime || '60 Mins'}
                onChange={e => { onFieldChange?.(); setAttendanceConfig({ ...attendanceConfig, maxBreakTime: e.target.value }); }}
                onBlur={() => {
                  if (onSaveSystemSettings) onSaveSystemSettings({ attendance: attendanceConfig });
                }}
                className="saas-input w-full px-3 py-2"
              />
            </div>

            <div className="space-y-4 md:col-span-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              {[
                { id: 'lateDeductionActive', title: 'Activate salary deduction for late arrivals', desc: 'Auto calculate pay cuts after exceeding monthly late threshold limits' },
                { id: 'biometricSync', title: 'Automated biometric card sync', desc: 'Sync swipe card machines in real time to calculate check-in/out stamps' }
              ].map(opt => (
                <div key={opt.id} className="flex justify-between items-center p-4 bg-slate-55/50 dark:bg-slate-850/50 rounded-2xl">
                  <div>
                    <span className="font-black uppercase text-slate-900 dark:text-white">{opt.title}</span>
                    <p className="text-[8.5px] text-slate-400 font-bold uppercase mt-0.5">{opt.desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onFieldChange?.();
                      const updatedAttendance = { ...attendanceConfig, [opt.id]: !attendanceConfig[opt.id as keyof typeof attendanceConfig] };
                      setAttendanceConfig(updatedAttendance);
                      if (onSaveSystemSettings) onSaveSystemSettings({ attendance: updatedAttendance });
                    }}
                    className={cn(
                      "w-10 h-6 rounded-full p-1 transition-all cursor-pointer",
                      attendanceConfig[opt.id as keyof typeof attendanceConfig] ? "bg-blue-600 flex justify-end" : "bg-slate-200 dark:bg-slate-850 flex justify-start"
                    )}
                  >
                    <span className="w-4 h-4 bg-white rounded-full shadow-sm" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Leave Settings */}
      {activeCategory === 'leaves' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Leave & Holiday configs</h3>
            <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase">Edit annual leave allowances types and manage corporate holidays calendar</p>
          </div>

          {/* Leave Allowance Configuration */}
          <div className="p-5 bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-4">
            <span className="font-black uppercase text-slate-900 dark:text-white block">Role-Based Annual Leave Allowance</span>
            <p className="text-[8.5px] font-bold text-slate-400 uppercase mt-0.5">Define maximum yearly leave count for HR and Employee roles</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 text-left">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">HR Leave Allowance</label>
                  <span className="text-xs font-black text-blue-500 dark:text-blue-400">{leaveConfig.hrMaxLeaves || 24} Days</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const newMax = Math.max(1, (leaveConfig.hrMaxLeaves || 24) - 1);
                      const newLeave = { ...leaveConfig, hrMaxLeaves: newMax };
                      setLeaveConfig(newLeave);
                      if (onSaveSystemSettings) onSaveSystemSettings({ leave: newLeave });
                    }}
                    className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-300 font-black flex items-center justify-center cursor-pointer transition-all active:scale-95"
                  >
                    -
                  </button>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={leaveConfig.hrMaxLeaves || 24}
                    onChange={(e) => {
                      const newMax = parseInt(e.target.value);
                      const newLeave = { ...leaveConfig, hrMaxLeaves: newMax };
                      setLeaveConfig(newLeave);
                      if (onSaveSystemSettings) onSaveSystemSettings({ leave: newLeave });
                    }}
                    className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newMax = Math.min(50, (leaveConfig.hrMaxLeaves || 24) + 1);
                      const newLeave = { ...leaveConfig, hrMaxLeaves: newMax };
                      setLeaveConfig(newLeave);
                      if (onSaveSystemSettings) onSaveSystemSettings({ leave: newLeave });
                    }}
                    className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-300 font-black flex items-center justify-center cursor-pointer transition-all active:scale-95"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-left">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Employee Leave Allowance</label>
                  <span className="text-xs font-black text-blue-500 dark:text-blue-400">{leaveConfig.employeeMaxLeaves || 24} Days</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const newMax = Math.max(1, (leaveConfig.employeeMaxLeaves || 24) - 1);
                      const newLeave = { ...leaveConfig, employeeMaxLeaves: newMax };
                      setLeaveConfig(newLeave);
                      if (onSaveSystemSettings) onSaveSystemSettings({ leave: newLeave });
                    }}
                    className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-300 font-black flex items-center justify-center cursor-pointer transition-all active:scale-95"
                  >
                    -
                  </button>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={leaveConfig.employeeMaxLeaves || 24}
                    onChange={(e) => {
                      const newMax = parseInt(e.target.value);
                      const newLeave = { ...leaveConfig, employeeMaxLeaves: newMax };
                      setLeaveConfig(newLeave);
                      if (onSaveSystemSettings) onSaveSystemSettings({ leave: newLeave });
                    }}
                    className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newMax = Math.min(50, (leaveConfig.employeeMaxLeaves || 24) + 1);
                      const newLeave = { ...leaveConfig, employeeMaxLeaves: newMax };
                      setLeaveConfig(newLeave);
                      if (onSaveSystemSettings) onSaveSystemSettings({ leave: newLeave });
                    }}
                    className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-300 font-black flex items-center justify-center cursor-pointer transition-all active:scale-95"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Individual Employee Leave Allowance */}
          <div className="p-5 bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <span className="font-black uppercase text-slate-900 dark:text-white block">Individual Staff Leave Allowances</span>
                <p className="text-[8.5px] font-bold text-slate-400 uppercase mt-0.5">Customize yearly leave count for specific employees</p>
              </div>
              <input 
                type="text" 
                placeholder="Search staff member..." 
                className="saas-input py-1.5 px-3 text-xs w-full sm:w-48 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-700/50"
                value={employeesSearch}
                onChange={e => setEmployeesSearch(e.target.value)}
              />
            </div>

            <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 max-h-60 no-scrollbar">
              <table className="w-full text-left border-collapse text-[10.5px] font-bold text-slate-700 dark:text-slate-300">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-850/60 border-b border-slate-150 dark:border-slate-800">
                    <th className="p-3 font-black uppercase text-slate-400">Staff Member</th>
                    <th className="p-3 font-black uppercase text-slate-400">Dept / Role</th>
                    <th className="p-3 font-black uppercase text-slate-400 text-center">Leave Allowance</th>
                    <th className="p-3 font-black uppercase text-slate-400 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {employees
                    .filter(emp => {
                      const name = emp.fullName || emp.name || '';
                      const dept = emp.department || emp.dept || '';
                      const design = emp.designation || '';
                      const search = employeesSearch.toLowerCase();
                      return name.toLowerCase().includes(search) || 
                             dept.toLowerCase().includes(search) || 
                             design.toLowerCase().includes(search);
                    })
                    .map((emp) => {
                      const isHr = emp.department === 'HR' || emp.fullName === 'Priya Patel' || emp.fullName === 'Dipak Patil';
                      const defaultLimit = isHr ? (leaveConfig.hrMaxLeaves || 24) : (leaveConfig.employeeMaxLeaves || 24);
                      const currentLimit = emp.maxLeaves !== undefined ? emp.maxLeaves : defaultLimit;
                      const hasCustomLimit = emp.maxLeaves !== undefined && emp.maxLeaves !== defaultLimit;

                      return (
                        <tr key={emp._id} className="hover:bg-slate-55/50 dark:hover:bg-slate-850/20">
                          <td className="p-3 flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-[10px] font-black flex items-center justify-center">
                              {((emp.fullName || emp.name || 'E').split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2))}
                            </div>
                            <div>
                              <span className="text-slate-900 dark:text-white uppercase font-black block">{emp.fullName || emp.name}</span>
                              <span className="text-[8px] font-bold text-slate-400 block">{emp.email}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="text-slate-900 dark:text-white block">{emp.department || emp.dept}</span>
                            <span className="text-[8px] font-bold text-slate-400 block uppercase">{emp.designation}</span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleUpdateEmployeeLeaveLimit(emp._id, Math.max(1, currentLimit - 1))}
                                className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-black flex items-center justify-center cursor-pointer transition-all active:scale-95"
                              >
                                -
                              </button>
                              <input 
                                type="number"
                                value={currentLimit}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value);
                                  if (!isNaN(val) && val >= 1 && val <= 100) {
                                    handleUpdateEmployeeLeaveLimit(emp._id, val);
                                  }
                                }}
                                className="w-12 py-0.5 text-center bg-slate-50 dark:bg-slate-855 border border-slate-200 dark:border-slate-750 rounded-lg font-mono text-xs text-slate-800 dark:text-slate-200 outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleUpdateEmployeeLeaveLimit(emp._id, Math.min(100, currentLimit + 1))}
                                className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-black flex items-center justify-center cursor-pointer transition-all active:scale-95"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="p-3 text-right">
                            {hasCustomLimit ? (
                              <button
                                type="button"
                                onClick={() => handleUpdateEmployeeLeaveLimit(emp._id, defaultLimit)}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-250 text-slate-650 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 text-[8px] font-black uppercase rounded-lg cursor-pointer"
                              >
                                Reset
                              </button>
                            ) : (
                              <span className="text-[8px] font-bold text-slate-400 uppercase">Default</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  {employees.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-xs text-slate-400 font-medium uppercase">
                        Loading employee database...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Leave Types Management */}
          <div className="space-y-4">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Configured Leave Types Allowance</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {leaveConfig.leaveTypes.map((leave, idx) => (
                <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 rounded-2xl flex justify-between items-center">
                  <div>
                    <span className="font-black uppercase text-slate-950 dark:text-white block">{leave.name}</span>
                    <span className="text-[9px] font-bold text-slate-400 block mt-0.5">{leave.days} Days / Year</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setLeaveConfig({
                      ...leaveConfig,
                      leaveTypes: leaveConfig.leaveTypes.filter((_, i) => i !== idx)
                    })}
                    className="text-slate-400 hover:text-rose-500 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2 max-w-md pt-2">
              <input 
                type="text" 
                placeholder="Leave type..."
                value={newLeaveName}
                onChange={e => setNewLeaveName(e.target.value)}
                className="saas-input w-full px-3 py-1.5"
              />
              <input 
                type="number" 
                placeholder="Days"
                value={newLeaveDays}
                onChange={e => setNewLeaveDays(parseInt(e.target.value) || 0)}
                className="saas-input w-24 px-3 py-1.5"
              />
              <button 
                type="button"
                onClick={() => {
                  if (!newLeaveName.trim()) return;
                  setLeaveConfig({
                    ...leaveConfig,
                    leaveTypes: [...leaveConfig.leaveTypes, { name: newLeaveName.trim(), days: newLeaveDays }]
                  });
                  setNewLeaveName('');
                  setNewLeaveDays(10);
                  triggerToast('Leave category added');
                }}
                className="px-4 py-1.5 bg-slate-850 hover:bg-slate-700 text-white rounded-xl text-[9px] font-black uppercase cursor-pointer"
              >
                Add
              </button>
            </div>
          </div>

          {/* Holiday Calendar */}
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Corporate Holiday Calendar (2026)</label>
            <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-2xl">
              <table className="w-full text-left border-collapse text-[10px] font-bold text-slate-700 dark:text-slate-300">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-850/60 border-b border-slate-150 dark:border-slate-800">
                    <th className="p-3.5 font-black uppercase text-slate-400">Holiday Event</th>
                    <th className="p-3.5 font-black uppercase text-slate-400">Calendar Date</th>
                    <th className="p-3.5 font-black uppercase text-slate-400 text-right">Remove</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {leaveConfig.holidayCalendar.map((hol, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20">
                      <td className="p-3.5 text-slate-900 dark:text-white uppercase font-black">{hol.title}</td>
                      <td className="p-3.5 font-mono">{new Date(hol.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</td>
                      <td className="p-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            const newLeave = {
                              ...leaveConfig,
                              holidayCalendar: leaveConfig.holidayCalendar.filter((_, i) => i !== idx)
                            };
                            setLeaveConfig(newLeave);
                            if (onSaveSystemSettings) {
                              onSaveSystemSettings({ leave: newLeave });
                            }
                            triggerToast('Holiday deleted and saved to database.');
                          }}
                          className="text-slate-400 hover:text-rose-500 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-2 max-w-md pt-2">
              <input 
                type="text" 
                placeholder="Holiday Event Name..."
                value={newHolidayTitle}
                onChange={e => setNewHolidayTitle(e.target.value)}
                className="saas-input w-full px-3 py-1.5"
              />
              <input 
                type="date" 
                value={newHolidayDate}
                onChange={e => setNewHolidayDate(e.target.value)}
                className="saas-input w-48 px-3 py-1.5"
              />
              <button 
                type="button"
                onClick={() => {
                  if (!newHolidayTitle.trim() || !newHolidayDate) return;
                  const newLeave = {
                    ...leaveConfig,
                    holidayCalendar: [...leaveConfig.holidayCalendar, { title: newHolidayTitle.trim(), date: newHolidayDate }]
                  };
                  setLeaveConfig(newLeave);
                  if (onSaveSystemSettings) {
                    onSaveSystemSettings({ leave: newLeave });
                  }
                  setNewHolidayTitle('');
                  setNewHolidayDate('');
                  triggerToast('Holiday added and saved to database.');
                }}
                className="px-4 py-1.5 bg-slate-850 hover:bg-slate-700 text-white rounded-xl text-[9px] font-black uppercase cursor-pointer shadow-sm"
              >
                Add
              </button>
            </div>
          </div>

          {/* Approval Flow */}
          <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Leave Approval Workflow Flow</label>
            <input 
              type="text" 
              value={leaveConfig.approvalFlow}
              onChange={e => setLeaveConfig({ ...leaveConfig, approvalFlow: e.target.value })}
              className="saas-input w-full px-3 py-2"
            />
          </div>
        </div>
      )}

      {/* Recruitment Settings */}
      {activeCategory === 'recruitment' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Recruitment Settings</h3>
            <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase font-sans">Setup candidate pipeline stages levels and edit default job posting templates</p>
          </div>

          {/* Interview Stages */}
          <div className="space-y-4">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Active Interview Stages</label>
            <div className="flex flex-wrap gap-2">
              {recruitmentConfig.interviewStages.map((stage, idx) => (
                <span key={idx} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-950 dark:text-white rounded-xl font-bold flex items-center gap-1.5">
                  {idx + 1}. {stage}
                  <button 
                    type="button"
                    onClick={() => setRecruitmentConfig({
                      ...recruitmentConfig,
                      interviewStages: recruitmentConfig.interviewStages.filter((_, i) => i !== idx)
                    })}
                    className="text-slate-400 hover:text-rose-500 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2 max-w-sm pt-1">
              <input 
                type="text" 
                placeholder="Add stage name..."
                value={newStageName}
                onChange={e => setNewStageName(e.target.value)}
                className="saas-input w-full px-3 py-1.5"
              />
              <button 
                type="button"
                onClick={() => {
                  if (!newStageName.trim()) return;
                  setRecruitmentConfig({
                    ...recruitmentConfig,
                    interviewStages: [...recruitmentConfig.interviewStages, newStageName.trim()]
                  });
                  setNewStageName('');
                  triggerToast('Interview pipeline stage added');
                }}
                className="px-4 py-1.5 bg-slate-850 hover:bg-slate-700 text-white rounded-xl text-[9px] font-black uppercase cursor-pointer"
              >
                Add
              </button>
            </div>
          </div>

          {/* Job templates */}
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Standard Job Posting Templates</label>
            <div className="space-y-3">
              {recruitmentConfig.jobTemplates.map((tpl, idx) => (
                <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-100 dark:border-slate-800 flex justify-between items-start">
                  <div>
                    <span className="font-black uppercase text-slate-900 dark:text-white block">{tpl.title}</span>
                    <p className="text-[9px] text-slate-400 font-bold mt-1 leading-normal uppercase">{tpl.description}</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setRecruitmentConfig({
                      ...recruitmentConfig,
                      jobTemplates: recruitmentConfig.jobTemplates.filter((_, i) => i !== idx)
                    })}
                    className="text-slate-400 hover:text-rose-500 cursor-pointer shrink-0 ml-4"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-3">
              <span className="font-black uppercase block">Add Job Template</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input 
                  type="text" 
                  placeholder="Job Title..."
                  value={newTemplateTitle}
                  onChange={e => setNewTemplateTitle(e.target.value)}
                  className="saas-input w-full px-3 py-1.5"
                />
                <input 
                  type="text" 
                  placeholder="Brief Description..."
                  value={newTemplateDesc}
                  onChange={e => setNewTemplateDesc(e.target.value)}
                  className="saas-input w-full px-3 py-1.5"
                />
              </div>
              <button 
                type="button"
                onClick={() => {
                  if (!newTemplateTitle.trim() || !newTemplateDesc.trim()) return;
                  setRecruitmentConfig({
                    ...recruitmentConfig,
                    jobTemplates: [...recruitmentConfig.jobTemplates, { title: newTemplateTitle.trim(), description: newTemplateDesc.trim() }]
                  });
                  setNewTemplateTitle('');
                  setNewTemplateDesc('');
                  triggerToast('Job template added to database');
                }}
                className="px-4 py-1.5 bg-slate-850 hover:bg-slate-700 text-white rounded-xl text-[9px] font-black uppercase cursor-pointer"
              >
                Add Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Security Settings */}
      {activeCategory === 'security' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Security Settings</h3>
            <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase">Set password policy, configure Two-Factor authentication and manage user session timeouts</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Minimum Password Length requirement</label>
              <input 
                type="number" 
                value={securityConfig.minPasswordLength}
                onChange={e => { onFieldChange?.(); setSecurityConfig({ ...securityConfig, minPasswordLength: parseInt(e.target.value) || 8 }); }}
                className="saas-input w-full px-3 py-2 font-mono"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Inactive Session Timeout (Minutes)</label>
              <input 
                type="number" 
                value={securityConfig.sessionExpiryMinutes}
                onChange={e => { onFieldChange?.(); setSecurityConfig({ ...securityConfig, sessionExpiryMinutes: parseInt(e.target.value) || 60 }); }}
                className="saas-input w-full px-3 py-2 font-mono"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Allowed IP Ranges (Restrictions)</label>
              <input 
                type="text" 
                value={securityConfig.ipRestrictions}
                onChange={e => { onFieldChange?.(); setSecurityConfig({ ...securityConfig, ipRestrictions: e.target.value }); }}
                className="saas-input w-full px-3 py-2 font-mono"
              />
            </div>

            <div className="flex justify-between items-center p-4 bg-slate-55/50 dark:bg-slate-850/50 rounded-2xl col-span-1 md:col-span-2">
              <div>
                <span className="font-black uppercase text-slate-900 dark:text-white">Enforce 2-Factor Authentication (2FA)</span>
                <p className="text-[8.5px] text-slate-400 font-bold uppercase mt-0.5">Force all system users to configure secondary verification checks during login</p>
              </div>
              <button
                type="button"
                onClick={() => { onFieldChange?.(); setSecurityConfig({ ...securityConfig, twoFactorAuthActive: !securityConfig.twoFactorAuthActive }); }}
                className={cn(
                  "w-10 h-6 rounded-full p-1 transition-all cursor-pointer",
                  securityConfig.twoFactorAuthActive ? "bg-blue-600 flex justify-end" : "bg-slate-200 dark:bg-slate-850 flex justify-start"
                )}
              >
                <span className="w-4 h-4 bg-white rounded-full shadow-sm" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification settings */}
      {activeCategory === 'notifications' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">System Notification configs</h3>
            <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase">Set default global parameters triggers for push and email alerts</p>
          </div>

          <div className="space-y-4">
            {[
              { id: 'emailNotifications', title: 'Global Email Notifications system', desc: 'Allows system to dispatch notifications email alerts' },
              { id: 'pushNotifications', title: 'Desktop Push Notifications triggers', desc: 'Transmit browser system tray notifications logs' },
              { id: 'hrAlerts', title: 'HR Reminders & Alerts system', desc: 'Enable notification alerts for onboarding and documents' },
              { id: 'employeeReminders', title: 'Task Deadline reminders', desc: 'Auto remind employees about active project targets' }
            ].map(notif => (
              <div key={notif.id} className="flex justify-between items-center p-4 bg-slate-55/50 dark:bg-slate-850/50 rounded-2xl">
                <div>
                  <span className="font-black uppercase text-slate-900 dark:text-white">{notif.title}</span>
                  <p className="text-[8.5px] text-slate-400 font-bold uppercase mt-0.5">{notif.desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => { onFieldChange?.(); setNotificationConfig({ ...notificationConfig, [notif.id]: !notificationConfig[notif.id as keyof typeof notificationConfig] }); }}
                  className={cn(
                    "w-10 h-6 rounded-full p-1 transition-all cursor-pointer",
                    notificationConfig[notif.id as keyof typeof notificationConfig] ? "bg-blue-600 flex justify-end" : "bg-slate-200 dark:bg-slate-850 flex justify-start"
                  )}
                >
                  <span className="w-4 h-4 bg-white rounded-full shadow-sm" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Workplace Chat Setup */}
      {activeCategory === 'chat-admin' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-500" />
              Workplace Chat Setup
            </h3>
            <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">Configure Slack-style company workspace branding and message controls.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Workspace Chat Name */}
            <div className="space-y-2 text-left">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Workplace Chat Name</label>
              <input 
                type="text" 
                value={chatConfig.workspaceName}
                onChange={e => { onFieldChange?.(); setChatConfig({ ...chatConfig, workspaceName: e.target.value }); }}
                className="saas-input w-full px-3 py-2 text-xs"
              />
              <p className="text-[8px] text-slate-400 uppercase font-medium">Custom branding name displayed inside the chat sidebar header.</p>
            </div>

            {/* Workspace Chat Logo URL */}
            <div className="space-y-2 text-left">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Workspace Chat Logo URL</label>
              <input 
                type="text" 
                value={chatConfig.workspaceLogo}
                placeholder="https://example.com/logo.png"
                onChange={e => { onFieldChange?.(); setChatConfig({ ...chatConfig, workspaceLogo: e.target.value }); }}
                className="saas-input w-full px-3 py-2 text-xs"
              />
              <p className="text-[8px] text-slate-400 uppercase font-medium">Optional logo url displayed in the chat panels headers.</p>
            </div>

            {/* Restricted keywords */}
            <div className="space-y-2 col-span-1 md:col-span-2 text-left">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Restricted Keywords (Comma Separated)</label>
              <input 
                type="text" 
                value={chatConfig.restrictedKeywords}
                onChange={e => { onFieldChange?.(); setChatConfig({ ...chatConfig, restrictedKeywords: e.target.value }); }}
                className="saas-input w-full px-3 py-2 text-xs"
              />
              <p className="text-[8px] text-slate-400 uppercase font-medium">Define words to restrict. These will trigger filters or logs when posted.</p>
            </div>

            {/* Switches */}
            {[
              { id: 'allowEmployeeChannelCreate', title: 'Allow Employees to Create Public Channels', desc: 'Allows regular employees to launch public discussion groups.' },
              { id: 'allowEmployeeChannelPrivateCreate', title: 'Allow Employees to Create Private Channels', desc: 'Allows regular employees to launch lock-restricted rooms.' },
              { id: 'allowAnnouncementsPostAll', title: 'Allow Everyone to Post in #announcements', desc: 'If disabled, only Admin and HR roles can broadcast to announcements channel.' },
              { id: 'allowEmployeeEditDelete', title: 'Allow Employees to Edit or Delete Sent Messages', desc: 'If disabled, employees cannot edit or recall sent messages.' }
            ].map(rule => (
              <div key={rule.id} className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-955/20 rounded-2xl border border-slate-100 dark:border-slate-800/60 col-span-1 md:col-span-2 text-left">
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-800 dark:text-white block">{rule.title}</span>
                  <p className="text-[8.5px] text-slate-450 uppercase mt-0.5">{rule.desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => { onFieldChange?.(); setChatConfig({ ...chatConfig, [rule.id]: !chatConfig[rule.id as keyof typeof chatConfig] }); }}
                  className={cn(
                    "w-10 h-6 rounded-full p-1 transition-all cursor-pointer",
                    chatConfig[rule.id as keyof typeof chatConfig] ? "bg-blue-600 flex justify-end" : "bg-slate-200 dark:bg-slate-850 flex justify-start"
                  )}
                >
                  <span className="w-4 h-4 bg-white rounded-full shadow-sm" />
                </button>
              </div>
            ))}

          </div>
        </div>
      )}

      {/* Organization Settings */}
      {activeCategory === 'org' && (
        <div className="space-y-6 text-left">
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2">
              <Layout className="w-4 h-4 text-blue-500" />
              Organization Settings
            </h3>
            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Manage branches, department structures, corporate designations, cost centers & shifts.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Branch Management */}
            <div className="p-5 bg-slate-50 dark:bg-slate-950/20 rounded-2xl border border-slate-100 dark:border-slate-800/65 space-y-4">
              <span className="font-black uppercase text-[10px] tracking-wider text-slate-900 dark:text-white block">Branch Management</span>
              <div className="space-y-2">
                {orgConfig.branches.map((branch) => (
                  <div key={branch} className="flex justify-between items-center px-3 py-2 bg-white dark:bg-slate-900/60 rounded-xl border border-slate-200/50 dark:border-slate-800/40 text-[10.5px]">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{branch}</span>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 text-[7.5px] font-black uppercase tracking-wider">Active</span>
                      <button
                        type="button"
                        onClick={() => {
                          onFieldChange?.();
                          setOrgConfig({
                            ...orgConfig,
                            branches: orgConfig.branches.filter(b => b !== branch)
                          });
                          triggerToast("Branch removed. Save settings to persist.");
                        }}
                        className="text-rose-500 hover:text-rose-600 bg-transparent border-none cursor-pointer p-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="New Branch..."
                  id="new-branch-input"
                  className="saas-input flex-1 px-3 py-1.5 text-xs"
                />
                <button 
                  type="button" 
                  onClick={() => {
                    const input = document.getElementById('new-branch-input') as HTMLInputElement;
                    if (input && input.value.trim()) {
                      onFieldChange?.();
                      setOrgConfig({
                        ...orgConfig,
                        branches: [...orgConfig.branches, input.value.trim()]
                      });
                      triggerToast("Branch added. Click Save to persist.");
                      input.value = '';
                    }
                  }}
                  className="px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[9px] font-black uppercase tracking-wider cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Department Management */}
            <div className="p-5 bg-slate-50 dark:bg-slate-950/20 rounded-2xl border border-slate-100 dark:border-slate-800/65 space-y-4">
              <span className="font-black uppercase text-[10px] tracking-wider text-slate-900 dark:text-white block">Department List</span>
              <div className="space-y-2">
                {companyBranding.departments.map((dept) => (
                  <div key={dept} className="flex justify-between items-center px-3 py-2 bg-white dark:bg-slate-900/60 rounded-xl border border-slate-200/50 dark:border-slate-800/40 text-[10.5px]">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{dept}</span>
                    <button 
                      type="button"
                      onClick={() => {
                        onFieldChange?.();
                        setCompanyBranding({
                          ...companyBranding,
                          departments: companyBranding.departments.filter(d => d !== dept)
                        });
                        triggerToast("Department removed. Save configurations to persist.");
                      }}
                      className="text-rose-500 hover:text-rose-600 bg-transparent border-none cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="New Department..."
                  id="new-dept-input"
                  className="saas-input flex-1 px-3 py-1.5 text-xs"
                />
                <button 
                  type="button" 
                  onClick={() => {
                    const input = document.getElementById('new-dept-input') as HTMLInputElement;
                    if (input && input.value.trim()) {
                      onFieldChange?.();
                      setCompanyBranding({
                        ...companyBranding,
                        departments: [...companyBranding.departments, input.value.trim()]
                      });
                      triggerToast("Department added. Click Save to persist.");
                      input.value = '';
                    }
                  }}
                  className="px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[9px] font-black uppercase tracking-wider cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Designations & Shifts */}
            <div className="p-5 bg-slate-50 dark:bg-slate-950/20 rounded-2xl border border-slate-100 dark:border-slate-800/65 col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <span className="font-black uppercase text-[10px] tracking-wider text-slate-900 dark:text-white block">Corporate Designations</span>
                <div className="flex flex-wrap gap-1.5 items-center">
                  {orgConfig.designations.map((desig) => (
                    <span key={desig} className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800/80 rounded-lg text-[9px] font-bold text-slate-600 dark:text-slate-350 flex items-center gap-1.5">
                      {desig}
                      <button
                        type="button"
                        onClick={() => {
                          onFieldChange?.();
                          setOrgConfig({
                            ...orgConfig,
                            designations: orgConfig.designations.filter(d => d !== desig)
                          });
                          triggerToast("Designation removed.");
                        }}
                        className="text-rose-500 hover:text-rose-600 bg-transparent border-none cursor-pointer p-0 leading-none"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <input 
                    type="text" 
                    placeholder="New Designation..."
                    id="new-desig-input"
                    className="saas-input flex-1 px-3 py-1 text-[10px]"
                  />
                  <button 
                    type="button" 
                    onClick={() => {
                      const input = document.getElementById('new-desig-input') as HTMLInputElement;
                      if (input && input.value.trim()) {
                        onFieldChange?.();
                        setOrgConfig({
                          ...orgConfig,
                          designations: [...orgConfig.designations, input.value.trim()]
                        });
                        triggerToast("Designation added.");
                        input.value = '';
                      }
                    }}
                    className="px-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                <span className="font-black uppercase text-[10px] tracking-wider text-slate-900 dark:text-white block">Shift Templates</span>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[9px] px-2 py-1 bg-blue-500/5 border border-blue-500/10 rounded-lg">
                    <span className="font-bold text-blue-600 dark:text-blue-400">Regular General Shift</span>
                    <span className="text-slate-400 uppercase font-semibold">09:00 AM - 06:00 PM</span>
                  </div>
                  <div className="flex justify-between items-center text-[9px] px-2 py-1 bg-slate-500/5 border border-slate-500/10 rounded-lg">
                    <span className="font-bold text-slate-500">Technical Night Shift</span>
                    <span className="text-slate-450 uppercase font-semibold">09:00 PM - 06:00 AM</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Workflow Automation */}
      {activeCategory === 'workflow' && (
        <div className="space-y-6 text-left">
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2">
              <Workflow className="w-4 h-4 text-blue-500" />
              Workflow Automation
            </h3>
            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Configure onboarding/offboarding checklist steps and multi-level approval matrix guidelines.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Approval Workflows */}
            <div className="p-5 bg-slate-50 dark:bg-slate-950/20 rounded-2xl border border-slate-100 dark:border-slate-800/65 space-y-4">
              <span className="font-black uppercase text-[10px] tracking-wider text-slate-900 dark:text-white block">Approval Workflows</span>
              <div className="space-y-3">
                {[
                  { label: 'Leave Approvals', desc: 'Manager -> Department Head -> HR Manager' },
                  { label: 'Expense Reimbursements', desc: 'Manager -> Financial Auditor -> CFO' },
                  { label: 'Payroll Approval Rules', desc: 'HR Specialist -> Operations Head -> Director' }
                ].map((item) => (
                  <div key={item.label} className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/50 dark:border-slate-800/40 text-left">
                    <span className="text-[10.5px] font-black uppercase text-slate-800 dark:text-slate-100 block">{item.label}</span>
                    <span className="text-[9px] text-blue-600 dark:text-blue-400 font-bold block mt-1">{item.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Lifecycle Workflows */}
            <div className="p-5 bg-slate-50 dark:bg-slate-950/20 rounded-2xl border border-slate-100 dark:border-slate-800/65 space-y-4">
              <span className="font-black uppercase text-[10px] tracking-wider text-slate-900 dark:text-white block">Lifecycle Workflows</span>
              <div className="space-y-3">
                {[
                  { label: 'Onboarding Checklist', count: '5 Tasks mapped', desc: 'Collect credentials, provision email, assign supervisor, laptop logistics.' },
                  { label: 'Offboarding Checklist', count: '4 Tasks mapped', desc: 'Asset retrieval, exit survey, revoke permissions, final settlement calculation.' }
                ].map((item) => (
                  <div key={item.label} className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/50 dark:border-slate-800/40 text-left relative">
                    <span className="absolute top-3 right-3 px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[6.5px] font-black uppercase tracking-wider">{item.count}</span>
                    <span className="text-[10.5px] font-black uppercase text-slate-800 dark:text-slate-100 block">{item.label}</span>
                    <p className="text-[8.5px] text-slate-450 uppercase mt-1 leading-normal">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Integrations */}
      {activeCategory === 'integrations' && (
        <div className="space-y-6 text-left">
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-blue-500" />
              Third-Party Integrations
            </h3>
            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Synchronize employee listings, scheduling calendars, notifications & communication workspaces.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: 'Google Workspace', key: 'google', details: 'Gmail calendar synchronization & login authentication.', logo: '🌐' },
              { title: 'Microsoft 365', key: 'm365', details: 'Office directory mapping and single sign-on parameters.', logo: '💻' },
              { title: 'Slack Workspace', key: 'slack', details: 'Sync notifications and workplace updates directly to channels.', logo: '💬' }
            ].map((app) => {
              const status = integrationsConfig[app.key as keyof typeof integrationsConfig] || 'Configure';
              return (
                <div key={app.title} className="p-4 bg-slate-50 dark:bg-slate-950/20 rounded-2xl border border-slate-100 dark:border-slate-800/65 flex flex-col justify-between h-44 text-left">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xl">{app.logo}</span>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[7.5px] font-black uppercase tracking-wider border",
                        status === 'Connected'
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border-emerald-500/15"
                          : "bg-slate-100 text-slate-500 dark:bg-slate-850 dark:text-slate-405 border-slate-200/10"
                      )}>
                        {status}
                      </span>
                    </div>
                    <span className="text-[10.5px] font-black uppercase tracking-wider text-slate-850 dark:text-slate-100 block">{app.title}</span>
                    <p className="text-[8.5px] text-slate-450 uppercase leading-normal">{app.details}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onFieldChange?.();
                      const nextStatus = status === 'Connected' ? 'Configure' : 'Connected';
                      setIntegrationsConfig({
                        ...integrationsConfig,
                        [app.key]: nextStatus
                      });
                      triggerToast(`${app.title} is now ${nextStatus.toLowerCase()}. Click Save to persist.`);
                    }}
                    className="w-full py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800 text-[8.5px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 rounded-lg cursor-pointer transition-colors"
                  >
                    {status === 'Connected' ? 'Disconnect' : 'Connect'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Billing & Subscription */}
      {activeCategory === 'billing' && (
        <div className="space-y-6 text-left">
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-blue-500" />
              Billing & Subscriptions
            </h3>
            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Monitor subscription plan tiers, seats allocation, billing cycles & download invoices.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Current Plan Tier */}
            <div className="p-5 bg-gradient-to-br from-blue-600 to-indigo-650 rounded-2xl text-white space-y-4 md:col-span-1 flex flex-col justify-between shadow-lg shadow-blue-500/15">
              <div className="space-y-2">
                <span className="px-2 py-0.5 rounded bg-white/20 text-[7px] font-black uppercase tracking-wider inline-block">Active Plan</span>
                <select
                  value={billingConfig.plan}
                  onChange={(e) => {
                    onFieldChange?.();
                    setBillingConfig({
                      ...billingConfig,
                      plan: e.target.value
                    });
                    triggerToast(`Plan switched to ${e.target.value}. Click Save to persist.`);
                  }}
                  className="bg-transparent border border-white/20 rounded-xl px-2 py-1 text-xs font-black uppercase tracking-widest text-white w-full cursor-pointer focus:outline-none focus:bg-indigo-700 mt-1"
                >
                  <option className="bg-indigo-900 text-white" value="Starter">Starter Plan</option>
                  <option className="bg-indigo-900 text-white" value="Professional">Professional</option>
                  <option className="bg-indigo-900 text-white" value="Enterprise Growth">Enterprise Growth</option>
                </select>
                <p className="text-[8px] text-blue-200 uppercase font-medium">
                  {billingConfig.plan === 'Starter' && "Ideal for small teams under 10 employees."}
                  {billingConfig.plan === 'Professional' && "Advanced features for growing teams up to 25 employees."}
                  {billingConfig.plan === 'Enterprise Growth' && "Includes automated payroll, smart attendance, chat workspace, and 2FA settings."}
                </p>
              </div>
              <div>
                <span className="text-2xl font-black">
                  {billingConfig.plan === 'Starter' && "₹999"}
                  {billingConfig.plan === 'Professional' && "₹2,499"}
                  {billingConfig.plan === 'Enterprise Growth' && "₹4,999"}
                  <span className="text-xs font-semibold">/month</span>
                </span>
                <p className="text-[7.5px] text-blue-200 uppercase mt-1">Next renewal date: July 15, 2026 (Auto renewal active)</p>
              </div>
            </div>

            {/* Platform Stats & seats */}
            <div className="p-5 bg-slate-50 dark:bg-slate-950/20 rounded-2xl border border-slate-100 dark:border-slate-800/65 md:col-span-2 flex flex-col justify-between">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/50 dark:border-slate-800/40 text-left">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Active Seat Allocation</span>
                  <span className="text-lg font-black text-slate-800 dark:text-slate-100 mt-1 block">
                    {usersList.length} / {billingConfig.seats}
                  </span>
                  <p className="text-[7.5px] text-slate-450 uppercase mt-0.5">
                    {Math.max(0, billingConfig.seats - usersList.length)} licenses remaining
                  </p>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/50 dark:border-slate-800/40 text-left">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Storage Utilization</span>
                  <span className="text-lg font-black text-slate-800 dark:text-slate-100 mt-1 block">2.4 GB / 100 GB</span>
                  <p className="text-[7.5px] text-slate-450 uppercase mt-0.5">Documents & contracts data</p>
                </div>
              </div>
              
              <div className="mt-4 space-y-2 text-left">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Adjust Allocated Seat Licenses</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (billingConfig.seats <= usersList.length) {
                        triggerToast("Cannot reduce seats below active user count.");
                        return;
                      }
                      onFieldChange?.();
                      setBillingConfig({
                        ...billingConfig,
                        seats: Math.max(1, billingConfig.seats - 1)
                      });
                    }}
                    className="w-8 h-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-black flex items-center justify-center cursor-pointer transition-all active:scale-95"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={billingConfig.seats}
                    onChange={(e) => {
                      onFieldChange?.();
                      const val = parseInt(e.target.value) || 0;
                      setBillingConfig({
                        ...billingConfig,
                        seats: val
                      });
                    }}
                    className="saas-input w-24 px-3 py-1.5 text-xs text-center font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      onFieldChange?.();
                      setBillingConfig({
                        ...billingConfig,
                        seats: billingConfig.seats + 1
                      });
                    }}
                    className="w-8 h-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-black flex items-center justify-center cursor-pointer transition-all active:scale-95"
                  >
                    +
                  </button>
                  <span className="text-[9px] text-slate-400 font-bold uppercase ml-2">Click Save Changes below to persist updates.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Audit Logs */}
      {activeCategory === 'audit' && (
        <div className="space-y-6 text-left">
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" />
              System Audit Trails
            </h3>
            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Track security logins, settings modifications, employee onboarding approvals & payout logs.</p>
          </div>

          <div className="p-5 bg-slate-50 dark:bg-slate-950/20 rounded-2xl border border-slate-100 dark:border-slate-800/65 space-y-4">
            <span className="font-black uppercase text-[10px] tracking-wider text-slate-900 dark:text-white block">Recent Activity Log</span>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[10px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800/70 text-[8px] font-black uppercase tracking-wider text-slate-400">
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Actor</th>
                    <th className="py-2.5 px-3">Action Description</th>
                    <th className="py-2.5 px-3">Module</th>
                    <th className="py-2.5 px-3 text-right">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 dark:divide-slate-800/40 text-slate-700 dark:text-slate-300 font-medium">
                  {[
                    { time: '2026-06-26 08:14:15', actor: 'dipak patil (Admin)', action: 'Removed Theme switcher from sidebar', mod: 'SYSTEM', res: 'SUCCESS' },
                    { time: '2026-06-26 07:22:10', actor: 'dipak patil (Admin)', action: 'Modified Employee onboarding status tab', mod: 'WORKFORCE', res: 'SUCCESS' },
                    { time: '2026-06-25 18:44:02', actor: 'dipak patil (Admin)', action: 'Updated Branch selection selector logic', mod: 'COMPANY', res: 'SUCCESS' },
                    { time: '2026-06-25 15:32:11', actor: 'HR Manager', action: 'Approved Leave application for Guest user', mod: 'LEAVES', res: 'SUCCESS' }
                  ].map((log, idx) => (
                    <tr key={idx} className="hover:bg-white dark:hover:bg-slate-900/40 transition-colors">
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-400">{log.time}</td>
                      <td className="py-2.5 px-3 font-semibold">{log.actor}</td>
                      <td className="py-2.5 px-3">{log.action}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-850 text-[7px] font-black tracking-wider uppercase">{log.mod}</span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 text-[7.5px] font-black tracking-wider">{log.res}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Backup & Restore */}
      {activeCategory === 'backup' && (
        <div className="space-y-4 text-left">
          <div className="border-b border-slate-100 dark:border-slate-800/40 pb-3">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-blue-500" />
              Backup & Database Restoration
            </h3>
            <p className="text-[10.5px] text-slate-400 dark:text-slate-500 mt-0.5">Configure automated daily database backups, download snapshots & restore history points.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Automatic backups */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950/20 rounded-xl border border-slate-100 dark:border-slate-800/50 space-y-3">
              <span className="font-semibold text-[10.5px] text-slate-900 dark:text-white block">Backup Policies</span>
              <div className="flex justify-between items-center p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200/50 dark:border-slate-800/40">
                <div>
                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block">Automated Daily Backups</span>
                  <p className="text-[9.5px] text-slate-400 dark:text-slate-500 mt-0.5">Store database snapshot every night at 02:00 AM.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onFieldChange?.();
                    setBackupConfig({
                      ...backupConfig,
                      autoBackup: !backupConfig.autoBackup
                    });
                    triggerToast(!backupConfig.autoBackup ? "Automated backups enabled." : "Automated backups disabled.");
                  }}
                  className={cn(
                    "w-9 h-5 rounded-full p-0.5 transition-all cursor-pointer border-none flex items-center",
                    backupConfig.autoBackup ? "bg-blue-600 justify-end" : "bg-slate-250 dark:bg-slate-800 justify-start"
                  )}
                >
                  <span className="w-3.5 h-3.5 bg-white rounded-full shadow-sm" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  onFieldChange?.();
                  const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
                  const dateStamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
                  const randomId = Math.floor(1000 + Math.random() * 9000);
                  const newSnapshot = {
                    file: `backup_system_manual_${randomId}_${dateStamp}.zip`,
                    size: `${(23.5 + Math.random() * 2).toFixed(1)} MB`,
                    date: dateStr
                  };
                  setBackupConfig({
                    ...backupConfig,
                    snapshots: [newSnapshot, ...backupConfig.snapshots]
                  });
                  triggerToast("Manual backup snapshot created. Save changes to store in database.");
                }}
                className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10.5px] font-bold cursor-pointer transition-colors shadow-sm border-none"
              >
                Trigger Manual Backup
              </button>
            </div>

            {/* Restore points history */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950/20 rounded-xl border border-slate-100 dark:border-slate-800/50 space-y-3">
              <span className="font-semibold text-[10.5px] text-slate-900 dark:text-white block">Restore Snapshot Points</span>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {backupConfig.snapshots && backupConfig.snapshots.length > 0 ? (
                  backupConfig.snapshots.map((backup, idx) => (
                    <div key={backup.file + '-' + idx} className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200/50 dark:border-slate-800/40 flex justify-between items-center text-left">
                      <div>
                        <span className="text-[10.5px] font-medium text-slate-700 dark:text-slate-200 block truncate max-w-[200px]">{backup.file}</span>
                        <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5 block">{backup.date} — {backup.size}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => triggerToast(`Restoring snapshot ${backup.file} (simulation)...`)}
                          className="px-2.5 py-1 text-[10px] font-bold bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-850 text-slate-500 hover:text-slate-850 dark:hover:text-white rounded-lg cursor-pointer transition-colors"
                        >
                          Restore
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onFieldChange?.();
                            setBackupConfig({
                              ...backupConfig,
                              snapshots: backupConfig.snapshots.filter((_, i) => i !== idx)
                            });
                            triggerToast("Snapshot removed from queue. Click Save to persist.");
                          }}
                          className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-[9.5px] text-slate-400 font-bold uppercase py-4 text-center">No snapshot points available.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================== */}
      {/* THEME SETTINGS (Admin Global Control)                  */}
      {/* ===================================================== */}
      {activeCategory === 'theme' && (
        <div className="space-y-8">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2">
              <Palette className="w-4 h-4 text-indigo-500" />
              Theme & Appearance Settings
            </h3>
            <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase tracking-wide">
              Global theme mode — changes apply system-wide for Admin and HR panels immediately
            </p>
          </div>

          {/* Color Scheme Selector */}
          <div className="space-y-4">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Color Scheme Preference</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

              {/* ── LIGHT MODE CARD ── */}
              <button
                type="button"
                id="theme-light-btn"
                onClick={() => {
                  setThemeSettings({ ...themeSettings, defaultThemeMode: 'Light' });
                  onThemeChange?.(false);
                  triggerToast('Global theme set to Light Mode. All panels updated.');
                }}
                className={cn(
                  'relative group flex flex-col items-start gap-0 rounded-2xl border-2 text-left cursor-pointer transition-all duration-300 overflow-hidden',
                  themeSettings.defaultThemeMode === 'Light'
                    ? 'border-amber-400 shadow-xl shadow-amber-400/20 scale-[1.02]'
                    : 'border-slate-200 dark:border-slate-800 hover:border-amber-300 hover:shadow-md hover:scale-[1.01]'
                )}
              >
                {/* Card Top – preview area */}
                <div className="w-full h-24 bg-gradient-to-br from-slate-50 via-white to-slate-100 relative overflow-hidden">
                  {/* Simulated browser chrome */}
                  <div className="absolute top-3 left-3 right-3 flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-red-400/60" />
                      <div className="w-2 h-2 rounded-full bg-amber-400/60" />
                      <div className="w-2 h-2 rounded-full bg-emerald-400/60" />
                      <div className="flex-1 h-2 rounded bg-slate-200/80 ml-1" />
                    </div>
                    <div className="flex gap-1.5 mt-0.5">
                      <div className="w-8 h-4 rounded bg-amber-400/80" />
                      <div className="flex-1 h-4 rounded bg-slate-200/60" />
                      <div className="w-6 h-4 rounded bg-blue-400/60" />
                    </div>
                    <div className="space-y-1">
                      <div className="w-full h-2 rounded bg-slate-200/50" />
                      <div className="w-3/4 h-2 rounded bg-slate-100/80" />
                    </div>
                  </div>
                  {/* Active indicator glow */}
                  {themeSettings.defaultThemeMode === 'Light' && (
                    <div className="absolute inset-0 bg-amber-400/5 pointer-events-none" />
                  )}
                </div>
                {/* Card Bottom – info */}
                <div className="w-full p-3 bg-white dark:bg-slate-900 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all',
                      themeSettings.defaultThemeMode === 'Light' ? 'bg-amber-400' : 'bg-amber-100 dark:bg-amber-900/30'
                    )}>
                      <Sun className={cn('w-4 h-4', themeSettings.defaultThemeMode === 'Light' ? 'text-white' : 'text-amber-500')} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-wider">Light</p>
                      <p className="text-[8px] text-slate-400 mt-0.5">Off-whites &amp; soft grays</p>
                    </div>
                  </div>
                  {themeSettings.defaultThemeMode === 'Light' ? (
                    <span className="shrink-0 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center shadow-md shadow-amber-400/30">
                      <Check className="w-3 h-3 text-white" />
                    </span>
                  ) : (
                    <span className="shrink-0 w-5 h-5 rounded-full border-2 border-slate-200 dark:border-slate-700" />
                  )}
                </div>
              </button>

              {/* ── DARK MODE CARD ── */}
              <button
                type="button"
                id="theme-dark-btn"
                onClick={() => {
                  setThemeSettings({ ...themeSettings, defaultThemeMode: 'Dark' });
                  onThemeChange?.(true);
                  triggerToast('Global theme set to Dark Mode. All panels updated.');
                }}
                className={cn(
                  'relative group flex flex-col items-start gap-0 rounded-2xl border-2 text-left cursor-pointer transition-all duration-300 overflow-hidden',
                  themeSettings.defaultThemeMode === 'Dark'
                    ? 'border-indigo-500 shadow-xl shadow-indigo-500/20 scale-[1.02]'
                    : 'border-slate-200 dark:border-slate-800 hover:border-indigo-400 hover:shadow-md hover:scale-[1.01]'
                )}
              >
                {/* Card Top – preview area */}
                <div className="w-full h-24 bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 relative overflow-hidden">
                  {/* Simulated browser chrome dark */}
                  <div className="absolute top-3 left-3 right-3 flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-red-500/50" />
                      <div className="w-2 h-2 rounded-full bg-amber-500/50" />
                      <div className="w-2 h-2 rounded-full bg-emerald-500/50" />
                      <div className="flex-1 h-2 rounded bg-slate-700/80 ml-1" />
                    </div>
                    <div className="flex gap-1.5 mt-0.5">
                      <div className="w-8 h-4 rounded bg-indigo-500/80" />
                      <div className="flex-1 h-4 rounded bg-slate-700/60" />
                      <div className="w-6 h-4 rounded bg-slate-600/60" />
                    </div>
                    <div className="space-y-1">
                      <div className="w-full h-2 rounded bg-slate-800/80" />
                      <div className="w-3/4 h-2 rounded bg-slate-900/80" />
                    </div>
                  </div>
                  {/* Stars ambient effect */}
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="absolute w-0.5 h-0.5 rounded-full bg-white/40"
                      style={{ top: `${20 + i * 12}%`, left: `${70 + (i % 3) * 8}%` }} />
                  ))}
                  {themeSettings.defaultThemeMode === 'Dark' && (
                    <div className="absolute inset-0 bg-indigo-500/5 pointer-events-none" />
                  )}
                </div>
                {/* Card Bottom – info */}
                <div className="w-full p-3 bg-white dark:bg-slate-900 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all',
                      themeSettings.defaultThemeMode === 'Dark' ? 'bg-indigo-500' : 'bg-indigo-950 dark:bg-indigo-900/40'
                    )}>
                      <Moon className={cn('w-4 h-4', themeSettings.defaultThemeMode === 'Dark' ? 'text-white' : 'text-indigo-300')} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-wider">Dark</p>
                      <p className="text-[8px] text-slate-400 mt-0.5">Deep slate &amp; high contrast</p>
                    </div>
                  </div>
                  {themeSettings.defaultThemeMode === 'Dark' ? (
                    <span className="shrink-0 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center shadow-md shadow-indigo-500/30">
                      <Check className="w-3 h-3 text-white" />
                    </span>
                  ) : (
                    <span className="shrink-0 w-5 h-5 rounded-full border-2 border-slate-200 dark:border-slate-700" />
                  )}
                </div>
              </button>

              {/* ── SYSTEM DEFAULT CARD ── */}
              <button
                type="button"
                id="theme-system-btn"
                onClick={() => {
                  setThemeSettings({ ...themeSettings, defaultThemeMode: 'System' });
                  const prefersDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
                  onThemeChange?.(prefersDark);
                  triggerToast('Global theme set to System Default. Follows OS preference.');
                }}
                className={cn(
                  'relative group flex flex-col items-start gap-0 rounded-2xl border-2 text-left cursor-pointer transition-all duration-300 overflow-hidden',
                  themeSettings.defaultThemeMode === 'System'
                    ? 'border-emerald-500 shadow-xl shadow-emerald-500/20 scale-[1.02]'
                    : 'border-slate-200 dark:border-slate-800 hover:border-emerald-400 hover:shadow-md hover:scale-[1.01]'
                )}
              >
                {/* Card Top – split preview area */}
                <div className="w-full h-24 relative overflow-hidden flex">
                  {/* Left half: light */}
                  <div className="w-1/2 h-full bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col gap-1.5 p-2 pt-3">
                    <div className="w-full h-1.5 rounded bg-slate-200" />
                    <div className="w-2/3 h-1.5 rounded bg-amber-300/60" />
                    <div className="w-full h-1.5 rounded bg-slate-100" />
                    <div className="w-1/2 h-3 rounded bg-blue-400/60 mt-1" />
                  </div>
                  {/* Divider */}
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/60 z-10 shadow-lg" />
                  {/* Right half: dark */}
                  <div className="w-1/2 h-full bg-gradient-to-br from-slate-900 to-indigo-950 flex flex-col gap-1.5 p-2 pt-3">
                    <div className="w-full h-1.5 rounded bg-slate-700" />
                    <div className="w-2/3 h-1.5 rounded bg-indigo-500/60" />
                    <div className="w-full h-1.5 rounded bg-slate-800" />
                    <div className="w-1/2 h-3 rounded bg-indigo-400/60 mt-1" />
                  </div>
                  {/* Center OS badge */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center border-2 shadow-lg z-20 transition-all',
                      themeSettings.defaultThemeMode === 'System'
                        ? 'bg-emerald-500 border-emerald-300 shadow-emerald-500/40'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600'
                    )}>
                      <Monitor className={cn('w-4 h-4', themeSettings.defaultThemeMode === 'System' ? 'text-white' : 'text-slate-500')} />
                    </div>
                  </div>
                  {themeSettings.defaultThemeMode === 'System' && (
                    <div className="absolute inset-0 bg-emerald-500/5 pointer-events-none" />
                  )}
                </div>
                {/* Card Bottom – info */}
                <div className="w-full p-3 bg-white dark:bg-slate-900 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all',
                      themeSettings.defaultThemeMode === 'System' ? 'bg-emerald-500' : 'bg-slate-100 dark:bg-slate-800'
                    )}>
                      <Monitor className={cn('w-4 h-4', themeSettings.defaultThemeMode === 'System' ? 'text-white' : 'text-slate-500')} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-wider">System</p>
                      <p className="text-[8px] text-slate-400 mt-0.5">Follows OS auto-preference</p>
                    </div>
                  </div>
                  {themeSettings.defaultThemeMode === 'System' ? (
                    <span className="shrink-0 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-md shadow-emerald-500/30">
                      <Check className="w-3 h-3 text-white" />
                    </span>
                  ) : (
                    <span className="shrink-0 w-5 h-5 rounded-full border-2 border-slate-200 dark:border-slate-700" />
                  )}
                </div>
              </button>

            </div>

            {/* Active theme status pill */}
            <div className="flex items-center gap-2 mt-1">
              <span className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border',
                themeSettings.defaultThemeMode === 'Light'
                  ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
                  : themeSettings.defaultThemeMode === 'Dark'
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
              )}>
                <span className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  themeSettings.defaultThemeMode === 'Light' ? 'bg-amber-500' :
                  themeSettings.defaultThemeMode === 'Dark' ? 'bg-indigo-500' : 'bg-emerald-500'
                )} />
                Active: {themeSettings.defaultThemeMode} Theme
              </span>
              <span className="text-[9px] text-slate-400 font-bold">Applied globally to Admin &amp; HR panels</span>
            </div>
          </div>

          {/* Language Setting */}
          <div className="space-y-3">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Default System Language</label>
            <select
              value={themeSettings.defaultLanguage || 'English (US)'}
              onChange={e => setThemeSettings({ ...themeSettings, defaultLanguage: e.target.value })}
              className="saas-input w-full max-w-xs px-3 py-2 cursor-pointer font-bold"
            >
              <option>English (US)</option>
              <option>English (UK)</option>
              <option>Hindi (IN)</option>
              <option>Spanish (ES)</option>
              <option>French (FR)</option>
              <option>German (DE)</option>
              <option>Arabic (AR)</option>
            </select>
            <p className="text-[9px] text-slate-400 font-bold uppercase">This sets the UI display language for new users by default</p>
          </div>

          {/* ======================= COLOR CUSTOMIZATION ======================= */}
          <div className="space-y-6 border-t border-slate-200 dark:border-slate-800/40 pt-6">
            <div>
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2">
                <Palette className="w-3.5 h-3.5 text-indigo-400" />
                Theme Customization
              </h4>
              <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase tracking-wide">
                Select a branding preset or choose your own custom color palette
              </p>
            </div>

            {/* Color Presets */}
            <div className="space-y-3">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Color Presets</label>
              <div className="flex flex-wrap gap-3">
                {([
                  { name: 'Rippling',  primary: '#0f172a', secondary: '#1d4ed8', accent: '#38bdf8' },
                  { name: 'Deel',     primary: '#1e0a3c', secondary: '#7c3aed', accent: '#a78bfa' },
                  { name: 'Bamboo',   primary: '#064e3b', secondary: '#059669', accent: '#34d399' },
                  { name: 'Workday',  primary: '#1e3a5f', secondary: '#2563eb', accent: '#60a5fa' },
                  { name: 'Darwinbox',primary: '#7c2d12', secondary: '#ea580c', accent: '#fb923c' },
                  { name: 'SAP',      primary: '#1a1a2e', secondary: '#0f3460', accent: '#e94560'  },
                  { name: 'Keka',     primary: '#312e81', secondary: '#4f46e5', accent: '#818cf8'  },
                  { name: 'GreytHR', primary: '#134e4a', secondary: '#0d9488', accent: '#2dd4bf'  },
                ] as { name: string; primary: string; secondary: string; accent: string }[]).map((preset) => {
                  const isActive =
                    branding.primaryColor === preset.primary &&
                    branding.secondaryColor === preset.secondary &&
                    branding.accentColor === preset.accent;
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={async () => {
                        updateBrandingState({
                          primaryColor: preset.primary,
                          secondaryColor: preset.secondary,
                          accentColor: preset.accent
                        });
                        try {
                          await saveBranding();
                          triggerToast(`"${preset.name}" color preset applied to all panels.`);
                        } catch {
                          triggerToast('Failed to save color preset.');
                        }
                      }}
                      className={cn(
                        'flex items-center gap-2.5 px-3.5 py-2 rounded-xl border-2 text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]',
                        isActive
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 shadow-md shadow-indigo-500/10'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-300'
                      )}
                    >
                      <span className="text-slate-700 dark:text-slate-200">{preset.name}</span>
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: preset.primary }} />
                        <span className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: preset.secondary }} />
                        <span className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: preset.accent }} />
                      </span>
                      {isActive && <Check className="w-3 h-3 text-indigo-500 ml-0.5" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Palette Picker */}
            <div className="space-y-3">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Custom Palette Picker</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { key: 'primaryColor' as const, label: 'Primary', desc: 'Main brand color used for buttons and highlights' },
                  { key: 'secondaryColor' as const, label: 'Secondary', desc: 'Gradient accent and sidebar active states' },
                  { key: 'accentColor' as const, label: 'Accent', desc: 'Info badges, icons and tertiary highlights' },
                ].map(({ key, label, desc }) => (
                  <div
                    key={key}
                    className="group relative flex items-center gap-3 p-3.5 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/50 rounded-xl hover:border-indigo-300 dark:hover:border-indigo-700 transition-all shadow-sm hover:shadow-md cursor-pointer"
                    onClick={() => document.getElementById(`color-picker-${key}`)?.click()}
                  >
                    <div
                      className="w-10 h-10 rounded-lg border-2 border-white/20 shadow-lg shrink-0 transition-transform group-hover:scale-105"
                      style={{ backgroundColor: (branding as any)[key] || '#2563eb' }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-black text-slate-700 dark:text-white uppercase tracking-wider">{label}</p>
                      <p className="text-[9px] text-slate-400 mt-0.5 font-mono">{(branding as any)[key] || '#2563eb'}</p>
                    </div>
                    <input
                      id={`color-picker-${key}`}
                      type="color"
                      value={(branding as any)[key] || '#2563eb'}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={(e) => {
                        updateBrandingState({ [key]: e.target.value });
                      }}
                      onBlur={async () => {
                        try {
                          await saveBranding();
                          triggerToast(`${label} color updated and applied to all panels.`);
                        } catch {
                          triggerToast('Failed to save color.');
                        }
                      }}
                    />
                  </div>
                ))}
              </div>
              <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Click any color swatch to open the color picker. Changes apply globally across all panels.</p>
            </div>

            {/* Live Preview Strip */}
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Live Preview</label>
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800/50 bg-slate-50 dark:bg-slate-950/20 flex flex-col gap-3">
                {/* Simulated sidebar strip */}
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-16 rounded-full" style={{ background: `linear-gradient(to bottom, ${branding.primaryColor || '#2563eb'}, ${branding.secondaryColor || '#4f46e5'})` }} />
                  <div className="flex flex-col gap-1.5 flex-1">
                    <div className="h-2.5 rounded-md w-24" style={{ backgroundColor: branding.primaryColor || '#2563eb', opacity: 0.9 }} />
                    <div className="h-2.5 rounded-md w-16 bg-slate-200 dark:bg-slate-700" />
                    <div className="h-2.5 rounded-md w-20 bg-slate-200 dark:bg-slate-700" />
                    <div className="h-2.5 rounded-md w-14 bg-slate-200 dark:bg-slate-700" />
                  </div>
                  {/* Simulated action button */}
                  <div className="px-4 py-2 rounded-lg text-[9px] font-black text-white uppercase tracking-wider" style={{ background: `linear-gradient(135deg, ${branding.primaryColor || '#2563eb'}, ${branding.secondaryColor || '#4f46e5'})` }}>
                    Save
                  </div>
                  <div className="px-2 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider border" style={{ color: branding.accentColor || '#06b6d4', borderColor: branding.accentColor || '#06b6d4' }}>
                    Info
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
