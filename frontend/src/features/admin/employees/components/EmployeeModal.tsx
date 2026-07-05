"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Mail, Phone, MapPin, Briefcase, Calendar, AlertTriangle, Upload,
  CheckCircle, AlertCircle, ExternalLink, FileText, Check, Ban,
  Activity, Shield, ShieldCheck, CreditCard, Sparkles, Award, CheckSquare, Clock,
  Eye, EyeOff, Edit2, Send, Power, BarChart2, TrendingUp, Cpu, Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell 
} from 'recharts';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';

interface EmployeeModalProps {
  modalType: 'add' | 'edit' | 'details' | 'delete';
  currentEmployee: any;
  formData: any;
  closeModal: () => void;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  handleDelete: () => void;
  onEmployeeUpdated?: () => void;
}

const getRoleBadgeStyles = (role: string) => {
  const r = (role || '').toLowerCase();
  if (r.includes('admin')) {
    return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20";
  }
  if (r.includes('hr')) {
    return "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20";
  }
  return "bg-slate-500/10 text-slate-650 dark:text-slate-400 border border-slate-500/20";
};

export default function EmployeeModal({
  modalType,
  currentEmployee,
  formData,
  closeModal,
  handleInputChange,
  handleSubmit,
  handleDelete,
  onEmployeeUpdated
}: EmployeeModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState<any[]>(currentEmployee?.documents || []);
  const [verifyingDocName, setVerifyingDocName] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formActiveTab, setFormActiveTab] = useState<'contact' | 'personal' | 'security' | 'financial'>('contact');
  const [departments, setDepartments] = useState<string[]>(['Engineering', 'Design', 'Sales', 'HR', 'Marketing', 'Finance']);
  const [designationsList, setDesignationsList] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [eligibleManagers, setEligibleManagers] = useState<any[]>([]);
  const [managerSearch, setManagerSearch] = useState('');
  const [selectedManager, setSelectedManager] = useState<any>(null);
  const [showManagerDropdown, setShowManagerDropdown] = useState(false);

  // Fetch departments, designations, and branches dynamically from backend APIs
  useEffect(() => {
    const token = localStorage.getItem('hr_system_token');
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    fetch('/api/departments', { headers })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const names = Array.from(new Set(data.map((d: any) => d.departmentName).filter(Boolean)));
          if (names.length > 0) {
            setDepartments(names);
          }
        }
      })
      .catch(err => console.warn('Failed to fetch departments:', err));

    fetch('/api/designations', { headers })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setDesignationsList(data);
        }
      })
      .catch(err => console.warn('Failed to fetch designations:', err));

    fetch('/api/branches', { headers })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setBranches(data);
        }
      })
      .catch(err => console.warn('Failed to fetch branches from branch Master:', err));

    fetch('/api/manager/eligible', { headers })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setEligibleManagers(data);
        }
      })
      .catch(err => console.warn('Failed to fetch eligible managers:', err));
  }, []);

  // Expanded Dashboard States
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'leave' | 'payroll' | 'performance' | 'projects-tasks' | 'documents' | 'activity-logs' | 'security' | 'message'>('overview');
  const [msgSubject, setMsgSubject] = useState('');
  const [msgBody, setMsgBody] = useState('');
  const [msgSending, setMsgSending] = useState(false);
  const [msgError, setMsgError] = useState('');
  const [msgSuccess, setMsgSuccess] = useState(false);
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);
  const [leavesList, setLeavesList] = useState<any[]>([]);
  const [payrollHistory, setPayrollHistory] = useState<any[]>([]);
  const [tasksList, setTasksList] = useState<any[]>([]);
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [auditLogsList, setAuditLogsList] = useState<any[]>([]);
  const [isSuspended, setIsSuspended] = useState(currentEmployee?.status === 'Inactive');

  const [showLifecycleForm, setShowLifecycleForm] = useState(false);
  const [lifecycleAction, setLifecycleAction] = useState<'deactivate' | 'suspend' | 'resign' | 'terminate' | 'reactivate' | 'progress-exit'>('deactivate');
  const [lifecycleReason, setLifecycleReason] = useState('');
  const [lifecycleStage, setLifecycleStage] = useState('');
  const [lifecycleSubmitting, setLifecycleSubmitting] = useState(false);

  // Retrieve current user role
  const { userRole } = useAuthStore();

  const handleLifecycleSubmit = async () => {
    if (lifecycleAction !== 'reactivate' && !lifecycleReason.trim()) {
      useUIStore.getState().triggerToast('Please provide a reason for this lifecycle action', 'error');
      return;
    }

    setLifecycleSubmitting(true);
    try {
      const token = localStorage.getItem('hr_system_token');
      const res = await fetch(`/api/employees/${currentEmployee?.id || currentEmployee?._id}/lifecycle`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          action: lifecycleAction,
          reason: lifecycleReason,
          stage: lifecycleStage || undefined
        })
      });

      if (res.ok) {
        useUIStore.getState().triggerToast(`Lifecycle action '${lifecycleAction}' completed successfully!`, 'success');
        setShowLifecycleForm(false);
        setLifecycleReason('');
        setLifecycleStage('');
        
        if (onEmployeeUpdated) {
          onEmployeeUpdated();
        }
        closeModal();
      } else {
        const err = await res.json();
        useUIStore.getState().triggerToast(err.error || 'Failed to update employee lifecycle status.', 'error');
      }
    } catch (err) {
      console.error(err);
      useUIStore.getState().triggerToast('Error updating employee lifecycle status.', 'error');
    } finally {
      setLifecycleSubmitting(false);
    }
  };

  // Sync state
  useEffect(() => {
    if (currentEmployee) {
      setDocuments(currentEmployee.documents || []);
      setIsSuspended(currentEmployee.status === 'Inactive');
    }
  }, [currentEmployee]);

  // Sync selectedManager on load / change of employee
  useEffect(() => {
    if (currentEmployee && eligibleManagers.length > 0) {
      const managerId = currentEmployee.reportingManagerId || formData.reportingManagerId;
      if (managerId) {
        const mgr = eligibleManagers.find(m => m._id === managerId || m.id === managerId);
        if (mgr) {
          setSelectedManager(mgr);
        }
      } else {
        setSelectedManager(null);
      }
    }
  }, [currentEmployee, eligibleManagers, formData.reportingManagerId]);

  // Fetch Live Database Data for tabs
  useEffect(() => {
    if (modalType !== 'details' || !currentEmployee) return;

    const email = currentEmployee.email;
    const name = currentEmployee.name || currentEmployee.fullName;

    const token = localStorage.getItem('hr_system_token');
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Fetch Attendance
    fetch('/api/attendance', { headers })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const filtered = data.filter(a => a.employee === name || a.name === name);
          setAttendanceLogs(filtered);
        }
      }).catch(err => console.warn('Err fetching attendance:', err));

    // Fetch Leaves
    fetch('/api/leaves', { headers })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const filtered = data.filter(l => l.employee === name || l.name === name);
          setLeavesList(filtered);
        }
      }).catch(err => console.warn('Err fetching leaves:', err));

    // Fetch Payroll
    fetch('/api/payroll', { headers })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const filtered = data.filter(p => p.employee === email);
          setPayrollHistory(filtered);
        }
      }).catch(err => console.warn('Err fetching payroll:', err));

    // Fetch Tasks
    fetch('/api/tasks', { headers })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const filtered = data.filter(t => t.assignedToEmail === email || t.assignedTo === name);
          setTasksList(filtered);
        }
      }).catch(err => console.warn('Err fetching tasks:', err));

    // Fetch Projects
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const filtered = data.filter(p => p.memberEmails?.includes(email) || p.members?.includes(name));
          setProjectsList(filtered);
        }
      }).catch(err => console.warn('Err fetching projects:', err));

    // Fetch Audit Logs
    fetch('/api/auditlogs', { headers })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const filtered = data.filter(l => l.performedBy === email);
          setAuditLogsList(filtered);
        }
      }).catch(err => console.warn('Err fetching audit logs:', err));

  }, [currentEmployee, modalType]);

  const handleVerifyDocument = async (docName: string, status: 'Approved' | 'Rejected') => {
    if (!currentEmployee) return;
    setVerifyingDocName(docName);
    try {
      const updatedDocs = documents.map(doc => {
        if (doc.name === docName) {
          return { ...doc, status };
        }
        return doc;
      });

      const token = localStorage.getItem('hr_system_token');
      const res = await fetch(`/api/employees/${currentEmployee.id || currentEmployee._id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ documents: updatedDocs })
      });

      if (res.ok) {
        setDocuments(updatedDocs);
        if (onEmployeeUpdated) {
          onEmployeeUpdated();
        }
        useUIStore.getState().triggerToast(`Document ${status.toLowerCase()}!`, 'success');
      } else {
        useUIStore.getState().triggerToast("Failed to update document status.", "error");
      }
    } catch (err) {
      console.error("Error verifying document:", err);
      useUIStore.getState().triggerToast("Error verifying document.", "error");
    } finally {
      setVerifyingDocName(null);
    }
  };

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const data = new FormData();
      data.append('file', file);

      const token = localStorage.getItem('hr_system_token');
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: data
      });

      if (res.ok) {
        const json = await res.json();
        handleInputChange({
          target: { name: 'profilePicture', value: json.url }
        } as any);
        useUIStore.getState().triggerToast("Profile photo uploaded!", 'success');
      } else {
        useUIStore.getState().triggerToast("Failed to upload image.", "error");
      }
    } catch (err) {
      console.error(err);
      useUIStore.getState().triggerToast("Error uploading image.", "error");
    } finally {
      setUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const toggleSuspension = async () => {
    if (!currentEmployee) return;
    const newStatus = isSuspended ? 'Active' : 'Inactive';
    try {
      const token = localStorage.getItem('hr_system_token');
      const res = await fetch(`/api/employees/${currentEmployee.id || currentEmployee._id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setIsSuspended(!isSuspended);
        if (onEmployeeUpdated) onEmployeeUpdated();
        useUIStore.getState().triggerToast(`Employee ${newStatus === 'Inactive' ? 'suspended' : 'activated'}!`, 'success');
      } else {
        useUIStore.getState().triggerToast('Failed to change suspension status', 'error');
      }
    } catch (err) {
      console.error(err);
      useUIStore.getState().triggerToast('Error updating status.', 'error');
    }
  };

  const handleSendDirectMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgSubject.trim() || !msgBody.trim()) {
      setMsgError('Please fill in both the subject and the message body.');
      return;
    }
    setMsgSending(true);
    setMsgError('');
    setMsgSuccess(false);

    try {
      const token = localStorage.getItem('hr_system_token');
      const senderProfileRaw = localStorage.getItem('hr_system_profile');
      let senderName = 'HR Team';
      if (senderProfileRaw) {
        try {
          const profileObj = JSON.parse(senderProfileRaw);
          senderName = profileObj.name || profileObj.fullName || 'HR Team';
        } catch (e) {}
      }

      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          fromName: senderName,
          toEmail: currentEmployee?.email,
          toName: currentEmployee?.name || currentEmployee?.fullName,
          subject: msgSubject.trim(),
          messageBody: msgBody.trim(),
          type: 'direct'
        })
      });

      if (res.ok) {
        setMsgSuccess(true);
        setMsgSubject('');
        setMsgBody('');
        setTimeout(() => {
          setMsgSuccess(false);
          setActiveTab('overview');
        }, 2000);
      } else {
        const data = await res.json();
        setMsgError(data.error || 'Failed to send message.');
      }
    } catch (err) {
      setMsgError('Network error. Please try again.');
    } finally {
      setMsgSending(false);
    }
  };

  // Calculations for Overview Tab
  const attendancePercent = attendanceLogs.length > 0 
    ? Math.round((attendanceLogs.filter(a => a.status === 'Present').length / attendanceLogs.length) * 100) 
    : 0;

  const completedTasks = tasksList.filter(t => t.status === 'Done').length;
  const pendingTasks = tasksList.filter(t => t.status !== 'Done').length;
  const taskCompletionRate = tasksList.length > 0 ? Math.round((completedTasks / tasksList.length) * 100) : 0;

  const remainingLeaves = currentEmployee?.maxLeaves 
    ? currentEmployee.maxLeaves - leavesList.filter(l => l.status === 'Approved').length 
    : 24;

  // Render Charts Data
  const attendanceChartData = [
    { name: 'Present', value: attendanceLogs.filter(a => a.status === 'Present').length, color: '#10b981' },
    { name: 'Absent', value: attendanceLogs.filter(a => a.status === 'Absent').length, color: '#f43f5e' },
    { name: 'Late', value: attendanceLogs.filter(a => a.status === 'Late' || a.latenessMinutes > 0).length, color: '#f59e0b' }
  ];

  const performanceChartData = [
    { month: 'Jan', rating: 4.2 },
    { month: 'Feb', rating: 4.4 },
    { month: 'Mar', rating: 4.5 },
    { month: 'Apr', rating: 4.7 },
    { month: 'May', rating: 4.8 }
  ];
  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto print:hidden">
      {/* Backdrop overlay */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={closeModal}
        className="fixed inset-0 bg-slate-900/50 cursor-pointer"
      />
      
      {/* Scrollable positioning container */}
      <div className="flex min-h-screen items-center justify-center p-4 lg:pl-[340px] relative pointer-events-none transition-all duration-300">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className={cn(
            "relative w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-[1.5rem] shadow-2xl transition-all pointer-events-auto",
            modalType === 'details' 
              ? "max-w-5xl h-[90vh] md:h-[85vh] flex flex-col md:flex-row min-w-0 overflow-y-auto md:overflow-hidden" 
              : (modalType === 'add' || modalType === 'edit')
                ? "max-w-5xl h-[90vh] md:h-[85vh] flex flex-col md:flex-row min-w-0 overflow-hidden"
                : "max-w-lg"
          )}
        >
        {/* DELETE MODAL */}
        {modalType === 'delete' && (
          <div className="p-6 text-center bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm">
            <div className="w-14 h-14 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-rose-500" />
            </div>
            {userRole === 'HR' ? (
              <>
                <h2 className="text-sm font-black text-slate-900 dark:text-white mb-2 uppercase tracking-wide">Insufficient Permissions</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-6 text-xs font-semibold leading-relaxed">
                  As an HR user, you do not have permission to permanently delete employee records from the database. Please contact a System Administrator or use the **Lifecycle Actions** in the employee details view to deactivate or suspend this employee instead.
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={closeModal}
                    className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer border border-slate-200 dark:border-slate-800"
                  >
                    Close
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-lg font-black text-slate-900 dark:text-white mb-2 uppercase tracking-wide">Delete Employee?</h2>
                <p className="text-slate-450 mb-6 text-xs font-semibold leading-relaxed">
                  Are you sure you want to delete <span className="font-bold text-white">{currentEmployee?.name}</span>? This will purge all associated user credentials and directories.
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={closeModal}
                    className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleDelete}
                    className="flex-1 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-rose-700 transition-colors shadow-lg shadow-rose-500/25 cursor-pointer"
                  >
                    Delete Employee
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ENTERPRISE DETAILS DASHBOARD VIEW */}
        {modalType === 'details' && (
          <>
            {/* LEFT PROFILE SIDEBAR PANEL */}
            <div className="w-full md:w-64 bg-slate-50 dark:bg-slate-900 border-b md:border-b-0 md:border-r border-slate-200/80 dark:border-slate-800/80 p-4 flex flex-col justify-between shrink-0 min-w-0 overflow-visible md:overflow-y-auto">
              <div className="space-y-4">
                {/* Close Button Mobile */}
                <div className="flex justify-between items-center md:hidden">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Employee Card</span>
                  <button onClick={closeModal} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer">
                    <X className="w-3.5 h-3.5 text-slate-450" />
                  </button>
                </div>

                {/* Profile Block */}
                <div className="text-center space-y-2">
                  <div className="relative w-16 h-16 mx-auto">
                    <img 
                      src={currentEmployee?.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(currentEmployee?.name || currentEmployee?.fullName || currentEmployee?.email || '')}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffdfbf`} 
                      alt={currentEmployee?.name} 
                      className="w-full h-full object-cover rounded-xl border border-slate-200 dark:border-slate-850 shadow-md" 
                    />
                    <div className={cn(
                      "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-950 shadow-sm",
                      isSuspended ? "bg-slate-500" : "bg-emerald-500"
                    )} />
                  </div>

                  <div>
                    <h2 className="text-sm font-black text-slate-900 dark:text-white leading-tight">{currentEmployee?.name || currentEmployee?.fullName}</h2>
                    <p className="text-[9px] font-extrabold text-violet-600 dark:text-violet-400 tracking-wide uppercase mt-0.5">{currentEmployee?.designation || 'Staff Member'}</p>
                    <p className="text-[8.5px] text-slate-400 dark:text-slate-500 font-semibold">{currentEmployee?.department || currentEmployee?.dept || 'Engineering'}</p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                    <span className="px-2 py-0.5 bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 rounded-full text-[8px] font-black uppercase tracking-wider">
                      {(() => {
                        const rawId = currentEmployee?.empId || String(currentEmployee?.id || currentEmployee?._id || '').slice(-4).toUpperCase();
                        return rawId.toUpperCase().startsWith('EMP-') ? `#${rawId}` : `#EMP-${rawId}`;
                      })()}
                    </span>
                    <span className={cn(
                      "px-2 py-0.5 border rounded-full text-[8px] font-black uppercase tracking-wider",
                      ['active', 'approved'].includes(currentEmployee?.status?.toLowerCase()) 
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                        : "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"
                    )}>
                      {currentEmployee?.status || 'Active'}
                    </span>
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 rounded-full text-[8px] font-black uppercase tracking-wider">
                      {currentEmployee?.role || 'Employee'}
                    </span>
                  </div>
                </div>

                {/* Quick Info Grid */}
                <div className="space-y-1.5 pt-2.5 border-t border-slate-200/80 dark:border-slate-800/80 text-[10px] min-w-0">
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-slate-500 dark:text-slate-400 text-[8px] uppercase font-bold shrink-0">Role</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 truncate text-right capitalize">{currentEmployee?.role || 'Employee'}</span>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-slate-500 dark:text-slate-400 text-[8px] uppercase font-bold shrink-0">Email</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[130px] text-right" title={currentEmployee?.email}>{currentEmployee?.email}</span>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-slate-500 dark:text-slate-400 text-[8px] uppercase font-bold shrink-0">Phone</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 truncate text-right">{currentEmployee?.phone || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-slate-500 dark:text-slate-400 text-[8px] uppercase font-bold shrink-0">Location</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 truncate text-right">{currentEmployee?.location || 'Remote'}</span>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-slate-500 dark:text-slate-400 text-[8px] uppercase font-bold shrink-0">Joined</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 truncate text-right">{currentEmployee?.joining || 'N/A'}</span>
                  </div>
                  {currentEmployee?.reportingManagerId && (() => {
                    const mgr = eligibleManagers.find((m: any) => m._id === currentEmployee.reportingManagerId);
                    return mgr ? (
                      <div className="pt-1.5 mt-1 border-t border-slate-200 dark:border-slate-900">
                        <span className="text-slate-500 dark:text-slate-400 text-[8px] uppercase font-bold block mb-1">Reporting Manager</span>
                        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 rounded-lg p-1.5">
                          <img src={mgr.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${mgr.fullName}`} alt={mgr.fullName} className="w-6 h-6 rounded-md object-cover" />
                          <div className="min-w-0">
                            <p className="text-[9px] font-black text-slate-900 dark:text-white truncate">{mgr.fullName}</p>
                            <p className="text-[7.5px] text-slate-500 truncate">{mgr.designation}</p>
                          </div>
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
              </div>

              {/* Quick Actions Panel */}
              {userRole !== 'Employee' && (
                <div className="space-y-1.5 pt-3 border-t border-slate-200/80 dark:border-slate-800/80">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1 text-center md:text-left">Lifecycle Actions</span>
                  <div className="space-y-1.5">
                    {/* Reactivate / Restore */}
                    {(currentEmployee?.isActive === false || ['inactive', 'suspended', 'terminated', 'resigned'].includes(currentEmployee?.status?.toLowerCase())) ? (
                      <button 
                        onClick={() => { setLifecycleAction('reactivate'); setLifecycleReason('Reactivated from workforce command console.'); setShowLifecycleForm(true); }}
                        className="w-full py-1 px-1.5 rounded-lg text-[7px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer border bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                      >
                        <Check className="w-2.5 h-2.5" />
                        Reactivate / Restore
                      </button>
                    ) : (
                      <div className="grid grid-cols-2 gap-1.5 font-outfit">
                        {/* Deactivate */}
                        <button 
                          onClick={() => { setLifecycleAction('deactivate'); setLifecycleReason(''); setShowLifecycleForm(true); }}
                          className="py-1 px-1.5 rounded-lg text-[7.5px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer border bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                        >
                          <Ban className="w-2.5 h-2.5 shrink-0" />
                          Deactivate
                        </button>
                        
                        {/* Suspend */}
                        <button 
                          onClick={() => { setLifecycleAction('suspend'); setLifecycleReason(''); setShowLifecycleForm(true); }}
                          className="py-1 px-1.5 rounded-lg text-[7.5px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer border bg-amber-50 hover:bg-amber-100/50 dark:bg-amber-955/20 border-amber-200 dark:border-amber-955/30 text-amber-600 dark:text-amber-400"
                        >
                          <Power className="w-2.5 h-2.5 shrink-0" />
                          Suspend
                        </button>

                        {/* Admin Only actions */}
                        {(userRole === 'Admin' || userRole === 'Company Admin') && (
                          <>
                            {/* Mark as Resigned */}
                            <button 
                              onClick={() => { setLifecycleAction('resign'); setLifecycleReason(''); setShowLifecycleForm(true); }}
                              className="py-1 px-1.5 rounded-lg text-[7.5px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer border bg-violet-50 hover:bg-violet-100/50 dark:bg-violet-955/20 border-violet-200 dark:border-violet-955/30 text-violet-600 dark:text-violet-400"
                            >
                              <FileText className="w-2.5 h-2.5 shrink-0" />
                              Resign
                            </button>

                            {/* Terminate */}
                            <button 
                              onClick={() => { setLifecycleAction('terminate'); setLifecycleReason(''); setShowLifecycleForm(true); }}
                              className="py-1 px-1.5 rounded-lg text-[7.5px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer border bg-rose-50 hover:bg-rose-100/50 dark:bg-rose-955/20 border-rose-200 dark:border-rose-955/30 text-rose-600 dark:text-rose-400"
                            >
                              <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                              Terminate
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={closeModal}
                    className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center justify-center gap-1 transition-all shadow-md shadow-blue-500/10 cursor-pointer border-none"
                  >
                    <Check className="w-3 h-3" />
                    Done Reviewing
                  </button>
                </div>
              )}
            </div>

            {/* RIGHT MAIN DETAILS PANEL (TABBED CONTAINER) */}
            <div className="flex-1 flex flex-col overflow-visible md:overflow-hidden min-w-0 bg-white dark:bg-slate-900">
              {/* Tab Navigation header */}
              <div className="px-4 pt-2.5 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between shrink-0">
                <div className="premium-nav-container scrollbar-none z-20 relative pr-4 font-outfit">
                  {[
                    { id: 'overview', label: 'Overview' },
                    { id: 'attendance', label: 'Attendance' },
                    { id: 'leave', label: 'Leave' },
                    { id: 'payroll', label: 'Payroll' },
                    { id: 'performance', label: 'Performance' },
                    { id: 'documents', label: 'Documents' },
                    { id: 'activity-logs', label: 'Activity Logs' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={cn(
                        "premium-nav-item active:scale-[0.98] text-[9.5px]",
                        activeTab === tab.id ? "premium-nav-item-active" : ""
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <button onClick={closeModal} className="p-1.5 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer hidden md:block">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {/* Tab Content panel */}
              <div className="flex-1 p-4 overflow-visible md:overflow-y-auto space-y-4 max-h-none md:max-h-[75vh] min-w-0">

                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && (
                  <div className="space-y-4">
                    {/* Analytics Widgets Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 font-outfit">
                      {[
                        { title: 'Attendance Rate', value: `${attendancePercent}%`, desc: 'Target 95% min', icon: Clock, accent: '#10B981', color: 'text-emerald-500' },
                        { title: 'KPI Score / Rating', value: `${currentEmployee?.rating || 4.6} / 5.0`, desc: 'Exceeding standards', icon: Award, accent: '#F59E0B', color: 'text-amber-500' },
                        { title: 'Completed Tasks', value: `${completedTasks}`, desc: `${pendingTasks} pending in sprints`, icon: CheckSquare, accent: '#3B82F6', color: 'text-blue-500' },
                        { title: 'Remaining Leaves', value: `${remainingLeaves} Days`, desc: 'Out of 24 allocated', icon: Calendar, accent: '#8B5CF6', color: 'text-violet-500' }
                      ].map((card, i) => (
                        <div key={i} className="p-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl flex items-center justify-between gap-3 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden text-left" style={{ borderLeft: `4px solid ${card.accent}` }}>
                          <div className="space-y-0.5 min-w-0 flex-1">
                            <span className="text-[7.5px] font-black uppercase tracking-wider text-slate-400 block">{card.title}</span>
                            <h3 className="text-sm font-black leading-tight text-slate-850 dark:text-white">{card.value}</h3>
                            <p className="text-[7.5px] font-semibold text-slate-400 uppercase tracking-wide truncate">{card.desc}</p>
                          </div>
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${card.accent}14`, border: `1px solid ${card.accent}25` }}>
                            <card.icon className={cn("w-3.5 h-3.5", card.color)} />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Split details columns */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-4 text-left shadow-md hover:shadow-lg transition-all duration-300">
                        <span className="text-[9px] font-black text-slate-450 dark:text-slate-400 uppercase tracking-widest block border-b border-slate-100 dark:border-slate-850 pb-2">Personal & Contract Info</span>
                        
                        <div className="space-y-2.5 text-[11px]">
                          <div className="flex justify-between items-start gap-4">
                            <span className="text-slate-500 font-bold shrink-0">Emergency Contact</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-200 text-right max-w-[65%] break-words">{currentEmployee?.emergencyContact || 'Not Provided'}</span>
                          </div>
                          <div className="flex justify-between items-start gap-4">
                            <span className="text-slate-500 font-bold shrink-0">Birth Date</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-200 text-right max-w-[65%] break-words">{currentEmployee?.dateOfBirth || 'Not Provided'}</span>
                          </div>
                          <div className="flex justify-between items-start gap-4">
                            <span className="text-slate-500 font-bold shrink-0">Gender</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-200 text-right max-w-[65%] break-words">{currentEmployee?.gender || 'Not Provided'}</span>
                          </div>
                          <div className="flex justify-between items-start gap-4">
                            <span className="text-slate-500 font-bold shrink-0">Blood Group</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-200 text-right max-w-[65%] break-words">{currentEmployee?.bloodGroup || 'Not Provided'}</span>
                          </div>
                          <div className="flex justify-between items-start gap-4">
                            <span className="text-slate-500 font-bold shrink-0">Residence Address</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-200 text-right max-w-[65%] break-words leading-relaxed">{currentEmployee?.address || 'Not Provided'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {/* Lifecycle & Exit details */}
                        {(currentEmployee?.isActive === false || ['inactive', 'suspended', 'terminated', 'resigned'].includes(currentEmployee?.status?.toLowerCase())) && (
                          <div className="p-4 bg-rose-500/5 dark:bg-rose-950/15 border border-rose-500/20 rounded-2xl space-y-3 text-left">
                            <span className="text-[9px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest block border-b border-rose-500/10 pb-1.5">Lifecycle & Exit Details</span>
                            
                            <div className="space-y-2 text-[11px]">
                              <div className="flex justify-between items-start gap-4">
                                <span className="text-slate-500 font-bold shrink-0">Current Status</span>
                                <span className="px-2 py-0.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-full text-[9px] font-black uppercase tracking-wider">{currentEmployee?.status}</span>
                              </div>

                              {currentEmployee?.suspensionReason && (
                                <div className="space-y-1 pt-1.5 border-t border-rose-500/10">
                                  <span className="text-slate-500 font-bold block text-[9.5px]">Suspension Reason</span>
                                  <span className="font-semibold text-slate-700 dark:text-slate-200 block text-[10px] bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg leading-relaxed">{currentEmployee.suspensionReason}</span>
                                  <span className="text-[8px] text-slate-400 block font-semibold mt-1">Suspended by: {currentEmployee.suspendedBy || 'Admin'} on {currentEmployee.suspendedAt ? new Date(currentEmployee.suspendedAt).toLocaleDateString() : 'N/A'}</span>
                                </div>
                              )}

                              {currentEmployee?.terminationReason && (
                                <div className="space-y-1 pt-1.5 border-t border-rose-500/10">
                                  <span className="text-slate-500 font-bold block text-[9.5px]">Termination Reason</span>
                                  <span className="font-semibold text-slate-700 dark:text-slate-200 block text-[10px] bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg leading-relaxed">{currentEmployee.terminationReason}</span>
                                  <span className="text-[8px] text-slate-400 block font-semibold mt-1">Terminated by: {currentEmployee.terminatedBy || 'Admin'} on {currentEmployee.terminatedAt ? new Date(currentEmployee.terminatedAt).toLocaleDateString() : 'N/A'}</span>
                                </div>
                              )}

                              {currentEmployee?.resignationReason && (
                                <div className="space-y-1 pt-1.5 border-t border-rose-500/10">
                                  <span className="text-slate-500 font-bold block text-[9.5px]">Resignation Reason</span>
                                  <span className="font-semibold text-slate-700 dark:text-slate-200 block text-[10px] bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg leading-relaxed">{currentEmployee.resignationReason}</span>
                                  <span className="text-[8px] text-slate-400 block font-semibold mt-1">Resigned on: {currentEmployee.resignedAt ? new Date(currentEmployee.resignedAt).toLocaleDateString() : 'N/A'}</span>
                                </div>
                              )}

                              {currentEmployee?.exitWorkflow && currentEmployee.exitWorkflow.stage !== 'None' && (
                                <div className="pt-2 border-t border-rose-500/10 space-y-1.5">
                                  <span className="text-slate-500 font-bold block text-[9.5px] uppercase tracking-wider">Exit Workflow Stage</span>
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                                    <span className="font-extrabold text-[10.5px] text-blue-600 dark:text-blue-400 uppercase tracking-wide">{currentEmployee.exitWorkflow.stage}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Skills & Experience */}
                        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-4 text-left shadow-md hover:shadow-lg transition-all duration-300">
                          <span className="text-[9px] font-black text-slate-450 dark:text-slate-400 uppercase tracking-widest block border-b border-slate-100 dark:border-slate-850 pb-2">Skills & Specializations</span>
                          <div className="flex flex-wrap gap-1.5">
                            {(() => {
                              const d = (currentEmployee?.dept || currentEmployee?.department || '').toLowerCase();
                              let skills = ['React', 'Node.js', 'TypeScript', 'Next.js', 'TailwindCSS', 'MongoDB', 'REST APIs'];
                              if (d.includes('hr') || d.includes('recruitment') || d.includes('human')) {
                                skills = ['Talent Acquisition', 'Employee Relations', 'HR Policies', 'Conflict Resolution', 'Performance Management', 'Onboarding'];
                              } else if (d.includes('design')) {
                                skills = ['Figma', 'UI/UX Design', 'Wireframing', 'Prototyping', 'User Research', 'Design Systems'];
                              } else if (d.includes('finance') || d.includes('payroll')) {
                                skills = ['Financial Auditing', 'Payroll Processing', 'Tax Compliance', 'Excel/Sheets', 'Accounting'];
                              }
                              return skills.map(skill => (
                                <span key={skill} className="px-2 py-0.5 bg-blue-50/70 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-900/40 text-[9px] font-black text-blue-600 dark:text-blue-400 rounded-lg">
                                  {skill}
                                </span>
                              ));
                            })()}
                          </div>
                          <div className="pt-1.5 text-[11px]">
                            <span className="text-slate-500 font-bold block">Years of Industry Experience</span>
                            <span className="font-extrabold text-blue-600 dark:text-blue-400 text-xs mt-0.5 block">
                              {(() => {
                                const joinedDate = currentEmployee?.joinedDate || currentEmployee?.joining;
                                if (!joinedDate) return '1 Year (Junior)';
                                const joined = new Date(joinedDate);
                                const diff = Date.now() - joined.getTime();
                                const years = Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25)));
                                if (years >= 5) return `${years} Years (Senior)`;
                                if (years >= 3) return `${years} Years (Mid-Senior)`;
                                return `${years} Year${years > 1 ? 's' : ''} (Junior)`;
                              })()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ATTENDANCE TAB */}
                {activeTab === 'attendance' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      {/* Left: Stats */}
                      <div className="lg:col-span-1 p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-4 text-left shadow-md hover:shadow-lg transition-all duration-300">
                        <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block border-b border-slate-100 dark:border-slate-900 pb-1.5">Monthly Stats</span>
                        
                        <div className="h-36 flex justify-center items-center">
                          {attendanceLogs.length === 0 ? (
                            <div className="w-20 h-20 rounded-full border-4 border-slate-100 dark:border-slate-800/80 flex items-center justify-center">
                              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-wider">No Data</span>
                            </div>
                          ) : (
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={attendanceChartData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={40}
                                  outerRadius={55}
                                  paddingAngle={5}
                                  dataKey="value"
                                >
                                  {attendanceChartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                                <Tooltip contentStyle={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text-primary)', fontSize: 10, borderRadius: '8px' }} />
                              </PieChart>
                            </ResponsiveContainer>
                          )}
                        </div>

                        <div className="space-y-2 text-[11px] pt-1">
                          {attendanceChartData.map(stat => (
                            <div key={stat.name} className="flex justify-between items-center">
                              <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stat.color }} />
                                <span className="font-bold text-slate-500 dark:text-slate-400">{stat.name}</span>
                              </div>
                              <span className="font-black text-slate-900 dark:text-white">{stat.value} Days</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Right: Check-in log list */}
                      <div className="lg:col-span-2 p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-4 text-left shadow-md hover:shadow-lg transition-all duration-300">
                        <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block border-b border-slate-100 dark:border-slate-900 pb-1.5">Check In/Out Stream</span>
                        
                        {attendanceLogs.length === 0 ? (
                          <div className="py-12 text-center text-slate-500 font-bold uppercase tracking-wider text-xs">
                            No attendance history logged in database yet.
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                            {attendanceLogs.map((log) => (
                              <div key={log._id} className="p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-between gap-4">
                                <div className="space-y-0.5">
                                  <span className="text-[11px] font-black text-slate-900 dark:text-white">{log.date}</span>
                                  <div className="flex gap-3 text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase">
                                    <span>In: <span className="font-mono text-emerald-600 dark:text-emerald-400">{log.checkIn || log.timeIn}</span></span>
                                    <span>Out: <span className="font-mono text-blue-600 dark:text-blue-400">{log.checkOut || log.timeOut}</span></span>
                                  </div>
                                </div>

                                <div className="text-right space-y-0.5">
                                  <span className={cn(
                                    "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border",
                                    log.status === 'Present' ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                                  )}>
                                    {log.status}
                                  </span>
                                  <span className="block text-[8px] text-slate-500 font-mono mt-0.5">{log.hours || log.duration} Worked</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* LEAVE TAB */}
                {activeTab === 'leave' && (
                  <div className="space-y-4 text-left">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Leave counters */}
                      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-4 shadow-md hover:shadow-lg transition-all duration-300">
                        <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block border-b border-slate-100 dark:border-slate-900 pb-1.5">Allocated Balance</span>
                        <div className="text-center py-4">
                          <h2 className="text-3xl font-black font-outfit text-blue-600 dark:text-blue-400">{remainingLeaves}</h2>
                          <p className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase mt-0.5">Days Available</p>
                        </div>
                        <div className="pt-1.5 border-t border-slate-100 dark:border-slate-900 text-[11px] flex justify-between">
                          <span className="text-slate-500 font-bold">Total Max Leaves</span>
                          <span className="font-extrabold text-slate-700 dark:text-slate-200">{currentEmployee?.maxLeaves || 24} Days</span>
                        </div>
                      </div>

                      {/* Leaves list */}
                      <div className="md:col-span-2 p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-4 shadow-md hover:shadow-lg transition-all duration-300">
                        <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block border-b border-slate-100 dark:border-slate-900 pb-1.5">Leave Requests & Timelines</span>
                        
                        {leavesList.length === 0 ? (
                          <div className="py-12 text-center text-slate-500 font-bold uppercase tracking-wider text-xs">
                            No leaves applied by this employee yet.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {leavesList.map((leave) => (
                              <div key={leave._id} className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-black text-slate-900 dark:text-white">{leave.type}</span>
                                    <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400">({leave.duration})</span>
                                  </div>
                                  <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold mt-0.5 uppercase tracking-wide">{leave.date}</p>
                                  <p className="text-[10px] text-slate-600 dark:text-slate-300 leading-relaxed mt-1.5 italic">Reason: "{leave.reason}"</p>
                                </div>

                                <div className="shrink-0">
                                  <span className={cn(
                                    "px-2.5 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider border",
                                    leave.status === 'Approved' ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" :
                                    leave.status === 'Pending' ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" :
                                    "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                                  )}>
                                    {leave.status}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* PAYROLL TAB */}
                {activeTab === 'payroll' && (
                  <div className="space-y-4 text-left">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Left: CTC Details */}
                      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-4 shadow-md hover:shadow-lg transition-all duration-300">
                        <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block border-b border-slate-100 dark:border-slate-900 pb-1.5">Compensation Structure</span>
                        
                        <div className="space-y-2.5 text-[11px] pt-0.5">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500 font-bold">Basic Salary</span>
                            <span className="font-bold text-slate-700 dark:text-slate-200">₹{currentEmployee?.salaryStructure?.basic?.toLocaleString('en-IN') || '30,000'}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500 font-bold">HRA</span>
                            <span className="font-bold text-slate-700 dark:text-slate-200">₹{currentEmployee?.salaryStructure?.hra?.toLocaleString('en-IN') || '10,000'}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500 font-bold">Allowances</span>
                            <span className="font-bold text-slate-700 dark:text-slate-200">₹{currentEmployee?.salaryStructure?.allowance?.toLocaleString('en-IN') || '5,000'}</span>
                          </div>
                          <div className="flex justify-between items-center pt-1.5 border-t border-slate-100 dark:border-slate-900">
                            <span className="text-slate-500 font-bold">Provident Fund (PF)</span>
                            <span className="font-bold text-rose-500 dark:text-rose-400">-₹{currentEmployee?.salaryStructure?.pf?.toLocaleString('en-IN') || '3,600'}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500 font-bold">ESI & Taxes</span>
                            <span className="font-bold text-rose-500 dark:text-rose-400">-₹{currentEmployee?.salaryStructure?.esi?.toLocaleString('en-IN') || '1,000'}</span>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-800">
                            <span className="text-blue-600 dark:text-blue-400 uppercase font-black text-[9px]">Net Take-Home Pay</span>
                            <span className="font-black text-blue-600 dark:text-blue-400 font-mono">₹{currentEmployee?.salaryStructure?.net?.toLocaleString('en-IN') || '38,400'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Payslips history */}
                      <div className="md:col-span-2 p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-4 shadow-md hover:shadow-lg transition-all duration-300">
                        <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block border-b border-slate-100 dark:border-slate-900 pb-1.5">Generated Payslips Vault</span>
                        
                        {payrollHistory.length === 0 ? (
                          <div className="py-12 text-center text-slate-500 font-bold uppercase tracking-wider text-xs">
                            No payroll record generated inside database yet.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {payrollHistory.map((pay) => (
                              <div key={pay._id} className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-between gap-4">
                                <div className="space-y-0.5">
                                  <span className="text-[11px] font-black text-slate-900 dark:text-white">{pay.month}</span>
                                  <div className="flex gap-2.5 text-[8.5px] text-slate-500 dark:text-slate-400 font-bold uppercase mt-0.5">
                                    <span>Gross: ₹{pay.gross?.toLocaleString('en-IN') || pay.basic}</span>
                                    <span>Net Paid: <span className="font-mono text-emerald-600 dark:text-emerald-400">₹{pay.net?.toLocaleString('en-IN')}</span></span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                    {pay.status}
                                  </span>
                                  <button className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg transition-all cursor-pointer">
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* PERFORMANCE TAB */}
                {activeTab === 'performance' && (
                  <div className="space-y-4 text-left">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Left Review Stats */}
                      <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-3">
                        <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block border-b border-slate-100 dark:border-slate-900 pb-1.5">KPI Rating Metrics</span>
                        <div className="h-32">
                          <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 1, height: 1 }}>
                            <AreaChart data={performanceChartData} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-[#1e293b]" />
                              <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: 8 }} />
                              <YAxis stroke="#64748b" style={{ fontSize: 8 }} domain={[3, 5]} />
                              <Tooltip contentStyle={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text-primary)', fontSize: 10, borderRadius: '8px' }} />
                              <Area type="monotone" dataKey="rating" stroke="#3b82f6" fill="rgba(59, 130, 246, 0.05)" strokeWidth={2} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="text-center pt-1.5">
                          <span className="text-[9px] font-bold text-slate-500 uppercase">Q2 Avg Rating</span>
                          <span className="block text-base font-black text-blue-600 dark:text-blue-400 mt-0.5">4.6 / 5.0</span>
                        </div>
                      </div>

                      {/* Right Feedback */}
                      <div className="md:col-span-2 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-3">
                        <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block border-b border-slate-100 dark:border-slate-900 pb-1.5">Promotion & Appraisals</span>
                        <div className="space-y-2.5">
                          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl">
                            <div className="flex justify-between items-start">
                              <span className="text-[11px] font-black text-slate-900 dark:text-white">Promotion to Senior Frontend Engineer</span>
                              <span className="text-[8.5px] font-bold text-slate-500 dark:text-slate-400 uppercase">June 2025</span>
                            </div>
                            <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-1.5">Elevated due to consistent contribution in HR Core portal architecture, mentoring junior devs, and reducing build layout bugs by 90%.</p>
                          </div>

                          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl">
                            <div className="flex justify-between items-start">
                              <span className="text-[11px] font-black text-slate-900 dark:text-white">Appraisal Feedbacks (Admin Review)</span>
                              <span className="text-[8.5px] font-bold text-slate-500 dark:text-slate-400 uppercase">April 2026</span>
                            </div>
                            <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-1.5">"Extremely detail oriented developer. Clean components structure. Performance score matches delivery metrics."</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* PROJECTS & TASKS TAB */}
                {activeTab === 'projects-tasks' && (
                  <div className="space-y-4 text-left">
                    {/* Projects Checklist */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-3">
                      <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block border-b border-slate-100 dark:border-slate-900 pb-1.5">Assigned Projects</span>
                      {projectsList.length === 0 ? (
                        <div className="py-6 text-center text-slate-500 font-bold uppercase tracking-wider text-xs">
                          No active projects assigned in database yet.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {projectsList.map((project) => (
                            <div key={project._id} className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl space-y-2">
                              <div className="flex justify-between items-start">
                                <h4 className="text-xs font-black text-slate-900 dark:text-white">{project.name}</h4>
                                <span className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 bg-blue-500/10 border border-blue-500/25 text-blue-600 dark:text-blue-400 rounded-full">
                                  {project.status}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed truncate">{project.description}</p>
                              
                              <div className="space-y-0.5 pt-0.5">
                                <div className="flex justify-between text-[8px] text-slate-500 font-bold">
                                  <span>PROJ PROGRESS</span>
                                  <span>{project.completionPercent || 0}%</span>
                                </div>
                                <div className="w-full h-1 bg-slate-200 dark:bg-slate-950 rounded-full overflow-hidden">
                                  <div className="h-full bg-blue-500" style={{ width: `${project.completionPercent || 0}%` }} />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Tasks Kanban list */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-3">
                      <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block border-b border-slate-100 dark:border-slate-900 pb-1.5">Sprint Task Board</span>
                      
                      {tasksList.length === 0 ? (
                        <div className="py-8 text-center text-slate-500 font-bold uppercase tracking-wider text-xs">
                          No tasks assigned to this employee.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {['To Do', 'In Progress', 'Done'].map(column => {
                            const columnTasks = tasksList.filter(t => {
                              if (column === 'To Do') return t.status === 'To Do' || t.status === 'Blocked';
                              if (column === 'In Progress') return t.status === 'In Progress' || t.status === 'Review';
                              return t.status === 'Done';
                            });

                            return (
                              <div key={column} className="p-2.5 bg-slate-100/50 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800 rounded-xl space-y-2 flex flex-col min-h-48">
                                <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-1.5">
                                  <span className="text-[8.5px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">{column}</span>
                                  <span className="text-[7.5px] font-black font-mono text-slate-600 dark:text-slate-400 px-1.5 py-0.2 bg-slate-200 dark:bg-slate-950 rounded-full">{columnTasks.length}</span>
                                </div>

                                <div className="flex-1 space-y-2 overflow-y-auto max-h-48 pr-1">
                                  {columnTasks.map(task => (
                                    <div key={task._id} className="p-2.5 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl space-y-2 shadow-sm hover:border-slate-200 dark:hover:border-slate-700 transition-all text-left">
                                      <h5 className="text-[11px] font-black text-slate-900 dark:text-white leading-snug">{task.title}</h5>
                                      
                                      <div className="flex justify-between items-center text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                        <span>Due: {task.due}</span>
                                        <span className={cn(
                                          "px-1.5 py-0.2 rounded-md",
                                          task.priority === 'Urgent' || task.priority === 'High' ? "bg-rose-500/10 text-rose-600 dark:text-rose-400" : "bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400"
                                        )}>
                                          {task.priority}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* DOCUMENTS TAB */}
                {activeTab === 'documents' && (
                  <div className="space-y-3 text-left">
                    <div className="grid grid-cols-1 gap-2.5">
                      {(() => {
                        const requiredDocs = [
                          "Passport Photo",
                          "Aadhaar Card",
                          "PAN Card",
                          "Resume",
                          "Education Certificates",
                          "Experience Certificates"
                        ];
                        const allDocs = [...requiredDocs];
                        documents.forEach(d => {
                          if (!allDocs.includes(d.name)) {
                            allDocs.push(d.name);
                          }
                        });

                        return allDocs.map((docName) => {
                          const doc = documents.find(d => d.name === docName);
                          return (
                            <div 
                              key={docName} 
                              className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 shadow-md hover:shadow-lg transition-all duration-300 hover:border-slate-300 dark:hover:border-slate-700"
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-8.5 h-8.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-center text-slate-500 shrink-0">
                                  <FileText className="w-4 h-4" />
                                </div>
                                <div>
                                  <span className="font-black uppercase text-slate-800 dark:text-slate-200 text-[10px] block leading-tight">
                                    {docName}
                                  </span>
                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    {doc ? (
                                      <span className={cn(
                                        "inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[7.5px] font-black uppercase tracking-wider",
                                        (doc.status === 'Approved' || doc.status === 'Verified') ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450' :
                                        doc.status === 'Rejected' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' :
                                        'bg-amber-500/10 text-amber-600 dark:text-amber-450'
                                      )}>
                                        {(doc.status === 'Approved' || doc.status === 'Verified') ? (
                                          <CheckCircle className="w-2.5 h-2.5" />
                                        ) : (
                                          <AlertCircle className="w-2.5 h-2.5 animate-pulse" />
                                        )}
                                        {doc.status || 'Pending'}
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[7.5px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-800">
                                        Not Uploaded
                                      </span>
                                    )}
                                    {doc?.uploadedAt && (
                                      <span className="text-[7.5px] font-medium text-slate-500">
                                        Uploaded: {new Date(doc.uploadedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {doc && (
                                <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-1.5 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-slate-800">
                                  <a 
                                    href={doc.fileUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-[8px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer border border-slate-200 dark:border-slate-800"
                                  >
                                    <ExternalLink className="w-3 h-3" /> View
                                  </a>

                                  <div className="flex items-center gap-1.5 ml-1 border-l border-slate-200 dark:border-slate-800 pl-2">
                                    <button
                                      type="button"
                                      disabled={verifyingDocName === docName}
                                      onClick={() => handleVerifyDocument(docName, 'Approved')}
                                      className={cn(
                                        "px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer",
                                        (doc.status === 'Approved' || doc.status === 'Verified')
                                          ? "bg-emerald-500 text-white cursor-default"
                                          : "bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-450 hover:bg-emerald-500/20"
                                      )}
                                    >
                                      <Check className="w-3 h-3" />
                                      Approve
                                    </button>

                                    <button
                                      type="button"
                                      disabled={verifyingDocName === docName}
                                      onClick={() => handleVerifyDocument(docName, 'Rejected')}
                                      className={cn(
                                        "px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer",
                                        doc.status === 'Rejected'
                                          ? "bg-rose-500 text-white cursor-default"
                                          : "bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20"
                                      )}
                                    >
                                      <Ban className="w-3 h-3" />
                                      Reject
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                )}

                {/* ACTIVITY LOGS TAB */}
                {activeTab === 'activity-logs' && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-3 text-left">
                    <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block border-b border-slate-100 dark:border-slate-900 pb-1.5">Compliance Logs</span>
                    {auditLogsList.length === 0 ? (
                      <div className="py-12 text-center text-slate-500 font-bold uppercase tracking-wider text-xs">
                        No activity logs registered for this employee yet.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {auditLogsList.map((log) => (
                          <div key={log._id} className="p-2.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-between text-[11px]">
                            <div className="space-y-0.5">
                              <span className="font-extrabold text-slate-900 dark:text-slate-100 block">{log.action}</span>
                              <span className="text-[9px] text-slate-500 dark:text-slate-400 block leading-tight">{log.details}</span>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400 block">{new Date(log.createdAt).toLocaleDateString()}</span>
                              <span className="text-[8px] font-bold text-blue-600 dark:text-blue-400 block mt-0.5">IP: {log.ipAddress}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* SECURITY TAB */}
                {activeTab === 'security' && (
                  <div className="space-y-4 text-left">
                    <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-3">
                      <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block border-b border-slate-100 dark:border-slate-900 pb-1.5">Login Session Parameters</span>
                      
                      <div className="space-y-2 text-[11px]">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-bold">2-Factor Authentication</span>
                          <span className="px-1.5 py-0.2 bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 rounded-md text-[8.5px] font-black uppercase tracking-wider">Enabled</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-bold">Security Keys</span>
                          <span className="px-1.5 py-0.2 bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 rounded-md text-[8.5px] font-black uppercase tracking-wider">Secured</span>
                        </div>

                        <div className="flex justify-between items-center pt-1.5 border-t border-slate-200 dark:border-slate-800">
                          <span className="text-slate-500 font-bold">Handshake Token</span>
                          <span className="font-mono text-slate-600 dark:text-slate-400 text-[9px] truncate max-w-[150px]">active_auth_key</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-3">
                      <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block border-b border-slate-100 dark:border-slate-900 pb-1.5">Authorized Devices</span>
                      <div className="space-y-2">
                        {[
                          { device: 'MacBook Pro (macOS)', location: 'Mumbai, IN', date: 'Active Session Now', ip: '192.168.1.45' },
                          { device: 'iPhone 15 Pro (iOS)', location: 'Pune, IN', date: '2 days ago', ip: '192.168.1.109' }
                        ].map((d, i) => (
                          <div key={i} className="p-2.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl flex justify-between items-center text-[11px]">
                            <div>
                              <span className="font-extrabold text-slate-900 dark:text-slate-100 block">{d.device}</span>
                              <span className="text-[8.5px] text-slate-500 uppercase font-bold mt-0.5">{d.location} • IP: {d.ip}</span>
                            </div>
                            <span className="text-[8px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">{d.date}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'message' && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-4 text-left">
                    <div className="border-b border-slate-105 dark:border-slate-900 pb-2">
                      <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Send Direct Message</span>
                      <p className="text-[10px] text-slate-400 mt-0.5">Communicate directly with {currentEmployee?.name || currentEmployee?.fullName} from here.</p>
                    </div>

                    <form onSubmit={handleSendDirectMessage} className="space-y-4">
                      {/* Recipient info */}
                      <div>
                        <label className="block text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Recipient</label>
                        <input
                          type="text"
                          readOnly
                          className="saas-input w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-505 dark:text-slate-400 text-xs rounded-xl outline-none cursor-not-allowed font-medium"
                          value={`${currentEmployee?.name || currentEmployee?.fullName} (${currentEmployee?.email})`}
                        />
                      </div>

                      {/* Subject */}
                      <div>
                        <label className="block text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Subject</label>
                        <input
                          type="text"
                          required
                          placeholder="Enter message subject..."
                          className="saas-input w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs rounded-xl outline-none focus:border-blue-500 transition-colors"
                          value={msgSubject}
                          onChange={(e) => setMsgSubject(e.target.value)}
                        />
                      </div>

                      {/* Message Body */}
                      <div>
                        <label className="block text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Message Body</label>
                        <textarea
                          required
                          rows={6}
                          placeholder="Write your message here..."
                          className="saas-input w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs rounded-xl outline-none focus:border-blue-500 transition-colors resize-none"
                          value={msgBody}
                          onChange={(e) => setMsgBody(e.target.value)}
                        />
                      </div>

                      {msgError && (
                        <p className="text-[10px] font-bold text-rose-500">{msgError}</p>
                      )}

                      {msgSuccess && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                          <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">Message sent successfully!</p>
                        </div>
                      )}

                      <div className="flex gap-3 pt-2">
                        <button
                          type="submit"
                          disabled={msgSending || msgSuccess}
                          className="px-5 py-2.5 bg-blue-650 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:shadow-lg hover:shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-60 cursor-pointer"
                        >
                          {msgSending ? (
                            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Send className="w-3.5 h-3.5" />
                          )}
                          {msgSending ? 'Sending...' : 'Send Message'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMsgSubject('');
                            setMsgBody('');
                            setMsgError('');
                            setActiveTab('overview');
                          }}
                          className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-650 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer border border-slate-200 dark:border-slate-800"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {(modalType === 'add' || modalType === 'edit') && (
          <div className="flex flex-col h-full overflow-hidden w-full bg-white dark:bg-slate-900">
            {/* Header */}
            <div className="px-6 py-4.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900">
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-500 animate-pulse" />
                {modalType === 'add' ? 'Add New Employee' : 'Edit Employee Settings'}
              </h2>
              <button 
                type="button"
                onClick={closeModal} 
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer border-none bg-transparent flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden text-left bg-white dark:bg-slate-900">
              <input type="text" name="fake_email" style={{ display: 'none' }} autoComplete="off" />
              <input type="password" name="fake_password" style={{ display: 'none' }} autoComplete="off" />
              
              {modalType === 'add' ? (
                /* Stage 1 Add Employee Single Page View */
                <div className="flex-1 p-4 space-y-3 bg-white dark:bg-slate-900 flex flex-col justify-between overflow-hidden select-none font-outfit">
                  <div className="space-y-3">
                    <p className="text-[9px] text-slate-400 font-semibold leading-relaxed">
                      Stage 1: Employee Creation & Magic Invitation. Provide initial details; system will send a secure self-onboarding link.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10.5px]">
                      <div className="space-y-0.5">
                        <label className="text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block font-sans">Full Name *</label>
                        <input 
                          type="text" 
                          name="name"
                          required
                          placeholder="e.g. John Doe"
                          className="saas-input w-full py-1.5 px-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg outline-none focus:border-blue-500 font-semibold text-[10.5px]"
                          value={formData.name}
                          onChange={handleInputChange}
                        />
                      </div>

                      <div className="space-y-0.5">
                        <label className="text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block font-sans">Personal Email *</label>
                        <input 
                          type="email" 
                          name="personalEmail"
                          required
                          placeholder="e.g. john@gmail.com"
                          className="saas-input w-full py-1.5 px-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg outline-none focus:border-blue-500 font-semibold text-[10.5px]"
                          value={formData.personalEmail || ''}
                          onChange={handleInputChange}
                        />
                        <p className="text-[7px] text-slate-400 font-medium">Invitation will go to this email</p>
                      </div>

                      <div className="space-y-0.5">
                        <label className="text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block font-sans">Work Email *</label>
                        <input 
                          type="email" 
                          name="email"
                          required
                          placeholder="e.g. john.doe@company.com"
                          className="saas-input w-full py-1.5 px-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg outline-none focus:border-blue-500 font-semibold text-[10.5px]"
                          value={formData.email}
                          onChange={handleInputChange}
                        />
                        <p className="text-[7px] text-slate-400 font-medium">Used for system login later</p>
                      </div>

                      <div className="space-y-0.5">
                        <label className="text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block font-sans">Work Email Password</label>
                        <input 
                          type="text" 
                          name="workEmailPassword"
                          placeholder="e.g. TempPass@123"
                          className="saas-input w-full py-1.5 px-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg outline-none focus:border-blue-500 font-semibold text-[10.5px]"
                          value={formData.workEmailPassword || ''}
                          onChange={handleInputChange}
                        />
                      </div>

                      <div className="space-y-0.5">
                        <label className="text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block font-sans">Phone Number *</label>
                        <input 
                          type="text" 
                          name="phone"
                          required
                          placeholder="e.g. +91 99999 99999"
                          className="saas-input w-full py-1.5 px-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg outline-none focus:border-blue-500 font-semibold text-[10.5px]"
                          value={formData.phone}
                          onChange={handleInputChange}
                        />
                      </div>

                      <div className="space-y-0.5">
                        <label className="text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block font-sans">Department *</label>
                        <select 
                          name="dept"
                          required
                          className="saas-input w-full py-1.5 px-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg outline-none cursor-pointer focus:border-blue-500 font-semibold text-[10.5px]"
                          value={formData.dept}
                          onChange={handleInputChange}
                        >
                          {departments.map((d: string) => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-0.5">
                        <label className="text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block font-sans">Office Branch *</label>
                        <select 
                          name="branchId"
                          required
                          className="saas-input w-full py-1.5 px-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg outline-none cursor-pointer focus:border-blue-500 font-semibold text-[10.5px]"
                          value={formData.branchId || ''}
                          onChange={handleInputChange}
                        >
                          <option value="">Select Branch</option>
                          {branches.map((b: any) => (
                            <option key={b._id} value={b._id}>{b.branchName} ({b.branchCode})</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-0.5">
                        <label className="text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block font-sans">Designation *</label>
                        <select 
                          name="designation"
                          required
                          className="saas-input w-full py-1.5 px-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg outline-none cursor-pointer focus:border-blue-500 font-semibold text-[10.5px]"
                          value={formData.designation}
                          onChange={handleInputChange}
                        >
                          <option value="">Select Designation</option>
                          {designationsList.map((d: any) => (
                            <option key={d._id} value={d.designationName}>{d.designationName}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-0.5">
                        <label className="text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block font-sans">System Role *</label>
                        <select 
                          name="role"
                          required
                          className="saas-input w-full py-1.5 px-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg outline-none font-semibold cursor-pointer focus:border-blue-500 text-[10.5px]"
                          value={formData.role || 'Employee'}
                          onChange={handleInputChange}
                        >
                          <option value="Employee">Employee (Standard)</option>
                          <option value="HR">HR Specialist</option>
                          <option value="Admin">Administrator</option>
                        </select>
                      </div>

                      <div className="space-y-0.5">
                        <label className="text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block font-sans">Employment Type *</label>
                        <select 
                          name="employmentType"
                          required
                          className="saas-input w-full py-1.5 px-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg outline-none cursor-pointer focus:border-blue-500 font-semibold text-[10.5px]"
                          value={formData.employmentType || 'Full-Time'}
                          onChange={handleInputChange}
                        >
                          <option value="Full-Time">Full-Time</option>
                          <option value="Part-Time">Part-Time</option>
                          <option value="Contract">Contract</option>
                          <option value="Internship">Internship</option>
                        </select>
                      </div>

                      <div className="space-y-0.5">
                        <label className="text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block font-sans">Proposed Joining *</label>
                        <input 
                          type="date" 
                          name="joining"
                          required
                          className="saas-input w-full py-1.5 px-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg outline-none focus:border-blue-500 font-semibold text-[10.5px]"
                          value={formData.joining}
                          onChange={handleInputChange}
                        />
                      </div>

                      {/* Reporting Manager Searchable Dropdown */}
                      <div className="space-y-0.5 relative">
                        <label className="text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block font-sans flex items-center gap-1">
                          Reporting Manager
                          {selectedManager && (
                            <span className="ml-1 px-1 py-0.2 bg-blue-500/10 text-blue-500 text-[6.5px] rounded border border-blue-500/20">Selected</span>
                          )}
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Search manager..."
                            className="saas-input w-full py-1.5 px-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg outline-none focus:border-blue-500 font-semibold text-[10.5px]"
                            value={managerSearch || (selectedManager ? `${selectedManager.fullName}` : '')}
                            onChange={e => { setManagerSearch(e.target.value); setSelectedManager(null); setShowManagerDropdown(true); handleInputChange({ target: { name: 'reportingManagerId', value: '' } } as any); }}
                            onFocus={() => setShowManagerDropdown(true)}
                            onBlur={() => setTimeout(() => setShowManagerDropdown(false), 150)}
                          />
                          {showManagerDropdown && (
                            <div className="absolute z-[500] top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl max-h-40 overflow-y-auto">
                              {eligibleManagers.filter(m =>
                                !managerSearch ||
                                m.fullName?.toLowerCase().includes(managerSearch.toLowerCase()) ||
                                m.email?.toLowerCase().includes(managerSearch.toLowerCase()) ||
                                m.designation?.toLowerCase().includes(managerSearch.toLowerCase())
                              ).slice(0, 20).map((mgr: any) => (
                                <button
                                  key={mgr._id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedManager(mgr);
                                    setManagerSearch('');
                                    setShowManagerDropdown(false);
                                    handleInputChange({ target: { name: 'reportingManagerId', value: mgr._id } } as any);
                                  }}
                                  className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-slate-800 transition-colors text-left border-none bg-transparent cursor-pointer"
                                >
                                  <img
                                    src={mgr.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${mgr.fullName}`}
                                    alt={mgr.fullName}
                                    className="w-6 h-6 rounded-md object-cover flex-shrink-0"
                                  />
                                  <div className="min-w-0">
                                    <p className="text-[10px] font-black text-white truncate">{mgr.fullName}</p>
                                    <p className="text-[8px] text-slate-400 truncate">{mgr.designation}</p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2.5 pt-2.5 border-t border-slate-200/80 dark:border-slate-800/80">
                    <button 
                      type="submit"
                      className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[9px] font-black uppercase tracking-widest cursor-pointer shadow-lg shadow-blue-500/25 transition-all border-none text-center"
                    >
                      Create Employee & Send Invite
                    </button>
                    <button 
                      type="button" 
                      onClick={closeModal}
                      className="px-5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-650 dark:text-slate-350 hover:text-slate-800 dark:hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors cursor-pointer border border-slate-200 dark:border-slate-800"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* Edit view with all tabs */
                <div className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden bg-white dark:bg-slate-900 w-full">
                  {/* LEFT PROFILE SIDEBAR PANEL */}
                  <div className="w-full md:w-56 bg-slate-50 dark:bg-slate-900 border-b md:border-b-0 md:border-r border-slate-200/80 dark:border-slate-800/80 p-4 md:p-3 flex flex-col shrink-0 min-w-0 overflow-visible md:overflow-y-auto">
                    <div className="space-y-3">
                      {/* Profile Block with Upload */}
                      <div className="text-center space-y-2.5">
                        <label className="block text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center">Profile Img</label>
                        <div className="relative w-16 h-16 mx-auto group">
                          <img 
                            src={formData.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(formData.name || formData.email || '')}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffdfbf`} 
                            alt="Profile Preview" 
                            className="w-full h-full object-cover rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl" 
                          />
                        </div>
                        
                        <div>
                          <input 
                            type="file"
                            id="sidebar-profile-upload"
                            accept="image/*"
                            onChange={handleProfilePictureUpload}
                            className="hidden"
                          />
                          <label 
                            htmlFor="sidebar-profile-upload"
                            className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold transition-all shadow-md hover:shadow-blue-500/25 border-none"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            {uploading ? 'Uploading...' : 'Upload Img'}
                          </label>
                        </div>
                      </div>

                      {/* Core fields */}
                      <div className="space-y-2.5 pt-2.5 border-t border-slate-200 dark:border-slate-900">
                        <div>
                          <label className="block text-[8px] font-black text-slate-550 dark:text-slate-400 uppercase tracking-widest mb-1">Full Name</label>
                          <input 
                            type="text" 
                            name="name"
                            required
                            placeholder="Enter your name"
                            className="saas-input w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-semibold rounded-lg outline-none focus:border-blue-500"
                            value={formData.name}
                            onChange={handleInputChange}
                          />
                        </div>

                        <div>
                          <label className="block text-[8px] font-black text-slate-555 dark:text-slate-400 uppercase tracking-widest mb-1">Designation</label>
                          <select 
                            name="designation"
                            required
                            className="saas-input w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-semibold rounded-lg outline-none cursor-pointer focus:border-blue-500"
                            value={formData.designation}
                            onChange={handleInputChange}
                          >
                            <option value="">Select Designation</option>
                            {designationsList.map((d: any) => (
                              <option key={d._id} value={d.designationName}>{d.designationName}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[8px] font-black text-slate-555 dark:text-slate-400 uppercase tracking-widest mb-1">Department</label>
                          <select 
                            name="dept"
                            className="saas-input w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-semibold rounded-lg outline-none cursor-pointer focus:border-blue-500"
                            value={formData.dept}
                            onChange={handleInputChange}
                          >
                            {departments.map((d: string) => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[8px] font-black text-slate-555 dark:text-slate-400 uppercase tracking-widest mb-1">Status</label>
                          <select 
                            name="status"
                            className="saas-input w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-semibold rounded-lg outline-none cursor-pointer focus:border-blue-500"
                            value={formData.status}
                            onChange={handleInputChange}
                          >
                            <option>Active</option>
                            <option>Inactive</option>
                            <option>Invited</option>
                            <option>Profile Pending</option>
                            <option>Documents Pending</option>
                            <option>Verification Pending</option>
                            <option>Approved</option>
                            <option>Rejected</option>
                          </select>
                        </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT MAIN DETAILS PANEL (TABBED CONTAINER) */}
                  <div className="flex-1 flex flex-col overflow-visible md:overflow-hidden min-w-0 bg-white dark:bg-slate-900">
                    {/* Tab Navigation header */}
                    <div className="px-4 pt-2.5 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between shrink-0">
                      <div className="premium-nav-container scrollbar-none z-20 relative pr-4 font-outfit">
                        {[
                          { id: 'contact', label: 'Contact & Office' },
                          { id: 'personal', label: 'Personal Details' },
                          { id: 'security', label: 'Credentials & Role' },
                          { id: 'financial', label: 'Bank & Financials' }
                        ].map(tab => (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setFormActiveTab(tab.id as any)}
                            className={cn(
                              "premium-nav-item active:scale-[0.98] text-[9.5px]",
                              formActiveTab === tab.id ? "premium-nav-item-active" : ""
                            )}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Tab Content panel */}
                    <div className="flex-1 p-6 overflow-visible md:overflow-y-auto min-w-0 bg-white dark:bg-slate-900">
                      
                      {/* CONTACT & OFFICE TAB */}
                      <div className={cn("space-y-4", formActiveTab !== 'contact' && "hidden")}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Email Address</label>
                            <input 
                              type="text" 
                              name="email"
                              autoComplete="new-password"
                              required
                              placeholder="Enter Email Address"
                              className="saas-input w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs rounded-xl outline-none focus:border-blue-500"
                              value={formData.email}
                              onChange={handleInputChange}
                            />
                          </div>
                          <div>
                            <label className="block text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Phone Number</label>
                            <input 
                              type="text" 
                              name="phone"
                              placeholder="Enter Phone Number"
                              className="saas-input w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs rounded-xl outline-none focus:border-blue-500"
                              value={formData.phone}
                              onChange={handleInputChange}
                            />
                          </div>
                          <div>
                            <label className="block text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Office Location</label>
                            <input 
                              type="text" 
                              name="location"
                              placeholder="Enter Office Location"
                              className="saas-input w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs rounded-xl outline-none focus:border-blue-550"
                              value={formData.location}
                              onChange={handleInputChange}
                            />
                          </div>
                          <div>
                            <label className="block text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Office Branch *</label>
                            <select 
                              name="branchId"
                              required
                              className="saas-input w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs rounded-xl outline-none cursor-pointer focus:border-blue-500 font-semibold"
                              value={formData.branchId || ''}
                              onChange={handleInputChange}
                            >
                              <option className="bg-white dark:bg-slate-900" value="">Select Branch</option>
                              {branches.map((b: any) => (
                                <option className="bg-white dark:bg-slate-900" key={b._id} value={b._id}>{b.branchName} ({b.branchCode})</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[8px] font-black text-slate-555 dark:text-slate-400 uppercase tracking-widest mb-1.5">Joining Date</label>
                            <input 
                              type="date" 
                              name="joining"
                              required
                              className="saas-input w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs rounded-xl outline-none focus:border-blue-500"
                              value={formData.joining}
                              onChange={handleInputChange}
                            />
                          </div>

                          {/* Reporting Manager Searchable Dropdown */}
                          <div className="space-y-1 sm:col-span-2 relative">
                            <label className="block text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1 font-sans">
                              Reporting Manager
                              {selectedManager && (
                                <span className="ml-1 px-1.5 py-0.5 bg-blue-500/10 text-blue-500 text-[7px] rounded border border-blue-500/20">Selected</span>
                              )}
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                placeholder="Search manager by name, email, or designation..."
                                className="saas-input w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs rounded-xl outline-none focus:border-blue-500 font-semibold"
                                value={managerSearch || (selectedManager ? `${selectedManager.fullName} (${selectedManager.designation})` : '')}
                                onChange={e => { setManagerSearch(e.target.value); setSelectedManager(null); setShowManagerDropdown(true); handleInputChange({ target: { name: 'reportingManagerId', value: '' } } as any); }}
                                onFocus={() => setShowManagerDropdown(true)}
                                onBlur={() => setTimeout(() => setShowManagerDropdown(false), 150)}
                              />
                              {showManagerDropdown && (
                                <div className="absolute z-[500] top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-h-52 overflow-y-auto">
                                  {eligibleManagers.filter(m =>
                                    !managerSearch ||
                                    m.fullName?.toLowerCase().includes(managerSearch.toLowerCase()) ||
                                    m.email?.toLowerCase().includes(managerSearch.toLowerCase()) ||
                                    m.designation?.toLowerCase().includes(managerSearch.toLowerCase())
                                  ).slice(0, 20).map((mgr: any) => (
                                    <button
                                      key={mgr._id}
                                      type="button"
                                      onClick={() => {
                                        setSelectedManager(mgr);
                                        setManagerSearch('');
                                        setShowManagerDropdown(false);
                                        handleInputChange({ target: { name: 'reportingManagerId', value: mgr._id } } as any);
                                      }}
                                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-800 transition-colors text-left border-none bg-transparent cursor-pointer"
                                    >
                                      <img
                                        src={mgr.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${mgr.fullName}`}
                                        alt={mgr.fullName}
                                        className="w-7 h-7 rounded-lg object-cover flex-shrink-0"
                                      />
                                      <div className="min-w-0">
                                        <p className="text-[11px] font-black text-white truncate">{mgr.fullName}</p>
                                        <p className="text-[9px] text-slate-400 truncate">{mgr.designation} · {mgr.department}</p>
                                      </div>
                                    </button>
                                  ))}
                                  {eligibleManagers.filter(m =>
                                    !managerSearch ||
                                    m.fullName?.toLowerCase().includes(managerSearch.toLowerCase()) ||
                                    m.email?.toLowerCase().includes(managerSearch.toLowerCase())
                                  ).length === 0 && (
                                    <p className="px-4 py-3 text-[10px] text-slate-400 text-center">No managers found</p>
                                  )}
                                </div>
                              )}
                            </div>
                            {selectedManager && (
                              <div className="mt-2 p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl flex items-center gap-3">
                                <img src={selectedManager.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedManager.fullName}`} alt="" className="w-8 h-8 rounded-lg object-cover" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-[11px] font-black text-white">{selectedManager.fullName}</p>
                                  <p className="text-[9px] text-slate-400">{selectedManager.designation} · {selectedManager.email}</p>
                                </div>
                                <button type="button" onClick={() => { setSelectedManager(null); setManagerSearch(''); handleInputChange({ target: { name: 'reportingManagerId', value: '' } } as any); }} className="text-slate-400 hover:text-rose-400 transition-colors border-none bg-transparent cursor-pointer text-lg leading-none">×</button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* PERSONAL DETAILS TAB */}
                      <div className={cn("space-y-4", formActiveTab !== 'personal' && "hidden")}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Gender</label>
                            <select 
                              name="gender"
                              className="saas-input w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs rounded-xl outline-none cursor-pointer focus:border-blue-500"
                              value={formData.gender || ''}
                              onChange={handleInputChange}
                            >
                              <option className="bg-white dark:bg-slate-900" value="">Select Gender</option>
                              <option className="bg-white dark:bg-slate-900" value="Male">Male</option>
                              <option className="bg-white dark:bg-slate-900" value="Female">Female</option>
                              <option className="bg-white dark:bg-slate-900" value="Other">Other</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Blood Group</label>
                            <input 
                              type="text" 
                              name="bloodGroup"
                              placeholder="Enter Blood Group"
                              className="saas-input w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs rounded-xl outline-none focus:border-blue-500"
                              value={formData.bloodGroup || ''}
                              onChange={handleInputChange}
                            />
                          </div>
                          <div>
                            <label className="block text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Birth Date</label>
                            <input 
                              type="date" 
                              name="dateOfBirth"
                              className="saas-input w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs rounded-xl outline-none focus:border-blue-500"
                              value={formData.dateOfBirth || ''}
                              onChange={handleInputChange}
                            />
                          </div>
                          <div>
                            <label className="block text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Emergency Contact</label>
                            <input 
                              type="text" 
                              name="emergencyContact"
                              placeholder="Enter Emergency Contact Details"
                              className="saas-input w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs rounded-xl outline-none focus:border-blue-550"
                              value={formData.emergencyContact || ''}
                              onChange={handleInputChange}
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Residence Address</label>
                            <input 
                              type="text" 
                              name="address"
                              placeholder="Enter full residential address..."
                              className="saas-input w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs rounded-xl outline-none focus:border-blue-500"
                              value={formData.address || ''}
                              onChange={handleInputChange}
                            />
                          </div>
                        </div>
                      </div>

                      {/* CREDENTIALS & ROLE TAB */}
                      <div className={cn("space-y-4", formActiveTab !== 'security' && "hidden")}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                              Login Password
                              <span className="ml-1 text-[7px] text-amber-500 font-bold">(leave blank to keep current)</span>
                            </label>
                            <div className="relative">
                              <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                              <input 
                                type={showPassword ? "text" : "password"}
                                name="password"
                                autoComplete="new-password"
                                placeholder="Enter new password to change"
                                className="saas-input w-full !pl-[28px] !pr-[32px] py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-855 text-slate-900 dark:text-white text-xs rounded-xl outline-none focus:border-blue-500"
                                value={formData.password || ''}
                                onChange={handleInputChange}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-455 hover:text-slate-600 dark:hover:text-slate-200 transition-colors border-none bg-transparent cursor-pointer flex items-center justify-center"
                              >
                                {showPassword ? (
                                  <EyeOff className="w-4 h-4" />
                                ) : (
                                  <Eye className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">System Role</label>
                            <div className="grid grid-cols-2 gap-2">
                              {['Employee', 'HR'].map(r => (
                                <button
                                  key={r}
                                  type="button"
                                  onClick={() => handleInputChange({ target: { name: 'role', value: r } } as any)}
                                  className={cn(
                                    "py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all duration-205 active:scale-95 cursor-pointer",
                                    formData.role === r
                                      ? r === 'HR'
                                        ? "bg-violet-650 border-violet-500 text-white shadow-md shadow-violet-500/20"
                                        : "bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-500/20"
                                      : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
                                  )}
                                >
                                  {r === 'HR' ? '🧑‍💼 HR Manager' : '👤 Employee'}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* BANK & FINANCIALS TAB */}
                      <div className={cn("space-y-4", formActiveTab !== 'financial' && "hidden")}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Bank Name</label>
                            <input 
                              type="text" 
                              name="bankName"
                              placeholder="Enter Bank Name"
                              className="saas-input w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs rounded-xl outline-none focus:border-blue-550"
                              value={formData.bankName || ''}
                              onChange={handleInputChange}
                            />
                          </div>
                          <div>
                            <label className="block text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Account Number</label>
                            <input 
                              type="text" 
                              name="accountNumber"
                              placeholder="Enter Account Number"
                              className="saas-input w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs rounded-xl outline-none focus:border-blue-550"
                              value={formData.accountNumber || ''}
                              onChange={handleInputChange}
                            />
                          </div>
                          <div>
                            <label className="block text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">IFSC Code</label>
                            <input 
                              type="text" 
                              name="ifscCode"
                              placeholder="Enter IFSC Code"
                              className="saas-input w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs rounded-xl outline-none focus:border-blue-500"
                              value={formData.ifscCode || ''}
                              onChange={handleInputChange}
                            />
                          </div>
                          <div>
                            <label className="block text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">PAN Card Number</label>
                            <input 
                              type="text" 
                              name="panNumber"
                              placeholder="Enter PAN Card Number"
                              className="saas-input w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs rounded-xl outline-none focus:border-blue-550"
                              value={formData.panNumber || ''}
                              onChange={handleInputChange}
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-[8px] font-black text-slate-550 dark:text-slate-400 uppercase tracking-widest mb-1.5">UAN Number</label>
                            <input 
                              type="text" 
                              name="uanNumber"
                              placeholder="Enter UAN Number"
                              className="saas-input w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs rounded-xl outline-none focus:border-blue-500"
                              value={formData.uanNumber || ''}
                              onChange={handleInputChange}
                            />
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Footer Actions */}
                    <div className="flex gap-4 p-4.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                      <button 
                        type="submit"
                        className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer shadow-lg shadow-blue-500/25 transition-all border-none"
                      >
                        Update Settings
                      </button>
                      <button 
                        type="button" 
                        onClick={closeModal}
                        className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-colors cursor-pointer border border-slate-200 dark:border-slate-800"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>
        )}
      {showLifecycleForm && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 text-left shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-150 dark:border-slate-800">
              <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                Lifecycle Action: {lifecycleAction.toUpperCase()}
              </span>
              <button onClick={() => setShowLifecycleForm(false)} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              Please specify the reason for this lifecycle transition. This action will log in system audit logs and affect user login access.
            </p>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Reason Details</label>
              <textarea
                value={lifecycleReason}
                onChange={e => setLifecycleReason(e.target.value)}
                placeholder="Enter description or reason..."
                className="w-full p-3 bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:border-blue-500 text-slate-900 dark:text-white font-semibold h-24 resize-none"
              />
            </div>

            {lifecycleAction === 'progress-exit' && (
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Workflow Next Stage</label>
                <select
                  value={lifecycleStage}
                  onChange={e => setLifecycleStage(e.target.value)}
                  className="w-full p-2.5 bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none text-slate-900 dark:text-white font-semibold"
                >
                  <option value="">Select Stage...</option>
                  <option value="HR Review">HR Review</option>
                  <option value="Manager Approval">Manager Approval</option>
                  <option value="Exit Clearance">Exit Clearance</option>
                  <option value="Account Deactivated">Account Deactivated</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLifecycleForm(false)}
                className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-650 dark:text-slate-350 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={lifecycleSubmitting}
                onClick={handleLifecycleSubmit}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors shadow-lg shadow-blue-500/20 cursor-pointer disabled:opacity-50 text-center"
              >
                {lifecycleSubmitting ? 'Processing...' : 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}
        </motion.div>
      </div>
    </div>,
    document.body
  );
}
