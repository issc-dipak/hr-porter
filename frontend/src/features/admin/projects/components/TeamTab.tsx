"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Loader2, UserPlus, X, Save, Trash2, Users, Mail, Building2, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API = '';
function getHeaders() {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('hr_system_token') || '';
  const companyId = localStorage.getItem('companyId') || 'company_001';
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'x-company-id': companyId };
}

const ROLES = ['Manager', 'Lead', 'Developer', 'Designer', 'QA', 'Reviewer', 'Analyst', 'Devops', 'Consultant', 'Member'];
const ROLE_COLORS: Record<string, string> = {
  Manager: 'bg-violet-500/10 text-violet-400',
  Lead: 'bg-blue-500/10 text-blue-400',
  Developer: 'bg-emerald-500/10 text-emerald-400',
  Designer: 'bg-pink-500/10 text-pink-400',
  QA: 'bg-amber-500/10 text-amber-400',
  Reviewer: 'bg-cyan-500/10 text-cyan-400',
  Analyst: 'bg-indigo-500/10 text-indigo-400',
  Devops: 'bg-orange-500/10 text-orange-400',
  Consultant: 'bg-teal-500/10 text-teal-400',
  Member: 'bg-slate-500/10 text-slate-400',
};

interface Props {
  project: any;
  employees: any[];
  onTeamChanged: () => void;
}

export default function TeamTab({ project, employees, onTeamChanged }: Props) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingMemberId, setAddingMemberId] = useState('');
  const [addingRole, setAddingRole] = useState('Member');
  const [addingUtilization, setAddingUtilization] = useState(100);
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const team: any[] = project.teamMembers || [];

  const addMember = async () => {
    if (!addingMemberId) return;
    const emp = employees.find(e => e._id === addingMemberId);
    if (!emp) return;
    setAdding(true);
    try {
      const res = await fetch(`${API}/api/projects/${project._id}/team`, {
        method: 'POST',
        headers: getHeaders() as any,
        body: JSON.stringify({
          companyId: project.companyId || 'company_001',
          employeeId: emp._id,
          employeeName: emp.fullName,
          employeeEmail: emp.email,
          role: addingRole,
          utilization: addingUtilization,
        })
      });
      const json = await res.json();
      if (json.success) { setShowAddModal(false); onTeamChanged(); }
    } catch (_) {}
    setAdding(false);
  };

  const removeMember = async (empId: string) => {
    if (!confirm('Remove this member from project?')) return;
    setRemovingId(empId);
    try {
      await fetch(`${API}/api/projects/${project._id}/team/${empId}?companyId=${project.companyId || 'company_001'}`, {
        method: 'DELETE',
        headers: getHeaders() as any
      });
      onTeamChanged();
    } catch (_) {}
    setRemovingId(null);
  };

  const availableEmployees = employees.filter(e => !team.find(m => m.employeeId === e._id));

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white">Project Team</h2>
          <p className="text-xs text-slate-400 mt-0.5">{team.length} member{team.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-colors">
          <UserPlus className="w-4 h-4" /> Add Member
        </button>
      </div>

      {/* Team Grid */}
      {team.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>No team members yet</p>
          <button onClick={() => setShowAddModal(true)} className="mt-3 text-violet-400 hover:text-violet-300 text-sm">+ Add first member</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {team.map((member: any, i: number) => (
            <motion.div key={member.employeeId} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5 relative group">
              {/* Remove button */}
              <button
                onClick={() => removeMember(member.employeeId)}
                disabled={removingId === member.employeeId}
                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
              >
                {removingId === member.employeeId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
              </button>

              {/* Avatar */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-lg text-white font-bold shadow-lg shadow-violet-500/20">
                  {member.employeeName?.charAt(0) || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-200 truncate">{member.employeeName}</p>
                  {member.employeeEmail && (
                    <p className="text-xs text-slate-500 truncate">{member.employeeEmail}</p>
                  )}
                </div>
              </div>

              {/* Role badge */}
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${ROLE_COLORS[member.role] || ROLE_COLORS.Member}`}>
                  {member.role}
                </span>
              </div>

              {/* Utilization */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Utilization</span>
                  <span className={`font-bold ${member.utilization > 90 ? 'text-red-400' : member.utilization > 70 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {member.utilization || 100}%
                  </span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${member.utilization > 90 ? 'bg-red-500' : member.utilization > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${member.utilization || 100}%` }} />
                </div>
              </div>

              {/* Joined */}
              {member.joinedAt && (
                <p className="text-xs text-slate-600 mt-2">
                  Joined {new Date(member.joinedAt).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Member Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) setShowAddModal(false); }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-700/60 rounded-2xl w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between p-5 border-b border-slate-800">
                <h2 className="text-base font-bold text-white">Add Team Member</h2>
                <button onClick={() => setShowAddModal(false)}><X className="w-5 h-5 text-slate-400 hover:text-white" /></button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Select Employee *</label>
                  <select value={addingMemberId} onChange={e => setAddingMemberId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-violet-500">
                    <option value="">Choose employee...</option>
                    {availableEmployees.map(e => (
                      <option key={e._id} value={e._id}>{e.fullName} — {e.department || e.designation}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Role in Project</label>
                  <select value={addingRole} onChange={e => setAddingRole(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-violet-500">
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Utilization: {addingUtilization}%</label>
                  <input type="range" min={10} max={100} step={10} value={addingUtilization}
                    onChange={e => setAddingUtilization(+e.target.value)}
                    className="w-full accent-violet-500" />
                  <div className="flex justify-between text-xs text-slate-600 mt-1">
                    <span>10%</span><span>50%</span><span>100%</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-800">
                <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white border border-slate-700 rounded-xl transition-colors">Cancel</button>
                <button onClick={addMember} disabled={adding || !addingMemberId}
                  className="flex items-center gap-2 px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50">
                  {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  Add Member
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
