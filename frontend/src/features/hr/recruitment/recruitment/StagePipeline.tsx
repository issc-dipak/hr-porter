"use client";

import React, { useState } from 'react';
import { IJob, IApplicant } from './types';
import { cn } from "@/lib/utils";

interface StagePipelineProps {
  jobs: IJob[];
  allApplicantsList: IApplicant[];
  handleUpdateApplicantStage: (jobId: string, applicantName: string, newStage: string) => void;
  handleOpenApplicantModal: (app: IApplicant, job: IJob) => void;
}

const PIPELINE_STAGES = [
  'Applied',
  'Screening',
  'Shortlisted',
  'Interview',
  'Technical Round',
  'HR Round',
  'Offer Sent',
  'Hired'
];

export default function StagePipeline({
  jobs,
  allApplicantsList,
  handleUpdateApplicantStage,
  handleOpenApplicantModal
}: StagePipelineProps) {
  const [selectedJobFilter, setSelectedJobFilter] = useState('All');

  const handleDragStart = (e: React.DragEvent, app: IApplicant) => {
    e.dataTransfer.setData("text/plain", JSON.stringify({ jobId: app.jobId, name: app.name }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    try {
      const dataStr = e.dataTransfer.getData("text/plain");
      if (!dataStr) return;
      const { jobId, name } = JSON.parse(dataStr);
      if (jobId && name) {
        handleUpdateApplicantStage(jobId, name, targetStage);
      }
    } catch (err) {
      console.error("Failed to process Kanban drop:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm text-left">
        <div>
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Active Hiring Pipeline Grid</h4>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Drag-and-drop workflow tracking candidates from application to contract</p>
        </div>
        <select
          value={selectedJobFilter}
          onChange={e => setSelectedJobFilter(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-205 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-900 dark:text-white cursor-pointer"
        >
          <option value="All">All Jobs Pipeline</option>
          {jobs.map(j => (
            <option key={j._id} value={j.title}>{j.title}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x no-scrollbar">
        {PIPELINE_STAGES.map(stage => {
          const stageApplicants = allApplicantsList.filter(app => {
            const matchStage = app.status === stage;
            const matchJob = selectedJobFilter === 'All' || app.jobTitle === selectedJobFilter;
            return matchStage && matchJob;
          });

          return (
            <div 
              key={stage} 
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage)}
              className="w-72 shrink-0 bg-slate-50/50 dark:bg-slate-900/50 rounded-3xl p-4.5 border border-slate-100 dark:border-slate-850 flex flex-col max-h-[600px] snap-center"
            >
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  {stage}
                </h5>
                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-md text-[9px] font-black">{stageApplicants.length}</span>
              </div>

              <div className="space-y-3 overflow-y-auto no-scrollbar flex-1 min-h-[150px]">
                {stageApplicants.length === 0 ? (
                  <div className="h-full flex items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center text-slate-350 text-[10px] font-semibold uppercase">Drop candidate here</div>
                ) : (
                  stageApplicants.map((app, idx) => (
                    <div 
                      key={idx} 
                      draggable
                      onDragStart={(e) => handleDragStart(e, app)}
                      onClick={() => {
                        const job = jobs.find(j => j._id === app.jobId);
                        if (job) handleOpenApplicantModal(app, job);
                      }}
                      className="p-3.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm hover:border-blue-500/40 cursor-grab active:cursor-grabbing space-y-3 group text-left"
                    >
                      <div>
                        <h6 className="font-black text-slate-900 dark:text-white group-hover:text-blue-600 text-xs transition-colors">{app.name}</h6>
                        <p className="text-[9px] text-slate-400 mt-0.5 font-bold uppercase tracking-wider">{app.jobTitle}</p>
                      </div>
                      
                      {app.rating && (
                        <div className="flex justify-between items-center text-[9px] font-bold text-slate-500">
                          <span>Match score</span>
                          <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-md">{app.rating}%</span>
                        </div>
                      )}

                      {/* Quick promote actions */}
                      <div className="pt-2 border-t border-slate-50 dark:border-slate-850 flex justify-between items-center gap-1" onClick={e => e.stopPropagation()}>
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Promote Stage</span>
                        <div className="flex gap-1">
                          <select 
                            value={app.status}
                            onChange={e => handleUpdateApplicantStage(app.jobId || '', app.name, e.target.value)}
                            className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer text-slate-900 dark:text-white"
                          >
                            {PIPELINE_STAGES.map(st => (
                              <option key={st} value={st}>{st}</option>
                            ))}
                            <option value="Rejected">Rejected</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
