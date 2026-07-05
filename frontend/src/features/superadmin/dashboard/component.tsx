"use client";

import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, CreditCard, Clock, AlertTriangle, ShieldCheck, Search, Filter, 
  RefreshCcw, KeyRound, Calendar, Award, Trash2, ArrowRight, Settings, 
  Cpu, Database, HelpCircle, Shield, Sliders, CheckCircle2, Lock, Plus, Edit2, Play
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { PastelStatCard } from '@/components/ui/PastelStatCard';

interface SuperAdminDashboardProps {
  addNotification?: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  initialTab?: string;
}

const tabs = [
  { id: 'dashboard', label: 'Dashboard Overview', icon: Cpu },
  { id: 'tenants', label: 'Tenants & Domain Settings', icon: Building2 },
  { id: 'billing', label: 'Plans & Coupons Settings', icon: CreditCard },
  { id: 'features', label: 'Feature Flags & Limits', icon: Sliders },
  { id: 'gateways', label: 'Platform Settings', icon: Settings },
  { id: 'developer', label: 'Developer Center', icon: Database },
  { id: 'security', label: 'Security & Audit Trails', icon: Shield },
  { id: 'support', label: 'Upgrade & Support Tickets', icon: HelpCircle },
  { id: 'system', label: 'Platform Backups & Systems', icon: Database },
  { id: 'ai', label: 'AI Management', icon: Cpu },
  { id: 'profile', label: 'Super Admin Profile', icon: Users }
];

export default function SuperAdminDashboard({ addNotification, initialTab = 'dashboard' }: SuperAdminDashboardProps) {
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);
  const [topPaying, setTopPaying] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [impersonateLoading, setImpersonateLoading] = useState<string | null>(null);

  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'suspend' | 'activate' | 'extend-trial' | 'change-plan' | 'reset-admin' | 'billing-history'>('extend-trial');
  
  const [trialDays, setTrialDays] = useState('14');
  const [selectedPlanCode, setSelectedPlanCode] = useState('starter');
  const [adminEmail, setAdminEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [companyBillingHistory, setCompanyBillingHistory] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  const [plans, setPlans] = useState<any[]>([]);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [planForm, setPlanForm] = useState({ name: '', code: 'starter', price: 999, employeeLimit: 25, features: '' });

  const [limitsForm, setLimitsForm] = useState({ employeeLimit: 50, storageLimitGB: 20, branchLimit: 10, apiLimit: 100000 });
  const [selectedCompanyIdForLimits, setSelectedCompanyIdForLimits] = useState('');

  const [platformSettings, setPlatformSettings] = useState({ smtpHost: 'smtp.sendgrid.net', smtpPort: '587', googleClientId: '', fileStorageProvider: 'S3-AWS' });
  const [securityLogs, setSecurityLogs] = useState<any>({ auditLogs: [], securityLogs: [] });
  const [supportTickets, setSupportTickets] = useState<any[]>([]);

  const fetchSuperAdminData = async () => {
    const savedToken = localStorage.getItem('hr_system_token');
    try {
      const dbRes = await fetch('/api/superadmin/dashboard', {
        headers: { 'Authorization': `Bearer ${savedToken}` }
      });
      const dbJson = await dbRes.json();
      if (dbRes.ok) {
        setMetrics(dbJson.metrics);
        setCharts(dbJson.charts);
        setTopPaying(dbJson.topPayingCustomers);
      }

      const compRes = await fetch('/api/superadmin/companies', {
        headers: { 'Authorization': `Bearer ${savedToken}` }
      });
      const compJson = await compRes.json();
      if (compRes.ok) {
        setCompanies(compJson);
      }

      const plansRes = await fetch('/api/superadmin/saas-plans', {
        headers: { 'Authorization': `Bearer ${savedToken}` }
      });
      if (plansRes.ok) {
        setPlans(await plansRes.json());
      }

      const ticketRes = await fetch('/api/superadmin/support-tickets', {
        headers: { 'Authorization': `Bearer ${savedToken}` }
      });
      if (ticketRes.ok) {
        setSupportTickets(await ticketRes.json());
      }

      const pfRes = await fetch('/api/superadmin/platform-settings', {
        headers: { 'Authorization': `Bearer ${savedToken}` }
      });
      if (pfRes.ok) {
        const pfJson = await pfRes.json();
        setPlatformSettings({
          smtpHost: pfJson.smtp?.host || 'smtp.sendgrid.net',
          smtpPort: pfJson.smtp?.port || '587',
          googleClientId: pfJson.integrations?.google || '',
          fileStorageProvider: pfJson.theme?.defaultThemeMode || 'S3-AWS'
        });
      }

      const auditRes = await fetch('/api/superadmin/security-logs', {
        headers: { 'Authorization': `Bearer ${savedToken}` }
      });
      if (auditRes.ok) {
        setSecurityLogs(await auditRes.json());
      }

    } catch (err) {
      console.error('Failed to load Super Admin metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuperAdminData();
  }, []);

  const handleExecuteAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany) return;

    setActionLoading(true);
    const savedToken = localStorage.getItem('hr_system_token');
    const companyId = selectedCompany.companyId;

    try {
      const res = await fetch(`/api/superadmin/companies/${companyId}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${savedToken}`
        },
        body: JSON.stringify({
          action: actionType,
          days: trialDays,
          planCode: selectedPlanCode,
          adminEmail,
          newPassword
        })
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to complete action');
      }

      if (actionType === 'billing-history') {
        setCompanyBillingHistory(json);
        setActionLoading(false);
        return;
      }

      if (addNotification) {
        addNotification(json.message || 'Operation executed successfully', 'success');
      } else {
        alert(json.message || 'Operation executed successfully');
      }

      setShowActionModal(false);
      await fetchSuperAdminData();
    } catch (err: any) {
      if (addNotification) {
        addNotification(err.message, 'error');
      } else {
        alert(err.message);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdatePlatformSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const savedToken = localStorage.getItem('hr_system_token');
    try {
      const res = await fetch('/api/superadmin/platform-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${savedToken}`
        },
        body: JSON.stringify({
          smtp: { host: platformSettings.smtpHost, port: platformSettings.smtpPort },
          integrations: { google: platformSettings.googleClientId },
          theme: { defaultThemeMode: platformSettings.fileStorageProvider }
        })
      });
      if (res.ok) {
        addNotification?.('Platform settings saved successfully', 'success');
      }
    } catch (err) {}
  };

  const handleCreateOrUpdatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    const savedToken = localStorage.getItem('hr_system_token');
    try {
      const payload = {
        id: editingPlan?._id || editingPlan?.id,
        name: planForm.name,
        code: planForm.code,
        price: planForm.price,
        employeeLimit: planForm.employeeLimit,
        features: planForm.features.split(',').map(f => f.trim()).filter(Boolean)
      };
      const res = await fetch('/api/superadmin/saas-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${savedToken}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowPlanModal(false);
        setEditingPlan(null);
        setPlanForm({ name: '', code: 'starter', price: 999, employeeLimit: 25, features: '' });
        addNotification?.('SaaS Subscription Plan updated successfully', 'success');
        fetchSuperAdminData();
      }
    } catch (err) {}
  };

  const handleApplyLimits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompanyIdForLimits) return;
    const savedToken = localStorage.getItem('hr_system_token');
    try {
      const res = await fetch(`/api/superadmin/companies/${selectedCompanyIdForLimits}/features`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${savedToken}`
        },
        body: JSON.stringify(limitsForm)
      });
      if (res.ok) {
        addNotification?.('Tenant limits and module overrides applied successfully', 'success');
        fetchSuperAdminData();
      }
    } catch (err) {}
  };

  const handleSystemAction = async (action: string) => {
    const savedToken = localStorage.getItem('hr_system_token');
    try {
      const res = await fetch('/api/superadmin/system-actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${savedToken}`
        },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (res.ok) {
        addNotification?.(data.message, 'success');
      }
    } catch (err) {}
  };

  const handleResolveTicket = async (ticketId: string) => {
    const savedToken = localStorage.getItem('hr_system_token');
    try {
      const res = await fetch(`/api/superadmin/support-tickets/${ticketId}/resolve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${savedToken}`
        }
      });
      if (res.ok) {
        addNotification?.('Support query ticket status resolved', 'success');
        fetchSuperAdminData();
      }
    } catch (err) {}
  };

  const loadCompanyBillingHistory = async (company: any) => {
    setSelectedCompany(company);
    setActionType('billing-history');
    setShowActionModal(true);
    setActionLoading(true);
    
    const savedToken = localStorage.getItem('hr_system_token');
    try {
      const res = await fetch(`/api/superadmin/companies/${company.companyId}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${savedToken}`
        },
        body: JSON.stringify({ action: 'billing-history' })
      });
      const json = await res.json();
      if (res.ok) {
        setCompanyBillingHistory(json);
      }
    } catch (err) {}
    setActionLoading(false);
  };

  const handleImpersonationLogin = async (company: any) => {
    setImpersonateLoading(company.companyId);
    const savedToken = localStorage.getItem('hr_system_token');
    try {
      const res = await fetch(`/api/superadmin/impersonate/${company.companyId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${savedToken}`
        }
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem('hr_system_token', data.token);
        localStorage.setItem('hr_system_auth', 'true');
        addNotification?.(`Proxy session enabled as admin for: ${company.companyName}`, 'success');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        addNotification?.(data.error || 'Failed to impersonate admin', 'error');
      }
    } catch (err) {
      addNotification?.('Server error setting proxy administrator session', 'error');
    } finally {
      setImpersonateLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <RefreshCcw className="w-8 h-8 text-indigo-500 animate-spin" />
        <span className="text-xs font-black uppercase tracking-widest text-slate-500">Querying platform owners logs...</span>
      </div>
    );
  }

  const filteredCompanies = companies.filter(c => {
    const matchesSearch = c.companyName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           c.slug.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           c.workEmail.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === 'all') return matchesSearch;
    return matchesSearch && c.status.toLowerCase() === statusFilter.toLowerCase();
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto text-left">
      <div className="border-b border-slate-800 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-505" /> SaaS Platform Control Console
          </h1>
          <p className="text-xs text-slate-500 font-bold uppercase mt-0.5">Platform owner metrics, subscription growths, and company tenant managers</p>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">System Online</span>
        </div>
      </div>
      
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
            {[
              { label: 'Total Tenants', value: (metrics?.totalCompanies || 0).toString(), icon: Building2, accent: '#8B5CF6', sub: `Active: ${metrics?.activeCompanies || 0}` },
              { label: 'Trials vs Active', value: `${metrics?.trialCompanies || 0} / ${metrics?.totalCompanies - metrics?.trialCompanies || 0}`, icon: Clock, accent: '#10B981', sub: `Expired: ${metrics?.expiredCompanies || 0}` },
              { label: 'Platform MRR', value: `₹${(metrics?.mrr || 0).toLocaleString()}`, icon: CreditCard, accent: '#06B6D4', sub: `ARR: ₹${(metrics?.arr || 0).toLocaleString()}`, subColor: 'text-emerald-500' },
              { label: 'Trial Conversion / Churn', value: `${metrics?.trialConversionRate || 0}%`, icon: ShieldCheck, accent: '#3B82F6', sub: `Churn Rate: ${metrics?.churnRate || 0}%`, subColor: 'text-rose-500' }
            ].map((stat, idx) => (
          <PastelStatCard key={idx} icon={stat.icon} label={stat.label} value={stat.value} sub={stat.sub} accent={stat.accent} />
        ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-sm lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-black text-white uppercase tracking-widest">Revenue Growth Analytics</h3>
                <span className="text-[8px] font-black bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full uppercase">+15.4% Subscription growth</span>
              </div>

              <div className="flex items-end justify-between h-40 pt-4 px-2">
                {charts?.revenueGrowth?.map((item: any, idx: number) => {
                  const maxVal = Math.max(...charts.revenueGrowth.map((g: any) => g.revenue));
                  const heightPercent = maxVal > 0 ? (item.revenue / maxVal) * 80 : 0;
                  return (
                    <div key={idx} className="flex flex-col items-center flex-1 space-y-2 group">
                      <span className="text-[8px] font-black text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">₹{item.revenue.toLocaleString()}</span>
                      <div className="w-8 sm:w-12 bg-indigo-500/10 border border-indigo-500/25 rounded-t-lg relative overflow-hidden group-hover:bg-indigo-500/20 group-hover:border-indigo-500/50 transition-all" style={{ height: `${heightPercent}px` }}>
                        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-indigo-500 to-transparent opacity-30" />
                      </div>
                      <span className="text-[8px] font-black uppercase text-slate-500">{item.month}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-white uppercase tracking-widest border-b border-slate-850 pb-2">Top Paying Tenants</h3>
              <div className="space-y-3">
                {topPaying.map((customer, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-955/40 border border-slate-850">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-indigo-650/10 text-indigo-505 flex items-center justify-center font-bold text-xs">
                        {idx + 1}
                      </div>
                      <span className="text-[10px] font-black text-slate-200 uppercase truncate max-w-[120px]">{customer.companyName || customer._id}</span>
                    </div>
                    <span className="text-[10px] font-black text-emerald-400">₹{customer.totalPaid?.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tenants' && (
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-sm font-black text-white uppercase tracking-widest">Workspace Company List</h3>
            
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none sm:w-64">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Search by company or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1.5 bg-slate-955 border border-slate-850 rounded-xl text-[10px] text-white font-semibold outline-none focus:border-indigo-500/50"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1 bg-slate-955 border border-slate-850 rounded-xl text-[10px] text-white font-semibold outline-none cursor-pointer"
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="pending_verification">Pending verification</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[10px] font-semibold text-slate-400">
              <thead>
                <tr className="border-b border-slate-800 text-[8px] font-black uppercase text-slate-550 tracking-wider">
                  <th className="py-2.5 text-left pl-2">Company Name</th>
                  <th className="py-2.5 text-left">Subdomain</th>
                  <th className="py-2.5 text-left">Contact Email</th>
                  <th className="py-2.5 text-center">Employees</th>
                  <th className="py-2.5 text-center">Plan Tier</th>
                  <th className="py-2.5 text-center">Status</th>
                  <th className="py-2.5 text-right pr-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompanies.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500 font-bold uppercase text-[9px]">No company workspaces matching filter</td>
                  </tr>
                ) : (
                  filteredCompanies.map((c) => (
                    <tr key={c.companyId} className="border-b border-slate-800/60 hover:bg-slate-955/20 transition-colors">
                      <td className="py-3 pl-2">
                        <div className="font-bold text-slate-200 uppercase">{c.companyName}</div>
                        <span className="text-[8px] text-slate-500 block font-bold mt-0.5">Joined: {new Date(c.createdAt).toLocaleDateString()}</span>
                      </td>
                      <td className="py-3 lowercase font-bold text-slate-400">{c.slug}.hrcore.com</td>
                      <td className="py-3 font-medium text-slate-500">{c.workEmail}</td>
                      <td className="py-3 text-center font-bold text-white">{c.employeeCount}</td>
                      <td className="py-3 text-center">
                        <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-505/20 rounded-md text-[8px] font-black uppercase">
                          {c.planCode}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[8px] font-black uppercase",
                          c.status === 'active' || c.status === 'Active' ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                        )}>
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 text-right pr-2 space-x-1.5 whitespace-nowrap">
                        <button 
                          onClick={() => handleImpersonationLogin(c)}
                          disabled={impersonateLoading !== null}
                          className="px-2 py-0.8 bg-emerald-600 hover:bg-emerald-505 text-white rounded-md text-[8px] font-black uppercase tracking-wider cursor-pointer inline-flex items-center gap-1.5"
                          title="Login as tenant admin (Impersonation)"
                        >
                          <Play className="w-2.5 h-2.5" />
                          {impersonateLoading === c.companyId ? 'Loading...' : 'Login As'}
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedCompany(c);
                            setActionType('extend-trial');
                            setShowActionModal(true);
                          }}
                          className="px-1.5 py-0.8 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-md text-[8px] font-black uppercase tracking-wider cursor-pointer"
                        >
                          +Trial
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedCompany(c);
                            setActionType('change-plan');
                            setShowActionModal(true);
                          }}
                          className="px-1.5 py-0.8 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 rounded-md text-[8px] font-black uppercase tracking-wider cursor-pointer"
                        >
                          Plan
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedCompany(c);
                            setActionType('reset-admin');
                            setShowActionModal(true);
                          }}
                          className="px-1.5 py-0.8 bg-slate-800 hover:bg-slate-755 text-slate-355 rounded-md text-[8px] font-black uppercase tracking-wider cursor-pointer"
                        >
                          Reset
                        </button>
                        
                        {c.status === 'active' || c.status === 'Active' ? (
                          <button 
                            onClick={() => {
                              setSelectedCompany(c);
                              setActionType('suspend');
                              setShowActionModal(true);
                            }}
                            className="px-1.5 py-0.8 bg-rose-600/10 hover:bg-rose-600/20 text-rose-500 rounded-md text-[8px] font-black uppercase tracking-wider cursor-pointer"
                          >
                            Suspend
                          </button>
                        ) : (
                          <button 
                            onClick={() => {
                              setSelectedCompany(c);
                              setActionType('activate');
                              setShowActionModal(true);
                            }}
                            className="px-1.5 py-0.8 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 rounded-md text-[8px] font-black uppercase tracking-wider cursor-pointer"
                          >
                            Activate
                          </button>
                        )}
                        <button 
                          onClick={() => loadCompanyBillingHistory(c)}
                          className="px-1.5 py-0.8 bg-indigo-650/10 hover:bg-indigo-600/20 text-indigo-505 rounded-md text-[8px] font-black uppercase tracking-wider cursor-pointer"
                        >
                          History
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'billing' && (
        <div className="space-y-6">
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black text-white uppercase tracking-widest">SaaS Plans Editor</h3>
              <button 
                onClick={() => { setEditingPlan(null); setPlanForm({ name: '', code: 'starter', price: 999, employeeLimit: 25, features: '' }); setShowPlanModal(true); }}
                className="px-3 py-1.5 bg-indigo-650 hover:bg-indigo-600 text-white text-[9px] font-black uppercase tracking-wider rounded-xl cursor-pointer"
              >
                + Create Plan
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans.map(p => (
                <div key={p.code} className="p-4 border border-slate-800 rounded-2xl bg-slate-955/40 relative">
                  <div className="flex justify-between items-start">
                    <h4 className="text-xs font-black text-white uppercase">{p.name}</h4>
                    <span className="px-2 py-0.5 bg-indigo-600/10 text-indigo-400 border border-indigo-505/20 rounded-md text-[8px] font-black uppercase">{p.code}</span>
                  </div>
                  <div className="my-3">
                    <span className="text-xl font-black text-white">₹{p.price.toLocaleString()}</span>
                    <span className="text-[8px] text-slate-500 font-bold uppercase ml-1">/ Monthly</span>
                  </div>
                  <ul className="space-y-1 my-3 text-[9px] text-slate-400">
                    <li className="font-bold text-white">Limit: {p.employeeLimit} Employees</li>
                    {p.features?.map((f: string, i: number) => (
                      <li key={i} className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> {f}</li>
                    ))}
                  </ul>
                  <div className="flex gap-2 mt-4 pt-3 border-t border-slate-800">
                    <button 
                      onClick={() => {
                        setEditingPlan(p);
                        setPlanForm({ name: p.name, code: p.code, price: p.price, employeeLimit: p.employeeLimit, features: p.features?.join(', ') || '' });
                        setShowPlanModal(true);
                      }}
                      className="flex-1 py-1 bg-slate-800 hover:bg-slate-750 text-[8px] font-black uppercase rounded-lg text-slate-300 transition-all cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'features' && (
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-black text-white uppercase tracking-widest">Global limits override</h3>
          
          <form onSubmit={handleApplyLimits} className="space-y-4 max-w-lg">
            <div className="space-y-1">
              <label className="text-[7.5px] font-black uppercase tracking-widest text-slate-400 block ml-0.5">Select Target Company Workspace</label>
              <select
                required
                value={selectedCompanyIdForLimits}
                onChange={(e) => setSelectedCompanyIdForLimits(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-955 border border-slate-805 rounded-lg text-[10px] text-white font-semibold outline-none cursor-pointer"
              >
                <option value="">-- Choose Company workspace --</option>
                {companies.map(c => (
                  <option key={c.companyId} value={c.companyId}>{c.companyName} ({c.slug})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[7.5px] font-black uppercase tracking-widest text-slate-400 block ml-0.5">Employee Limit Seats</label>
                <input 
                  type="number" 
                  value={limitsForm.employeeLimit}
                  onChange={(e) => setLimitsForm({ ...limitsForm, employeeLimit: parseInt(e.target.value) || 25 })}
                  className="w-full px-3 py-1.5 bg-slate-955 border border-slate-805 rounded-lg text-[10px] text-white outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[7.5px] font-black uppercase tracking-widest text-slate-400 block ml-0.5">Storage Quota Limit (GB)</label>
                <input 
                  type="number" 
                  value={limitsForm.storageLimitGB}
                  onChange={(e) => setLimitsForm({ ...limitsForm, storageLimitGB: parseInt(e.target.value) || 10 })}
                  className="w-full px-3 py-1.5 bg-slate-955 border border-slate-805 rounded-lg text-[10px] text-white outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[7.5px] font-black uppercase tracking-widest text-slate-400 block ml-0.5">Branch Count Quota Limit</label>
                <input 
                  type="number" 
                  value={limitsForm.branchLimit}
                  onChange={(e) => setLimitsForm({ ...limitsForm, branchLimit: parseInt(e.target.value) || 5 })}
                  className="w-full px-3 py-1.5 bg-slate-955 border border-slate-805 rounded-lg text-[10px] text-white outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[7.5px] font-black uppercase tracking-widest text-slate-400 block ml-0.5">Monthly API Limit Rate</label>
                <input 
                  type="number" 
                  value={limitsForm.apiLimit}
                  onChange={(e) => setLimitsForm({ ...limitsForm, apiLimit: parseInt(e.target.value) || 50000 })}
                  className="w-full px-3 py-1.5 bg-slate-955 border border-slate-805 rounded-lg text-[10px] text-white outline-none"
                />
              </div>
            </div>

            <button 
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[9px] font-black uppercase tracking-wider cursor-pointer"
            >
              Apply Limits & Overrides
            </button>
          </form>
        </div>
      )}

      {activeTab === 'gateways' && (
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-black text-white uppercase tracking-widest">Global Platform Configuration</h3>
          
          <form onSubmit={handleUpdatePlatformSettings} className="space-y-4 max-w-lg">
            <div className="space-y-1">
              <label className="text-[7.5px] font-black uppercase tracking-widest text-slate-400 block ml-0.5">SMTP Host Node</label>
              <input 
                type="text" 
                value={platformSettings.smtpHost}
                onChange={(e) => setPlatformSettings({ ...platformSettings, smtpHost: e.target.value })}
                className="w-full px-3 py-1.5 bg-slate-955 border border-slate-805 rounded-lg text-[10px] text-white outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[7.5px] font-black uppercase tracking-widest text-slate-400 block ml-0.5">SMTP Server Port</label>
              <input 
                type="text" 
                value={platformSettings.smtpPort}
                onChange={(e) => setPlatformSettings({ ...platformSettings, smtpPort: e.target.value })}
                className="w-full px-3 py-1.5 bg-slate-955 border border-slate-805 rounded-lg text-[10px] text-white outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[7.5px] font-black uppercase tracking-widest text-slate-400 block ml-0.5">Google OAuth Client ID</label>
              <input 
                type="text" 
                value={platformSettings.googleClientId}
                placeholder="Google client ID configuration"
                onChange={(e) => setPlatformSettings({ ...platformSettings, googleClientId: e.target.value })}
                className="w-full px-3 py-1.5 bg-slate-955 border border-slate-805 rounded-lg text-[10px] text-white outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[7.5px] font-black uppercase tracking-widest text-slate-400 block ml-0.5">Primary Storage Bucket Provider</label>
              <select
                value={platformSettings.fileStorageProvider}
                onChange={(e) => setPlatformSettings({ ...platformSettings, fileStorageProvider: e.target.value })}
                className="w-full px-3 py-1.5 bg-slate-955 border border-slate-805 rounded-lg text-[10px] text-white outline-none cursor-pointer"
              >
                <option value="S3-AWS">Amazon S3 (Enterprise standard)</option>
                <option value="GCS">Google Cloud Storage (Verified)</option>
                <option value="Local">Local Disk Storage (Sandbox debug)</option>
              </select>
            </div>

            <button 
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[9px] font-black uppercase tracking-wider cursor-pointer"
            >
              Update platform settings
            </button>
          </form>
        </div>
      )}

      {activeTab === 'developer' && (
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-sm space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-black text-white uppercase tracking-widest">Developer Center</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">Manage system-wide developer tokens, endpoints, and webhooks</p>
          </div>

          <div className="space-y-4">
            <div className="p-4 border border-slate-800 rounded-2xl bg-slate-955/20 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-white uppercase tracking-wider">Super Admin Master Token</span>
                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md text-[8px] font-black uppercase">Active</span>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="password" 
                  value="sk_live_51O2aB9C181D1023MDHRCoreMasterToken" 
                  disabled 
                  className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-[9px] text-slate-400 font-mono" 
                />
                <button 
                  onClick={() => addNotification?.('Master token copied to clipboard', 'success')}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-550 text-white rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer"
                >
                  Copy
                </button>
              </div>
            </div>

            <div className="p-4 border border-slate-800 rounded-2xl bg-slate-955/20 space-y-3">
              <span className="text-[10px] font-black text-white uppercase tracking-wider block">Global Webhook Endpoint</span>
              <div className="space-y-2">
                <input 
                  type="text" 
                  placeholder="https://yourdomain.com/webhooks/hrcore" 
                  defaultValue="https://api.hrcore.com/v1/webhooks/receiver"
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-[10px] text-white outline-none focus:border-indigo-500/50" 
                />
                <div className="flex gap-2">
                  <button 
                    onClick={() => addNotification?.('Webhook endpoint saved successfully', 'success')}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-550 text-white rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer"
                  >
                    Save Endpoint
                  </button>
                  <button 
                    onClick={() => addNotification?.('Test webhook event dispatched successfully', 'info')}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer"
                  >
                    Test Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-white uppercase tracking-widest border-b border-slate-850 pb-2">Global System Audit Logs</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
              {securityLogs.auditLogs?.length === 0 ? (
                <p className="text-[9px] font-bold text-slate-500 uppercase text-center">No platform audits recorded</p>
              ) : securityLogs.auditLogs?.map((log: any) => (
                <div key={log._id} className="p-2 border border-slate-855 rounded-xl bg-slate-955/40 text-[9px] font-semibold text-slate-450 leading-relaxed">
                  <div className="flex justify-between items-center text-[7.5px] font-bold text-slate-505 mb-1">
                    <span>{log.performedBy}</span>
                    <span>{new Date(log.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <p className="font-bold text-slate-300">{log.action}</p>
                  <p className="text-slate-400 mt-0.5">{log.details}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-white uppercase tracking-widest border-b border-slate-850 pb-2">Tenant Security logs</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
              {securityLogs.securityLogs?.length === 0 ? (
                <p className="text-[9px] font-bold text-slate-505 uppercase text-center">No security incidents active</p>
              ) : securityLogs.securityLogs?.map((log: any) => (
                <div key={log._id} className="p-2 border border-slate-855 rounded-xl bg-slate-955/40 text-[9px] font-semibold text-slate-450 leading-relaxed">
                  <div className="flex justify-between items-center text-[7.5px] font-bold text-slate-550 mb-1">
                    <span className="text-rose-455 font-bold uppercase">{log.eventSeverity}</span>
                    <span>{new Date(log.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <p className="font-extrabold text-white uppercase">{log.eventName}</p>
                  <p className="text-slate-455 mt-0.5">{log.ipAddress} — {log.userAgent}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'support' && (
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-850 shadow-sm space-y-4">
          <h3 className="text-sm font-black text-white uppercase tracking-widest">Support & Upgrades Ticket queue</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-[10px] font-semibold text-slate-400">
              <thead>
                <tr className="border-b border-slate-855 text-[8px] font-black uppercase text-slate-500 tracking-wider">
                  <th className="py-2.5 text-left pl-2">Subject / Request</th>
                  <th className="py-2.5 text-left">Company Tenant</th>
                  <th className="py-2.5 text-center">Status</th>
                  <th className="py-2.5 text-center">Category</th>
                  <th className="py-2.5 text-right pr-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {supportTickets.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-505 font-bold uppercase text-[9px]">All tickets resolved! No pending support requests.</td>
                  </tr>
                ) : (
                  supportTickets.map(t => (
                    <tr key={t._id} className="border-b border-slate-855 hover:bg-slate-955/20 transition-colors">
                      <td className="py-3 pl-2">
                        <div className="font-bold text-white">{t.title}</div>
                        <p className="text-[9px] text-slate-505 mt-0.5 font-medium">{t.description}</p>
                      </td>
                      <td className="py-3 text-slate-350">{t.companyName || t.companyId}</td>
                      <td className="py-3 text-center">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase",
                          t.status === 'resolved' ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                        )}>{t.status}</span>
                      </td>
                      <td className="py-3 text-center font-bold text-slate-500 uppercase">{t.category}</td>
                      <td className="py-3 text-right pr-2">
                        {t.status !== 'resolved' && (
                          <button 
                            onClick={() => handleResolveTicket(t._id)}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-[8px] font-black uppercase tracking-wider cursor-pointer"
                          >
                            Resolve
                          </button>
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

      {activeTab === 'system' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-white uppercase tracking-widest border-b border-slate-850 pb-2">System Backups</h3>
            <p className="text-[9px] text-slate-505 text-slate-500 font-semibold leading-relaxed uppercase">
              PLATFORM DATABASE SNAPSHOTS CAN BE DUMPED LOCALLY TO TARBALLS FOR COLD-STORAGE ARCHIVES ON SECURE CLOUD STORAGE NODES.
            </p>
            <div className="flex gap-2.5">
              <button 
                onClick={() => handleSystemAction('backup')}
                className="px-3.5 py-2 bg-indigo-655 hover:bg-indigo-600 text-white text-[9px] font-black uppercase tracking-wider rounded-xl cursor-pointer"
              >
                Trigger Snapshot Backup
              </button>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-855 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-white uppercase tracking-widest border-b border-slate-850 pb-2">Cache & Server Utilities</h3>
            <p className="text-[9px] text-slate-505 text-slate-500 font-semibold leading-relaxed uppercase">
              FORCE SYSTEM CACHE PURGING DIRECTIVES ACROSS REDIS SESSIONS TO RELOAD DATA ENTRIES IMMEDIATELY.
            </p>
            <div className="flex gap-2.5">
              <button 
                onClick={() => handleSystemAction('purge-cache')}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-[9px] font-black uppercase tracking-wider rounded-xl cursor-pointer"
              >
                Purge Redis Cache memory
              </button>
            </div>
          </div>
        </div>
      )}
      {activeTab === 'ai' && (
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-sm space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-black text-white uppercase tracking-widest">AI Management & Cognitive Nodes</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">Toggle global generative AI features, assistant nodes, and API models usage</p>
          </div>

          <div className="space-y-4 max-w-lg">
            <div className="flex items-center justify-between p-3.5 border border-slate-800 rounded-2xl bg-slate-955/20">
              <div>
                <span className="text-[10px] font-black text-white uppercase tracking-wider block">Cognitive Assistant Search</span>
                <span className="text-[8px] text-slate-500 font-bold uppercase block mt-0.5">Allow smart semantic search on employee policies</span>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4 cursor-pointer accent-indigo-650" />
            </div>

            <div className="flex items-center justify-between p-3.5 border border-slate-800 rounded-2xl bg-slate-955/20">
              <div>
                <span className="text-[10px] font-black text-white uppercase tracking-wider block">Auto Resume Parser Node</span>
                <span className="text-[8px] text-slate-500 font-bold uppercase block mt-0.5">OCR engine to auto extract details from PDF profiles</span>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4 cursor-pointer accent-indigo-650" />
            </div>

            <div className="space-y-1">
              <label className="text-[7.5px] font-black uppercase tracking-widest text-slate-400 block ml-0.5">Default OpenAI LLM Model Engine</label>
              <select className="w-full px-3 py-1.5 bg-slate-955 border border-slate-805 rounded-lg text-[10px] text-white outline-none cursor-pointer">
                <option>GPT-4o (Production High Performance)</option>
                <option>GPT-4-turbo (Legacy standard)</option>
                <option>Gemini 1.5 Pro Node (Developer sandbox)</option>
              </select>
            </div>
            
            <button 
              onClick={() => addNotification?.('AI settings updated successfully', 'success')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[9px] font-black uppercase tracking-wider cursor-pointer"
            >
              Update AI configurations
            </button>
          </div>
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-sm space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-black text-white uppercase tracking-widest">Super Admin Profile</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">Manage master authentication credentials and platform emails</p>
          </div>

          <div className="space-y-4 max-w-lg text-[10px] font-semibold text-slate-400">
            <div className="p-4 border border-slate-800 rounded-2xl bg-slate-955/20 space-y-1">
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 block">Current Account Node</span>
              <p className="text-white font-bold">superadmincore@gmail.com</p>
            </div>

            <div className="p-4 border border-slate-800 rounded-2xl bg-slate-955/20 space-y-1">
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 block">License Access Status</span>
              <p className="text-emerald-400 font-black uppercase">System Owner (Unlimited Access)</p>
            </div>
            
            <button 
              onClick={() => addNotification?.('Profile status verification complete', 'success')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-550 text-white rounded-xl text-[9px] font-black uppercase tracking-wider cursor-pointer"
            >
              Verify active token security
            </button>
          </div>
        </div>
      )}

      {showActionModal && selectedCompany && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-955/75 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 relative space-y-4 shadow-2xl">
            
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  {actionType === 'extend-trial' && "Extend trial duration"}
                  {actionType === 'change-plan' && "Force update Plan Tier"}
                  {actionType === 'reset-admin' && "Reset Administrator password"}
                  {actionType === 'suspend' && "Confirm Suspension"}
                  {actionType === 'activate' && "Confirm Activation"}
                  {actionType === 'billing-history' && "Company billing log history"}
                </h3>
                <p className="text-[8px] text-slate-550 text-slate-500 font-bold uppercase mt-0.5">Workspace Target: {selectedCompany.companyName} ({selectedCompany.slug})</p>
              </div>
              <button 
                onClick={() => {
                  setShowActionModal(false);
                  setCompanyBillingHistory([]);
                }}
                className="text-slate-400 hover:text-white text-[10px] font-black uppercase border-none bg-transparent cursor-pointer"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleExecuteAction} className="space-y-4 text-left">
              
              {actionType === 'suspend' && (
                <div className="space-y-3">
                  <div className="p-3 border border-rose-500/20 bg-rose-500/5 text-[9px] font-semibold text-rose-300 leading-relaxed rounded-xl flex items-start gap-2">
                    <AlertTriangle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-rose-400" />
                    <span>
                      WARNING: Suspending this company will immediately block all employee profiles, HR managers, and administrators from logging into <strong>{selectedCompany.slug}.hrcore.com</strong>.
                    </span>
                  </div>
                  <button 
                    type="submit" 
                    disabled={actionLoading}
                    className="w-full py-2 bg-rose-650 hover:bg-rose-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer"
                  >
                    {actionLoading ? 'Executing...' : 'Confirm Suspension'}
                  </button>
                </div>
              )}

              {actionType === 'activate' && (
                <div className="space-y-3">
                  <p className="text-[9px] font-bold text-slate-400 uppercase leading-relaxed">
                    Confirm reactivation of workspace access parameters for <strong>{selectedCompany.companyName}</strong>.
                  </p>
                  <button 
                    type="submit" 
                    disabled={actionLoading}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-705 text-white rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer"
                  >
                    {actionLoading ? 'Executing...' : 'Confirm Reactivation'}
                  </button>
                </div>
              )}

              {actionType === 'extend-trial' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[7.5px] font-black uppercase tracking-widest text-slate-400 block ml-0.5">Extend trial by (Days)</label>
                    <input 
                      type="number" 
                      required
                      placeholder="e.g. 14"
                      value={trialDays}
                      onChange={(e) => setTrialDays(e.target.value)}
                      className="w-full pl-3 pr-2.5 py-1.5 bg-slate-955 border border-slate-805 rounded-lg text-[10px] text-white font-semibold outline-none focus:border-indigo-500/50"
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={actionLoading}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer"
                  >
                    {actionLoading ? 'Updating Dates...' : 'Extend Trial Period'}
                  </button>
                </div>
              )}

              {actionType === 'change-plan' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[7.5px] font-black uppercase tracking-widest text-slate-400 block ml-0.5">Select License Plan Tier</label>
                    <select
                      value={selectedPlanCode}
                      onChange={(e) => setSelectedPlanCode(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-955 border border-slate-805 rounded-lg text-[10px] text-white font-semibold outline-none cursor-pointer"
                    >
                      <option value="starter">Starter Plan (₹999 / mo)</option>
                      <option value="professional">Professional Plan (₹4,999 / mo)</option>
                      <option value="enterprise">Enterprise Plan (Custom / contact)</option>
                    </select>
                  </div>
                  <button 
                    type="submit" 
                    disabled={actionLoading}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer"
                  >
                    {actionLoading ? 'Transitioning Tiers...' : 'Force Plan Transition'}
                  </button>
                </div>
              )}

              {actionType === 'reset-admin' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[7.5px] font-black uppercase tracking-widest text-slate-400 block ml-0.5">Admin Account Email *</label>
                    <input 
                      type="email" 
                      required
                      placeholder="e.g. admin@acme.com"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-955 border border-slate-805 rounded-lg text-[10px] text-white font-semibold outline-none focus:border-indigo-500/50"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[7.5px] font-black uppercase tracking-widest text-slate-400 block ml-0.5">New Account Password *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Enter new credential password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-955 border border-slate-805 rounded-lg text-[10px] text-white font-semibold outline-none focus:border-indigo-500/50"
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={actionLoading}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer"
                  >
                    {actionLoading ? 'Resetting...' : 'Reset administrator password'}
                  </button>
                </div>
              )}

              {actionType === 'billing-history' && (
                <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
                  {actionLoading ? (
                    <div className="flex justify-center p-4"><RefreshCcw className="w-5 h-5 text-indigo-500 animate-spin" /></div>
                  ) : companyBillingHistory.length === 0 ? (
                    <p className="text-[9px] font-bold text-slate-500 uppercase text-center py-4">No billing records found for workspace</p>
                  ) : (
                    companyBillingHistory.map((inv) => (
                      <div key={inv._id} className="p-3.5 border border-slate-800 rounded-xl bg-slate-955/40 text-[9.5px] font-semibold text-slate-400 flex justify-between items-center">
                        <div className="space-y-0.5">
                          <div className="font-bold text-white">{inv.invoiceNumber}</div>
                          <span className="text-[7.5px] text-slate-550 block font-bold uppercase">{inv.billingPeriod}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-extrabold text-indigo-400 block">₹{inv.totalAmount?.toLocaleString()}</span>
                          <span className="text-[7px] text-emerald-400 font-black uppercase">{inv.paymentStatus}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

            </form>

          </div>
        </div>
      )}

      {showPlanModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-955/75 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 relative space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-xs font-black text-white uppercase tracking-wider">{editingPlan ? 'Edit SaaS subscription plan' : 'Create new subscription plan'}</h3>
              <button onClick={() => setShowPlanModal(false)} className="text-slate-400 hover:text-white text-[10px] font-black uppercase bg-transparent border-none cursor-pointer">Close</button>
            </div>
            
            <form onSubmit={handleCreateOrUpdatePlan} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-[7.5px] font-black uppercase tracking-widest text-slate-400 block">Plan Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Pro Plan"
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-955 border border-slate-805 rounded-lg text-[10px] text-white outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[7.5px] font-black uppercase tracking-widest text-slate-400 block">Plan Code ID</label>
                <select
                  value={planForm.code}
                  onChange={(e) => setPlanForm({ ...planForm, code: e.target.value as any })}
                  className="w-full px-3 py-1.5 bg-slate-955 border border-slate-805 rounded-lg text-[10px] text-white outline-none cursor-pointer"
                >
                  <option value="starter">Starter Plan</option>
                  <option value="professional">Professional Plan</option>
                  <option value="enterprise">Enterprise Plan</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[7.5px] font-black uppercase tracking-widest text-slate-400 block">Plan Price (₹ / monthly)</label>
                <input 
                  type="number" 
                  required
                  value={planForm.price}
                  onChange={(e) => setPlanForm({ ...planForm, price: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 bg-slate-955 border border-slate-850 rounded-lg text-[10px] text-white outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[7.5px] font-black uppercase tracking-widest text-slate-400 block">Employee Seat Limit</label>
                <input 
                  type="number" 
                  required
                  value={planForm.employeeLimit}
                  onChange={(e) => setPlanForm({ ...planForm, employeeLimit: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 bg-slate-955 border border-slate-850 rounded-lg text-[10px] text-white outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[7.5px] font-black uppercase tracking-widest text-slate-400 block">Features (Comma separated list)</label>
                <textarea 
                  placeholder="Feature 1, Feature 2, Feature 3"
                  value={planForm.features}
                  onChange={(e) => setPlanForm({ ...planForm, features: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-955 border border-slate-850 rounded-lg text-[10px] text-white outline-none h-16 resize-none"
                />
              </div>

              <button 
                type="submit"
                className="w-full py-2 bg-indigo-655 hover:bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer"
              >
                {editingPlan ? 'Update Plan' : 'Create Plan'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
