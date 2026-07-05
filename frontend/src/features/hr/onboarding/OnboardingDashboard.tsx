import React, { useState, useEffect } from 'react';
import { 
  Users, FileText, Plus, Search, Filter, Calendar, Mail, 
  TrendingUp, AlertCircle, CheckCircle, Clock3, User, Landmark, 
  Check, X, ArrowRight, Eye, ExternalLink, Loader2, Sparkles, AlertTriangle, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { StatCard } from '../../admin/dashboard/components/StatCard';

interface OnboardingRequestData {
  _id: string;
  companyId: string;
  inviteEmail: string;
  inviteName: string;
  designation: string;
  department: string;
  joiningDate: string;
  inviteToken: string;
  status: 'Draft' | 'Invited' | 'Profile Pending' | 'Documents Pending' | 'Verification Pending' | 'Approved' | 'Activated' | 'Completed' | 'Rejected';
  createdAt: string;
  updatedAt: string;
  employmentType?: string;
  personalInfo?: {
    fullName: string;
    dateOfBirth: string;
    gender: string;
    address: string;
    city?: string;
    state?: string;
    country?: string;
    emergencyContactName?: string;
    emergencyContactNumber?: string;
    emergencyContact?: string;
  };
  documents?: Array<{
    name: string;
    fileUrl: string;
    status: 'Pending' | 'Verified' | 'Rejected';
    rejectedReason?: string;
    uploadedAt?: string;
  }>;
  bankDetails?: {
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    upiId?: string;
    status: 'Pending' | 'Verified' | 'Rejected';
    pennyDropVerified?: boolean;
  };
  professionalInfo?: {
    education?: string;
    experience?: string;
    skills?: string[];
    linkedinProfile?: string;
    certifications?: string;
  };
  activatedEmployeeId?: string;
  roleAssigned?: string;
}

interface AnalyticsData {
  newJoinersThisMonth: number;
  pendingOnboarding: number;
  completedOnboarding: number;
  pendingDocsCount: number;
  avgOnboardingDays: number;
  deptHiring: Record<string, number>;
}

export function OnboardingDashboard() {
  const [requests, setRequests] = useState<OnboardingRequestData[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    newJoinersThisMonth: 0,
    pendingOnboarding: 0,
    completedOnboarding: 0,
    pendingDocsCount: 0,
    avgOnboardingDays: 0,
    deptHiring: {}
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'invited' | 'profile_pending' | 'docs_pending' | 'verification_pending' | 'approved' | 'completed' | 'rejected'>('all');
  
  // Modals
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<OnboardingRequestData | null>(null);

  // Invite Form State
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [designation, setDesignation] = useState('');
  const [department, setDepartment] = useState('');
  const [joiningDate, setJoiningDate] = useState('');
  const [employmentType, setEmploymentType] = useState('Full-Time');
  const [inviteWorkEmailPassword, setInviteWorkEmailPassword] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  // Document verification modal inputs
  const [rejectReasonDocName, setRejectReasonDocName] = useState<string | null>(null);
  const [rejectReasonText, setRejectReasonText] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Rejection / Changes feedback
  const [actionFeedback, setActionFeedback] = useState('');
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);

  // Activation role assignment
  const [activationRole, setActivationRole] = useState('Employee');
  const [activationDept, setActivationDept] = useState('');
  const [activationDesig, setActivationDesig] = useState('');
  const [workEmailPassword, setWorkEmailPassword] = useState('');
  const [isActivating, setIsActivating] = useState(false);

  const fetchOnboardingData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('hr_system_token');
      const headers = {
        'Authorization': `Bearer ${token}`
      };

      const [reqsRes, analyticsRes] = await Promise.all([
        fetch('/api/onboarding', { headers }),
        fetch('/api/onboarding/analytics', { headers })
      ]);

      if (reqsRes.ok) {
        const reqsData = await reqsRes.json();
        setRequests(reqsData.data || []);
      }

      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setAnalytics(analyticsData);
      }
    } catch (err) {
      console.error('Error fetching onboarding data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOnboardingData();
  }, []);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteName || !designation || !department || !joiningDate) {
      alert('Please fill out all fields.');
      return;
    }

    try {
      setIsInviting(true);
      const token = localStorage.getItem('hr_system_token');
      const res = await fetch('/api/onboarding/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          inviteEmail,
          inviteName,
          designation,
          department,
          joiningDate,
          employmentType,
          workEmailPassword: inviteWorkEmailPassword
        })
      });

      const result = await res.json();
      if (!res.ok) {
        alert(result.error || 'Failed to send invitation');
        return;
      }

      alert('Invitation sent successfully!');
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteName('');
      setDesignation('');
      setDepartment('');
      setJoiningDate('');
      setEmploymentType('Full-Time');
      setInviteWorkEmailPassword('');
      fetchOnboardingData();
    } catch (err) {
      console.error(err);
      alert('An error occurred while sending the invitation.');
    } finally {
      setIsInviting(false);
    }
  };

  const handleVerifyDocument = async (docName: string, status: 'Verified' | 'Rejected') => {
    if (!selectedRequest) return;
    if (status === 'Rejected' && !rejectReasonText) {
      setRejectReasonDocName(docName);
      return;
    }

    try {
      setIsVerifying(true);
      const token = localStorage.getItem('hr_system_token');
      const res = await fetch(`/api/onboarding/${selectedRequest._id}/verify-document`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          docName,
          status,
          rejectedReason: status === 'Rejected' ? rejectReasonText : undefined
        })
      });

      const result = await res.json();
      if (!res.ok) {
        alert(result.error || 'Failed to update document status');
        return;
      }

      setSelectedRequest(result.request);
      setRequests(prev => prev.map(r => r._id === result.request._id ? result.request : r));
      setRejectReasonDocName(null);
      setRejectReasonText('');
      fetchOnboardingData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifyBank = async (status: 'Verified' | 'Rejected') => {
    if (!selectedRequest) return;

    try {
      setIsVerifying(true);
      const token = localStorage.getItem('hr_system_token');
      const res = await fetch(`/api/onboarding/${selectedRequest._id}/verify-bank`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      const result = await res.json();
      if (!res.ok) {
        alert(result.error || 'Failed to update bank verification status');
        return;
      }

      setSelectedRequest(result.request);
      setRequests(prev => prev.map(r => r._id === result.request._id ? result.request : r));
      fetchOnboardingData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleUpdateStatus = async (status: 'Rejected' | 'Profile Pending' | 'Documents Pending' | 'Verification Pending') => {
    if (!selectedRequest) return;
    try {
      setIsStatusUpdating(true);
      const token = localStorage.getItem('hr_system_token');
      const res = await fetch(`/api/onboarding/${selectedRequest._id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status,
          feedback: actionFeedback
        })
      });
      const result = await res.json();
      if (!res.ok) {
        alert(result.error || 'Failed to update status');
        return;
      }
      alert(`Candidate status updated to: ${status}`);
      setSelectedRequest(null);
      setActionFeedback('');
      fetchOnboardingData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsStatusUpdating(false);
    }
  };

  const handleRemindCandidate = async (reqId: string) => {
    try {
      const token = localStorage.getItem('hr_system_token');
      const res = await fetch(`/api/onboarding/${reqId}/remind`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        alert('Reminder email sent successfully!');
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to send reminder email');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to send reminder');
    }
  };

  const handleActivateEmployee = async () => {
    if (!selectedRequest) return;

    try {
      setIsActivating(true);
      const token = localStorage.getItem('hr_system_token');
      const res = await fetch(`/api/onboarding/${selectedRequest._id}/activate`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          role: activationRole,
          department: activationDept || selectedRequest.department,
          designation: activationDesig || selectedRequest.designation,
          workEmailPassword: workEmailPassword || ''
        })
      });

      const result = await res.json();
      if (!res.ok) {
        alert(result.error || 'Activation failed');
        return;
      }

      alert(`Employee Activated Successfully! Assigned ID: ${result.empId}`);
      setSelectedRequest(null);
      fetchOnboardingData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsActivating(false);
    }
  };

  const openActivationSetup = (req: any) => {
    setSelectedRequest(req);
    setActivationDept(req.department);
    setActivationDesig(req.designation);
    setActivationRole('Employee');
    setWorkEmailPassword(req.workEmailPasswordPlain || '');
    setActionFeedback('');
  };

  // Filter list matching active Tab
  const getFilteredRequests = () => {
    let list = requests;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(r => 
        r.inviteName.toLowerCase().includes(q) ||
        r.inviteEmail.toLowerCase().includes(q) ||
        r.designation.toLowerCase().includes(q) ||
        r.department.toLowerCase().includes(q)
      );
    }

    switch (activeTab) {
      case 'invited':
        return list.filter(r => r.status === 'Invited');
      case 'profile_pending':
        return list.filter(r => r.status === 'Profile Pending');
      case 'docs_pending':
        return list.filter(r => r.status === 'Documents Pending');
      case 'verification_pending':
        return list.filter(r => r.status === 'Verification Pending');
      case 'approved':
        return list.filter(r => r.status === 'Approved');
      case 'completed':
        return list.filter(r => ['Activated', 'Completed'].includes(r.status));
      case 'rejected':
        return list.filter(r => r.status === 'Rejected');
      default:
        return list;
    }
  };

  const filteredRequests = getFilteredRequests();

  // Metrics Count
  const pendingInvitations = requests.filter(r => r.status === 'Invited').length;
  const pendingProfiles = requests.filter(r => r.status === 'Profile Pending').length;
  const pendingDocs = requests.filter(r => r.status === 'Documents Pending').length;
  const pendingVerification = requests.filter(r => r.status === 'Verification Pending').length;
  const completedOnboarding = requests.filter(r => ['Activated', 'Completed'].includes(r.status)).length;

  return (
    <div className="p-6 space-y-6 text-slate-800 dark:text-slate-200 min-h-screen bg-transparent dark:bg-transparent font-sans">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-900 pb-6">
        <div>
          <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest block">HR Administrative Control</span>
          <h1 className="text-xl font-black uppercase text-white tracking-tight mt-1 font-outfit">Onboarding Center</h1>
          <p className="text-xs text-slate-400 mt-1">Redesigned two-stage employee onboarding. Review self-setup wizard submissions and activate logins.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchOnboardingData}
            className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-850 text-slate-400 hover:text-white cursor-pointer shrink-0 transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowInviteModal(true)}
            className="saas-btn-primary px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-lg shadow-blue-500/10 hover:shadow-xl hover:scale-[1.02] transition-all text-[10px] font-black uppercase tracking-wider shrink-0 cursor-pointer border-none"
          >
            <Plus className="w-4 h-4" /> Invite Candidate
          </button>
        </div>
      </div>

      {/* KPI Cards section - 5 column layout */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard 
          icon={Mail} 
          label="Pending Invitations" 
          value={pendingInvitations} 
          trend="Token dispatched" 
          trendType="neutral"
          color="bg-blue-500" 
        />
        <StatCard 
          icon={User} 
          label="Pending Profiles" 
          value={pendingProfiles} 
          trend="Filling setup step 1" 
          trendType="neutral"
          color="bg-orange-500" 
        />
        <StatCard 
          icon={FileText} 
          label="Pending Documents" 
          value={pendingDocs} 
          trend="Uploading gov IDs" 
          trendType="neutral"
          color="bg-amber-500" 
        />
        <StatCard 
          icon={Clock3} 
          label="Pending Verification" 
          value={pendingVerification} 
          trend="Needs HR review" 
          trendType="neutral"
          color="bg-indigo-500" 
        />
        <StatCard 
          icon={CheckCircle} 
          label="Completed Onboarding" 
          value={completedOnboarding} 
          trend="Active system logins" 
          trendType="neutral"
          color="bg-emerald-500" 
        />
      </div>

      {/* Main Body - Search, Filter Tabs & Candidate List */}
      <div className="bg-slate-900 border border-slate-800/85 rounded-3xl overflow-hidden shadow-xl">
        
        {/* Search & Tabs Controls */}
        <div className="p-5 border-b border-slate-800/60 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          
          {/* Navigation Filter Tabs */}
          <div className="premium-nav-container">
            {[
              { id: 'all', label: 'All' },
              { id: 'invited', label: 'Invited' },
              { id: 'profile_pending', label: 'Profile Pending' },
              { id: 'docs_pending', label: 'Docs Pending' },
              { id: 'verification_pending', label: 'Verification Pending' },
              { id: 'approved', label: 'Approved' },
              { id: 'completed', label: 'Completed' },
              { id: 'rejected', label: 'Rejected' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "premium-nav-item active:scale-[0.98]",
                  activeTab === tab.id ? "premium-nav-item-active" : ""
                )}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full xl:w-64 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search candidate name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="saas-input w-full pl-9 pr-4 py-2 text-xs"
            />
          </div>
        </div>

        {/* Candidate List Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-7 h-7 text-blue-500 animate-spin" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading Candidates...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="py-20 text-center">
              <Users className="w-8 h-8 text-slate-650 mx-auto" />
              <p className="text-xs text-slate-400 mt-2 font-medium">No candidates found matching the selected filter.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-850 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                  <th className="py-3 px-5">Candidate Name</th>
                  <th className="py-3 px-5">Designation & Dept</th>
                  <th className="py-3 px-5">Joining Date</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5">Penny Drop</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((req) => {
                  const statusColors = {
                    Draft: 'bg-slate-800 text-slate-400 border-slate-700',
                    Invited: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                    'Profile Pending': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                    'Documents Pending': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
                    'Verification Pending': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
                    Approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                    Activated: 'bg-emerald-600 text-white border-transparent',
                    Completed: 'bg-emerald-700 text-white border-transparent',
                    Rejected: 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  }[req.status] || 'bg-slate-855 text-slate-350';

                  const pennyDropStatus = req.bankDetails?.pennyDropVerified 
                    ? <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-400 uppercase">✓ Verified</span>
                    : req.bankDetails?.accountNumber
                      ? <span className="inline-flex items-center gap-1 text-[9px] font-black text-amber-500 uppercase">Pending Verification</span>
                      : <span className="inline-flex items-center gap-1 text-[9px] font-black text-slate-500 uppercase">Not Provided</span>;

                  const canRemind = ['Invited', 'Profile Pending', 'Documents Pending'].includes(req.status);

                  return (
                    <tr key={req._id} className="border-b border-slate-855/60 hover:bg-slate-950/20 transition-colors">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold uppercase text-xs">
                            {req.inviteName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-white leading-none mb-1">{req.inviteName}</p>
                            <p className="text-[10px] text-slate-400 leading-none">{req.inviteEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <div>
                          <p className="font-semibold text-slate-200 leading-none mb-1">{req.designation}</p>
                          <p className="text-[10px] text-slate-400 leading-none">{req.department} • <span className="text-slate-500 font-mono text-[9px]">{req.employmentType || 'Full-Time'}</span></p>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <span className="text-slate-300 flex items-center gap-1 text-[11px]">
                          <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          {new Date(req.joiningDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <span className={cn("inline-flex items-center px-2 py-0.5 rounded-lg border text-[8.5px] font-black uppercase tracking-wider", statusColors)}>
                          {req.status}
                        </span>
                      </td>
                      <td className="py-4 px-5">{pennyDropStatus}</td>
                      <td className="py-4 px-5 text-right space-x-1.5">
                        {canRemind && (
                          <button
                            onClick={() => handleRemindCandidate(req._id)}
                            className="px-2 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-[9px] font-black uppercase tracking-wider text-slate-300 cursor-pointer transition-colors inline-flex items-center gap-1"
                            title="Send email reminder to complete setup"
                          >
                            <Mail className="w-3 h-3 text-slate-400" /> Remind
                          </button>
                        )}
                        <button
                          onClick={() => openActivationSetup(req)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 rounded-xl text-[9px] font-black uppercase tracking-wider text-slate-250 cursor-pointer transition-colors active:scale-95 inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Analytics Mix Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-5 shadow-xl">
          <div className="flex items-center gap-2 border-b border-slate-900 pb-3 mb-4">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <h3 className="text-xs font-black uppercase tracking-wider text-white">Department Joining Distribution</h3>
          </div>
          <div className="space-y-3.5">
            {Object.keys(analytics.deptHiring).length === 0 ? (
              <p className="text-[11px] text-slate-500">No joiner distribution data to plot.</p>
            ) : (
              Object.entries(analytics.deptHiring).map(([dept, count]) => {
                const total = Object.values(analytics.deptHiring).reduce((a, b) => a + b, 0) || 1;
                const percent = Math.round((count / total) * 100);
                return (
                  <div key={dept} className="space-y-1 text-xs">
                    <div className="flex justify-between font-semibold text-slate-350">
                      <span>{dept}</span>
                      <span className="font-bold text-white">{count} Candidates ({percent}%)</span>
                    </div>
                    <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-850/50">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full" 
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-5 shadow-xl">
          <div className="flex items-center gap-2 border-b border-slate-900 pb-3 mb-4">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <h3 className="text-xs font-black uppercase tracking-wider text-white">Onboarding Funnel Transition</h3>
          </div>
          <div className="space-y-3 text-xs">
            {[
              { stage: 'Total Invitations Sent', count: requests.length, color: 'from-blue-650 to-blue-500' },
              { stage: 'Self Setup Profiles Done', count: requests.filter(r => !['Invited', 'Draft'].includes(r.status)).length, color: 'from-sky-600 to-sky-500' },
              { stage: 'Documents Uploaded / Review', count: requests.filter(r => ['Documents Pending', 'Verification Pending', 'Approved', 'Activated', 'Completed'].includes(r.status)).length, color: 'from-indigo-600 to-indigo-500' },
              { stage: 'Active Portal Logins', count: completedOnboarding, color: 'from-emerald-600 to-emerald-500' }
            ].map((funnel, index) => {
              const maxVal = requests.length || 1;
              const widthPct = Math.round((funnel.count / maxVal) * 100);
              return (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between font-semibold text-slate-400">
                    <span>{funnel.stage}</span>
                    <span className="font-bold text-white">{funnel.count}</span>
                  </div>
                  <div className="h-6 w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-850 flex items-center px-1.5 relative">
                    <div 
                      className={`h-4.5 bg-gradient-to-r ${funnel.color} rounded-lg transition-all`}
                      style={{ width: `${Math.max(widthPct, 4)}%` }}
                    />
                    <span className="absolute right-3.5 text-[9px] font-black text-slate-500 uppercase tracking-widest">{widthPct}% conversion</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Invite Candidate Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[900] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl relative"
            >
              <div className="p-6 border-b border-slate-800/60 flex justify-between items-center bg-slate-950/40">
                <div>
                  <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest block">Invitation Workflow</span>
                  <h3 className="text-sm font-black text-white uppercase mt-0.5 tracking-tight font-outfit">Send Onboarding Invite</h3>
                </div>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="p-1.5 bg-slate-950 border border-slate-850 hover:bg-slate-855 rounded-lg text-slate-450 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSendInvite} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Work Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="candidate@workemail.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="saas-input w-full p-2.5 text-xs text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Work Email Password (Optional)</label>
                  <input
                    type="text"
                    placeholder="Enter password..."
                    value={inviteWorkEmailPassword}
                    onChange={(e) => setInviteWorkEmailPassword(e.target.value)}
                    className="saas-input w-full p-2.5 text-xs text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Employee Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter legal name..."
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    className="saas-input w-full p-2.5 text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Designation *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Software Engineer"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      className="saas-input w-full p-2.5 text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Department *</label>
                    <select
                      required
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="saas-input w-full p-2.5 text-xs text-white cursor-pointer"
                    >
                      <option value="">Choose Dept...</option>
                      <option value="Engineering">Engineering</option>
                      <option value="Product">Product</option>
                      <option value="HR / Admin">HR / Admin</option>
                      <option value="Finance">Finance</option>
                      <option value="Sales">Sales</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Customer Support">Customer Support</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Employment Type *</label>
                    <select
                      value={employmentType}
                      onChange={(e) => setEmploymentType(e.target.value)}
                      className="saas-input w-full p-2.5 text-xs text-white cursor-pointer"
                    >
                      <option value="Full-Time">Full-Time</option>
                      <option value="Part-Time">Part-Time</option>
                      <option value="Contract">Contract</option>
                      <option value="Internship">Internship</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Proposed Joining Date *</label>
                    <input
                      type="date"
                      required
                      value={joiningDate}
                      onChange={(e) => setJoiningDate(e.target.value)}
                      className="saas-input w-full p-2.5 text-xs text-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isInviting}
                  className="saas-btn-primary w-full justify-center py-3 text-[10px]"
                >
                  {isInviting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Dispatch Invitation Email'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Inspect & Manage Verification Side Panel/Modal */}
      <AnimatePresence>
        {selectedRequest && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[900] flex justify-end">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="bg-slate-900 border-l border-slate-800 w-full max-w-5xl h-screen flex flex-col overflow-hidden shadow-2xl relative"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-800/60 flex justify-between items-center bg-slate-950/40 shrink-0">
                <div>
                  <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest block">Candidate Verification & Activation</span>
                  <h3 className="text-sm font-black text-white uppercase mt-0.5 tracking-tight font-outfit">
                    Review {selectedRequest.inviteName}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="p-1.5 bg-slate-950 border border-slate-850 hover:bg-slate-850 rounded-lg text-slate-450 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body - Two column layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 flex-1 overflow-hidden min-h-0">
                
                {/* Left Column: Profile info & Documents list */}
                <div className="lg:col-span-7 p-4 border-r border-slate-800/60 space-y-4 overflow-y-auto max-h-full scrollbar-thin scrollbar-thumb-slate-800 min-h-0">
                  <div>
                    <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Candidate Profile details</h4>
                    <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950 p-3 border border-slate-850 rounded-2xl">
                      <div>
                        <p className="text-slate-400">Date of Birth</p>
                        <p className="font-bold text-white mt-0.5">{selectedRequest.personalInfo?.dateOfBirth || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Gender</p>
                        <p className="font-bold text-white mt-0.5">{selectedRequest.personalInfo?.gender || 'Not provided'}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-slate-400">Emergency Contact</p>
                        <p className="font-bold text-white mt-0.5">
                          {selectedRequest.personalInfo?.emergencyContactName ? (
                            `${selectedRequest.personalInfo.emergencyContactName} (${selectedRequest.personalInfo.emergencyContactNumber || ''})`
                          ) : (
                            selectedRequest.personalInfo?.emergencyContact || 'Not provided'
                          )}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-slate-400">Permanent Address</p>
                        <p className="font-bold text-white mt-0.5 leading-relaxed">
                          {selectedRequest.personalInfo?.address ? (
                            `${selectedRequest.personalInfo.address}, ${selectedRequest.personalInfo.city || ''}, ${selectedRequest.personalInfo.state || ''}, ${selectedRequest.personalInfo.country || ''}`
                          ) : (
                            'Not provided'
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Professional & Qualifications Section */}
                  <div>
                    <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Qualifications & Professional Info</h4>
                    <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950 p-3 border border-slate-850 rounded-2xl">
                      <div className="col-span-2">
                        <p className="text-slate-400">Highest Education</p>
                        <p className="font-bold text-white mt-0.5">{selectedRequest.professionalInfo?.education || 'Not provided'}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-slate-400">Experience Profile</p>
                        <p className="font-bold text-white mt-0.5">{selectedRequest.professionalInfo?.experience || 'Not provided'}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-slate-400">Key Skills</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedRequest.professionalInfo?.skills && selectedRequest.professionalInfo.skills.length > 0 ? (
                            selectedRequest.professionalInfo.skills.map((skill, i) => (
                              <span key={i} className="px-2 py-0.5 bg-slate-850 text-slate-300 rounded text-[10px] border border-slate-800">
                                {skill}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-500 italic">No skills listed</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-slate-400">LinkedIn Profile</p>
                        {selectedRequest.professionalInfo?.linkedinProfile ? (
                          <a href={selectedRequest.professionalInfo.linkedinProfile} target="_blank" rel="noreferrer" className="text-blue-450 hover:underline font-bold mt-0.5 flex items-center gap-1">
                            View Profile <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <p className="text-slate-500 mt-0.5">Not provided</p>
                        )}
                      </div>
                      <div>
                        <p className="text-slate-400">Certifications</p>
                        <p className="font-bold text-white mt-0.5">{selectedRequest.professionalInfo?.certifications || 'None listed'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Documents Section */}
                  <div className="space-y-2">
                    <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Document Verification</h4>
                    
                    {(!selectedRequest.documents || selectedRequest.documents.length === 0) ? (
                      <p className="text-xs text-slate-455 italic">Candidate has not uploaded any documents yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {selectedRequest.documents.map((doc) => (
                          <div key={doc.name} className="p-2.5 px-3 bg-slate-950 border border-slate-850 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                            <div className="min-w-0">
                              <p className="font-bold text-white text-xs">{doc.name}</p>
                              {doc.uploadedAt && (
                                <p className="text-[9px] text-slate-500 mt-0.5">
                                  Uploaded: {new Date(doc.uploadedAt).toLocaleString()}
                                </p>
                              )}
                              {doc.status === 'Rejected' && doc.rejectedReason && (
                                <p className="text-[9px] text-rose-400 font-medium mt-1">
                                  Reason: {doc.rejectedReason}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <a
                                href={doc.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-[9px] font-black uppercase tracking-wider text-slate-300 rounded-xl cursor-pointer flex items-center gap-1 transition-colors"
                              >
                                <Eye className="w-3 h-3" /> View
                              </a>

                              {doc.status === 'Verified' ? (
                                <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black text-emerald-400 rounded-lg uppercase tracking-wider">
                                  ✓ Verified
                                </span>
                              ) : doc.status === 'Rejected' ? (
                                <span className="px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 text-[9px] font-black text-rose-400 rounded-lg uppercase tracking-wider">
                                  Rejected
                                </span>
                              ) : (
                                <div className="flex gap-1.5">
                                  <button
                                    onClick={() => handleVerifyDocument(doc.name, 'Verified')}
                                    className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer border-none"
                                    title="Approve"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleVerifyDocument(doc.name, 'Rejected')}
                                    className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg cursor-pointer border-none"
                                    title="Reject"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Reject Reason input prompt */}
                    {rejectReasonDocName && (
                      <div className="p-4 bg-rose-950/20 border border-rose-500/20 rounded-2xl space-y-2 text-xs">
                        <p className="font-bold text-rose-400 uppercase text-[9px] tracking-wider">Provide Rejection Reason for {rejectReasonDocName}</p>
                        <input
                          type="text"
                          placeholder="e.g. Identity photo is blurry, please re-upload..."
                          value={rejectReasonText}
                          onChange={(e) => setRejectReasonText(e.target.value)}
                          className="saas-input w-full p-2.5 text-xs text-white"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setRejectReasonDocName(null);
                              setRejectReasonText('');
                            }}
                            className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer border-none"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleVerifyDocument(rejectReasonDocName, 'Rejected')}
                            className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer border-none"
                          >
                            Submit Rejection
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Bank Details & Verification / Status Update forms */}
                <div className="lg:col-span-5 p-4 space-y-4 overflow-y-auto max-h-full scrollbar-thin scrollbar-thumb-slate-800 min-h-0">
                  {/* Bank info */}
                  <div className="space-y-2.5">
                    <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Bank Verification</h4>
                    
                    {!selectedRequest.bankDetails || !selectedRequest.bankDetails.accountNumber ? (
                      <p className="text-xs text-slate-455 italic">Candidate has not submitted bank details yet.</p>
                    ) : (
                      <div className="bg-slate-950 p-3 border border-slate-850 rounded-2xl space-y-2.5 text-xs">
                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <span className="text-slate-400 block">Bank Name</span>
                            <span className="font-bold text-white block mt-0.5">{selectedRequest.bankDetails.bankName}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">IFSC Code</span>
                            <span className="font-bold text-white block mt-0.5 font-mono uppercase">{selectedRequest.bankDetails.ifscCode}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-slate-400 block">Account Holder Name</span>
                            <span className="font-bold text-white block mt-0.5">{selectedRequest.bankDetails.accountHolderName}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Account Number</span>
                            <span className="font-bold text-white block mt-0.5">{selectedRequest.bankDetails.accountNumber}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">UPI ID</span>
                            <span className="font-bold text-white block mt-0.5 font-mono lowercase">{selectedRequest.bankDetails.upiId || 'N/A'}</span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center border-t border-slate-900 pt-2">
                          <div>
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">Penny Drop Simulated</span>
                            {selectedRequest.bankDetails.pennyDropVerified ? (
                              <span className="text-[10px] font-black text-emerald-450 uppercase mt-0.5 block">✓ Account Validated</span>
                            ) : (
                              <span className="text-[10px] font-black text-amber-500 uppercase mt-0.5 block">Pending Verify</span>
                            )}
                          </div>

                          <div className="flex gap-2">
                            {selectedRequest.bankDetails.status === 'Verified' ? (
                              <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black text-emerald-400 rounded-lg uppercase tracking-wider">
                                Approved
                              </span>
                            ) : selectedRequest.bankDetails.status === 'Rejected' ? (
                              <span className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 text-[9px] font-black text-rose-400 rounded-lg uppercase tracking-wider">
                                Rejected
                              </span>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleVerifyBank('Verified')}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer border-none"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleVerifyBank('Rejected')}
                                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer border-none"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Reject / Request Changes Area */}
                  {selectedRequest.status !== 'Activated' && selectedRequest.status !== 'Completed' && (
                    <div className="space-y-2 border-t border-slate-800/60 pt-3">
                      <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">HR Decision panel</h4>
                      <div className="bg-slate-950 p-3 border border-slate-850 rounded-2xl space-y-2.5 text-xs">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Feedback / Reason for Changes *</label>
                          <textarea
                            placeholder="Type rejection comments or list changes the candidate must make..."
                            value={actionFeedback}
                            onChange={(e) => setActionFeedback(e.target.value)}
                            className="saas-input w-full p-2.5 h-16 text-xs text-white"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={isStatusUpdating}
                            onClick={() => {
                              if (!actionFeedback) {
                                alert('Please provide feedback to request changes.');
                                return;
                              }
                              handleUpdateStatus('Documents Pending'); // requests changes back to candidate
                            }}
                            className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[9px] font-black uppercase tracking-wider cursor-pointer border-none text-center"
                          >
                            {isStatusUpdating ? 'Processing...' : 'Request Changes'}
                          </button>
                          <button
                            type="button"
                            disabled={isStatusUpdating}
                            onClick={() => {
                              if (!actionFeedback) {
                                alert('Please provide feedback/reason for rejection.');
                                return;
                              }
                              handleUpdateStatus('Rejected');
                            }}
                            className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[9px] font-black uppercase tracking-wider cursor-pointer border-none text-center"
                          >
                            {isStatusUpdating ? 'Processing...' : 'Reject Application'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Portal Activation Form */}
                  <div className="space-y-2.5 border-t border-slate-800/60 pt-3">
                    <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Portal Activation Setup</h4>
                    
                    <div className="bg-slate-950 p-3 border border-slate-850 rounded-2xl space-y-2.5 text-xs">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Assign System Role *</label>
                        <select
                          value={activationRole}
                          onChange={(e) => setActivationRole(e.target.value)}
                          className="saas-input w-full p-2 text-xs text-white cursor-pointer bg-slate-900 border-slate-800"
                        >
                          <option value="Employee">Employee (Standard Access)</option>
                          <option value="HR">HR Specialist</option>
                          <option value="Admin">Administrator</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Final Department *</label>
                          <input
                            type="text"
                            value={activationDept}
                            onChange={(e) => setActivationDept(e.target.value)}
                            className="saas-input w-full p-2 text-xs text-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Final Designation *</label>
                          <input
                            type="text"
                            value={activationDesig}
                            onChange={(e) => setActivationDesig(e.target.value)}
                            className="saas-input w-full p-2 text-xs text-white"
                          />
                        </div>
                      </div>

                      {/* Work Email Password - HR enters company email password */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Work Email Password (Optional)</label>
                        <input
                          type="text"
                          value={workEmailPassword}
                          onChange={(e) => setWorkEmailPassword(e.target.value)}
                          placeholder="Enter company email password to send in welcome email"
                          className="saas-input w-full p-2 text-xs text-white"
                        />
                        <p className="text-[8px] text-slate-500">If provided, this password will be included in the activation email sent to the employee's personal email.</p>
                      </div>

                      {/* Employee ID generation preview */}
                      <div className="p-3 bg-slate-900 border border-slate-800/80 rounded-xl space-y-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Generated Employee ID Format</p>
                        <p className="font-bold text-white text-[11px] flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                          EMP-2026-XXXX <span className="text-[8.5px] font-black text-blue-450 uppercase">(Autogenerated Sequenced)</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedRequest(null)}
                        className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl text-[9px] font-black uppercase tracking-wider cursor-pointer border-none"
                      >
                        Close Panel
                      </button>

                      <button
                        type="button"
                        disabled={
                          isActivating || 
                          selectedRequest.status === 'Activated' || 
                          selectedRequest.status === 'Completed' ||
                          !selectedRequest.personalInfo ||
                          !selectedRequest.documents ||
                          selectedRequest.documents.some(d => d.status !== 'Verified') ||
                          selectedRequest.bankDetails?.status !== 'Verified'
                        }
                        onClick={handleActivateEmployee}
                        className={cn(
                          "flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider cursor-pointer border-none text-white",
                          (selectedRequest.status === 'Activated' || selectedRequest.status === 'Completed')
                            ? "bg-emerald-700/50 cursor-not-allowed"
                            : (!selectedRequest.personalInfo || 
                               !selectedRequest.documents || 
                               selectedRequest.documents.some(d => d.status !== 'Verified') || 
                               selectedRequest.bankDetails?.status !== 'Verified')
                              ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                              : "bg-gradient-to-r from-emerald-600 to-teal-500 shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20"
                        )}
                      >
                        {isActivating ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto text-white" />
                        ) : selectedRequest.status === 'Activated' ? (
                          'Active Profile'
                        ) : (
                          '✓ Approve & Activate'
                        )}
                      </button>
                    </div>

                    {/* Show warning if conditions for activation are not fully met */}
                    {!(selectedRequest.status === 'Activated' || selectedRequest.status === 'Completed') && (
                      (!selectedRequest.personalInfo ||
                       !selectedRequest.documents ||
                       selectedRequest.documents.some(d => d.status !== 'Verified') ||
                       selectedRequest.bankDetails?.status !== 'Verified') && (
                        <p className="text-[10px] text-amber-500 font-semibold flex items-center gap-1 justify-center leading-tight">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          Cannot activate: All documents and bank details must be verified.
                        </p>
                      )
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
