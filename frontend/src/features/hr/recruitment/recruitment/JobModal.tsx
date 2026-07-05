"use client";

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import { IJob } from './types';

interface JobModalProps {
  isOpen: boolean;
  type: 'create' | 'edit';
  job: IJob | null;
  onClose: () => void;
  onSubmit: (jobFormPayload: any) => Promise<void>;
}

const DEPARTMENTS = ['Engineering', 'Design', 'Product', 'Marketing', 'Human Resources', 'Sales'];
const LOCATIONS = ['Bangalore, India', 'Mumbai, India', 'Remote', 'Delhi NCR', 'Pune, India'];
const EXPERIENCE_LEVELS = ['Junior', 'Mid', 'Senior', 'Lead'];

export default function JobModal({ isOpen, type, job, onClose, onSubmit }: JobModalProps) {
  const [jobForm, setJobForm] = useState({
    title: '',
    dept: 'Engineering',
    location: 'Bangalore, India',
    salary: '₹15L - ₹25L',
    type: 'Full-time',
    experienceLevel: 'Mid',
    description: '',
    requirementsString: ''
  });

  useEffect(() => {
    if (type === 'edit' && job) {
      setJobForm({
        title: job.title,
        dept: job.dept,
        location: job.location,
        salary: job.salary,
        type: job.type,
        experienceLevel: job.experienceLevel || 'Mid',
        description: job.description || '',
        requirementsString: (job.requirements || []).join(', ')
      });
    } else {
      setJobForm({
        title: '',
        dept: 'Engineering',
        location: 'Bangalore, India',
        salary: '₹15L - ₹25L',
        type: 'Full-time',
        experienceLevel: 'Mid',
        description: '',
        requirementsString: ''
      });
    }
  }, [type, job, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(jobForm);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 40 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.9, y: 40 }} 
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-left"
      >
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <div>
            <h2 className="text-sm font-black text-slate-900 dark:text-white tracking-tight uppercase">{type === 'create' ? 'Create Job Opening' : 'Edit Job Post'}</h2>
            <p className="text-slate-400 font-bold text-[9px] uppercase tracking-wider mt-0.5">Provide position parameters for candidate screening.</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center bg-white dark:bg-slate-800 rounded-lg shadow-sm hover:rotate-90 transition-all duration-300 border border-slate-100 dark:border-slate-700 cursor-pointer">
            <X className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
            <div className="md:col-span-2">
              <label className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1 block">Job Title</label>
              <input 
                required 
                type="text" 
                placeholder="e.g. Senior Frontend Developer" 
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-blue-500/50 rounded-lg outline-none transition-all text-xs font-bold text-slate-900 dark:text-white" 
                value={jobForm.title} 
                onChange={e => setJobForm({...jobForm, title: e.target.value})} 
              />
            </div>

            <div>
              <label className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1 block">Department</label>
              <select 
                value={jobForm.dept} 
                onChange={e => setJobForm({...jobForm, dept: e.target.value})}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
              >
                {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1 block">Job Type</label>
              <select 
                value={jobForm.type} 
                onChange={e => setJobForm({...jobForm, type: e.target.value})}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
              >
                <option>Full-time</option>
                <option>Part-time</option>
                <option>Contract</option>
                <option>Internship</option>
              </select>
            </div>

            <div>
              <label className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1 block">Location</label>
              <select 
                value={jobForm.location} 
                onChange={e => setJobForm({...jobForm, location: e.target.value})}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
              >
                {LOCATIONS.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1 block">Salary Range</label>
              <input 
                required 
                type="text" 
                placeholder="e.g. ₹15L - ₹25L" 
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-blue-500/50 rounded-lg outline-none text-xs font-bold text-slate-900 dark:text-white" 
                value={jobForm.salary} 
                onChange={e => setJobForm({...jobForm, salary: e.target.value})} 
              />
            </div>

            <div>
              <label className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1 block">Experience Level</label>
              <select 
                value={jobForm.experienceLevel} 
                onChange={e => setJobForm({...jobForm, experienceLevel: e.target.value})}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
              >
                {EXPERIENCE_LEVELS.map(el => <option key={el}>{el}</option>)}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1 block">Required Skills (Comma separated)</label>
              <input 
                type="text" 
                placeholder="React, TypeScript, Redux" 
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-blue-500/50 rounded-lg outline-none text-xs font-bold text-slate-900 dark:text-white" 
                value={jobForm.requirementsString} 
                onChange={e => setJobForm({...jobForm, requirementsString: e.target.value})} 
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1 block">Job Description</label>
              <textarea 
                rows={2}
                placeholder="Specify duties, tools used, and target outcomes..." 
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-blue-500/50 rounded-lg outline-none text-xs font-bold text-slate-900 dark:text-white" 
                value={jobForm.description} 
                onChange={e => setJobForm({...jobForm, description: e.target.value})} 
              />
            </div>
          </div>

          <div className="flex gap-2 pt-1.5">
            <button type="button" onClick={onClose} className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg font-black text-[9px] uppercase tracking-[0.2em] transition-all cursor-pointer">Cancel</button>
            <button type="submit" className="flex-[2] py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-black text-[9px] uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 transition-all cursor-pointer">{type === 'create' ? 'Publish opening' : 'Update position'}</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
