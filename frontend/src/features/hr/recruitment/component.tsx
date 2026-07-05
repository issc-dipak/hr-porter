"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Plus, Users, UserCheck, Briefcase, Calendar, FileText, BarChart3, 
  CheckSquare, RefreshCw, Globe, Sparkles 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";
import { PastelStatCard } from '@/components/ui/PastelStatCard';
import { useUIStore } from '@/store/uiStore';

// Subcomponents
import HiringInsights from './recruitment/HiringInsights';
import PositionsPortal from './recruitment/PositionsPortal';
import TalentPool from './recruitment/TalentPool';
import StagePipeline from './recruitment/StagePipeline';
import InterviewsScheduler from './recruitment/InterviewsScheduler';
import ReferralsTracker from './recruitment/ReferralsTracker';
import JobModal from './recruitment/JobModal';
import CandidateModal from './recruitment/CandidateModal';
import CareerPortal from './recruitment/CareerPortal';
import ConfirmModal from '@/app/components/ConfirmModal';

// Types
import { IJob, IApplicant, IReferral } from './recruitment/types';

export default function RecruitmentPage({ 
  jobs: parentJobs = [], 
  setJobs: setParentJobs 
}: { 
  jobs?: any[], 
  setJobs?: React.Dispatch<React.SetStateAction<any[]>> 
}) {
  const { selectedBranchId } = useUIStore();
  const [jobs, setJobs] = useState<IJob[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'jobs' | 'candidates' | 'pipeline' | 'interviews' | 'referrals' | 'career-portal'>('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('All');
  
  // Job Modals / Form State
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [jobModalType, setJobModalType] = useState<'create' | 'edit'>('create');
  const [selectedJob, setSelectedJob] = useState<IJob | null>(null);
  const [jobToDelete, setJobToDelete] = useState<string | null>(null);
  const setToastMsg = (msg: string | null) => {
    if (msg) {
      useUIStore.getState().triggerToast(msg);
    }
  };

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Candidate Details Modal / Pipeline state
  const [selectedApplicant, setSelectedApplicant] = useState<IApplicant | null>(null);
  const [selectedApplicantJob, setSelectedApplicantJob] = useState<IJob | null>(null);
  const [isApplicantModalOpen, setIsApplicantModalOpen] = useState(false);

  // Employee Referrals Database
  const [referrals, setReferrals] = useState<IReferral[]>([]);

  const fetchReferrals = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('hr_system_token') : null;
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/referrals', { headers });
      if (res.ok) {
        const data = await res.json();
        const mapped = data.map((ref: any) => ({
          id: ref._id || ref.id,
          referrerName: ref.referrerName,
          referrerEmail: ref.referrerEmail,
          candidateName: ref.candidateName,
          jobTitle: ref.role || ref.jobTitle,
          status: ref.status,
          bonus: ref.bonus,
          date: ref.date
        }));
        setReferrals(mapped);
      }
    } catch (err) {
      console.error('Failed to fetch referrals:', err);
    }
  };

  useEffect(() => {
    fetchJobs();
    fetchReferrals();
  }, [selectedBranchId]);

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('hr_system_token') : null;
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      let url = '/api/jobs';
      if (selectedBranchId) {
        url += `?branchId=${selectedBranchId}`;
      }
      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
        if (setParentJobs) setParentJobs(data);
      }
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Demo data seeding disabled

  // Job Submission handlers
  const handleOpenJobModal = (type: 'create' | 'edit', job?: IJob) => {
    setJobModalType(type);
    setSelectedJob(job || null);
    setIsJobModalOpen(true);
  };

  const handleJobSubmit = async (jobForm: any) => {
    const requirements = jobForm.requirementsString
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean);

    const payload = {
      title: jobForm.title,
      dept: jobForm.dept,
      location: jobForm.location,
      salary: jobForm.salary,
      type: jobForm.type,
      experienceLevel: jobForm.experienceLevel,
      description: jobForm.description,
      requirements,
      status: selectedJob ? selectedJob.status : 'Active'
    };

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('hr_system_token') : null;
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      let res;
      if (jobModalType === 'create') {
        res = await fetch('/api/jobs', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`/api/jobs/${selectedJob?._id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        fetchJobs();
        setIsJobModalOpen(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateJobStatus = async (job: IJob, newStatus: string) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('hr_system_token') : null;
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`/api/jobs/${job._id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ ...job, status: newStatus })
      });
      if (res.ok) fetchJobs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteJob = (id: string) => {
    setJobToDelete(id);
  };

  const handleConfirmDeleteJob = async () => {
    if (!jobToDelete) return;
    const id = jobToDelete;
    setJobToDelete(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('hr_system_token') : null;
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`/api/jobs/${id}`, { method: 'DELETE', headers });
      if (res.ok) fetchJobs();
    } catch (err) {
      console.error(err);
    }
  };

  // Pipeline transitions & applicant updates
  const handleUpdateApplicantStage = async (jobId: string, applicantName: string, newStage: string) => {
    const job = jobs.find(j => j._id === jobId);
    if (!job) return;

    const updatedApplicants = job.applicants.map((app: IApplicant) => {
      if (app.name === applicantName) {
        return { ...app, status: newStage };
      }
      return app;
    });

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('hr_system_token') : null;
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ ...job, applicants: updatedApplicants })
      });
      if (res.ok) {
        const updated = await res.json();
        if (selectedApplicant && selectedApplicant.name === applicantName) {
          const app = updated.job.applicants.find((a: any) => a.name === applicantName);
          setSelectedApplicant(app);
        }
        fetchJobs();
        fetchReferrals();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Open applicant modal
  const handleOpenApplicantModal = (app: IApplicant, job: IJob) => {
    setSelectedApplicant(app);
    setSelectedApplicantJob(job);
    setIsApplicantModalOpen(true);
  };

  // After updating applicant scorecard or interviews inside the modal
  const handleUpdateApplicant = (updatedJob: IJob) => {
    // Update local jobs array
    setJobs(prevJobs => prevJobs.map(j => j._id === updatedJob._id ? updatedJob : j));
    
    // Update the selected candidate modal state
    if (selectedApplicant) {
      const freshApplicant = updatedJob.applicants.find(a => a.name === selectedApplicant.name);
      if (freshApplicant) {
        setSelectedApplicant(freshApplicant);
      }
    }
    fetchJobs();
    fetchReferrals();
  };

  // Global filters & counts calculation
  const allApplicantsList = useMemo(() => {
    let list: IApplicant[] = [];
    jobs.forEach((j) => {
      if (j.applicants && Array.isArray(j.applicants)) {
        j.applicants.forEach((a) => {
          list.push({ ...a, jobId: j._id, jobTitle: j.title, jobDept: j.dept });
        });
      }
    });
    return list;
  }, [jobs]);

  const filteredApplicantsList = useMemo(() => {
    return allApplicantsList.filter((app) => {
      const matchDept = selectedDeptFilter === 'All' || app.jobDept === selectedDeptFilter;
      return matchDept;
    });
  }, [allApplicantsList, selectedDeptFilter]);

  const stats = useMemo(() => {
    const totalOpenings = jobs.filter((j) => j.status === 'Active').length;
    const totalApplicants = allApplicantsList.length;
    const scheduledInterviews = allApplicantsList.reduce((acc: number, app: any) => 
      acc + (app.interviews?.filter((i: any) => !i.completed).length || 0), 0
    );
    const hiredCount = allApplicantsList.filter((app) => app.status === 'Hired').length;
    const rejectedCount = allApplicantsList.filter((app) => app.status === 'Rejected').length;
    const offerSentCount = allApplicantsList.filter((app) => app.status === 'Offer Sent').length;

    return {
      totalOpenings,
      totalApplicants,
      scheduledInterviews,
      hiredCount,
      rejectedCount,
      offerSentCount
    };
  }, [jobs, allApplicantsList]);

  return (
    <div className="p-5 lg:p-6 max-w-7xl mx-auto space-y-6 min-h-screen text-left">
      <div className="flex flex-col gap-4 pb-4 border-b border-slate-200 dark:border-slate-800 text-left w-full print:hidden">
        {/* Row 1: Title and Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 w-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0 shadow-sm border border-blue-500/10">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">
                Hiring & Talent Acquisition
              </h1>
              <p className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mt-1.5 leading-none">
                Recruitment & Careers Portal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">


            <button 
              onClick={() => handleOpenJobModal('create')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:scale-[1.02] transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Create Opening
            </button>
          </div>
        </div>

        {/* Row 2: Description */}
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-3xl break-words whitespace-normal leading-relaxed">
          Enterprise dashboard to coordinate open positions, track applicants throughout the hiring funnel, build an employee referral network, and manage pipeline scheduler evaluations.
        </p>

        {/* Row 3: Navigation Tabs */}
        <div className="premium-nav-container mt-2">
          {[
            { id: 'dashboard', label: 'Hiring Analytics', icon: BarChart3 },
            { id: 'jobs', label: 'Job Openings', icon: Briefcase },
            { id: 'candidates', label: 'Applicants Hub', icon: Users },
            { id: 'pipeline', label: 'Hiring Pipeline', icon: CheckSquare },
            { id: 'interviews', label: 'Interviews', icon: Calendar },
            { id: 'career-portal', label: 'Career Portal Setup', icon: Globe },
            { id: 'referrals', label: 'Employee Referrals', icon: UserCheck }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={cn(
                "premium-nav-item active:scale-[0.98]",
                activeSubTab === tab.id ? "premium-nav-item-active" : ""
              )}
            >
              <tab.icon className="w-3 h-3 shrink-0" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      {/* TOP STATS BAR */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 text-left">
        {[
          { label: 'Active Openings', value: stats.totalOpenings, icon: Briefcase, accent: '#3B82F6', sub: 'Open job postings' },
          { label: 'Total Applicants', value: stats.totalApplicants, icon: Users, accent: '#10B981', sub: 'Submitted resumes' },
          { label: 'Interviews Scheduled', value: stats.scheduledInterviews, icon: Calendar, accent: '#F59E0B', sub: 'Active meetings' },
          { label: 'Offers Disbursed', value: stats.offerSentCount, icon: FileText, accent: '#8B5CF6', sub: 'Proposals sent' },
          { label: 'Onboarded Staff', value: stats.hiredCount, icon: UserCheck, accent: '#06B6D4', sub: 'Signed contracts' },
          { label: 'Archived/Rejected', value: stats.rejectedCount, icon: CheckSquare, accent: '#F43F5E', sub: 'Inactive/declined' }
        ].map((stat, idx) => (
          <PastelStatCard key={idx} icon={stat.icon} label={stat.label} value={stat.value} sub={stat.sub} accent={stat.accent} />
        ))}
      </div>      </div>

      {/* Content Rendering Tab Area */}
      <div>
        {activeSubTab === 'dashboard' && (
          <HiringInsights 
            jobs={jobs} 
            allApplicantsList={allApplicantsList} 
            stats={stats} 
          />
        )}

        {activeSubTab === 'jobs' && (
          <PositionsPortal 
            jobs={jobs} 
            handleOpenJobModal={handleOpenJobModal} 
            handleUpdateJobStatus={handleUpdateJobStatus} 
            handleDeleteJob={handleDeleteJob} 
          />
        )}

        {activeSubTab === 'candidates' && (
          <TalentPool 
            jobs={jobs} 
            filteredApplicantsList={filteredApplicantsList} 
            selectedDeptFilter={selectedDeptFilter} 
            setSelectedDeptFilter={setSelectedDeptFilter} 
            handleUpdateApplicantStage={handleUpdateApplicantStage} 
            handleOpenApplicantModal={handleOpenApplicantModal} 
            fetchJobs={fetchJobs} 
            triggerToast={triggerToast}
          />
        )}

        {activeSubTab === 'pipeline' && (
          <StagePipeline 
            jobs={jobs} 
            allApplicantsList={allApplicantsList} 
            handleUpdateApplicantStage={handleUpdateApplicantStage} 
            handleOpenApplicantModal={handleOpenApplicantModal} 
          />
        )}

        {activeSubTab === 'interviews' && (
          <InterviewsScheduler 
            allApplicantsList={allApplicantsList} 
          />
        )}

        {activeSubTab === 'referrals' && (
          <ReferralsTracker 
            jobs={jobs} 
            referrals={referrals} 
            setReferrals={setReferrals} 
            triggerToast={triggerToast}
          />
        )}

        {activeSubTab === 'career-portal' && (
          <CareerPortal 
            jobs={jobs} 
            fetchJobs={fetchJobs} 
            triggerToast={triggerToast}
          />
        )}
      </div>

      {/* Shared Modals */}
      <AnimatePresence>
        {isJobModalOpen && (
          <JobModal 
            isOpen={isJobModalOpen} 
            type={jobModalType} 
            job={selectedJob} 
            onClose={() => setIsJobModalOpen(false)} 
            onSubmit={handleJobSubmit} 
          />
        )}

        {isApplicantModalOpen && (
          <CandidateModal 
            isOpen={isApplicantModalOpen} 
            applicant={selectedApplicant} 
            job={selectedApplicantJob} 
            onClose={() => setIsApplicantModalOpen(false)} 
            onUpdateApplicant={handleUpdateApplicant} 
            jobs={jobs} 
            triggerToast={triggerToast}
          />
        )}
      </AnimatePresence>

      <ConfirmModal 
        isOpen={!!jobToDelete}
        title="Archive Job Opening"
        message="Are you sure you want to archive this job opening? This will remove it from the public careers page and move it to archived/draft state."
        confirmText="Archive Job"
        cancelText="Cancel"
        onConfirm={handleConfirmDeleteJob}
        onCancel={() => setJobToDelete(null)}
        type="danger"
      />



    </div>
  );
}
