"use client";

import React, { useState } from 'react';
import { Search, MapPin, DollarSign, Edit3, Trash2, Users } from 'lucide-react';
import { IJob } from './types';
import { cn } from "@/lib/utils";

interface PositionsPortalProps {
  jobs: IJob[];
  handleOpenJobModal: (type: 'create' | 'edit', job?: IJob) => void;
  handleUpdateJobStatus: (job: IJob, newStatus: string) => void;
  handleDeleteJob: (id: string) => void;
}

export default function PositionsPortal({ 
  jobs, 
  handleOpenJobModal, 
  handleUpdateJobStatus, 
  handleDeleteJob 
}: PositionsPortalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All');

  const filteredJobs = jobs.filter(j => {
    const matchSearch = j.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        j.dept.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = selectedStatusFilter === 'All' || j.status === selectedStatusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="flex gap-1 flex-1 overflow-x-auto scrollbar-none min-w-0">
          {['All', 'Active', 'On Hold', 'Closed', 'Draft'].map(st => (
            <button
              key={st}
              onClick={() => setSelectedStatusFilter(st)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer shrink-0",
                selectedStatusFilter === st 
                  ? "bg-[#0f172a] text-white dark:bg-[#ffffff] dark:text-[#0f172a] shadow-sm" 
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              )}
            >
              {st} Openings
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 shrink-0 border-l border-slate-100 dark:border-slate-800 pl-3">
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input 
            type="text" 
            placeholder="Search openings..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-36 bg-transparent border-none outline-none text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredJobs.map((job) => (
          <div key={job._id} className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[8px] font-black uppercase tracking-widest text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-md">{job.dept}</span>
                <h3 className="text-base font-black text-slate-900 dark:text-white mt-2 leading-snug group-hover:text-blue-600 transition-colors">{job.title}</h3>
              </div>
              <div className="flex items-center gap-1">
                <select 
                  value={job.status} 
                  onChange={e => handleUpdateJobStatus(job, e.target.value)}
                  className={cn(
                    "text-[8px] font-black uppercase tracking-wider px-2 py-1 rounded-lg border cursor-pointer outline-none",
                    job.status === 'Active' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' :
                    job.status === 'On Hold' ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400' :
                    'bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                  )}
                >
                  <option>Active</option>
                  <option>On Hold</option>
                  <option>Closed</option>
                  <option>Draft</option>
                </select>
              </div>
            </div>

            <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed mb-4">{job.description || 'No job description provided.'}</p>

            <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-100 dark:border-slate-850 text-[10px] font-bold text-slate-655 dark:text-slate-355 mb-4">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{job.location}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                <span>{job.salary}</span>
              </div>
            </div>

            {job.requirements && job.requirements.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-5">
                {job.requirements.slice(0, 3).map((r: string, idx: number) => (
                  <span key={idx} className="px-2 py-0.5 bg-slate-50 dark:bg-slate-800 rounded-md text-[8px] font-extrabold text-slate-500 uppercase tracking-wide">{r}</span>
                ))}
                {job.requirements.length > 3 && (
                  <span className="px-2 py-0.5 bg-blue-50/50 dark:bg-blue-900/30 rounded-md text-[8px] font-extrabold text-blue-500 uppercase">+{job.requirements.length - 3} More</span>
                )}
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-wider">{job.applicants?.length || 0} Candidates</span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleOpenJobModal('edit', job)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDeleteJob(job._id)}
                  className="p-2 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl text-slate-350 hover:text-rose-500 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
