"use client";

import React, { useState, useRef } from 'react';
import { 
  User, Globe, Heart, Briefcase, Layout, Clock, Calendar, Target, 
  FileText, Shield, Bell, Palette, Languages, Lock, Laptop, 
  RefreshCcw, Download, HelpCircle, Info, Upload, Plus, Trash2,
  AlertTriangle, Sparkles, Check, CheckCircle, ShieldAlert
} from 'lucide-react';
import { cn } from "@/lib/utils";

interface HRTabsProps {
  activeCategory: string;
  profileDetails: any;
  setProfileDetails: React.Dispatch<React.SetStateAction<any>>;
  employeeBio: string;
  setEmployeeBio: (val: string) => void;
  skillsList: string[];
  setSkillsList: React.Dispatch<React.SetStateAction<string[]>>;
  newSkillInput: string;
  setNewSkillInput: (val: string) => void;
  currentPassword: string;
  setCurrentPassword: (val: string) => void;
  newPassword: string;
  setNewPassword: (val: string) => void;
  confirmPassword: string;
  setConfirmPassword: (val: string) => void;
  changingPassword: boolean;
  handleChangePassword: (e: React.FormEvent) => void;
  employeePrivacy: {
    showBirthday: boolean;
    showPhoneNumber: boolean;
    showEmail: boolean;
    showProfilePicture: boolean;
    showSkills: boolean;
    showWorkAnniversary: boolean;
  };
  setEmployeePrivacy: React.Dispatch<React.SetStateAction<any>>;
  employeeNotifs: {
    taskReminders: boolean;
    payrollAlerts: boolean;
    attendanceAlerts: boolean;
  };
  setEmployeeNotifs: React.Dispatch<React.SetStateAction<any>>;
  themeMode: string;
  setThemeMode: (val: string) => void;
  fontSize: string;
  setFontSize: (val: string) => void;
  compactLayout: boolean;
  setCompactLayout: (val: boolean) => void;
  triggerToast: (msg: string) => void;
  chatDisplayName: string;
  setChatDisplayName: (val: string) => void;
  chatStatusText: string;
  setChatStatusText: (val: string) => void;
  chatStatusEmoji: string;
  setChatStatusEmoji: (val: string) => void;
  chatPresence: string;
  setChatPresence: (val: string) => void;
  chatMuteSound: boolean;
  setChatMuteSound: (val: boolean) => void;
  chatNotifLevel: string;
  setChatNotifLevel: (val: string) => void;
  chatDndActive: boolean;
  setChatDndActive: (val: boolean) => void;
  sessionsList: any[];
  setSessionsList: React.Dispatch<React.SetStateAction<any[]>>;
  chatConfig: {
    workspaceName: string;
    workspaceLogo: string;
    allowEmployeeChannelCreate: boolean;
    allowEmployeeChannelPrivateCreate: boolean;
    allowAnnouncementsPostAll: boolean;
    allowEmployeeEditDelete: boolean;
    restrictedKeywords: string;
  };
  setChatConfig: React.Dispatch<React.SetStateAction<any>>;
  availability?: any;
  setAvailability?: any;
  departmentsList?: string[];
  branchesList?: string[];
  onPhotoUploaded?: (url: string) => void;
}

export function HRTabs({
  activeCategory,
  profileDetails,
  setProfileDetails,
  employeeBio,
  setEmployeeBio,
  skillsList,
  setSkillsList,
  newSkillInput,
  setNewSkillInput,
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  changingPassword,
  handleChangePassword,
  employeePrivacy,
  setEmployeePrivacy,
  employeeNotifs,
  setEmployeeNotifs,
  themeMode,
  setThemeMode,
  fontSize,
  setFontSize,
  compactLayout,
  setCompactLayout,
  triggerToast,
  chatDisplayName,
  setChatDisplayName,
  chatStatusText,
  setChatStatusText,
  chatStatusEmoji,
  setChatStatusEmoji,
  chatPresence,
  setChatPresence,
  chatMuteSound,
  setChatMuteSound,
  chatNotifLevel,
  setChatNotifLevel,
  chatDndActive,
  setChatDndActive,
  sessionsList,
  setSessionsList,
  chatConfig,
  setChatConfig,
  availability,
  setAvailability,
  departmentsList = [],
  branchesList = [],
  onPhotoUploaded
}: HRTabsProps) {

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      triggerToast("Uploading profile image...");
      const token = localStorage.getItem('hr_system_token');
      if (!token) return;

      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to upload image');
      }

      const data = await res.json();
      if (data.url && onPhotoUploaded) {
        onPhotoUploaded(data.url);
        triggerToast("Profile picture uploaded successfully.");
      }
    } catch (err: any) {
      console.error(err);
      triggerToast(err.message || "Error uploading profile image.");
    }
  };

  // Local state for profile inputs edit
  const [newExperience, setNewExperience] = useState('');
  const [newCert, setNewCert] = useState('');
  const [newSocial, setNewSocial] = useState('');
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

  // HR Preferences State (Mapped to backend settings)
  const hrDept = availability?.timezone || 'All Departments';
  const setHrDept = (val: string) => {
    setAvailability((prev: any) => ({ ...prev, timezone: val }));
  };

  const hrBranch = availability?.startHour || 'All Branches';
  const setHrBranch = (val: string) => {
    setAvailability((prev: any) => ({ ...prev, startHour: val }));
  };

  const hrWidgets = (availability?.endHour || 'pending_leaves,active_jobs,today_present').split(',');
  const setHrWidgets = (val: string[]) => {
    setAvailability((prev: any) => ({ ...prev, endHour: val.join(',') }));
  };

  // Attendance Preferences (Mapped to employeeNotifs.attendanceAlerts)
  const lateArrivalAlerts = employeeNotifs.attendanceAlerts;
  const setLateArrivalAlerts = (val: boolean) => {
    setEmployeeNotifs((prev: any) => ({ ...prev, attendanceAlerts: val }));
  };
  const missingClockInAlerts = employeeNotifs.attendanceAlerts;
  const setMissingClockInAlerts = (val: boolean) => {
    setEmployeeNotifs((prev: any) => ({ ...prev, attendanceAlerts: val }));
  };

  // Leave Preferences (Mapped to employeeNotifs.payrollAlerts)
  const leaveConflictAlerts = employeeNotifs.payrollAlerts;
  const setLeaveConflictAlerts = (val: boolean) => {
    setEmployeeNotifs((prev: any) => ({ ...prev, payrollAlerts: val }));
  };

  // Recruitment Preferences (Mapped to availability.googleCalendarSynced)
  const resumePreviewMode = 'Side-by-Side';
  const setResumePreviewMode = (val: string) => {
    triggerToast(`Resume preview mode set to ${val}`);
  };

  // Project Preferences (Mapped to employeeNotifs.taskReminders)
  const projectNotifs = employeeNotifs.taskReminders;
  const setProjectNotifs = (val: boolean) => {
    setEmployeeNotifs((prev: any) => ({ ...prev, taskReminders: val }));
  };

  // Support Ticket Form State
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketDesc, setTicketDesc] = useState('');
  const [submittingTicket, setSubmittingTicket] = useState(false);

  // Ticket creation handler
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketDesc.trim()) {
      triggerToast("Please fill all ticket fields.");
      return;
    }
    try {
      setSubmittingTicket(true);
      const token = localStorage.getItem('hr_system_token');
      if (!token) return;

      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subject: ticketSubject.trim(),
          category: 'HR Support',
          priority: 'Medium',
          description: ticketDesc.trim(),
          department: 'HR'
        })
      });
      if (res.ok) {
        triggerToast("Support ticket raised successfully.");
        setTicketSubject('');
        setTicketDesc('');
      } else {
        const data = await res.json();
        triggerToast(data.error || "Failed to submit ticket.");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Error submitting ticket.");
    } finally {
      setSubmittingTicket(false);
    }
  };

  // Support Update Ticket Handler
  const handleRequestUpdate = async (type: string) => {
    try {
      const token = localStorage.getItem('hr_system_token');
      if (!token) return;

      let description = '';
      if (type === 'Personal Information') {
        description = `HR has requested to update their Personal Information.
Proposed values:
- Full Name: ${profileDetails.fullName || 'N/A'}
- Date of Birth: ${profileDetails.dateOfBirth || 'N/A'}
- Gender: ${profileDetails.gender || 'N/A'}
- Blood Group: ${profileDetails.bloodGroup || 'N/A'}
- Marital Status: ${profileDetails.maritalStatus || 'N/A'}
- Nationality: ${profileDetails.nationality || 'N/A'}`;
      } else {
        description = `HR has requested to update their Bank & Tax details.
Proposed values:
- Bank Name: ${profileDetails.bankDetails?.bankName || 'N/A'}
- Account Number: ${profileDetails.bankDetails?.accountNumber || 'N/A'}
- IFSC Code: ${profileDetails.bankDetails?.ifscCode || 'N/A'}
- PAN Number: ${profileDetails.panNumber || 'N/A'}
- Aadhaar Number: ${profileDetails.aadhaarNumber || 'N/A'}
- PF Number: ${profileDetails.pfNumber || 'N/A'}`;
      }

      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subject: `Profile Update Request: ${type} - ${profileDetails.fullName}`,
          category: 'HR Support',
          priority: 'High',
          description,
          department: 'HR'
        })
      });
      if (res.ok) {
        triggerToast(`Update request for ${type} raised successfully with Admin.`);
      } else {
        const errData = await res.json().catch(() => ({}));
        triggerToast(errData.error || "Failed to raise update request.");
      }
    } catch (err: any) {
      console.error(err);
      triggerToast(err.message || "Error raising update request.");
    }
  };

  // Profile completion indicator calculator
  const calculateCompletion = () => {
    let score = 0;
    if (profileDetails.fullName) score += 15;
    if (profileDetails.email) score += 15;
    if (profileDetails.phone) score += 15;
    if (employeeBio) score += 15;
    if (skillsList.length > 0) score += 15;
    if (profileDetails.profilePicture) score += 15;
    if (profileDetails.emergencyContact) score += 10;
    return Math.min(100, score);
  };

  return (
    <div className="space-y-6">

      {/* 1. MY PROFILE */}
      {activeCategory === 'hr-profile' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">My Profile</h3>
              <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase">Manage picture, display credentials, bio summaries, and skills tags</p>
            </div>
            {/* Completion Indicator Widget */}
            <div className="flex items-center gap-2 p-2 bg-blue-500/5 border border-blue-500/10 rounded-xl">
              <Sparkles className="w-4 h-4 text-blue-500" />
              <div className="text-right">
                <span className="text-[8px] font-black uppercase text-slate-400 block">Profile Completion</span>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{calculateCompletion()}% completed</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
            <div className="lg:col-span-2 space-y-5">
              <div className="p-5 bg-slate-50 dark:bg-slate-955 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-4">
                <div className="flex items-center gap-4">
                  <img 
                    src={profileDetails.profilePicture || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"}
                    alt="Profile" 
                    className="w-14 h-14 rounded-full object-cover border-2 border-slate-200 dark:border-slate-800"
                  />
                  <div className="space-y-1">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Display Avatar</span>
                    <button 
                      type="button" 
                      onClick={() => fileInputRef.current?.click()} 
                      className="px-2.5 py-1 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-lg text-[8px] font-black uppercase cursor-pointer"
                    >
                      Change Photo
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleImageUpload} 
                      accept="image/*" 
                      className="hidden" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Display Name</label>
                    <input 
                      type="text" 
                      value={profileDetails.fullName || ''}
                      onChange={e => setProfileDetails({ ...profileDetails, fullName: e.target.value })}
                      className="saas-input w-full px-3 py-2 text-xs" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Bio Summary</label>
                    <textarea 
                      rows={2}
                      value={employeeBio}
                      onChange={e => setEmployeeBio(e.target.value)}
                      className="saas-input w-full px-3 py-2 text-xs" 
                    />
                  </div>
                </div>
              </div>

              {/* Skills Tags Vault */}
              <div className="p-5 bg-slate-50 dark:bg-slate-955 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-4">
                <span className="text-[9px] font-black uppercase text-slate-900 dark:text-white tracking-widest block">Skills Matrix</span>
                <div className="flex flex-wrap gap-1.5">
                  {skillsList.map((skill, idx) => (
                    <span key={idx} className="px-2.5 py-1 bg-slate-200 dark:bg-slate-900 text-slate-800 dark:text-slate-300 rounded-lg text-[8.5px] font-black uppercase tracking-wider flex items-center gap-1">
                      {skill}
                      <button type="button" onClick={() => setSkillsList(skillsList.filter(s => s !== skill))} className="hover:text-red-500 font-bold border-none bg-transparent cursor-pointer">×</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Add corporate skill..." 
                    value={newSkillInput}
                    onChange={e => setNewSkillInput(e.target.value)}
                    className="saas-input w-full px-3 py-1.5 text-xs placeholder:text-[10px] placeholder:font-semibold placeholder:text-slate-450/40 min-h-[36px]" 
                  />
                  <button type="button" onClick={() => {
                    if (newSkillInput.trim()) {
                      setSkillsList([...skillsList, newSkillInput.trim()]);
                      setNewSkillInput('');
                    }
                  }} className="px-3 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl text-[9px] font-black uppercase">Add</button>
                </div>
              </div>
            </div>

            {/* Experience and Certifications Card */}
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-955 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-3">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Experience Profile</span>
                <input 
                  type="text" 
                  placeholder="e.g. 5+ Years Lead recruiter" 
                  value={newExperience}
                  onChange={e => setNewExperience(e.target.value)}
                  className="saas-input w-full px-3 py-2 text-xs placeholder:text-[10px] placeholder:font-semibold placeholder:text-slate-450/40" 
                />
                <button type="button" onClick={() => {
                  if (newExperience.trim()) {
                    triggerToast(`Experience added: ${newExperience}`);
                    setNewExperience('');
                  }
                }} className="w-full py-1.5 bg-slate-900 text-white rounded-lg text-[8px] font-black uppercase">Update Experience</button>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-955 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-3">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Certifications Vault</span>
                <input 
                  type="text" 
                  placeholder="e.g. SHRM Certified Professional" 
                  value={newCert}
                  onChange={e => setNewCert(e.target.value)}
                  className="saas-input w-full px-3 py-2 text-xs placeholder:text-[10px] placeholder:font-semibold placeholder:text-slate-450/40" 
                />
                <button type="button" onClick={() => {
                  if (newCert.trim()) {
                    triggerToast(`Certification registered: ${newCert}`);
                    setNewCert('');
                  }
                }} className="w-full py-1.5 bg-slate-900 text-white rounded-lg text-[8px] font-black uppercase">Add Certification</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. PERSONAL INFORMATION */}
      {activeCategory === 'hr-personal' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Personal Information</h3>
            <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase">Legal identification details, marital status and nationality info</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className="space-y-1">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Full Name</label>
              <input 
                type="text" 
                value={profileDetails.fullName || ''}
                onChange={e => setProfileDetails({ ...profileDetails, fullName: e.target.value })}
                className="saas-input w-full px-3 py-2 text-xs" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Date of Birth</label>
              <input 
                type="date" 
                value={profileDetails.dateOfBirth || ''}
                onChange={e => setProfileDetails({ ...profileDetails, dateOfBirth: e.target.value })}
                className="saas-input w-full px-3 py-2 text-xs" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Gender</label>
              <select 
                value={profileDetails.gender || 'Male'}
                onChange={e => setProfileDetails({ ...profileDetails, gender: e.target.value })}
                className="saas-input w-full px-3 py-2 text-xs font-semibold"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Blood Group</label>
              <input 
                type="text" 
                value={profileDetails.bloodGroup || ''}
                onChange={e => setProfileDetails({ ...profileDetails, bloodGroup: e.target.value })}
                className="saas-input w-full px-3 py-2 text-xs" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Marital Status</label>
              <select 
                value={profileDetails.maritalStatus || 'Single'}
                onChange={e => setProfileDetails({ ...profileDetails, maritalStatus: e.target.value })}
                className="saas-input w-full px-3 py-2 text-xs font-semibold"
              >
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Divorced">Divorced</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Nationality</label>
              <input 
                type="text" 
                value={profileDetails.nationality || ''}
                onChange={e => setProfileDetails({ ...profileDetails, nationality: e.target.value })}
                className="saas-input w-full px-3 py-2 text-xs" 
              />
            </div>

            <div className="col-span-1 md:col-span-2 p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex justify-between items-center text-[10px] mt-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span className="font-black text-slate-800 dark:text-white uppercase">Verification Lock Active</span>
              </div>
              <button 
                type="button" 
                onClick={() => handleRequestUpdate('Personal Information')}
                className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-[8px] font-black uppercase cursor-pointer"
              >
                Request Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. CONTACT INFORMATION */}
      {activeCategory === 'hr-contact' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Contact Information</h3>
            <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase">Personal email, mobile number, state, city, and local addresses</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className="space-y-1">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Personal Email</label>
              <input 
                type="email" 
                value={profileDetails.email || ''}
                onChange={e => setProfileDetails({ ...profileDetails, email: e.target.value })}
                className="saas-input w-full px-3 py-2 text-xs" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Phone Number</label>
              <input 
                type="text" 
                value={profileDetails.phone || ''}
                onChange={e => setProfileDetails({ ...profileDetails, phone: e.target.value })}
                className="saas-input w-full px-3 py-2 text-xs" 
              />
            </div>
            <div className="col-span-1 md:col-span-2 space-y-1">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Current Address</label>
              <input 
                type="text" 
                value={profileDetails.address || ''}
                onChange={e => setProfileDetails({ ...profileDetails, address: e.target.value })}
                className="saas-input w-full px-3 py-2 text-xs" 
              />
            </div>             <div className="space-y-1">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">City</label>
              <input 
                type="text" 
                placeholder="e.g. Mumbai" 
                value={profileDetails.city || ''}
                onChange={e => setProfileDetails({ ...profileDetails, city: e.target.value })}
                className="saas-input w-full px-3 py-2 text-xs placeholder:text-[10px] placeholder:font-semibold placeholder:text-slate-450/40" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">State</label>
              <input 
                type="text" 
                placeholder="e.g. Maharashtra" 
                value={profileDetails.state || ''}
                onChange={e => setProfileDetails({ ...profileDetails, state: e.target.value })}
                className="saas-input w-full px-3 py-2 text-xs placeholder:text-[10px] placeholder:font-semibold placeholder:text-slate-450/40" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Country</label>
              <input 
                type="text" 
                placeholder="e.g. India" 
                value={profileDetails.country || ''}
                onChange={e => setProfileDetails({ ...profileDetails, country: e.target.value })}
                className="saas-input w-full px-3 py-2 text-xs placeholder:text-[10px] placeholder:font-semibold placeholder:text-slate-450/40" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">PIN Code</label>
              <input 
                type="text" 
                placeholder="e.g. 400001" 
                value={profileDetails.pinCode || ''}
                onChange={e => setProfileDetails({ ...profileDetails, pinCode: e.target.value })}
                className="saas-input w-full px-3 py-2 text-xs placeholder:text-[10px] placeholder:font-semibold placeholder:text-slate-450/40"
              />
            </div>
          </div>
        </div>
      )}

      {/* 4. EMERGENCY CONTACTS */}
      {activeCategory === 'hr-emergency' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Emergency Contacts</h3>
            <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase">Primary and secondary emergency contact credentials</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-3">
              <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block">Primary Contact</span>
              <div className="space-y-2">
                <input 
                  type="text" 
                  placeholder="Contact Name" 
                  value={profileDetails.emergencyContact || ''} 
                  onChange={e => setProfileDetails({ ...profileDetails, emergencyContact: e.target.value })}
                  className="saas-input w-full px-3 py-2 text-xs" 
                />
                <input type="text" placeholder="Relationship (e.g. Spouse)" className="saas-input w-full px-3 py-2 text-xs" />
                <input type="text" placeholder="Phone Number" className="saas-input w-full px-3 py-2 text-xs" />
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-3">
              <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block">Secondary Contact</span>
              <div className="space-y-2">
                <input type="text" placeholder="Contact Name" className="saas-input w-full px-3 py-2 text-xs" />
                <input type="text" placeholder="Relationship" className="saas-input w-full px-3 py-2 text-xs" />
                <input type="text" placeholder="Phone Number" className="saas-input w-full px-3 py-2 text-xs" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. WORK INFORMATION */}
      {activeCategory === 'hr-work' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Work Information</h3>
            <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase">Corporate parameters, department designation and shift assignments (Read Only)</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            {[
              { label: "Employee ID", value: profileDetails.employeeId || 'EMP-HR001' },
              { label: "HR Coordinator ID", value: "HR-LEAD-99" },
              { label: "Department", value: profileDetails.department || 'HR & Admin Management' },
              { label: "Designation", value: profileDetails.designation || 'HR Operations Manager' },
              { label: "Reporting Director", value: "Rajesh Patil (VP HR)" },
              { label: "Branch Location", value: profileDetails.location || "Mumbai Head Office" },
              { label: "Joining Date", value: "2024-03-12" },
              { label: "Shift Timing", value: "General HR Shift (09:30 AM - 06:30 PM)" },
              { label: "Employment Type", value: "Permanent Corporate Full-time" }
            ].map((field, i) => (
              <div key={i} className="p-3 bg-slate-50 dark:bg-slate-955 border border-slate-100 dark:border-slate-800 rounded-xl">
                <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest block">{field.label}</span>
                <span className="text-xs font-bold text-slate-800 dark:text-white mt-1 block uppercase">{field.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. HR PREFERENCES */}
      {activeCategory === 'hr-preferences' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">HR Workspace Preferences</h3>
            <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase">Customize defaults for your recruitment dashboards and candidate pipeline metrics</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-3">
              <span className="text-[9px] font-black uppercase text-slate-900 dark:text-white block">Default Dashboard Widgets</span>
              <div className="space-y-2">
                {['pending_leaves', 'active_jobs', 'today_present', 'open_tickets'].map((w) => (
                  <label key={w} className="flex items-center gap-2 text-xs font-bold uppercase text-slate-600 dark:text-slate-400 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={hrWidgets.includes(w)} 
                      onChange={() => {
                        const updated = hrWidgets.includes(w) ? hrWidgets.filter((x: string) => x !== w) : [...hrWidgets, w];
                        setHrWidgets(updated);
                        triggerToast("Dashboard widgets updated.");
                      }}
                      className="rounded border-slate-300 dark:border-slate-700" 
                    />
                    {w.replace(/_/g, ' ')}
                  </label>
                ))}
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-3">
              <span className="text-[9px] font-black uppercase text-slate-900 dark:text-white block">Default HR Scope Filters</span>
              <div className="space-y-2.5">
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 block">Default Department Scope</label>
                  <select value={hrDept} onChange={e => { setHrDept(e.target.value); triggerToast(`Default department set to ${e.target.value}`); }} className="saas-input w-full px-3 py-1.5 text-xs font-semibold cursor-pointer">
                    <option value="All Departments">All Departments</option>
                    {(departmentsList.length > 0 ? departmentsList : ['Engineering', 'HR', 'Sales']).map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 block">Default Branch Office</label>
                  <select value={hrBranch} onChange={e => { setHrBranch(e.target.value); triggerToast(`Default branch set to ${e.target.value}`); }} className="saas-input w-full px-3 py-1.5 text-xs font-semibold cursor-pointer">
                    <option value="All Branches">All Branches</option>
                    {(branchesList.length > 0 ? branchesList : ['Mumbai Head Office', 'Bengaluru Branch']).map((branch) => (
                      <option key={branch} value={branch}>{branch}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. ATTENDANCE PREFERENCES */}
      {activeCategory === 'hr-attendance-pref' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Attendance Alerts Preferences</h3>
            <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase">Tweak parameters for shift timing notifications and missing check-out triggers</p>
          </div>

          <div className="space-y-3 text-left">
            {[
              { label: "Late Arrival Alerts", desc: "Notify when an employee checks in past grace period buffer time", value: lateArrivalAlerts, setter: setLateArrivalAlerts },
              { label: "Missing Check-in warnings", desc: "Alert when missing clock-in is detected for scheduled employees", value: missingClockInAlerts, setter: setMissingClockInAlerts }
            ].map((pref, i) => (
              <div key={i} className="flex justify-between items-center p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="font-black uppercase text-slate-900 dark:text-white text-[10px] tracking-wider">{pref.label}</span>
                  <p className="text-[8px] text-slate-455 font-bold uppercase mt-0.5">{pref.desc}</p>
                </div>
                <button type="button" onClick={() => { pref.setter(!pref.value); triggerToast(`${pref.label} toggled successfully.`); }} className={cn("w-10 h-6 rounded-full p-1 transition-all cursor-pointer shrink-0", pref.value ? "bg-blue-650 flex justify-end" : "bg-slate-200 dark:bg-slate-800 flex justify-start")}>
                  <span className="w-4 h-4 bg-white rounded-full shadow-sm" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. LEAVE PREFERENCES */}
      {activeCategory === 'hr-leave-pref' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Leave Settings Preferences</h3>
            <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase">Manage leave notification channels and approval conflict warnings</p>
          </div>

          <div className="space-y-3 text-left">
            <div className="flex justify-between items-center p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div>
                <span className="font-black uppercase text-slate-900 dark:text-white text-[10px] tracking-wider">Leave Conflict Warnings</span>
                <p className="text-[8px] text-slate-455 font-bold uppercase mt-0.5">Show indicator if multiple teammates request leaves on overlapping slots</p>
              </div>
              <button type="button" onClick={() => { setLeaveConflictAlerts(!leaveConflictAlerts); triggerToast("Leave conflict warnings updated."); }} className={cn("w-10 h-6 rounded-full p-1 transition-all cursor-pointer shrink-0", leaveConflictAlerts ? "bg-blue-650 flex justify-end" : "bg-slate-200 dark:bg-slate-800 flex justify-start")}>
                <span className="w-4 h-4 bg-white rounded-full shadow-sm" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. RECRUITMENT PREFERENCES */}
      {activeCategory === 'hr-recruitment-pref' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Recruitment Workspace Preferences</h3>
            <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase">Fine tune resume preview layout and active pipeline monitoring tools</p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-955 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-2 text-left">
            <label className="text-[9px] font-black uppercase text-slate-900 dark:text-white block">Resume Preview Panel Layout</label>
            <select value={resumePreviewMode} onChange={e => { setResumePreviewMode(e.target.value); triggerToast(`Resume preview mode set to ${e.target.value}`); }} className="saas-input max-w-sm px-3 py-2 text-xs font-semibold">
              <option value="Side-by-Side">Side-by-Side Split View</option>
              <option value="Overlay">Full Screen Overlay</option>
              <option value="Modal">Centered Modal</option>
            </select>
          </div>
        </div>
      )}

      {/* 10. PROJECT PREFERENCES */}
      {activeCategory === 'hr-project-pref' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Project Alerts Preferences</h3>
            <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase">Receive reminders and updates for assigned workforce projects and team goals</p>
          </div>

          <div className="space-y-3 text-left">
            <div className="flex justify-between items-center p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div>
                <span className="font-black uppercase text-slate-900 dark:text-white text-[10px] tracking-wider">Project Status Notifications</span>
                <p className="text-[8px] text-slate-455 font-bold uppercase mt-0.5">Send alert when milestones are achieved or delay triggers are checked</p>
              </div>
              <button type="button" onClick={() => { setProjectNotifs(!projectNotifs); triggerToast("Project alerts updated."); }} className={cn("w-10 h-6 rounded-full p-1 transition-all cursor-pointer shrink-0", projectNotifs ? "bg-blue-650 flex justify-end" : "bg-slate-200 dark:bg-slate-800 flex justify-start")}>
                <span className="w-4 h-4 bg-white rounded-full shadow-sm" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 11. DOCUMENTS */}
      {activeCategory === 'hr-documents' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Document Center</h3>
            <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase">Download offer letters, salary slips and upload tax ID cards for corporate records</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-3">
              <span className="text-[9px] font-black uppercase text-slate-900 dark:text-white block">Download Issued Records</span>
              <div className="space-y-2">
                {['Offer Letter', 'Appointment Letter', 'Salary Slips', 'Policies'].map((doc) => (
                  <div key={doc} className="flex justify-between items-center p-2.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl">
                    <span className="text-[9.5px] font-black text-slate-700 dark:text-slate-300 uppercase">{doc}</span>
                    <button type="button" onClick={() => triggerToast(`Downloading ${doc}...`)} className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 rounded text-[8px] font-black uppercase flex items-center gap-1 border-none cursor-pointer">
                      <Download className="w-3 h-3" />
                      Get
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-3">
              <span className="text-[9px] font-black uppercase text-slate-900 dark:text-white block">Upload Verified ID Documents</span>
              <div className="space-y-2">
                {['PAN Card', 'Aadhaar copy', 'HR Certifications'].map((doc) => (
                  <div key={doc} className="flex justify-between items-center p-2.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl">
                    <span className="text-[9.5px] font-black text-slate-700 dark:text-slate-300 uppercase">{doc}</span>
                    <button type="button" onClick={() => {
                      setUploadingDoc(doc);
                      setTimeout(() => {
                        setUploadingDoc(null);
                        triggerToast(`${doc} uploaded successfully for verification.`);
                      }, 1000);
                    }} className="px-2.5 py-1 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded text-[8px] font-black uppercase flex items-center gap-1 border-none cursor-pointer">
                      <Upload className="w-3 h-3" />
                      {uploadingDoc === doc ? "Uploading..." : "Upload"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Real Uploaded Documents List */}
          <div className="p-4 bg-slate-50 dark:bg-slate-955 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-3 text-left">
            <span className="text-[9px] font-black uppercase text-slate-900 dark:text-white block">Uploaded ID Documents Logs</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(profileDetails.documents || []).length > 0 ? (
                (profileDetails.documents || []).map((doc: any, i: number) => (
                  <div key={i} className="flex justify-between items-center p-2.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">{doc.name || doc.docName}</span>
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 rounded text-[8px] font-black uppercase">{doc.status || 'Verified'}</span>
                  </div>
                ))
              ) : (
                <p className="text-[9px] text-slate-400 font-bold uppercase col-span-2">No verified documents on record.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 12. SECURITY */}
      {activeCategory === 'hr-security' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Security Settings</h3>
            <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase">Modify password details, add MFA, and register passkey access credentials</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="md:col-span-2">
              <form onSubmit={handleChangePassword} className="p-5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-4">
                <span className="font-black uppercase text-slate-900 dark:text-white block text-[10px] tracking-wider">Change Password</span>
                <div className="space-y-2">
                  <input type="password" required placeholder="Current Password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="saas-input w-full px-3 py-2.5 text-xs min-h-[40px]" />
                  <input type="password" required placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="saas-input w-full px-3 py-2.5 text-xs min-h-[40px]" />
                  <input type="password" required placeholder="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="saas-input w-full px-3 py-2.5 text-xs min-h-[40px]" />
                </div>
                <button type="submit" className="px-5 py-2.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl text-[9px] font-black uppercase cursor-pointer">
                  {changingPassword ? "Updating..." : "Update Password"}
                </button>
              </form>
            </div>

            <div className="space-y-4">
              <div className="p-5 bg-gradient-to-br from-indigo-500/5 to-blue-500/5 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 text-[10px]">
                <span className="font-black uppercase tracking-wider block text-slate-900 dark:text-white">Multi-Factor (2FA)</span>
                <p className="text-[8.5px] text-slate-455 leading-relaxed font-bold uppercase">Require a verification code from Google Authenticator on login</p>
                <button type="button" onClick={() => triggerToast("2FA configuration opened.")} className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-lg text-[8px] font-black uppercase">Enable 2FA</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 13. NOTIFICATIONS */}
      {activeCategory === 'hr-notifications' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Notifications</h3>
            <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase">Fine tune modules alerts delivery to your email, push, or phone devices</p>
          </div>

          <div className="space-y-3 text-left">
            {[
              { id: 'taskReminders', title: 'Task & Projects Notifications', desc: 'Alert when a task deadline or assignment updates' },
              { id: 'payrollAlerts', title: 'Payroll & Slip Notifications', desc: 'Alert when your monthly slip is processed' },
              { id: 'attendanceAlerts', title: 'Attendance Logs warnings', desc: 'Alert if missing clock-out triggers are detected' }
            ].map(pref => {
              const checked = employeeNotifs[pref.id as keyof typeof employeeNotifs] ?? true;
              return (
                <div key={pref.id} className="flex justify-between items-center p-3.5 bg-slate-50 dark:bg-slate-955 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="font-black uppercase text-slate-900 dark:text-white text-[10px] tracking-wider">{pref.title}</span>
                    <p className="text-[8px] text-slate-455 font-bold uppercase mt-0.5">{pref.desc}</p>
                  </div>
                  <button type="button" onClick={() => {
                    setEmployeeNotifs((prev: any) => {
                      const updated = { ...prev, [pref.id]: !prev[pref.id] };
                      triggerToast(`${pref.title} toggled successfully.`);
                      return updated;
                    });
                  }} className={cn("w-10 h-6 rounded-full p-1 transition-all cursor-pointer shrink-0", checked ? "bg-blue-650 flex justify-end" : "bg-slate-200 dark:bg-slate-800 flex justify-start")}>
                    <span className="w-4 h-4 bg-white rounded-full shadow-sm" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 14. APPEARANCE */}
      {activeCategory === 'hr-appearance' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Appearance Settings</h3>
            <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase">Fine tune workspace density and visual themes parameters</p>
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-xl text-left">
            {[
              { id: 'Light', label: 'Light Theme', icon: Palette },
              { id: 'Dark', label: 'Dark Theme', icon: Palette }
            ].map(theme => (
              <button key={theme.id} onClick={() => {
                setThemeMode(theme.id);
                if (typeof window !== 'undefined') {
                  const isDark = theme.id === 'Dark';
                  document.documentElement.classList.toggle('dark', isDark);
                  localStorage.setItem('hr_system_theme_mode', theme.id);
                }
                triggerToast(`Theme set to ${theme.label}`);
              }} className={cn("p-4 border rounded-2xl flex items-center gap-3 transition-all cursor-pointer text-left text-[10px] uppercase font-black", themeMode === theme.id ? "bg-blue-650/5 border-blue-650 text-blue-650 dark:text-blue-400" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800")}>
                <theme.icon className="w-4 h-4" />
                {theme.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 15. LANGUAGE & REGION */}
      {activeCategory === 'hr-language' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Language &amp; Region</h3>
            <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase">Set local timezone and display formats for dates and currency</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl text-left">
            <div className="space-y-1.5">
              <label className="text-[8.5px] font-black text-slate-455 dark:text-slate-400 uppercase tracking-widest">Language</label>
              <select className="saas-input w-full px-3 py-2 text-xs font-semibold cursor-pointer min-h-[38px]">
                <option value="en">English (US)</option>
                <option value="hi">Hindi (India)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[8.5px] font-black text-slate-455 dark:text-slate-400 uppercase tracking-widest">Time Zone</label>
              <select className="saas-input w-full px-3 py-2 text-xs font-semibold cursor-pointer min-h-[38px]">
                <option value="IST">Kolkata (GMT+05:30)</option>
                <option value="UTC">London (GMT+00:00)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* 16. PRIVACY */}
      {activeCategory === 'hr-privacy' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Privacy</h3>
            <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase">Manage who can lookup details of your phone, birthday, or anniversary tags</p>
          </div>

          <div className="space-y-3 text-left">
            {[
              { id: 'showBirthday', label: 'Show Birthday Details', desc: 'Display birthday greetings banner to coworkers' },
              { id: 'showPhoneNumber', label: 'Show Mobile Number', desc: 'Allow managers and teammates to view phone digits' },
              { id: 'showEmail', label: 'Show Email Address', desc: 'Allow colleagues to copy email address' }
            ].map(field => {
              const checked = employeePrivacy[field.id as keyof typeof employeePrivacy] ?? true;
              return (
                <div key={field.id} className="flex justify-between items-center p-3.5 bg-slate-50 dark:bg-slate-955 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="font-black uppercase text-slate-900 dark:text-white text-[10px] tracking-wider">{field.label}</span>
                    <p className="text-[8px] text-slate-455 font-bold uppercase mt-0.5">{field.desc}</p>
                  </div>
                  <button type="button" onClick={() => {
                    setEmployeePrivacy((prev: any) => {
                      const updated = { ...prev, [field.id]: !prev[field.id] };
                      triggerToast(`${field.label} toggled successfully.`);
                      return updated;
                    });
                  }} className={cn("w-10 h-6 rounded-full p-1 transition-all cursor-pointer shrink-0", checked ? "bg-blue-650 flex justify-end" : "bg-slate-200 dark:bg-slate-800 flex justify-start")}>
                    <span className="w-4 h-4 bg-white rounded-full shadow-sm" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 17. DEVICES & SESSIONS */}
      {activeCategory === 'hr-devices' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Devices &amp; Sessions</h3>
            <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase">Track browser instances and active token sessions linked to your ID</p>
          </div>

          <div className="space-y-2 text-left">
            {sessionsList.map((ses, idx) => (
              <div key={ses.id || idx} className="p-3 bg-slate-50 dark:bg-slate-955 border border-slate-100 dark:border-slate-800 rounded-xl flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Laptop className="w-4 h-4 text-slate-400" />
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-900 dark:text-white block">{ses.device}</span>
                    <span className="text-[8px] text-slate-400 font-bold uppercase block">IP: {ses.ip} · {ses.location}</span>
                  </div>
                </div>
                {ses.current ? (
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 rounded-md text-[7px] font-bold uppercase">Active Session</span>
                ) : (
                  <button type="button" onClick={() => {
                    setSessionsList(prev => prev.filter(s => s.id !== ses.id));
                    triggerToast(`Session on ${ses.device} revoked successfully.`);
                  }} className="px-2 py-1 hover:bg-rose-500/10 text-rose-500 rounded border border-rose-500/10 text-[8px] font-bold uppercase cursor-pointer">Logout</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 18. CONNECTED ACCOUNTS */}
      {activeCategory === 'hr-connected' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Connected Accounts</h3>
            <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase">Link social auth credentials key integrations for faster portals access</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
            {[
              { id: 'google', label: 'Google Identity', desc: 'Allows single sign on login via corporate Gmail', connected: true },
              { id: 'slack', label: 'Slack Workspace', desc: 'Enables alerts triggers inside your Slack DM', connected: false }
            ].map(acc => (
              <div key={acc.id} className="p-4 bg-slate-50 dark:bg-slate-955 border border-slate-150 dark:border-slate-800 rounded-2xl flex justify-between items-center text-[10px]">
                <div>
                  <span className="font-black text-slate-900 dark:text-white uppercase">{acc.label}</span>
                  <p className="text-[8px] text-slate-400 font-bold uppercase mt-1 leading-normal">{acc.desc}</p>
                </div>
                <button type="button" onClick={() => triggerToast(acc.connected ? "Account unlinked." : "Account linked successfully.")} className={cn("px-3 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all cursor-pointer border-none", acc.connected ? "bg-rose-500/10 text-rose-500" : "bg-blue-650 text-white")}>
                  {acc.connected ? 'Disconnect' : 'Connect'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 19. DOWNLOAD MY DATA */}
      {activeCategory === 'hr-download' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Download My Data</h3>
            <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase">Export all stored profile records, tax documents, and performance feedback logs</p>
          </div>

          <div className="p-5 bg-slate-50 dark:bg-slate-955 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-4 text-left">
            <span className="font-black uppercase tracking-wider text-[10px] text-slate-900 dark:text-white block">Request Export Archives</span>
            <div className="grid grid-cols-3 gap-2">
              {['PDF Format', 'Excel Sheets', 'ZIP Archive'].map((fmt, idx) => (
                <button 
                  key={idx} 
                  type="button" 
                  onClick={async () => {
                    try {
                      if (fmt === 'PDF Format') {
                        triggerToast("Preparing PDF print report...");
                        const printWindow = window.open('', '_blank');
                        if (printWindow) {
                          printWindow.document.write(`
                            <html>
                              <head>
                                <title>Employee Profile Report - ${profileDetails.fullName || 'Employee'}</title>
                                <style>
                                  body { font-family: system-ui, -apple-system, sans-serif; color: #1e293b; padding: 40px; line-height: 1.5; }
                                  .header { border-bottom: 2px solid #3b82f6; padding-bottom: 12px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center; }
                                  .header h1 { margin: 0; font-size: 20px; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; }
                                  .header p { margin: 3px 0 0 0; font-size: 9px; font-weight: bold; color: #64748b; text-transform: uppercase; }
                                  .section { margin-bottom: 25px; page-break-inside: avoid; }
                                  .section-title { font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; color: #2563eb; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 12px; }
                                  .label { font-size: 8px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 2px; display: block; }
                                  .value { font-size: 11px; font-weight: 600; color: #0f172a; }
                                  .doc-item, .perf-item { padding: 8px; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 8px; font-size: 10px; }
                                  .doc-item span, .perf-item span { font-weight: bold; }
                                  @media print {
                                    body { padding: 0; }
                                    .no-print { display: none; }
                                  }
                                </style>
                              </head>
                              <body>
                                <div class="header">
                                  <div>
                                    <h1>Employee Profile Export</h1>
                                    <p>Official HR portable data archive</p>
                                  </div>
                                  <div style="text-align: right;">
                                    <span style="font-size: 9px; font-weight: bold; color: #64748b;">EXPORT DATE: ${new Date().toLocaleDateString()}</span>
                                  </div>
                                </div>
                                
                                <div class="section">
                                  <div class="section-title">1. Personal Information</div>
                                  <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
                                    <tr>
                                      <td style="width: 50%; padding: 6px 0; border-bottom: 1px solid #f1f5f9;"><span class="label">Full Name</span><div class="value">${profileDetails.fullName || 'N/A'}</div></td>
                                      <td style="width: 50%; padding: 6px 0; border-bottom: 1px solid #f1f5f9;"><span class="label">Email Address</span><div class="value">${profileDetails.email || 'N/A'}</div></td>
                                    </tr>
                                    <tr>
                                      <td style="width: 50%; padding: 6px 0; border-bottom: 1px solid #f1f5f9;"><span class="label">Date of Birth</span><div class="value">${profileDetails.dateOfBirth || 'N/A'}</div></td>
                                      <td style="width: 50%; padding: 6px 0; border-bottom: 1px solid #f1f5f9;"><span class="label">Gender</span><div class="value">${profileDetails.gender || 'N/A'}</div></td>
                                    </tr>
                                    <tr>
                                      <td style="width: 50%; padding: 6px 0; border-bottom: 1px solid #f1f5f9;"><span class="label">Blood Group</span><div class="value">${profileDetails.bloodGroup || 'N/A'}</div></td>
                                      <td style="width: 50%; padding: 6px 0; border-bottom: 1px solid #f1f5f9;"><span class="label">Nationality</span><div class="value">${profileDetails.nationality || 'N/A'}</div></td>
                                    </tr>
                                  </table>
                                </div>

                                <div class="section">
                                  <div class="section-title">2. Work & Corporate Information</div>
                                  <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
                                    <tr>
                                      <td style="width: 50%; padding: 6px 0; border-bottom: 1px solid #f1f5f9;"><span class="label">Employee ID</span><div class="value">${profileDetails.employeeId || 'N/A'}</div></td>
                                      <td style="width: 50%; padding: 6px 0; border-bottom: 1px solid #f1f5f9;"><span class="label">Department</span><div class="value">${profileDetails.department || 'N/A'}</div></td>
                                    </tr>
                                    <tr>
                                      <td style="width: 50%; padding: 6px 0; border-bottom: 1px solid #f1f5f9;"><span class="label">Designation</span><div class="value">${profileDetails.designation || 'N/A'}</div></td>
                                      <td style="width: 50%; padding: 6px 0; border-bottom: 1px solid #f1f5f9;"><span class="label">Work Location</span><div class="value">${profileDetails.location || 'N/A'}</div></td>
                                    </tr>
                                  </table>
                                </div>

                                <div class="section">
                                  <div class="section-title">3. Banking & Tax Credentials</div>
                                  <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
                                    <tr>
                                      <td style="width: 50%; padding: 6px 0; border-bottom: 1px solid #f1f5f9;"><span class="label">Bank Name</span><div class="value">${profileDetails.bankDetails?.bankName || 'N/A'}</div></td>
                                      <td style="width: 50%; padding: 6px 0; border-bottom: 1px solid #f1f5f9;"><span class="label">Account Number</span><div class="value">${profileDetails.bankDetails?.accountNumber || 'N/A'}</div></td>
                                    </tr>
                                    <tr>
                                      <td style="width: 50%; padding: 6px 0; border-bottom: 1px solid #f1f5f9;"><span class="label">IFSC Code</span><div class="value">${profileDetails.bankDetails?.ifscCode || 'N/A'}</div></td>
                                      <td style="width: 50%; padding: 6px 0; border-bottom: 1px solid #f1f5f9;"><span class="label">PAN Number</span><div class="value">${profileDetails.panNumber || 'N/A'}</div></td>
                                    </tr>
                                    <tr>
                                      <td style="width: 50%; padding: 6px 0; border-bottom: 1px solid #f1f5f9;"><span class="label">Aadhaar Card Number</span><div class="value">${profileDetails.aadhaarNumber || 'N/A'}</div></td>
                                      <td style="width: 50%; padding: 6px 0; border-bottom: 1px solid #f1f5f9;"><span class="label">PF Number</span><div class="value">${profileDetails.pfNumber || 'N/A'}</div></td>
                                    </tr>
                                  </table>
                                </div>

                                <div class="section">
                                  <div class="section-title">4. Tax & Verified Documents</div>
                                  ${(profileDetails.documents || []).map((doc: any, i: number) => `
                                    <div class="doc-item">
                                      <strong>[Doc #${i + 1}]</strong> Name: <span>${doc.name || doc.docName}</span> | Status: <span>${doc.status || (doc.mandatory ? 'Required' : 'Optional')}</span> | Remarks: <span>${doc.remarks || 'Verified'}</span>
                                    </div>
                                  `).join('') || `
                                    <div class="doc-item">No verified tax/identification documents found in database.</div>
                                  `}
                                </div>

                                <div class="section">
                                  <div class="section-title">5. Performance Feedback Logs & Evaluations</div>
                                  ${(profileDetails.performances || []).map((perf: any, i: number) => `
                                    <div class="perf-item">
                                      <strong>[Review #${i + 1}]</strong> Cycle: <span>${perf.lastReview || 'Quarterly Cycle'}</span> | Rating: <span>${perf.rating} / 5.0</span> | Status: <span>${perf.status}</span> | Goals: <span>${perf.goals}</span>
                                    </div>
                                  `).join('') || `
                                    <div class="perf-item">No active performance reviews found in database.</div>
                                  `}
                                </div>

                                <script>
                                  window.onload = function() {
                                    window.print();
                                    setTimeout(function() { window.close(); }, 500);
                                  };
                                </script>
                              </body>
                            </html>
                          `);
                          printWindow.document.close();
                        }
                        return;
                      }

                      const token = localStorage.getItem('hr_system_token');
                      if (!token) return;

                      const formatQuery = fmt === 'Excel Sheets' ? 'csv' : 'zip';
                      const fileExt = fmt === 'Excel Sheets' ? 'csv' : 'zip';

                      triggerToast(`Generating export in ${fmt}...`);
                      
                      const res = await fetch(`/api/settings/download-data?format=${formatQuery}`, {
                        headers: {
                          'Authorization': `Bearer ${token}`
                        }
                      });
                      if (!res.ok) {
                        throw new Error('Failed to generate export file');
                      }

                      const blob = await res.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `my_profile_data.${fileExt}`;
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                      window.URL.revokeObjectURL(url);
                      triggerToast(`Data downloaded successfully.`);
                    } catch (err: any) {
                      console.error(err);
                      triggerToast('Error downloading export data.');
                    }
                  }} 
                  className="py-3 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-[9px] font-black uppercase rounded-xl flex items-center justify-center gap-1 hover:shadow-sm cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  {fmt}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 20. HELP & SUPPORT */}
      {activeCategory === 'hr-support' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Help & Support</h3>
            <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase">Submit tickets, contact corporate helpdesk support, and search FAQs</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
            <div className="lg:col-span-2 space-y-4">
              <form onSubmit={handleCreateTicket} className="p-4 bg-slate-50 dark:bg-slate-955 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-3">
                <span className="font-black uppercase text-[10px] text-slate-900 dark:text-white block">Raise New Support Ticket</span>
                <input type="text" placeholder="Subject" value={ticketSubject} onChange={e => setTicketSubject(e.target.value)} className="saas-input w-full px-3 py-2 text-xs min-h-[40px]" />
                <textarea placeholder="Describe the issue..." value={ticketDesc} onChange={e => setTicketDesc(e.target.value)} rows={3} className="saas-input w-full p-3 text-xs" />
                <button type="submit" disabled={submittingTicket} className="px-5 py-2.5 bg-blue-650 text-white rounded-xl text-[9px] font-black uppercase tracking-wider">{submittingTicket ? "Posting..." : "Submit Ticket"}</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 20. WORKPLACE CHAT SETUP */}
      {activeCategory === 'hr-chat' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Workplace Chat Setup</h3>
            <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase">Configure workspace chat parameters, posting permissions, and restricted keywords</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className="p-4 bg-slate-50 dark:bg-slate-955 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-3">
              <span className="text-[9px] font-black uppercase text-slate-900 dark:text-white block">Workspace Name</span>
              <input 
                type="text" 
                value={chatConfig.workspaceName || ''} 
                onChange={e => {
                  setChatConfig({ ...chatConfig, workspaceName: e.target.value });
                }}
                className="saas-input w-full px-3 py-2 text-xs" 
              />
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-955 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-3">
              <span className="text-[9px] font-black uppercase text-slate-900 dark:text-white block">Restricted Moderation Keywords</span>
              <textarea 
                value={chatConfig.restrictedKeywords || ''} 
                onChange={e => {
                  setChatConfig({ ...chatConfig, restrictedKeywords: e.target.value });
                }}
                rows={2}
                placeholder="Comma separated list (e.g. spam, leak)"
                className="saas-input w-full p-2 text-xs" 
              />
            </div>

            <div className="col-span-1 md:col-span-2 space-y-3">
              {[
                { label: "Allow Employee Channel Creation", desc: "Allows non-admin team members to create public channels", key: "allowEmployeeChannelCreate" },
                { label: "Allow Private Channel Creation", desc: "Allows employee users to spin off private discussion rooms", key: "allowEmployeeChannelPrivateCreate" },
                { label: "Allow Announcements Post All", desc: "Allows all employees to trigger @everyone alerts inside general channel", key: "allowAnnouncementsPostAll" }
              ].map(item => {
                const checked = (chatConfig as any)[item.key] ?? true;
                return (
                  <div key={item.key} className="flex justify-between items-center p-3.5 bg-slate-50 dark:bg-slate-955 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="font-black uppercase text-slate-900 dark:text-white text-[10px] tracking-wider">{item.label}</span>
                      <p className="text-[8px] text-slate-455 font-bold uppercase mt-0.5">{item.desc}</p>
                    </div>
                    <button type="button" onClick={() => {
                      setChatConfig({ ...chatConfig, [item.key]: !checked });
                      triggerToast(`${item.label} toggled successfully.`);
                    }} className={cn("w-10 h-6 rounded-full p-1 transition-all cursor-pointer shrink-0", checked ? "bg-blue-650 flex justify-end" : "bg-slate-200 dark:bg-slate-800 flex justify-start")}>
                      <span className="w-4 h-4 bg-white rounded-full shadow-sm" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 21. ABOUT */}
      {activeCategory === 'hr-about' && (
        <div className="space-y-6 text-left">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">About</h3>
            <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase">Enterprise platform versions metadata and corporate registration stamps</p>
          </div>

          <div className="p-5 bg-slate-50 dark:bg-slate-955 border border-slate-100 dark:border-slate-800 rounded-2xl max-w-xl space-y-4">
            <div className="space-y-1">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Application Version</span>
              <span className="text-xs font-bold text-slate-900 dark:text-white">v3.42.10-release</span>
            </div>
            <div className="space-y-1">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Platform Build</span>
              <span className="text-xs font-bold text-slate-900 dark:text-white">#8810-production</span>
            </div>
            <div className="space-y-1">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Corporate Engine</span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">HR Porter Enterprise SaaS Platform</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
