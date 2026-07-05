"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Network, Plus, Edit2, Trash2, Users, Search, X, Sparkles, Building2,
  RefreshCw, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";
import { useUIStore } from '@/store/uiStore';

interface IDepartment {
  _id: string;
  departmentName: string;
  description: string;
  branchId?: string;
  managerName?: string;
  employeeCount?: number;
}

interface IBranch {
  _id: string;
  branchName: string;
  branchCode: string;
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<IDepartment[]>([]);
  const [branches, setBranches] = useState<IBranch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [selectedDept, setSelectedDept] = useState<IDepartment | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    departmentName: '',
    description: '',
    branchId: '',
    managerName: ''
  });

  const { triggerToast, selectedBranchId } = useUIStore();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('hr_system_token');
      const headers = { 'Authorization': `Bearer ${token}` };

      let deptUrl = '/api/departments';
      let empUrl = '/api/employees';
      if (selectedBranchId) {
        deptUrl += `?branchId=${selectedBranchId}`;
        empUrl += `?branchId=${selectedBranchId}`;
      }

      const [deptRes, branchRes, empRes] = await Promise.all([
        fetch(deptUrl, { headers }),
        fetch('/api/branches', { headers }),
        fetch(empUrl, { headers })
      ]);

      if (deptRes.ok && branchRes.ok && empRes.ok) {
        const deptData = await deptRes.json();
        const branchData = await branchRes.json();
        const empData = await empRes.json();

        setBranches(branchData);

        const enrichedDepts = deptData.map((d: IDepartment) => {
          // Count employees in this department name
          const count = empData.filter((e: any) => e.department === d.departmentName).length;
          // Find manager if any
          const manager = empData.find((e: any) => e.department === d.departmentName && (e.role === 'HR' || e.role === 'Admin'));
          return {
            ...d,
            employeeCount: count,
            managerName: manager ? manager.fullName : d.managerName || 'Not Assigned'
          };
        });

        setDepartments(enrichedDepts);
      } else {
        triggerToast('Failed to retrieve department data rosters', 'error');
      }
    } catch (e: any) {
      triggerToast(e.message || 'Network connectivity error', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [triggerToast, selectedBranchId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenModal = (type: 'create' | 'edit', dept?: IDepartment) => {
    setModalType(type);
    if (type === 'edit' && dept) {
      setSelectedDept(dept);
      setFormData({
        departmentName: dept.departmentName,
        description: dept.description || '',
        branchId: dept.branchId || '',
        managerName: dept.managerName || ''
      });
    } else {
      setSelectedDept(null);
      setFormData({
        departmentName: '',
        description: '',
        branchId: branches[0]?._id || '',
        managerName: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedDept(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('hr_system_token');
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    try {
      if (modalType === 'create') {
        const res = await fetch('/api/departments', {
          method: 'POST',
          headers,
          body: JSON.stringify(formData)
        });
        const data = await res.json();
        if (res.ok) {
          triggerToast(`Department "${data.departmentName}" created successfully!`, 'success');
          fetchData();
          handleCloseModal();
        } else {
          triggerToast(data.error || 'Failed to create department', 'error');
        }
      } else {
        const res = await fetch(`/api/departments/${selectedDept?._id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(formData)
        });
        const data = await res.json();
        if (res.ok) {
          triggerToast('Department details updated!', 'success');
          fetchData();
          handleCloseModal();
        } else {
          triggerToast(data.error || 'Failed to update department', 'error');
        }
      }
    } catch (error: any) {
      triggerToast(error.message || 'Something went wrong', 'error');
    }
  };

  const handleDeleteDept = async (deptId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the "${name}" department?`)) return;

    try {
      const token = localStorage.getItem('hr_system_token');
      const res = await fetch(`/api/departments/${deptId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast('Department deleted successfully!', 'success');
        fetchData();
      } else {
        triggerToast(data.error || 'Failed to delete department', 'error');
      }
    } catch (error: any) {
      triggerToast(error.message || 'Error occurred during deletion', 'error');
    }
  };

  const filteredDepts = departments.filter(d => 
    d.departmentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.description && d.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getBranchName = (branchId?: string) => {
    if (!branchId) return 'All Locations';
    const found = branches.find(b => b._id === branchId);
    return found ? `${found.branchName}` : 'Unknown Branch';
  };

  return (
    <div className="p-6 space-y-6 text-left min-h-0 overflow-auto">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
              <Network className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight font-outfit font-black">
              Department Registry
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage functional divisions, assign department heads, and map operations to physical office branches.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal('create')}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer border-none"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Department
        </button>
      </div>

      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-50/50 dark:bg-slate-950/40 p-3 rounded-2xl border border-slate-200/50 dark:border-slate-800/60">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search departments..."
            className="saas-input w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl outline-none focus:border-emerald-500"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <button
          onClick={fetchData}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-xl text-slate-450 border border-slate-200 dark:border-slate-800 cursor-pointer flex items-center justify-center bg-transparent"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Main Grid View */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-4 border-emerald-650 border-t-transparent rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading department records...</p>
        </div>
      ) : filteredDepts.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-slate-200 dark:border-slate-850 rounded-3xl">
          <Network className="w-10 h-10 mx-auto text-slate-400" />
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mt-3">No Departments Setup</h4>
          <p className="text-[10px] text-slate-500 mt-1 max-w-xs mx-auto">Create a department division to categorize your staff directory and configure workflows.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDepts.map(d => (
            <motion.div
              layout
              key={d._id}
              className="p-5 bg-white dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl hover:shadow-xl hover:border-emerald-500/20 dark:hover:border-emerald-500/20 transition-all duration-300 relative group flex flex-col justify-between"
            >
              {/* Header Details */}
              <div>
                <div className="flex justify-between items-start">
                  <h3 className="text-sm font-black text-slate-850 dark:text-white font-outfit uppercase tracking-tight leading-tight group-hover:text-emerald-500 transition-colors">
                    {d.departmentName}
                  </h3>
                  <span className="inline-flex px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-650 dark:text-emerald-400 text-[8px] font-black uppercase tracking-widest border border-emerald-500/15">
                    {getBranchName(d.branchId)}
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-3 leading-relaxed font-medium">
                  {d.description || 'No description provided for this functional division.'}
                </p>

                {/* Info Roster */}
                <div className="space-y-2 mt-5 text-[11px] text-slate-600 dark:text-slate-350 border-t border-slate-200/40 dark:border-slate-900 pt-4">
                  <div className="flex gap-2.5 items-center">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-semibold text-slate-500">Head:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-300">{d.managerName || 'Not Assigned'}</span>
                  </div>
                  <div className="flex gap-2.5 items-center">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-semibold text-slate-500">Location:</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{getBranchName(d.branchId)}</span>
                  </div>
                </div>
              </div>

              {/* Footer Metrics & Actions */}
              <div className="flex justify-between items-center mt-5 pt-3.5 border-t border-slate-200/40 dark:border-slate-900 bg-transparent shrink-0">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4 text-emerald-500" />
                  <span className="text-[10px] font-black text-slate-800 dark:text-slate-350 uppercase tracking-wider">
                    {d.employeeCount || 0} Staff
                  </span>
                </div>

                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleOpenModal('edit', d)}
                    className="p-2 hover:bg-emerald-600/10 hover:text-emerald-550 text-slate-400 rounded-xl cursor-pointer border-none bg-transparent transition-colors flex items-center justify-center"
                    title="Edit Department"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteDept(d._id, d.departmentName)}
                    className="p-2 hover:bg-rose-600/10 hover:text-rose-500 text-slate-400 rounded-xl cursor-pointer border-none bg-transparent transition-colors flex items-center justify-center"
                    title="Delete Department"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {showModal && createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-md">
          <motion.div
            initial={{ scale: 0.95, y: 15, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-3xl p-6 shadow-2xl relative text-left"
          >
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-850">
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" />
                {modalType === 'create' ? 'Create New Department' : 'Modify Department details'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer text-slate-400 border-none bg-transparent flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 pt-4 text-xs bg-transparent">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Department Name *</label>
                <input
                  type="text"
                  name="departmentName"
                  required
                  placeholder="e.g. Talent Acquisition"
                  className="saas-input w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl outline-none focus:border-emerald-500 font-semibold"
                  value={formData.departmentName}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Primary Branch Mapping *</label>
                <select
                  name="branchId"
                  className="saas-input w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl outline-none cursor-pointer focus:border-emerald-500 font-semibold"
                  value={formData.branchId}
                  onChange={handleInputChange}
                >
                  <option className="bg-white dark:bg-slate-900" value="">All Locations / Central</option>
                  {branches.map(b => (
                    <option className="bg-white dark:bg-slate-900" key={b._id} value={b._id}>{b.branchName} ({b.branchCode})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Description</label>
                <textarea
                  name="description"
                  rows={4}
                  placeholder="Explain department focus or functional duties..."
                  className="saas-input w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl outline-none focus:border-emerald-500 font-semibold resize-none"
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-850">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer shadow-lg shadow-emerald-500/25 transition-all border-none"
                >
                  {modalType === 'create' ? 'Create Department' : 'Save Details'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-655 dark:text-slate-350 hover:text-slate-800 dark:hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer border border-slate-200 dark:border-slate-800"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>,
        document.body
      )}
    </div>
  );
}
