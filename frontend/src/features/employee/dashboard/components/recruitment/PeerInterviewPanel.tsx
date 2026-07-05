"use client";

import React from 'react';
import { IApplicant } from './types';

interface PeerInterviewPanelProps {
  interviewQueueCandidates: IApplicant[];
  selectedReviewApplicant: IApplicant | null;
  setSelectedReviewApplicant: (applicant: IApplicant | null) => void;
  reviewNotes: string;
  setReviewNotes: (notes: string) => void;
  reviewRating: number;
  setReviewRating: (rating: number) => void;
  reviewRecommend: string;
  setReviewRecommend: (recommend: string) => void;
  handleSubmitCandidateReview: () => void;
}

export default function PeerInterviewPanel({
  interviewQueueCandidates,
  selectedReviewApplicant,
  setSelectedReviewApplicant,
  reviewNotes,
  setReviewNotes,
  reviewRating,
  setReviewRating,
  reviewRecommend,
  setReviewRecommend,
  handleSubmitCandidateReview
}: PeerInterviewPanelProps) {
  
  return (
    <div className="space-y-6 text-left">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Candidate list for evaluation */}
        <div className="lg:col-span-2 p-5 bg-white dark:bg-slate-900 border border-slate-150/40 dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Assigned Interview Candidates</h4>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Submit feedback scorecards for applicants evaluated under your panel</p>
          </div>

          <div className="space-y-3">
            {interviewQueueCandidates.map((c, idx) => (
              <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-855 rounded-2xl border border-transparent hover:border-slate-200 dark:hover:border-slate-750 flex justify-between items-center">
                <div>
                  <strong className="block text-xs text-slate-900 dark:text-white font-black">{c.name}</strong>
                  <span className="text-[10.5px] text-slate-400">Position: {c.jobTitle}</span>
                </div>
                <button
                  onClick={() => {
                    setSelectedReviewApplicant(c);
                    setReviewNotes('');
                    setReviewRating(4);
                    setReviewRecommend('Select');
                  }}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer border-none"
                >
                  Submit Scorecard
                </button>
              </div>
            ))}

            {interviewQueueCandidates.length === 0 && (
              <div className="py-12 text-center text-slate-400 font-bold uppercase text-[9px] tracking-wider">No pending candidate evaluations assigned</div>
            )}
          </div>
        </div>

        {/* Scorecard review submission form details */}
        {selectedReviewApplicant && (
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-150/40 dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
            <div>
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Evaluation Scorecard Form</h4>
              <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Review candidate {selectedReviewApplicant.name}</p>
            </div>

            <div className="space-y-3.5 text-xs text-slate-700 dark:text-slate-200">
              <div>
                <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Candidate Rating (1-5)</label>
                <input 
                  type="number" 
                  min={1} 
                  max={5} 
                  step={0.1}
                  value={reviewRating}
                  onChange={e => setReviewRating(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-805 border border-transparent rounded-xl text-xs font-bold outline-none text-slate-900 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Recommendation Decision</label>
                <select 
                  value={reviewRecommend}
                  onChange={e => setReviewRecommend(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-805 border border-transparent rounded-xl text-xs font-bold outline-none text-slate-900 dark:text-white cursor-pointer"
                >
                  <option>Select</option>
                  <option>Hire</option>
                  <option>Reject</option>
                  <option>On Hold</option>
                </select>
              </div>

              <div>
                <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Peer Evaluation Comments</label>
                <textarea 
                  rows={3} 
                  placeholder="Provide detailed feedback on technical proficiency, culture fit..."
                  value={reviewNotes}
                  onChange={e => setReviewNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-805 border border-transparent rounded-xl text-xs font-bold outline-none text-slate-900 dark:text-white resize-none"
                />
              </div>

              <button 
                onClick={handleSubmitCandidateReview}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-md transition-all cursor-pointer border-none"
              >
                Submit Scorecard
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
