"use client";

import React from 'react';
import { 
  Search, Star, MapPin, DollarSign 
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { IJob } from './types';

interface InternalJobsPortalProps {
  displayJobs: IJob[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedDeptFilter: string;
  setSelectedDeptFilter: (dept: string) => void;
  savedJobIds: string[];
  toggleSaveJob: (id: string) => void;
  hasApplied: (job: IJob) => boolean;
  handleApplyInternally: (job: IJob) => void;
}

export default function InternalJobsPortal({
  displayJobs,
  searchTerm,
  setSearchTerm,
  selectedDeptFilter,
  setSelectedDeptFilter,
  savedJobIds,
  toggleSaveJob,
  hasApplied,
  handleApplyInternally
}: InternalJobsPortalProps) {
  
  const depts = ['All', 'Engineering', 'Design', 'Product', 'Human Resources'];

  return (
    <div className="space-y-6">
      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-150/40 dark:border-slate-800 shadow-sm">
        <div className="flex gap-1 overflow-x-auto w-full sm:w-auto">
          {depts.map(d => (
            <button
              key={d}
              onClick={() => setSelectedDeptFilter(d)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer",
                selectedDeptFilter === d 
                  ? "bg-[#0f172a] text-white dark:bg-[#ffffff] dark:text-[#0f172a] shadow-sm" 
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-205"
              )}
            >
              {d}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 w-full sm:max-w-xs bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-1.5">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input 
            type="text" 
            placeholder="Search roles..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-transparent border-none text-xs font-bold outline-none text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Jobs grid list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayJobs.map((job) => {
          const jobIdStr = (job._id || job.id || '').toString();
          return (
            <div key={jobIdStr} className="bg-white dark:bg-slate-900 border border-slate-150/40 dark:border-slate-800 rounded-3xl p-5 shadow-sm hover:shadow-xl transition-all relative flex flex-col justify-between group">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[8px] font-black uppercase tracking-widest text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-md">{job.dept}</span>
                  <button 
                    onClick={() => toggleSaveJob(jobIdStr)}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-amber-500 cursor-pointer bg-transparent border-none"
                  >
                    <Star className={cn("w-4 h-4", savedJobIds.includes(jobIdStr) ? "fill-amber-400 text-amber-400" : "")} />
                  </button>
                </div>

                <h3 className="text-sm font-black text-slate-900 dark:text-white leading-snug group-hover:text-blue-600 transition-colors">{job.title}</h3>
                <p className="text-[10.5px] text-slate-455 line-clamp-2 mt-2 leading-relaxed">{job.description || 'No description provided.'}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-850 space-y-4">
                <div className="grid grid-cols-2 gap-2 text-[9.5px] font-semibold text-slate-455">
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {job.location}</span>
                  <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" /> {job.salary}</span>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="text-[9.5px] text-slate-400 font-bold">Type: {job.type}</span>
                  {hasApplied(job) ? (
                    <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-xl text-[9px] font-black uppercase tracking-wider">Applied</span>
                  ) : (
                    <button 
                      onClick={() => handleApplyInternally(job)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer border-none"
                    >
                      Apply Internally
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
