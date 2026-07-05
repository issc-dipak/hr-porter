"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  FileText, CheckCircle2, XCircle, Clock, AlertTriangle, 
  TrendingUp, Plus, Search, Filter, Calendar, DollarSign, 
  Loader2, Download, Award, ShieldAlert, ArrowLeft,
  ChevronRight, RefreshCcw, UserMinus, Sparkles, Building, Briefcase, Mail
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";
import { PastelStatCard } from '@/components/ui/PastelStatCard';
import { usePermission } from '@/context/PermissionContext';

interface OffboardingPageProps {
  userRole: string; // 'Employee' | 'HR' | 'Admin' | 'Company Admin'
  profile: {
    email: string;
    name?: string;
    id?: string;
    dept?: string;
    role?: string;
    [key: string]: any;
  };
}

export default function OffboardingPage({ userRole, profile }: OffboardingPageProps) {
  const { can } = usePermission();
  const canViewAll = can('offboarding.view') || can('offboarding.approve_exit');
  const isEmployee = !canViewAll;
  const isAdmin = canViewAll && can('settings.company');
  const isHR = canViewAll && !can('settings.company');

  const [activeTab, setActiveTab] = useState<'my-resignation' | 'requests' | 'analytics'>(
    isEmployee ? 'my-resignation' : 'requests'
  );

  // Core offboarding state
  const [resignations, setResignations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Form Submission states
  const [reason, setReason] = useState('');
  const [category, setCategory] = useState<'Better Opportunity' | 'Higher Education' | 'Relocation' | 'Personal Reasons' | 'Health Reasons' | 'Career Change' | 'Retirement' | 'Family Reasons' | 'Other'>('Other');
  const [lastWorkingDay, setLastWorkingDay] = useState('');
  const [noticePeriod, setNoticePeriod] = useState(30);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [resignationLetterUrl, setResignationLetterUrl] = useState('');
  const [successorEmail, setSuccessorEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingLetter, setIsUploadingLetter] = useState(false);

  // Action states (Approve / Reject / Clarify)
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [transitionNotes, setTransitionNotes] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Exit Interview scheduling states
  const [scheduledAt, setScheduledAt] = useState('');
  const [feedback, setFeedback] = useState('');
  const [exitReason, setExitReason] = useState('');
  const [suggestions, setSuggestions] = useState('');
  const [rehireEligibility, setRehireEligibility] = useState(true);
  const [isSchedulingInterview, setIsSchedulingInterview] = useState(false);

  // F&F Settlement states
  const [pendingSalary, setPendingSalary] = useState(0);
  const [leaveEncashment, setLeaveEncashment] = useState(0);
  const [bonus, setBonus] = useState(0);
  const [incentives, setIncentives] = useState(0);
  const [expenseClaims, setExpenseClaims] = useState(0);
  const [reimbursements, setReimbursements] = useState(0);
  const [deductions, setDeductions] = useState(0);
  const [loans, setLoans] = useState(0);
  const [advanceRecovery, setAdvanceRecovery] = useState(0);
  const [isSavingSettlement, setIsSavingSettlement] = useState(false);

  // Analytics states
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // User search/filter list (for Admin rights transfer successor dropdown)
  const [usersList, setUsersList] = useState<any[]>([]);

  // Trigger Toast Helper
  const triggerToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch all Resignations
  const fetchResignations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('hr_system_token');
      const response = await fetch('/api/resignations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const res = await response.json();
      if (response.ok && res.data) {
        setResignations(res.data);
        // If we have a selected request, sync it
        if (selectedRequest) {
          const updated = res.data.find((r: any) => r._id === selectedRequest._id);
          if (updated) setSelectedRequest(updated);
        }
      } else {
        triggerToast(res.error || 'Failed to load offboarding list', 'error');
      }
    } catch (err: any) {
      console.error(err);
      triggerToast('Error loading offboarding records', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Attrition Analytics
  const fetchAnalytics = async () => {
    try {
      setLoadingAnalytics(true);
      const token = localStorage.getItem('hr_system_token');
      const response = await fetch('/api/resignations/analytics', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const res = await response.json();
      if (response.ok && res.data) {
        setAnalyticsData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  // Fetch Active users for Admin assignee dropdown
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('hr_system_token');
      const response = await fetch('/api/employees', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const res = await response.json();
      // Filter out current user
      if (response.ok && Array.isArray(res)) {
        setUsersList(res.filter((u: any) => u.email !== profile.email));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchResignations();
    if (!isEmployee) {
      fetchAnalytics();
      fetchUsers();
    }
  }, [userRole]);

  // Submit Resignation
  const handleSubmitResignation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || !lastWorkingDay) {
      triggerToast('Please complete all required fields', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('hr_system_token');
      const response = await fetch('/api/resignations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reason,
          category,
          lastWorkingDay,
          noticePeriodDays: noticePeriod,
          additionalNotes,
          resignationLetterUrl,
          assigneeEmail: successorEmail
        })
      });

      const res = await response.json();
      if (response.ok) {
        triggerToast('Resignation request submitted successfully!', 'success');
        // Reset form
        setReason('');
        setLastWorkingDay('');
        setAdditionalNotes('');
        setSuccessorEmail('');
        fetchResignations();
      } else {
        triggerToast(res.error || 'Failed to submit request', 'error');
      }
    } catch (err) {
      triggerToast('Network error during resignation submission', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResignationLetterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingLetter(true);
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('hr_system_token');
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      setResignationLetterUrl(result.url);
      triggerToast('Resignation letter uploaded successfully!', 'success');
    } catch (err: any) {
      console.error(err);
      triggerToast('Failed to upload resignation letter', 'error');
    } finally {
      setIsUploadingLetter(false);
    }
  };

  // Process Approval / Rejection
  const handleProcessRequest = async (action: 'Approved' | 'Rejected' | 'Archived', notes?: string) => {
    if (!selectedRequest) return;

    try {
      setIsActionLoading(true);
      const token = localStorage.getItem('hr_system_token');
      const response = await fetch(`/api/resignations/${selectedRequest._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: action,
          transitionNotes: notes || `Request ${action.toLowerCase()} by HR/Admin`
        })
      });

      const res = await response.json();
      if (response.ok && res.data) {
        triggerToast(`Resignation request has been ${action.toLowerCase()}`, 'success');
        setSelectedRequest(res.data.resignation);
        fetchResignations();
        fetchAnalytics();
        setShowRejectModal(false);
        setTransitionNotes('');
      } else {
        triggerToast(res.error || 'Action failed', 'error');
      }
    } catch (err) {
      triggerToast('Network error during status transition', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Toggle Clearance Checklist item
  const handleToggleChecklist = async (key: string, value: boolean) => {
    if (!selectedRequest) return;

    try {
      const token = localStorage.getItem('hr_system_token');
      const response = await fetch(`/api/resignations/${selectedRequest._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          exitChecklist: {
            [key]: value
          }
        })
      });

      const res = await response.json();
      if (response.ok && res.data) {
        triggerToast('Clearance checklist item updated', 'success');
        setSelectedRequest(res.data.resignation);
        fetchResignations();
      } else {
        triggerToast(res.error || 'Checklist update failed', 'error');
      }
    } catch (err) {
      triggerToast('Failed to update checklist item', 'error');
    }
  };

  // Save Exit Interview
  const handleSaveInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    try {
      setIsSchedulingInterview(true);
      const token = localStorage.getItem('hr_system_token');
      const response = await fetch(`/api/resignations/${selectedRequest._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          exitInterviewDetails: {
            scheduledAt: scheduledAt || new Date().toISOString(),
            feedback,
            exitReason,
            suggestions,
            rehireEligibility,
            sendScheduleEmail: true
          }
        })
      });

      const res = await response.json();
      if (response.ok && res.data) {
        triggerToast('Exit Interview details updated and synced', 'success');
        setSelectedRequest(res.data.resignation);
        fetchResignations();
      } else {
        triggerToast(res.error || 'Failed to save exit interview', 'error');
      }
    } catch (err) {
      triggerToast('Failed to save interview details', 'error');
    } finally {
      setIsSchedulingInterview(false);
    }
  };

  // Calculate & Save Full & Final Settlement
  const handleSaveSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    try {
      setIsSavingSettlement(true);
      const token = localStorage.getItem('hr_system_token');
      const response = await fetch(`/api/resignations/${selectedRequest._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          settlementDetails: {
            pendingSalary,
            leaveEncashment,
            bonus,
            incentives,
            expenseClaims,
            reimbursements,
            deductions,
            loans,
            advanceRecovery,
            status: 'Completed' // Mark complete
          }
        })
      });

      const res = await response.json();
      if (response.ok && res.data) {
        triggerToast('F&F Settlement finalized successfully!', 'success');
        setSelectedRequest(res.data.resignation);
        fetchResignations();
      } else {
        triggerToast(res.error || 'Finalizing settlement failed', 'error');
      }
    } catch (err) {
      triggerToast('Failed to finalize settlement', 'error');
    } finally {
      setIsSavingSettlement(false);
    }
  };

  // Archive Employee manually (Admin Approval confirmation)
  const handleArchiveEmployee = async () => {
    if (!selectedRequest) return;
    handleProcessRequest('Archived', 'Offboarding processes completed. Profile moved to corporate archives.');
  };

  // Letter triggers
  const handleGenerateCertificate = async (type: 'experience' | 'relieving') => {
    if (!selectedRequest) return;
    try {
      const token = localStorage.getItem('hr_system_token');
      const response = await fetch(`/api/resignations/${selectedRequest._id}/${type}-letter`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const res = await response.json();
      if (response.ok) {
        triggerToast(`${type === 'experience' ? 'Experience' : 'Relieving'} certificate generated successfully!`, 'success');
        // Open PDF page in print preview
        window.open(`/api/resignations/${selectedRequest._id}/${type}-letter`, '_blank');
      } else {
        triggerToast(res.error || 'Failed to generate certificate', 'error');
      }
    } catch (err) {
      triggerToast('Error generating certificate', 'error');
    }
  };

  // My Resignation (Employee data)
  const myResignation = useMemo(() => {
    return resignations.find(r => r.employeeEmail === profile.email.toLowerCase());
  }, [resignations, profile.email]);

  // Notice tracker calculations
  const noticeDetails = useMemo(() => {
    if (!myResignation || !myResignation.noticeStartDate) return null;
    const start = new Date(myResignation.noticeStartDate).getTime();
    const end = new Date(myResignation.lastWorkingDay).getTime();
    const now = Date.now();

    const totalDays = Math.round((end - start) / (24 * 60 * 60 * 1000)) || 1;
    const remainingDays = Math.max(0, Math.round((end - now) / (24 * 60 * 60 * 1000)));
    const elapsedDays = Math.max(0, totalDays - remainingDays);
    const percentage = Math.min(100, Math.round((elapsedDays / totalDays) * 100));

    return { totalDays, remainingDays, percentage };
  }, [myResignation]);

  // Checklist completion calculation
  const checklistCompletion = useMemo(() => {
    const active = selectedRequest || myResignation;
    if (!active || !active.exitChecklist) return 0;
    const items = [
      active.exitChecklist.laptopReturned,
      active.exitChecklist.idCardReturned,
      active.exitChecklist.companyAssetsReturned,
      active.exitChecklist.accessRevoked,
      active.exitChecklist.knowledgeTransferCompleted,
      active.exitChecklist.documentsSubmitted,
      active.exitChecklist.payrollClearance || active.exitChecklist.payrollClosed,
      active.exitChecklist.financeClearance || active.exitChecklist.settlementCompleted
    ];
    const completed = items.filter(Boolean).length;
    return Math.round((completed / 8) * 100);
  }, [selectedRequest, myResignation]);

  // Compute live Gross / Net settlement on form changes
  const netSettlementVal = useMemo(() => {
    const additions = pendingSalary + leaveEncashment + bonus + incentives + expenseClaims + reimbursements;
    const subs = deductions + loans + advanceRecovery;
    return additions - subs;
  }, [pendingSalary, leaveEncashment, bonus, incentives, expenseClaims, reimbursements, deductions, loans, advanceRecovery]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-100 min-h-full">
      {/* Toast Notifications */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={cn(
              "fixed top-6 left-1/2 -translate-x-1/2 z-[9999] px-6 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 border text-sm font-semibold backdrop-blur-md",
              toast.type === 'success' ? "bg-emerald-950/90 border-emerald-500/20 text-emerald-300" :
              toast.type === 'error' ? "bg-rose-950/90 border-rose-500/20 text-rose-300" :
              "bg-slate-900/90 border-slate-800 text-slate-300"
            )}
          >
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <XCircle className="w-5 h-5 text-rose-400" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-blue-500 font-bold uppercase tracking-widest text-xs">
            <UserMinus className="w-4 h-4" />
            Corporate Lifecycle Management
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white mt-1">Resignation & Offboarding</h1>
          <p className="text-slate-400 text-xs mt-1">Secure separation workflows, settlement processing, and corporate analytics.</p>
        </div>

        {/* Tab Controls */}
        <div className="flex gap-2 bg-slate-900 border border-slate-800 p-1 rounded-2xl">
          {isEmployee && (
            <button
              onClick={() => setActiveTab('my-resignation')}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                activeTab === 'my-resignation' ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "text-slate-400 hover:text-white"
              )}
            >
              My Resignation
            </button>
          )}

          {!isEmployee && (
            <>
              <button
                onClick={() => { setActiveTab('requests'); setSelectedRequest(null); }}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                  activeTab === 'requests' ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "text-slate-400 hover:text-white"
                )}
              >
                Offboarding Board
              </button>
              <button
                onClick={() => { setActiveTab('analytics'); fetchAnalytics(); }}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                  activeTab === 'analytics' ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "text-slate-400 hover:text-white"
                )}
              >
                Attrition Analytics
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Tab Rendering */}
      <div className="min-h-[500px]">
        {/* TAB 1: EMPLOYEE MY RESIGNATION */}
        {activeTab === 'my-resignation' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Resignation Status Panel */}
            <div className="lg:col-span-2 space-y-6">
              {myResignation ? (
                <>
                  {/* Status & Timeline Card */}
                  <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-lg font-black text-white">Your Separation Profile</h2>
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                        myResignation.status === 'Submitted' ? "bg-blue-950/40 border-blue-500/30 text-blue-400" :
                        myResignation.status === 'Notice Period' ? "bg-amber-950/40 border-amber-500/30 text-amber-400" :
                        myResignation.status === 'Completed' ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-400" :
                        "bg-slate-950/60 border-slate-800 text-slate-400"
                      )}>
                        {myResignation.status}
                      </span>
                    </div>

                    {/* Timeline view */}
                    <div className="relative flex justify-between items-center max-w-xl mx-auto py-6">
                      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-800 z-0" />
                      
                      {['Submitted', 'Notice Period', 'Clearance Pending', 'Completed'].map((step, idx) => {
                        const stepOrder = ['Draft', 'Submitted', 'HR Review', 'Admin Review', 'Approved', 'Notice Period', 'Clearance Pending', 'Settlement Pending', 'Completed', 'Archived'];
                        const currentIdx = stepOrder.indexOf(myResignation.status);
                        const stepIdx = stepOrder.indexOf(step);
                        const isDone = currentIdx >= stepIdx;

                        return (
                          <div key={step} className="flex flex-col items-center relative z-10">
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center border font-bold text-xs transition-colors",
                              isDone ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20" : "bg-slate-950 border-slate-800 text-slate-500"
                            )}>
                              {isDone ? '✓' : idx + 1}
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-2 whitespace-nowrap">
                              {step === 'Clearance Pending' ? 'Clearance' : step}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-slate-800/80 pt-6 mt-6">
                      <div>
                        <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Notice Started</p>
                        <p className="text-white text-sm font-bold mt-0.5">
                          {myResignation.noticeStartDate ? new Date(myResignation.noticeStartDate).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Last Working Day</p>
                        <p className="text-white text-sm font-bold mt-0.5">
                          {new Date(myResignation.lastWorkingDay).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Notice Duration</p>
                        <p className="text-white text-sm font-bold mt-0.5">{myResignation.noticePeriodDays} Days</p>
                      </div>
                      {noticeDetails && (
                        <div>
                          <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Remaining Days</p>
                          <p className="text-amber-400 text-sm font-black mt-0.5">{noticeDetails.remainingDays} Days</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Visual Progress Bars */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Notice Countdown bar */}
                    {noticeDetails && (
                      <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6">
                        <h3 className="text-sm font-black text-white mb-1 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-blue-500" />
                          Notice Timeline Progress
                        </h3>
                        <p className="text-slate-400 text-xs mb-4">Percentage of notice period completed.</p>
                        
                        <div className="relative h-3 bg-slate-950 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${noticeDetails.percentage}%` }}
                            transition={{ duration: 1 }}
                            className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-blue-600 to-indigo-500"
                          />
                        </div>
                        <div className="flex justify-between items-center mt-2 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                          <span>0%</span>
                          <span>{noticeDetails.percentage}% Completed</span>
                          <span>100%</span>
                        </div>
                      </div>
                    )}

                    {/* Clearance checklist progress bar */}
                    <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6">
                      <h3 className="text-sm font-black text-white mb-1 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        Exit Clearance Completion
                      </h3>
                      <p className="text-slate-400 text-xs mb-4">Required administrative clearances completed.</p>
                      
                      <div className="relative h-3 bg-slate-950 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${checklistCompletion}%` }}
                          transition={{ duration: 1 }}
                          className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-emerald-600 to-teal-500"
                        />
                      </div>
                      <div className="flex justify-between items-center mt-2 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                        <span>0%</span>
                        <span>{checklistCompletion}% Clear</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </div>

                  {/* Documents Letter Generation Section */}
                  {(myResignation.status === 'Completed' || myResignation.status === 'Archived') && (
                    <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6">
                      <h3 className="text-sm font-black text-white mb-1 flex items-center gap-2">
                        <Award className="w-4.5 h-4.5 text-yellow-500 animate-pulse" />
                        Exit Certificates Ready
                      </h3>
                      <p className="text-slate-400 text-xs mb-5">Your offboarding is fully archived. You can print or download your service certificates.</p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <a 
                          href={`/api/resignations/${myResignation._id}/experience-letter?token=${localStorage.getItem('hr_system_token')}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-2xl transition-all group cursor-pointer"
                        >
                          <div>
                            <p className="text-white text-xs font-bold">Experience Certificate</p>
                            <p className="text-[10px] text-slate-400 mt-1">Branded Service Verification Letter</p>
                          </div>
                          <Download className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                        </a>

                        <a 
                          href={`/api/resignations/${myResignation._id}/relieving-letter?token=${localStorage.getItem('hr_system_token')}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-2xl transition-all group cursor-pointer"
                        >
                          <div>
                            <p className="text-white text-xs font-bold">Relieving & Exit Letter</p>
                            <p className="text-[10px] text-slate-400 mt-1">Exit confirmation and signoff summary</p>
                          </div>
                          <Download className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                        </a>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* Resignation Submission Form */
                <form onSubmit={handleSubmitResignation} className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 space-y-5">
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-500" />
                    Submit Resignation Request
                  </h2>
                  <p className="text-xs text-slate-400">Initiate your transition process. Your request will go to HR and Admin for review.</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Reason Category *</label>
                      <select
                        value={category}
                        onChange={(e: any) => setCategory(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-slate-700 text-xs rounded-xl p-3 focus:outline-none transition-colors"
                      >
                        <option value="Better Opportunity">Better Opportunity</option>
                        <option value="Higher Education">Higher Education</option>
                        <option value="Relocation">Relocation</option>
                        <option value="Personal Reasons">Personal Reasons</option>
                        <option value="Health Reasons">Health Reasons</option>
                        <option value="Career Change">Career Change</option>
                        <option value="Retirement">Retirement</option>
                        <option value="Family Reasons">Family Reasons</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Requested Last Working Day *</label>
                      <input
                        type="date"
                        required
                        value={lastWorkingDay}
                        onChange={(e) => setLastWorkingDay(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-slate-700 text-xs rounded-xl p-2.5 focus:outline-none text-white transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Notice Period Days</label>
                      <input
                        type="number"
                        min="0"
                        value={noticePeriod}
                        onChange={(e) => setNoticePeriod(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-slate-700 text-xs rounded-xl p-2.5 focus:outline-none text-white transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Resignation Letter (PDF / Image)</label>
                      <div className="relative">
                        {resignationLetterUrl ? (
                          <div className="flex items-center justify-between p-3 bg-slate-950/85 border border-slate-800/80 hover:border-slate-750/80 rounded-xl transition-all">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-white text-xs font-bold truncate">
                                  {resignationLetterUrl.split('/').pop() || 'Resignation_Letter'}
                                </p>
                                <a
                                  href={resignationLetterUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[10px] text-blue-400 hover:text-blue-300 font-bold tracking-wide uppercase mt-0.5 inline-block hover:underline"
                                >
                                  View Uploaded File
                                </a>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setResignationLetterUrl('')}
                              className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => document.getElementById('resignation-letter-input')?.click()}
                            className={cn(
                              "flex items-center justify-between p-2.5 bg-slate-950 border border-slate-800 hover:border-slate-700/80 rounded-xl cursor-pointer transition-all h-[42px]",
                              isUploadingLetter ? "opacity-50 pointer-events-none" : ""
                            )}
                          >
                            <input
                              type="file"
                              id="resignation-letter-input"
                              accept=".pdf,image/*,.doc,.docx"
                              onChange={handleResignationLetterUpload}
                              className="hidden"
                            />
                            {isUploadingLetter ? (
                              <div className="flex items-center gap-2 text-xs text-slate-400 font-bold">
                                <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                                <span>Uploading...</span>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center gap-2 min-w-0">
                                  <Plus className="w-4 h-4 text-slate-400" />
                                  <span className="text-slate-400 text-xs font-medium truncate">Upload Resignation Letter</span>
                                </div>
                                <span className="text-[9px] bg-slate-900 text-slate-400 px-2 py-1 rounded-lg border border-slate-800 font-black uppercase tracking-wider">
                                  PDF/IMG
                                </span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Successor Admin Assignee Section (Visible only if current user is Admin) */}
                  {isAdmin && (
                    <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-3">
                      <div className="flex gap-2 items-center text-xs font-black text-amber-500 uppercase tracking-wider">
                        <ShieldAlert className="w-4.5 h-4.5" />
                        Ownership Succession Requirement
                      </div>
                      <p className="text-[10px] text-slate-400">As an Admin, if you are the last active administrator, you are required to designate a successor Admin user and transfer system credentials before submitting resignation approval actions.</p>
                      
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Select Successor Admin</label>
                        <select
                          value={successorEmail}
                          onChange={(e) => setSuccessorEmail(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 focus:border-slate-700 text-xs rounded-xl p-2.5 focus:outline-none text-white transition-colors"
                        >
                          <option value="">-- Choose employee to promote to Admin --</option>
                          {usersList.map((u: any) => (
                            <option key={u._id} value={u.email}>{u.fullName || u.name} ({u.email})</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Primary Reason for Separation *</label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Please details the key reasons for resigning..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-slate-700 text-xs rounded-xl p-3 focus:outline-none text-white transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Additional Notes / Comments</label>
                    <textarea
                      rows={2}
                      placeholder="Optional remarks..."
                      value={additionalNotes}
                      onChange={(e) => setAdditionalNotes(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-slate-700 text-xs rounded-xl p-3 focus:outline-none text-white transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-xs font-black uppercase tracking-widest py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    Submit Resignation Request
                  </button>
                </form>
              )}
            </div>

            {/* Checklist items sidebar (only visible if resignation is submitted) */}
            <div className="space-y-6">
              {myResignation && (
                <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 space-y-4">
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <Building className="w-4 h-4 text-blue-500" />
                    Offboarding Clearance Checklist
                  </h3>
                  <p className="text-slate-400 text-xs">Verify returned corporate assets and access points.</p>

                  <div className="space-y-3">
                    {[
                      { label: 'Laptop Returned', val: myResignation.exitChecklist.laptopReturned },
                      { label: 'ID Card Returned', val: myResignation.exitChecklist.idCardReturned },
                      { label: 'Company Assets Returned', val: myResignation.exitChecklist.companyAssetsReturned },
                      { label: 'System Access Revoked', val: myResignation.exitChecklist.accessRevoked },
                      { label: 'Knowledge Transfer Done', val: myResignation.exitChecklist.knowledgeTransferCompleted },
                      { label: 'Documents Submitted', val: myResignation.exitChecklist.documentsSubmitted },
                      { label: 'Payroll Clearance Approved', val: myResignation.exitChecklist.payrollClearance || myResignation.exitChecklist.payrollClosed },
                      { label: 'Finance Settlement Settled', val: myResignation.exitChecklist.financeClearance || myResignation.exitChecklist.settlementCompleted }
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-slate-950/60 border border-slate-850 rounded-xl">
                        <div className={cn(
                          "w-4.5 h-4.5 rounded-full flex items-center justify-center border",
                          item.val ? "bg-emerald-500 border-emerald-400 text-slate-950 font-black text-xs" : "border-slate-800"
                        )}>
                          {item.val && '✓'}
                        </div>
                        <span className={cn("text-xs", item.val ? "text-white font-medium" : "text-slate-400")}>
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}


            </div>
          </div>
        )}

        {/* TAB 2: HR/ADMIN OFFBOARDING BOARD */}
        {activeTab === 'requests' && !isEmployee && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* List Panel */}
            <div className={cn("space-y-4", selectedRequest ? "lg:col-span-1" : "lg:col-span-3")}>
              <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Filter className="w-4 h-4" />
                  Listings ({resignations.length})
                </div>
                <button 
                  onClick={fetchResignations}
                  className="p-2 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                >
                  <RefreshCcw className="w-4 h-4" />
                </button>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center p-20 space-y-3 bg-slate-900 border border-slate-800/80 rounded-3xl">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                  <p className="text-slate-400 text-xs">Loading records...</p>
                </div>
              ) : resignations.length === 0 ? (
                <div className="text-center p-20 bg-slate-900 border border-slate-800/80 rounded-3xl space-y-2">
                  <UserMinus className="w-10 h-10 text-slate-600 mx-auto" />
                  <h3 className="text-sm font-bold text-white">No Offboarding Records</h3>
                  <p className="text-[10px] text-slate-400">All resignation and clearance queues are currently empty.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[700px] overflow-y-auto no-scrollbar pr-1">
                  {resignations.map((r: any) => (
                    <div
                      key={r._id}
                      onClick={() => {
                        setSelectedRequest(r);
                        // Pre-populate settlement values
                        setPendingSalary(r.fullAndFinalSettlementAmount || 0);
                      }}
                      className={cn(
                        "p-4 bg-slate-900 border hover:border-slate-700 rounded-2xl transition-all cursor-pointer flex flex-col md:flex-row justify-between items-start md:items-center gap-3 relative overflow-hidden group",
                        selectedRequest?._id === r._id ? "border-blue-500" : "border-slate-800/80"
                      )}
                    >
                      <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 pointer-events-none transition-colors" />

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-black text-white">{r.employeeName}</h4>
                          <span className="text-[9px] text-slate-500 font-bold truncate max-w-[120px]">({r.employeeEmail})</span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate max-w-[300px]">Reason: {r.reason}</p>
                        <div className="flex gap-4 text-[9px] text-slate-500">
                          <span>LWD: {new Date(r.lastWorkingDay).toLocaleDateString()}</span>
                          <span>Notice: {r.noticePeriodDays} Days</span>
                        </div>
                      </div>

                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border",
                        r.status === 'Submitted' ? "bg-blue-950/40 border-blue-500/30 text-blue-400" :
                        r.status === 'Notice Period' ? "bg-amber-950/40 border-amber-500/30 text-amber-400" :
                        r.status === 'Completed' ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-400" :
                        "bg-slate-950/60 border-slate-800 text-slate-400"
                      )}>
                        {r.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Request Details Detail Panel */}
            {selectedRequest ? (
              <>
                <div className="lg:col-span-2 space-y-6">
                {/* Details Card */}
                <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 relative overflow-hidden space-y-5">
                  {/* Detail Header */}
                  <div className="flex justify-between items-start gap-4 pb-4 border-b border-slate-800/80">
                    <div className="space-y-1">
                      <button 
                        onClick={() => setSelectedRequest(null)}
                        className="lg:hidden text-xs text-blue-500 font-bold flex items-center gap-1 mb-2 hover:underline"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" /> Back to board
                      </button>
                      <h3 className="text-base font-black text-white">{selectedRequest.employeeName}</h3>
                      <p className="text-slate-400 text-xs flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-slate-500" />
                        {selectedRequest.employeeEmail}
                      </p>
                    </div>

                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                      selectedRequest.status === 'Submitted' ? "bg-blue-950/40 border-blue-500/30 text-blue-400" :
                      selectedRequest.status === 'Notice Period' ? "bg-amber-950/40 border-amber-500/30 text-amber-400" :
                      selectedRequest.status === 'Completed' ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-400" :
                      "bg-slate-950/60 border-slate-800 text-slate-400"
                    )}>
                      {selectedRequest.status}
                    </span>
                  </div>

                  {/* Submission Form Data Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div>
                      <p className="text-slate-400 text-[9px] uppercase font-bold tracking-wider">LWD Requested</p>
                      <p className="text-white font-bold mt-1">{new Date(selectedRequest.lastWorkingDay).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-[9px] uppercase font-bold tracking-wider">Notice Days</p>
                      <p className="text-white font-bold mt-1">{selectedRequest.noticePeriodDays} Days</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-[9px] uppercase font-bold tracking-wider">Reason Category</p>
                      <p className="text-white font-bold mt-1">{selectedRequest.category || 'Other'}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-[9px] uppercase font-bold tracking-wider">Letter Upload</p>
                      {selectedRequest.resignationLetterUrl ? (
                        <a 
                          href={selectedRequest.resignationLetterUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-blue-500 font-bold hover:underline flex items-center gap-1 mt-1"
                        >
                          View Attachment
                        </a>
                      ) : <p className="text-slate-500 mt-1">No file uploaded</p>}
                    </div>
                  </div>

                  <div className="bg-slate-950 p-4 border border-slate-800 rounded-2xl text-xs space-y-2">
                    <p className="text-slate-400 uppercase font-black text-[9px] tracking-wider">Statement of Reason</p>
                    <p className="text-slate-200 leading-relaxed italic">"{selectedRequest.reason}"</p>
                    {selectedRequest.additionalNotes && (
                      <p className="text-slate-400 text-[10px] mt-2 pt-2 border-t border-slate-850">
                        Notes: {selectedRequest.additionalNotes}
                      </p>
                    )}
                  </div>

                  {/* Action Gates: Approve / Reject / Clarify */}
                  {(selectedRequest.status === 'Submitted' || selectedRequest.status === 'Admin Review') && (
                    <div className="flex gap-3 bg-slate-950 p-4 border border-slate-850 rounded-2xl">
                      {selectedRequest.employeeEmail === profile.email.toLowerCase() ? (
                        <div className="flex gap-2 items-center text-xs font-bold text-rose-400">
                          <ShieldAlert className="w-5 h-5" />
                          You cannot review or approve your own resignation.
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => handleProcessRequest('Approved', 'Resignation request approved.')}
                            disabled={isActionLoading}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                          >
                            Approve Resignation
                          </button>
                          <button
                            onClick={() => setShowRejectModal(true)}
                            disabled={isActionLoading}
                            className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                          >
                            Reject Request
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {/* Clearance Checklist Management (HR/Admin) */}
                  {selectedRequest.status !== 'Submitted' && selectedRequest.status !== 'Rejected' && (
                    <div className="space-y-4 pt-4 border-t border-slate-800/80">
                      <h3 className="text-sm font-black text-white">Exit Clearance Checkbox Checklist</h3>
                      <p className="text-slate-400 text-xs">Verify returned corporate assets and access points. Admin clearance items require administrator authentication role.</p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        {[
                          { label: 'Laptop Returned', key: 'laptopReturned', val: selectedRequest.exitChecklist.laptopReturned, adminOnly: false },
                          { label: 'ID Card Returned', key: 'idCardReturned', val: selectedRequest.exitChecklist.idCardReturned, adminOnly: false },
                          { label: 'Company Assets Returned', key: 'companyAssetsReturned', val: selectedRequest.exitChecklist.companyAssetsReturned, adminOnly: false },
                          { label: 'System Access Revoked', key: 'accessRevoked', val: selectedRequest.exitChecklist.accessRevoked, adminOnly: false },
                          { label: 'Knowledge Transfer Completed', key: 'knowledgeTransferCompleted', val: selectedRequest.exitChecklist.knowledgeTransferCompleted, adminOnly: false },
                          { label: 'Documents Submitted', key: 'documentsSubmitted', val: selectedRequest.exitChecklist.documentsSubmitted, adminOnly: false },
                          { label: 'Payroll Clearance Approved (Admin Only)', key: 'payrollClearance', val: selectedRequest.exitChecklist.payrollClearance || selectedRequest.exitChecklist.payrollClosed, adminOnly: true },
                          { label: 'Finance Settlement Approved (Admin Only)', key: 'financeClearance', val: selectedRequest.exitChecklist.financeClearance || selectedRequest.exitChecklist.settlementCompleted, adminOnly: true }
                        ].map((item, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleToggleChecklist(item.key, !item.val)}
                            disabled={item.adminOnly && profile.role !== 'Admin'}
                            className={cn(
                              "flex items-center justify-between p-3.5 bg-slate-950/40 border rounded-xl transition-all text-left",
                              item.val ? "border-emerald-500/30 text-white font-medium" : "border-slate-800 text-slate-400 hover:border-slate-700",
                              (item.adminOnly && profile.role !== 'Admin') ? "opacity-50 cursor-not-allowed" : "cursor-pointer active:scale-[0.98]"
                            )}
                          >
                            <span className="font-semibold">{item.label}</span>
                            <div className={cn(
                              "w-5 h-5 rounded-full flex items-center justify-center border transition-all",
                              item.val ? "bg-emerald-500 border-emerald-400 text-slate-950 font-black" : "border-slate-700"
                            )}>
                              {item.val && '✓'}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* SVG Visual Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Monthly attrition rate line/bar chart */}
                  <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6">
                    <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-500" />
                      Monthly Resignation Counts (Current Year)
                    </h3>

                    {/* SVG Chart */}
                    <div className="h-60 w-full flex items-end justify-between gap-2 pt-4">
                      {analyticsData.monthlyResignations && analyticsData.monthlyResignations.map((item: any, idx: number) => {
                        const maxVal = Math.max(...analyticsData.monthlyResignations.map((d: any) => d.count), 1);
                        const percentHeight = Math.max(10, Math.round((item.count / maxVal) * 100));
                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                            <div className="text-[9px] text-slate-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950 px-1 py-0.5 rounded border border-slate-800">
                              {item.count}
                            </div>
                            <div 
                              style={{ height: `${percentHeight}%` }}
                              className="w-full bg-gradient-to-t from-blue-600/40 to-blue-500 hover:to-blue-400 rounded-lg transition-all"
                            />
                            <span className="text-[9px] font-bold text-slate-400">{item.month}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Top reasons for attrition */}
                  <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6">
                    <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                      Attrition exit reason breakdown
                    </h3>

                    <div className="space-y-4 pt-2">
                      {analyticsData.topExitReasons && analyticsData.topExitReasons.length > 0 ? (
                        analyticsData.topExitReasons.map((item: any, idx: number) => {
                          const total = analyticsData.topExitReasons.reduce((acc: number, curr: any) => acc + curr.value, 0);
                          const percentage = Math.round((item.value / total) * 100) || 0;
                          return (
                            <div key={idx} className="space-y-1.5">
                              <div className="flex justify-between items-center text-xs font-medium text-slate-300">
                                <span>{item.name}</span>
                                <span className="font-bold text-slate-400">{item.value} ({percentage}%)</span>
                              </div>
                              <div className="h-2 bg-slate-950 rounded-full overflow-hidden">
                                <div 
                                  style={{ width: `${percentage}%` }}
                                  className="h-full bg-gradient-to-r from-emerald-600 to-emerald-500"
                                />
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-slate-500 text-xs text-center py-10">No exit reason logs available.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Department Attrition */}
                  <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6">
                    <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-purple-500" />
                      Department Attrition Counts
                    </h3>

                    <div className="space-y-4 pt-2">
                      {analyticsData.departmentAttrition && analyticsData.departmentAttrition.length > 0 ? (
                        analyticsData.departmentAttrition.map((item: any, idx: number) => {
                          const total = analyticsData.departmentAttrition.reduce((acc: number, curr: any) => acc + curr.value, 0);
                          const percentage = Math.round((item.value / total) * 100) || 0;
                          return (
                            <div key={idx} className="space-y-1.5">
                              <div className="flex justify-between items-center text-xs font-medium text-slate-300">
                                <span>{item.name}</span>
                                <span className="font-bold text-slate-400">{item.value} ({percentage}%)</span>
                              </div>
                              <div className="h-2 bg-slate-950 rounded-full overflow-hidden">
                                <div 
                                  style={{ width: `${percentage}%` }}
                                  className="h-full bg-gradient-to-r from-purple-600 to-purple-500"
                                />
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-slate-500 text-xs text-center py-10">No department logs available.</p>
                      )}
                    </div>
                  </div>

                  {/* Role Wise Attrition */}
                  <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6">
                    <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-yellow-500" />
                      Role-Wise Attrition breakdown
                    </h3>

                    <div className="space-y-4 pt-2">
                      {analyticsData.roleWiseAttrition && analyticsData.roleWiseAttrition.length > 0 ? (
                        analyticsData.roleWiseAttrition.map((item: any, idx: number) => {
                          const total = analyticsData.roleWiseAttrition.reduce((acc: number, curr: any) => acc + curr.value, 0);
                          const percentage = Math.round((item.value / total) * 100) || 0;
                          return (
                            <div key={idx} className="space-y-1.5">
                              <div className="flex justify-between items-center text-xs font-medium text-slate-300">
                                <span>{item.name}</span>
                                <span className="font-bold text-slate-400">{item.value} ({percentage}%)</span>
                              </div>
                              <div className="h-2 bg-slate-950 rounded-full overflow-hidden">
                                <div 
                                  style={{ width: `${percentage}%` }}
                                  className="h-full bg-gradient-to-r from-yellow-600 to-yellow-500"
                                />
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-slate-500 text-xs text-center py-10">No role logs available.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
            ) : (
              <div className="text-center p-20 bg-slate-900 border border-slate-850 rounded-3xl">
                <p className="text-slate-400 text-xs">Analytics aggregation failed.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reject Modal dialog window */}
      <AnimatePresence>
        {showRejectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md space-y-4"
            >
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
                Reject Resignation Request
              </h3>
              <p className="text-xs text-slate-400">Please provide a reason or constructive feedback explaining the rejection decision. This comment will be emailed to the employee.</p>
              
              <textarea
                rows={3}
                required
                placeholder="Reason for rejection..."
                value={transitionNotes}
                onChange={(e) => setTransitionNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-slate-700 text-xs rounded-xl p-3 focus:outline-none text-white transition-colors"
              />

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="bg-slate-950 border border-slate-800 text-slate-400 hover:text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleProcessRequest('Rejected', transitionNotes)}
                  disabled={isActionLoading || !transitionNotes}
                  className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  Reject & Email Employee
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
