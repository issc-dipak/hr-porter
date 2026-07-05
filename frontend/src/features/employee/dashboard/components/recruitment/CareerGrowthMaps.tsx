"use client";

import React from 'react';
import { Award } from 'lucide-react';
import { cn } from "@/lib/utils";

interface CareerGrowthMapsProps {
  skillsList: string[];
}

export default function CareerGrowthMaps({ skillsList }: CareerGrowthMapsProps) {
  
  const growthPaths = [
    { 
      role: 'Staff Software Architect', 
      currentBand: 'L4', 
      targetBand: 'L6', 
      criteria: 'Lead 2 cross-department initiatives, master Kubernetes, Node performance optimization.', 
      matchingSkills: ['React', 'TypeScript'] 
    },
    { 
      role: 'Engineering Team Lead', 
      currentBand: 'L4', 
      targetBand: 'L5', 
      criteria: 'Mentor 3 juniors, organize sprint planning, master system design architectures.', 
      matchingSkills: ['UI/UX', 'Figma'] 
    }
  ];

  const steps = [
    { band: 'L3 - Software Engineer', status: 'Completed', date: '2023 - 2024' },
    { band: 'L4 - Senior Software Engineer', status: 'Current Role', date: 'Active' },
    { band: 'L5 - Tech Lead / Manager', status: 'Target Goal', date: 'Est. 2027' }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
        {/* Growth opportunities list */}
        <div className="lg:col-span-2 p-5 bg-white dark:bg-slate-900 border border-slate-150/40 dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Promotion & Transfer Paths</h4>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Explore promotional requirements and skill pathways for higher bands</p>
          </div>

          <div className="space-y-4">
            {growthPaths.map((g, idx) => (
              <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-transparent hover:border-slate-200 dark:hover:border-slate-750 space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <strong className="block text-sm font-black text-slate-900 dark:text-white">{g.role}</strong>
                    <span className="text-[10px] text-slate-400 mt-0.5">Promotion band change: {g.currentBand} → {g.targetBand}</span>
                  </div>
                  <span className="px-2 py-0.5 bg-blue-600 text-white text-[8px] font-black rounded-md">Growth Opportunity</span>
                </div>
                <p className="text-[11px] text-slate-550 leading-relaxed font-semibold">
                  <strong>Requirements:</strong> {g.criteria}
                </p>
                
                <div className="flex flex-wrap gap-1 items-center pt-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mr-2">Your matching skills:</span>
                  {g.matchingSkills.map((sk, i) => {
                    const isMatch = skillsList.some(s => s.toLowerCase() === sk.toLowerCase());
                    return (
                      <span 
                        key={i} 
                        className={cn(
                          "px-1.5 py-0.5 text-[9px] rounded-md font-bold",
                          isMatch ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300" : "bg-slate-100 text-slate-400 dark:bg-slate-800"
                        )}
                      >
                        {sk}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Roadmaps card details */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-150/40 dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Corporate bands roadmap</h4>
          
          <div className="relative border-l border-slate-150 dark:border-slate-800 pl-4 space-y-5">
            {steps.map((step, idx) => (
              <div key={idx} className="relative">
                <span className={cn(
                  "absolute -left-[21px] top-0 w-3 h-3 rounded-full border border-white",
                  step.status === 'Completed' ? 'bg-emerald-500' :
                  step.status === 'Current Role' ? 'bg-blue-600 animate-pulse' : 'bg-slate-300'
                )} />
                <div>
                  <strong className="block text-xs text-slate-900 dark:text-white font-black leading-snug">{step.band}</strong>
                  <span className="text-[10px] text-slate-400">{step.status} • {step.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
