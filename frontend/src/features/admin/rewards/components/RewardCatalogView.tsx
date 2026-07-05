"use client";

import React, { useState } from 'react';
import { Gift, CreditCard, ShoppingBag, Calendar, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  catalog: any[];
  redemptions: any[];
  myPointsBalance: number;
  role: string;
  onRedeem: (id: string) => Promise<void>;
  onApproveRedemption: (id: string, status: 'Approved' | 'Rejected', note?: string) => Promise<void>;
}

export default function RewardCatalogView({ catalog, redemptions, myPointsBalance, role, onRedeem, onApproveRedemption }: Props) {
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState<Record<string, string>>({});

  const handleRedeem = async (rewardId: string) => {
    setRedeemingId(rewardId);
    await onRedeem(rewardId);
    setRedeemingId(null);
  };

  const handleStatusChange = async (redId: string, status: 'Approved' | 'Rejected') => {
    setActioningId(redId);
    await onApproveRedemption(redId, status, noteText[redId] || '');
    setActioningId(null);
  };

  const isAdminOrHr = ['Admin', 'HR'].includes(role);

  return (
    <div className="space-y-8">
      {/* ── Points Balance header ── */}
      <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-200">Point Marketplace</h3>
          <p className="text-xs text-slate-400 mt-0.5">Use your earned recognition points to claim premium perks.</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500 font-semibold">My Available Balance</div>
          <div className="text-2xl font-black text-violet-400 mt-0.5">{myPointsBalance} Points</div>
        </div>
      </div>

      {/* ── Catalog Grid ── */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider">Catalog Items</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {catalog.map((item) => {
            const isAffordable = myPointsBalance >= item.pointsRequired;
            const isOutOfStock = item.stock <= 0;

            return (
              <div key={item._id} className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-400 rounded-full font-medium">{item.category}</span>
                    <span className={`text-[10px] ${isOutOfStock ? 'text-red-400' : 'text-slate-500'}`}>
                      {isOutOfStock ? 'Out of Stock' : `${item.stock} left`}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-200 mt-2">{item.name}</h4>
                  <p className="text-xs text-slate-400 mt-1">{item.description}</p>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800/40 flex items-center justify-between">
                  <span className="text-sm font-bold text-violet-400">{item.pointsRequired} Pts</span>
                  <button
                    onClick={() => handleRedeem(item._id)}
                    disabled={!isAffordable || isOutOfStock || redeemingId === item._id}
                    className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-all"
                  >
                    {redeemingId === item._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Redeem Now'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Redemption Request History Logs ── */}
      <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5">
        <h3 className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider">Redemption Requests</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-850 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-2.5 px-3">Employee</th>
                <th className="py-2.5 px-3">Item Name</th>
                <th className="py-2.5 px-3 text-right">Points</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Request Date</th>
                {isAdminOrHr && <th className="py-2.5 px-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850/30 text-slate-300">
              {redemptions.map((red) => (
                <tr key={red._id} className="hover:bg-slate-800/10">
                  <td className="py-3 px-3 font-semibold">{red.employeeName}</td>
                  <td className="py-3 px-3">{red.rewardName}</td>
                  <td className="py-3 px-3 text-right font-bold text-violet-400">{red.pointsRedeemed}</td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      red.status === 'Delivered' ? 'bg-emerald-500/15 text-emerald-400' :
                      red.status === 'Approved' ? 'bg-blue-500/15 text-blue-400' :
                      red.status === 'Rejected' ? 'bg-rose-500/15 text-rose-400' : 'bg-amber-500/15 text-amber-400'
                    }`}>
                      {red.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-500">{new Date(red.createdAt).toLocaleDateString()}</td>
                  {isAdminOrHr && (
                    <td className="py-3 px-3">
                      {red.status === 'Pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <input
                            placeholder="Approval note..."
                            value={noteText[red._id] || ''}
                            onChange={e => setNoteText(prev => ({ ...prev, [red._id]: e.target.value }))}
                            className="bg-slate-800 border border-slate-700/60 rounded px-2 py-1 text-[10px] outline-none focus:border-violet-500"
                          />
                          <button
                            onClick={() => handleStatusChange(red._id, 'Approved')}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleStatusChange(red._id, 'Rejected')}
                            className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-bold"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-500 text-right block italic">{red.deliveryNote || 'Reviewed'}</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
