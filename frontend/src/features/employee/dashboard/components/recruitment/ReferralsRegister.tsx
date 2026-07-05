"use client";

import React, { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { cn } from "@/lib/utils";
import { IJob, IReferral } from './types';

interface ReferralsRegisterProps {
  jobs: IJob[];
  referrals: IReferral[];
  refForm: {
    candidateName: string;
    candidateEmail: string;
    targetJobId: string;
    notes: string;
    experience: string;
    skills: string;
    resumeUrl: string;
  };
  setRefForm: React.Dispatch<React.SetStateAction<{
    candidateName: string;
    candidateEmail: string;
    targetJobId: string;
    notes: string;
    experience: string;
    skills: string;
    resumeUrl: string;
  }>>;
  handleReferralSubmit: (e: React.FormEvent) => void;
}

export default function ReferralsRegister({
  jobs,
  referrals,
  refForm,
  setRefForm,
  handleReferralSubmit
}: ReferralsRegisterProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState('');

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setFileName(file.name);

    try {
      const data = new FormData();
      data.append('file', file);

      const token = localStorage.getItem('hr_system_token');
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: data
      });

      if (res.ok) {
        const json = await res.json();
        setRefForm(prev => ({ ...prev, resumeUrl: json.url }));
        alert(`File ${file.name} uploaded successfully!`);
      } else {
        alert('File upload failed.');
        setFileName('');
      }
    } catch (err) {
      console.error(err);
      alert('Error uploading file.');
      setFileName('');
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
      {/* Referral submission form card */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-150/40 dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
        <div>
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Submit Recommendation</h4>
          <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Recommend qualified peers for open roles to claim bonuses</p>
        </div>

        <form onSubmit={handleReferralSubmit} className="space-y-3.5 text-slate-700 dark:text-slate-200">
          <div>
            <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Candidate Name</label>
            <input 
              type="text" 
              required 
              placeholder="e.g. Nikhilesh Roy"
              value={refForm.candidateName}
              onChange={e => setRefForm({ ...refForm, candidateName: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-transparent rounded-xl text-xs font-bold outline-none text-slate-900 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Candidate Email</label>
            <input 
              type="email" 
              required 
              placeholder="e.g. nikhilesh@email.com"
              value={refForm.candidateEmail}
              onChange={e => setRefForm({ ...refForm, candidateEmail: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-transparent rounded-xl text-xs font-bold outline-none text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Target Open Position</label>
            <select 
              value={refForm.targetJobId}
              onChange={e => setRefForm({ ...refForm, targetJobId: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-transparent rounded-xl text-xs font-bold outline-none text-slate-900 dark:text-white cursor-pointer"
            >
              <option value="">-- Select opening --</option>
              {jobs.map(j => {
                const jobIdStr = (j._id || j.id || '').toString();
                return (
                  <option key={jobIdStr} value={jobIdStr}>{j.title}</option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Referral Endorsement Notes</label>
            <textarea 
              rows={3} 
              placeholder="Briefly explain why this candidate is a strong fit..."
              value={refForm.notes}
              onChange={e => setRefForm({ ...refForm, notes: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-transparent rounded-xl text-xs font-bold outline-none text-slate-900 dark:text-white resize-none"
            />
          </div>

          <div>
            <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Upload Candidate Resume (PDF/Word)</label>
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx"
              className="hidden"
            />
            <div 
              onClick={triggerFileSelect}
              className="border-2 border-dashed border-slate-200 dark:border-slate-800 p-4 rounded-xl text-center cursor-pointer hover:border-blue-500/50 transition-all bg-slate-50 dark:bg-slate-800/20"
            >
              <Upload className="w-5 h-5 text-blue-600 mx-auto mb-1" />
              <span className="text-[10px] font-bold text-slate-400">
                {uploading ? 'Uploading...' : fileName ? `Selected: ${fileName}` : 'Click to upload doc'}
              </span>
            </div>
            {refForm.resumeUrl && (
              <p className="text-[9px] text-emerald-600 font-bold mt-1.5">✓ File uploaded: {refForm.resumeUrl}</p>
            )}
          </div>

          <button 
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-md transition-all cursor-pointer border-none"
          >
            Submit Referral Request
          </button>
        </form>
      </div>

      {/* Referral ledger */}
      <div className="lg:col-span-2 p-5 bg-white dark:bg-slate-900 border border-slate-150/40 dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
        <div>
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Statutory Referrals Register</h4>
          <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Real-time progression status and statutory bonus logs</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[9px] font-black uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Candidate Details</th>
                <th className="py-3 px-4">Role Recommends</th>
                <th className="py-3 px-4">Incentive Reward</th>
                <th className="py-3 px-4">Hiring Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {referrals.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                  <td className="py-3.5 px-4">
                    <div>
                      <strong className="block text-slate-900 dark:text-white font-black">{r.name}</strong>
                      <span className="text-[10px] text-slate-400 mt-0.5">{r.email} • {r.date}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-655 dark:text-slate-355">{r.role}</td>
                  <td className="py-3.5 px-4 font-black text-emerald-600">₹{r.bonus.toLocaleString()}</td>
                  <td className="py-3.5 px-4">
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-[8.5px] font-black uppercase tracking-wider",
                      r.status === 'Selected' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' :
                      r.status === 'Interview Scheduled' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400' :
                      r.status === 'Rejected' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400' :
                      'bg-amber-100 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                    )}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
