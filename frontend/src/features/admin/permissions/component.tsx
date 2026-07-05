"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  ShieldCheck, Check, Plus, Trash2, Users, RefreshCw, X,
  Loader2, Lock, Search, CheckCircle, AlertCircle, UserCheck,
  ChevronDown, ChevronRight, Sparkles, Save, Download, Upload,
  Copy, Undo, RotateCcw, AlertTriangle, Info, ListFilter, HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";
import { PastelStatCard } from '@/components/ui/PastelStatCard';

// ── Toast System ─────────────────────────────────────────────────────────────
interface ToastMsg { id: number; type: 'success' | 'error' | 'info'; message: string; }
let _toastId = 0;
function useToast() {
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const addToast = useCallback((type: ToastMsg['type'], message: string) => {
    const id = ++_toastId;
    setToasts(p => [...p, { id, type, message }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  }, []);
  return { toasts, addToast };
}
function ToastContainer({ toasts }: { toasts: ToastMsg[] }) {
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div className="fixed top-5 right-5 z-[99999] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div key={t.id}
            initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 60 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className={cn("flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border pointer-events-auto max-w-xs backdrop-blur-md",
              t.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300' :
              t.type === 'error' ? 'bg-rose-950/90 border-rose-500/30 text-rose-300' :
              'bg-slate-900/90 border-slate-700/50 text-slate-300')}
          >
            {t.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> :
             t.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <Info className="w-4 h-4 shrink-0" />}
            <p className="text-xs font-semibold">{t.message}</p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>,
    document.body
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface IRole { _id: string; name: string; description?: string; isSystem?: boolean; permissions?: string[]; }
interface IPermission { _id: string; key: string; module: string; action: string; description: string; }
interface IUser { _id: string; fullName: string; email: string; role: string; department?: string; }

// Module Emoji & Colors Map
const MODULE_ICONS: Record<string, string> = {
  'Employees': '👥', 'Onboarding': '🚀', 'Offboarding': '🚪', 'Attendance': '⏰',
  'Leaves': '🌴', 'Payroll': '💰', 'Expenses': '💸', 'Assets': '💻',
  'Recruitment': '📋', 'Performance': '📈', 'Branches': '🏢', 'Departments': '🏢',
  'Designations': '🎖', 'Policies': '📜', 'Announcements': '📢', 'Workplace Chat': '💬',
  'Helpdesk': '🎫', 'Reports & Analytics': '📊', 'Security': '🔒', 'Roles & Permissions': '🔐',
  'System Settings': '⚙', 'Billing & Subscription': '💳', 'Audit Logs': '📑',
  'Integrations': '🔌', 'Documents': '📁'
};

const MODULE_COLORS: Record<string, string> = {
  'Employees': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Onboarding': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  'Offboarding': 'bg-red-500/10 text-red-400 border-red-500/20',
  'Attendance': 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  'Leaves': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Payroll': 'bg-green-500/10 text-green-400 border-green-500/20',
  'Expenses': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Assets': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  'Recruitment': 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  'Performance': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'Branches': 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  'Departments': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  'Designations': 'bg-lime-500/10 text-lime-400 border-lime-500/20',
  'Policies': 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  'Announcements': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  'Workplace Chat': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  'Helpdesk': 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20',
  'Reports & Analytics': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  'Security': 'bg-rose-600/10 text-rose-400 border-rose-600/20',
  'Roles & Permissions': 'bg-emerald-600/10 text-emerald-400 border-emerald-600/20',
  'System Settings': 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  'Billing & Subscription': 'bg-violet-600/10 text-violet-400 border-violet-600/20',
  'Audit Logs': 'bg-blue-600/10 text-blue-400 border-blue-600/20',
  'Integrations': 'bg-teal-600/10 text-teal-400 border-teal-600/20',
  'Documents': 'bg-amber-600/10 text-amber-400 border-amber-600/20'
};

// ── Dependency Map ────────────────────────────────────────────────────────────
const DEPENDENCIES: Record<string, string[]> = {
  'employee.create': ['employee.view'],
  'employee.edit': ['employee.view'],
  'employee.delete': ['employee.view'],
  'employee.archive': ['employee.view'],
  'employee.restore': ['employee.view'],
  'employee.import': ['employee.view'],
  'employee.export': ['employee.view'],
  'employee.assign_branch': ['employee.view'],
  'employee.assign_department': ['employee.view'],
  'employee.assign_designation': ['employee.view'],
  'onboarding.edit': ['onboarding.create'],
  'onboarding.delete': ['onboarding.create'],
  'onboarding.assign_checklist': ['onboarding.create'],
  'onboarding.verify_documents': ['onboarding.upload_documents'],
  'onboarding.approve_documents': ['onboarding.upload_documents'],
  'onboarding.complete': ['onboarding.create'],
  'offboarding.approve_exit': ['offboarding.initiate'],
  'offboarding.asset_recovery': ['offboarding.initiate'],
  'offboarding.disable_login': ['offboarding.initiate'],
  'offboarding.exit_interview': ['offboarding.initiate'],
  'offboarding.final_settlement': ['offboarding.initiate'],
  'offboarding.experience_letter': ['offboarding.initiate'],
  'offboarding.relieving_letter': ['offboarding.initiate'],
  'attendance.edit': ['attendance.view'],
  'attendance.approve': ['attendance.view'],
  'attendance.reject': ['attendance.view'],
  'attendance.lock': ['attendance.view'],
  'attendance.unlock': ['attendance.view'],
  'leave.apply': ['leave.view'],
  'leave.cancel': ['leave.view'],
  'leave.approve': ['leave.view'],
  'leave.reject': ['leave.view'],
  'payroll.generate': ['payroll.view'],
  'payroll.process_salary': ['payroll.view'],
  'payroll.release_salary': ['payroll.view'],
  'expense.approve': ['expense.view'],
  'expense.reject': ['expense.view'],
  'assets.edit': ['assets.add'],
  'assets.delete': ['assets.add'],
  'assets.assign': ['assets.view'],
  'assets.return': ['assets.view'],
  'assets.transfer': ['assets.view'],
  'recruitment.edit_job': ['recruitment.create_job'],
  'recruitment.delete_job': ['recruitment.create_job'],
  'recruitment.publish_job': ['recruitment.create_job'],
  'performance.approve_review': ['performance.view_review'],
  'performance.promotion_recommendation': ['performance.view_review'],
};

export function RolesPermissionsPage({ embed = false }: { embed?: boolean }) {
  const [roles, setRoles] = useState<IRole[]>([]);
  const [originalRoles, setOriginalRoles] = useState<IRole[]>([]);
  const [permissions, setPermissions] = useState<IPermission[]>([]);
  const [users, setUsers] = useState<IUser[]>([]);

  // Current permission key sets mapped by roleId
  const [rolePerms, setRolePerms] = useState<Record<string, Set<string>>>({});
  // Saved database state to calculate audit log diffs
  const [dbRolePerms, setDbRolePerms] = useState<Record<string, Set<string>>>({});
  // Keep tracks of dirty roles
  const [dirtyRoles, setDirtyRoles] = useState<Set<string>>(new Set());

  // Filter and Category States
  const [search, setSearch] = useState('');
  const [selectedModuleFilter, setSelectedModuleFilter] = useState('All');
  const [collapsedModules, setCollapsedModules] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Undo / History Stack
  const [history, setHistory] = useState<Record<string, Set<string>>[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showConfirmSaveModal, setShowConfirmSaveModal] = useState(false);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [activeDropdownRoleId, setActiveDropdownRoleId] = useState<string | null>(null);

  // Modal Inputs
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [createError, setCreateError] = useState('');
  const [assignRoleId, setAssignRoleId] = useState('');
  const [cloneSourceRoleId, setCloneSourceRoleId] = useState('');
  const [cloneNewRoleName, setCloneNewRoleName] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState('');
  
  // Progress indicators
  const [saving, setSaving] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  const { toasts, addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Fetching Data ──────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('hr_system_token');
      const h = { 'Authorization': `Bearer ${token}` };
      const [rolesRes, permsRes, usersRes] = await Promise.all([
        fetch('/api/rbac/roles', { headers: h }),
        fetch('/api/rbac/permissions', { headers: h }),
        fetch('/api/rbac/users', { headers: h }),
      ]);

      const [rolesData, permsData, usersData] = await Promise.all([
        rolesRes.json(), permsRes.json(), usersRes.json()
      ]);

      const rolesArr: IRole[] = Array.isArray(rolesData) ? rolesData : rolesData.roles || [];
      const permsArr: IPermission[] = Array.isArray(permsData) ? permsData : permsData.permissions || [];
      const usersArr: IUser[] = Array.isArray(usersData) ? usersData : usersData.users || [];

      setRoles(rolesArr);
      setOriginalRoles(JSON.parse(JSON.stringify(rolesArr)));
      setPermissions(permsArr);
      setUsers(usersArr);

      const map: Record<string, Set<string>> = {};
      const dbMap: Record<string, Set<string>> = {};
      for (const r of rolesArr) {
        map[r._id] = new Set(r.permissions || []);
        dbMap[r._id] = new Set(r.permissions || []);
      }
      setRolePerms(map);
      setDbRolePerms(dbMap);
      setDirtyRoles(new Set());
      setHistory([JSON.parse(JSON.stringify(map))]);
      setHistoryIndex(0);
    } catch (e) {
      console.error(e);
      addToast('error', 'Failed to load roles and permissions matrix.');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── History Tracking (Undo/Redo) ───────────────────────────────────────────
  const updatePermsState = (nextMap: Record<string, Set<string>>) => {
    setRolePerms(nextMap);
    
    // Calculate new dirty roles
    const newDirty = new Set<string>();
    for (const rid of Object.keys(nextMap)) {
      const curr = Array.from(nextMap[rid]).sort().join(',');
      const db = Array.from(dbRolePerms[rid] || []).sort().join(',');
      if (curr !== db) {
        newDirty.add(rid);
      }
    }
    setDirtyRoles(newDirty);

    // Save to history stack
    const histCopy = history.slice(0, historyIndex + 1);
    histCopy.push(JSON.parse(JSON.stringify(nextMap)));
    setHistory(histCopy);
    setHistoryIndex(histCopy.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const idx = historyIndex - 1;
      setHistoryIndex(idx);
      const prev = history[idx];
      setRolePerms(JSON.parse(JSON.stringify(prev)));
      
      // Calculate dirty roles
      const newDirty = new Set<string>();
      for (const rid of Object.keys(prev)) {
        const curr = Array.from(prev[rid]).sort().join(',');
        const db = Array.from(dbRolePerms[rid] || []).sort().join(',');
        if (curr !== db) newDirty.add(rid);
      }
      setDirtyRoles(newDirty);
      addToast('info', 'Undo applied');
    }
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to discard all unsaved changes?")) {
      const resetMap: Record<string, Set<string>> = {};
      for (const rid of Object.keys(dbRolePerms)) {
        resetMap[rid] = new Set(dbRolePerms[rid]);
      }
      setRolePerms(resetMap);
      setDirtyRoles(new Set());
      setHistory([JSON.parse(JSON.stringify(resetMap))]);
      setHistoryIndex(0);
      addToast('info', 'All modifications reset to database states.');
    }
  };

  // ── Toggle Granular Permission with Dependency check ──────────────────────
  const togglePerm = (roleId: string, key: string, isSystem: boolean) => {
    if (isSystem && roles.find(r => r._id === roleId)?.name === 'Admin') {
      addToast('info', 'Admin system permissions cannot be modified.');
      return;
    }

    const next = { ...rolePerms };
    const s = new Set(next[roleId] || []);

    if (s.has(key)) {
      // Removing permission: also remove dependent child permissions
      s.delete(key);
      Object.keys(DEPENDENCIES).forEach(childKey => {
        if (DEPENDENCIES[childKey].includes(key) && s.has(childKey)) {
          s.delete(childKey);
          addToast('info', `Automatically removed dependent: ${childKey}`);
        }
      });
    } else {
      // Adding permission: ensure required parent permissions are checked
      s.add(key);
      if (DEPENDENCIES[key]) {
        DEPENDENCIES[key].forEach(parentKey => {
          if (!s.has(parentKey)) {
            s.add(parentKey);
            addToast('info', `Automatically granted prerequisite: ${parentKey}`);
          }
        });
      }
    }

    next[roleId] = s;
    updatePermsState(next);
  };

  // ── Bulk Select Module / Column ────────────────────────────────────────────
  const handleBulkModule = (roleId: string, moduleName: string, checkAll: boolean) => {
    const role = roles.find(r => r._id === roleId);
    if (role?.isSystem && role.name === 'Admin') return;

    const next = { ...rolePerms };
    const s = new Set(next[roleId] || []);
    const modPermKeys = permissions.filter(p => p.module === moduleName).map(p => p.key);

    if (checkAll) {
      modPermKeys.forEach(k => {
        s.add(k);
        // resolve parent dependencies
        if (DEPENDENCIES[k]) {
          DEPENDENCIES[k].forEach(pk => s.add(pk));
        }
      });
    } else {
      modPermKeys.forEach(k => {
        s.delete(k);
        // clean child dependencies
        Object.keys(DEPENDENCIES).forEach(child => {
          if (DEPENDENCIES[child].includes(k)) s.delete(child);
        });
      });
    }

    next[roleId] = s;
    updatePermsState(next);
  };

  const handleBulkRole = (roleId: string, grantAll: boolean) => {
    const role = roles.find(r => r._id === roleId);
    if (role?.isSystem && role.name === 'Admin') return;

    const next = { ...rolePerms };
    if (grantAll) {
      next[roleId] = new Set(permissions.map(p => p.key));
    } else {
      next[roleId] = new Set();
    }
    updatePermsState(next);
  };

  // ── Copy / Clone / Create Roles ───────────────────────────────────────────
  const copyPermissions = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    const target = roles.find(r => r._id === targetId);
    if (target?.isSystem && target.name === 'Admin') return;

    const next = { ...rolePerms };
    next[targetId] = new Set(rolePerms[sourceId] || []);
    updatePermsState(next);
    addToast('success', `Copied permissions from "${roles.find(r => r._id === sourceId)?.name}" to "${target?.name}"`);
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    setCreateError('');
    try {
      const token = localStorage.getItem('hr_system_token');
      const res = await fetch('/api/rbac/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: newRoleName.trim(), description: newRoleDesc.trim(), permissions: [] })
      });
      const data = await res.json();
      if (res.ok) {
        setShowCreateModal(false);
        setNewRoleName('');
        setNewRoleDesc('');
        addToast('success', `Role "${data.name || newRoleName.trim()}" created successfully!`);
        await fetchAll();
      } else {
        setCreateError(data.error || 'Failed to create role.');
      }
    } catch {
      setCreateError('Network error.');
    }
  };

  const handleCloneRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cloneSourceRoleId || !cloneNewRoleName.trim()) return;
    try {
      const token = localStorage.getItem('hr_system_token');
      const res = await fetch('/api/rbac/roles/clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          sourceRoleId: cloneSourceRoleId,
          name: cloneNewRoleName.trim()
        })
      });
      const data = await res.json();
      if (res.ok) {
        setShowCloneModal(false);
        setCloneNewRoleName('');
        addToast('success', `Role cloned into "${cloneNewRoleName.trim()}"!`);
        await fetchAll();
      } else {
        addToast('error', data.error || 'Failed to clone role.');
      }
    } catch {
      addToast('error', 'Network error.');
    }
  };

  const deleteRole = async (role: IRole) => {
    if (role.isSystem) {
      addToast('error', 'System default roles cannot be deleted.');
      return;
    }
    if (!window.confirm(`Are you absolutely sure you want to delete role "${role.name}"? This cannot be undone.`)) return;
    try {
      const token = localStorage.getItem('hr_system_token');
      const res = await fetch(`/api/rbac/roles/${role._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        addToast('success', `Role "${role.name}" deleted.`);
        await fetchAll();
      } else {
        const d = await res.json();
        addToast('error', d.error || 'Failed to delete role.');
      }
    } catch {
      addToast('error', 'Network error.');
    }
  };

  // ── Assign Users ───────────────────────────────────────────────────────────
  const openAssign = (roleId: string) => {
    setAssignRoleId(roleId);
    const role = roles.find(r => r._id === roleId);
    const already = users.filter(u => u.role === role?.name).map(u => u._id);
    setSelectedUserIds(already);
    setUserSearch('');
    setShowAssignModal(true);
  };

  const handleAssign = async () => {
    if (!assignRoleId) return;
    setIsAssigning(true);
    try {
      const token = localStorage.getItem('hr_system_token');
      const res = await fetch(`/api/rbac/roles/${assignRoleId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ userIds: selectedUserIds })
      });
      if (res.ok) {
        setShowAssignModal(false);
        addToast('success', 'User role assignments updated successfully.');
        await fetchAll();
      } else {
        const data = await res.json();
        addToast('error', data.error || 'Failed to assign users.');
      }
    } catch {
      addToast('error', 'Network error.');
    } finally {
      setIsAssigning(false);
    }
  };

  // ── Save Permissions ───────────────────────────────────────────────────────
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleApplyChanges = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('hr_system_token');
      const h = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

      // Save only dirty roles
      const dirtyArray = Array.from(dirtyRoles);
      await Promise.all(
        dirtyArray.map(async (roleId) => {
          const res = await fetch(`/api/rbac/roles/${roleId}`, {
            method: 'PUT',
            headers: h,
            body: JSON.stringify({ permissions: Array.from(rolePerms[roleId] || []) })
          });
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || `Failed to save role: ${roleId}`);
          }
        })
      );

      // Invalidate frontend cache
      localStorage.removeItem('hr_rbac_permissions');
      addToast('success', 'Permissions saved successfully!');
      setShowConfirmSaveModal(false);
      await fetchAll();
    } catch (e: any) {
      console.error(e);
      addToast('error', e.message || 'Failed to save changes. Some modifications might not have applied.');
    } finally {
      setSaving(false);
    }
  };

  // ── Export / Import JSON ───────────────────────────────────────────────────
  const handleExportMatrix = () => {
    const exportData: Record<string, string[]> = {};
    roles.forEach(r => {
      exportData[r.name] = Array.from(rolePerms[r._id] || []);
    });
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hrms_permissions_matrix_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    addToast('success', 'Permissions matrix exported successfully!');
  };

  const handleImportMatrix = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const next = { ...rolePerms };
        let matchedCount = 0;

        roles.forEach(r => {
          if (Array.isArray(json[r.name])) {
            // Verify keys exist in permissions list
            const validKeys = json[r.name].filter((k: string) => permissions.some(p => p.key === k));
            next[r._id] = new Set(validKeys);
            matchedCount++;
          }
        });

        if (matchedCount === 0) {
          addToast('error', 'Import file does not match any roles by name.');
          return;
        }

        updatePermsState(next);
        addToast('success', `Successfully imported permissions mapping for ${matchedCount} roles!`);
      } catch {
        addToast('error', 'Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Diffs & Audit Logs calculation ─────────────────────────────────────────
  const getAuditLogDiffs = () => {
    const logs: { roleName: string; added: string[]; removed: string[] }[] = [];
    dirtyRoles.forEach(rid => {
      const roleName = roles.find(r => r._id === rid)?.name || 'Unknown';
      const db = dbRolePerms[rid] || new Set();
      const curr = rolePerms[rid] || new Set();

      const added = Array.from(curr).filter(k => !db.has(k));
      const removed = Array.from(db).filter(k => !curr.has(k));

      if (added.length || removed.length) {
        logs.push({ roleName, added, removed });
      }
    });
    return logs;
  };

  // ── Filter logic ───────────────────────────────────────────────────────────
  const modules = Array.from(new Set(permissions.map(p => p.module))).sort();
  const filtered = permissions.filter(p => {
    const matchesSearch = p.key.toLowerCase().includes(search.toLowerCase()) ||
                          p.description.toLowerCase().includes(search.toLowerCase()) ||
                          p.module.toLowerCase().includes(search.toLowerCase());
    const matchesModule = selectedModuleFilter === 'All' || p.module === selectedModuleFilter;
    return matchesSearch && matchesModule;
  });
  const filteredModules = Array.from(new Set(filtered.map(p => p.module))).sort();

  const toggleCollapseModule = (mod: string) => {
    setCollapsedModules(prev => {
      const s = new Set(prev);
      if (s.has(mod)) s.delete(mod); else s.add(mod);
      return s;
    });
  };

  // UI role badge colors
  const roleColor = (name: string) => {
    if (name === 'Admin') return 'from-blue-600 to-indigo-600 shadow-blue-500/20';
    if (name === 'HR') return 'from-violet-600 to-purple-600 shadow-purple-500/20';
    if (name === 'Employee') return 'from-emerald-600 to-teal-600 shadow-emerald-500/20';
    return 'from-slate-600 to-slate-700 shadow-slate-500/20';
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest animate-pulse">Assembling Security Matrix...</p>
      </div>
    );
  }

  const logsDiff = getAuditLogDiffs();
  const assignedRole = roles.find(r => r._id === assignRoleId);

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} />

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      {!embed && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/90 dark:bg-slate-950/70 border border-slate-800/80 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-indigo-500/30">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
                <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                <span className="text-[9px] font-black text-blue-400 uppercase tracking-[0.25em]">Access Protection Engine</span>
              </div>
              <h1 className="text-xl font-black text-white tracking-tight font-outfit mt-0.5">Manage Roles & Permissions</h1>
              <p className="text-xs text-slate-400 mt-0.5">Manage access control for every HRMS module using enterprise-grade RBAC.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={handleExportMatrix} className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-755 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all border border-slate-700/50 cursor-pointer">
              <Download className="w-3.5 h-3.5" /> Export Matrix
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-755 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all border border-slate-700/50 cursor-pointer">
              <Upload className="w-3.5 h-3.5" /> Import Matrix
            </button>
            <input type="file" ref={fileInputRef} onChange={handleImportMatrix} accept=".json" className="hidden" />
          </div>
        </div>
      )}

      {/* ── ROLES OVERVIEW STATS GRID ───────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-left">
        {[
          { label: 'Security Roles', value: roles.length.toString(), icon: Lock, accent: '#3B82F6', sub: 'Configured role profiles' },
          { label: 'System Defaults', value: roles.filter(r => r.isSystem).length.toString(), icon: ShieldCheck, accent: '#10B981', sub: 'Core system defaults' },
          { label: 'Guarded Rules', value: permissions.length.toString(), icon: Sparkles, accent: '#8B5CF6', sub: 'Granular permissions' },
          { label: 'Active Users', value: users.length.toString(), icon: Users, accent: '#06B6D4', sub: 'Users assigned to roles' }
        ].map((stat, idx) => (
          <PastelStatCard key={idx} icon={stat.icon} label={stat.label} value={stat.value} sub={stat.sub} accent={stat.accent} />
        ))}
      </div>

      {/* ── TOOLBAR & FILTERS ───────────────────────────────────────────── */}
      <div className="rounded-3xl border border-slate-150 dark:border-slate-800/80 bg-white dark:bg-slate-950 p-4 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative w-64 max-w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search scopes & keys..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-800 dark:text-slate-100"
              />
            </div>

            {/* Module Filter */}
            <div className="relative">
              <select
                value={selectedModuleFilter}
                onChange={e => setSelectedModuleFilter(e.target.value)}
                className="pl-3 pr-8 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-800 dark:text-slate-100 appearance-none cursor-pointer"
              >
                <option value="All">All Modules</option>
                {modules.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>

            {/* Save Button */}
            {dirtyRoles.size > 0 && (
              <button
                type="button"
                onClick={() => setShowConfirmSaveModal(true)}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-[10px] font-black uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95 border-none cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" /> Save Changes ({dirtyRoles.size})
              </button>
            )}
          </div>
        </div>

        {/* Unsaved changes top banner */}
        {dirtyRoles.size > 0 && (
          <div className="flex items-center justify-between p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 animate-pulse shrink-0" />
              <p className="text-xs text-amber-600 dark:text-amber-400 font-bold">
                You have unsaved permission overrides for <span className="underline font-black">{Array.from(dirtyRoles).map(rid => roles.find(r => r._id === rid)?.name).join(', ')}</span>.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowConfirmSaveModal(true)}
              className="text-[10px] font-black uppercase text-amber-500 hover:underline border-none bg-transparent cursor-pointer"
            >
              Review & Apply
            </button>
          </div>
        )}
      </div>

      {/* ── MATRIX VIEW TABLE ───────────────────────────────────────────── */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-950 overflow-hidden shadow-sm">
        <div className="overflow-x-auto max-h-[70vh] relative font-sans no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/60 sticky top-0 z-20 backdrop-blur-md">
                <th className="p-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest min-w-[280px]">
                  HRMS Permission Scope
                </th>
                {roles.map(role => {
                  const isAdmin = role.name === 'Admin' && role.isSystem;
                  const totalGranted = rolePerms[role._id]?.size || 0;
                  return (
                    <th key={role._id} className="p-2 py-3 text-center align-top min-w-[105px] border-l border-slate-100 dark:border-slate-800/50 bg-slate-50/20 dark:bg-slate-900/10">
                      <div className="flex flex-col items-center gap-1 group">
                        {/* Role tag badge */}
                        <div className={cn("px-2 py-0.5 rounded-full text-[8px] font-black text-white bg-gradient-to-r shadow-md uppercase tracking-wider", roleColor(role.name))}>
                          {role.name}
                        </div>

                        {/* Lock / System indicator badge */}
                        {role.isSystem ? (
                          <span className="text-[7px] text-slate-400 dark:text-slate-450 bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800 px-1.5 py-0.5 rounded flex items-center gap-0.5 font-bold uppercase tracking-wider">
                            <Lock className="w-2 h-2 text-slate-550" /> System Default
                          </span>
                        ) : (
                          <span className="text-[7px] text-blue-500 dark:text-blue-400 bg-blue-500/5 border border-blue-500/10 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                            Custom Role
                          </span>
                        )}

                        {/* Granted permissions ratio count */}
                        <span className="text-[7.5px] bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200/40 dark:border-slate-800 px-1.5 py-0.5 rounded font-black">
                          {totalGranted} / {permissions.length} granted
                        </span>

                        {/* Bulk Action Dropdown / Buttons */}
                        <div className="flex items-center gap-1 mt-1 opacity-90 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openAssign(role._id)}
                            title="Assign Employees"
                            className="p-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded text-slate-400 hover:text-blue-500 transition-all cursor-pointer"
                          >
                            <Users className="w-3 h-3" />
                          </button>
                          
                          {!isAdmin ? (
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveDropdownRoleId(activeDropdownRoleId === role._id ? null : role._id);
                                }}
                                className="flex items-center gap-0.5 text-[8px] font-black bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-1 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-655 dark:text-slate-350 transition-all active:scale-95"
                              >
                                Bulk Actions <ChevronDown className="w-2 h-2 text-slate-450 shrink-0" />
                              </button>

                              {activeDropdownRoleId === role._id && (
                                <>
                                  <div 
                                    className="fixed inset-0 z-30" 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveDropdownRoleId(null);
                                    }}
                                  />
                                  <div className="absolute left-0 mt-1 w-32 bg-slate-900 dark:bg-slate-955 border border-slate-800 rounded-xl shadow-2xl p-1 z-40 flex flex-col gap-0.5 text-left animate-in fade-in duration-100">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleBulkRole(role._id, true);
                                        setActiveDropdownRoleId(null);
                                      }}
                                      className="w-full text-left px-2 py-1 rounded-md text-[8px] font-black text-slate-300 hover:bg-slate-800 transition-all cursor-pointer flex items-center gap-1.5 border-none"
                                    >
                                      <CheckCircle className="w-2.5 h-2.5 text-emerald-500 shrink-0" /> Grant All
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleBulkRole(role._id, false);
                                        setActiveDropdownRoleId(null);
                                      }}
                                      className="w-full text-left px-2 py-1 rounded-md text-[8px] font-black text-slate-300 hover:bg-slate-800 transition-all cursor-pointer flex items-center gap-1.5 border-none"
                                    >
                                      <X className="w-2.5 h-2.5 text-rose-500 shrink-0" /> Revoke All
                                    </button>
                                    {roles.filter(r => r._id !== role._id).map(r => (
                                      <button
                                        type="button"
                                        key={r._id}
                                        onClick={() => {
                                          copyPermissions(r._id, role._id);
                                          setActiveDropdownRoleId(null);
                                        }}
                                        className="w-full text-left px-2 py-1 rounded-md text-[8px] font-black text-slate-300 hover:bg-slate-800 transition-all cursor-pointer flex items-center gap-1.5 border-none border-t border-slate-800/40 mt-0.5 pt-1"
                                      >
                                        <Copy className="w-2.5 h-2.5 text-blue-500 shrink-0" /> Copy from {r.name}
                                      </button>
                                    ))}
                                  </div>
                                </>
                              )}
                            </div>
                          ) : (
                            /* Invisible placeholder for Bulk Actions button to maintain exact alignment */
                            <div className="text-[8px] border border-transparent rounded px-1.5 py-1 opacity-0 pointer-events-none select-none">
                              Bulk Actions
                            </div>
                          )}

                          {!role.isSystem && (
                            <button
                              onClick={() => deleteRole(role)}
                              title="Delete Custom Role"
                              className="p-1 bg-slate-50 hover:bg-rose-50 dark:bg-slate-900 dark:hover:bg-rose-955/20 border border-slate-200 dark:border-slate-800 rounded text-slate-400 hover:text-rose-500 transition-all cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredModules.map(mod => {
                const modPerms = filtered.filter(p => p.module === mod);
                const collapsed = collapsedModules.has(mod);
                const tagClass = MODULE_COLORS[mod] || 'bg-slate-500/10 text-slate-400 border-slate-500/20';
                const emoji = MODULE_ICONS[mod] || '🔑';

                return (
                  <React.Fragment key={mod}>
                    {/* Module Category Row Header */}
                    <tr className="bg-slate-50/50 dark:bg-slate-900/30">
                      <td className="p-3 sticky left-0 z-10 font-bold bg-slate-55 dark:bg-slate-900/80 backdrop-blur-sm cursor-pointer" onClick={() => toggleCollapseModule(mod)}>
                        <div className="flex items-center gap-2">
                          {collapsed ? <ChevronRight className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                          <span className={cn("text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0", tagClass)}>
                            {emoji} {mod}
                          </span>
                          <span className="text-[9px] text-slate-400">
                            ({modPerms.length} rules)
                          </span>
                        </div>
                      </td>

                      {/* Bulk Category Toggle Checkbox per Role */}
                      {roles.map(role => {
                        const isAdmin = role.name === 'Admin' && role.isSystem;
                        const targetSet = rolePerms[role._id] || new Set();
                        const totalModKeys = modPerms.map(p => p.key);
                        const hasAll = totalModKeys.every(k => targetSet.has(k));
                        const hasSome = !hasAll && totalModKeys.some(k => targetSet.has(k));

                        return (
                          <td key={role._id} className="p-3 text-center border-l border-slate-100 dark:border-slate-800/50 bg-slate-50/20 dark:bg-slate-900/10">
                            {!isAdmin && (
                              <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={hasAll}
                                  ref={el => {
                                    if (el) el.indeterminate = hasSome;
                                  }}
                                  onChange={e => handleBulkModule(role._id, mod, e.target.checked)}
                                  className="w-3.5 h-3.5 text-blue-600 bg-slate-150 border-slate-350 dark:border-slate-700 rounded cursor-pointer"
                                />
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Module Check</span>
                              </label>
                            )}
                          </td>
                        );
                      })}
                    </tr>

                    {/* Permissions list */}
                    {!collapsed && modPerms.map((perm, idx) => (
                      <tr key={perm._id} className={cn("hover:bg-blue-50/10 dark:hover:bg-blue-950/5 transition-colors", idx % 2 === 0 ? '' : 'bg-slate-50/10 dark:bg-slate-900/5')}>
                        {/* Permission description */}
                        <td className="p-4 py-3 min-w-[280px]">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-mono text-[10px] font-black text-slate-800 dark:text-slate-200">{perm.key}</p>
                              {DEPENDENCIES[perm.key] && (
                                <div className="group relative">
                                  <HelpCircle className="w-3 h-3 text-amber-500 cursor-pointer animate-pulse" />
                                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 hidden group-hover:block w-48 bg-slate-905 text-white text-[9px] p-2 rounded-lg shadow-xl z-30 font-semibold border border-slate-800 leading-tight">
                                    Requires prerequisite: {DEPENDENCIES[perm.key].join(', ')}
                                  </div>
                                </div>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 leading-relaxed">{perm.description}</p>
                          </div>
                        </td>

                        {/* Matrix checkboxes */}
                        {roles.map(role => {
                          const isAdmin = role.name === 'Admin' && role.isSystem;
                          const hasPerm = rolePerms[role._id]?.has(perm.key) ?? false;
                          const isUnsaved = dbRolePerms[role._id] && dbRolePerms[role._id].has(perm.key) !== hasPerm;

                          return (
                            <td key={role._id} className={cn("p-4 py-3 text-center border-l border-slate-100 dark:border-slate-800/50", isUnsaved && "bg-amber-500/5")}>
                              <div className="flex items-center justify-center">
                                <button
                                  type="button"
                                  onClick={() => togglePerm(role._id, perm.key, !!role.isSystem)}
                                  disabled={isAdmin}
                                  className={cn(
                                    "relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500/20",
                                    isAdmin
                                      ? "bg-blue-600/50 cursor-not-allowed opacity-60"
                                      : hasPerm
                                      ? "bg-emerald-500 shadow-md shadow-emerald-500/10"
                                      : "bg-slate-200 dark:bg-slate-800"
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
                                      hasPerm || isAdmin ? "translate-x-5" : "translate-x-0"
                                    )}
                                  />
                                </button>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="text-center py-20 text-slate-400">
              <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-semibold">No permissions found</p>
              <p className="text-xs mt-1 text-slate-500">Try matching a different search term or check module filters.</p>
            </div>
          )}
        </div>

        {/* Legend Footer */}
        <div className="p-4 border-t border-slate-150 dark:border-slate-800/80 bg-slate-55/30 dark:bg-slate-905/20 flex items-center gap-4 flex-wrap text-[9px] font-semibold text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-blue-500 flex items-center justify-center text-white"><Check className="w-2.5 h-2.5 stroke-[3]" /></div>
            <span>Admin (Default Locked)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-emerald-500 flex items-center justify-center text-white"><Check className="w-2.5 h-2.5 stroke-[3]" /></div>
            <span>Granted Permission</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded border border-slate-350 dark:border-slate-700" />
            <span>Denied / Unassigned</span>
          </div>
          <div className="flex items-center gap-1.5 ml-auto">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Unsaved Changes Warning</span>
          </div>
        </div>
      </div>

      {/* ── CREATE ROLE MODAL ────────────────────────────────────────────── */}
      <AnimatePresence>
        {showCreateModal && mounted && typeof document !== 'undefined' && createPortal(
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-slate-955/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="absolute inset-0" onClick={() => { setShowCreateModal(false); setCreateError(''); }} />
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20 }}
              className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 z-10 overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600" />
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Create Custom Role</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Initialize a custom role with custom mappings</p>
                  </div>
                  <button onClick={() => { setShowCreateModal(false); setCreateError(''); }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 border-none bg-transparent cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {createError && (
                  <div className="mb-4 flex items-start gap-2 p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-500/30 rounded-xl">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">{createError}</p>
                  </div>
                )}
                <form onSubmit={handleCreateRole} className="space-y-4">
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Role Designation Name *</label>
                    <input type="text" required value={newRoleName} onChange={e => setNewRoleName(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-955 border border-slate-205 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-800 dark:text-slate-200 font-bold"
                      placeholder="e.g. Finance Auditor, Talent Lead" />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Description / Scope</label>
                    <textarea value={newRoleDesc} onChange={e => setNewRoleDesc(e.target.value)}
                      className="w-full px-3 py-2 text-xs h-20 resize-none bg-slate-50 dark:bg-slate-955 border border-slate-205 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-800 dark:text-slate-200 font-bold"
                      placeholder="Define the scope and limits of this role..." />
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={() => { setShowCreateModal(false); setCreateError(''); }}
                      className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer border-none transition-all">
                      Cancel
                    </button>
                    <button type="submit"
                      className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer border-none shadow-lg shadow-blue-500/20 transition-all">
                      Create Role
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>,
          document.body
        )}
      </AnimatePresence>

      {/* ── CLONE ROLE MODAL ────────────────────────────────────────────── */}
      <AnimatePresence>
        {showCloneModal && mounted && typeof document !== 'undefined' && createPortal(
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-slate-955/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="absolute inset-0" onClick={() => setShowCloneModal(false)} />
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20 }}
              className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 z-10 overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-violet-600" />
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight font-outfit">Clone Security Role</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Copy all configuration permissions mapping of an existing role</p>
                  </div>
                  <button onClick={() => setShowCloneModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 border-none bg-transparent cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <form onSubmit={handleCloneRole} className="space-y-4">
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Source Template Role</label>
                    <select
                      value={cloneSourceRoleId}
                      onChange={e => setCloneSourceRoleId(e.target.value)}
                      className="w-full px-3 py-2.5 text-xs bg-slate-55 dark:bg-slate-955 border border-slate-205 dark:border-slate-805 rounded-xl focus:outline-none text-slate-800 dark:text-slate-200 font-bold cursor-pointer"
                    >
                      {roles.map(r => (
                        <option key={r._id} value={r._id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">New Role Name *</label>
                    <input type="text" required value={cloneNewRoleName} onChange={e => setCloneNewRoleName(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-800 dark:text-slate-200 font-bold"
                      placeholder="e.g. IT Administrator (Branch B)" />
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={() => setShowCloneModal(false)}
                      className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer border-none transition-all">
                      Cancel
                    </button>
                    <button type="submit"
                      className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer border-none shadow-lg shadow-indigo-500/20 transition-all">
                      Clone Role
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>,
          document.body
        )}
      </AnimatePresence>

      {/* ── ASSIGN USERS MODAL ──────────────────────────────────────────── */}
      <AnimatePresence>
        {showAssignModal && assignedRole && mounted && typeof document !== 'undefined' && createPortal(
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-slate-955/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="absolute inset-0" onClick={() => setShowAssignModal(false)} />
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20 }}
              className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 z-10 overflow-hidden flex flex-col max-h-[85vh]">
              <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase font-outfit">Assign Corporate Accounts</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Assigning to security policy: <span className="font-black text-blue-500">{assignedRole.name}</span>
                    </p>
                  </div>
                  <button onClick={() => setShowAssignModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 border-none bg-transparent cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="relative mt-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" placeholder="Search team members by name or email..." value={userSearch} onChange={e => setUserSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-955 border border-slate-205 dark:border-slate-800 rounded-xl focus:outline-none text-slate-850 dark:text-slate-200 font-bold" />
                </div>
              </div>
              <div className="overflow-y-auto flex-1 p-4 space-y-2 font-sans">
                {users.filter(u => {
                  const q = userSearch.toLowerCase();
                  return `${u.fullName} ${u.email}`.toLowerCase().includes(q);
                }).map(u => {
                  const checked = selectedUserIds.includes(u._id);
                  return (
                    <div key={u._id} onClick={() => setSelectedUserIds(prev => prev.includes(u._id) ? prev.filter(id => id !== u._id) : [...prev, u._id])}
                      className={cn("flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all select-none",
                        checked ? "bg-emerald-50 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-500/20" :
                        "bg-slate-50/50 dark:bg-slate-955/10 border-slate-100 dark:border-slate-850 hover:border-slate-250 dark:hover:border-slate-800")}>
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-black shrink-0 shadow-sm">
                        {u.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0 font-sans">
                        <p className="text-xs font-black text-slate-800 dark:text-slate-200 truncate">{u.fullName}</p>
                        <p className="text-[9px] text-slate-400 truncate">{u.email} · <span className="font-bold text-slate-500 uppercase">{u.role}</span></p>
                      </div>
                      <div className={cn("w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-all duration-200",
                        checked ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-305 dark:border-slate-700")}>
                        {checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-3 shrink-0 bg-slate-50/20 dark:bg-slate-900/10">
                <button onClick={() => setShowAssignModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer border-none transition-all">
                  Cancel
                </button>
                <button onClick={handleAssign} disabled={isAssigning}
                  className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-450 hover:to-teal-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer border-none shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-60">
                  {isAssigning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                  {isAssigning ? 'Applying...' : `Assign (${selectedUserIds.length} Selected)`}
                </button>
              </div>
            </motion.div>
          </motion.div>,
          document.body
        )}
      </AnimatePresence>

      {/* ── CONFIRM SAVE (AUDIT DIFFS) MODAL ────────────────────────────── */}
      <AnimatePresence>
        {showConfirmSaveModal && mounted && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="absolute inset-0" onClick={() => setShowConfirmSaveModal(false)} />
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20 }}
              className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 z-10 overflow-hidden flex flex-col max-h-[85vh]">
              <div className="h-1.5 bg-gradient-to-r from-amber-500 to-orange-500" />
              <div className="p-5 border-b border-slate-150 dark:border-slate-800 shrink-0">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase font-outfit">Confirm Access Controls Update</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Please review the audit log changes before applying overrides to database</p>
                  </div>
                </div>
              </div>
              <div className="overflow-y-auto flex-1 p-5 space-y-4">
                <div className="space-y-3 font-sans">
                  {logsDiff.map((log) => (
                    <div key={log.roleName} className="p-4 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-850 rounded-2xl space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-full text-[9px] font-black uppercase">
                          {log.roleName}
                        </span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase">Audit Log</span>
                      </div>
                      
                      {log.added.length > 0 && (
                        <div>
                          <p className="text-[9px] text-emerald-500 font-black uppercase tracking-wider mb-1">✔ Granted Permissions:</p>
                          <ul className="list-disc list-inside text-[9px] font-mono font-bold text-slate-655 dark:text-slate-300 space-y-0.5 pl-1">
                            {log.added.map(k => (
                              <li key={k}>{k}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {log.removed.length > 0 && (
                        <div>
                          <p className="text-[9px] text-rose-500 font-black uppercase tracking-wider mb-1">✘ Revoked Permissions:</p>
                          <ul className="list-disc list-inside text-[9px] font-mono font-bold text-slate-655 dark:text-slate-300 space-y-0.5 pl-1">
                            {log.removed.map(k => (
                              <li key={k}>{k}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 border-t border-slate-150 dark:border-slate-800 flex gap-3 shrink-0 bg-slate-50/20 dark:bg-slate-900/10">
                <button onClick={() => setShowConfirmSaveModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer border-none transition-all">
                  Cancel
                </button>
                <button onClick={handleApplyChanges} disabled={saving}
                  className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer border-none shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-60">
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  {saving ? 'Applying overrides...' : 'Apply Overrides'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
