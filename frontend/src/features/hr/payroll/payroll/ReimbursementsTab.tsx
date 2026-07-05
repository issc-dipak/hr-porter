"use client";

import React, { useState, useEffect } from 'react';
import { 
  FileText, Check, X, Search, Filter, IndianRupee, Link as LinkIcon, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";

interface ReimbursementClaim {
  _id: string;
  employee: string;
  name: string;
  type: string;
  amount: number;
  claimDate: string;
  description: string;
  receiptUrl?: string;
  status: string;
  comment?: string;
  createdAt: string;
}

export default function ReimbursementsTab({ userRole = 'HR' }: { userRole?: string }) {
  const [claims, setClaims] = useState<ReimbursementClaim[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Action state
  const [selectedClaim, setSelectedClaim] = useState<ReimbursementClaim | null>(null);
  const [commentText, setCommentText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/reimbursement', { headers });
      if (res.ok) {
        const data = await res.json();
        setClaims(data);
      }
    } catch (err) {
      console.error('Failed to fetch reimbursement claims:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (status: 'Approved' | 'Rejected') => {
    if (!selectedClaim) return;
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`/api/reimbursement/${selectedClaim._id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status, comment: commentText })
      });
      if (res.ok) {
        await fetchClaims();
        setSelectedClaim(null);
        setCommentText('');
      }
    } catch (err) {
      console.error('Failed to update claim:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredClaims = claims.filter(c => {
    const matchesStatus = filterStatus === 'All' || c.status === filterStatus;
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.employee.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 text-left">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 font-sans">Expense Reimbursement System</h3>
          <p className="text-[10px] text-slate-400 font-bold mt-0.5 uppercase tracking-wider">Review, approve, or reject employee business expenses & receipts.</p>
        </div>
        <div className="flex items-center gap-2">
          <input 
            type="text" 
            placeholder="Search claims..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none focus:border-blue-500/50"
          />
        </div>
      </div>

      {/* Filter and Quick Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex p-0.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/50 dark:border-slate-700/50 w-fit">
          {['All', 'Pending', 'Approved', 'Rejected'].map((status) => (
            <button 
              key={status}
              onClick={() => setFilterStatus(status)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[9px] font-black transition-all uppercase tracking-widest whitespace-nowrap",
                filterStatus === status 
                  ? "bg-white dark:bg-slate-700 text-blue-600 shadow-md" 
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              )}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
          <span>Total Claims: {claims.length}</span>
          <span className="text-blue-500">Pending: {claims.filter(c => c.status === 'Pending').length}</span>
        </div>
      </div>

      {/* Claims Table */}
      {isLoading ? (
        <div className="py-20 text-center text-xs font-black uppercase tracking-widest text-slate-400">Loading claims ledger...</div>
      ) : (
        <div className="saas-card bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-805 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-850">
                  <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Employee</th>
                  <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Expense Type</th>
                  <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Date & Info</th>
                  <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Amount</th>
                  <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                  <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredClaims.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[11px] font-bold text-slate-400 italic">No reimbursement claims match the selection criteria.</td>
                  </tr>
                ) : (
                  filteredClaims.map((claim) => (
                    <tr key={claim._id} className="group hover:bg-slate-50/55 dark:hover:bg-slate-800/20 transition-all">
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-xs font-black text-slate-900 dark:text-white">{claim.name}</p>
                          <p className="text-[9px] font-bold text-slate-455 mt-0.5">{claim.employee}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-655 dark:text-slate-400 rounded-lg text-[8.5px] font-black uppercase tracking-widest">
                          {claim.type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-[10px] font-bold text-slate-705 dark:text-slate-300 line-clamp-1">{claim.description}</p>
                          <p className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider mt-0.5">{claim.claimDate}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[11px] font-black text-slate-900 dark:text-white">₹{(claim.amount || 0).toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest inline-flex items-center gap-1.5",
                          claim.status === 'Approved' ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-500" :
                          claim.status === 'Rejected' ? "bg-rose-50 text-rose-600 dark:bg-rose-955/20 dark:text-rose-500" :
                          "bg-amber-50 text-amber-600 dark:bg-amber-955/20 dark:text-amber-500"
                        )}>
                          <div className={cn("w-1 h-1 rounded-full", 
                            claim.status === 'Approved' ? "bg-emerald-500" : 
                            claim.status === 'Rejected' ? "bg-rose-500" : "bg-amber-500"
                          )} />
                          {claim.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {claim.receiptUrl && (
                            <a 
                              href={claim.receiptUrl} 
                              target="_blank" 
                              rel="noreferrer"
                              className="p-1.5 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 rounded-lg cursor-pointer transition-all border border-transparent"
                              title="View Receipt Link"
                            >
                              <LinkIcon className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {claim.status === 'Pending' ? (
                            <button 
                              onClick={() => {
                                setSelectedClaim(claim);
                                setCommentText('');
                              }}
                              className="px-2 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all"
                            >
                              Decide
                            </button>
                          ) : claim.comment ? (
                            <span className="text-[8px] font-bold text-slate-400 max-w-[120px] truncate" title={claim.comment}>
                              {claim.comment}
                            </span>
                          ) : (
                            <span className="text-[8px] font-bold text-slate-400">-</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Decision Modal */}
      <AnimatePresence>
        {selectedClaim && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="reimbursement-decide-modal w-full max-w-md rounded-[2rem] p-6 shadow-2xl relative overflow-hidden"
            >
              <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Process Reimbursement</h3>
                  <p className="text-[9px] text-slate-455 font-bold mt-0.5">Determine payout status for {selectedClaim.name}</p>
                </div>
                <button 
                  onClick={() => setSelectedClaim(null)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-500">
                    <span>Category:</span>
                    <span className="text-slate-900 dark:text-white uppercase font-black">{selectedClaim.type}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-slate-500">
                    <span>Date:</span>
                    <span className="text-slate-900 dark:text-white font-mono">{selectedClaim.claimDate}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-slate-500">
                    <span>Requested Amount:</span>
                    <span className="text-blue-600 font-black text-sm">₹{selectedClaim.amount.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-2">
                    <span className="text-[8px] font-black uppercase text-slate-400 block mb-1">Description</span>
                    <p className="text-[10px] text-slate-600 dark:text-slate-350">{selectedClaim.description}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-[8px] font-black text-slate-455 uppercase tracking-widest mb-1.5">Decision Note / Feedback</label>
                  <textarea 
                    rows={3}
                    placeholder="Provide a reason for approval or rejection..."
                    className="saas-input w-full px-3.5 py-2.5 text-xs border border-slate-150/40 rounded-xl outline-none focus:border-blue-500/50"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                  />
                </div>

                <div className="flex gap-3.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => handleUpdateStatus('Approved')}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer shadow-lg shadow-emerald-500/10 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" /> Approve
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('Rejected')}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer shadow-lg shadow-rose-500/10 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                  >
                    <X className="w-4 h-4" /> Reject
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
