"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Building2, Plus, Edit2, Trash2, MapPin, Phone, Mail, Clock, ShieldCheck,
  Search, CheckCircle, AlertCircle, X, Sparkles, Map, Network, ArrowRight,
  TrendingUp, Users, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";
import { PastelStatCard } from '@/components/ui/PastelStatCard';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';

interface IBranch {
  _id: string;
  branchName: string;
  branchCode: string;
  branchType: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  timezone: string;
  contactNumber?: string;
  email?: string;
  status: 'Active' | 'Inactive';
  employeeCount?: number;
}

export default function BranchesPage() {
  const { userRole } = useAuthStore();
  const [branches, setBranches] = useState<IBranch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [selectedBranch, setSelectedBranch] = useState<IBranch | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    branchName: '',
    branchCode: '',
    branchType: 'Office',
    address: '',
    city: '',
    state: '',
    country: 'India',
    postalCode: '',
    timezone: 'UTC+05:30 (Kolkata)',
    contactNumber: '',
    email: '',
    status: 'Active' as 'Active' | 'Inactive'
  });

  const { triggerToast } = useUIStore();

  const fetchBranches = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('hr_system_token');
      const res = await fetch('/api/branches', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Fetch employees count per branch
        const empRes = await fetch('/api/employees', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        let employees: any[] = [];
        if (empRes.ok) {
          employees = await empRes.json();
        }

        const enrichedBranches = data.map((b: IBranch) => {
          const count = employees.filter((e: any) => e.branchId === b._id).length;
          return { ...b, employeeCount: count };
        });

        setBranches(enrichedBranches);
      } else {
        const err = await res.json();
        triggerToast(err.error || 'Failed to fetch branches', 'error');
      }
    } catch (e: any) {
      triggerToast(e.message || 'Error connecting to database', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [triggerToast]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const handleOpenModal = (type: 'create' | 'edit', branch?: IBranch) => {
    setModalType(type);
    if (type === 'edit' && branch) {
      setSelectedBranch(branch);
      setFormData({
        branchName: branch.branchName,
        branchCode: branch.branchCode,
        branchType: branch.branchType || 'Office',
        address: branch.address,
        city: branch.city,
        state: branch.state,
        country: branch.country,
        postalCode: branch.postalCode,
        timezone: branch.timezone,
        contactNumber: branch.contactNumber || '',
        email: branch.email || '',
        status: branch.status
      });
    } else {
      setSelectedBranch(null);
      setFormData({
        branchName: '',
        branchCode: '',
        branchType: 'Office',
        address: '',
        city: '',
        state: '',
        country: 'India',
        postalCode: '',
        timezone: 'UTC+05:30 (Kolkata)',
        contactNumber: '',
        email: '',
        status: 'Active'
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedBranch(null);
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
        const res = await fetch('/api/branches', {
          method: 'POST',
          headers,
          body: JSON.stringify(formData)
        });
        const data = await res.json();
        if (res.ok) {
          triggerToast(`Branch "${data.branchName}" created successfully!`, 'success');
          fetchBranches();
          handleCloseModal();
        } else {
          triggerToast(data.error || 'Failed to create branch', 'error');
        }
      } else {
        const res = await fetch(`/api/branches/${selectedBranch?._id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(formData)
        });
        const data = await res.json();
        if (res.ok) {
          triggerToast('Branch details updated!', 'success');
          fetchBranches();
          handleCloseModal();
        } else {
          triggerToast(data.error || 'Failed to update branch', 'error');
        }
      }
    } catch (error: any) {
      triggerToast(error.message || 'Something went wrong', 'error');
    }
  };

  const handleDeleteBranch = async (branchId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the "${name}" branch?`)) return;

    try {
      const token = localStorage.getItem('hr_system_token');
      const res = await fetch(`/api/branches/${branchId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast('Branch deleted successfully!', 'success');
        fetchBranches();
      } else {
        triggerToast(data.error || 'Failed to delete branch', 'error');
      }
    } catch (error: any) {
      triggerToast(error.message || 'Error occurred during deletion', 'error');
    }
  };

  const filteredBranches = branches.filter(b => 
    b.branchName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.branchCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeBranchesCount = branches.filter(b => b.status === 'Active').length;
  const totalEmployeesCount = branches.reduce((sum, b) => sum + (b.employeeCount || 0), 0);

  return (
    <div className="p-6 space-y-6 text-left min-h-0 overflow-auto">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-500/10 text-blue-500 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight font-outfit">
              Branch Master Registry
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure geographic divisions, regional office details, email logs, and track physical personnel mappings.
          </p>
        </div>

        {userRole !== 'HR' && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleOpenModal('create')}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 transition-all cursor-pointer border-none"
            >
              <Plus className="w-3.5 h-3.5" />
              Add New Branch
            </button>
          </div>
        )}
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { title: 'Total Registered Branches', value: branches.length, desc: 'Central + Regional units', icon: Building2, accent: '#3B82F6' },
          { title: 'Active Branches', value: activeBranchesCount, desc: 'Accepting active workflows', icon: CheckCircle, accent: '#10B981' },
          { title: 'Total Branch Mapped Staff', value: totalEmployeesCount, desc: 'Active personnel directory', icon: Users, accent: '#8B5CF6' }
        ].map((stat, idx) => (
          <PastelStatCard key={idx} icon={stat.icon} label={stat.label} value={stat.value} sub={stat.sub || stat.desc} accent={stat.accent} />
        ))}
      </div>

      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-50/50 dark:bg-slate-950/40 p-3 rounded-2xl border border-slate-200/50 dark:border-slate-800/60">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search branches..."
            className="saas-input w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl outline-none focus:border-blue-500"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <button
          onClick={fetchBranches}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-xl text-slate-450 border border-slate-200 dark:border-slate-800 cursor-pointer flex items-center justify-center bg-transparent"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Main Grid View */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading branch data...</p>
        </div>
      ) : filteredBranches.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-slate-200 dark:border-slate-850 rounded-3xl">
          <Building2 className="w-10 h-10 mx-auto text-slate-400" />
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mt-3">No Branches Found</h4>
          <p className="text-[10px] text-slate-500 mt-1 max-w-xs mx-auto">Create a new branch to map locations, departments, and employee rosters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBranches.map(b => (
            <motion.div
              layout
              key={b._id}
              className="p-5 bg-white dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl hover:shadow-xl hover:border-blue-500/20 dark:hover:border-blue-500/20 transition-all duration-300 relative group flex flex-col justify-between"
            >
              {/* Header Details */}
              <div>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="inline-flex px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[8px] font-black uppercase tracking-widest border border-blue-500/15">
                      {b.branchCode}
                    </span>
                    <h3 className="text-sm font-black text-slate-850 dark:text-white font-outfit uppercase tracking-tight leading-tight mt-1 group-hover:text-blue-500 transition-colors">
                      {b.branchName}
                    </h3>
                    <p className="text-[9px] font-bold text-slate-400 capitalize">{b.branchType}</p>
                  </div>
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border",
                    b.status === 'Active' 
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" 
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                  )}>
                    {b.status}
                  </span>
                </div>

                {/* Information Roster */}
                <div className="space-y-2.5 mt-5 text-[11px] text-slate-600 dark:text-slate-350 border-t border-slate-200/40 dark:border-slate-900 pt-4">
                  <div className="flex gap-2.5 items-start">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
                    <span className="leading-tight font-medium">
                      {b.address}, {b.city}, {b.state}, {b.country} - {b.postalCode}
                    </span>
                  </div>
                  {b.contactNumber && (
                    <div className="flex gap-2.5 items-center">
                      <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                      <span className="font-semibold">{b.contactNumber}</span>
                    </div>
                  )}
                  {b.email && (
                    <div className="flex gap-2.5 items-center">
                      <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                      <span className="font-semibold truncate" title={b.email}>{b.email}</span>
                    </div>
                  )}
                  <div className="flex gap-2.5 items-center">
                    <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                    <span className="font-medium text-[10px] text-slate-400">{b.timezone}</span>
                  </div>
                </div>
              </div>

              {/* Footer Metrics & Actions */}
              <div className="flex justify-between items-center mt-5 pt-3.5 border-t border-slate-200/40 dark:border-slate-900 bg-transparent shrink-0">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4 text-blue-500" />
                  <span className="text-[10px] font-black text-slate-800 dark:text-slate-350 uppercase tracking-wider">
                    {b.employeeCount || 0} Staff
                  </span>
                </div>

                {userRole !== 'HR' && (
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleOpenModal('edit', b)}
                      className="p-2 hover:bg-blue-600/10 hover:text-blue-500 text-slate-400 rounded-xl cursor-pointer border-none bg-transparent transition-colors flex items-center justify-center"
                      title="Edit Branch Settings"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteBranch(b._id, b.branchName)}
                      className="p-2 hover:bg-rose-600/10 hover:text-rose-500 text-slate-400 rounded-xl cursor-pointer border-none bg-transparent transition-colors flex items-center justify-center"
                      title="Delete Branch"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
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
            className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-3xl p-6 shadow-2xl relative text-left"
          >
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-850">
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-500 animate-pulse" />
                {modalType === 'create' ? 'Establish New Branch' : 'Modify Branch details'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer text-slate-400 border-none bg-transparent flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 pt-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Branch Name *</label>
                  <input
                    type="text"
                    name="branchName"
                    required
                    placeholder="e.g. Pune Corporate Office"
                    className="saas-input w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl outline-none focus:border-blue-500 font-semibold"
                    value={formData.branchName}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Branch Code *</label>
                  <input
                    type="text"
                    name="branchCode"
                    required
                    disabled={modalType === 'edit'}
                    placeholder="e.g. PUN001"
                    className="saas-input w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl outline-none focus:border-blue-500 font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                    value={formData.branchCode}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Branch Type *</label>
                  <select
                    name="branchType"
                    className="saas-input w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl outline-none cursor-pointer focus:border-blue-500 font-semibold"
                    value={formData.branchType}
                    onChange={handleInputChange}
                  >
                    <option value="Head Office">Head Office</option>
                    <option value="Regional Office">Regional Office</option>
                    <option value="Sales Office">Sales Office</option>
                    <option value="Development Center">Development Center</option>
                    <option value="R&D Hub">R&D Hub</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Branch Status *</label>
                  <select
                    name="status"
                    className="saas-input w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl outline-none cursor-pointer focus:border-blue-500 font-semibold"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Street Address *</label>
                <input
                  type="text"
                  name="address"
                  required
                  placeholder="e.g. 402 Senapati Bapat Road, Shivajinagar"
                  className="saas-input w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl outline-none focus:border-blue-500 font-semibold"
                  value={formData.address}
                  onChange={handleInputChange}
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block">City *</label>
                  <input
                    type="text"
                    name="city"
                    required
                    placeholder="e.g. Pune"
                    className="saas-input w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl outline-none focus:border-blue-500 font-semibold"
                    value={formData.city}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block">State *</label>
                  <input
                    type="text"
                    name="state"
                    required
                    placeholder="e.g. Maharashtra"
                    className="saas-input w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl outline-none focus:border-blue-500 font-semibold"
                    value={formData.state}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Country *</label>
                  <input
                    type="text"
                    name="country"
                    required
                    placeholder="e.g. India"
                    className="saas-input w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl outline-none focus:border-blue-500 font-semibold"
                    value={formData.country}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Postal Code *</label>
                  <input
                    type="text"
                    name="postalCode"
                    required
                    placeholder="e.g. 411016"
                    className="saas-input w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl outline-none focus:border-blue-500 font-semibold"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Contact Number</label>
                  <input
                    type="text"
                    name="contactNumber"
                    placeholder="e.g. +91 20 67123456"
                    className="saas-input w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl outline-none focus:border-blue-500 font-semibold"
                    value={formData.contactNumber}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Branch Email</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="e.g. pune@company.com"
                    className="saas-input w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl outline-none focus:border-blue-500 font-semibold"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Time Zone *</label>
                <select
                  name="timezone"
                  className="saas-input w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl outline-none cursor-pointer focus:border-blue-500 font-semibold"
                  value={formData.timezone}
                  onChange={handleInputChange}
                >
                  <option value="UTC+05:30 (Kolkata)">UTC+05:30 (Kolkata)</option>
                  <option value="UTC+00:00 (London)">UTC+00:00 (London)</option>
                  <option value="UTC-05:00 (New York)">UTC-05:00 (New York)</option>
                  <option value="UTC-08:00 (Los Angeles)">UTC-08:00 (Los Angeles)</option>
                  <option value="UTC+08:00 (Singapore)">UTC+08:00 (Singapore)</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-850">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer shadow-lg shadow-blue-500/25 transition-all border-none"
                >
                  {modalType === 'create' ? 'Establish Branch' : 'Save Details'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-650 dark:text-slate-350 hover:text-slate-800 dark:hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer border border-slate-200 dark:border-slate-800"
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
