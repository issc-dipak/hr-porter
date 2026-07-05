"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, CheckCircle, XCircle, Calendar, UserPlus, Clock,
  Search, DollarSign, RefreshCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/uiStore';
import { PastelStatCard } from '@/components/ui/PastelStatCard';

interface MyTeamDashboardProps {
  profile?: any;
}

// Deleted local StatCard definition

export default function MyTeamDashboard({ profile }: MyTeamDashboardProps) {
  const [teamData, setTeamData] = useState<any>(null);
  const [requests, setRequests] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'team' | 'requests'>('team');
  const [requestFilter, setRequestFilter] = useState<'all' | 'leave' | 'expense'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { triggerToast } = useUIStore();

  const fetchTeamData = async () => {
    const token = localStorage.getItem('hr_system_token');
    if (!token) return;
    try {
      const res = await fetch('/api/manager/team', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTeamData(data);
      }
    } catch (err) {
      console.error('Failed to load team data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    const token = localStorage.getItem('hr_system_token');
    if (!token) return;
    try {
      const res = await fetch('/api/manager/requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (err) {
      console.error('Failed to load requests:', err);
    } finally {
      setRequestsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamData();
    fetchRequests();
  }, []);

  const handleAction = async (id: string, requestType: string, action: 'Approved' | 'Rejected') => {
    const token = localStorage.getItem('hr_system_token');
    if (!token) return;

    setActionLoading(`${id}-${action}`);
    try {
      const res = await fetch('/api/manager/requests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ id, requestType, action })
      });

      if (res.ok) {
        triggerToast(`Request ${action.toLowerCase()} successfully!`, 'success');
        fetchRequests();
        fetchTeamData();
      } else {
        const err = await res.json();
        triggerToast(err.error || 'Action failed', 'error');
      }
    } catch (err) {
      triggerToast('Network error. Please try again.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredTeam = useMemo(() => {
    if (!teamData?.team) return [];
    return teamData.team.filter((emp: any) =>
      !searchTerm ||
      emp.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.designation?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [teamData, searchTerm]);

  const allRequests = useMemo(() => {
    if (!requests) return [];
    const leaves = (requests.pendingLeaves || []);
    const expenses = (requests.pendingExpenses || []);
    const all = [...leaves, ...expenses].sort((a: any, b: any) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    if (requestFilter === 'leave') return leaves;
    if (requestFilter === 'expense') return expenses;
    return all;
  }, [requests, requestFilter]);

  const stats = teamData?.stats;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading Your Team...</p>
      </div>
    );
  }

  if (!teamData || (stats?.totalMembers ?? 0) === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
          <Users className="w-8 h-8 text-indigo-500" />
        </div>
        <h2 className="text-lg font-black text-white uppercase tracking-tight mb-2">No Team Members Yet</h2>
        <p className="text-slate-400 text-sm max-w-sm">
          No employees are currently assigned to you as their Reporting Manager. 
          Ask your HR team to assign employees to your team.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Users className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">My Team</h1>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-10">
            {profile?.name || 'Manager'} · {stats?.totalMembers} Direct Reports
          </p>
        </div>
        <button
          onClick={() => { fetchTeamData(); fetchRequests(); }}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-none cursor-pointer"
        >
          <RefreshCcw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <PastelStatCard icon={Users} label="Total Team" value={stats?.totalMembers ?? 0} accent="#8B5CF6" />
        <PastelStatCard icon={CheckCircle} label="Present Today" value={stats?.present ?? 0} accent="#10B981" />
        <PastelStatCard icon={XCircle} label="Absent" value={stats?.absent ?? 0} accent="#F43F5E" />
        <PastelStatCard icon={Calendar} label="On Leave" value={stats?.onLeave ?? 0} accent="#F59E0B" />
        <PastelStatCard icon={UserPlus} label="New Joiners" value={stats?.newJoiners ?? 0} sub="This Month" accent="#3B82F6" />
        <PastelStatCard icon={Clock} label="Pending Approvals" value={stats?.pendingApprovals ?? 0} accent="#F97316" />
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800">
        {[
          { key: 'team', label: 'Team Members', count: stats?.totalMembers },
          { key: 'requests', label: 'Pending Requests', count: allRequests.length }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest border-none cursor-pointer transition-all rounded-t-xl',
              activeTab === tab.key
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'text-slate-400 hover:text-slate-200 bg-transparent'
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={cn(
                'inline-flex items-center justify-center min-w-[18px] h-4 px-1 rounded-full text-[8px] font-black',
                activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'
              )}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Team Members Tab */}
      {activeTab === 'team' && (
        <div className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search team members..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[11px] font-semibold text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="grid grid-cols-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
              {['Employee', 'Department', 'Designation', 'Email', 'Status'].map(h => (
                <div key={h} className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">{h}</div>
              ))}
            </div>

            {filteredTeam.length === 0 ? (
              <div className="py-16 text-center text-slate-400 font-bold uppercase tracking-wider text-xs">
                No team members match your search
              </div>
            ) : (
              filteredTeam.map((emp: any, i: number) => (
                <motion.div
                  key={emp._id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="grid grid-cols-5 border-b border-slate-100 dark:border-slate-800 last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3 px-4 py-3">
                    <img
                      src={emp.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${emp.fullName}`}
                      alt={emp.fullName}
                      className="w-8 h-8 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                    />
                    <div className="min-w-0">
                      <p className="text-[11px] font-black text-slate-900 dark:text-white truncate">{emp.fullName}</p>
                      {emp.empId && <p className="text-[9px] text-slate-400 font-mono">#{String(emp._id || '').slice(-4).toUpperCase()}</p>}
                    </div>
                  </div>
                  <div className="px-4 py-3 flex items-center">
                    <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate">{emp.department}</span>
                  </div>
                  <div className="px-4 py-3 flex items-center">
                    <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate">{emp.designation}</span>
                  </div>
                  <div className="px-4 py-3 flex items-center">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{emp.email}</span>
                  </div>
                  <div className="px-4 py-3 flex items-center">
                    <span className={cn(
                      'px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border',
                      (emp.status || '').toLowerCase() === 'active'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                    )}>
                      {emp.status || 'Active'}
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Pending Requests Tab */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'all', label: 'All Requests', count: allRequests.length },
              { key: 'leave', label: 'Leave', count: requests?.pendingLeaves?.length ?? 0, Icon: Calendar },
              { key: 'expense', label: 'Expense', count: requests?.pendingExpenses?.length ?? 0, Icon: DollarSign },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setRequestFilter(f.key as any)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border-none cursor-pointer transition-all',
                  requestFilter === f.key
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-200'
                )}
              >
                {f.Icon && <f.Icon className="w-3 h-3" />}
                {f.label}
                <span className={cn(
                  'ml-1 px-1 rounded-full text-[7px] font-black',
                  requestFilter === f.key ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                )}>{f.count}</span>
              </button>
            ))}
          </div>

          {requestsLoading ? (
            <div className="flex items-center justify-center py-16 gap-3">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-[10px] font-black text-slate-400 uppercase">Loading Requests...</p>
            </div>
          ) : allRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                <CheckCircle className="w-7 h-7 text-emerald-500" />
              </div>
              <h3 className="text-sm font-black text-white mb-1 uppercase">All Clear!</h3>
              <p className="text-slate-400 text-xs">No pending requests from your team members.</p>
            </div>
          ) : (
            <AnimatePresence>
              {allRequests.map((req: any, i: number) => (
                <motion.div
                  key={req._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all mb-3"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                      req.type === 'leave' ? 'bg-amber-500/10' : 'bg-emerald-500/10'
                    )}>
                      {req.type === 'leave'
                        ? <Calendar className="w-5 h-5 text-amber-500" />
                        : <DollarSign className="w-5 h-5 text-emerald-500" />
                      }
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={cn(
                          'px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border',
                          req.type === 'leave'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        )}>
                          {req.type === 'leave' ? `${req.subType} Leave` : `₹${req.amount?.toLocaleString('en-IN')} Expense`}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                          {new Date(req.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <p className="text-[12px] font-black text-slate-900 dark:text-white">{req.employeeName}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                        {req.type === 'leave'
                          ? `${req.date} · ${req.duration || '1 day'} · ${req.reason}`
                          : `${req.subType} · ${req.date} · ${req.description}`
                        }
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleAction(req._id, req.type, 'Approved')}
                        disabled={!!actionLoading}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border-none cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 transition-all"
                      >
                        {actionLoading === `${req._id}-Approved`
                          ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          : <CheckCircle className="w-3.5 h-3.5" />
                        }
                        Approve
                      </button>
                      <button
                        onClick={() => handleAction(req._id, req.type, 'Rejected')}
                        disabled={!!actionLoading}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer bg-rose-600/10 hover:bg-rose-600 text-rose-500 hover:text-white border border-rose-500/20 hover:border-rose-600 transition-all"
                      >
                        {actionLoading === `${req._id}-Rejected`
                          ? <span className="w-3 h-3 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                          : <XCircle className="w-3.5 h-3.5" />
                        }
                        Reject
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      )}
    </div>
  );
}
