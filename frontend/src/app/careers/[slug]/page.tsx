"use client";

import React, { useState, useEffect } from 'react';
import { 
  Briefcase, MapPin, Calendar, Clock, DollarSign, ArrowLeft, 
  Sparkles, FileText, Send, CheckCircle2, ChevronRight, UploadCloud,
  User, Mail, Phone, Link as LinkIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';

export default function JobDetailsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;

  // Read URL query parameters for source tracking
  const source = searchParams.get('source') || searchParams.get('utm_source') || 'Company Website';
  const utmSource = searchParams.get('utm_source') || '';
  const utmCampaign = searchParams.get('utm_campaign') || '';

  const [job, setJob] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Form State
  const [form, setForm] = useState({
    candidateName: '',
    email: '',
    phone: '',
    currentCompany: '',
    currentDesignation: '',
    experience: '3 years',
    currentSalary: '',
    expectedSalary: '',
    noticePeriod: 'Immediate',
    linkedInUrl: '',
    portfolioUrl: '',
    resumeUrl: '',
    coverLetter: '',
    resumeText: '' // Used to send text to Gemini for AI parsing
  });

  const [resumeFileName, setResumeFileName] = useState('');

  useEffect(() => {
    if (slug) {
      fetch(`/api/careers/${slug}`)
        .then(res => {
          if (res.ok) return res.json();
          throw new Error('Opening not found');
        })
        .then(data => {
          setJob(data.job);
          setCompany(data.company);
        })
        .catch(err => console.error('Error loading job details:', err))
        .finally(() => setIsLoading(false));
    }
  }, [slug]);

  // Handle Resume File Upload & Local text reading
  const handleResumeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setResumeFileName(file.name);

    // Read local file text for Gemini to process
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string || '';
      setForm(prev => ({ ...prev, resumeText: text }));
    };
    reader.readAsText(file);

    // Upload file to server `/api/upload`
    const formData = new FormData();
    formData.append('file', file);

    try {
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      if (uploadRes.ok) {
        const uploadData = await uploadRes.json();
        setForm(prev => ({ ...prev, resumeUrl: uploadData.url || uploadData.secure_url || '' }));
      }
    } catch (err) {
      console.error('File upload failed:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.candidateName || !form.email || !form.phone) {
      alert('Please fill in Name, Email, and Phone fields.');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      ...form,
      source,
      utmSource,
      utmCampaign
    };

    try {
      const res = await fetch(`/api/careers/${slug}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setIsSubmitted(true);
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to submit application.');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred during submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Loading opening details...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <Briefcase className="w-12 h-12 text-slate-350" />
        <h2 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-wider">Opening Closed</h2>
        <p className="text-xs text-slate-400 font-semibold max-w-sm">This career listing is no longer active, has expired, or is restricted.</p>
        <Link href="/careers" className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Back to Directory</Link>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased overflow-y-auto pb-20">
      {/* Navbar header */}
      <div className="border-b border-slate-200/50 dark:border-slate-850 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/careers" className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to open jobs
          </Link>
          <div className="flex items-center gap-2 max-w-[50%] sm:max-w-none">
            {company?.logo && (
              <img src={company.logo} alt={company.name} className="w-5 h-5 rounded object-contain shrink-0" />
            )}
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white truncate max-w-[150px] sm:max-w-[300px]" title={company?.name || 'HR Core Labs'}>{company?.name || 'HR Core Labs'}</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Job Info Details */}
        <div className="lg:col-span-2 space-y-8 text-left">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full text-[9px] font-black uppercase tracking-widest">
              <Sparkles className="w-3 h-3" /> Job Opening
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">{job.title}</h1>
            
            {/* Quick summary grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Department', val: job.dept },
                { label: 'Location', val: job.location },
                { label: 'Salary Range', val: job.salary },
                { label: 'Job Type', val: job.type }
              ].map((pill, i) => (
                <div key={i} className="p-3 bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-850 rounded-2xl">
                  <span className="text-[8px] text-slate-400 font-black uppercase tracking-wider block">{pill.label}</span>
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200 block mt-0.5">{pill.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Requirements & Description */}
          <div className="space-y-6 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/50 dark:border-slate-850 shadow-sm">
            
            {job.description && (
              <div className="space-y-3">
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest border-b pb-1.5 border-slate-100 dark:border-slate-800">Job Description</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed whitespace-pre-line">{job.description}</p>
              </div>
            )}

            {job.requirements && job.requirements.length > 0 && (
              <div className="space-y-3 pt-4">
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest border-b pb-1.5 border-slate-100 dark:border-slate-800">Key Requirements</h3>
                <ul className="space-y-2">
                  {job.requirements.map((req: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <ChevronRight className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {job.responsibilities && job.responsibilities.length > 0 && (
              <div className="space-y-3 pt-4">
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest border-b pb-1.5 border-slate-100 dark:border-slate-800">Responsibilities</h3>
                <ul className="space-y-2">
                  {job.responsibilities.map((resp: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <ChevronRight className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                      <span>{resp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {job.benefits && job.benefits.length > 0 && (
              <div className="space-y-3 pt-4">
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest border-b pb-1.5 border-slate-100 dark:border-slate-800">Benefits & Perks</h3>
                <ul className="space-y-2">
                  {job.benefits.map((b: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <ChevronRight className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Right: Apply Form Card */}
        <div className="lg:sticky lg:top-24 self-start max-h-[calc(100vh-140px)] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
          <AnimatePresence mode="wait">
            {!isSubmitted ? (
              <motion.div 
                key="form"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5 rounded-3xl border border-slate-200/50 dark:border-slate-800/80 shadow-2xl space-y-5 text-left"
              >
                <div className="border-b border-slate-100 dark:border-slate-800/80 pb-3 flex flex-col gap-1">
                  <span className="inline-flex items-center gap-1 self-start px-2.5 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full text-[9px] font-black uppercase tracking-widest">
                    <Sparkles className="w-2.5 h-2.5 animate-pulse" /> Apply Now
                  </span>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Apply for Position</h3>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-450 dark:text-slate-400 flex items-center gap-1">
                      <User className="w-3 h-3 text-blue-500" /> Full Name *
                    </label>
                    <div className="relative">
                      <input 
                        type="text" 
                        required
                        placeholder="Rahul Sharma"
                        value={form.candidateName}
                        onChange={e => setForm(prev => ({ ...prev, candidateName: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-450 dark:text-slate-400 flex items-center gap-1">
                      <Mail className="w-3 h-3 text-blue-500" /> Email *
                    </label>
                    <div className="relative">
                      <input 
                        type="email" 
                        required
                        placeholder="rahul@domain.com"
                        value={form.email}
                        onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-450 dark:text-slate-400 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-blue-500" /> Phone *
                    </label>
                    <div className="relative">
                      <input 
                        type="tel" 
                        required
                        placeholder="+91 99999 88888"
                        value={form.phone}
                        onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200"
                      />
                    </div>
                  </div>

                  {/* Experience & Notice Period */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-450 dark:text-slate-400 flex items-center gap-1">
                        <Briefcase className="w-3 h-3 text-blue-500" /> Experience *
                      </label>
                      <input 
                        type="text" 
                        required
                        placeholder="3.5 years"
                        value={form.experience}
                        onChange={e => setForm(prev => ({ ...prev, experience: e.target.value }))}
                        className="w-full px-3 py-2.5 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-450 dark:text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-blue-500" /> Notice Period
                      </label>
                      <input 
                        type="text" 
                        placeholder="1 Month"
                        value={form.noticePeriod}
                        onChange={e => setForm(prev => ({ ...prev, noticePeriod: e.target.value }))}
                        className="w-full px-3 py-2.5 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200"
                      />
                    </div>
                  </div>

                  {/* LinkedIn */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-450 dark:text-slate-400 flex items-center gap-1">
                      <LinkIcon className="w-3 h-3 text-blue-500" /> LinkedIn Profile Link
                    </label>
                    <div className="relative">
                      <input 
                        type="url" 
                        placeholder="https://linkedin.com/in/profile"
                        value={form.linkedInUrl}
                        onChange={e => setForm(prev => ({ ...prev, linkedInUrl: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200"
                      />
                    </div>
                  </div>

                  {/* Resume Upload Box */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-450 dark:text-slate-400 flex items-center gap-1">
                      <UploadCloud className="w-3 h-3 text-blue-500" /> Upload Resume *
                    </label>
                    <div className="relative border-2 border-dashed border-slate-350 dark:border-slate-700/80 rounded-xl p-4 flex flex-col items-center justify-center bg-slate-50/30 dark:bg-slate-950/20 text-center hover:bg-slate-100/30 dark:hover:bg-slate-900/30 hover:border-blue-500/50 transition-all duration-200 cursor-pointer">
                      <UploadCloud className="w-7 h-7 text-blue-500 mb-1" />
                      {resumeFileName ? (
                        <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 truncate max-w-full">{resumeFileName}</p>
                      ) : (
                        <p className="text-[9.5px] font-extrabold text-slate-500 dark:text-slate-400">Choose TXT or PDF document</p>
                      )}
                      <input 
                        type="file"
                        required={!form.resumeUrl}
                        accept=".txt,.pdf"
                        onChange={handleResumeChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Cover Letter */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-450 dark:text-slate-400 flex items-center gap-1">
                      <FileText className="w-3 h-3 text-blue-500" /> Cover Letter
                    </label>
                    <textarea 
                      rows={2}
                      placeholder="Why do you want to join our team?"
                      value={form.coverLetter}
                      onChange={e => setForm(prev => ({ ...prev, coverLetter: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 resize-none focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200"
                    />
                  </div>

                  {/* Submit Button */}
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-500 hover:via-indigo-500 hover:to-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/25 active:scale-[0.98] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 border-none"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Submitting Application...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" /> Submit Application
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl border border-emerald-100 dark:border-emerald-950 shadow-2xl text-center space-y-4"
              >
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950 rounded-full flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Application Received</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-relaxed">
                    Thank you for applying, {form.candidateName}! We have successfully logged your application, and an confirmation email has been dispatched.
                  </p>
                </div>
                <Link href="/careers" className="w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest block transition-all shadow-inner">Back to Listings</Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
