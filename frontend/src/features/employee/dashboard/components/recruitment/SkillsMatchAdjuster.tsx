"use client";

import React from 'react';

interface SkillsMatchAdjusterProps {
  skillsList: string[];
  newSkillInput: string;
  setNewSkillInput: (input: string) => void;
  handleAddSkill: () => void;
  handleRemoveSkill: (skill: string) => void;
}

export default function SkillsMatchAdjuster({
  skillsList,
  newSkillInput,
  setNewSkillInput,
  handleAddSkill,
  handleRemoveSkill
}: SkillsMatchAdjusterProps) {
  
  return (
    <div className="p-5 bg-white dark:bg-slate-900 border border-slate-150/40 dark:border-slate-800 rounded-3xl shadow-sm text-left space-y-6">
      <div>
        <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Manage Skills for AI Job Matching</h4>
        <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Customize your skills profile to trigger accurate promotional recommends</p>
      </div>

      <div className="space-y-4">
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="e.g. Next.js, Redux, Kubernetes..."
            value={newSkillInput}
            onChange={e => setNewSkillInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddSkill()}
            className="max-w-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-transparent rounded-xl text-xs font-bold outline-none text-slate-900 dark:text-white"
          />
          <button 
            onClick={handleAddSkill}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer border-none"
          >
            Add Skill
          </button>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          {skillsList.map((skill, idx) => (
            <div key={idx} className="px-3 py-1.5 bg-slate-50 dark:bg-slate-850 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-350 flex items-center gap-1.5">
              <span>{skill}</span>
              <button 
                onClick={() => handleRemoveSkill(skill)}
                className="text-slate-400 hover:text-rose-500 cursor-pointer bg-transparent border-none outline-none font-bold"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
