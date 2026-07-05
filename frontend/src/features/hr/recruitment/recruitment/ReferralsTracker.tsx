"use client";

import React, { useState } from 'react';
import { IJob, IReferral } from './types';
import { cn } from "@/lib/utils";

interface ReferralsTrackerProps {
  jobs: IJob[];
  referrals: IReferral[];
  setReferrals: React.Dispatch<React.SetStateAction<IReferral[]>>;
  triggerToast?: (msg: string) => void;
}

export default function ReferralsTracker({ jobs, referrals, setReferrals, triggerToast }: ReferralsTrackerProps) {
  const [referralForm, setReferralForm] = useState({
    referrerName: 'John Doe',
    referrerEmail: 'j.doe@company.com',
    candidateName: '',
    candidateEmail: '',
    jobId: '',
    experience: '3 years'
  });

  const handleReferralSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referralForm.jobId) {
      if (triggerToast) {
        triggerToast('Please select a referred job.');
      } else {
        alert('Please select a referred job.');
      }
      return;
    }
    const targetJob = jobs.find(j => j._id === referralForm.jobId);
    if (!targetJob) return;

    const payload = {
      referrerName: referralForm.referrerName,
      referrerEmail: referralForm.referrerEmail,
      candidateName: referralForm.candidateName,
      candidateEmail: referralForm.candidateEmail,
      targetJobId: referralForm.jobId,
      experience: referralForm.experience,
      notes: 'Submitted via HR dashboard'
    };

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('hr_system_token') : null;
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/referrals', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const responseData = await res.json();
        if (responseData.referral) {
          const apiRef = responseData.referral;
          const newRef: IReferral = {
            id: apiRef._id || apiRef.id,
            referrerName: apiRef.referrerName,
            referrerEmail: apiRef.referrerEmail,
            candidateName: apiRef.candidateName,
            jobTitle: apiRef.role || apiRef.jobTitle,
            status: apiRef.status,
            bonus: apiRef.bonus,
            date: apiRef.date
          };
          setReferrals(prev => [newRef, ...prev]);
        }
        setReferralForm({
          ...referralForm,
          candidateName: '',
          candidateEmail: ''
        });
        if (triggerToast) {
          triggerToast('Thank you! Referral request submitted successfully.');
        } else {
          alert('Thank you! Referral request submitted successfully.');
        }
      } else {
        if (triggerToast) {
          triggerToast('Failed to submit referral.');
        } else {
          alert('Failed to submit referral.');
        }
      }
    } catch (err) {
      console.error(err);
      if (triggerToast) {
        triggerToast('Error submitting referral.');
      } else {
        alert('Error submitting referral.');
      }
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left side: Submit referral form */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Refer Talent Candidate</h4>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Submit employee referral requests to earn statutory cash bonuses</p>
          </div>

          <form onSubmit={handleReferralSubmit} className="space-y-4 text-slate-700 dark:text-slate-200">
            <div>
              <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Referred Candidate Name</label>
              <input 
                type="text" 
                required 
                placeholder="e.g. Amit Mishra"
                value={referralForm.candidateName}
                onChange={e => setReferralForm({ ...referralForm, candidateName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-205 dark:border-slate-700 rounded-xl text-xs font-bold outline-none text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Referred Candidate Email</label>
              <input 
                type="email" 
                required 
                placeholder="e.g. amit@outlook.com"
                value={referralForm.candidateEmail}
                onChange={e => setReferralForm({ ...referralForm, candidateEmail: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-205 dark:border-slate-700 rounded-xl text-xs font-bold outline-none text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Applied Position</label>
              <select 
                value={referralForm.jobId}
                onChange={e => setReferralForm({ ...referralForm, jobId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-205 dark:border-slate-700 rounded-xl text-xs font-bold outline-none text-slate-900 dark:text-white cursor-pointer"
              >
                <option value="">-- Select Job --</option>
                {jobs.map(j => (
                  <option key={j._id} value={j._id}>{j.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Experience Level</label>
              <input 
                type="text" 
                placeholder="e.g. 3.5 Years"
                value={referralForm.experience}
                onChange={e => setReferralForm({ ...referralForm, experience: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-205 dark:border-slate-700 rounded-xl text-xs font-bold outline-none text-slate-900 dark:text-white"
              />
            </div>
            <button 
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
            >
              Submit Referral
            </button>
          </form>
        </div>

        {/* Right side: Referral Ledger list */}
        <div className="lg:col-span-2 p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Active Referral Ledger</h4>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Status tracking and bonus verification for staff recommendations</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[9px] font-black uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Referrer</th>
                  <th className="py-3 px-4">Candidate</th>
                  <th className="py-3 px-4">Position</th>
                  <th className="py-3 px-4">Statutory Bonus</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {referrals.map(ref => (
                  <tr key={ref.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                    <td className="py-3 px-4">
                      <div>
                        <strong className="block text-slate-900 dark:text-white font-black">{ref.referrerName}</strong>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{ref.referrerEmail}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <strong className="text-slate-700 dark:text-slate-350">{ref.candidateName}</strong>
                    </td>
                    <td className="py-3 px-4">{ref.jobTitle}</td>
                    <td className="py-3 px-4 font-black text-emerald-600">₹{ref.bonus.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wide",
                        ref.status === 'Approved' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      )}>{ref.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
