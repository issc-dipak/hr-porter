"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, Award, Heart, Gift, BarChart2, Star, Plus, Settings, MessageSquare, Loader2, Sparkles, ShieldCheck, Activity, Eye, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import RoleDashboardWidget from './components/RoleDashboardWidget';
import RecognitionWall from './components/RecognitionWall';
import BadgeLibrary from './components/BadgeLibrary';
import RewardCatalogView from './components/RewardCatalogView';
import LeaderboardView from './components/LeaderboardView';
import NominationCenter from './components/NominationCenter';
import { getRewardsSocket } from './socket';

const API = '';

function getHeaders() {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('hr_system_token') || '';
  const companyId = localStorage.getItem('companyId') || 'company_001';
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'x-company-id': companyId };
}

export default function RewardsPage({ role = 'Admin' }: { role?: string }) {
  const { profile } = useAuthStore();
  const myEmail = profile?.email || '';

  // State Management
  const [employees, setEmployees] = useState<any[]>([]);
  const myEmployeeId = employees.find(e => e.email?.toLowerCase().trim() === myEmail.toLowerCase().trim())?._id || profile?.id || '';
  const [stats, setStats] = useState<any>(null);
  const [appreciations, setAppreciations] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [myBadges, setMyBadges] = useState<any[]>([]);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [nominations, setNominations] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  // Program and Manual Points inputs
  const [showCreateProgram, setShowCreateProgram] = useState(false);
  const [programForm, setProgramForm] = useState({ name: '', description: '', budget: '', startDate: '', endDate: '', status: 'Draft' });
  const [showIssueCert, setShowIssueCert] = useState(false);
  const [certForm, setCertForm] = useState({ employeeId: '', templateType: 'Best Performer' });

  // Determine dynamic tabs based on role permissions
  const getTabsByRole = () => {
    switch (role) {
      case 'Employee':
        return [
          { id: 'Dashboard', label: 'My Dashboard', icon: Trophy },
          { id: 'Wall', label: 'Appreciation Wall', icon: Heart },
          { id: 'Badges', label: 'My Badges', icon: Award },
          { id: 'Store', label: 'Reward Store', icon: Gift },
          { id: 'Leaderboard', label: 'Leaderboard', icon: BarChart2 },
        ];
      case 'Reporting Manager':
      case 'Manager':
        return [
          { id: 'Dashboard', label: 'Dashboard', icon: Trophy },
          { id: 'Wall', label: 'Appreciation Wall', icon: Heart },
          { id: 'Badges', label: 'Team Badges', icon: Award },
          { id: 'Leaderboard', label: 'Team Leaderboard', icon: BarChart2 },
          { id: 'Nominations', label: 'Nominate Employee', icon: Star },
        ];
      case 'HR':
        return [
          { id: 'Dashboard', label: 'HR Dashboard', icon: Trophy },
          { id: 'Wall', label: 'Recognition Wall', icon: Heart },
          { id: 'Nominations', label: 'Nominations', icon: Star },
          { id: 'Catalog', label: 'Manage Catalog', icon: Gift },
          { id: 'Leaderboard', label: 'Leaderboard', icon: BarChart2 },
          { id: 'Certificates', label: 'Certificates', icon: ShieldCheck },
        ];
      case 'Admin':
      case 'Super Admin':
      default:
        return [
          { id: 'Dashboard', label: 'Admin Dashboard', icon: Trophy },
          { id: 'Wall', label: 'Recognition Wall', icon: Heart },
          { id: 'Programs', label: 'Reward Programs', icon: Sparkles },
          { id: 'Badges', label: 'Badge Library', icon: Award },
          { id: 'Catalog', label: 'Catalog', icon: Gift },
          { id: 'Leaderboard', label: 'Leaderboard', icon: BarChart2 },
          { id: 'Nominations', label: 'Nominations', icon: Star },
          { id: 'Certificates', label: 'Certificates', icon: ShieldCheck },
          { id: 'Audit', label: 'Audit Logs', icon: Activity },
        ];
    }
  };

  const tabs = getTabsByRole();
  const [activeTab, setActiveTab] = useState<string>('Dashboard');

  // Enforce correct default tab if role does not contain activeTab
  useEffect(() => {
    if (!tabs.some(t => t.id === activeTab)) {
      setActiveTab('Dashboard');
    }
  }, [role, tabs, activeTab]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const headers = getHeaders() as any;

      // Load employees list
      const empRes = await fetch(`${API}/api/employees`, { headers });
      const empJson = await empRes.json();
      setEmployees(Array.isArray(empJson) ? empJson : empJson.data || empJson.employees || []);

      // Load dashboard analytics
      const statRes = await fetch(`${API}/api/recognition/dashboard`, { headers });
      const statJson = await statRes.json();
      if (statJson.success) setStats(statJson.data);

      // Load Wall feed
      const wallRes = await fetch(`${API}/api/recognition/wall`, { headers });
      const wallJson = await wallRes.json();
      if (wallJson.success) setAppreciations(wallJson.data || []);

      // Load Badge Library
      const badgeRes = await fetch(`${API}/api/recognition/badges`, { headers });
      const badgeJson = await badgeRes.json();
      if (badgeJson.success) setBadges(badgeJson.data || []);

      // Load My Badges
      const myBadgeRes = await fetch(`${API}/api/recognition/badges/my`, { headers });
      const myBadgeJson = await myBadgeRes.json();
      if (myBadgeJson.success) setMyBadges(myBadgeJson.data || []);

      // Load Reward Catalog
      const catRes = await fetch(`${API}/api/recognition/catalog`, { headers });
      const catJson = await catRes.json();
      if (catJson.success) setCatalog(catJson.data || []);

      // Load Redemptions log
      const redRes = await fetch(`${API}/api/recognition/redemptions`, { headers });
      const redJson = await redRes.json();
      if (redJson.success) setRedemptions(redJson.data || []);

      // Load Nominations
      const nomRes = await fetch(`${API}/api/recognition/nominations`, { headers });
      const nomJson = await nomRes.json();
      if (nomJson.success) setNominations(nomJson.data || []);

      // Load Leaderboard
      const leadRes = await fetch(`${API}/api/recognition/leaderboard`, { headers });
      const leadJson = await leadRes.json();
      if (leadJson.success) setLeaderboard(leadJson.data || []);

      // Load Reward Programs
      const progRes = await fetch(`${API}/api/recognition/programs`, { headers });
      const progJson = await progRes.json();
      if (progJson.success) setPrograms(progJson.data || []);

      // Load Certificates
      const certRes = await fetch(`${API}/api/recognition/certificates`, { headers });
      const certJson = await certRes.json();
      if (certJson.success) setCertificates(certJson.data || []);

      // Load Audit Logs (Admin only)
      if (['Admin', 'Super Admin'].includes(role)) {
        const auditRes = await fetch(`${API}/api/recognition/audit-logs`, { headers });
        const auditJson = await auditRes.json();
        if (auditJson.success) setAuditLogs(auditJson.data || []);
      }

    } catch (e) {
      console.error('Error loading rewards data:', e);
    }
    setLoading(false);
  }, [role]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time WebSocket Listeners
  useEffect(() => {
    const socket = getRewardsSocket();
    if (!socket) return;

    socket.on('connect', () => {
      console.log('Rewards WebSocket connected');
    });

    // Handle new appreciations instantly
    socket.on('recognition_created', (newApp: any) => {
      setAppreciations(prev => {
        if (prev.some(a => a._id === newApp._id)) return prev;
        return [newApp, ...prev];
      });
      // Refresh dashboard stats
      loadData();
    });

    // Handle likes and comments updates
    socket.on('likes_updated', (updatedApp: any) => {
      setAppreciations(prev => prev.map(a => a._id === updatedApp._id ? updatedApp : a));
    });

    // Handle individual points balance updates
    socket.on('points_updated', ({ points }: { points: number }) => {
      setStats((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          myStats: {
            ...prev.myStats,
            pointsBalance: points
          }
        };
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [loadData, myEmail]);

  // Wall Actions
  const handleAddAppreciation = async (data: { recipientId: string; message: string; category: string }) => {
    try {
      const res = await fetch(`${API}/api/recognition/wall`, {
        method: 'POST',
        headers: getHeaders() as any,
        body: JSON.stringify(data)
      });
      const json = await res.json();
      if (json.success) {
        setAppreciations(prev => {
          if (prev.some(a => a._id === json.data._id)) return prev;
          return [json.data, ...prev];
        });
        loadData();
      }
    } catch (_) {}
  };

  const handleLike = async (id: string) => {
    try {
      const res = await fetch(`${API}/api/recognition/wall/${id}/like`, {
        method: 'POST',
        headers: getHeaders() as any
      });
      const json = await res.json();
      if (json.success) {
        setAppreciations(prev => prev.map(a => a._id === id ? json.data : a));
      }
    } catch (_) {}
  };

  const handleComment = async (id: string, text: string) => {
    try {
      const res = await fetch(`${API}/api/recognition/wall/${id}/comment`, {
        method: 'POST',
        headers: getHeaders() as any,
        body: JSON.stringify({ text })
      });
      const json = await res.json();
      if (json.success) {
        setAppreciations(prev => prev.map(a => a._id === id ? json.data : a));
      }
    } catch (_) {}
  };

  const handleDeleteAppreciation = async (id: string) => {
    try {
      const res = await fetch(`${API}/api/recognition/wall/${id}`, {
        method: 'DELETE',
        headers: getHeaders() as any
      });
      const json = await res.json();
      if (json.success) {
        setAppreciations(prev => prev.filter(a => a._id !== id));
        loadData();
      }
    } catch (_) {}
  };

  // Badge Actions
  const handleAwardBadge = async (data: { employeeId: string; badgeId: string; reason: string }) => {
    try {
      const res = await fetch(`${API}/api/recognition/badges/award`, {
        method: 'POST',
        headers: getHeaders() as any,
        body: JSON.stringify(data)
      });
      const json = await res.json();
      if (json.success) {
        loadData();
      }
    } catch (_) {}
  };

  const handleCreateBadge = async (data: any) => {
    try {
      const res = await fetch(`${API}/api/recognition/badges`, {
        method: 'POST',
        headers: getHeaders() as any,
        body: JSON.stringify(data)
      });
      const json = await res.json();
      if (json.success) {
        setBadges(prev => {
          if (prev.some(b => b._id === json.data._id)) return prev;
          return [...prev, json.data];
        });
        loadData();
      }
    } catch (_) {}
  };

  // Catalog Actions
  const handleRedeem = async (rewardId: string) => {
    try {
      const res = await fetch(`${API}/api/recognition/catalog/redeem`, {
        method: 'POST',
        headers: getHeaders() as any,
        body: JSON.stringify({ rewardId })
      });
      const json = await res.json();
      if (json.success) {
        loadData();
      }
    } catch (_) {}
  };

  const handleApproveRedemption = async (id: string, status: 'Approved' | 'Rejected', note?: string) => {
    try {
      const res = await fetch(`${API}/api/recognition/redemptions/${id}`, {
        method: 'PUT',
        headers: getHeaders() as any,
        body: JSON.stringify({ status, deliveryNote: note })
      });
      const json = await res.json();
      if (json.success) {
        setRedemptions(prev => prev.map(r => r._id === id ? json.data : r));
        loadData();
      }
    } catch (_) {}
  };

  // Nomination Actions
  const handleNominate = async (data: any) => {
    try {
      const res = await fetch(`${API}/api/recognition/nominations`, {
        method: 'POST',
        headers: getHeaders() as any,
        body: JSON.stringify(data)
      });
      const json = await res.json();
      if (json.success) {
        setNominations(prev => {
          if (prev.some(n => n._id === json.data._id)) return prev;
          return [json.data, ...prev];
        });
        loadData();
      }
    } catch (_) {}
  };

  const handleApproveNomination = async (id: string, status: 'Approved' | 'Rejected', pointsRewarded: number) => {
    try {
      const res = await fetch(`${API}/api/recognition/nominations/${id}/approve`, {
        method: 'PUT',
        headers: getHeaders() as any,
        body: JSON.stringify({ status, pointsRewarded })
      });
      const json = await res.json();
      if (json.success) {
        setNominations(prev => prev.map(n => n._id === id ? json.data : n));
        loadData();
      }
    } catch (_) {}
  };

  // Create Reward Program Action
  const handleCreateProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/api/recognition/programs`, {
        method: 'POST',
        headers: getHeaders() as any,
        body: JSON.stringify(programForm)
      });
      const json = await res.json();
      if (json.success) {
        setPrograms(prev => {
          if (prev.some(p => p._id === json.data._id)) return prev;
          return [json.data, ...prev];
        });
        setShowCreateProgram(false);
        setProgramForm({ name: '', description: '', budget: '', startDate: '', endDate: '', status: 'Draft' });
        loadData();
      }
    } catch (_) {}
  };

  // Issue Certificate Action
  const handleIssueCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/api/recognition/issue-certificate`, {
        method: 'POST',
        headers: getHeaders() as any,
        body: JSON.stringify(certForm)
      });
      const json = await res.json();
      if (json.success) {
        setCertificates(prev => {
          if (prev.some(c => c._id === json.data._id)) return prev;
          return [json.data, ...prev];
        });
        setShowIssueCert(false);
        setCertForm({ employeeId: '', templateType: 'Best Performer' });
        loadData();
      }
    } catch (_) {}
  };

  return (
    <div className="flex flex-col h-full bg-slate-950/40 text-slate-100 p-6 space-y-6">
      {/* Dynamic Header */}
      <div className="flex items-center justify-between border-b border-slate-800/60 pb-5 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-violet-600/10 text-violet-400 rounded-lg border border-violet-500/20">
              <Trophy className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-black text-white">
              {role === 'Employee' ? 'My Rewards & Cabinet' : 'Rewards & Recognition'}
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {role === 'Employee' ? 'Appreciate teammates, collect achievement badges, and redeem points.' : 'Enterprise-grade employee engagement and recognition portal.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={loadData} className="p-2 bg-slate-900 border border-slate-800 rounded-xl hover:text-white transition-colors">
            <Loader2 className={`w-4 h-4 ${loading ? 'animate-spin text-violet-400' : 'text-slate-400'}`} />
          </button>
        </div>
      </div>

      {/* Tabs navigation list based on role */}
      <div className="flex items-center gap-1 border-b border-slate-900 overflow-x-auto pb-2 scrollbar-none whitespace-nowrap">
        {tabs.map(tab => {
          const ActiveIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
                isActive
                  ? 'bg-violet-600 text-white shadow shadow-violet-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <ActiveIcon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content Rendering Switch Case */}
      {loading && !stats ? (
        <div className="flex flex-col items-center justify-center py-32 gap-3">
          <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
          <p className="text-xs text-slate-500">Syncing with active database...</p>
        </div>
      ) : (
        <div className="flex-1">
          {activeTab === 'Dashboard' && (
            <RoleDashboardWidget stats={stats} role={role} onNavigateTab={setActiveTab} />
          )}

          {activeTab === 'Wall' && (
            <RecognitionWall
              appreciations={appreciations}
              employees={employees}
              onAddAppreciation={handleAddAppreciation}
              onLike={handleLike}
              onComment={handleComment}
              myEmployeeId={myEmployeeId}
            />
          )}

          {activeTab === 'Badges' && (
            <BadgeLibrary
              badges={badges}
              myBadges={myBadges}
              employees={employees}
              role={role}
              onAwardBadge={handleAwardBadge}
              onCreateBadge={handleCreateBadge}
            />
          )}

          {(activeTab === 'Catalog' || activeTab === 'Store') && (
            <RewardCatalogView
              catalog={catalog}
              redemptions={redemptions}
              myPointsBalance={stats?.myStats?.pointsBalance || 0}
              role={role}
              onRedeem={handleRedeem}
              onApproveRedemption={handleApproveRedemption}
            />
          )}

          {activeTab === 'Leaderboard' && (
            <LeaderboardView leaderboard={leaderboard} />
          )}

          {activeTab === 'Nominations' && (
            <NominationCenter
              nominations={nominations}
              employees={employees}
              role={role}
              myEmployeeId={myEmployeeId}
              onSubmitNomination={handleNominate}
              onApproveNomination={handleApproveNomination}
            />
          )}

          {activeTab === 'Programs' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-200">Active Reward Programs</h3>
                <button onClick={() => setShowCreateProgram(true)} className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-xl">
                  + Create Program
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {programs.map((p) => (
                  <div key={p._id} className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5 space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold text-slate-200">{p.name}</h4>
                      <span className={`text-[9px] px-2 py-0.5 rounded ${p.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                        {p.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{p.description}</p>
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Budget: <strong>₹{p.budget}</strong></span>
                      <span>Spent: <strong>₹{p.spent}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'Certificates' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-200">Issued Certificates</h3>
                {['Admin', 'HR'].includes(role) && (
                  <button onClick={() => setShowIssueCert(true)} className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-xl">
                    + Issue Certificate
                  </button>
                )}
              </div>
              <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-850 text-slate-500 font-semibold uppercase">
                        <th className="py-2.5 px-3">Certificate ID</th>
                        <th className="py-2.5 px-3">Recipient</th>
                        <th className="py-2.5 px-3">Award Category</th>
                        <th className="py-2.5 px-3">Issue Date</th>
                        <th className="py-2.5 px-3">Issued By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850/30 text-slate-300">
                      {certificates.map((c) => (
                        <tr key={c._id} className="hover:bg-slate-800/10">
                          <td className="py-3 px-3 font-mono text-violet-400">{c.certificateNumber}</td>
                          <td className="py-3 px-3 font-bold">{c.employeeName}</td>
                          <td className="py-3 px-3">{c.templateType}</td>
                          <td className="py-3 px-3 text-slate-500">{c.issueDate}</td>
                          <td className="py-3 px-3 text-slate-500">{c.issuedByName}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Audit' && (
            <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-200">Recognition Audit Trail</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-850 text-slate-500 font-semibold uppercase">
                      <th className="py-2.5 px-3">Timestamp</th>
                      <th className="py-2.5 px-3">Actor</th>
                      <th className="py-2.5 px-3">Role</th>
                      <th className="py-2.5 px-3">Action</th>
                      <th className="py-2.5 px-3">IP Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/30 text-slate-300">
                    {auditLogs.map((l) => (
                      <tr key={l._id} className="hover:bg-slate-800/10">
                        <td className="py-2.5 px-3 text-slate-500">{new Date(l.createdAt).toLocaleString()}</td>
                        <td className="py-2.5 px-3 font-bold">{l.actorName}</td>
                        <td className="py-2.5 px-3 text-slate-400">{l.actorRole}</td>
                        <td className="py-2.5 px-3 text-violet-400 font-semibold">{l.action}</td>
                        <td className="py-2.5 px-3 text-slate-500">{l.ipAddress || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Create Reward Program Modal ── */}
      {showCreateProgram && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-slate-900 border border-slate-700/60 rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-850 pb-3">
              <h3 className="text-sm font-bold text-white">Create Reward Program</h3>
              <button onClick={() => setShowCreateProgram(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleCreateProgram} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Program Name *</label>
                <input value={programForm.name} onChange={e => setProgramForm(f => ({ ...f, name: e.target.value }))} required placeholder="e.g. Innovation Week"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs outline-none text-slate-200 focus:border-violet-500" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Description</label>
                <textarea value={programForm.description} onChange={e => setProgramForm(f => ({ ...f, description: e.target.value }))} placeholder="Explain details..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs outline-none text-slate-200 focus:border-violet-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Budget (₹) *</label>
                  <input type="number" value={programForm.budget} onChange={e => setProgramForm(f => ({ ...f, budget: e.target.value }))} required
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs outline-none text-slate-200 focus:border-violet-500" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Status</label>
                  <select value={programForm.status} onChange={e => setProgramForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs outline-none text-slate-200 focus:border-violet-500">
                    <option>Draft</option>
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Start Date *</label>
                  <input type="date" value={programForm.startDate} onChange={e => setProgramForm(f => ({ ...f, startDate: e.target.value }))} required
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs outline-none text-slate-200 focus:border-violet-500" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">End Date *</label>
                  <input type="date" value={programForm.endDate} onChange={e => setProgramForm(f => ({ ...f, endDate: e.target.value }))} required
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs outline-none text-slate-200 focus:border-violet-500" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setShowCreateProgram(false)} className="px-4 py-2 border border-slate-750 text-slate-400 rounded-xl text-xs">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold">Save Program</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* ── Issue Certificate Modal ── */}
      {showIssueCert && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-slate-900 border border-slate-700/60 rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-850 pb-3">
              <h3 className="text-sm font-bold text-white">Issue Digital Certificate</h3>
              <button onClick={() => setShowIssueCert(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleIssueCertificate} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Select Employee *</label>
                <select value={certForm.employeeId} onChange={e => setCertForm(f => ({ ...f, employeeId: e.target.value }))} required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs outline-none text-slate-200 focus:border-violet-500">
                  <option value="">Choose employee...</option>
                  {employees.map(e => <option key={e._id} value={e._id}>{e.fullName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Award Category</label>
                <select value={certForm.templateType} onChange={e => setCertForm(f => ({ ...f, templateType: e.target.value as any }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs outline-none text-slate-200 focus:border-violet-500">
                  <option>Best Performer</option>
                  <option>Employee of Month</option>
                  <option>Work Anniversary</option>
                  <option>Training Completion</option>
                  <option>Innovation Award</option>
                  <option>Leadership Award</option>
                  <option>Appreciation Award</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setShowIssueCert(false)} className="px-4 py-2 border border-slate-750 text-slate-400 rounded-xl text-xs">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold">Issue Certificate</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
