"use client";

import React, { useState, useEffect } from 'react';
import { 
  FileText, ShieldCheck, Download, ExternalLink, AlertCircle, BookOpen, Landmark, Lock, HelpCircle, FileCheck, CheckCircle, Search, RefreshCw, ChevronDown, ChevronRight, Clock, X
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { useBrandingStore } from '@/store/useBrandingStore';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = [
  'Attendance Policy',
  'Leave Policy',
  'Payroll Policy',
  'Work From Home Policy',
  'IT & Security Policy',
  'Code Of Conduct',
  'Recruitment Policy',
  'Performance Policy',
  'Expense & Reimbursement Policy',
  'Resignation & Offboarding Policy'
];

interface IAttachment {
  name: string;
  url: string;
}

interface IPolicy {
  _id: string;
  title: string;
  category: string;
  description: string;
  content: string;
  effectiveDate: string;
  expiryDate?: string;
  currentVersion: string;
  attachments: IAttachment[];
  acknowledged: boolean;
  acknowledgementDetails?: {
    acknowledgedAt: string;
    ipAddress: string;
  };
}

export function CompanyPoliciesTab() {
  const { branding } = useBrandingStore();
  const [policies, setPolicies] = useState<IPolicy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Search & Filter
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  // Expanded View Policy
  const [selectedPolicy, setSelectedPolicy] = useState<IPolicy | null>(null);
  const [isSubmittingAck, setIsSubmittingAck] = useState(false);

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('hr_system_token');
      const headers = { 'Authorization': `Bearer ${token}` };
      const res = await fetch('/api/policies', { headers });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setPolicies(data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch policies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcknowledge = async (policyId: string) => {
    try {
      setIsSubmittingAck(true);
      const token = localStorage.getItem('hr_system_token');
      const res = await fetch(`/api/policies/${policyId}/acknowledge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        // Refresh policies to update acknowledgement status
        await fetchPolicies();
        // Update selected policy status if viewing
        const updatedPolicy = policies.find(p => p._id === policyId);
        if (updatedPolicy) {
          setSelectedPolicy({
            ...updatedPolicy,
            acknowledged: true,
            acknowledgementDetails: {
              acknowledgedAt: new Date().toISOString(),
              ipAddress: '127.0.0.1' // updated state
            }
          });
        }
      }
    } catch (err) {
      console.error('Failed to acknowledge policy:', err);
    } finally {
      setIsSubmittingAck(false);
    }
  };

  const filteredPolicies = policies.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || 
                          p.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryTheme = (category: string) => {
    switch (category) {
      case 'Attendance Policy':
        return {
          icon: Clock,
          color: 'text-blue-500',
          bg: 'bg-blue-500/10 border-blue-500/20'
        };
      case 'Leave Policy':
        return {
          icon: BookOpen,
          color: 'text-purple-500',
          bg: 'bg-purple-500/10 border-purple-500/20'
        };
      case 'Payroll Policy':
        return {
          icon: Landmark,
          color: 'text-emerald-500',
          bg: 'bg-emerald-500/10 border-emerald-500/20'
        };
      case 'IT & Security Policy':
        return {
          icon: Lock,
          color: 'text-rose-500',
          bg: 'bg-rose-500/10 border-rose-500/20'
        };
      default:
        return {
          icon: FileText,
          color: 'text-indigo-500',
          bg: 'bg-indigo-500/10 border-indigo-500/20'
        };
    }
  };

  const pendingCount = policies.filter(p => !p.acknowledged).length;

  return (
    <div className="space-y-6 text-left max-w-5xl mx-auto relative min-h-[500px]">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black uppercase tracking-widest text-slate-900 dark:text-white font-outfit">Company Policies Portal</h2>
          <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider leading-none">Access guidelines, compliance standards, and submit review acknowledgements.</p>
        </div>
        
        {pendingCount > 0 && (
          <div className="px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 animate-pulse w-fit">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{pendingCount} Policies Awaiting Your Signature</span>
          </div>
        )}
      </div>

      {/* Search & Category Tabs */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 bg-white dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input 
            type="text" 
            placeholder="Search policies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="saas-input w-full pl-9 pr-4 py-2 text-xs"
          />
        </div>

        <div className="flex gap-2 bg-slate-100/50 dark:bg-slate-950/80 p-0.5 rounded-lg border border-slate-200/50 dark:border-slate-800 overflow-x-auto no-scrollbar max-w-full">
          <button
            onClick={() => setActiveCategory('All')}
            className={cn(
              "px-3 py-1.5 rounded-md text-[8.5px] font-black uppercase tracking-widest transition-all cursor-pointer border-none whitespace-nowrap",
              activeCategory === 'All' 
                ? "bg-gradient-to-r from-blue-600 to-indigo-650 text-white shadow-sm" 
                : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            )}
          >
            All
          </button>
          {CATEGORIES.map(cat => {
            const hasPending = policies.some(p => p.category === cat && !p.acknowledged);
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-[8.5px] font-black uppercase tracking-widest transition-all cursor-pointer border-none whitespace-nowrap flex items-center gap-1",
                  activeCategory === cat 
                    ? "bg-gradient-to-r from-blue-600 to-indigo-650 text-white shadow-sm" 
                    : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                )}
              >
                {cat.replace(' Policy', '')}
                {hasPending && (
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Policies Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-xs font-black uppercase tracking-widest text-slate-405">Syncing policy lists...</p>
        </div>
      ) : filteredPolicies.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-3xl p-16 flex flex-col items-center justify-center text-center max-w-lg mx-auto">
          <BookOpen className="w-12 h-12 text-slate-350 dark:text-slate-705 mb-4 animate-bounce" />
          <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">No policies available</h3>
          <p className="text-[10px] text-slate-400 mt-1 uppercase font-semibold leading-relaxed">No compliance documents have been published in this filter category yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredPolicies.map((policy) => {
            const theme = getCategoryTheme(policy.category);
            const Icon = theme.icon;

            return (
              <div 
                key={policy._id}
                className={cn(
                  "p-6 rounded-[28px] border bg-white dark:bg-slate-900/50 backdrop-blur-sm shadow-md flex flex-col justify-between transition-all hover:scale-[1.01] hover:shadow-lg relative group cursor-pointer border-slate-100 dark:border-slate-800/60"
                )}
                onClick={() => setSelectedPolicy(policy)}
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border", theme.bg)}>
                      <Icon className={cn("w-5 h-5", theme.color)} />
                    </div>

                    <span className={cn(
                      "px-2 py-0.5 rounded-lg text-[8px] font-black uppercase border tracking-wider flex items-center gap-1",
                      policy.acknowledged 
                        ? "bg-emerald-950/80 border-emerald-500/20 text-emerald-400" 
                        : "bg-rose-955/80 border-rose-500/20 text-rose-400 animate-pulse"
                    )}>
                      {policy.acknowledged ? (
                        <>
                          <CheckCircle className="w-2.5 h-2.5" />
                          Acknowledged
                        </>
                      ) : 'Signature Pending'}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight line-clamp-1">{policy.title}</h3>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{policy.category} • v{policy.currentVersion}</p>
                    <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-3 leading-relaxed line-clamp-2">{policy.description}</p>
                  </div>
                </div>

                <div className="pt-4 mt-6 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[9px] font-black uppercase tracking-wider text-slate-450">
                  <span>Effective: {new Date(policy.effectiveDate).toLocaleDateString()}</span>
                  
                  <span className="text-blue-500 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                    Read Document <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Expanded Policy Details overlay */}
      <AnimatePresence>
        {selectedPolicy && (
          <div className="fixed inset-0 z-[9999] bg-slate-950/70 flex items-center justify-center p-4">
            <div className="absolute inset-0" onClick={() => setSelectedPolicy(null)} />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-[2.5rem] p-6 shadow-2xl relative border border-slate-100 dark:border-slate-800 flex flex-col justify-between max-h-[90vh] overflow-hidden"
            >
              {/* Header */}
              <div className="pb-4 border-b border-slate-150/60 dark:border-slate-800 flex justify-between items-start">
                <div>
                  <span className="px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:bg-blue-500/5 dark:text-blue-400 text-[8px] font-black uppercase tracking-wider rounded border border-blue-500/15">
                    {selectedPolicy.category}
                  </span>
                  <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight font-outfit mt-1.5">
                    {selectedPolicy.title}
                  </h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                    Effective: {new Date(selectedPolicy.effectiveDate).toLocaleDateString()} • Active Version: v{selectedPolicy.currentVersion}
                  </p>
                </div>

                <button 
                  onClick={() => setSelectedPolicy(null)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-205 border-none cursor-pointer bg-transparent"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Rich Content View */}
              <div className="flex-1 overflow-y-auto py-6 space-y-6 no-scrollbar text-slate-700 dark:text-slate-300">
                {selectedPolicy.description && (
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 border-l-4 border-blue-500 pl-4 py-1.5 italic bg-slate-50 dark:bg-slate-950/20 rounded-r-xl">
                    "{selectedPolicy.description}"
                  </p>
                )}

                {/* Plain policy content with styling */}
                <div className="text-xs leading-relaxed space-y-4 font-sans select-text whitespace-pre-wrap text-left bg-slate-50/50 dark:bg-slate-955/20 border border-slate-100 dark:border-slate-850 p-6 rounded-3xl">
                  {selectedPolicy.content}
                </div>

                {/* Attachments */}
                {selectedPolicy.attachments && selectedPolicy.attachments.length > 0 && (
                  <div className="space-y-2 border-t border-slate-100 dark:border-slate-805 pt-4">
                    <p className="text-[9px] font-black text-slate-450 uppercase tracking-widest">Document Attachments</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedPolicy.attachments.map((file, idx) => (
                        <a 
                          key={idx}
                          href={file.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 hover:border-blue-500/20 rounded-2xl transition-all text-xs font-bold text-slate-750 dark:text-slate-300"
                        >
                          <span className="truncate max-w-[80%]">{file.name}</span>
                          <ExternalLink className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Signature/Acknowledgement display */}
                {selectedPolicy.acknowledged && selectedPolicy.acknowledgementDetails && (
                  <div className="p-4 bg-emerald-950/90 border border-emerald-500/20 rounded-3xl flex items-start gap-3.5">
                    <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-black text-emerald-100 uppercase tracking-wider">Policy Acknowledged & Signed</p>
                      <p className="text-[9px] font-bold text-emerald-400/90 mt-0.5 uppercase tracking-wide leading-relaxed">
                        Acknowledged At: {new Date(selectedPolicy.acknowledgementDetails.acknowledgedAt).toLocaleString()}
                        <br />
                        Client IP Address: {selectedPolicy.acknowledgementDetails.ipAddress}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Actions Bar */}
              <div className="pt-4 border-t border-slate-150/60 dark:border-slate-800 flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={() => setSelectedPolicy(null)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-805 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer border-none"
                >
                  Close Document
                </button>

                {!selectedPolicy.acknowledged && (
                  <button 
                    disabled={isSubmittingAck}
                    onClick={() => handleAcknowledge(selectedPolicy._id)}
                    className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-md shadow-blue-500/10 border-none flex items-center justify-center gap-2"
                  >
                    {isSubmittingAck ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-4.5 h-4.5" />
                    )}
                    {isSubmittingAck ? 'Signing...' : 'I Have Read & Understood'}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
