"use client";

import React, { useState } from 'react';
import { X, Loader2, Save, FolderKanban, Plus, Trash2, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API = '';
function getHeaders() {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('hr_system_token') || '';
  const companyId = localStorage.getItem('companyId') || 'company_001';
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'x-company-id': companyId };
}

interface Props {
  onClose: () => void;
  onCreated: () => void;
  employees: any[];
}

const STEPS = ['Basic Info', 'Team & Timeline', 'Budget'];

export default function CreateProjectModal({ onClose, onCreated, employees }: Props) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    clientName: '',
    clientEmail: '',
    department: '',
    projectManagerId: '',
    projectManagerName: '',
    priority: 'Medium',
    status: 'Planning',
    startDate: '',
    endDate: '',
    estimatedHours: 0,
    totalBudget: 0,
    approvedBudget: 0,
    currency: 'INR',
    tags: '',
    teamMembers: [] as { employeeId: string; employeeName: string; role: string; utilization: number }[],
  });

  const [addMemberId, setAddMemberId] = useState('');
  const [addMemberRole, setAddMemberRole] = useState('Developer');

  const addTeamMember = () => {
    if (!addMemberId) return;
    const emp = employees.find(e => e._id === addMemberId);
    if (!emp) return;
    if (form.teamMembers.find(m => m.employeeId === addMemberId)) return;
    setForm(f => ({
      ...f,
      teamMembers: [...f.teamMembers, { employeeId: emp._id, employeeName: emp.fullName, role: addMemberRole, utilization: 100 }]
    }));
    setAddMemberId('');
  };

  const removeTeamMember = (id: string) => {
    setForm(f => ({ ...f, teamMembers: f.teamMembers.filter(m => m.employeeId !== id) }));
  };

  const create = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/projects`, {
        method: 'POST',
        headers: getHeaders() as any,
        body: JSON.stringify({
          ...form,
          companyId: 'company_001',
          tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
          totalBudget: Number(form.totalBudget),
          approvedBudget: Number(form.approvedBudget),
          estimatedHours: Number(form.estimatedHours),
        })
      });
      const json = await res.json();
      if (json.success) {
        onCreated();
      } else {
        alert(`Error: ${json.error || 'Failed to create project'}`);
      }
    } catch (err: any) {
      alert(`Network Error: ${err.message || 'Something went wrong'}`);
    }
    setSaving(false);
  };

  const managerEmployee = employees.find(e => e._id === form.projectManagerId);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 30 }}
        className="bg-slate-900 border border-slate-700/60 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-6 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <FolderKanban className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Create New Project</h2>
            <p className="text-xs text-slate-400">Step {step + 1} of {STEPS.length}: {STEPS[step]}</p>
          </div>
          <button onClick={onClose} className="ml-auto text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center gap-2 px-6 pt-5">
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <button onClick={() => i < step && setStep(i)}
                className={`flex items-center gap-2 text-xs font-semibold transition-colors ${
                  i === step ? 'text-violet-400' : i < step ? 'text-emerald-400 cursor-pointer' : 'text-slate-600'
                }`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  i === step ? 'bg-violet-600 text-white' : i < step ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-500'
                }`}>{i < step ? '✓' : i + 1}</div>
                {s}
              </button>
              {i < STEPS.length - 1 && <div className={`flex-1 h-px ${i < step ? 'bg-emerald-600/50' : 'bg-slate-800'}`} />}
            </React.Fragment>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Project Name *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. E-Commerce Platform v2.0"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-violet-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Description</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Project scope, goals, deliverables..."
                    rows={3} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-violet-500 resize-none transition-colors" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Client Name</label>
                    <input value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))}
                      placeholder="Client / Company"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-violet-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Client Email</label>
                    <input type="email" value={form.clientEmail} onChange={e => setForm(f => ({ ...f, clientEmail: e.target.value }))}
                      placeholder="client@example.com"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-violet-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Department</label>
                    <input value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                      placeholder="Engineering, Design, etc."
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-violet-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Priority</label>
                    <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-violet-500">
                      {['Low', 'Medium', 'High', 'Critical'].map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Tags (comma-separated)</label>
                  <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                    placeholder="e.g. frontend, api, mobile"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-violet-500" />
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Project Manager</label>
                  <select value={form.projectManagerId} onChange={e => {
                    const emp = employees.find(em => em._id === e.target.value);
                    setForm(f => ({ ...f, projectManagerId: e.target.value, projectManagerName: emp?.fullName || '' }));
                  }} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-violet-500">
                    <option value="">Select manager...</option>
                    {employees.map(e => <option key={e._id} value={e._id}>{e.fullName}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Start Date</label>
                    <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-violet-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">End Date</label>
                    <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-violet-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Estimated Hours</label>
                  <input type="number" value={form.estimatedHours} onChange={e => setForm(f => ({ ...f, estimatedHours: +e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-violet-500" />
                </div>

                {/* Team Members */}
                <div>
                  <label className="block text-xs text-slate-400 mb-2">Team Members</label>
                  <div className="flex gap-2 mb-3">
                    <select value={addMemberId} onChange={e => setAddMemberId(e.target.value)}
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-violet-500">
                      <option value="">Select employee...</option>
                      {employees.filter(e => !form.teamMembers.find(m => m.employeeId === e._id)).map(e => (
                        <option key={e._id} value={e._id}>{e.fullName}</option>
                      ))}
                    </select>
                    <select value={addMemberRole} onChange={e => setAddMemberRole(e.target.value)}
                      className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-violet-500">
                      {['Manager', 'Lead', 'Developer', 'Designer', 'QA', 'Reviewer', 'Analyst', 'Member'].map(r => <option key={r}>{r}</option>)}
                    </select>
                    <button onClick={addTeamMember} disabled={!addMemberId}
                      className="px-3 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg disabled:opacity-40 transition-colors">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {form.teamMembers.length > 0 && (
                    <div className="space-y-2">
                      {form.teamMembers.map(m => (
                        <div key={m.employeeId} className="flex items-center gap-3 bg-slate-800/50 rounded-xl px-3 py-2">
                          <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-xs text-white font-bold flex-shrink-0">
                            {m.employeeName.charAt(0)}
                          </div>
                          <span className="flex-1 text-sm text-slate-300 truncate">{m.employeeName}</span>
                          <span className="text-xs text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full">{m.role}</span>
                          <button onClick={() => removeTeamMember(m.employeeId)} className="text-slate-500 hover:text-red-400 transition-colors">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Total Budget (₹)</label>
                    <input type="number" value={form.totalBudget} onChange={e => setForm(f => ({ ...f, totalBudget: +e.target.value }))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-violet-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Approved Budget (₹)</label>
                    <input type="number" value={form.approvedBudget} onChange={e => setForm(f => ({ ...f, approvedBudget: +e.target.value }))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-violet-500" />
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-slate-800/50 border border-slate-700/40 rounded-2xl p-5 space-y-3">
                  <h3 className="text-sm font-bold text-white">Project Summary</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="text-slate-400">Name</div>
                    <div className="text-slate-200 font-medium truncate">{form.name || '—'}</div>
                    <div className="text-slate-400">Client</div>
                    <div className="text-slate-200 truncate">{form.clientName || '—'}</div>
                    <div className="text-slate-400">Priority</div>
                    <div className="text-slate-200">{form.priority}</div>
                    <div className="text-slate-400">Manager</div>
                    <div className="text-slate-200 truncate">{form.projectManagerName || '—'}</div>
                    <div className="text-slate-400">Timeline</div>
                    <div className="text-slate-200">{form.startDate || '—'} → {form.endDate || '—'}</div>
                    <div className="text-slate-400">Team</div>
                    <div className="text-slate-200">{form.teamMembers.length} members</div>
                    <div className="text-slate-400">Budget</div>
                    <div className="text-slate-200">₹{Number(form.approvedBudget).toLocaleString()}</div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-6 border-t border-slate-800">
          <button onClick={() => step > 0 ? setStep(s => s - 1) : onClose()}
            className="px-4 py-2.5 text-sm text-slate-400 hover:text-white border border-slate-700 rounded-xl transition-colors">
            {step === 0 ? 'Cancel' : '← Back'}
          </button>
          <div className="flex items-center gap-3">
            {step < STEPS.length - 1 ? (
              <button onClick={() => setStep(s => s + 1)} disabled={step === 0 && !form.name.trim()}
                className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50">
                Next →
              </button>
            ) : (
              <button onClick={create} disabled={saving || !form.name.trim()}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-violet-500/20 transition-all disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Create Project
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
