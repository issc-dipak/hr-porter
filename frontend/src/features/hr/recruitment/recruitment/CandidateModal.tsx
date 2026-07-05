"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Calendar, Users, Video, Clock, Copy, Check, Trash2, Plus, User, 
  ExternalLink, CalendarDays, CheckCircle2, ChevronRight, MapPin, 
  AlertCircle, Sparkles, Building, VideoOff 
} from 'lucide-react';
import { IJob, IApplicant } from './types';
import { cn } from "@/lib/utils";

interface CandidateModalProps {
  isOpen: boolean;
  applicant: IApplicant | null;
  job: IJob | null;
  onClose: () => void;
  onUpdateApplicant: (updatedJobPayload: IJob) => void;
  jobs: IJob[];
  triggerToast?: (msg: string) => void;
}

export default function CandidateModal({ 
  isOpen, 
  applicant, 
  job, 
  onClose, 
  onUpdateApplicant,
  jobs,
  triggerToast
}: CandidateModalProps) {
  const [activeSection, setActiveSection] = useState<'info' | 'scorecard' | 'schedule' | 'ai'>('info');
  const [candidateStatus, setCandidateStatus] = useState('Applied');

  // Scorecard Feedbacks State
  const [feedbackRating, setFeedbackRating] = useState(4);
  const [feedbackComments, setFeedbackComments] = useState('');
  const [feedbackRecommendation, setFeedbackRecommendation] = useState('Select');

  // Interview Scheduler State
  const getTodayDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getNowTimeString = () => {
    const d = new Date();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const [employees, setEmployees] = useState<any[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isSchedulingOpen, setIsSchedulingOpen] = useState(false);
  const [interviewForm, setInterviewForm] = useState({
    round: 'Technical Round',
    date: getTodayDateString(),
    time: getNowTimeString(),
    interviewer: '',
    meetingType: 'Google Meet',
    duration: '45',
    location: 'Office Address / HQ Office',
    meetingLink: ''
  });

  const generateGoogleMeetLink = () => {
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    const randLetters = (len: number) => 
      Array.from({ length: len }, () => letters[Math.floor(Math.random() * letters.length)]).join('');
    return `https://meet.google.com/${randLetters(3)}-${randLetters(4)}-${randLetters(3)}`;
  };

  const generateZoomLink = () => {
    const digits = '0123456789';
    const randDigits = (len: number) => 
      Array.from({ length: len }, () => digits[Math.floor(Math.random() * digits.length)]).join('');
    return `https://zoom.us/j/${randDigits(10)}`;
  };

  // Fetch active employees
  useEffect(() => {
    if (isOpen) {
      setInterviewForm(prev => ({
        ...prev,
        meetingLink: prev.meetingLink || (prev.meetingType === 'Google Meet' ? generateGoogleMeetLink() : '')
      }));

      const fetchEmployees = async () => {
        try {
          const token = typeof window !== 'undefined' ? localStorage.getItem('hr_system_token') : null;
          const headers: HeadersInit = { 'Content-Type': 'application/json' };
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }
          const res = await fetch('/api/employees', { headers });
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
              setEmployees(data);
              if (data.length > 0 && !interviewForm.interviewer) {
                const firstEmp = data[0];
                setInterviewForm(prev => ({
                  ...prev,
                  interviewer: `${firstEmp.fullName} (${firstEmp.designation || 'Staff'})`
                }));
              }
            }
          }
        } catch (err) {
          console.error("Failed to fetch employees", err);
        }
      };
      fetchEmployees();
    }
  }, [isOpen]);

  useEffect(() => {
    if (applicant) {
      setCandidateStatus(applicant.status);
    }
    if (applicant?.scorecard) {
      setFeedbackRating(applicant.scorecard.interviewerRating || 4);
      setFeedbackComments(applicant.scorecard.feedbackComments || '');
      setFeedbackRecommendation(applicant.scorecard.recommendation || 'Select');
    } else {
      setFeedbackRating(4);
      setFeedbackComments('');
      setFeedbackRecommendation('Select');
    }
    setIsSchedulingOpen(false);
  }, [applicant, isOpen]);

  if (!isOpen || !applicant || !job) return null;

  const handleStatusChange = async (newStatus: string) => {
    setCandidateStatus(newStatus);
    
    const updatedApplicants = job.applicants.map((app) => {
      if (app.name === applicant.name) {
        return {
          ...app,
          status: newStatus
        };
      }
      return app;
    });

    const payload = { ...job, applicants: updatedApplicants };

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('hr_system_token') : null;
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`/api/jobs/${job._id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        onUpdateApplicant(data.job);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Scorecard Submission
  const handleSaveScorecard = async () => {
    const updatedApplicants = job.applicants.map((app) => {
      if (app.name === applicant.name) {
        return {
          ...app,
          scorecard: {
            interviewerRating: feedbackRating,
            feedbackComments,
            recommendation: feedbackRecommendation
          }
        };
      }
      return app;
    });

    const payload = { ...job, applicants: updatedApplicants };

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('hr_system_token') : null;
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`/api/jobs/${job._id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        onUpdateApplicant(data.job);
        if (triggerToast) {
          triggerToast('Scorecard submitted successfully!');
        } else {
          alert('Scorecard submitted successfully!');
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Schedule Interview
  const handleScheduleInterview = async () => {
    const activeEvaluator = interviewForm.interviewer;
    if (!activeEvaluator || activeEvaluator === 'custom') {
      if (triggerToast) triggerToast('Please specify a valid evaluator.');
      else alert('Please specify a valid evaluator.');
      return;
    }

    const durationText = `${interviewForm.duration} mins`;
    const finalLocation = interviewForm.meetingType === 'In Person' 
      ? interviewForm.location 
      : `${interviewForm.meetingType} (${durationText})`;

    const meetingLink = interviewForm.meetingType === 'In Person'
      ? ''
      : (interviewForm.meetingLink || (
          interviewForm.meetingType === 'Google Meet' ? generateGoogleMeetLink() : generateZoomLink()
        ));

    const newInterview = {
      round: interviewForm.round,
      date: interviewForm.date,
      time: interviewForm.time,
      interviewer: activeEvaluator,
      meetingLink,
      location: finalLocation,
      completed: false
    };

    const updatedApplicants = job.applicants.map((app) => {
      if (app.name === applicant.name) {
        const currentInterviews = app.interviews || [];
        return {
          ...app,
          status: 'Interview', // Automatically advance to Interview stage
          interviews: [...currentInterviews, newInterview]
        };
      }
      return app;
    });

    const payload = { ...job, applicants: updatedApplicants };

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('hr_system_token') : null;
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`/api/jobs/${job._id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        onUpdateApplicant(data.job);
        setIsSchedulingOpen(false);
        if (triggerToast) {
          triggerToast('Interview scheduled successfully! Notification email dispatched.');
        } else {
          alert('Interview scheduled successfully! Notification email dispatched.');
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete/Cancel Interview Round
  const handleDeleteInterview = async (indexToDelete: number) => {
    if (!applicant.interviews) return;
    const updatedInterviews = applicant.interviews.filter((_, idx) => idx !== indexToDelete);

    const updatedApplicants = job.applicants.map((app) => {
      if (app.name === applicant.name) {
        return {
          ...app,
          interviews: updatedInterviews
        };
      }
      return app;
    });

    const payload = { ...job, applicants: updatedApplicants };

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('hr_system_token') : null;
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`/api/jobs/${job._id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        onUpdateApplicant(data.job);
        if (triggerToast) {
          triggerToast('Interview round cancelled successfully.');
        } else {
          alert('Interview round cancelled successfully.');
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Mark Interview Complete and redirect to Scorecard
  const handleCompleteInterview = async (indexToComplete: number) => {
    if (!applicant.interviews) return;
    const updatedInterviews = applicant.interviews.map((int, idx) => {
      if (idx === indexToComplete) {
        return { ...int, completed: true };
      }
      return int;
    });

    const updatedApplicants = job.applicants.map((app) => {
      if (app.name === applicant.name) {
        return {
          ...app,
          interviews: updatedInterviews
        };
      }
      return app;
    });

    const payload = { ...job, applicants: updatedApplicants };

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('hr_system_token') : null;
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`/api/jobs/${job._id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        onUpdateApplicant(data.job);
        if (triggerToast) {
          triggerToast('Interview marked as completed! Loading scorecard...');
        }
        setActiveSection('scorecard');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Clipboard copy helper
  const copyToClipboard = (link: string, idx: number) => {
    navigator.clipboard.writeText(link);
    setCopiedIndex(idx);
    if (triggerToast) {
      triggerToast('Meeting link copied to clipboard!');
    }
    setTimeout(() => {
      setCopiedIndex(null);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 40 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.9, y: 40 }} 
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-left"
      >
        
        {/* Header profile section */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-between items-start">
          <div className="flex gap-3 items-center">
            <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-black text-base flex items-center justify-center shadow-lg shadow-blue-500/10">
              {applicant.name.split(' ').map((n: string) => n[0]).join('')}
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white leading-tight">{applicant.name}</h2>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[10px] text-slate-450 dark:text-slate-400 font-bold uppercase tracking-wider">{job.title} • </span>
                <select
                  value={candidateStatus}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="px-2.5 py-0.5 bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-md border-0 text-[10px] font-black uppercase tracking-wider cursor-pointer focus:ring-0 focus:outline-none"
                >
                  <option value="Applied">Applied</option>
                  <option value="Screening">Screening</option>
                  <option value="Shortlisted">Shortlisted</option>
                  <option value="Interview">Interview</option>
                  <option value="Technical Round">Technical Round</option>
                  <option value="HR Round">HR Round</option>
                  <option value="Hired">Hired</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {applicant.rating && (
              <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-wider">{applicant.rating}% Match score</span>
            )}
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center bg-white dark:bg-slate-800 rounded-lg border border-slate-150 cursor-pointer">
              <X className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Sub-nav inside candidate modal */}
        <div className="flex border-b border-slate-100 dark:border-slate-850 px-5 pt-1.5 gap-2">
          {[
            { id: 'info', label: 'Credentials Profile' },
            { id: 'ai', label: 'AI Match Insights' },
            { id: 'scorecard', label: 'Evaluation Scorecard' },
            { id: 'schedule', label: 'Interview Scheduler' }
          ].map(sec => (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id as any)}
              className={cn(
                "px-3.5 py-2 text-[9px] font-black uppercase tracking-widest border-b-2 transition-all cursor-pointer",
                activeSection === sec.id ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              )}
            >
              {sec.label}
            </button>
          ))}
        </div>

        {/* Modal Body Scroll area */}
        <div className="p-5 max-h-[320px] overflow-y-auto no-scrollbar space-y-4">
          
          {/* 1. Profile details */}
          {activeSection === 'info' && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Email Address</span>
                  <span className="font-bold text-slate-850 dark:text-white">{applicant.email || 'N/A'}</span>
                </div>
                <div>
                  <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Phone Number</span>
                  <span className="font-bold text-slate-850 dark:text-white">{applicant.phone || 'N/A'}</span>
                </div>
                <div>
                  <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Experience</span>
                  <span className="font-bold text-slate-850 dark:text-white">{applicant.experience || 'N/A'}</span>
                </div>
                <div>
                  <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Department</span>
                  <span className="font-bold text-slate-850 dark:text-white">{job.dept || 'N/A'}</span>
                </div>
              </div>

              {/* Resume document and Endorsement Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-slate-850">
                <div>
                  <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Candidate Resume</span>
                  {applicant.resumeUrl ? (
                    <a 
                      href={applicant.resumeUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-blue-600 hover:text-white transition-all cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      View Resume Document
                    </a>
                  ) : (
                    <span className="text-slate-450 italic text-[10px] font-bold uppercase">No Resume Attached</span>
                  )}
                </div>

                <div>
                  <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Source / Referral Channel</span>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-150/40 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold leading-relaxed">
                    {applicant.phone === 'Statutory Referral' || applicant.rating === 85 || applicant.resumeUrl ? (
                      'Employee Referral (Referred via internal staff portal)'
                    ) : 'Direct Applicant'}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Candidate Skills Inventory</span>
                <div className="flex flex-wrap gap-1.5">
                  {(applicant.skills || []).map((s: string, idx: number) => (
                    <span key={idx} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[9px] rounded-md font-bold">{s}</span>
                  ))}
                  {(!applicant.skills || applicant.skills.length === 0) && (
                    <span className="text-slate-450 italic">No skills listed</span>
                  )}
                </div>
              </div>

              {/* Timeline History of applicant */}
              <div className="space-y-2.5">
                <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Activity Audit trail</span>
                <div className="border-l-2 border-slate-100 dark:border-slate-800 pl-4 ml-2 space-y-3 text-[11px] font-semibold text-slate-500">
                  <p>Applied to position via Careers portal on <span className="text-slate-700 dark:text-slate-300">{applicant.date}</span></p>
                  {applicant.scorecard?.interviewerRating && (
                    <p>Scorecard submitted by HR Recruiter, rated <span className="text-emerald-600 font-extrabold">{applicant.scorecard.interviewerRating}/5.0</span></p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* AI Insights Section */}
          {activeSection === 'ai' && (
            <div className="space-y-5 text-xs text-left">
              {/* 1. Gauge / Match Percentage */}
              <div className="flex items-center justify-between p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">AI Candidate Match Score</h4>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Calculated by Google Gemini AI against job parameters</p>
                </div>
                <div className="flex flex-col items-center shrink-0">
                  <span className={cn(
                    "px-4 py-2 text-lg font-black rounded-2xl shadow-sm",
                    (applicant.rating || 0) >= 80 ? "bg-emerald-500/10 text-emerald-600" :
                    (applicant.rating || 0) >= 50 ? "bg-amber-500/10 text-amber-600" :
                    "bg-rose-500/10 text-rose-600"
                  )}>
                    {applicant.rating || 75}%
                  </span>
                  <span className="text-[8.5px] font-black uppercase text-slate-400 tracking-wider mt-1.5">Match Ratio</span>
                </div>
              </div>

              {/* 2. AI Summary */}
              <div className="space-y-1.5">
                <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">AI Profile Evaluation Summary</span>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-150/40 dark:border-slate-800 text-slate-600 dark:text-slate-350 text-xs font-semibold leading-relaxed whitespace-pre-line italic">
                  "{applicant.aiSummary || 'No AI summary available. Resume has not been evaluated by Gemini.'}"
                </div>
              </div>

              {/* 3. AI Suggested Questions */}
              <div className="space-y-2">
                <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Gemini Suggested Interview Questions</span>
                <div className="space-y-2">
                  {(applicant.aiSuggestedQuestions || [
                    'Can you describe your experience with the tech stack specified in the requirements?',
                    'Explain a challenging engineering problem you solved in your current role.',
                    'How do you manage deadlines and code quality constraints?'
                  ]).map((q, idx) => (
                    <div key={idx} className="flex gap-2.5 p-3.5 bg-slate-100/40 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 rounded-2xl">
                      <span className="text-[10px] font-black text-blue-600 dark:text-blue-400">Q{idx + 1}</span>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-350">{q}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 2. Scorecard review / submit */}
          {activeSection === 'scorecard' && (
            <div className="space-y-4 text-xs">
              {/* Exisiting scorecard display */}
              {applicant.scorecard?.interviewerRating ? (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-emerald-600">
                    <span>Evaluation score submitted</span>
                    <span>{applicant.scorecard.recommendation === 'Select' ? 'Strong Selection recommended' : 'Hold / Rejected'}</span>
                  </div>
                  <p className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-1">
                    Rating: <span className="text-emerald-600">{applicant.scorecard.interviewerRating} / 5.0</span>
                  </p>
                  <p className="text-slate-500 font-semibold italic">"{applicant.scorecard.feedbackComments}"</p>
                </div>
              ) : (
                <p className="text-slate-400 font-bold uppercase text-[9px] tracking-wider italic">No scorecard has been submitted yet for this applicant.</p>
              )}

              {/* Form to submit a new scorecard */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3.5">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Evaluate Candidate Credentials</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Interviewer Rating (1-5)</label>
                    <input 
                      type="number" 
                      min={1} 
                      max={5} 
                      step={0.1}
                      value={feedbackRating}
                      onChange={e => setFeedbackRating(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Final Recommendation</label>
                    <select
                      value={feedbackRecommendation}
                      onChange={e => setFeedbackRecommendation(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
                    >
                      <option>Select</option>
                      <option>Reject</option>
                      <option>On Hold</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Written Feedback Notes</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Strong system engineering basics. Answered React design patterns correctly..."
                    value={feedbackComments}
                    onChange={e => setFeedbackComments(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <button 
                  onClick={handleSaveScorecard}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-md transition-all cursor-pointer"
                >
                  Submit Scorecard
                </button>
              </div>
            </div>
          )}          {/* 3. Scheduler details */}
          {activeSection === 'schedule' && (
            <div className="space-y-4 text-xs">
              {/* Configure Schedule Form */}
              {isSchedulingOpen ? (
                <div className="p-5 bg-slate-50/50 dark:bg-slate-850 border border-slate-150/40 dark:border-slate-800 rounded-2xl space-y-4 text-left relative overflow-hidden shadow-inner">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-blue-500 animate-spin-slow" /> Configure Evaluation Round
                      </h4>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Establish slots and assign staff evaluation panels</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Round Type Pill Selectors */}
                    <div className="space-y-1.5">
                      <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Round Type</label>
                      <div className="flex flex-wrap gap-1.5">
                        {['Screening', 'Technical Round', 'HR Round', 'Final Interview'].map((rnd) => (
                          <button
                            key={rnd}
                            type="button"
                            onClick={() => setInterviewForm({ ...interviewForm, round: rnd })}
                            className={cn(
                              "px-3.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer border",
                              interviewForm.round === rnd
                                ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                            )}
                          >
                            {rnd}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Duration selector */}
                    <div className="space-y-1.5">
                      <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Interview Duration</label>
                      <div className="flex gap-1.5">
                        {['30', '45', '60', '90'].map((dur) => (
                          <button
                            key={dur}
                            type="button"
                            onClick={() => setInterviewForm({ ...interviewForm, duration: dur })}
                            className={cn(
                              "flex-1 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer border text-center",
                              interviewForm.duration === dur
                                ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-205"
                            )}
                          >
                            {dur} mins
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Platform selection cards */}
                    <div className="space-y-1.5">
                      <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Meeting Platform</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'Google Meet', icon: Video, label: 'Google Meet' },
                          { id: 'Zoom', icon: Video, label: 'Zoom' },
                          { id: 'In Person', icon: Building, label: 'In Person' }
                        ].map((plat) => (
                          <button
                            key={plat.id}
                            type="button"
                            onClick={() => {
                              let link = '';
                              if (plat.id === 'Google Meet') link = generateGoogleMeetLink();
                              else if (plat.id === 'Zoom') link = generateZoomLink();
                              setInterviewForm({ 
                                ...interviewForm, 
                                meetingType: plat.id,
                                meetingLink: link
                              });
                            }}
                            className={cn(
                              "flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer gap-1.5 text-center",
                              interviewForm.meetingType === plat.id
                                ? "bg-blue-500/5 border-blue-500/30 text-blue-600 dark:text-blue-400 font-extrabold"
                                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-350 dark:hover:border-slate-700"
                            )}
                          >
                            <plat.icon className="w-4 h-4" />
                            <span className="text-[9px] font-black uppercase tracking-wider">{plat.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Meeting Link Input */}
                    {interviewForm.meetingType !== 'In Person' && (
                      <div className="space-y-1">
                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Meeting Link (Paste real link here if needed)</label>
                        <input 
                          type="text"
                          placeholder="e.g., https://meet.google.com/abc-defg-hij"
                          value={interviewForm.meetingLink}
                          onChange={e => setInterviewForm({ ...interviewForm, meetingLink: e.target.value })}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    )}

                    {/* Date and Time pickers side by side */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Date</label>
                        <input 
                          type="date"
                          value={interviewForm.date}
                          onChange={e => setInterviewForm({ ...interviewForm, date: e.target.value })}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Time Slot</label>
                        <input 
                          type="time"
                          value={interviewForm.time}
                          onChange={e => setInterviewForm({ ...interviewForm, time: e.target.value })}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Assigned Evaluator */}
                    <div className="space-y-1">
                      <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Assigned Evaluator</label>
                      <select
                        value={interviewForm.interviewer === 'custom' || (!employees.some(emp => `${emp.fullName} (${emp.designation || 'Staff'})` === interviewForm.interviewer) && interviewForm.interviewer !== '') ? 'custom' : interviewForm.interviewer}
                        onChange={e => {
                          const val = e.target.value;
                          if (val === 'custom') {
                            setInterviewForm({ ...interviewForm, interviewer: 'custom' });
                          } else {
                            setInterviewForm({ ...interviewForm, interviewer: val });
                          }
                        }}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white cursor-pointer focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="">Select an Employee...</option>
                        {employees.map((emp) => {
                          const fullVal = `${emp.fullName} (${emp.designation || 'Staff'})`;
                          return (
                            <option key={emp._id} value={fullVal}>
                              {emp.fullName} ({emp.designation || 'Staff'})
                            </option>
                          );
                        })}
                        <option value="custom">-- Type Custom Evaluator Name --</option>
                      </select>
                      {(interviewForm.interviewer === 'custom' || employees.length === 0 || (!employees.some(emp => `${emp.fullName} (${emp.designation || 'Staff'})` === interviewForm.interviewer) && interviewForm.interviewer !== '')) && (
                        <input 
                          type="text"
                          placeholder="Enter custom evaluator name & role"
                          value={interviewForm.interviewer === 'custom' ? '' : interviewForm.interviewer}
                          onChange={e => setInterviewForm({ ...interviewForm, interviewer: e.target.value })}
                          className="w-full mt-2 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        />
                      )}
                    </div>

                    {/* Location (for in person) */}
                    {interviewForm.meetingType === 'In Person' && (
                      <div className="space-y-1">
                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Office Location / Address</label>
                        <input 
                          type="text"
                          placeholder="e.g. Conference Room A, HQ Building"
                          value={interviewForm.location}
                          onChange={e => setInterviewForm({ ...interviewForm, location: e.target.value })}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2.5 pt-2">
                      <button 
                        type="button" 
                        onClick={() => setIsSchedulingOpen(false)}
                        className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-350 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button 
                        type="button" 
                        onClick={handleScheduleInterview}
                        className="flex-[2] py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Calendar className="w-3.5 h-3.5" /> Book Interview Slot
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-xs">
                  {applicant.interviews && applicant.interviews.length > 0 ? (
                    <div className="space-y-4 text-left">
                      <div className="flex justify-between items-center">
                        <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Scheduled Rounds Timeline</span>
                        <button 
                          onClick={() => setIsSchedulingOpen(true)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[8.5px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-sm shadow-blue-500/10"
                        >
                          <Plus className="w-3 h-3" /> Schedule Round
                        </button>
                      </div>

                      <div className="relative border-l-2 border-slate-105 dark:border-slate-800 pl-6 ml-3 space-y-5">
                        {applicant.interviews.map((int: any, idx: number) => {
                          const isCompleted = int.completed;
                          const isVideo = int.meetingLink && int.meetingLink.trim().length > 0;
                          return (
                            <div key={idx} className="relative">
                              {/* Timeline indicator node */}
                              <div className={cn(
                                "absolute -left-[32px] top-1.5 w-3.5 h-3.5 rounded-full border flex items-center justify-center bg-white dark:bg-slate-900 transition-all",
                                isCompleted 
                                  ? "border-emerald-500 text-emerald-500 bg-emerald-50 dark:bg-slate-900" 
                                  : "border-blue-500 text-blue-500 bg-blue-50 dark:bg-slate-900 animate-pulse"
                              )}>
                                {isCompleted ? <Check className="w-2.5 h-2.5 text-emerald-600" /> : <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                              </div>

                              {/* Timeline Card */}
                              <div className="p-4 bg-slate-50/50 dark:bg-slate-800/30 border border-slate-150/40 dark:border-slate-800 rounded-2xl space-y-3 shadow-sm hover:shadow-md transition-all">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <span className="px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[8px] font-black uppercase rounded-md tracking-wider">
                                      {int.round}
                                    </span>
                                    <h4 className="text-xs font-black text-slate-800 dark:text-white mt-1.5 flex items-center gap-1.5">
                                      <Users className="w-3.5 h-3.5 text-slate-400" />
                                      {int.interviewer}
                                    </h4>
                                  </div>
                                  <span className={cn(
                                    "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider",
                                    isCompleted 
                                      ? "bg-emerald-500/10 text-emerald-600" 
                                      : "bg-amber-500/10 text-amber-600"
                                  )}>
                                    {isCompleted ? 'Completed' : 'Upcoming'}
                                  </span>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 font-bold border-t border-slate-100 dark:border-slate-800/60 pt-2.5">
                                  <div className="flex items-center gap-1.5">
                                    <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                                    <span>{int.date}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                                    <span>{int.time}</span>
                                  </div>
                                  {int.location && (
                                    <div className="col-span-2 flex items-center gap-1.5">
                                      {isVideo ? <Video className="w-3.5 h-3.5 text-slate-400" /> : <MapPin className="w-3.5 h-3.5 text-slate-400" />}
                                      <span className="truncate">{int.location}</span>
                                    </div>
                                  )}
                                </div>

                                <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 dark:border-slate-800/60 pt-2.5">
                                  {isVideo && (
                                    <>
                                      <a 
                                        href={int.meetingLink}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                                      >
                                        <Video className="w-3 h-3" /> Join {int.meetingLink.includes('zoom.us') ? 'Zoom' : 'Google Meet'} <ExternalLink className="w-2.5 h-2.5" />
                                      </a>
                                      <button 
                                        onClick={() => copyToClipboard(int.meetingLink, idx)}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-200/60 hover:bg-slate-250 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-350 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
                                      >
                                        {copiedIndex === idx ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                        {copiedIndex === idx ? 'Copied' : 'Copy'}
                                      </button>
                                    </>
                                  )}

                                  {!isCompleted && (
                                    <button 
                                      onClick={() => handleCompleteInterview(idx)}
                                      className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm shadow-emerald-500/10"
                                    >
                                      <CheckCircle2 className="w-3 h-3" /> Complete Round
                                    </button>
                                  )}

                                  <button 
                                    onClick={() => handleDeleteInterview(idx)}
                                    className="ml-auto flex items-center justify-center p-1.5 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-500/5 transition-all cursor-pointer"
                                    title="Cancel Interview Round"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    /* Glassmorphic Empty State */
                    <div className="p-8 bg-slate-50/50 dark:bg-slate-850 border border-slate-150/40 dark:border-slate-800 rounded-2xl flex flex-col items-center text-center space-y-4 relative overflow-hidden shadow-inner">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
                      <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <CalendarDays className="w-6 h-6 animate-pulse" />
                      </div>
                      <div className="space-y-1.5 max-w-sm">
                        <h4 className="text-sm font-black text-slate-900 dark:text-white">No Evaluation Scheduled</h4>
                        <p className="text-[10px] text-slate-550 font-bold leading-normal uppercase tracking-wider">
                          Establish a direct connection. Coordinate screening, technical challenges, or cultural rounds to evaluate candidate credentials.
                        </p>
                      </div>
                      <button 
                        onClick={() => setIsSchedulingOpen(true)}
                        className="px-5 py-2.5 bg-slate-900 dark:bg-slate-800 hover:bg-black text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-md"
                      >
                        + Schedule Interview Round
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
