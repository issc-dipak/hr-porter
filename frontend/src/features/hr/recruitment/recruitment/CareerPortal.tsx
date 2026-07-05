"use client";

import React, { useState } from 'react';
import { IJob } from './types';
import { 
  Copy, Check, Share2, Globe, QrCode, Send, Mail 
} from 'lucide-react';

const LinkedinIcon = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const FacebookIcon = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const TwitterIcon = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);
import { motion, AnimatePresence } from 'framer-motion';

interface CareerPortalProps {
  jobs: IJob[];
  fetchJobs: () => Promise<void>;
  triggerToast?: (msg: string) => void;
}

export default function CareerPortal({ jobs, fetchJobs, triggerToast }: CareerPortalProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeQRId, setActiveQRId] = useState<string | null>(null);
  const [isPublishingId, setIsPublishingId] = useState<string | null>(null);

  const handlePublish = async (jobId: string) => {
    setIsPublishingId(jobId);
    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const res = await fetch(`/api/jobs/${jobId}/publish`, {
        method: 'POST',
        headers
      });

      if (res.ok) {
        await fetchJobs();
        if (triggerToast) {
          triggerToast('Job opening published successfully!');
        }
      } else {
        if (triggerToast) {
          triggerToast('Failed to publish job opening.');
        } else {
          alert('Failed to publish job opening.');
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsPublishingId(null);
    }
  };

  const getPublicUrl = (slug: string) => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/careers/${slug}`;
    }
    return `http://localhost:3000/careers/${slug}`;
  };

  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 text-left">
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-850 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Public Careers & Recruitment Portal</h4>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Publish active job openings externally and share links to collect candidate applications</p>
        </div>
        <a 
          href="/careers" 
          target="_blank" 
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer border-none"
        >
          <Globe className="w-3.5 h-3.5" /> Visit Career Directory
        </a>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {jobs.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-slate-400 text-xs font-bold uppercase tracking-wider">
            No Job Openings Created Yet
          </div>
        ) : (
          jobs.map((job) => {
            const isPublished = job.status === 'Published';
            const publicUrl = job.publicUrlSlug ? getPublicUrl(job.publicUrlSlug) : '';

            return (
              <div 
                key={job._id}
                className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-3xl shadow-sm flex flex-col lg:flex-row justify-between gap-5 items-start lg:items-center hover:border-slate-200 dark:hover:border-slate-800 transition-all"
              >
                <div className="space-y-2 max-w-xl">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white leading-snug">{job.title}</h3>
                    <p className="text-[9px] text-blue-600 dark:text-blue-400 font-black uppercase tracking-wider mt-0.5">{job.dept} • {job.location}</p>
                  </div>
                  
                  {isPublished && publicUrl && (
                    <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 p-2 rounded-xl border border-slate-100 dark:border-slate-850 max-w-full overflow-hidden">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest shrink-0">URL:</span>
                      <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 truncate select-all">{publicUrl}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto shrink-0">
                  {isPublished && publicUrl ? (
                    <>
                      {/* Copy Link Button */}
                      <button
                        onClick={() => handleCopyLink(publicUrl, job._id)}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer border-none"
                      >
                        {copiedId === job._id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" /> Copy
                          </>
                        )}
                      </button>

                      {/* QR Code Toggle Button */}
                      <button
                        onClick={() => setActiveQRId(activeQRId === job._id ? null : job._id)}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer border-none"
                      >
                        <QrCode className="w-3.5 h-3.5" /> QR Code
                      </button>

                      {/* Social Share Group */}
                      <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-150 dark:border-slate-850">
                        {/* LinkedIn */}
                        <a 
                          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(publicUrl)}`}
                          target="_blank"
                          className="p-1.5 text-slate-500 hover:text-[#0a66c2] rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                          title="Share on LinkedIn"
                        >
                          <LinkedinIcon className="w-3.5 h-3.5" />
                        </a>
                        {/* WhatsApp */}
                        <a 
                          href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`We are hiring: ${job.title}! Apply at: ${publicUrl}`)}`}
                          target="_blank"
                          className="p-1.5 text-slate-500 hover:text-[#25d366] rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                          title="Share on WhatsApp"
                        >
                          <Send className="w-3.5 h-3.5 rotate-45 -translate-y-0.5" />
                        </a>
                        {/* Facebook */}
                        <a 
                          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(publicUrl)}`}
                          target="_blank"
                          className="p-1.5 text-slate-500 hover:text-[#1877f2] rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                          title="Share on Facebook"
                        >
                          <FacebookIcon className="w-3.5 h-3.5" />
                        </a>
                        {/* Twitter / X */}
                        <a 
                          href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(publicUrl)}&text=${encodeURIComponent(`We're looking for a ${job.title} to join our team!`)}`}
                          target="_blank"
                          className="p-1.5 text-slate-500 hover:text-black dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                          title="Share on X (Twitter)"
                        >
                          <TwitterIcon className="w-3.5 h-3.5" />
                        </a>
                        {/* Email */}
                        <a 
                          href={`mailto:?subject=${encodeURIComponent(`Careers: ${job.title}`)}&body=${encodeURIComponent(`Check out this job opportunity: ${publicUrl}`)}`}
                          className="p-1.5 text-slate-500 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                          title="Share via Email"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </>
                  ) : (
                    <button
                      onClick={() => handlePublish(job._id)}
                      disabled={isPublishingId === job._id}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-md shadow-blue-500/10 border-none flex items-center gap-1.5"
                    >
                      {isPublishingId === job._id ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Publishing...
                        </>
                      ) : (
                        <>
                          <Share2 className="w-3.5 h-3.5" /> Publish to Career Portal
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* QR Code Modal Overlay/Dropdown */}
                <AnimatePresence>
                  {activeQRId === job._id && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="w-full bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-150 dark:border-slate-850 flex flex-col items-center justify-center space-y-3 mt-4"
                    >
                      <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400">Position URL QR Code</h4>
                      <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(publicUrl)}`} 
                          alt="QR Code Link"
                          className="w-36 h-36"
                        />
                      </div>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Scan with smartphone camera to apply directly</p>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
