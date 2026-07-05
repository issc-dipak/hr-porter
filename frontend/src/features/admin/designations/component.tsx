"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Tag, Plus, Edit2, Trash2, Users, Search, X, Sparkles, Award,
  RefreshCw, TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';

interface IDesignation {
  _id: string;
  designationName: string;
  level: number;
  employeeCount?: number;
}

export default function DesignationsPage() {
  const { userRole } = useAuthStore();
  const [designations, setDesignations] = useState<IDesignation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [selectedDesig, setSelectedDesig] = useState<IDesignation | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    designationName: '',
    level: 1
  });

  const { triggerToast, triggerConfirm } = useUIStore();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('hr_system_token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [desigRes, empRes] = await Promise.all([
        fetch('/api/designations', { headers }),
        fetch('/api/employees', { headers })
      ]);

      if (desigRes.ok && empRes.ok) {
        const desigData = await desigRes.json();
        const empData = await empRes.json();

        // Calculate counts
        const formatted = desigData.map((d: any) => ({
          ...d,
          employeeCount: empData.filter((e: any) => e.designation === d.designationName && !e.isDeletedRecord).length
        }));

        setDesignations(formatted);
      } else {
        triggerToast('Failed to retrieve designation registry', 'error');
      }
    } catch (e: any) {
      triggerToast(e.message || 'Error sync design data', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [triggerToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenModal = (type: 'create' | 'edit', desig?: IDesignation) => {
    setModalType(type);
    if (type === 'edit' && desig) {
      setSelectedDesig(desig);
      setFormData({
        designationName: desig.designationName,
        level: desig.level
      });
    } else {
      setSelectedDesig(null);
      setFormData({
        designationName: '',
        level: 1
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedDesig(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('hr_system_token');
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      if (modalType === 'create') {
        const res = await fetch('/api/designations', {
          method: 'POST',
          headers,
          body: JSON.stringify(formData)
        });
        const data = await res.json();
        if (res.ok) {
          triggerToast('Designation created successfully!', 'success');
          fetchData();
          handleCloseModal();
        } else {
          triggerToast(data.error || 'Failed to create designation', 'error');
        }
      } else if (modalType === 'edit' && selectedDesig) {
        const res = await fetch(`/api/designations/${selectedDesig._id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(formData)
        });
        const data = await res.json();
        if (res.ok) {
          triggerToast('Designation details updated!', 'success');
          fetchData();
          handleCloseModal();
        } else {
          triggerToast(data.error || 'Failed to update designation', 'error');
        }
      }
    } catch (error: any) {
      triggerToast(error.message || 'Something went wrong', 'error');
    }
  };

  const handleDeleteDesig = (desigId: string, name: string) => {
    triggerConfirm(
      'Delete Designation',
      `Are you sure you want to delete the designation "${name}"? This action cannot be undone.`,
      async () => {
        try {
          const token = localStorage.getItem('hr_system_token');
          const res = await fetch(`/api/designations/${desigId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          if (res.ok) {
            triggerToast('Designation deleted successfully!', 'success');
            fetchData();
          } else {
            triggerToast(data.error || 'Failed to delete designation', 'error');
          }
        } catch (error: any) {
          triggerToast(error.message || 'Error occurred during deletion', 'error');
        }
      }
    );
  };

  const filteredDesigs = designations.filter(d => 
    d.designationName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRankBadgeColor = (level: number) => {
    if (level >= 8) return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
    if (level >= 5) return 'bg-violet-500/10 text-violet-500 border-violet-500/20';
    if (level >= 3) return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
  };

  const getCareerStage = (level: number) => {
    if (level >= 8) return 'Executive Leadership';
    if (level >= 5) return 'Managerial Rank';
    if (level >= 3) return 'Senior Professional';
    return 'Associate / Entry Level';
  };

  return (
    <div className="p-6 space-y-6 text-left min-h-0 overflow-auto">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-violet-500/10 text-violet-500 rounded-xl">
              <Award className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight font-outfit font-black">
              Designation & Grades
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Establish professional job roles, define seniority ranks, grade levels, and monitor career hierarchy maps.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal('create')}
          className="px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-violet-500/20 active:scale-95 transition-all cursor-pointer border-none"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Designation
        </button>
      </div>

      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-50/50 dark:bg-slate-950/40 p-3 rounded-2xl border border-slate-200/50 dark:border-slate-800/60">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search designations..."
            className="saas-input w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl outline-none focus:border-violet-500"
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
          <div className="w-8 h-8 border-4 border-violet-650 border-t-transparent rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading designation ranks...</p>
        </div>
      ) : filteredDesigs.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-slate-200 dark:border-slate-850 rounded-3xl">
          <Award className="w-10 h-10 mx-auto text-slate-400" />
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mt-3">No Designations Found</h4>
          <p className="text-[10px] text-slate-500 mt-1 max-w-xs mx-auto">Configure designations to define employee ranks, level grades, and access boundaries.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDesigs.map(d => (
            <motion.div
              layout
              key={d._id}
              className="p-5 bg-white dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl hover:shadow-xl hover:border-violet-500/20 dark:hover:border-violet-500/20 transition-all duration-300 relative group flex flex-col justify-between"
            >
              {/* Header Details */}
              <div>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-slate-850 dark:text-white font-outfit uppercase tracking-tight leading-tight group-hover:text-violet-500 transition-colors">
                      {d.designationName}
                    </h3>
                    <p className="text-[9px] font-bold text-slate-400">{getCareerStage(d.level)}</p>
                  </div>
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border",
                    getRankBadgeColor(d.level)
                  )}>
                    Rank Level {d.level}
                  </span>
                </div>

                {/* Grade progress gauge */}
                <div className="mt-6 space-y-1.5">
                  <div className="flex justify-between text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none">
                    <span>Rank Weight</span>
                    <span>{d.level} / 10</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full" 
                      style={{ width: `${(d.level / 10) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Footer Metrics & Actions */}
              <div className="flex justify-between items-center mt-5 pt-3.5 border-t border-slate-200/40 dark:border-slate-900 bg-transparent shrink-0">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4 text-violet-500" />
                  <span className="text-[10px] font-black text-slate-800 dark:text-slate-350 uppercase tracking-wider">
                    {d.employeeCount || 0} Staff Mapped
                  </span>
                </div>

                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleOpenModal('edit', d)}
                    className="p-2 hover:bg-violet-600/10 hover:text-violet-550 text-slate-400 rounded-xl cursor-pointer border-none bg-transparent transition-colors flex items-center justify-center"
                    title="Edit Designation"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  {userRole !== 'HR' && (
                    <button
                      onClick={() => handleDeleteDesig(d._id, d.designationName)}
                      className="p-2 hover:bg-rose-600/10 hover:text-rose-500 text-slate-400 rounded-xl cursor-pointer border-none bg-transparent transition-colors flex items-center justify-center"
                      title="Delete Designation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
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
                <Sparkles className="w-4 h-4 text-violet-500 animate-pulse" />
                {modalType === 'create' ? 'Create New Designation' : 'Modify Designation Details'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer text-slate-400 border-none bg-transparent flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 pt-4 text-xs">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Designation Name *</label>
                <input
                  type="text"
                  name="designationName"
                  required
                  placeholder="e.g. Lead Technical Architect"
                  className="saas-input w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl outline-none focus:border-violet-500 font-semibold"
                  value={formData.designationName}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Seniority Rank Level (1 - 10) *</label>
                <select
                  name="level"
                  className="saas-input w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl outline-none cursor-pointer focus:border-violet-500 font-semibold"
                  value={formData.level}
                  onChange={handleInputChange}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(lvl => (
                    <option className="bg-white dark:bg-slate-900" key={lvl} value={lvl}>Level {lvl} - {getCareerStage(lvl)}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-850">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer shadow-lg shadow-violet-500/25 transition-all border-none"
                >
                  {modalType === 'create' ? 'Create Designation' : 'Save Details'}
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
