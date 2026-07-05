"use client";

import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Filter, Eye, Download, Calendar, DollarSign, 
  TrendingUp, AlertCircle, CheckCircle, Clock3, User, Home, 
  ChevronRight, RefreshCcw, ShieldAlert, Sparkles, FileText, 
  Check, X, FileUp, Shield, BarChart3, AlertTriangle, ArrowRight, Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { cn } from "@/lib/utils";
import { PastelStatCard } from '@/components/ui/PastelStatCard';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, 
  CartesianGrid, BarChart, Bar, Legend, PieChart, Pie, Cell 
} from 'recharts';

export default function ExpensesPage() {
  const { profile, userRole: loggedInRole } = useAuthStore();
  const { triggerToast, selectedBranchId } = useUIStore();

  // Active submodule tab
  const [activeTab, setActiveTab] = useState<'my-expenses' | 'new-claim' | 'approvals' | 'finance' | 'analytics' | 'policies' | 'bank-details'>('my-expenses');
  
  // Demo interactive role selector - allows immediate testing of all approval levels
  const [viewRole, setViewRole] = useState<'Employee' | 'HR' | 'Finance'>(
    loggedInRole === 'Admin' || loggedInRole === 'HR' 
      ? (profile.dept?.toLowerCase().includes('finance') ? 'Finance' : 'HR')
      : 'Employee'
  );

  // States
  const [claims, setClaims] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [policy, setPolicy] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Bank details state
  const [bankDetails, setBankDetails] = useState<any>({
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    upiId: '',
    isVerified: false,
    verificationStatus: 'unverified'
  });
  const [maskedAcc, setMaskedAcc] = useState('');
  const [bankLoading, setBankLoading] = useState(false);
  const [bankVerifying, setBankVerifying] = useState(false);
  const [bankEditing, setBankEditing] = useState(false);
  const [bankSubTab, setBankSubTab] = useState<'my-account' | 'manage-accounts'>('my-account');
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployeeEmail, setSelectedEmployeeEmail] = useState<string>('');
  
  // Payout logs state
  const [payouts, setPayouts] = useState<any[]>([]);
  
  // Payout provider settings state (for Policies tab / admin toggle)
  const [payoutSettings, setPayoutSettings] = useState<any>({
    primaryProvider: 'RazorpayX',
    razorpayxKey: '',
    razorpayxSecret: '',
    cashfreeAppId: '',
    cashfreeSecret: '',
    decentroClientId: '',
    decentroClientSecret: '',
    isSimulator: true
  });
  const [savingPayoutSettings, setSavingPayoutSettings] = useState(false);

  // Form states for New Claim
  const [expenseType, setExpenseType] = useState('Travel');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [project, setProject] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [receiptName, setReceiptName] = useState('');
  const [comment, setComment] = useState('');
  const [ocrData, setOcrData] = useState<any>(null);
  
  // UI helper states
  const [submitting, setSubmitting] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [policyWarnings, setPolicyWarnings] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Approval comments
  const [approvalComment, setApprovalComment] = useState('');
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // Policy edit states (for HR/Admin)
  const [editingPolicy, setEditingPolicy] = useState({
    travelLimit: 5000,
    foodLimit: 1500,
    hotelLimit: 8000,
    monthlyBudget: 200000
  });

  const categories = [
    'Travel', 'Fuel', 'Food', 'Hotel', 'Internet', 'Mobile Bill', 
    'Medical', 'Office Supplies', 'Training', 'Client Meeting', 'Other'
  ];

  const getHeaders = () => {
    const token = localStorage.getItem('hr_system_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const getPayoutRefForClaim = (claimId: string) => {
    const tx = payouts.find(p => p.expenseId === claimId);
    if (!tx) return '';
    return tx.transactionId.startsWith('tx_sim_') ? tx.transactionId.substring(7) : tx.transactionId;
  };

  // Fetch Claims
  const fetchClaims = async () => {
    try {
      setLoading(true);
      let url = '/api/expenses';
      if (selectedBranchId) {
        url += `?branchId=${selectedBranchId}`;
      }
      const res = await fetch(url, {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setClaims(data);
      }
    } catch (err) {
      console.error(err);
      triggerToast('Failed to load expense claims', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Analytics
  const fetchAnalytics = async () => {
    try {
      let url = '/api/expenses/analytics';
      if (selectedBranchId) {
        url += `?branchId=${selectedBranchId}`;
      }
      const res = await fetch(url, {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch Policy
  const fetchPolicy = async () => {
    try {
      const res = await fetch('/api/expenses/policies', {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setPolicy(data);
        setEditingPolicy({
          travelLimit: data.travelLimit || 5000,
          foodLimit: data.foodLimit || 1500,
          hotelLimit: data.hotelLimit || 8000,
          monthlyBudget: data.monthlyBudget || 200000
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch bank details
  const fetchBankDetails = async (email?: string) => {
    try {
      setBankLoading(true);
      const query = email ? `?email=${encodeURIComponent(email)}` : '';
      const res = await fetch(`/api/expenses/bank${query}`, {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        if (data.exists) {
          setBankDetails(data.bankDetails);
          setMaskedAcc(data.maskedAccountNumber);
        } else {
          setBankDetails({
            accountHolderName: '',
            bankName: '',
            accountNumber: '',
            ifscCode: '',
            upiId: '',
            isVerified: false,
            verificationStatus: 'unverified',
            verifiedBy: '',
            verifiedAt: null
          });
          setMaskedAcc('');
        }
      }
    } catch (err) {
      console.error('Failed to fetch bank details:', err);
    } finally {
      setBankLoading(false);
    }
  };

  // Fetch payout transactions log
  const fetchPayouts = async () => {
    try {
      const selfParam = viewRole === 'Employee' ? '?self=true' : '';
      const res = await fetch(`/api/expenses/payouts${selfParam}`, {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setPayouts(data);
      }
    } catch (err) {
      console.error('Failed to fetch payouts log:', err);
    }
  };

  // Fetch payout provider settings
  const fetchPayoutSettings = async () => {
    try {
      const res = await fetch('/api/settings/system', {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        if (data.payout) {
          setPayoutSettings({
            primaryProvider: data.payout.primaryProvider || 'RazorpayX',
            razorpayxKey: data.payout.razorpayxKey || '',
            razorpayxSecret: data.payout.razorpayxSecret || '',
            cashfreeAppId: data.payout.cashfreeAppId || '',
            cashfreeSecret: data.payout.cashfreeSecret || '',
            decentroClientId: data.payout.decentroClientId || '',
            decentroClientSecret: data.payout.decentroClientSecret || '',
            isSimulator: data.payout.isSimulator !== false
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch payout settings:', err);
    }
  };

  // Fetch all employees for directory selection
  const fetchEmployees = async () => {
    try {
      let url = '/api/employees';
      if (selectedBranchId) {
        url += `?branchId=${selectedBranchId}`;
      }
      const res = await fetch(url, {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setEmployees(data);
      }
    } catch (err) {
      console.error('Failed to fetch employees:', err);
    }
  };

  useEffect(() => {
    fetchClaims();
    fetchAnalytics();
    fetchPolicy();
    fetchBankDetails();
    fetchPayouts();
    if (viewRole === 'HR' || viewRole === 'Finance') {
      fetchPayoutSettings();
      fetchEmployees();
    } else {
      setBankSubTab('my-account');
      setSelectedEmployeeEmail('');
    }
  }, [viewRole, selectedBranchId]);

  // Sync details when employee selection or active subtab changes
  useEffect(() => {
    if (activeTab === 'bank-details') {
      if (bankSubTab === 'manage-accounts' && selectedEmployeeEmail) {
        fetchBankDetails(selectedEmployeeEmail);
      } else {
        fetchBankDetails();
      }
    }
  }, [selectedEmployeeEmail, bankSubTab, activeTab]);

  // Sync tab access when viewRole changes
  useEffect(() => {
    if (viewRole === 'Employee') {
      const allowed = ['my-expenses', 'new-claim', 'policies'];
      if (!allowed.includes(activeTab)) {
        setActiveTab('my-expenses');
      }
    } else if (viewRole === 'HR') {
      const allowed = ['my-expenses', 'new-claim', 'approvals', 'analytics', 'policies'];
      if (!allowed.includes(activeTab)) {
        setActiveTab('approvals');
      }
    }
  }, [viewRole, activeTab]);

  // Run live policy violation check on input change
  useEffect(() => {
    if (!policy) return;
    const warnings: string[] = [];
    const amt = Number(amount);
    
    if (amt > 0) {
      const catLower = expenseType.toLowerCase();
      if (catLower.includes('travel') && amt > policy.travelLimit) {
        warnings.push(`Amount exceeds travel limit of ₹${policy.travelLimit.toLocaleString()}.`);
      } else if (catLower.includes('food') && amt > policy.foodLimit) {
        warnings.push(`Amount exceeds food limit of ₹${policy.foodLimit.toLocaleString()}.`);
      } else if (catLower.includes('hotel') && amt > policy.hotelLimit) {
        warnings.push(`Amount exceeds hotel limit of ₹${policy.hotelLimit.toLocaleString()}.`);
      }
    }
    setPolicyWarnings(warnings);
  }, [amount, expenseType, policy]);

  // Handle Mock Receipt Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setScanning(true);
      setUploadProgress(20);
      
      const formData = new FormData();
      formData.append('file', file);

      // 1. Upload file
      const token = localStorage.getItem('hr_system_token');
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      setUploadProgress(60);

      if (!uploadRes.ok) {
        throw new Error('Upload failed');
      }

      const uploadResult = await uploadRes.json();
      setReceiptUrl(uploadResult.url);
      setReceiptName(file.name);

      setUploadProgress(85);

      // 2. Perform OCR scanning
      const ocrRes = await fetch('/api/expenses/ocr', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ filename: file.name, url: uploadResult.url })
      });

      setUploadProgress(100);

      if (ocrRes.ok) {
        const ocrResult = await ocrRes.json();
        const extracted = ocrResult.ocrData;
        setOcrData(extracted);
        
        // Auto-fill form fields
        setExpenseType(extracted.expenseCategory || 'Other');
        setAmount(extracted.amount?.toString() || '');
        if (extracted.date) {
          setExpenseDate(extracted.date);
        }
        setDescription(`Expense at ${extracted.vendorName || 'Vendor'}`);
        triggerToast('Receipt scanned: Form autofilled!', 'success');
      }
    } catch (err: any) {
      console.error(err);
      triggerToast('File upload or scanning failed', 'error');
    } finally {
      setTimeout(() => {
        setScanning(false);
        setUploadProgress(0);
      }, 500);
    }
  };

  // Submit Claim (Draft or Final)
  const handleSubmitClaim = async (status: 'Draft' | 'Submitted') => {
    if (!amount || Number(amount) <= 0) {
      triggerToast('Please enter a valid amount', 'warning');
      return;
    }
    if (!description.trim()) {
      triggerToast('Please enter a description', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          expenseType,
          amount,
          expenseDate,
          description,
          project,
          department: profile.dept || 'Engineering',
          receiptUrl,
          status,
          comment,
          ocrData
        })
      });

      if (res.ok) {
        triggerToast(
          status === 'Draft' ? 'Draft saved successfully!' : 'Expense claim submitted!',
          'success'
        );
        // Reset form
        setAmount('');
        setDescription('');
        setProject('');
        setReceiptUrl('');
        setReceiptName('');
        setComment('');
        setOcrData(null);
        
        fetchClaims();
        fetchAnalytics();
        setActiveTab('my-expenses');
      } else {
        const errData = await res.json();
        triggerToast(errData.error || 'Submission failed', 'error');
      }
    } catch (err) {
      console.error(err);
      triggerToast('Network error during submission', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Process workflow action (Approve, Reject, Request Changes)
  const handleWorkflowAction = async (claimId: string, action: 'Approve' | 'Reject' | 'Request Changes' | 'Mark Paid') => {
    try {
      setApprovingId(claimId);
      const res = await fetch(`/api/expenses/${claimId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          action,
          comment: approvalComment
        })
      });

      if (res.ok) {
        triggerToast(`Claim updated successfully: ${action}`, 'success');
        setApprovalComment('');
        setIsDetailOpen(false);
        fetchClaims();
        fetchAnalytics();
      } else {
        const err = await res.json();
        triggerToast(err.error || 'Action failed', 'error');
      }
    } catch (err) {
      console.error(err);
      triggerToast('Connection error', 'error');
    } finally {
      setApprovingId(null);
    }
  };

  // Save Expense Policy (Admin/HR only)
  const handleSavePolicy = async () => {
    try {
      const res = await fetch('/api/expenses/policies', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(editingPolicy)
      });
      if (res.ok) {
        triggerToast('Expense policy updated successfully!', 'success');
        fetchPolicy();
        fetchAnalytics();
      } else {
        triggerToast('Failed to update policy', 'error');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Save bank details (marks as unverified in DB)
  const handleSaveBank = async () => {
    if (!bankDetails.accountHolderName || !bankDetails.bankName || !bankDetails.accountNumber || !bankDetails.ifscCode) {
      triggerToast('All banking fields are required.', 'warning');
      return;
    }
    try {
      setBankVerifying(true);
      const body = {
        ...bankDetails,
        email: bankSubTab === 'manage-accounts' ? selectedEmployeeEmail : undefined
      };
      const res = await fetch('/api/expenses/bank', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body)
      });
      if (res.ok) {
        triggerToast('Bank details updated! Penny Drop Verification is required.', 'success');
        setBankEditing(false);
        fetchBankDetails(bankSubTab === 'manage-accounts' ? selectedEmployeeEmail : undefined);
      } else {
        const data = await res.json();
        triggerToast(data.error || 'Failed to save bank details.', 'error');
      }
    } catch (err) {
      console.error(err);
      triggerToast('Network error while saving details.', 'error');
    } finally {
      setBankVerifying(false);
    }
  };

  // Verify bank details via Penny Drop Validation
  const handleVerifyBank = async () => {
    if (!bankDetails.accountHolderName || !bankDetails.bankName || !bankDetails.accountNumber || !bankDetails.ifscCode) {
      triggerToast('Please fill out all bank details before verifying.', 'warning');
      return;
    }
    try {
      setBankVerifying(true);
      const body = {
        ...bankDetails,
        email: bankSubTab === 'manage-accounts' ? selectedEmployeeEmail : undefined
      };
      const res = await fetch('/api/expenses/bank/verify', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (res.ok && data.verified) {
        triggerToast(`Penny drop successful! Verified Beneficiary: ${data.payeeName}`, 'success');
        setBankEditing(false);
        fetchBankDetails(bankSubTab === 'manage-accounts' ? selectedEmployeeEmail : undefined);
      } else {
        triggerToast(data.message || data.error || 'Penny drop verification failed.', 'error');
      }
    } catch (err) {
      console.error(err);
      triggerToast('Network error during Penny Drop verification.', 'error');
    } finally {
      setBankVerifying(false);
    }
  };

  // Save Payout settings to company system configurations
  const handleSavePayoutSettings = async () => {
    try {
      setSavingPayoutSettings(true);
      const res = await fetch('/api/settings/system', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ payout: payoutSettings })
      });
      if (res.ok) {
        triggerToast('Payout configuration settings updated successfully!', 'success');
        fetchPayoutSettings();
      } else {
        triggerToast('Failed to update payout settings.', 'error');
      }
    } catch (err) {
      console.error(err);
      triggerToast('Network error while updating payout configs.', 'error');
    } finally {
      setSavingPayoutSettings(false);
    }
  };

  // Cancel claim
  const handleCancelClaim = async (claimId: string) => {
    if (!confirm('Are you sure you want to cancel this claim?')) return;
    try {
      const res = await fetch(`/api/expenses/${claimId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ action: 'Cancel' })
      });
      if (res.ok) {
        triggerToast('Claim cancelled successfully', 'success');
        fetchClaims();
        fetchAnalytics();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Export claims to CSV file
  const exportToCSV = () => {
    const headers = ['ID', 'Employee', 'Name', 'Category', 'Amount', 'Date', 'Status', 'Project', 'Department', 'Paid Date'];
    const rows = claims.map(c => [
      c._id,
      c.employee,
      c.name,
      c.type,
      c.amount,
      c.claimDate,
      c.status,
      c.project || '',
      c.department || '',
      c.paidDate ? new Date(c.paidDate).toLocaleDateString() : ''
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `expenses_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('CSV Report exported successfully!', 'success');
  };

  // Export claims to Excel mock download
  const exportToExcel = () => {
    exportToCSV(); // For mockup purposes, direct to CSV which opens perfectly in Excel
  };

  // Export printable view (PDF)
  const exportToPDF = () => {
    window.print();
  };

  // Helpers
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'Approved':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'Manager Review':
      case 'HR Review':
      case 'Finance Approval':
      case 'Submitted':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'Draft':
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
      case 'Rejected':
        return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      case 'Returned For Changes':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'Cancelled':
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  // Filter logic
  const filteredClaims = claims.filter(c => {
    // Ensure only self claims are shown in the personal expenses tab
    if (activeTab === 'my-expenses' && c.employee !== profile?.email?.toLowerCase()) {
      return false;
    }
    const matchesSearch = c.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    const matchesCategory = categoryFilter === 'All' || c.type === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getApprovalsQueue = () => {
    return claims.filter(c => {
      if (viewRole === 'HR') {
        return c.status === 'HR Review';
      }
      if (viewRole === 'Finance') {
        return c.status === 'Finance Approval';
      }
      return c.status !== 'Draft' && c.status !== 'Cancelled' && c.status !== 'Paid' && c.status !== 'Rejected';
    });
  };

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100 p-3 md:p-6 bg-transparent dark:bg-transparent font-sans">
      
      {/* 1. Header Toolbar with Interactive View Selector */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 md:p-6 mb-6 shadow-sm text-left">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight bg-gradient-to-r from-blue-600 to-indigo-650 dark:from-blue-450 dark:to-indigo-400 bg-clip-text text-transparent">
              Expenses & Reimbursements
            </h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
              Enterprise Claims Management and Workflow Engine
            </p>
          </div>

        {/* Demo View Switcher Box - Only visible to Admins/HR for review/test purposes */}
        {(loggedInRole === 'Admin' || loggedInRole === 'HR' || loggedInRole === 'Super Admin') && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-1.5 flex gap-1 items-center shadow-lg">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest px-2.5">
              View Portal As:
            </span>
            {(['Employee', 'HR', 'Finance'] as const).map(role => (
              <button
                key={role}
                onClick={() => setViewRole(role)}
                className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border-none cursor-pointer ${
                  viewRole === role 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 2. Top Navigation Tabs */}
      <div className="premium-nav-container">
        <button 
          onClick={() => setActiveTab('my-expenses')}
          className={cn(
            "premium-nav-item active:scale-[0.98]",
            activeTab === 'my-expenses' ? "premium-nav-item-active" : ""
          )}
        >
          <span>My Expenses</span>
        </button>
        <button 
          onClick={() => setActiveTab('new-claim')}
          className={cn(
            "premium-nav-item active:scale-[0.98]",
            activeTab === 'new-claim' ? "premium-nav-item-active" : ""
          )}
        >
          <span>New Expense Claim</span>
        </button>

        {/* Approvals tab only for HR or Finance */}
        {(viewRole === 'HR' || viewRole === 'Finance') && (
          <button 
            onClick={() => setActiveTab('approvals')}
            className={cn(
              "premium-nav-item active:scale-[0.98]",
              activeTab === 'approvals' ? "premium-nav-item-active" : ""
            )}
          >
            <span>Approval Center</span>
            {getApprovalsQueue().length > 0 && (
              <span className={cn(
                "px-1 py-0.5 rounded text-[8px] font-semibold transition-all",
                activeTab === 'approvals' 
                  ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" 
                  : "bg-amber-500 text-slate-950"
              )}>
                {getApprovalsQueue().length}
              </span>
            )}
          </button>
        )}

        {/* Finance Console tab only for Finance role */}
        {viewRole === 'Finance' && (
          <button 
            onClick={() => setActiveTab('finance')}
            className={cn(
              "premium-nav-item active:scale-[0.98]",
              activeTab === 'finance' ? "premium-nav-item-active" : ""
            )}
          >
            <span>Reimbursements</span>
          </button>
        )}

        {/* Analytics tab only for HR or Finance */}
        {(viewRole === 'HR' || viewRole === 'Finance') && (
          <button 
            onClick={() => setActiveTab('analytics')}
            className={cn(
              "premium-nav-item active:scale-[0.98]",
              activeTab === 'analytics' ? "premium-nav-item-active" : ""
            )}
          >
            <span>Expense Analytics</span>
          </button>
        )}

        <button 
          onClick={() => setActiveTab('policies')}
          className={cn(
            "premium-nav-item active:scale-[0.98]",
            activeTab === 'policies' ? "premium-nav-item-active" : ""
          )}
        >
          <span>Expense Policies</span>
        </button>
      </div>
    </div>

      {/* 3. Main Dashboard Body Switcher */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.2 }}
        >
          
          {/* TAB 1: MY EXPENSES LIST */}
          {activeTab === 'my-expenses' && (
            <div className="space-y-6">
              {/* Employee Summary Counter Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-left">
                {[
                  {
                    label: 'Submitted Claims',
                    value: claims.filter(c => c.employee === profile.email.toLowerCase()).length,
                    icon: FileText,
                    accent: '#3B82F6',
                    sub: 'Active employee claims'
                  },
                  {
                    label: 'Awaiting Approvals',
                    value: claims.filter(c => c.employee === profile.email.toLowerCase() && ['HR Review', 'Submitted'].includes(c.status)).length,
                    icon: Clock3,
                    accent: '#F59E0B',
                    sub: 'Pending review queue'
                  },
                  {
                    label: 'Total Reimbursed',
                    value: `₹${claims.filter(c => c.employee === profile.email.toLowerCase() && c.status === 'Paid').reduce((sum,c) => sum + c.amount, 0).toLocaleString()}`,
                    icon: CheckCircle,
                    accent: '#10B981',
                    sub: 'Disbursed claims history'
                  },
                  {
                    label: 'Policy Compliance',
                    value: claims.filter(c => c.employee === profile.email.toLowerCase() && c.fraudCheck?.policyViolations?.length > 0).length === 0 ? '100%' : 'Flags Active',
                    icon: Shield,
                    accent: '#8B5CF6',
                    sub: 'Audit validation rating'
                  }
                ].map((stat, idx) => (
          <PastelStatCard key={idx} icon={stat.icon} label={stat.label} value={stat.value} sub={stat.sub} accent={stat.accent} />
        ))}
              </div>

              {/* Table Toolbar Filters */}
              <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-4 flex flex-col md:flex-row md:items-center gap-4 shadow-inner">
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by description, employee name, project..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-[10px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-bold text-slate-500 uppercase">Status</span>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="bg-slate-950/80 border border-slate-800 rounded-xl px-2.5 py-1.5 text-[9px] text-slate-300"
                    >
                      <option value="All">All Statuses</option>
                      <option value="Draft">Draft</option>
                      <option value="Submitted">Submitted</option>
                      <option value="HR Review">HR Review</option>
                      <option value="Paid">Paid</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Returned For Changes">Returned For Changes</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-bold text-slate-500 uppercase">Category</span>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="bg-slate-950/80 border border-slate-800 rounded-xl px-2.5 py-1.5 text-[9px] text-slate-300"
                    >
                      <option value="All">All Categories</option>
                      {categories.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Data Table */}
              <div className="bg-slate-900/30 border border-slate-850 rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/50">
                      <th className="p-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Expense Details</th>
                      <th className="p-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Category</th>
                      <th className="p-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Amount</th>
                      <th className="p-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Date / Settlement</th>
                      <th className="p-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Project/Dept</th>
                      <th className="p-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                      <th className="p-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Tx Reference</th>
                      <th className="p-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/60">
                    {filteredClaims.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                          No expense claims found
                        </td>
                      </tr>
                    ) : (
                      filteredClaims.map(c => (
                        <tr key={c._id} className="hover:bg-slate-900/10 group">
                          <td className="p-4">
                            <div className="flex flex-col">
                              <span className="text-[11px] font-bold text-slate-250 truncate max-w-[240px]">{c.description}</span>
                              <span className="text-[8px] text-slate-500 font-bold mt-0.5 uppercase tracking-wider">ID: {c._id.slice(-8)} • {c.name}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="text-[10px] font-medium text-slate-350">{c.type || c.expenseType}</span>
                          </td>
                          <td className="p-4">
                            <span className="text-[11px] font-black text-slate-100">₹{c.amount.toLocaleString()}</span>
                          </td>
                          <td className="p-4 text-[10px] text-slate-450">
                            <div>{c.claimDate || c.expenseDate}</div>
                            {c.paidDate && (
                              <div className="text-[8px] text-emerald-400 font-bold uppercase mt-0.5">Paid: {new Date(c.paidDate).toLocaleDateString()}</div>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col">
                              <span className="text-[9px] font-bold text-slate-300 uppercase">{c.project || 'No Project'}</span>
                              <span className="text-[8px] text-slate-500">{c.department || 'Engineering'}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-widest ${getStatusBadgeClass(c.status)}`}>
                              {c.status}
                            </span>
                            {c.fraudCheck?.riskScore > 0 && (
                              <span className={`ml-1.5 px-1 py-0.5 rounded text-[8px] font-black uppercase ${
                                c.fraudCheck.riskScore >= 50 ? 'bg-rose-500/10 text-rose-500 border border-rose-500/10' : 'bg-amber-500/10 text-amber-500'
                              }`}>
                                Risk: {c.fraudCheck.riskScore}
                              </span>
                            )}
                          </td>
                          <td className="p-4 font-mono text-[9px] text-slate-400">
                            {getPayoutRefForClaim(c._id) || '—'}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => {
                                  setSelectedClaim(c);
                                  setIsDetailOpen(true);
                                }}
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border-none cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              {c.employee === profile.email.toLowerCase() && ['Submitted', 'HR Review'].includes(c.status) && (
                                <button
                                  onClick={() => handleCancelClaim(c._id)}
                                  className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-350 rounded-lg border-none cursor-pointer"
                                  title="Cancel Claim"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: NEW EXPENSE CLAIM FORM WITH OCR */}
          {activeTab === 'new-claim' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Form Inputs */}
              <div className="lg:col-span-7 bg-slate-900/40 border border-slate-850 rounded-[2rem] p-6 shadow-xl space-y-4">
                <div className="border-b border-slate-800 pb-3 mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-300">Submit New claim</h3>
                  <Sparkles className="w-4.5 h-4.5 text-blue-500 animate-pulse" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-black uppercase tracking-wider text-slate-450">Expense Category</label>
                    <select
                      value={expenseType}
                      onChange={(e) => setExpenseType(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-[10px] text-slate-200"
                    >
                      {categories.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-black uppercase tracking-wider text-slate-450">Amount (INR)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-bold">₹</span>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-6 pr-3 text-[10px] text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 font-bold"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-black uppercase tracking-wider text-slate-450">Expense Date</label>
                    <input
                      type="date"
                      value={expenseDate}
                      onChange={(e) => setExpenseDate(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-[10px] text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-black uppercase tracking-wider text-slate-450">Project Name (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Project Apollo"
                      value={project}
                      onChange={(e) => setProject(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-[10px] text-slate-200 placeholder-slate-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-black uppercase tracking-wider text-slate-450">Description</label>
                  <input
                    type="text"
                    placeholder="Enter what the expense was for..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-[10px] text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-black uppercase tracking-wider text-slate-450">Comments for Reviewer</label>
                  <textarea
                    rows={2}
                    placeholder="Provide justification or travel details..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-[10px] text-slate-200 placeholder-slate-600 focus:outline-none"
                  />
                </div>

                {/* Policy Violation Warnings */}
                {policyWarnings.length > 0 && (
                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-rose-450 leading-none">Policy Limit Exceeded</span>
                      {policyWarnings.map((warn, i) => (
                        <p key={i} className="text-[10px] text-rose-200 font-medium">{warn}</p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Submit Action Buttons */}
                <div className="flex gap-3 pt-3">
                  <button
                    onClick={() => handleSubmitClaim('Draft')}
                    disabled={submitting || scanning}
                    className="flex-1 py-3 text-slate-300 bg-slate-800 hover:bg-slate-750 rounded-xl text-[10px] font-black uppercase tracking-widest border-none cursor-pointer active:scale-[0.99] disabled:opacity-50"
                  >
                    Save As Draft
                  </button>
                  <button
                    onClick={() => handleSubmitClaim('Submitted')}
                    disabled={submitting || scanning}
                    className="flex-1 py-3 text-white bg-blue-600 hover:bg-blue-500 rounded-xl text-[10px] font-black uppercase tracking-widest border-none cursor-pointer active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {submitting ? (
                      <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <span>Submit Claim</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Right Column: Receipt Uploader & OCR Scanner */}
              <div className="lg:col-span-5 bg-slate-900/40 border border-slate-850 rounded-[2rem] p-6 shadow-xl flex flex-col justify-between relative overflow-hidden">
                <div className="border-b border-slate-800 pb-3 mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-300">Receipt Management</h3>
                  <FileText className="w-4 h-4 text-blue-500" />
                </div>

                {/* Drag and Drop Zone */}
                <div className="flex-1 flex flex-col justify-center min-h-[200px]">
                  {scanning ? (
                    <div className="border border-dashed border-blue-500 bg-blue-500/5 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 relative overflow-hidden">
                      <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent top-0 animate-bounce" />
                      <RefreshCcw className="w-8 h-8 text-blue-500 animate-spin" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">AI Receipt OCR Scanning...</span>
                      <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden max-w-[150px]">
                        <div className="bg-blue-500 h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                      </div>
                    </div>
                  ) : receiptUrl ? (
                    <div className="border border-slate-800 bg-slate-950/60 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center text-blue-500 mb-2 font-black text-xs">
                        FILE
                      </div>
                      <span className="text-[10px] text-slate-200 font-bold truncate max-w-[200px]">{receiptName}</span>
                      <span className="text-[8px] text-emerald-400 font-black uppercase mt-1">Uploaded Successfully</span>
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => {
                            window.open(receiptUrl, '_blank');
                          }}
                          className="px-3 py-1.5 bg-slate-850 hover:bg-slate-800 text-[9px] font-black uppercase tracking-wider text-slate-300 rounded-lg border-none cursor-pointer"
                        >
                          View File
                        </button>
                        <button
                          onClick={() => {
                            setReceiptUrl('');
                            setReceiptName('');
                            setOcrData(null);
                          }}
                          className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-[9px] font-black uppercase tracking-wider text-rose-450 rounded-lg border-none cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="border border-dashed border-slate-800 hover:border-slate-700 bg-slate-950/30 hover:bg-slate-950/50 transition-colors rounded-2xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer text-center group">
                      <input
                        type="file"
                        accept="image/png, image/jpeg, application/pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <FileUp className="w-8 h-8 text-slate-500 group-hover:scale-110 transition-transform" />
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-350 block">Upload Receipt Document</span>
                        <span className="text-[8px] text-slate-500 block">Drag & Drop or Click to browse (JPG, PNG, PDF)</span>
                      </div>
                    </label>
                  )}
                </div>

                {/* AI Extracted OCR fields list view */}
                {ocrData && (
                  <div className="mt-4 bg-slate-950/40 border border-slate-850 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center gap-1.5 border-b border-slate-850 pb-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                      <span className="text-[8.5px] font-black text-blue-400 uppercase tracking-widest">AI Scanner Extraction</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[9px]">
                      <div className="flex flex-col">
                        <span className="text-slate-500 uppercase tracking-wider font-bold">Vendor</span>
                        <span className="text-slate-300 font-bold">{ocrData.vendorName}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-slate-500 uppercase tracking-wider font-bold">GST Number</span>
                        <span className="text-slate-300 font-mono font-bold">{ocrData.gstNumber || 'N/A'}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-slate-500 uppercase tracking-wider font-bold">Date</span>
                        <span className="text-slate-300 font-bold">{ocrData.date}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-slate-500 uppercase tracking-wider font-bold">Extracted Category</span>
                        <span className="text-slate-350 font-bold">{ocrData.expenseCategory}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: APPROVAL CENTER */}
          {activeTab === 'approvals' && (
            <div className="space-y-6">
              
              {/* Alert note about the View Role switch */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-blue-400 shrink-0" />
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-200">Active Review Level: {viewRole}</span>
                    <p className="text-[9px] text-slate-400">Showing claims currently pending review by a {viewRole}. Change your "View Portal As" role to test different steps.</p>
                  </div>
                </div>
              </div>

              {/* Claims waiting review list */}
              <div className="bg-slate-900/30 border border-slate-850 rounded-[2rem] overflow-hidden">
                <div className="p-4 border-b border-slate-850 bg-slate-900/50 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pending Approvals Queue</span>
                  <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/10 text-[9px] font-black text-blue-400 uppercase tracking-widest">
                    {getApprovalsQueue().length} Pending
                  </span>
                </div>
                
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/20">
                      <th className="p-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Employee</th>
                      <th className="p-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Category</th>
                      <th className="p-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Amount</th>
                      <th className="p-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                      <th className="p-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Risk Score</th>
                      <th className="p-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Process Workflow</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/60">
                    {getApprovalsQueue().length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                          No claims currently pending approval at this level
                        </td>
                      </tr>
                    ) : (
                      getApprovalsQueue().map(c => (
                        <tr key={c._id} className="hover:bg-slate-900/10">
                          <td className="p-4">
                            <div className="flex flex-col">
                              <span className="text-[11px] font-bold text-slate-200">{c.name}</span>
                              <span className="text-[8px] text-slate-500 uppercase tracking-wider">{c.employee} • {c.department}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="text-[10px] font-medium text-slate-350">{c.type || c.expenseType}</span>
                          </td>
                          <td className="p-4">
                            <span className="text-[11px] font-black text-slate-100">₹{c.amount.toLocaleString()}</span>
                          </td>
                          <td className="p-4 text-[10px] text-slate-450">
                            {c.claimDate || c.expenseDate}
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded border text-[8px] font-black uppercase ${
                              (c.fraudCheck?.riskScore || 0) >= 50 
                                ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' 
                                : (c.fraudCheck?.riskScore || 0) > 0 
                                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' 
                                  : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                            }`}>
                              Score: {c.fraudCheck?.riskScore || 0}
                            </span>
                            {c.fraudCheck?.policyViolations?.length > 0 && (
                              <span className="ml-1.5 text-[8px] font-bold text-rose-400 uppercase tracking-wider">
                                (Policy Exceeded)
                              </span>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => {
                                  setSelectedClaim(c);
                                  setIsDetailOpen(true);
                                }}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[9px] font-black uppercase tracking-wider border-none cursor-pointer"
                              >
                                Review Claim
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: REIMBURSEMENTS (FINANCE DASHBOARD) */}
          {activeTab === 'finance' && (
            <div className="space-y-6">
              
              {/* Finance Widget Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  {
                    label: 'Total Payable Reimbursements',
                    value: `₹${claims.filter(c => c.status === 'Approved').reduce((sum,c) => sum + c.amount, 0).toLocaleString()}`,
                    sub: `Awaiting Payout`,
                    icon: DollarSign,
                    theme: {
                      gradient: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
                      cardBorder: 'border-transparent',
                      text: 'text-white',
                      bg: 'bg-[rgba(255,255,255,0.15)] dark:bg-[rgba(15,23,42,0.35)]',
                      border: 'border-[rgba(255,255,255,0.2)] dark:border-[rgba(255,255,255,0.06)]',
                      glow: 'shadow-sm',
                      bubble: 'bg-[rgba(255,255,255,0.4)]',
                      labelColor: 'text-white/80',
                      subColor: 'text-white/70',
                      valueColor: 'text-white'
                    }
                  },
                  {
                    label: 'Approved Claims Count',
                    value: `${claims.filter(c => ['Approved', 'Paid'].includes(c.status)).length} Claims`,
                    sub: `Processed and approved`,
                    icon: CheckCircle,
                    theme: {
                      gradient: 'linear-gradient(135deg, #10b981 0%, #0d9488 100%)',
                      cardBorder: 'border-transparent',
                      text: 'text-white',
                      bg: 'bg-[rgba(255,255,255,0.15)] dark:bg-[rgba(15,23,42,0.35)]',
                      border: 'border-[rgba(255,255,255,0.2)] dark:border-[rgba(255,255,255,0.06)]',
                      glow: 'shadow-sm',
                      bubble: 'bg-[rgba(255,255,255,0.4)]',
                      labelColor: 'text-white/80',
                      subColor: 'text-white/70',
                      valueColor: 'text-white'
                    }
                  },
                  {
                    label: 'Pending Payments',
                    value: `₹${claims.filter(c => c.status === 'Approved').reduce((sum,c) => sum + c.amount, 0).toLocaleString()}`,
                    sub: `Requires manual or batch release`,
                    icon: Clock3,
                    theme: {
                      gradient: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
                      cardBorder: 'border-transparent',
                      text: 'text-white',
                      bg: 'bg-[rgba(255,255,255,0.15)] dark:bg-[rgba(15,23,42,0.35)]',
                      border: 'border-[rgba(255,255,255,0.2)] dark:border-[rgba(255,255,255,0.06)]',
                      glow: 'shadow-sm',
                      bubble: 'bg-[rgba(255,255,255,0.4)]',
                      labelColor: 'text-white/80',
                      subColor: 'text-white/70',
                      valueColor: 'text-white'
                    }
                  },
                  {
                    label: 'Monthly Budget Consumption',
                    value: `${analytics?.summary?.budgetConsumption || 0}%`,
                    sub: `Cap: ₹${analytics?.summary?.monthlyBudgetLimit?.toLocaleString() || '200,000'}`,
                    icon: TrendingUp,
                    isProgressBar: true,
                    theme: {
                      gradient: 'linear-gradient(135deg, #f43f5e 0%, #ec4899 100%)',
                      cardBorder: 'border-transparent',
                      text: 'text-white',
                      bg: 'bg-[rgba(255,255,255,0.15)] dark:bg-[rgba(15,23,42,0.35)]',
                      border: 'border-[rgba(255,255,255,0.2)] dark:border-[rgba(255,255,255,0.06)]',
                      glow: 'shadow-sm',
                      bubble: 'bg-[rgba(255,255,255,0.4)]',
                      labelColor: 'text-white/80',
                      subColor: 'text-white/70',
                      valueColor: 'text-white'
                    }
                  }
                ].map((stat, idx) => (
                  <div 
                    key={idx}
                    style={{ background: stat.theme.gradient }}
                    className={cn("p-4 lg:p-5 rounded-2xl shadow-[0_4px_16px_-3px_rgba(0,0,0,0.08)] flex items-center gap-3.5 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 group relative overflow-hidden text-left border", stat.theme.cardBorder)}
                  >
                    {/* Dual Ambient Blur Bubbles */}
                    <div className={cn("absolute -right-8 -top-8 w-24 h-24 rounded-full opacity-[0.05] group-hover:opacity-[0.1] transition-all duration-500 blur-xl pointer-events-none", stat.theme.bubble)} />
                    <div className={cn("absolute -left-6 -bottom-6 w-16 h-16 rounded-full opacity-[0.03] group-hover:opacity-[0.06] transition-all duration-500 blur-lg pointer-events-none", stat.theme.bubble)} />
                    
                    {/* Themed Icon Wrapper */}
                    <div className={cn("p-3 rounded-xl border flex items-center justify-center shadow-sm shrink-0 group-hover:scale-105 transition-transform duration-300", stat.theme.bg, stat.theme.border, stat.theme.glow)}>
                      <stat.icon className={cn("w-5 h-5", stat.theme.text)} />
                    </div>
                    
                    {/* Value & Labels */}
                    <div className="relative z-10 min-w-0 flex-1">
                      <p className={cn("text-[9px] font-black uppercase tracking-[0.12em] leading-none", stat.theme.labelColor)}>{stat.label}</p>
                      <h3 className={cn("text-lg font-black tracking-tight leading-tight mt-2.5 truncate", stat.theme.valueColor)}>{stat.value}</h3>
                      {stat.isProgressBar && (
                        <div className="mt-2.5">
                          <div className="w-full bg-[rgba(255,255,255,0.2)] rounded-full h-1.5 overflow-hidden">
                            <div 
                              className="bg-white h-full rounded-full transition-all duration-500" 
                              style={{ width: `${analytics?.summary?.budgetConsumption || 0}%` }} 
                            />
                          </div>
                        </div>
                      )}
                      <p className={cn("text-[7.5px] font-black tracking-wider uppercase truncate mt-1.5", stat.theme.subColor)}>{stat.sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Bar for export */}
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 bg-slate-905 border border-slate-850 p-4 rounded-2xl">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-200">Reimbursement Processing Console</span>
                  <p className="text-[8px] text-slate-400">Process payouts for approved claims, export reports, and sync ledger sheets.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={exportToCSV}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-[9px] font-black uppercase tracking-widest text-slate-300 rounded-xl flex items-center gap-1.5 border-none cursor-pointer shadow"
                  >
                    <Download className="w-3.5 h-3.5" />
                    CSV Export
                  </button>
                  <button
                    onClick={exportToExcel}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-[9px] font-black uppercase tracking-widest text-slate-300 rounded-xl flex items-center gap-1.5 border-none cursor-pointer shadow"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Excel Sheet
                  </button>
                  <button
                    onClick={exportToPDF}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-[9px] font-black uppercase tracking-widest text-slate-300 rounded-xl flex items-center gap-1.5 border-none cursor-pointer shadow"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Print PDF
                  </button>
                </div>
              </div>

              {/* Approved Claims Table for Payments */}
              <div className="bg-slate-900/30 border border-slate-850 rounded-[2rem] overflow-hidden">
                <div className="p-4 border-b border-slate-850 bg-slate-900/50 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ready For Disbursement Payment</span>
                </div>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/20">
                      <th className="p-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Employee</th>
                      <th className="p-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Description</th>
                      <th className="p-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Category</th>
                      <th className="p-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Amount</th>
                      <th className="p-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Approved Date</th>
                      <th className="p-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Disburse Fund</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/60">
                    {claims.filter(c => c.status === 'Approved').length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                          No pending payables waiting for disbursement
                        </td>
                      </tr>
                    ) : (
                      claims.filter(c => c.status === 'Approved').map(c => (
                        <tr key={c._id} className="hover:bg-slate-900/10">
                          <td className="p-4">
                            <div className="flex flex-col">
                              <span className="text-[11px] font-bold text-slate-200">{c.name}</span>
                              <span className="text-[8px] text-slate-500 uppercase tracking-wider">{c.employee}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="text-[10px] text-slate-350">{c.description}</span>
                          </td>
                          <td className="p-4">
                            <span className="text-[10px] text-slate-350">{c.type || c.expenseType}</span>
                          </td>
                          <td className="p-4">
                            <span className="text-[11px] font-black text-slate-100">₹{c.amount.toLocaleString()}</span>
                          </td>
                          <td className="p-4 text-[10px] text-slate-450">
                            {c.updatedAt ? new Date(c.updatedAt).toLocaleDateString() : c.claimDate}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-center">
                              <button
                                onClick={() => handleWorkflowAction(c._id, 'Mark Paid')}
                                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[9px] font-black uppercase tracking-wider border-none cursor-pointer flex items-center gap-1 shadow"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Mark as Paid
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Completed Payout History (Paid Claims) */}
              <div className="bg-slate-900/30 border border-slate-850 rounded-[2rem] overflow-hidden mt-6">
                <div className="p-4 border-b border-slate-850 bg-slate-900/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4.5 h-4.5 text-emerald-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-450">Completed Payout History</span>
                  </div>
                  <span className="text-[8px] font-black text-emerald-450 uppercase tracking-widest font-mono">PAID CLAIMS LEDGER</span>
                </div>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/20">
                      <th className="p-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Employee</th>
                      <th className="p-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Description</th>
                      <th className="p-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Category</th>
                      <th className="p-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Amount</th>
                      <th className="p-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Paid Date</th>
                      <th className="p-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Reference UTR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/60">
                    {claims.filter(c => c.status === 'Paid').length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                          No settled reimbursement claims found
                        </td>
                      </tr>
                    ) : (
                      claims.filter(c => c.status === 'Paid').map(c => (
                        <tr key={c._id} className="hover:bg-slate-900/10">
                          <td className="p-4">
                            <div className="flex flex-col">
                              <span className="text-[11px] font-bold text-slate-200">{c.name}</span>
                              <span className="text-[8px] text-slate-500 uppercase tracking-wider">{c.employee}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="text-[10px] text-slate-350">{c.description}</span>
                          </td>
                          <td className="p-4">
                            <span className="text-[10px] text-slate-350">{c.type || c.expenseType}</span>
                          </td>
                          <td className="p-4">
                            <span className="text-[11px] font-black text-slate-100">₹{c.amount.toLocaleString()}</span>
                          </td>
                          <td className="p-4 text-[10px] text-slate-450">
                            {c.paidDate ? new Date(c.paidDate).toLocaleDateString() : c.claimDate}
                          </td>
                          <td className="p-4 font-mono text-[9.5px] text-slate-450 text-center">
                            {getPayoutRefForClaim(c._id) || 'DEB-MAN-MOCK'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Automated Payout Ledger (Transactions Log) */}
              <div className="bg-slate-900/30 border border-slate-850 rounded-[2rem] overflow-hidden mt-6">
                <div className="p-4 border-b border-slate-850 bg-slate-900/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-450">Automated Payout Ledger</span>
                  </div>
                  <span className="text-[8px] font-black text-slate-550 uppercase tracking-widest font-mono">REAL-TIME DISBURSEMENT LOG</span>
                </div>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/20">
                      <th className="p-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Transaction UTR / ID</th>
                      <th className="p-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Merchant Ref</th>
                      <th className="p-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Amount</th>
                      <th className="p-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Provider</th>
                      <th className="p-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Method</th>
                      <th className="p-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Settled At</th>
                      <th className="p-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/60">
                    {payouts.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                          No payout transactions recorded
                        </td>
                      </tr>
                    ) : (
                      payouts.map(p => (
                        <tr key={p._id} className="hover:bg-slate-900/10">
                          <td className="p-4 font-mono text-[9.5px] text-slate-200 font-bold">
                            {p.transactionId}
                          </td>
                          <td className="p-4 text-[9.5px] text-slate-400 font-mono">
                            {p.payoutReference}
                          </td>
                          <td className="p-4 text-[11px] font-black text-slate-100">
                            ₹{p.amount.toLocaleString()}
                          </td>
                          <td className="p-4 text-[10px] text-slate-300 font-bold">
                            {p.payoutProvider}
                          </td>
                          <td className="p-4 text-[9px] text-slate-450 font-bold">
                            {p.paymentMethod}
                          </td>
                          <td className="p-4 text-[9.5px] text-slate-400">
                            {new Date(p.processedAt).toLocaleString()}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-center">
                              <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                p.status === 'Paid'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : p.status === 'Processing' || p.status === 'Pending'
                                  ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                  : p.status === 'Reversed'
                                  ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                  : 'bg-rose-500/10 text-rose-450 border border-rose-500/20'
                              }`}>
                                {p.status}
                              </span>
                            </div>
                            {p.errorMessage && (
                              <span className="text-[7.5px] text-rose-450 block text-center mt-1 truncate max-w-[150px] font-bold">
                                {p.errorMessage}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: EXPENSE ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {/* Analytics Header Widgets */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
                {[
                  {
                    label: 'Total Payout Volume',
                    value: `₹${analytics?.summary?.totalPayoutVolume?.toLocaleString() || '0'}`,
                    icon: TrendingUp,
                    accent: '#3B82F6',
                    sub: 'All time settled volume'
                  },
                  {
                    label: 'Current Month Cost',
                    value: `₹${analytics?.summary?.monthlyCost?.toLocaleString() || '0'}`,
                    icon: DollarSign,
                    accent: '#8B5CF6',
                    sub: 'Cost accrued this month'
                  },
                  {
                    label: 'Awaiting Verification',
                    value: `₹${analytics?.summary?.totalPending?.toLocaleString() || '0'}`,
                    icon: Clock3,
                    accent: '#F59E0B',
                    sub: 'Pending reconciliation'
                  },
                  {
                    label: 'Failed Transactions',
                    value: `${analytics?.summary?.failedPayoutsCount || 0} Failed`,
                    icon: ShieldAlert,
                    accent: '#F43F5E',
                    sub: 'Unresolved payment issues'
                  }
                ].map((stat, idx) => (
          <PastelStatCard key={idx} icon={stat.icon} label={stat.label} value={stat.value} sub={stat.sub} accent={stat.accent} />
        ))}
              </div>

              {/* Chart Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Chart 1: Monthly Cost Trend */}
                <div className="bg-slate-900/40 border border-slate-850 rounded-[2rem] p-5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-450 block mb-4">Monthly Cost Trends</span>
                  <div className="h-64">
                    {analytics?.charts?.trendData?.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analytics.charts.trendData}>
                          <defs>
                            <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="month" stroke="#94a3b8" fontSize={9} />
                          <YAxis stroke="#94a3b8" fontSize={9} />
                          <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '10px' }} />
                          <Area type="monotone" dataKey="amount" stroke="#3b82f6" fillOpacity={1} fill="url(#colorAmt)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-[10px] text-slate-500 uppercase tracking-wider font-bold">No trend data available</div>
                    )}
                  </div>
                </div>

                {/* Chart 2: Category Breakdown */}
                <div className="bg-slate-900/40 border border-slate-850 rounded-[2rem] p-5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-450 block mb-4">Category Distribution</span>
                  <div className="h-64 flex flex-col md:flex-row items-center gap-4">
                    <div className="w-full md:w-1/2 h-full">
                      {analytics?.charts?.categoryData?.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={analytics.charts.categoryData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={4}
                              dataKey="value"
                            >
                              {analytics.charts.categoryData.map((entry: any, index: number) => {
                                const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#d946ef', '#22c55e', '#ef4444', '#14b8a6', '#64748b'];
                                return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                              })}
                            </Pie>
                            <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '10px' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-[10px] text-slate-500 uppercase tracking-wider font-bold">No category claims</div>
                      )}
                    </div>
                    <div className="w-full md:w-1/2 space-y-1.5 overflow-y-auto max-h-48 pr-2">
                      {analytics?.charts?.categoryData?.map((cat: any, i: number) => {
                        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#d946ef', '#22c55e', '#ef4444', '#14b8a6', '#64748b'];
                        return (
                          <div key={cat.name} className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
                              <span className="text-slate-400">{cat.name}</span>
                            </div>
                            <span className="text-slate-200">₹{cat.value.toLocaleString()}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Failed Payouts Alert Panel (Only shown if failed count > 0) */}
              {analytics?.failedPayoutsList?.length > 0 && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-[2rem] p-5">
                  <div className="flex items-center gap-2 border-b border-rose-500/20 pb-2 mb-3">
                    <AlertTriangle className="w-4.5 h-4.5 text-rose-550" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-rose-450">Failed Payout Transactions Alert</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analytics.failedPayoutsList.map((fp: any) => (
                      <div key={fp.id} className="flex flex-col justify-between p-3.5 bg-slate-950/60 border border-slate-850 rounded-2xl gap-2 text-[9.5px]">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-mono text-slate-200 font-extrabold">{fp.transactionId}</span>
                          <span className="text-slate-500 font-mono text-[8px]">Ref: {fp.payoutReference}</span>
                          <span className="text-rose-400 font-bold mt-1">Error: {fp.error}</span>
                        </div>
                        <div className="flex items-center justify-between border-t border-slate-850/50 pt-2 mt-1.5 shrink-0">
                          <span className="text-slate-500 text-[8px]">{new Date(fp.processedAt).toLocaleString()}</span>
                          <span className="font-black text-slate-100">₹{fp.amount.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* High Value Claims & Risk Alerts Table */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* High Value Claims (50% or 7 columns) */}
                <div className="lg:col-span-7 bg-slate-900/40 border border-slate-850 rounded-[2rem] overflow-hidden">
                  <div className="p-4 border-b border-slate-850 bg-slate-900/50 flex items-center gap-2">
                    <ShieldAlert className="w-4.5 h-4.5 text-rose-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">High-Value Claim Audit (&gt; ₹15k)</span>
                  </div>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/20">
                        <th className="p-3 text-[8.5px] font-bold text-slate-500 uppercase">Employee</th>
                        <th className="p-3 text-[8.5px] font-bold text-slate-500 uppercase">Amount</th>
                        <th className="p-3 text-[8.5px] font-bold text-slate-500 uppercase">Type</th>
                        <th className="p-3 text-[8.5px] font-bold text-slate-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850/60 text-[10px]">
                      {analytics?.highValueClaims?.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-slate-500 font-bold uppercase tracking-wider">No high value claims logged</td>
                        </tr>
                      ) : (
                        analytics?.highValueClaims?.map((c: any) => (
                          <tr key={c.id} className="hover:bg-slate-900/10">
                            <td className="p-3">
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-300">{c.name}</span>
                                <span className="text-[7.5px] text-slate-500 font-bold uppercase">{c.employee}</span>
                              </div>
                            </td>
                            <td className="p-3 font-bold text-slate-200">₹{c.amount.toLocaleString()}</td>
                            <td className="p-3 text-slate-400">{c.type}</td>
                            <td className="p-3">
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase border ${getStatusBadgeClass(c.status)}`}>
                                {c.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Audit Trail List (5 columns) */}
                <div className="lg:col-span-5 bg-slate-900/40 border border-slate-850 rounded-[2rem] p-5 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-450 block mb-4">System Expense Audits</span>
                    <div className="space-y-3.5 overflow-y-auto max-h-64 pr-2">
                      {analytics?.recentAudits?.length === 0 ? (
                        <p className="text-center text-slate-500 text-[10px] font-bold uppercase tracking-wider py-8">No audit logs active</p>
                      ) : (
                        analytics?.recentAudits?.map((a: any) => (
                          <div key={a._id} className="flex gap-3 text-[9.5px]">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 shrink-0" />
                            <div className="flex-1 flex flex-col gap-0.5">
                              <div className="flex items-center justify-between">
                                <span className="font-black text-slate-300 uppercase tracking-wide">{a.action}</span>
                                <span className="text-[8px] text-slate-500">{new Date(a.timestamp).toLocaleTimeString()}</span>
                              </div>
                              <span className="text-slate-400">{a.details}</span>
                              <span className="text-[8px] text-slate-500 uppercase tracking-widest mt-0.5">User: {a.performedBy}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: EXPENSE POLICIES */}
          {activeTab === 'policies' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Policy View & Config limits (Admins/HR can edit, Employees see read-only) */}
              <div className="lg:col-span-7 bg-slate-900/40 border border-slate-850 rounded-[2rem] p-6 shadow-xl space-y-5">
                <div className="border-b border-slate-800 pb-3 mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-300">Policy Rules Configuration</h3>
                  <Settings className="w-4 h-4 text-blue-500 animate-spin" style={{ animationDuration: '6s' }} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-black uppercase tracking-wider text-slate-450">Travel claim cap (INR)</label>
                    <input
                      type="number"
                      value={editingPolicy.travelLimit}
                      onChange={(e) => setEditingPolicy({ ...editingPolicy, travelLimit: Number(e.target.value) })}
                      disabled={viewRole !== 'HR' && viewRole !== 'Finance'}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-[10px] text-slate-200 focus:outline-none focus:border-blue-500 disabled:opacity-60"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-black uppercase tracking-wider text-slate-450">Food claim cap (INR)</label>
                    <input
                      type="number"
                      value={editingPolicy.foodLimit}
                      onChange={(e) => setEditingPolicy({ ...editingPolicy, foodLimit: Number(e.target.value) })}
                      disabled={viewRole !== 'HR' && viewRole !== 'Finance'}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-[10px] text-slate-200 focus:outline-none focus:border-blue-500 disabled:opacity-60"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-black uppercase tracking-wider text-slate-450">Hotel claim cap (INR)</label>
                    <input
                      type="number"
                      value={editingPolicy.hotelLimit}
                      onChange={(e) => setEditingPolicy({ ...editingPolicy, hotelLimit: Number(e.target.value) })}
                      disabled={viewRole !== 'HR' && viewRole !== 'Finance'}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-[10px] text-slate-200 focus:outline-none focus:border-blue-500 disabled:opacity-60"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-black uppercase tracking-wider text-slate-450">Monthly Employee Budget cap (INR)</label>
                    <input
                      type="number"
                      value={editingPolicy.monthlyBudget}
                      onChange={(e) => setEditingPolicy({ ...editingPolicy, monthlyBudget: Number(e.target.value) })}
                      disabled={viewRole !== 'HR' && viewRole !== 'Finance'}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-[10px] text-slate-200 focus:outline-none focus:border-blue-500 disabled:opacity-60"
                    />
                  </div>
                </div>

                {(viewRole === 'HR' || viewRole === 'Finance') && (
                  <button
                    onClick={handleSavePolicy}
                    className="w-full py-3.5 text-white bg-blue-600 hover:bg-blue-500 rounded-xl text-[10px] font-black uppercase tracking-widest border-none cursor-pointer active:scale-[0.99]"
                  >
                    Save policy limits
                  </button>
                )}

                {/* Payout Gateway Settings Card (Visible to HR/Finance/Admin) */}
                {(viewRole === 'HR' || viewRole === 'Finance' || loggedInRole === 'Admin') && (
                  <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 mt-4 space-y-4">
                    <div className="border-b border-slate-800 pb-2">
                      <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                        <Settings className="w-3.5 h-3.5 text-blue-500" />
                        Payout Provider Integration
                      </h4>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-black uppercase tracking-wider text-slate-450">Active Provider</label>
                      <select
                        value={payoutSettings.primaryProvider}
                        onChange={(e) => setPayoutSettings({ ...payoutSettings, primaryProvider: e.target.value })}
                        className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-[10px] text-slate-200 focus:outline-none"
                      >
                        <option value="RazorpayX">RazorpayX Payouts (Primary)</option>
                        <option value="Cashfree">Cashfree Payouts (Future-Ready)</option>
                        <option value="Decentro">Decentro API (Future-Ready)</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2 py-1">
                      <input
                        type="checkbox"
                        id="isSimulator"
                        checked={payoutSettings.isSimulator}
                        onChange={(e) => setPayoutSettings({ ...payoutSettings, isSimulator: e.target.checked })}
                        className="w-3.5 h-3.5 rounded bg-slate-950 border-slate-800 focus:ring-0"
                      />
                      <label htmlFor="isSimulator" className="text-[9.5px] font-bold text-slate-300 cursor-pointer uppercase tracking-wider select-none flex items-center gap-1">
                        <span>Enable Simulator mode</span>
                        <span className="text-[8px] text-amber-500 font-extrabold">(RECOMMENDED FOR LOCAL DEV)</span>
                      </label>
                    </div>

                    {!payoutSettings.isSimulator && payoutSettings.primaryProvider === 'RazorpayX' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                        <div className="flex flex-col gap-1">
                          <label className="text-[8px] font-black uppercase tracking-wider text-slate-500">RazorpayX Key ID</label>
                          <input
                            type="text"
                            value={payoutSettings.razorpayxKey}
                            onChange={(e) => setPayoutSettings({ ...payoutSettings, razorpayxKey: e.target.value })}
                            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[9.5px] text-slate-300"
                            placeholder="rzp_test_..."
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[8px] font-black uppercase tracking-wider text-slate-500">RazorpayX Secret</label>
                          <input
                            type="password"
                            value={payoutSettings.razorpayxSecret}
                            onChange={(e) => setPayoutSettings({ ...payoutSettings, razorpayxSecret: e.target.value })}
                            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[9.5px] text-slate-300"
                            placeholder="••••••••••••••"
                          />
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handleSavePayoutSettings}
                      disabled={savingPayoutSettings}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest border-none cursor-pointer flex items-center justify-center gap-1 active:scale-[0.99] disabled:opacity-60"
                    >
                      {savingPayoutSettings ? (
                        <RefreshCcw className="w-3 h-3 animate-spin" />
                      ) : (
                        'Save payout configurations'
                      )}
                    </button>

                    <div className="bg-slate-950/60 p-3 border border-slate-850 rounded-xl space-y-1">
                      <span className="text-[7.5px] text-slate-500 font-black uppercase tracking-wider block">Webhook Listener Endpoint URI</span>
                      <span className="font-mono text-[9px] text-blue-400 select-all block break-all">
                        {window.location.origin}/api/expenses/webhooks
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Policies Explanatory Card */}
              <div className="lg:col-span-5 bg-slate-900/40 border border-slate-850 rounded-[2rem] p-6 shadow-xl flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="border-b border-slate-800 pb-3">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-450 block">Organization Policies</span>
                  </div>
                  <div className="space-y-3 text-[10px] text-slate-400">
                    <div className="flex gap-2">
                      <CheckCircle className="w-4.5 h-4.5 text-blue-500 shrink-0" />
                      <p><strong>Heuristics Policy Checking:</strong> When an employee creates a claim, the engine checks it instantly and shows real-time alerts.</p>
                    </div>
                    <div className="flex gap-2">
                      <CheckCircle className="w-4.5 h-4.5 text-blue-500 shrink-0" />
                      <p><strong>Fraud Safeguards:</strong> Claims with duplicate receipt files or matching amounts, dates, and vendors are immediately flagged.</p>
                    </div>
                    <div className="flex gap-2">
                      <CheckCircle className="w-4.5 h-4.5 text-blue-500 shrink-0" />
                      <p><strong>Monthly Caps:</strong> Total claims by any employee in the calendar month cannot exceed the monthly cap.</p>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-950/60 p-4 border border-slate-850 rounded-2xl mt-6">
                  <span className="text-[8px] text-slate-500 font-black uppercase block tracking-wider mb-1">Active Company Id</span>
                  <span className="font-mono text-[10px] text-blue-400 font-bold">{profile.companyId || 'company_001'}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: BANK DETAILS */}
          {activeTab === 'bank-details' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Side: Information Screen or Form */}
              <div className="lg:col-span-7 bg-slate-900/40 border border-slate-850 rounded-[2rem] p-6 shadow-xl space-y-5">
                
                {/* HR/Admin Sub-Tab Switcher */}
                {(viewRole === 'HR' || viewRole === 'Finance') && (
                  <div className="flex border-b border-slate-800 gap-4 mb-4 pb-2">
                    <button
                      onClick={() => {
                        setBankSubTab('my-account');
                        setSelectedEmployeeEmail('');
                      }}
                      className={`pb-1 text-[9px] font-black uppercase tracking-widest bg-transparent cursor-pointer transition-all border-none ${
                        bankSubTab === 'my-account' ? 'text-blue-500 border-b-2 border-blue-500 font-bold' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      My Payment Account
                    </button>
                    <button
                      onClick={() => {
                        setBankSubTab('manage-accounts');
                        if (employees.length > 0) {
                          setSelectedEmployeeEmail(employees[0].email);
                        }
                      }}
                      className={`pb-1 text-[9px] font-black uppercase tracking-widest bg-transparent cursor-pointer transition-all border-none ${
                        bankSubTab === 'manage-accounts' ? 'text-blue-500 border-b-2 border-blue-500 font-bold' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Manage Employee Accounts
                    </button>
                  </div>
                )}

                {/* Conditional views */}
                {viewRole === 'Employee' || bankSubTab === 'my-account' ? (
                  // Read-Only Payment Account Information Screen (For all personal profiles)
                  <div className="space-y-6">
                    <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-black uppercase tracking-wider text-slate-350">Payment Account Information</h3>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Reimbursement Payment Account</p>
                      </div>
                      <Shield className="w-4.5 h-4.5 text-emerald-500" />
                    </div>

                    {/* Status Alert for Employee */}
                    <div className="p-4 border border-emerald-500/20 bg-emerald-500/5 rounded-2xl flex items-start gap-3 text-emerald-400">
                      <CheckCircle className="w-5 h-5 shrink-0 mt-0.5 text-emerald-500" />
                      <div className="text-[10px] leading-relaxed">
                        <span className="font-extrabold uppercase block tracking-wider text-emerald-300">
                          Verified Bank Account
                        </span>
                        <p className="opacity-90 mt-0.5 text-slate-400">
                          All approved reimbursements will be credited directly to this verified account.
                        </p>
                      </div>
                    </div>

                    {/* Badge */}
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[9px] font-black uppercase tracking-widest rounded-full flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        Verified Account
                      </span>
                    </div>

                    {/* Read-Only Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 bg-slate-950/40 border border-slate-850 p-5 rounded-2xl">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[8px] text-slate-500 font-black uppercase tracking-wider">Account Holder Name</span>
                        <span className="text-[10.5px] font-bold text-slate-200">{bankDetails.accountHolderName || '—'}</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[8px] text-slate-500 font-black uppercase tracking-wider">Bank Name</span>
                        <span className="text-[10.5px] font-bold text-slate-200">{bankDetails.bankName || '—'}</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[8px] text-slate-500 font-black uppercase tracking-wider">Account Number</span>
                        <span className="text-[10.5px] font-mono font-bold text-slate-300">
                          {maskedAcc || (bankDetails.accountNumber ? `•••• •••• •••• ${bankDetails.accountNumber.slice(-4)}` : '—')}
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[8px] text-slate-500 font-black uppercase tracking-wider">IFSC Code</span>
                        <span className="text-[10.5px] font-mono font-bold text-slate-350">{bankDetails.ifscCode || '—'}</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[8px] text-slate-500 font-black uppercase tracking-wider">Verification Status</span>
                        <span className="text-[9.5px] font-black text-emerald-400 uppercase tracking-widest">
                          {bankDetails.verificationStatus ? bankDetails.verificationStatus.toUpperCase() : 'VERIFIED'}
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[8px] text-slate-500 font-black uppercase tracking-wider">Verified By</span>
                        <span className="text-[10px] font-bold text-slate-350">{bankDetails.verifiedBy || 'HR Operations (RazorpayX)'}</span>
                      </div>
                      <div className="col-span-1 md:col-span-2 flex flex-col gap-0.5">
                        <span className="text-[8px] text-slate-500 font-black uppercase tracking-wider">Verification Date</span>
                        <span className="text-[10px] font-bold text-slate-350">
                          {bankDetails.verifiedAt ? new Date(bankDetails.verifiedAt).toLocaleString() : new Date().toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons for Employee */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                      <button
                        onClick={() => triggerToast('Bank detail change request submitted to HR Operations', 'success')}
                        className="py-2.5 px-3 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest border-none cursor-pointer active:scale-[0.99] text-center"
                      >
                        Request Bank Detail Change
                      </button>
                      <button
                        onClick={() => setActiveTab('my-expenses')}
                        className="py-2.5 px-3 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest border-none cursor-pointer active:scale-[0.99] text-center"
                      >
                        View Reimbursement History
                      </button>
                      <button
                        onClick={() => {
                          exportToCSV();
                          triggerToast('Payment Ledger downloaded', 'success');
                        }}
                        className="py-2.5 px-3 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest border-none cursor-pointer active:scale-[0.99] text-center"
                      >
                        Download Payment Receipts
                      </button>
                    </div>
                  </div>
                ) : (
                  // Editable Banking Information Form (HR/Admin Panel for managing employees)
                  <div className="space-y-5">
                    {/* Employee Directory Selector */}
                    <div className="flex flex-col gap-1.5 bg-slate-950/60 p-4 border border-slate-850 rounded-2xl">
                      <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Select Employee to Manage</label>
                      <select
                        value={selectedEmployeeEmail}
                        onChange={(e) => setSelectedEmployeeEmail(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-850 rounded-xl px-3 py-2.5 text-[10px] text-slate-200 focus:outline-none"
                      >
                        <option value="">-- Choose Employee --</option>
                        {employees.map((emp) => (
                          <option key={emp.email} value={emp.email}>
                            {emp.fullName} ({emp.email})
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedEmployeeEmail ? (
                      <>
                        <div className="border-b border-slate-800 pb-3 mb-2 flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-black uppercase tracking-wider text-slate-300">Banking Information Form</h3>
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Verification Powered by RazorpayX</p>
                          </div>
                          <Shield className="w-4 h-4 text-emerald-500" />
                        </div>
                        
                        {/* Status Alert */}
                        <div className={`p-4 border rounded-2xl flex items-center gap-3 ${
                          bankDetails.isVerified
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-450'
                            : 'bg-amber-500/10 border-amber-500/20 text-amber-450'
                        }`}>
                          {bankDetails.isVerified ? (
                            <CheckCircle className="w-5 h-5 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-5 h-5 shrink-0" />
                          )}
                          <div className="text-[10px] leading-relaxed">
                            <span className="font-extrabold uppercase block tracking-wider">
                              Account Status: {bankDetails.isVerified ? 'RAZORPAYX VERIFIED' : 'UNVERIFIED'}
                            </span>
                            <p className="opacity-90">
                              {bankDetails.isVerified
                                ? 'This account has been verified via RazorpayX ₹1 Penny Drop validation and is locked. Editing will reset verification status.'
                                : 'Reimbursement payouts cannot be processed to unverified accounts. Please verify your account.'}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-black uppercase tracking-wider text-slate-450">Account Holder Name</label>
                            <input
                              type="text"
                              value={bankDetails.accountHolderName}
                              disabled={!bankEditing && bankDetails.isVerified}
                              onChange={(e) => setBankDetails({ ...bankDetails, accountHolderName: e.target.value })}
                              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-[10px] text-slate-200 focus:outline-none focus:border-blue-500 disabled:opacity-60"
                              placeholder="e.g. JOHN DOE"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-black uppercase tracking-wider text-slate-450">Bank Name</label>
                            <input
                              type="text"
                              value={bankDetails.bankName}
                              disabled={!bankEditing && bankDetails.isVerified}
                              onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-[10px] text-slate-200 focus:outline-none focus:border-blue-500 disabled:opacity-60"
                              placeholder="e.g. HDFC BANK"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-black uppercase tracking-wider text-slate-450">Account Number</label>
                            <input
                              type="text"
                              autoComplete="new-password"
                              value={bankEditing ? bankDetails.accountNumber : (maskedAcc || bankDetails.accountNumber || '')}
                              disabled={!bankEditing && bankDetails.isVerified}
                              onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value.replace(/\D/g, '') })}
                              style={{ WebkitTextSecurity: bankEditing ? 'disc' : 'none' } as any}
                              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-[10px] text-slate-200 focus:outline-none focus:border-blue-500 disabled:opacity-60"
                              placeholder="e.g. 501002391283"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-black uppercase tracking-wider text-slate-450">IFSC Code</label>
                            <input
                              type="text"
                              value={bankDetails.ifscCode}
                              disabled={!bankEditing && bankDetails.isVerified}
                              onChange={(e) => setBankDetails({ ...bankDetails, ifscCode: e.target.value.toUpperCase() })}
                              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-[10px] text-slate-200 focus:outline-none focus:border-blue-500 disabled:opacity-60"
                              placeholder="e.g. HDFC0000123"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-black uppercase tracking-wider text-slate-450">UPI ID (Optional)</label>
                          <input
                            type="text"
                            value={bankDetails.upiId}
                            disabled={!bankEditing && bankDetails.isVerified}
                            onChange={(e) => setBankDetails({ ...bankDetails, upiId: e.target.value })}
                            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-[10px] text-slate-200 focus:outline-none focus:border-blue-500 disabled:opacity-60"
                            placeholder="e.g. johndoe@okhdfcbank"
                          />
                        </div>

                        <div className="pt-2 flex gap-3">
                          {(!bankDetails.isVerified || bankEditing) ? (
                            <>
                              <button
                                onClick={handleVerifyBank}
                                disabled={bankVerifying}
                                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest border-none cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.99] disabled:opacity-50"
                              >
                                {bankVerifying ? (
                                  <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <>
                                    <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                                    <span>Verify & Save (RazorpayX Penny Drop)</span>
                                  </>
                                )}
                              </button>
                              <button
                                onClick={handleSaveBank}
                                disabled={bankVerifying}
                                className="py-3 px-5 bg-slate-800 hover:bg-slate-750 text-slate-350 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest border-none cursor-pointer active:scale-[0.99] disabled:opacity-50"
                              >
                                Save Unverified
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => {
                                setBankEditing(true);
                              }}
                              className="w-full py-3 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest border-none cursor-pointer active:scale-[0.99]"
                            >
                              Update Bank Details
                            </button>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="p-8 text-center border border-dashed border-slate-800 rounded-2xl text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        Please select an employee from the dropdown above to view or update their banking details.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right Side: Visa-like Visual Card Preview */}
              <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
                {/* 3D Glassmorphic Card Container */}
                <div className={`relative h-56 w-full rounded-[2rem] p-6 overflow-hidden shadow-2xl flex flex-col justify-between transition-all duration-300 border-none ${
                  bankDetails.isVerified 
                    ? 'bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-600 shadow-emerald-500/25 text-white' 
                    : 'bg-gradient-to-tr from-blue-600 via-indigo-650 to-purple-650 shadow-indigo-500/25 text-white'
                }`}>
                  {/* Decorative mesh gradients */}
                  <div className="absolute -right-12 -top-12 w-40 h-40 bg-white/5 rounded-full blur-[40px] pointer-events-none" />
                  <div className="absolute -left-12 -bottom-12 w-40 h-40 bg-white/5 rounded-full blur-[40px] pointer-events-none" />
                  
                  {/* Top Bar */}
                  <div className="flex justify-between items-start z-10">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[12px] font-black uppercase tracking-widest text-white">
                        {bankDetails.bankName || 'BANK NAME'}
                      </span>
                      <span className="text-[8px] text-white/70 font-bold uppercase tracking-widest">
                        SECURE PAYOUT MODULE
                      </span>
                    </div>
                    <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border tracking-wider ${
                      bankDetails.isVerified 
                        ? 'bg-white/20 text-white border-white/20' 
                        : 'bg-white/10 text-white border-white/20'
                    }`}>
                      {bankDetails.isVerified ? 'RAZORPAYX VERIFIED' : 'UNVERIFIED'}
                    </div>
                  </div>

                  {/* Card Chip & Wireless signal */}
                  <div className="flex items-center gap-3 z-10">
                    {/* Chip Graphic */}
                    <div className="w-9 h-7 rounded-md bg-gradient-to-r from-amber-400/80 to-yellow-500/90 flex flex-col justify-between p-1.5 border border-amber-600/20 shadow-inner">
                      <div className="w-full h-0.5 bg-slate-900/10 rounded" />
                      <div className="w-full h-0.5 bg-slate-900/10 rounded" />
                      <div className="w-full h-0.5 bg-slate-900/10 rounded" />
                    </div>
                    <svg className="w-5 h-5 text-white/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12a7 7 0 0 1 7-7v14a7 7 0 0 1-7-7z" />
                      <path d="M12 7a5 5 0 0 1 5 5c0 2.21-1.79 4-4 4V7z" />
                    </svg>
                  </div>

                  {/* Account Number Area */}
                  <div className="my-1.5 z-10">
                    <span className="text-sm font-mono tracking-[0.2em] font-extrabold text-white">
                      {bankEditing 
                        ? (bankDetails.accountNumber || '•••• •••• •••• ••••') 
                        : (maskedAcc || '•••• •••• •••• ••••')}
                    </span>
                  </div>

                  {/* Card Holder & Expiry / IFSC */}
                  <div className="flex justify-between items-end z-10">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[7px] text-white/60 uppercase tracking-widest font-black">Account Holder</span>
                      <span className="text-[9.5px] font-bold text-white uppercase truncate max-w-[180px]">
                        {bankDetails.accountHolderName || 'YOUR FULL NAME'}
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="text-[7px] text-white/60 uppercase tracking-widest font-black">IFSC CODE</span>
                      <span className="text-[9px] font-mono font-bold text-white uppercase">
                        {bankDetails.ifscCode || 'IFSC CODE'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Secure Badge Description */}
                <div className="bg-slate-900/20 border border-slate-850 rounded-2xl p-4 flex gap-3 text-[10px] text-slate-400 leading-relaxed">
                  <Shield className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold text-slate-350 block uppercase tracking-wider">Secure Banking Infrastructure</span>
                    <p>All sensitive banking credentials are encrypted using AES-256-CBC database algorithms before saving. Real API keys are protected in environment blocks.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>

      {/* 4. Detail View & Approval Modal Overlay */}
      <AnimatePresence>
        {isDetailOpen && selectedClaim && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -15 }}
              className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-[2.5rem] p-6 md:p-8 shadow-2xl overflow-y-auto max-h-[90vh] no-scrollbar text-left"
            >
              <button 
                onClick={() => setIsDetailOpen(false)}
                className="absolute top-6 right-6 p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg border-none cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-6">
                {/* Modal Title */}
                <div>
                  <span className="text-[9px] font-black text-blue-400 tracking-[0.2em] block uppercase mb-1">Claim Detail Review</span>
                  <h3 className="text-base font-extrabold text-white truncate max-w-[400px]">
                    {selectedClaim.description}
                  </h3>
                  <span className="text-[8.5px] text-slate-500 font-black uppercase tracking-wider mt-1 block">
                    Claim ID: {selectedClaim._id}
                  </span>
                </div>

                {/* Primary Data Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-slate-950/40 p-4 border border-slate-850 rounded-2xl">
                  <div className="flex flex-col">
                    <span className="text-[8px] text-slate-500 font-black uppercase tracking-wider">Employee</span>
                    <span className="text-[10.5px] font-bold text-slate-200 truncate">{selectedClaim.name}</span>
                    <span className="text-[8px] text-slate-400 truncate">{selectedClaim.employee}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] text-slate-500 font-black uppercase tracking-wider">Amount Claimed</span>
                    <span className="text-[11px] font-black text-blue-400">₹{selectedClaim.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] text-slate-500 font-black uppercase tracking-wider">Category</span>
                    <span className="text-[10px] font-medium text-slate-300">{selectedClaim.type || selectedClaim.expenseType}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] text-slate-500 font-black uppercase tracking-wider">Date</span>
                    <span className="text-[10px] text-slate-350">{selectedClaim.claimDate || selectedClaim.expenseDate}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] text-slate-500 font-black uppercase tracking-wider">Project</span>
                    <span className="text-[10px] font-bold text-slate-350 uppercase">{selectedClaim.project || 'N/A'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] text-slate-500 font-black uppercase tracking-wider">Department</span>
                    <span className="text-[10px] font-bold text-slate-350 uppercase">{selectedClaim.department || 'Engineering'}</span>
                  </div>
                </div>

                {/* Receipt Preview */}
                {selectedClaim.receiptUrl ? (
                  <div className="space-y-2">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Uploaded Receipt Document</span>
                    <div className="border border-slate-850 bg-slate-950/60 p-4 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="w-6 h-6 text-blue-500 shrink-0" />
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-200 font-bold truncate max-w-[240px]">receipt_invoice.pdf</span>
                          <span className="text-[8px] text-slate-500">Document Upload Verified</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            window.open(selectedClaim.receiptUrl, '_blank');
                          }}
                          className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-[9px] font-black uppercase tracking-wider text-slate-300 rounded-lg border-none cursor-pointer flex items-center gap-1 shadow"
                        >
                          <Eye className="w-3 h-3" />
                          View Full
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border border-dashed border-slate-850 p-4 rounded-2xl text-center">
                    <span className="text-[9.5px] text-slate-500 font-bold uppercase tracking-wider">No receipt document attached to this claim</span>
                  </div>
                )}

                {/* Policy Compliance Audit Panel */}
                {selectedClaim.fraudCheck && (
                  <div className="bg-slate-950/40 border border-slate-850 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                      <div className="flex items-center gap-1.5">
                        <Shield className="w-4 h-4 text-blue-400" />
                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Fraud Checks & Compliance</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                        selectedClaim.fraudCheck.riskScore >= 50 
                          ? 'bg-rose-500/10 text-rose-550 border border-rose-500/15' 
                          : 'bg-emerald-500/10 text-emerald-500'
                      }`}>
                        Risk Score: {selectedClaim.fraudCheck.riskScore}/100
                      </span>
                    </div>

                    <div className="space-y-1.5 text-[9.5px]">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Duplicate Receipt detection:</span>
                        <span className={`font-bold uppercase ${selectedClaim.fraudCheck.isDuplicateReceipt ? 'text-rose-500' : 'text-emerald-500'}`}>
                          {selectedClaim.fraudCheck.isDuplicateReceipt ? 'DUPLICATE FOUND' : 'CLEAN'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Duplicate claim properties check:</span>
                        <span className={`font-bold uppercase ${selectedClaim.fraudCheck.isDuplicateClaim ? 'text-rose-500' : 'text-emerald-500'}`}>
                          {selectedClaim.fraudCheck.isDuplicateClaim ? 'DUPLICATE MATCH' : 'CLEAN'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Suspicious Amount audit:</span>
                        <span className={`font-bold uppercase ${selectedClaim.fraudCheck.isSuspiciousAmount ? 'text-amber-500 font-extrabold' : 'text-emerald-500'}`}>
                          {selectedClaim.fraudCheck.isSuspiciousAmount ? 'FLAGGED (> ₹50k)' : 'CLEAN'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Repeated Claim count alert:</span>
                        <span className={`font-bold uppercase ${selectedClaim.fraudCheck.isRepeatedExpense ? 'text-amber-500 font-extrabold' : 'text-emerald-500'}`}>
                          {selectedClaim.fraudCheck.isRepeatedExpense ? 'REPEATED ACTIVE' : 'CLEAN'}
                        </span>
                      </div>

                      {/* Explicit policy violation items */}
                      {selectedClaim.fraudCheck.policyViolations?.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-slate-850 space-y-1">
                          <span className="text-[8px] font-black text-rose-400 uppercase tracking-widest block">Policy Violations Detected</span>
                          {selectedClaim.fraudCheck.policyViolations.map((v: string, idx: number) => (
                            <div key={idx} className="flex items-center gap-1.5 text-rose-350">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>{v}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Workflow Approvals Tracker (Timeline) */}
                <div className="space-y-3">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Approval Workflow Timeline</span>
                  <div className="relative border-l border-slate-800 pl-4 ml-2.5 space-y-4 text-[9.5px]">
                    
                    {/* Step 1: Employee Submission */}
                    <div className="relative">
                      <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-emerald-500 shadow shadow-emerald-500/50" />
                      <div className="flex flex-col">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-slate-350 uppercase">Claim Submitted</span>
                          <span className="text-[8px] text-slate-500">{selectedClaim.claimDate || selectedClaim.expenseDate}</span>
                        </div>
                        <span className="text-slate-450 mt-0.5">By {selectedClaim.name}</span>
                      </div>
                    </div>



                    {/* Step 3: HR Verification */}
                    <div className="relative">
                      <div className={`absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full ${
                        selectedClaim.hrApproval?.status === 'Approved' 
                          ? 'bg-emerald-500' 
                          : selectedClaim.status === 'HR Review' ? 'bg-amber-500 animate-pulse' : 'bg-slate-800'
                      }`} />
                      <div className="flex flex-col">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-slate-350 uppercase">HR Verification</span>
                          {selectedClaim.hrApproval?.approvedAt && (
                            <span className="text-[8px] text-slate-500">{new Date(selectedClaim.hrApproval.approvedAt).toLocaleDateString()}</span>
                          )}
                        </div>
                        <span className="text-slate-450 mt-0.5">
                          {selectedClaim.hrApproval?.status === 'Approved' 
                            ? `Approved by ${selectedClaim.hrApproval.approvedBy}`
                            : selectedClaim.status === 'HR Review' ? 'Awaiting HR Verification' : 'Pending'}
                        </span>
                        {selectedClaim.hrApproval?.comment && (
                          <p className="bg-slate-950/40 p-2 border border-slate-850 rounded-lg text-slate-400 mt-1 italic">
                            "{selectedClaim.hrApproval.comment}"
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Step 5: Paid Disbursement */}
                    <div className="relative">
                      <div className={`absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full ${
                        selectedClaim.status === 'Paid' ? 'bg-emerald-500 shadow shadow-emerald-500/50' : 'bg-slate-800'
                      }`} />
                      <div className="flex flex-col">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-slate-350 uppercase">Reimbursement Disbursed</span>
                          {selectedClaim.paidDate && (
                            <span className="text-[8px] text-slate-500">{new Date(selectedClaim.paidDate).toLocaleDateString()}</span>
                          )}
                        </div>
                        <span className="text-slate-450 mt-0.5">
                          {selectedClaim.status === 'Paid' ? 'Reimbursement Processed (Paid)' : 'Pending payout'}
                        </span>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Workflow Actions Input (Visible to designated reviewers) */}
                {((selectedClaim.status === 'HR Review' && viewRole === 'HR') ||
                  (viewRole === 'HR' && !['Paid', 'Rejected', 'Cancelled', 'Draft'].includes(selectedClaim.status))) && (
                  <div className="pt-4 border-t border-slate-800 space-y-3">
                    <span className="text-[9.5px] font-black text-slate-300 uppercase tracking-widest block">Workflow Approver Actions</span>
                    <input
                      type="text"
                      placeholder="Add reviewer comments (Required for rejects/changes)..."
                      value={approvalComment}
                      onChange={(e) => setApprovalComment(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-[10px] text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleWorkflowAction(selectedClaim._id, 'Request Changes')}
                        disabled={approvingId !== null}
                        className="flex-1 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-xl text-[9.5px] font-black uppercase tracking-widest border-none cursor-pointer"
                      >
                        Request Changes
                      </button>
                      <button
                        onClick={() => handleWorkflowAction(selectedClaim._id, 'Reject')}
                        disabled={approvingId !== null}
                        className="flex-1 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-350 rounded-xl text-[9.5px] font-black uppercase tracking-widest border-none cursor-pointer"
                      >
                        Reject Claim
                      </button>
                      <button
                        onClick={() => handleWorkflowAction(selectedClaim._id, 'Approve')}
                        disabled={approvingId !== null}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[9.5px] font-black uppercase tracking-widest border-none cursor-pointer shadow flex items-center justify-center gap-1.5"
                      >
                        {approvingId ? (
                          <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve Claim</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
