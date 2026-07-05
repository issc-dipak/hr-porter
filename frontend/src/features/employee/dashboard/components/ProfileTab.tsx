"use client";

import React, { useState, useEffect } from 'react';
import { 
  User, ShieldCheck, DollarSign, CreditCard, Settings, 
  Loader2, Key, Bell, Clock, Eye, EyeOff, Save, CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";

interface ProfileTabProps {
  profileData: any;
  setProfileData: (data: any) => void;
  addNotification: (msg: string) => void;
}

type SubTab = 'personal' | 'work-pay' | 'finance' | 'security-preferences';

export function ProfileTab({
  profileData,
  setProfileData,
  addNotification
}: ProfileTabProps) {
  // Navigation tabs
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('personal');
  
  // UI States
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [showPasswordCurrent, setShowPasswordCurrent] = useState<boolean>(false);
  const [showPasswordNew, setShowPasswordNew] = useState<boolean>(false);

  // Form buffers
  const [personalForm, setPersonalForm] = useState({
    phone: '',
    emergencyContact: '',
    dateOfBirth: '',
    gender: '',
    bloodGroup: '',
    address: '',
  });

  const [financeForm, setFinanceForm] = useState({
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    panNumber: '',
    uanNumber: '',
  });

  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Settings buffers
  const [preferences, setPreferences] = useState({
    bio: '',
    skills: [] as string[],
    privacy: {
      showProfilePhoto: true,
      showContactNumber: false,
      showOnlineIndicator: true,
      shareSprintActivity: true,
    },
    notifications: {
      taskReminders: true,
      payrollAlerts: true,
      attendanceAlerts: true,
    },
    appearance: {
      themeMode: 'Dark',
      fontSize: 'Medium',
      compactLayout: false,
    },
    productivity: {
      focusModeTime: 25,
      dailyTaskGoal: 5,
      productivityReminders: true,
    },
    availability: {
      startHour: '09:00 AM',
      endHour: '06:00 PM',
      timezone: 'GMT+05:30 (IST)',
      googleCalendarSynced: true,
    }
  });

  const [salaryStructure, setSalaryStructure] = useState<any>(null);
  const [joinedDate, setJoinedDate] = useState<string | null>(null);

  // Fetch full settings & profile from DB on mount
  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const res = await fetch('/api/settings/user');
        if (res.ok) {
          const data = await res.json();
          const p = data.profile || {};
          const s = data.settings || {};
          
          setPersonalForm({
            phone: p.phone || '',
            emergencyContact: p.emergencyContact || '',
            dateOfBirth: p.dateOfBirth || '',
            gender: p.gender || '',
            bloodGroup: p.bloodGroup || '',
            address: p.address || '',
          });

          setFinanceForm({
            bankName: p.bankDetails?.bankName || '',
            accountNumber: p.bankDetails?.accountNumber || '',
            ifscCode: p.bankDetails?.ifscCode || '',
            panNumber: p.panNumber || '',
            uanNumber: p.uanNumber || '',
          });

          setPreferences({
            bio: s.bio || '',
            skills: s.skills || [],
            privacy: { ...preferences.privacy, ...s.privacy },
            notifications: { ...preferences.notifications, ...s.notifications },
            appearance: { ...preferences.appearance, ...s.appearance },
            productivity: { ...preferences.productivity, ...s.productivity },
            availability: { ...preferences.availability, ...s.availability },
          });

          setSalaryStructure(p.salaryStructure || null);
          setJoinedDate(p.joinedDate ? new Date(p.joinedDate).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }) : 'N/A');

          // Sync back to top-level employee dashboard context
          setProfileData({
            ...profileData,
            phone: p.phone || profileData.phone,
            emergencyContact: p.emergencyContact || profileData.emergencyContact,
            bankName: p.bankDetails?.bankName || profileData.bankName,
            accountNumber: p.bankDetails?.accountNumber || profileData.accountNumber,
            ifscCode: p.bankDetails?.ifscCode || profileData.ifscCode,
            profilePicture: p.profilePicture || profileData.profilePicture,
          });
        }
      } catch (err) {
        console.error('Failed loading profile settings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/settings/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bio: preferences.bio,
          skills: preferences.skills,
          privacy: preferences.privacy,
          notifications: preferences.notifications,
          appearance: preferences.appearance,
          productivity: preferences.productivity,
          availability: preferences.availability,
          profile: {
            phone: personalForm.phone,
            emergencyContact: personalForm.emergencyContact,
            dateOfBirth: personalForm.dateOfBirth,
            gender: personalForm.gender,
            bloodGroup: personalForm.bloodGroup,
            address: personalForm.address,
            panNumber: financeForm.panNumber,
            uanNumber: financeForm.uanNumber,
            bankDetails: {
              bankName: financeForm.bankName,
              accountNumber: financeForm.accountNumber,
              ifscCode: financeForm.ifscCode,
              accountHolderName: profileData.name
            }
          }
        })
      });

      if (res.ok) {
        addNotification('Settings & profile saved successfully!');
        // Update top-level dashboard values
        setProfileData({
          ...profileData,
          phone: personalForm.phone,
          emergencyContact: personalForm.emergencyContact,
          bankName: financeForm.bankName,
          accountNumber: financeForm.accountNumber,
          ifscCode: financeForm.ifscCode,
        });
      } else {
        const err = await res.json();
        addNotification(`Error: ${err.error || 'Failed to save settings'}`);
      }
    } catch (err) {
      console.error(err);
      addNotification('Could not save details.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!securityForm.currentPassword || !securityForm.newPassword) {
      addNotification('Please fill in current and new passwords.');
      return;
    }
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      addNotification('New passwords do not match.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/settings/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: securityForm.currentPassword,
          newPassword: securityForm.newPassword,
        })
      });

      if (res.ok) {
        addNotification('Password changed successfully!');
        setSecurityForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        const err = await res.json();
        addNotification(`Error: ${err.error || 'Failed to update password'}`);
      }
    } catch (err) {
      console.error(err);
      addNotification('Could not update password.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Loading Preferences...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-blue-900/10 via-indigo-900/5 to-transparent p-6 rounded-2xl border border-slate-100 dark:border-slate-800/80">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white font-sans flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-500" />
            EMPLOYEE PREFERENCES & SETTINGS
          </h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
            Configure security credentials, view organizational breakdown, and update personal workspace values.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 uppercase tracking-wider">
            {profileData.department} Team
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 uppercase tracking-wider">
            Live Database Sync
          </span>
        </div>
      </div>

      {/* Profile Overview Card + SubTabs Menu */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Side: Employee Badge Card & Tab Menu */}
        <div className="lg:col-span-1 space-y-4">
          <div className="saas-card bg-white dark:bg-slate-900 p-5 flex flex-col items-center text-center space-y-4">
            {profileData.profilePicture ? (
              <div className="relative group">
                <div className="w-20 h-20 rounded-full overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800">
                  <img src={profileData.profilePicture} alt="User Profile" className="w-full h-full object-cover" />
                </div>
              </div>
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-indigo-650 text-white font-bold text-xl flex items-center justify-center shadow-lg uppercase">
                {profileData.name ? profileData.name.split(' ').map((n: string) => n[0]).join('') : 'U'}
              </div>
            )}
            
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white font-sans leading-none">{profileData.name}</h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-semibold uppercase tracking-wider">{profileData.designation}</p>
            </div>

            <div className="w-full pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-2 text-left text-[10px] font-medium text-slate-400">
              <div className="flex justify-between items-center">
                <span>Core Email:</span>
                <span className="text-slate-700 dark:text-slate-350 font-bold lowercase truncate max-w-[120px]">{profileData.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Joined Date:</span>
                <span className="text-slate-700 dark:text-slate-350 font-bold">{joinedDate}</span>
              </div>
            </div>
          </div>

          {/* Sub Navigation */}
          <div className="flex flex-col space-y-1 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-100 dark:border-slate-800/60">
            <button
              onClick={() => setActiveSubTab('personal')}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all",
                activeSubTab === 'personal' 
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/10" 
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850"
              )}
            >
              <User className="w-3.5 h-3.5" />
              Personal Info
            </button>
            <button
              onClick={() => setActiveSubTab('work-pay')}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all",
                activeSubTab === 'work-pay' 
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/10" 
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850"
              )}
            >
              <DollarSign className="w-3.5 h-3.5" />
              Work & Pay Structure
            </button>
            <button
              onClick={() => setActiveSubTab('finance')}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all",
                activeSubTab === 'finance' 
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/10" 
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850"
              )}
            >
              <CreditCard className="w-3.5 h-3.5" />
              Finance & ID details
            </button>
            <button
              onClick={() => setActiveSubTab('security-preferences')}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all",
                activeSubTab === 'security-preferences' 
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/10" 
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850"
              )}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Security & Preferences
            </button>
          </div>
        </div>

        {/* Right Side: Configuration Body */}
        <div className="lg:col-span-3">
          <div className="saas-card bg-white dark:bg-slate-900 p-6 min-h-[420px] flex flex-col justify-between">
            <div>
              <AnimatePresence mode="wait">
                
                {/* 1. PERSONAL INFORMATION SUB-TAB */}
                {activeSubTab === 'personal' && (
                  <motion.div
                    key="personal"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-widest border-b border-slate-100 dark:border-slate-800/80 pb-2">
                        Personal Workspace Details
                      </h3>
                      <p className="text-[10px] text-slate-450 mt-1">Ensure your contact info and personal metadata are updated for communication.</p>
                    </div>

                    <form className="space-y-4" onSubmit={handleSaveProfile}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 block">Full Name (Read Only)</label>
                          <input type="text" value={profileData.name} disabled className="saas-input w-full bg-slate-50 dark:bg-slate-950 opacity-60 text-xs px-3 py-2 text-slate-500" />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 block">Email (Read Only)</label>
                          <input type="text" value={profileData.email} disabled className="saas-input w-full bg-slate-50 dark:bg-slate-950 opacity-60 text-xs px-3 py-2 text-slate-500" />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 block">Mobile Number</label>
                          <input 
                            type="text" 
                            value={personalForm.phone} 
                            onChange={(e) => setPersonalForm({ ...personalForm, phone: e.target.value })} 
                            className="saas-input w-full text-xs px-3 py-2" 
                            placeholder="+91 XXXXX XXXXX"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 block">Emergency Contact</label>
                          <input 
                            type="text" 
                            value={personalForm.emergencyContact} 
                            onChange={(e) => setPersonalForm({ ...personalForm, emergencyContact: e.target.value })} 
                            className="saas-input w-full text-xs px-3 py-2" 
                            placeholder="Name & Contact number"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 block">Date of Birth</label>
                          <input 
                            type="date" 
                            value={personalForm.dateOfBirth} 
                            onChange={(e) => setPersonalForm({ ...personalForm, dateOfBirth: e.target.value })} 
                            className="saas-input w-full text-xs px-3 py-2" 
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 block">Gender</label>
                          <select 
                            value={personalForm.gender} 
                            onChange={(e) => setPersonalForm({ ...personalForm, gender: e.target.value })} 
                            className="saas-input w-full text-xs px-3 py-2.5"
                          >
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 block">Blood Group</label>
                          <select 
                            value={personalForm.bloodGroup} 
                            onChange={(e) => setPersonalForm({ ...personalForm, bloodGroup: e.target.value })} 
                            className="saas-input w-full text-xs px-3 py-2.5"
                          >
                            <option value="">Select Blood Group</option>
                            <option value="A+">A+</option>
                            <option value="A-">A-</option>
                            <option value="B+">B+</option>
                            <option value="B-">B-</option>
                            <option value="O+">O+</option>
                            <option value="O-">O-</option>
                            <option value="AB+">AB+</option>
                            <option value="AB-">AB-</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 block">Address</label>
                        <textarea 
                          rows={3} 
                          value={personalForm.address} 
                          onChange={(e) => setPersonalForm({ ...personalForm, address: e.target.value })} 
                          className="saas-input w-full text-xs px-3 py-2" 
                          placeholder="Your current residence address"
                        />
                      </div>

                      <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800/60">
                        <button type="submit" disabled={saving} className="saas-btn-primary flex items-center gap-1.5 cursor-pointer">
                          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                          Save Changes
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}

                {/* 2. WORKPLACE & SALARY SUB-TAB */}
                {activeSubTab === 'work-pay' && (
                  <motion.div
                    key="work-pay"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-widest border-b border-slate-100 dark:border-slate-800/80 pb-2">
                        Work & Compensation breakdown
                      </h3>
                      <p className="text-[10px] text-slate-450 mt-1">View official workspace details and your structured monthly compensation.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-900">
                      <div>
                        <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Employment Status</span>
                        <div className="mt-1 flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Active / Contract</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Job Location</span>
                        <div className="mt-1">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{profileData.location || 'Headquarters'}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Primary Department</span>
                        <div className="mt-1">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{profileData.department}</span>
                        </div>
                      </div>
                    </div>

                    {profileData.reportingManager && (
                      <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-900 space-y-3">
                        <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Reporting Manager</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <span className="text-[8px] font-semibold text-slate-400 dark:text-slate-500 uppercase block">Name & Designation</span>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-250">{profileData.reportingManager.name}</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">{profileData.reportingManager.designation || 'Manager'}</p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[8px] font-semibold text-slate-400 dark:text-slate-500 uppercase block">Department</span>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-250">{profileData.reportingManager.department || 'N/A'}</p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[8px] font-semibold text-slate-400 dark:text-slate-500 uppercase block">Email Address</span>
                            <p className="text-xs font-bold text-slate-850 dark:text-slate-300 font-mono truncate">{profileData.reportingManager.email}</p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[8px] font-semibold text-slate-400 dark:text-slate-500 uppercase block">Phone Number</span>
                            <p className="text-xs font-bold text-slate-850 dark:text-slate-300 font-mono">{profileData.reportingManager.phone || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {salaryStructure ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Salary Structure Breakdown</h4>
                          <span className="text-xs font-bold text-blue-600 dark:text-blue-400">CTC: ₹{((salaryStructure.net || 0) * 12).toLocaleString('en-IN')}/year</span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="bg-blue-50/20 dark:bg-blue-950/10 p-3 rounded-lg border border-blue-100/10">
                            <span className="text-[8px] font-semibold text-slate-400 dark:text-slate-500 uppercase block">Basic Salary</span>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1 block">₹{salaryStructure.basic?.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="bg-blue-50/20 dark:bg-blue-950/10 p-3 rounded-lg border border-blue-100/10">
                            <span className="text-[8px] font-semibold text-slate-400 dark:text-slate-500 uppercase block">HRA</span>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1 block">₹{salaryStructure.hra?.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="bg-blue-50/20 dark:bg-blue-950/10 p-3 rounded-lg border border-blue-100/10">
                            <span className="text-[8px] font-semibold text-slate-400 dark:text-slate-500 uppercase block">Allowances</span>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1 block">₹{salaryStructure.allowance?.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="bg-red-50/20 dark:bg-red-950/10 p-3 rounded-lg border border-red-100/10">
                            <span className="text-[8px] font-semibold text-red-500 uppercase block">Total Deductions</span>
                            <span className="text-xs font-bold text-red-500 mt-1 block">₹{((salaryStructure.pf || 0) + (salaryStructure.esi || 0) + (salaryStructure.tax || 0) + (salaryStructure.otherDeductions || 0))?.toLocaleString('en-IN')}</span>
                          </div>
                        </div>

                        {/* Net pay highlight */}
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-650 p-4 rounded-xl text-white flex justify-between items-center shadow-lg shadow-blue-500/10">
                          <div>
                            <span className="text-[9px] font-bold uppercase tracking-wider opacity-85">Net Take-Home Pay (Monthly)</span>
                            <h4 className="text-xl font-black mt-0.5">₹{salaryStructure.net?.toLocaleString('en-IN')}</h4>
                          </div>
                          <div className="text-right text-[10px] opacity-75 font-medium leading-relaxed">
                            Includes PF Contribution: ₹{salaryStructure.pf || 0}<br />
                            Taxes Deducted: ₹{salaryStructure.tax || 0}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                        <DollarSign className="w-8 h-8 text-slate-350 dark:text-slate-655 mx-auto mb-2" />
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">No salary structure assigned. Contact HR.</span>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* 3. FINANCE & GOVERNMENT ACCOUNTS SUB-TAB */}
                {activeSubTab === 'finance' && (
                  <motion.div
                    key="finance"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-widest border-b border-slate-100 dark:border-slate-800/80 pb-2">
                        Financial & Identity Credentials
                      </h3>
                      <p className="text-[10px] text-slate-450 mt-1">Configure your bank deposit details and tax ID registration.</p>
                    </div>

                    <form className="space-y-4" onSubmit={handleSaveProfile}>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 block">Bank Name</label>
                          <input 
                            type="text" 
                            value={financeForm.bankName} 
                            onChange={(e) => setFinanceForm({ ...financeForm, bankName: e.target.value })} 
                            className="saas-input w-full text-xs px-3 py-2" 
                            placeholder="Enter Bank Name"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 block">Account Number</label>
                          <input 
                            type="text" 
                            value={financeForm.accountNumber} 
                            onChange={(e) => setFinanceForm({ ...financeForm, accountNumber: e.target.value })} 
                            className="saas-input w-full text-xs px-3 py-2" 
                            placeholder="Enter Account Number"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 block">IFSC Code</label>
                          <input 
                            type="text" 
                            value={financeForm.ifscCode} 
                            onChange={(e) => setFinanceForm({ ...financeForm, ifscCode: e.target.value })} 
                            className="saas-input w-full text-xs px-3 py-2 font-mono" 
                            placeholder="Enter IFSC Code"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 block">PAN Number (Tax Registration)</label>
                          <input 
                            type="text" 
                            value={financeForm.panNumber} 
                            onChange={(e) => setFinanceForm({ ...financeForm, panNumber: e.target.value })} 
                            className="saas-input w-full text-xs px-3 py-2 font-mono uppercase" 
                            placeholder="Enter PAN Card Number"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 block">UAN Number (Provident Fund)</label>
                          <input 
                            type="text" 
                            value={financeForm.uanNumber} 
                            onChange={(e) => setFinanceForm({ ...financeForm, uanNumber: e.target.value })} 
                            className="saas-input w-full text-xs px-3 py-2 font-mono" 
                            placeholder="Enter UAN Number"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800/60">
                        <button type="submit" disabled={saving} className="saas-btn-primary flex items-center gap-1.5 cursor-pointer">
                          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                          Save Financials
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}

                {/* 4. SECURITY & PREFERENCES SUB-TAB */}
                {activeSubTab === 'security-preferences' && (
                  <motion.div
                    key="security-preferences"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-6"
                  >
                    {/* Category A: Change password */}
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-widest border-b border-slate-100 dark:border-slate-800/80 pb-2">
                          Security Settings
                        </h3>
                        <p className="text-[10px] text-slate-450 mt-1">Change your login credentials securely below.</p>
                      </div>

                      <form className="space-y-3" onSubmit={handleChangePassword}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="relative">
                            <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 block">Current Password</label>
                            <input 
                              type={showPasswordCurrent ? "text" : "password"} 
                              value={securityForm.currentPassword} 
                              onChange={(e) => setSecurityForm({ ...securityForm, currentPassword: e.target.value })} 
                              className="saas-input w-full text-xs px-3 py-2 pr-8" 
                            />
                            <button 
                              type="button" 
                              onClick={() => setShowPasswordCurrent(!showPasswordCurrent)}
                              className="absolute right-2 top-6 text-slate-400 hover:text-slate-600"
                            >
                              {showPasswordCurrent ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>

                          <div className="relative">
                            <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 block">New Password</label>
                            <input 
                              type={showPasswordNew ? "text" : "password"} 
                              value={securityForm.newPassword} 
                              onChange={(e) => setSecurityForm({ ...securityForm, newPassword: e.target.value })} 
                              className="saas-input w-full text-xs px-3 py-2 pr-8" 
                            />
                            <button 
                              type="button" 
                              onClick={() => setShowPasswordNew(!showPasswordNew)}
                              className="absolute right-2 top-6 text-slate-400 hover:text-slate-600"
                            >
                              {showPasswordNew ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>

                          <div>
                            <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 block">Confirm New Password</label>
                            <input 
                              type="password" 
                              value={securityForm.confirmPassword} 
                              onChange={(e) => setSecurityForm({ ...securityForm, confirmPassword: e.target.value })} 
                              className="saas-input w-full text-xs px-3 py-2" 
                            />
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <button type="submit" disabled={saving} className="saas-btn-primary flex items-center gap-1 cursor-pointer">
                            <Key className="w-3 h-3" />
                            Update Password
                          </button>
                        </div>
                      </form>
                    </div>

                    {/* Category B: Toggle alerts */}
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 space-y-4">
                      <div>
                        <h4 className="text-[10px] font-bold text-slate-800 dark:text-white uppercase tracking-wider">Workspace Notification Preferences</h4>
                        <p className="text-[9px] text-slate-450 mt-0.5">Toggle alert preferences for system actions.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <label className="flex items-start gap-3 bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-100 dark:border-slate-900 cursor-pointer select-none">
                          <input 
                            type="checkbox" 
                            checked={preferences.notifications.taskReminders} 
                            onChange={(e) => setPreferences({
                              ...preferences, 
                              notifications: { ...preferences.notifications, taskReminders: e.target.checked }
                            })} 
                            className="mt-0.5 text-blue-600 rounded bg-transparent border-slate-300 dark:border-slate-700 focus:ring-0"
                          />
                          <div>
                            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide block">Task Reminders</span>
                            <span className="text-[8px] text-slate-400 dark:text-slate-500 mt-0.5 block">Alert me for task assignments.</span>
                          </div>
                        </label>

                        <label className="flex items-start gap-3 bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-100 dark:border-slate-900 cursor-pointer select-none">
                          <input 
                            type="checkbox" 
                            checked={preferences.notifications.payrollAlerts} 
                            onChange={(e) => setPreferences({
                              ...preferences, 
                              notifications: { ...preferences.notifications, payrollAlerts: e.target.checked }
                            })} 
                            className="mt-0.5 text-blue-600 rounded bg-transparent border-slate-300 dark:border-slate-700 focus:ring-0"
                          />
                          <div>
                            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide block">Payroll Alerts</span>
                            <span className="text-[8px] text-slate-400 dark:text-slate-500 mt-0.5 block">Notify when payslips generate.</span>
                          </div>
                        </label>

                        <label className="flex items-start gap-3 bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-100 dark:border-slate-900 cursor-pointer select-none">
                          <input 
                            type="checkbox" 
                            checked={preferences.notifications.attendanceAlerts} 
                            onChange={(e) => setPreferences({
                              ...preferences, 
                              notifications: { ...preferences.notifications, attendanceAlerts: e.target.checked }
                            })} 
                            className="mt-0.5 text-blue-600 rounded bg-transparent border-slate-300 dark:border-slate-700 focus:ring-0"
                          />
                          <div>
                            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide block">Attendance Reminders</span>
                            <span className="text-[8px] text-slate-400 dark:text-slate-500 mt-0.5 block">Notify about check-in status.</span>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Category C: Availability settings */}
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 space-y-4">
                      <div>
                        <h4 className="text-[10px] font-bold text-slate-800 dark:text-white uppercase tracking-wider">Availability & Productivity Settings</h4>
                        <p className="text-[9px] text-slate-450 mt-0.5">Define your daily timezone and productivity limits.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 block">Work hours timezone</label>
                          <select 
                            value={preferences.availability.timezone} 
                            onChange={(e) => setPreferences({
                              ...preferences, 
                              availability: { ...preferences.availability, timezone: e.target.value }
                            })} 
                            className="saas-input w-full text-xs px-3 py-2.5"
                          >
                            <option value="GMT+05:30 (IST)">GMT+05:30 (IST)</option>
                            <option value="GMT+00:00 (UTC)">GMT+00:00 (UTC)</option>
                            <option value="GMT-05:00 (EST)">GMT-05:00 (EST)</option>
                            <option value="GMT-08:00 (PST)">GMT-08:00 (PST)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 block">Daily Task Goal</label>
                          <input 
                            type="number" 
                            min={1} 
                            max={20}
                            value={preferences.productivity.dailyTaskGoal} 
                            onChange={(e) => setPreferences({
                              ...preferences, 
                              productivity: { ...preferences.productivity, dailyTaskGoal: parseInt(e.target.value) || 5 }
                            })} 
                            className="saas-input w-full text-xs px-3 py-2" 
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 block">Focus Session Time (Min)</label>
                          <input 
                            type="number" 
                            min={5} 
                            max={120}
                            value={preferences.productivity.focusModeTime} 
                            onChange={(e) => setPreferences({
                              ...preferences, 
                              productivity: { ...preferences.productivity, focusModeTime: parseInt(e.target.value) || 25 }
                            })} 
                            className="saas-input w-full text-xs px-3 py-2" 
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800/60">
                        <button type="button" onClick={handleSaveProfile} disabled={saving} className="saas-btn-primary flex items-center gap-1.5 cursor-pointer">
                          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                          Save Preferences
                        </button>
                      </div>
                    </div>

                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
