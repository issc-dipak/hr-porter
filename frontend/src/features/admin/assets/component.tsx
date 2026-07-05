"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Laptop, Plus, Search, Filter, Calendar, User, 
  CheckCircle, ShieldAlert, Wrench, Trash2, Sparkles, Loader2, RefreshCw,
  Pencil, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";
import { PastelStatCard } from '@/components/ui/PastelStatCard';
import { useUIStore } from '@/store/uiStore';

interface IAsset {
  _id?: string;
  name: string;
  type: string; // 'Hardware' | 'Software' | 'Accessory' | 'Other'
  serialNumber: string;
  assignedTo: string;
  status: string; // 'Available' | 'Assigned' | 'Under Repair' | 'Retired'
  assignedDate: string;
  value: number;
}

export function AssetsPage() {
  const { selectedBranchId } = useUIStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [assets, setAssets] = useState<IAsset[]>([]);
  const [employeesList, setEmployeesList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Assets states
  const [newAsset, setNewAsset] = useState({
    name: '',
    type: 'Hardware',
    serialNumber: '',
    assignedTo: '',
    status: 'Available',
    assignedDate: '',
    value: 0
  });
  const [editingAsset, setEditingAsset] = useState<IAsset | null>(null);
  const [assetToDelete, setAssetToDelete] = useState<IAsset | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAssets = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('hr_system_token');
      let url = '/api/assets';
      if (selectedBranchId) {
        url += `?branchId=${selectedBranchId}`;
      }
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setAssets(data);
      }
    } catch (error) {
      console.error('Failed to fetch assets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('hr_system_token');
      let url = '/api/employees';
      if (selectedBranchId) {
        url += `?branchId=${selectedBranchId}`;
      }
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setEmployeesList(data);
      }
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    }
  };

  useEffect(() => {
    fetchAssets();
    fetchEmployees();
  }, [selectedBranchId]);

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('hr_system_token');
      const res = await fetch('/api/assets', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newAsset)
      });
      if (res.ok) {
        setShowAddModal(false);
        setNewAsset({
          name: '',
          type: 'Hardware',
          serialNumber: '',
          assignedTo: '',
          status: 'Available',
          assignedDate: '',
          value: 0
        });
        fetchAssets();
      }
    } catch (error) {
      console.error('Failed to create asset:', error);
    }
  };

  const handleEditAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAsset?._id) return;
    try {
      const token = localStorage.getItem('hr_system_token');
      const res = await fetch(`/api/assets/${editingAsset._id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editingAsset)
      });
      if (res.ok) {
        setShowEditModal(false);
        setEditingAsset(null);
        fetchAssets();
      }
    } catch (error) {
      console.error('Failed to update asset:', error);
    }
  };

  const handleDeleteAsset = async () => {
    if (!assetToDelete?._id) return;
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('hr_system_token');
      const res = await fetch(`/api/assets/${assetToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setShowDeleteModal(false);
        setAssetToDelete(null);
        fetchAssets();
      }
    } catch (error) {
      console.error('Failed to delete asset:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredAssets = assets.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase()) || 
                          a.serialNumber.toLowerCase().includes(search.toLowerCase()) || 
                          a.assignedTo.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'All' || a.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const stats = {
    total: assets.length,
    assigned: assets.filter(a => a.status === 'Assigned').length,
    available: assets.filter(a => a.status === 'Available').length,
    repair: assets.filter(a => a.status === 'Under Repair').length,
  };

  console.log('AssetsPage Render State:', { showAddModal, showEditModal, showDeleteModal, mounted });

  return (
    <div className="p-4 sm:p-5 lg:p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 animate-pulse shrink-0" />
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase font-outfit">Asset Management</h1>
          </div>
          <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
            Track hardware inventories, cloud software, and physical assets allocated to employees.
          </p>
        </div>

        <div className="flex gap-3 w-full sm:w-auto">
          <button 
            onClick={fetchAssets}
            className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 active:scale-95 transition-all shadow-sm cursor-pointer shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button 
            onClick={() => {
              console.log('ADD ASSET CLICKED: setting showAddModal=true');
              setShowAddModal(true);
            }}
            className="saas-btn-primary cursor-pointer flex-1 sm:flex-none justify-center"
          >
            <Plus className="w-4 h-4" /> Add Inventory Asset
          </button>
        </div>
      </div>

      {/* Stats Widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 text-left">
        {[
          { label: 'Total Assets', value: stats.total, icon: Laptop, accent: '#3B82F6', sub: 'Registered hardware & software' },
          { label: 'Assigned', value: stats.assigned, icon: User, accent: '#10B981', sub: 'Allocated to personnel' },
          { label: 'Available', value: stats.available, icon: CheckCircle, accent: '#8B5CF6', sub: 'Ready for allocation' },
          { label: 'Under Repair', value: stats.repair, icon: Wrench, accent: '#F59E0B', sub: 'Awaiting maintenance' },
        ].map((stat, idx) => (
          <PastelStatCard key={idx} icon={stat.icon} label={stat.label} value={stat.value} sub={stat.sub} accent={stat.accent} />
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
        <div className="flex-1 w-full md:max-w-md">
          <input 
            type="text" 
            placeholder="Search assets, serial number, assigned employee..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="saas-input w-full pr-4 py-2 text-xs"
          />
        </div>

        <div className="premium-nav-container">
          {['All', 'Hardware', 'Software', 'Accessory', 'Other'].map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={cn(
                "premium-nav-item active:scale-[0.98]",
                typeFilter === type ? "premium-nav-item-active" : ""
              )}
            >
              <span>{type}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Assets Table / Card List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Loading Inventory...</p>
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="saas-card py-20 flex flex-col items-center justify-center text-center max-w-lg mx-auto">
          <Laptop className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
          <h3 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">No Assets Registered</h3>
          <p className="text-xs text-slate-400 mt-2 px-6">
            Register hardware inventory or cloud software instances to allocate and trace corporate resources.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
          
          {/* Mobile Card List */}
          <div className="block sm:hidden divide-y divide-slate-100 dark:divide-slate-800">
            {filteredAssets.map((asset) => (
              <div key={asset._id} className="p-4 space-y-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-all text-left">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight text-xs">{asset.name}</h4>
                  <span className={`px-2.5 py-0.8 rounded-xl text-[8px] font-black uppercase tracking-wider ${
                    asset.status === 'Available' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400' :
                    asset.status === 'Assigned' ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400' :
                    asset.status === 'Under Repair' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400' :
                    'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400'
                  }`}>
                    {asset.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-wide">
                  <div>
                    <span className="text-slate-400 block text-[8px] tracking-widest font-black mb-0.5">Asset Type</span>
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 inline-block font-extrabold">{asset.type}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[8px] tracking-widest font-black mb-0.5">Evaluation</span>
                    <span className="text-slate-700 dark:text-slate-200 font-black">₹{asset.value.toLocaleString()}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-1.5 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
                    <span className="font-bold text-[8.5px] uppercase tracking-wider text-slate-400 w-16">Serial No:</span>
                    <span className="font-mono text-[10px]">{asset.serialNumber}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
                    <span className="font-bold text-[8.5px] uppercase tracking-wider text-slate-400 w-16">Assigned:</span>
                    <span className="font-extrabold">{asset.assignedTo || 'Unassigned (Pool)'}</span>
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setEditingAsset(asset);
                      setShowEditModal(true);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-[9px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-350 cursor-pointer transition-all"
                  >
                    <Pencil className="w-3 h-3 text-blue-500" /> Edit
                  </button>
                  <button
                    onClick={() => {
                      setAssetToDelete(asset);
                      setShowDeleteModal(true);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-[9px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-350 cursor-pointer transition-all"
                  >
                    <Trash2 className="w-3 h-3 text-red-500" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-50 dark:bg-slate-800/40">
                  <th className="px-6 py-4">Asset Name</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Serial Number</th>
                  <th className="px-6 py-4">Assigned To</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Evaluation</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-semibold">
                {filteredAssets.map((asset) => (
                  <tr key={asset._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                    <td className="px-6 py-4 font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">{asset.name}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-[9px] font-black uppercase tracking-wider text-slate-500">
                        {asset.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-[10px] text-slate-500">{asset.serialNumber}</td>
                    <td className="px-6 py-4 text-slate-500 font-extrabold">{asset.assignedTo || 'Unassigned (Pool)'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider ${
                        asset.status === 'Available' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400' :
                        asset.status === 'Assigned' ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400' :
                        asset.status === 'Under Repair' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400' :
                        'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400'
                      }`}>
                        {asset.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-black text-slate-700 dark:text-slate-300">₹{asset.value.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingAsset(asset);
                            setShowEditModal(true);
                          }}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-blue-600 transition-all cursor-pointer"
                          title="Edit Asset"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setAssetToDelete(asset);
                            setShowDeleteModal(true);
                          }}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-red-650 transition-all cursor-pointer"
                          title="Delete Asset"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[9999] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl p-6 shadow-2xl relative border border-slate-100 dark:border-slate-800"
            >
              <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight uppercase font-outfit mb-4">Add Inventory Asset</h2>
              
              <form onSubmit={handleAddAsset} className="space-y-4">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Asset Name</label>
                  <input 
                    type="text" 
                    required 
                    value={newAsset.name}
                    onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                    className="saas-input w-full px-3 py-2 text-xs" 
                    placeholder="e.g. MacBook Pro M3"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Asset Type</label>
                    <select 
                      value={newAsset.type}
                      onChange={(e) => setNewAsset({ ...newAsset, type: e.target.value })}
                      className="saas-input w-full px-3 py-2 text-xs cursor-pointer"
                    >
                      <option value="Hardware">Hardware</option>
                      <option value="Software">Software (License)</option>
                      <option value="Accessory">Accessory</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Valuation (INR)</label>
                    <input 
                      type="number" 
                      required 
                      value={newAsset.value}
                      onChange={(e) => setNewAsset({ ...newAsset, value: Number(e.target.value) })}
                      className="saas-input w-full px-3 py-2 text-xs" 
                      placeholder="e.g. 150000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Serial / License Key</label>
                    <input 
                      type="text" 
                      required 
                      value={newAsset.serialNumber}
                      onChange={(e) => setNewAsset({ ...newAsset, serialNumber: e.target.value })}
                      className="saas-input w-full px-3 py-2 text-xs" 
                      placeholder="e.g. SN-98234-XYZ"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Allocation Status</label>
                    <select 
                      value={newAsset.status}
                      onChange={(e) => setNewAsset({ ...newAsset, status: e.target.value })}
                      className="saas-input w-full px-3 py-2 text-xs cursor-pointer"
                    >
                      <option value="Available">Available (In Pool)</option>
                      <option value="Assigned">Assigned (Allocated)</option>
                      <option value="Under Repair">Under Repair</option>
                      <option value="Retired">Retired</option>
                    </select>
                  </div>
                </div>

                {newAsset.status === 'Assigned' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Assigned To (Employee)</label>
                      <select 
                        required 
                        value={newAsset.assignedTo}
                        onChange={(e) => setNewAsset({ ...newAsset, assignedTo: e.target.value })}
                        className="saas-input w-full px-3 py-2 text-xs cursor-pointer"
                      >
                        <option value="">Select Employee...</option>
                        {employeesList.map((emp) => (
                          <option key={emp._id} value={emp.email}>
                            {emp.fullName} ({emp.email})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Assigned Date</label>
                      <input 
                        type="date" 
                        required 
                        value={newAsset.assignedDate}
                        onChange={(e) => setNewAsset({ ...newAsset, assignedDate: e.target.value })}
                        className="saas-input w-full px-3 py-2 text-xs cursor-pointer" 
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="saas-btn-primary cursor-pointer"
                  >
                    Add Asset
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && editingAsset && (
          <div className="fixed inset-0 z-[9999] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl p-6 shadow-2xl relative border border-slate-100 dark:border-slate-800"
            >
              <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight uppercase font-outfit mb-4">Edit Inventory Asset</h2>
              
              <form onSubmit={handleEditAsset} className="space-y-4">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Asset Name</label>
                  <input 
                    type="text" 
                    required 
                    value={editingAsset.name}
                    onChange={(e) => setEditingAsset({ ...editingAsset, name: e.target.value })}
                    className="saas-input w-full px-3 py-2 text-xs" 
                    placeholder="e.g. MacBook Pro M3"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Asset Type</label>
                    <select 
                      value={editingAsset.type}
                      onChange={(e) => setEditingAsset({ ...editingAsset, type: e.target.value })}
                      className="saas-input w-full px-3 py-2 text-xs cursor-pointer"
                    >
                      <option value="Hardware">Hardware</option>
                      <option value="Software">Software (License)</option>
                      <option value="Accessory">Accessory</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Valuation (INR)</label>
                    <input 
                      type="number" 
                      required 
                      value={editingAsset.value}
                      onChange={(e) => setEditingAsset({ ...editingAsset, value: Number(e.target.value) })}
                      className="saas-input w-full px-3 py-2 text-xs" 
                      placeholder="e.g. 150000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Serial / License Key</label>
                    <input 
                      type="text" 
                      required 
                      value={editingAsset.serialNumber}
                      onChange={(e) => setEditingAsset({ ...editingAsset, serialNumber: e.target.value })}
                      className="saas-input w-full px-3 py-2 text-xs" 
                      placeholder="e.g. SN-98234-XYZ"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Allocation Status</label>
                    <select 
                      value={editingAsset.status}
                      onChange={(e) => {
                        const newStatus = e.target.value;
                        setEditingAsset({ 
                          ...editingAsset, 
                          status: newStatus,
                          assignedTo: newStatus === 'Assigned' ? editingAsset.assignedTo : '',
                          assignedDate: newStatus === 'Assigned' ? editingAsset.assignedDate : ''
                        });
                      }}
                      className="saas-input w-full px-3 py-2 text-xs cursor-pointer"
                    >
                      <option value="Available">Available (In Pool)</option>
                      <option value="Assigned">Assigned (Allocated)</option>
                      <option value="Under Repair">Under Repair</option>
                      <option value="Retired">Retired</option>
                    </select>
                  </div>
                </div>

                {editingAsset.status === 'Assigned' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Assigned To (Employee)</label>
                      <select 
                        required 
                        value={editingAsset.assignedTo}
                        onChange={(e) => setEditingAsset({ ...editingAsset, assignedTo: e.target.value })}
                        className="saas-input w-full px-3 py-2 text-xs cursor-pointer"
                      >
                        <option value="">Select Employee...</option>
                        {employeesList.map((emp) => (
                          <option key={emp._id} value={emp.email}>
                            {emp.fullName} ({emp.email})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Assigned Date</label>
                      <input 
                        type="date" 
                        required 
                        value={editingAsset.assignedDate}
                        onChange={(e) => setEditingAsset({ ...editingAsset, assignedDate: e.target.value })}
                        className="saas-input w-full px-3 py-2 text-xs cursor-pointer" 
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button 
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingAsset(null);
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="saas-btn-primary cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && assetToDelete && (
          <div className="fixed inset-0 z-[9999] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl relative border border-slate-100 dark:border-slate-800 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-650" />
              </div>
              <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight font-outfit mb-2">Delete Asset?</h2>
              <p className="text-xs text-slate-500 mb-6">
                Are you sure you want to delete <span className="font-extrabold text-slate-700 dark:text-slate-300">{assetToDelete.name}</span> ({assetToDelete.serialNumber})? This action cannot be undone.
              </p>

              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setAssetToDelete(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAsset}
                  className="px-4 py-2 bg-red-600 hover:bg-red-750 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-red-500/20 flex items-center gap-1.5"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Deleting...
                    </>
                  ) : (
                    'Confirm Delete'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
