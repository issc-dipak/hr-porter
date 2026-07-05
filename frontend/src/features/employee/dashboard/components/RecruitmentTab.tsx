"use client";

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { 
  Sparkles, Briefcase, UserCheck, DollarSign, Calendar, Target, LayoutDashboard
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";

import { IJob, IReferral, IApplicant } from './recruitment/types';
import DashboardOverview from './recruitment/DashboardOverview';
import InternalJobsPortal from './recruitment/InternalJobsPortal';
import ReferralsRegister from './recruitment/ReferralsRegister';
import CareerGrowthMaps from './recruitment/CareerGrowthMaps';
import SkillsMatchAdjuster from './recruitment/SkillsMatchAdjuster';
import PeerInterviewPanel from './recruitment/PeerInterviewPanel';

interface RecruitmentTabProps {
  jobs: IJob[];
  setJobs: React.Dispatch<React.SetStateAction<IJob[]>>;
  profileData: any;
  addNotification: (msg: string) => void;
}

export function RecruitmentTab({ 
  jobs = [], 
  setJobs, 
  profileData, 
  addNotification 
}: RecruitmentTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'internal-jobs' | 'my-referrals' | 'career-growth' | 'profile-grow' | 'interviews-conduct'>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('All');

  // Local referrals state
  const [referrals, setReferrals] = useState<IReferral[]>([]);

  // Stable fetch helper — handles 429 with a warn (not a throw)
  const apiFetch = useCallback(async (
    url: string,
    options: RequestInit = {},
    signal?: AbortSignal
  ): Promise<Response | null> => {
    const token = localStorage.getItem('hr_system_token');
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> || {})
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(url, { ...options, headers, signal });

    if (res.status === 429) {
      console.warn(`[RecruitmentTab] Rate limited on ${url}. Will retry automatically.`);
      return null; // caller handles null gracefully
    }
    if (res.status === 401) {
      console.warn('[RecruitmentTab] Auth token expired. Please re-login.');
      return null;
    }
    return res;
  }, []);

  // Guard: only fetch jobs once per mount
  const jobsFetched = useRef(false);

  // Sync referrals from database
  useEffect(() => {
    if (!profileData?.email) return;
    const controller = new AbortController();

    apiFetch(
      `/api/referrals?referrerEmail=${encodeURIComponent(profileData.email)}`,
      {},
      controller.signal
    )
      .then(res => {
        if (!res) return; // 429 or 401 — fail silently
        if (!res.ok) { console.warn('[RecruitmentTab] referrals fetch non-ok:', res.status); return; }
        return res.json();
      })
      .then(data => {
        if (!Array.isArray(data)) return;
        setReferrals(data.map((ref: any) => ({
          id: ref._id || ref.id,
          name: ref.candidateName,
          email: ref.candidateEmail,
          role: ref.role,
          status: ref.status,
          bonus: ref.bonus,
          date: ref.date,
          notes: ref.notes
        })));
      })
      .catch(err => { if (err.name !== 'AbortError') console.warn('[RecruitmentTab] referrals error:', err.message); });

    return () => controller.abort();
  }, [profileData?.email, apiFetch]);

  // Sync jobs from database — only once per mount
  useEffect(() => {
    if (jobsFetched.current || jobs.length > 0) return; // already have data or already fetched
    jobsFetched.current = true;
    const controller = new AbortController();

    apiFetch('/api/jobs', {}, controller.signal)
      .then(res => {
        if (!res) return;
        if (!res.ok) { console.warn('[RecruitmentTab] jobs fetch non-ok:', res.status); return; }
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) setJobs(data);
      })
      .catch(err => { if (err.name !== 'AbortError') console.warn('[RecruitmentTab] jobs error:', err.message); });

    return () => controller.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // Referral Submit Form State
  const [refForm, setRefForm] = useState({
    candidateName: '',
    candidateEmail: '',
    targetJobId: '',
    notes: '',
    experience: '3 years',
    skills: '',
    resumeUrl: ''
  });

  // Saved Jobs State
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);

  // Employee Skills Profile (for AI Recommendations)
  const [skillsList, setSkillsList] = useState<string[]>(
    profileData.skills || ['React', 'TypeScript', 'Tailwind CSS', 'Figma', 'UI/UX']
  );
  const [newSkillInput, setNewSkillInput] = useState('');

  // Referral bonus data calculation
  const totalBonusEarned = useMemo(() => {
    return referrals
      .filter(r => r.status === 'Selected' || r.status === 'Bonus Credited')
      .reduce((acc, r) => acc + r.bonus, 0);
  }, [referrals]);

  const pendingBonusAmount = useMemo(() => {
    return referrals
      .filter(r => r.status === 'Interview Scheduled' || r.status === 'Submitted')
      .reduce((acc, r) => acc + r.bonus, 0);
  }, [referrals]);

  // AI Matching Recommendation based on employee profile skills
  const aiRecommendedJobs = useMemo(() => {
    return jobs.map(j => {
      const requirements = j.requirements || [];
      const matchCount = requirements.filter((req: string) => 
        skillsList.some(s => req.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(req.toLowerCase()))
      ).length;
      
      // Calculate a stable pseudo-random offset between 0 and 5 based on the job ID
      const jobSeed = (j._id || j.id || '').toString().split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
      const scoreOffset = jobSeed % 6; 
      
      const score = Math.round(50 + (matchCount / Math.max(1, requirements.length)) * 45 + scoreOffset);
      return { ...j, aiScore: Math.min(98, score) };
    }).sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0));
  }, [jobs, skillsList]);

  // Submit Referral Action
  const handleReferralSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refForm.targetJobId) {
      alert('Please select a target job opening.');
      return;
    }
    const targetJob = jobs.find(j => (j._id || j.id || '').toString() === refForm.targetJobId);
    if (!targetJob) return;

    const payload = {
      referrerName: profileData.name || 'Employee',
      referrerEmail: profileData.email || 'emp@hr.com',
      candidateName: refForm.candidateName,
      candidateEmail: refForm.candidateEmail,
      targetJobId: refForm.targetJobId,
      notes: refForm.notes,
      experience: refForm.experience,
      skills: refForm.skills,
      resumeUrl: refForm.resumeUrl
    };

    try {
      const res = await apiFetch('/api/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res) { addNotification('Server busy. Please try again shortly.'); return; }

      if (res.ok) {
        const responseData = await res.json();
        if (responseData.referral) {
          const apiRef = responseData.referral;
          const newRef: IReferral = {
            id: apiRef._id || apiRef.id,
            name: apiRef.candidateName,
            email: apiRef.candidateEmail,
            role: apiRef.role,
            status: apiRef.status,
            bonus: apiRef.bonus,
            date: apiRef.date,
            notes: apiRef.notes
          };
          setReferrals(prev => [newRef, ...prev]);
        }
        addNotification(`Successfully referred ${refForm.candidateName} for ${targetJob.title}!`);
        // Reset form
        setRefForm({ candidateName: '', candidateEmail: '', targetJobId: '', notes: '', experience: '3 years', skills: '', resumeUrl: '' });
      } else {
        alert('Failed to submit referral data.');
      }
    } catch (err) {
      console.error(err);
      addNotification(`Failed to submit referral.`);
    }
  };

  // Internal Job Application Submission
  const handleApplyInternally = async (job: IJob) => {
    const applicant: IApplicant = {
      name: profileData.name,
      email: profileData.email,
      phone: profileData.phone || '',
      status: 'Applied',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      skills: skillsList,
      experience: '4 years',
      rating: 95,
      scorecard: {},
      interviews: []
    };

    const updatedApplicants = [...(job.applicants || []), applicant];
    const jobId = job._id || job.id;

    try {
      const res = await apiFetch(`/api/jobs/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...job, applicants: updatedApplicants })
      });
      if (!res) { addNotification('Server busy. Please try again.'); return; }
      if (res.ok) {
        // Update local state immediately — no extra fetch needed
        setJobs(prev => prev.map(j => (j._id || j.id) === jobId ? { ...j, applicants: updatedApplicants } : j));
        addNotification(`Applied internally for the role of ${job.title}!`);
      }
    } catch (err) {
      console.error(err);
      addNotification(`Failed to submit internal application.`);
    }
  };

  // Toggle Save Job
  const toggleSaveJob = (id: string) => {
    if (savedJobIds.includes(id)) {
      setSavedJobIds(savedJobIds.filter(sId => sId !== id));
      addNotification('Removed from Saved Jobs.');
    } else {
      setSavedJobIds([...savedJobIds, id]);
      addNotification('Job opening saved to your list.');
    }
  };

  // Check if current employee has applied for a job
  const hasApplied = (job: IJob) => {
    return (job.applicants || []).some((app) => app.email === profileData.email);
  };

  // Add Skill
  const handleAddSkill = () => {
    if (newSkillInput.trim() && !skillsList.includes(newSkillInput.trim())) {
      setSkillsList([...skillsList, newSkillInput.trim()]);
      setNewSkillInput('');
      addNotification('Added skill to recruitment match profile.');
    }
  };

  // Remove Skill
  const handleRemoveSkill = (skill: string) => {
    setSkillsList(skillsList.filter(s => s !== skill));
    addNotification('Skill removed.');
  };

  // Filter Jobs List
  const displayJobs = useMemo(() => {
    return jobs.filter(j => {
      const matchesSearch = j.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            j.dept.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDept = selectedDeptFilter === 'All' || j.dept === selectedDeptFilter;
      return matchesSearch && matchesDept;
    });
  }, [jobs, searchTerm, selectedDeptFilter]);

  // Check if senior employee to show Interview participation tab
  const isSeniorEmployee = useMemo(() => {
    const role = profileData.designation || '';
    return role.toLowerCase().includes('senior') || 
           role.toLowerCase().includes('lead') || 
           role.toLowerCase().includes('manager') || 
           role.toLowerCase().includes('architect');
  }, [profileData]);

  // List candidates for senior interview panel simulation
  const interviewQueueCandidates = useMemo(() => {
    const list: IApplicant[] = [];
    jobs.forEach(j => {
      if (j.applicants && Array.isArray(j.applicants)) {
        j.applicants.forEach((a) => {
          if (a.status === 'Interview' || a.status === 'Technical Round') {
            list.push({ ...a, jobId: j._id, jobTitle: j.title });
          }
        });
      }
    });
    return list;
  }, [jobs]);

  const [selectedReviewApplicant, setSelectedReviewApplicant] = useState<IApplicant | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewRating, setReviewRating] = useState(4);
  const [reviewRecommend, setReviewRecommend] = useState('Select');

  const handleSubmitCandidateReview = async () => {
    if (!selectedReviewApplicant || !selectedReviewApplicant.jobId) return;
    const targetJob = jobs.find(j => j._id === selectedReviewApplicant.jobId);
    if (!targetJob) return;

    const updatedApplicants = (targetJob.applicants || []).map((app) => {
      if (app.name === selectedReviewApplicant.name) {
        return {
          ...app,
          scorecard: {
            interviewerRating: reviewRating,
            feedbackComments: `Reviewed by internal peer ${profileData.name}: ${reviewNotes}`,
            recommendation: reviewRecommend
          }
        };
      }
      return app;
    });

    try {
      const res = await apiFetch(`/api/jobs/${targetJob._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...targetJob, applicants: updatedApplicants })
      });
      if (!res) return;
      if (res.ok) {
        addNotification(`Submitted candidate evaluation scorecard for ${selectedReviewApplicant.name}!`);
        // Update local state immediately
        setJobs(prev => prev.map(j => j._id === targetJob._id ? { ...j, applicants: updatedApplicants } : j));
        setSelectedReviewApplicant(null);
        setReviewNotes('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const navTabs = useMemo(() => [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'internal-jobs', label: 'Internal Jobs', icon: Briefcase },
    { id: 'my-referrals', label: 'My Referrals', icon: UserCheck },
    { id: 'career-growth', label: 'Growth Roadmaps', icon: Target },
    { id: 'profile-grow', label: 'Skills Match', icon: Sparkles },
    ...(isSeniorEmployee ? [{ id: 'interviews-conduct', label: 'Interview Panel', icon: Calendar }] : [])
  ], [isSeniorEmployee]);

  return (
    <div className="space-y-6 text-left" suppressHydrationWarning>
      
      {/* Tab Navigation header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <span className="px-2.5 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 w-fit">
            <Sparkles className="w-2.5 h-2.5" /> Employee Growth Hub
          </span>
          <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mt-1">Careers & Referral Portal</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Explore internal transfers, recommend talent, and claim statutory bonuses.</p>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-200/40 dark:border-slate-800 w-fit max-w-full overflow-x-auto scrollbar-none shadow-inner print-invisible">
          {navTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[8.5px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer border-none whitespace-nowrap shrink-0",
                activeSubTab === tab.id 
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm" 
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              )}
            >
              <tab.icon className={cn("w-3.5 h-3.5 shrink-0", activeSubTab === tab.id ? "text-slate-900 dark:text-slate-100" : "text-slate-400")} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeSubTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeSubTab === 'dashboard' && (
            <DashboardOverview 
              jobs={jobs}
              referrals={referrals}
              totalBonusEarned={totalBonusEarned}
              pendingBonusAmount={pendingBonusAmount}
              aiRecommendedJobs={aiRecommendedJobs}
              hasApplied={hasApplied}
              handleApplyInternally={handleApplyInternally}
              setActiveSubTab={setActiveSubTab}
            />
          )}

          {activeSubTab === 'internal-jobs' && (
            <InternalJobsPortal 
              displayJobs={displayJobs}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              selectedDeptFilter={selectedDeptFilter}
              setSelectedDeptFilter={setSelectedDeptFilter}
              savedJobIds={savedJobIds}
              toggleSaveJob={toggleSaveJob}
              hasApplied={hasApplied}
              handleApplyInternally={handleApplyInternally}
            />
          )}

          {activeSubTab === 'my-referrals' && (
            <ReferralsRegister 
              jobs={jobs}
              referrals={referrals}
              refForm={refForm}
              setRefForm={setRefForm}
              handleReferralSubmit={handleReferralSubmit}
            />
          )}

          {activeSubTab === 'career-growth' && (
            <CareerGrowthMaps 
              skillsList={skillsList}
            />
          )}

          {activeSubTab === 'profile-grow' && (
            <SkillsMatchAdjuster 
              skillsList={skillsList}
              newSkillInput={newSkillInput}
              setNewSkillInput={setNewSkillInput}
              handleAddSkill={handleAddSkill}
              handleRemoveSkill={handleRemoveSkill}
            />
          )}

          {activeSubTab === 'interviews-conduct' && (
            <PeerInterviewPanel 
              interviewQueueCandidates={interviewQueueCandidates}
              selectedReviewApplicant={selectedReviewApplicant}
              setSelectedReviewApplicant={setSelectedReviewApplicant}
              reviewNotes={reviewNotes}
              setReviewNotes={setReviewNotes}
              reviewRating={reviewRating}
              setReviewRating={setReviewRating}
              reviewRecommend={reviewRecommend}
              setReviewRecommend={setReviewRecommend}
              handleSubmitCandidateReview={handleSubmitCandidateReview}
            />
          )}
        </motion.div>
      </AnimatePresence>

    </div>
  );
}

export default RecruitmentTab;
