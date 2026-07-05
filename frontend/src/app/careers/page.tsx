"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Briefcase, MapPin, Calendar, Clock, DollarSign, Search, Sparkles, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function PublicCareersPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedCompany, setSelectedCompany] = useState('All');

  useEffect(() => {
    fetch('/api/careers')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setJobs(data);
        }
      })
      .catch(err => console.error('Error loading jobs:', err))
      .finally(() => setIsLoading(false));
  }, []);

  const departments = useMemo(() => {
    const list = new Set(jobs.map(j => j.dept));
    return ['All', ...Array.from(list)];
  }, [jobs]);

  const companies = useMemo(() => {
    const list = new Set(jobs.map(j => j.companyName));
    return ['All', ...Array.from(list)];
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const matchSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          job.dept.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          job.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchDept = selectedDept === 'All' || job.dept === selectedDept;
      const matchCompany = selectedCompany === 'All' || job.companyName === selectedCompany;
      return matchSearch && matchDept && matchCompany;
    });
  }, [jobs, searchTerm, selectedDept, selectedCompany]);

  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased pb-16 overflow-y-auto">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-indigo-750 to-indigo-900 text-white py-16 px-6 sm:px-12 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent pointer-events-none" />
        <div className="relative max-w-4xl mx-auto space-y-4">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-widest text-blue-200"
          >
            <Sparkles className="w-3.5 h-3.5" /> Join Our Team
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl font-black tracking-tight"
          >
            Careers & Opportunities Portal
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-sm sm:text-base text-blue-100 max-w-2xl mx-auto font-medium"
          >
            Explore open positions across engineering, product design, HR, marketing, and sales. We are always looking for stellar talent.
          </motion.p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 mt-12 space-y-8">
        
        {/* Search & Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/50 dark:border-slate-800 shadow-md">
          {/* Search Box */}
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search openings, departments, locations..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white cursor-pointer focus:outline-none"
            >
              <option value="All">All Departments</option>
              {departments.filter(d => d !== 'All').map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Company Filter */}
          <div>
            <select
              value={selectedCompany}
              onChange={e => setSelectedCompany(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white cursor-pointer focus:outline-none"
            >
              <option value="All">All Companies</option>
              {companies.filter(c => c !== 'All').map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Listings Grid */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Loading career openings...</p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-850 rounded-3xl p-10 space-y-2">
              <Briefcase className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-wider">No Openings Found</h3>
              <p className="text-xs text-slate-400 font-semibold max-w-sm mx-auto">We don't have any active published openings matching your filter settings right now. Please check back later.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredJobs.map((job) => (
                <motion.div
                  key={job.id}
                  whileHover={{ y: -4 }}
                  className="p-6 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-850 rounded-3xl shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-all text-left"
                >
                  <div className="space-y-3">
                    {/* Company info */}
                    <div className="flex items-center gap-2">
                      {job.companyLogo ? (
                        <img src={job.companyLogo} alt={job.companyName} className="w-5 h-5 rounded-md object-contain" />
                      ) : (
                        <Building2 className="w-4 h-4 text-slate-400" />
                      )}
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{job.companyName}</span>
                    </div>

                    {/* Job title & info */}
                    <div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">{job.title}</h3>
                      <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider mt-0.5">{job.dept}</p>
                    </div>

                    {/* Job pills */}
                    <div className="flex flex-wrap gap-2 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <MapPin className="w-3.5 h-3.5" />
                        {job.location}
                      </div>
                      <div className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <Clock className="w-3.5 h-3.5" />
                        {job.type}
                      </div>
                      <div className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <DollarSign className="w-3.5 h-3.5" />
                        {job.salary}
                      </div>
                    </div>
                  </div>

                  {/* Apply details link */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{job.experienceLevel} Level</span>
                    <Link 
                      href={`/careers/${job.publicUrlSlug}`}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-95"
                    >
                      View Details & Apply
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
