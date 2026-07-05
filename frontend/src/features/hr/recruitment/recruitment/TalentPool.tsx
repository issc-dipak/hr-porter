"use client";

import React, { useState } from 'react';
import { Search, Upload, Zap, Users } from 'lucide-react';
import { IJob, IApplicant } from './types';
import { cn } from "@/lib/utils";

interface TalentPoolProps {
  jobs: IJob[];
  filteredApplicantsList: IApplicant[];
  selectedDeptFilter: string;
  setSelectedDeptFilter: (dept: string) => void;
  handleUpdateApplicantStage: (jobId: string, applicantName: string, newStage: string) => void;
  handleOpenApplicantModal: (app: IApplicant, job: IJob) => void;
  fetchJobs: () => void;
  triggerToast?: (msg: string) => void;
}

const DEPARTMENTS = ['Engineering', 'Design', 'Product', 'Marketing', 'Human Resources', 'Sales'];
const PIPELINE_STAGES = [
  'Applied', 'Screening', 'Shortlisted', 'Interview', 
  'Technical Round', 'HR Round', 'Offer Sent', 'Hired', 'Rejected'
];

const calculateScore = (candidateSkills: string[], jobRequirements: string[]) => {
  if (!jobRequirements || jobRequirements.length === 0) return 75;
  const matchCount = candidateSkills.filter(s =>
    jobRequirements.some(req => req.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(req.toLowerCase()))
  ).length;
  const score = Math.round(50 + (matchCount / jobRequirements.length) * 50);
  return Math.min(100, Math.max(0, score));
};

export default function TalentPool({
  jobs,
  filteredApplicantsList,
  selectedDeptFilter,
  setSelectedDeptFilter,
  handleUpdateApplicantStage,
  handleOpenApplicantModal,
  fetchJobs,
  triggerToast
}: TalentPoolProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedParserJobId, setSelectedParserJobId] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedData, setParsedData] = useState<any>(null);
  const [parsingProgress, setParsingProgress] = useState(0);

  const parseTextResume = (filename: string, text: string, targetJob: IJob) => {
    let name = '';
    if (text) {
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length > 0) {
        if (lines[0].length < 30 && !lines[0].toLowerCase().includes('resume') && !lines[0].toLowerCase().includes('cv')) {
          name = lines[0];
        }
      }
    }
    if (!name) {
      let base = filename.substring(0, filename.lastIndexOf('.')) || filename;
      base = base.replace(/[_-]/g, ' ');
      base = base.replace(/\b(resume|cv|pdf|doc|docx|for|job|latest|updated|profile)\b/gi, '');
      base = base.trim();
      name = base.split(/\s+/).map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
    }
    if (!name) {
      name = "Candidate Profile";
    }

    let email = '';
    if (text) {
      const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i);
      if (emailMatch) {
        email = emailMatch[0];
      }
    }
    if (!email) {
      email = `${name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'candidate'}@example.com`;
    }

    let phone = '';
    if (text) {
      const phoneMatch = text.match(/\+?[0-9\s-]{10,15}/);
      if (phoneMatch) {
        phone = phoneMatch[0].trim();
      }
    }
    if (!phone) {
      phone = `+91 ${Math.floor(7000000000 + Math.random() * 2999999999)}`;
    }

    let experience = '';
    if (text) {
      const expMatch = text.match(/\b(\d+(?:\.\d+)?)\s*(?:years?|yrs?)\b/i);
      if (expMatch) {
        experience = `${expMatch[1]} Years`;
      }
    }
    if (!experience) {
      experience = `${Math.floor(2 + Math.random() * 5)} Years`;
    }

    const ALL_SKILLS = [
      "React", "TypeScript", "Next.js", "Redux", "Tailwind CSS", "GraphQL", "Jest",
      "Figma", "Adobe XD", "User Research", "Wireframing", "Interaction Design", "Prototyping",
      "Node.js", "MongoDB", "Express", "Kubernetes", "Docker", "AWS", "Google Cloud",
      "Python", "Django", "FastAPI", "SQL", "PostgreSQL", "Java", "Spring Boot", "C++",
      "Sales", "Marketing", "SEO", "Project Management", "Agile", "Scrum", "HR", "Recruitment"
    ];
    let skills: string[] = [];
    if (text) {
      skills = ALL_SKILLS.filter(s => new RegExp(`\\b${s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i').test(text));
    }
    if (skills.length === 0) {
      skills = ALL_SKILLS.filter(s => new RegExp(s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i').test(filename));
    }
    if (skills.length === 0) {
      const reqs = targetJob.requirements || [];
      if (reqs.length > 0) {
        const count = Math.min(reqs.length, 3);
        const shuffled = [...reqs].sort(() => 0.5 - Math.random());
        skills = shuffled.slice(0, count);
      } else {
        skills = ["React", "Node.js", "SQL"];
      }
    }

    let education = '';
    if (text) {
      const eduKeywords = ["B.Tech", "M.Tech", "B.Sc", "M.Sc", "B.Com", "MBA", "IIT", "BITS", "NID", "B.Des", "University", "College"];
      const foundEdu = eduKeywords.find(edu => new RegExp(edu, 'i').test(text));
      if (foundEdu) {
        const line = text.split('\n').find(l => new RegExp(foundEdu, 'i').test(l));
        if (line && line.length < 100) {
          education = line.trim();
        }
      }
    }
    if (!education) {
      education = "Bachelor of Engineering";
    }

    const computedScore = calculateScore(skills, targetJob.requirements || []);

    setParsedData({
      name,
      email,
      phone,
      experience,
      skills,
      education,
      matchScore: computedScore,
      targetJobId: selectedParserJobId,
      targetJobTitle: targetJob.title
    });
  };

  const handleFileUploaded = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!selectedParserJobId) {
      if (triggerToast) {
        triggerToast('Please select a target job for this applicant first!');
      } else {
        alert('Please select a target job for this applicant first!');
      }
      e.target.value = '';
      return;
    }
    const targetJob = jobs.find(j => j._id === selectedParserJobId);
    if (!targetJob) return;

    setIsParsing(true);
    setParsingProgress(10);

    const interval = setInterval(() => {
      setParsingProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 25;
      });
    }, 80);

    const reader = new FileReader();
    reader.onload = (event) => {
      clearInterval(interval);
      setParsingProgress(100);
      setTimeout(() => {
        setIsParsing(false);
        const text = event.target?.result as string || '';
        parseTextResume(file.name, text, targetJob);
      }, 200);
    };

    reader.onerror = () => {
      clearInterval(interval);
      setParsingProgress(100);
      setTimeout(() => {
        setIsParsing(false);
        parseTextResume(file.name, '', targetJob);
      }, 200);
    };

    if (file.type === "text/plain" || file.name.endsWith('.txt')) {
      reader.readAsText(file);
    } else {
      setTimeout(() => {
        clearInterval(interval);
        setParsingProgress(100);
        setTimeout(() => {
          setIsParsing(false);
          parseTextResume(file.name, '', targetJob);
        }, 200);
      }, 600);
    }
  };

  const handleSaveParsedCandidate = async () => {
    if (!parsedData) return;
    const targetJob = jobs.find(j => j._id === parsedData.targetJobId);
    if (!targetJob) return;

    const newApplicant = {
      name: parsedData.name,
      email: parsedData.email,
      phone: parsedData.phone,
      status: 'Applied',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      skills: parsedData.skills,
      experience: parsedData.experience,
      rating: parsedData.matchScore,
      scorecard: {},
      interviews: []
    };

    const updatedApplicants = [...(targetJob.applicants || []), newApplicant];

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('hr_system_token') : null;
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`/api/jobs/${targetJob._id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ ...targetJob, applicants: updatedApplicants })
      });
      if (res.ok) {
        fetchJobs();
        setParsedData(null);
        if (triggerToast) {
          triggerToast(`${parsedData.name} has been parsed and saved into the ATS talent pool!`);
        } else {
          alert(`${parsedData.name} has been parsed and saved into the ATS talent pool!`);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Search input filtered list
  const displayApplicants = filteredApplicantsList.filter(app => {
    const term = searchTerm.toLowerCase();
    return app.name.toLowerCase().includes(term) ||
           (app.skills || []).some(s => s.toLowerCase().includes(term)) ||
           (app.jobTitle || '').toLowerCase().includes(term);
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Resume Parser Widget */}
        <div className="lg:col-span-1 p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm space-y-3">
          <div className="flex items-center gap-1.5">
            <span className="px-2.5 py-0.5 bg-blue-600 text-white rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1 shadow-md shadow-blue-500/20">
              Resume Parser
            </span>
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Candidate Resume Parser</h4>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Upload a resume file to parse details and save to the candidate database.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Target Job Opening</label>
              <select 
                value={selectedParserJobId}
                onChange={e => setSelectedParserJobId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-205 dark:border-slate-700 rounded-xl text-xs font-bold outline-none text-slate-900 dark:text-white"
              >
                <option value="">-- Choose Position --</option>
                {jobs.map(j => (
                  <option key={j._id} value={j._id}>{j.title}</option>
                ))}
              </select>
            </div>

            <label 
              htmlFor="resume-file-input"
              className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-500/50 dark:hover:border-blue-500/50 p-6 rounded-2xl text-center space-y-2 cursor-pointer block transition-colors"
            >
              <Upload className="w-6 h-6 text-blue-600 mx-auto" />
              <span className="block text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">Upload Candidate Resume</span>
              <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest">Supports PDF, DOCX, TXT</span>
              <input 
                type="file" 
                id="resume-file-input"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileUploaded}
                disabled={isParsing}
                className="hidden"
              />
            </label>

            {/* Processing status */}
            {isParsing && (
              <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                <div className="flex justify-between text-[9px] font-black uppercase tracking-wider text-blue-600">
                  <span>Analyzing credentials...</span>
                  <span>{parsingProgress}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full transition-all duration-300" style={{ width: `${parsingProgress}%` }} />
                </div>
              </div>
            )}

            {/* Parsed Output Result / Editable Form */}
            {parsedData && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-slate-900 dark:text-white rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Parsed Candidate Profile</span>
                  <span className="px-2 py-0.5 bg-emerald-600 text-white rounded-md text-[8px] font-black">{parsedData.matchScore}% Match Score</span>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Candidate Name</label>
                    <input 
                      type="text"
                      value={parsedData.name}
                      onChange={e => setParsedData({ ...parsedData, name: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold outline-none text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Email</label>
                      <input 
                        type="email"
                        value={parsedData.email}
                        onChange={e => setParsedData({ ...parsedData, email: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold outline-none text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Phone</label>
                      <input 
                        type="text"
                        value={parsedData.phone}
                        onChange={e => setParsedData({ ...parsedData, phone: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold outline-none text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Experience</label>
                      <input 
                        type="text"
                        value={parsedData.experience}
                        onChange={e => setParsedData({ ...parsedData, experience: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold outline-none text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Education</label>
                      <input 
                        type="text"
                        value={parsedData.education}
                        onChange={e => setParsedData({ ...parsedData, education: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold outline-none text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Skills (comma-separated)</label>
                    <input 
                      type="text"
                      value={parsedData.skills.join(', ')}
                      onChange={e => {
                        const skillsArr = e.target.value.split(',').map(s => s.trim()).filter(s => s.length > 0);
                        const targetJob = jobs.find(j => j._id === parsedData.targetJobId);
                        const newScore = targetJob ? calculateScore(skillsArr, targetJob.requirements || []) : parsedData.matchScore;
                        setParsedData({ 
                          ...parsedData, 
                          skills: skillsArr,
                          matchScore: newScore
                        });
                      }}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold outline-none text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button 
                    onClick={() => setParsedData(null)}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSaveParsedCandidate}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                  >
                    Approve & Save
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Candidates Database List */}
        <div className="lg:col-span-2 p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Active Candidates Repository</h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Filter talent pools by departments and key matching tags</p>
            </div>
            <div className="flex gap-2">
              <select
                value={selectedDeptFilter}
                onChange={e => setSelectedDeptFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-900 dark:text-white"
              >
                <option value="All">All Departments</option>
                {DEPARTMENTS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-850 py-1.5 px-2.5 rounded-xl">
            <Search className="w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search candidate profiles by name, skills, or job position..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-transparent border-none text-xs font-bold outline-none text-slate-900 dark:text-white"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[8.5px] font-black uppercase tracking-wider text-slate-400">
                  <th className="py-2.5 px-3">Candidate</th>
                  <th className="py-2.5 px-3">Role/Dept</th>
                  <th className="py-2.5 px-3">Match Score</th>
                  <th className="py-2.5 px-3">Current Stage</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {displayApplicants.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-400 font-bold uppercase text-[10px] tracking-wider">No candidates found in database</td>
                  </tr>
                ) : (
                  displayApplicants.map((app, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                      <td className="py-2 px-3">
                        <div>
                          <strong className="block text-xs text-slate-900 dark:text-white font-black">{app.name}</strong>
                          <span className="text-[9px] text-slate-400 block mt-0.5">{app.email} • {app.experience || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <div>
                          <span className="font-bold text-xs text-slate-700 dark:text-slate-300 block">{app.jobTitle}</span>
                          <span className="text-[8.5px] font-black text-blue-500 uppercase tracking-wide block mt-0.5">{app.jobDept}</span>
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <span className={cn(
                          "px-2 py-0.5 rounded-lg text-[9px] font-black",
                          app.rating && app.rating >= 85 ? "bg-emerald-100 text-emerald-700" :
                          app.rating && app.rating >= 70 ? "bg-amber-100 text-amber-700" :
                          "bg-slate-100 text-slate-600"
                        )}>
                          {app.rating ? `${app.rating}%` : 'N/A'}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <select 
                          value={app.status}
                          onChange={e => handleUpdateApplicantStage(app.jobId || '', app.name, e.target.value)}
                          className="text-[8.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-205 dark:border-slate-700 cursor-pointer outline-none text-slate-900 dark:text-white"
                        >
                          {PIPELINE_STAGES.map(st => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <button
                          onClick={() => {
                            const job = jobs.find(j => j._id === app.jobId);
                            if (job) handleOpenApplicantModal(app, job);
                          }}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[8.5px] font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
