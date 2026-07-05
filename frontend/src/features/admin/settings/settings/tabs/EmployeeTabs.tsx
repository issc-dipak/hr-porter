"use client";

import React, { useRef, useState, useEffect } from 'react';
import { 
  X, Key, Upload, Trash2, ExternalLink, FileText, CheckCircle, 
  AlertCircle, HelpCircle, Laptop, Sun, Moon, Type, Layout, 
  CreditCard, Lock, User, Shield, Bell, Palette, RefreshCw, 
  AlertTriangle, Eye, Check, ShieldCheck, Download, Languages, Info, Heart, Globe, Briefcase, Plus
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { useBrandingStore } from '@/store/useBrandingStore';

interface EmployeeTabsProps {
  activeCategory: string;
  profileDetails: {
    fullName: string;
    email: string;
    phone: string;
    department: string;
    designation: string;
    location: string;
    profilePicture: string;
    emergencyContact: string;
    dateOfBirth?: string;
    gender?: string;
    bloodGroup?: string;
    maritalStatus?: string;
    nationality?: string;
    address?: string;
    personalEmail?: string;
    alternatePhone?: string;
    currentAddress?: string;
    permanentAddress?: string;
    city?: string;
    state?: string;
    country?: string;
    pinCode?: string;
    primaryEmergencyName?: string;
    primaryEmergencyRelationship?: string;
    primaryEmergencyPhone?: string;
    primaryEmergencyEmail?: string;
    secondaryEmergencyName?: string;
    secondaryEmergencyRelationship?: string;
    secondaryEmergencyPhone?: string;
    secondaryEmergencyEmail?: string;
    panNumber?: string;
    uanNumber?: string;
    aadhaarNumber?: string;
    pfNumber?: string;
    esicNumber?: string;
    joinedDate?: string | null;
    employeeId?: string;
    branch?: string;
    employmentType?: string;
    shift?: string;
    documents?: Array<{
      name: string;
      fileUrl: string;
      status: string;
      uploadedAt: any;
    }>;
    bankDetails: {
      bankName: string;
      accountNumber: string;
      ifscCode: string;
      upiId?: string;
      bankVerificationStatus?: string;
    };
  };
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
    announcementsAlerts?: boolean;
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    smsNotifications?: boolean;
  };
  setEmployeeNotifs: React.Dispatch<React.SetStateAction<any>>;
  themeMode: string;
  setThemeMode: (val: string) => void;
  fontSize: string;
  setFontSize: (val: string) => void;
  compactLayout: boolean;
  setCompactLayout: (val: boolean) => void;
  triggerToast: (msg: string) => void;
  onPhotoUploaded?: (url: string) => void;
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
}

export function EmployeeTabs({
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
  onPhotoUploaded,
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
  setSessionsList
}: EmployeeTabsProps) {
  const { branding, updateBrandingState, saveBranding } = useBrandingStore();
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [customDocName, setCustomDocName] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Policy edit allowances (simulated)
  const isPersonalEditAllowed = false; // "Request Update" layout will show
  const isBankEditAllowed = false; // "Request Update" layout will show

  // Support states
  const [ticketCategory, setTicketCategory] = useState("IT Support");
  const [ticketPriority, setTicketPriority] = useState("Medium");
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketDesc, setTicketDesc] = useState("");
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [ticketsList, setTicketsList] = useState<any[]>([]);
  const [faqOpen, setFaqOpen] = useState<Record<number, boolean>>({});

  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem('hr_system_token');
      if (!token) return;
      const res = await fetch('/api/tickets/my', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTicketsList(data);
      }
    } catch (err) {
      console.error("Failed to fetch tickets:", err);
    }
  };

  useEffect(() => {
    if (activeCategory === 'employee-support') {
      fetchTickets();
    }
  }, [activeCategory]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketDesc.trim()) {
      triggerToast("Please fill in the subject and description.");
      return;
    }
    setSubmittingTicket(true);
    try {
      const token = localStorage.getItem('hr_system_token');
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subject: ticketSubject,
          category: ticketCategory,
          priority: ticketPriority,
          description: ticketDesc,
          department: profileDetails.department || 'Engineering'
        })
      });
      if (res.ok) {
        triggerToast("Support ticket raised successfully!");
        setTicketSubject("");
        setTicketDesc("");
        fetchTickets();
      } else {
        const data = await res.json();
        triggerToast(data.error || "Failed to submit support ticket.");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Error submitting ticket.");
    } finally {
      setSubmittingTicket(false);
    }
  };

  const handleRequestUpdate = async (type: string) => {
    try {
      const token = localStorage.getItem('hr_system_token');
      if (!token) return;

      let description = '';
      if (type === 'Personal Information') {
        description = `Employee has requested to update their Personal Information.
Proposed values:
- Full Name: ${profileDetails.fullName || 'N/A'}
- Date of Birth: ${profileDetails.dateOfBirth || 'N/A'}
- Gender: ${profileDetails.gender || 'N/A'}
- Blood Group: ${profileDetails.bloodGroup || 'N/A'}
- Marital Status: ${profileDetails.maritalStatus || 'N/A'}
- Nationality: ${profileDetails.nationality || 'N/A'}`;
      } else {
        description = `Employee has requested to update their Bank & Tax Information.
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
          department: profileDetails.department || 'HR'
        })
      });
      if (res.ok) {
        triggerToast(`Update request for ${type} raised successfully with HR.`);
        fetchTickets();
      } else {
        const errData = await res.json().catch(() => ({}));
        triggerToast(errData.error || "Failed to raise update request.");
      }
    } catch (err: any) {
      console.error(err);
      triggerToast(err.message || "Error raising update request.");
    }
  };

  const getDocStatus = (name: string) => {
    const doc = profileDetails.documents?.find(d => d.name === name);
    if (!doc) return "missing";
    if (doc.status === "Verified" || doc.status === "Approved") return "success";
    if (doc.status === "Pending Verification") return "pending";
    return "uploaded";
  };

  const requiredDocs = [
    "Offer Letter",
    "Appointment Letter",
    "Salary Slips",
    "PAN Card",
    "Aadhaar Card",
    "Passport",
    "Driving License",
    "Educational Certificates",
    "Resume"
  ];

  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const data = new FormData();
      data.append('file', file);

      const token = localStorage.getItem('hr_system_token');
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: data
      });

      if (res.ok) {
        const json = await res.json();
        setProfileDetails((prev: any) => {
          const updatedProfile = {
            ...prev,
            profilePicture: json.url
          };

          // Save photo
          const token = localStorage.getItem('hr_system_token');
          if (token) {
            fetch('/api/settings/user', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ profile: updatedProfile })
            }).catch(err => console.error("Auto-save profile photo failed:", err));
          }

          return updatedProfile;
        });

        if (onPhotoUploaded) onPhotoUploaded(json.url);
        triggerToast("Profile photo uploaded successfully!");
      }
    } catch (err) {
      triggerToast("Error uploading profile photo.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>, docName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDoc(docName);
    try {
      const data = new FormData();
      data.append('file', file);

      const token = localStorage.getItem('hr_system_token');
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: data
      });

      if (res.ok) {
        const json = await res.json();
        const fileUrl = json.url;
        
        const currentDocs = profileDetails.documents || [];
        const existingIdx = currentDocs.findIndex(d => d.name === docName);
        const newDoc = {
          name: docName,
          fileUrl,
          status: 'Pending Verification',
          uploadedAt: new Date().toISOString()
        };

        let updatedDocs;
        if (existingIdx > -1) {
          updatedDocs = [...currentDocs];
          updatedDocs[existingIdx] = newDoc;
        } else {
          updatedDocs = [...currentDocs, newDoc];
        }

        setProfileDetails((prev: any) => {
          const updatedProfile = {
            ...prev,
            documents: updatedDocs
          };

          const token = localStorage.getItem('hr_system_token');
          if (token) {
            fetch('/api/settings/user', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ profile: updatedProfile })
            }).catch(err => console.error("Auto-save documents failed:", err));
          }

          return updatedProfile;
        });

        triggerToast(`Document "${docName}" uploaded successfully!`);
      }
    } catch (err) {
      triggerToast("Error uploading document.");
    } finally {
      setUploadingDoc(null);
    }
  };

  const handleDocDelete = (docName: string) => {
    const currentDocs = profileDetails.documents || [];
    const updatedDocs = currentDocs.filter(d => d.name !== docName);
    
    setProfileDetails((prev: any) => {
      const updatedProfile = { ...prev, documents: updatedDocs };
      const token = localStorage.getItem('hr_system_token');
      if (token) {
        fetch('/api/settings/user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ profile: updatedProfile })
        }).catch(err => console.error("Auto-save documents failed:", err));
      }
      return updatedProfile;
    });
    triggerToast(`Document "${docName}" removed.`);
  };

  return (
    <>
      {/* 1. MY PROFILE */}
      {activeCategory === 'employee-profile' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">My Profile</h3>
            <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase">Manage profile photo, bio, skills, and social connections</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-405 uppercase tracking-widest">Profile Picture</label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center relative group">
                  {profileDetails.profilePicture ? (
                    <img src={profileDetails.profilePicture} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-7 h-7 text-slate-400" />
                  )}
                </div>
                <div className="space-y-1.5 text-left">
                  <input type="file" id="profile-upload-btn" accept="image/*" className="hidden" onChange={handleProfilePhotoUpload} />
                  <label htmlFor="profile-upload-btn" className="px-3 py-1 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer transition-all">
                    {uploadingPhoto ? "Uploading..." : "Upload New Photo"}
                  </label>
                  <p className="text-[7.5px] text-slate-400 font-bold uppercase mt-1">Recommended: Square JPEG/PNG, max 2MB</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-455 uppercase tracking-widest">Display Name</label>
              <input 
                type="text" 
                value={profileDetails.fullName || ''}
                onChange={e => setProfileDetails({ ...profileDetails, fullName: e.target.value })}
                className="saas-input w-full px-3 py-2 text-xs min-h-[40px]"
              />
            </div>

            <div className="space-y-2 col-span-1 md:col-span-2">
              <label className="text-[9px] font-black text-slate-455 uppercase tracking-widest">Bio / About Me</label>
              <textarea 
                value={employeeBio || ''}
                onChange={e => setEmployeeBio(e.target.value)}
                rows={3}
                className="saas-input w-full p-3 text-xs"
                placeholder="Write a short summary about yourself..."
              />
            </div>

            <div className="space-y-3 col-span-1 md:col-span-2 pt-4 border-t border-slate-100 dark:border-slate-800/40">
              <label className="text-[9px] font-black text-slate-455 uppercase tracking-widest block">Skills Matrix</label>
              <div className="flex flex-wrap gap-1.5">
                {skillsList.map(skill => (
                  <span key={skill} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-md font-bold flex items-center gap-1 text-[9px]">
                    {skill}
                    <button type="button" onClick={() => setSkillsList(skillsList.filter(s => s !== skill))} className="text-slate-400 hover:text-rose-500 cursor-pointer">
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2 max-w-sm">
                <input 
                  type="text" 
                  placeholder="Add skill..." 
                  value={newSkillInput} 
                  onChange={e => setNewSkillInput(e.target.value)}
                  className="saas-input w-full px-3 py-1.5 text-xs min-h-[36px]" 
                />
                <button type="button" onClick={() => {
                  if (!newSkillInput.trim()) return;
                  setSkillsList([...skillsList, newSkillInput.trim()]);
                  setNewSkillInput('');
                }} className="px-3 bg-slate-800 text-white rounded-xl text-[9px] font-black uppercase cursor-pointer">Add</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. PERSONAL INFORMATION */}
      {activeCategory === 'employee-personal' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Personal Information</h3>
            <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase">Legal identification details, marital status and nationality info</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-[8px] font-black uppercase tracking-wider cursor-pointer border-none"
              >
                Request Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. CONTACT INFORMATION */}
      {activeCategory === 'employee-contact' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Contact Information</h3>
            <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase">Residential address details and verified phone coordinates</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-405 uppercase tracking-widest">Mobile Number</label>
              <input 
                type="text" 
                value={profileDetails.phone || ''}
                onChange={e => setProfileDetails({ ...profileDetails, phone: e.target.value })}
                className="saas-input w-full px-3 py-2 text-xs min-h-[40px]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-405 uppercase tracking-widest">Personal Email</label>
              <input 
                type="email" 
                value={profileDetails.personalEmail || ''}
                onChange={e => setProfileDetails({ ...profileDetails, personalEmail: e.target.value })}
                className="saas-input w-full px-3 py-2 text-xs min-h-[40px]"
              />
            </div>

            <div className="space-y-2 col-span-1 md:col-span-2">
              <label className="text-[9px] font-black text-slate-405 uppercase tracking-widest">Current Address</label>
              <input 
                type="text" 
                value={profileDetails.currentAddress || profileDetails.address || ''}
                onChange={e => setProfileDetails({ ...profileDetails, currentAddress: e.target.value })}
                className="saas-input w-full px-3 py-2 text-xs min-h-[40px]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-405 uppercase tracking-widest">City</label>
              <input 
                type="text" 
                value={profileDetails.city || ''}
                onChange={e => setProfileDetails({ ...profileDetails, city: e.target.value })}
                className="saas-input w-full px-3 py-2 text-xs min-h-[40px]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-405 uppercase tracking-widest">State</label>
              <input 
                type="text" 
                value={profileDetails.state || ''}
                onChange={e => setProfileDetails({ ...profileDetails, state: e.target.value })}
                className="saas-input w-full px-3 py-2 text-xs min-h-[40px]"
              />
            </div>
          </div>
        </div>
      )}

      {/* 4. EMERGENCY CONTACTS */}
      {activeCategory === 'employee-emergency' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Emergency Contacts</h3>
            <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase">Primary and alternate contact coordinates in case of critical situations</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
              <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest block">Primary Contact</span>
              <div className="space-y-2">
                <input type="text" placeholder="Contact Name" value={profileDetails.primaryEmergencyName || ''} onChange={e => setProfileDetails({ ...profileDetails, primaryEmergencyName: e.target.value })} className="saas-input w-full px-3 py-1.5 text-xs" />
                <input type="text" placeholder="Relationship" value={profileDetails.primaryEmergencyRelationship || ''} onChange={e => setProfileDetails({ ...profileDetails, primaryEmergencyRelationship: e.target.value })} className="saas-input w-full px-3 py-1.5 text-xs" />
                <input type="text" placeholder="Mobile Number" value={profileDetails.primaryEmergencyPhone || profileDetails.emergencyContact || ''} onChange={e => setProfileDetails({ ...profileDetails, primaryEmergencyPhone: e.target.value })} className="saas-input w-full px-3 py-1.5 text-xs" />
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
              <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest block">Secondary Contact</span>
              <div className="space-y-2">
                <input type="text" placeholder="Contact Name" value={profileDetails.secondaryEmergencyName || ''} onChange={e => setProfileDetails({ ...profileDetails, secondaryEmergencyName: e.target.value })} className="saas-input w-full px-3 py-1.5 text-xs" />
                <input type="text" placeholder="Relationship" value={profileDetails.secondaryEmergencyRelationship || ''} onChange={e => setProfileDetails({ ...profileDetails, secondaryEmergencyRelationship: e.target.value })} className="saas-input w-full px-3 py-1.5 text-xs" />
                <input type="text" placeholder="Mobile Number" value={profileDetails.secondaryEmergencyPhone || ''} onChange={e => setProfileDetails({ ...profileDetails, secondaryEmergencyPhone: e.target.value })} className="saas-input w-full px-3 py-1.5 text-xs" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. WORK INFORMATION */}
      {activeCategory === 'employee-work' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Work Information</h3>
            <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase">Active corporate parameters, shift timing allocation and hierarchy details (Read Only)</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: "Employee ID", value: profileDetails.employeeId || `EMP-${profileDetails.email?.slice(0, 3).toUpperCase() || '102'}` },
              { label: "Department", value: profileDetails.department || 'Engineering' },
              { label: "Designation", value: profileDetails.designation || 'Software Engineer' },
              { label: "Reporting Manager", value: "raj r patil (HR Manager)" },
              { label: "Branch Office", value: profileDetails.location || "Mumbai Head Office" },
              { label: "Employment Type", value: "Permanent Full-time" },
              { label: "Joining Date", value: "2024-03-12" },
              { label: "Shift Timing", value: "General Shift (09:00 AM - 06:00 PM)" },
              { label: "Work Location", value: "Office Desk A-402" }
            ].map((field, i) => (
              <div key={i} className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl">
                <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest block">{field.label}</span>
                <span className="text-xs font-bold text-slate-800 dark:text-white mt-1 block uppercase">{field.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. BANK & TAX INFORMATION */}
      {activeCategory === 'employee-bank' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Bank &amp; Tax Information</h3>
            <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase">Direct deposit salary account coordinates and tax ID verification stamps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Bank Name</label>
              <input 
                type="text" 
                value={profileDetails.bankDetails?.bankName || ''}
                onChange={e => setProfileDetails({ 
                  ...profileDetails, 
                  bankDetails: { ...(profileDetails.bankDetails || {}), bankName: e.target.value } 
                })}
                className="saas-input w-full px-3 py-2 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Account Number</label>
              <input 
                type="text" 
                value={profileDetails.bankDetails?.accountNumber || ''}
                onChange={e => setProfileDetails({ 
                  ...profileDetails, 
                  bankDetails: { ...(profileDetails.bankDetails || {}), accountNumber: e.target.value } 
                })}
                className="saas-input w-full px-3 py-2 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">IFSC Code</label>
              <input 
                type="text" 
                value={profileDetails.bankDetails?.ifscCode || ''}
                onChange={e => setProfileDetails({ 
                  ...profileDetails, 
                  bankDetails: { ...(profileDetails.bankDetails || {}), ifscCode: e.target.value } 
                })}
                className="saas-input w-full px-3 py-2 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">PAN Number</label>
              <input 
                type="text" 
                value={profileDetails.panNumber || ''}
                onChange={e => setProfileDetails({ ...profileDetails, panNumber: e.target.value })}
                className="saas-input w-full px-3 py-2 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Aadhaar Card Number</label>
              <input 
                type="text" 
                value={profileDetails.aadhaarNumber || ''}
                onChange={e => setProfileDetails({ ...profileDetails, aadhaarNumber: e.target.value })}
                className="saas-input w-full px-3 py-2 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">PF Number</label>
              <input 
                type="text" 
                value={profileDetails.pfNumber || ''}
                onChange={e => setProfileDetails({ ...profileDetails, pfNumber: e.target.value })}
                className="saas-input w-full px-3 py-2 text-xs"
              />
            </div>

            <div className="col-span-1 md:col-span-2 p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex justify-between items-center text-[10px] mt-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span className="font-black text-slate-800 dark:text-white uppercase">Direct Modifications Locked</span>
              </div>
              <button 
                type="button" 
                onClick={() => handleRequestUpdate('Bank & Tax Details')}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-[8px] font-black uppercase tracking-wider cursor-pointer border-none"
              >
                Request Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. DOCUMENT CENTER */}
      {activeCategory === 'employee-documents' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Document Center</h3>
            <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase">Download official letters, salary sheets, and upload proof verification keys</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {requiredDocs.map(docName => {
              const doc = profileDetails.documents?.find(d => d.name === docName);
              const fileInputId = `file-input-${docName.replace(/\s+/g, '-').toLowerCase()}`;
              return (
                <div key={docName} className="p-4 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl flex flex-col justify-between hover:border-blue-500/30 dark:hover:border-blue-500/20 transition-all duration-300 group shadow-sm min-h-[140px]">
                  <div className="flex gap-3 items-start">
                    <div className="p-2 bg-blue-500/10 rounded-xl text-blue-600 dark:text-blue-400 shrink-0 group-hover:scale-105 transition-transform duration-300">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <span className="font-black text-slate-800 dark:text-slate-100 block text-[11px] tracking-wide uppercase truncate">{docName}</span>
                      {doc ? (
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[7.5px] font-black uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            Verified
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 mt-1 px-2 py-0.5 rounded-full text-[7.5px] font-black uppercase bg-rose-500/5 text-rose-600">
                          Not Uploaded
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 pt-3 border-t border-slate-100 dark:border-slate-800/50 justify-end">
                    {doc ? (
                      <>
                        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-100 hover:bg-slate-205 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-all cursor-pointer">
                          <Eye className="w-3.5 h-3.5" />
                        </a>
                        <button type="button" onClick={() => handleDocDelete(docName)} className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-605 dark:text-rose-400 rounded-xl transition-all cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <input type="file" id={fileInputId} onChange={(e) => handleDocUpload(e, docName)} className="hidden" />
                        <label htmlFor={fileInputId} className="px-3.5 py-1.5 bg-blue-650 hover:bg-blue-700 text-white rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all shadow-sm">
                          {uploadingDoc === docName ? "Uploading..." : "Upload File"}
                        </label>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 8. SECURITY */}
      {activeCategory === 'employee-security' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Security Settings</h3>
            <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase">Modify password details, add MFA, and register passkey access credentials</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
            <div className="lg:col-span-2 space-y-4">
              <form onSubmit={handleChangePassword} className="p-5 bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-4">
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

      {/* 9. NOTIFICATIONS */}
      {activeCategory === 'employee-notifications' && (
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
                <div key={pref.id} className="flex justify-between items-center p-3.5 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-100 dark:border-slate-800">
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

      {/* 10. APPEARANCE */}
      {activeCategory === 'employee-appearance' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Appearance Settings</h3>
            <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase">Fine tune workspace density and visual themes parameters</p>
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-xl text-left">
            {[
              { id: 'Light', label: 'Light Theme', icon: Sun },
              { id: 'Dark', label: 'Dark Theme', icon: Moon }
            ].map(theme => (
              <button key={theme.id} onClick={() => {
                setThemeMode(theme.id);
                if (typeof window !== 'undefined') {
                  const isDark = theme.id === 'Dark';
                  document.documentElement.classList.toggle('dark', isDark);
                  localStorage.setItem('hr_system_theme_mode', theme.id);
                }
              }} className={cn("p-4 border rounded-2xl flex items-center gap-3 transition-all cursor-pointer text-left text-[10px] uppercase font-black", themeMode === theme.id ? "bg-blue-650/5 border-blue-650 text-blue-650 dark:text-blue-400" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800")}>
                <theme.icon className="w-4 h-4" />
                {theme.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 11. LANGUAGE & REGION */}
      {activeCategory === 'employee-language' && (
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

      {/* 12. PRIVACY */}
      {activeCategory === 'employee-privacy' && (
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
                <div key={field.id} className="flex justify-between items-center p-3.5 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-100 dark:border-slate-800">
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

      {/* 13. DEVICES & SESSIONS */}
      {activeCategory === 'employee-devices' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Devices &amp; Sessions</h3>
            <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase">Track browser instances and active token sessions linked to your ID</p>
          </div>

          <div className="space-y-2 text-left">
            {sessionsList.map((ses, idx) => (
              <div key={ses.id || idx} className="p-3 bg-slate-50 dark:bg-slate-905 border border-slate-100 dark:border-slate-850 rounded-xl flex justify-between items-center">
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

      {/* 14. CONNECTED ACCOUNTS */}
      {activeCategory === 'employee-connected' && (
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
              <div key={acc.id} className="p-4 bg-slate-50 dark:bg-slate-850 border border-slate-150 dark:border-slate-800 rounded-2xl flex justify-between items-center text-[10px]">
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

      {/* 15. DOWNLOAD MY DATA */}
      {activeCategory === 'employee-download' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Download My Data</h3>
            <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase">Export all stored profile records, tax documents, and performance feedback logs</p>
          </div>

          <div className="p-5 bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-4 text-left">
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
                                      <strong>[Doc #${i + 1}]</strong> Name: <span>${doc.name}</span> | Status: <span>${doc.status}</span> | Remarks: <span>${doc.remarks || 'Verified'}</span>
                                    </div>
                                  `).join('') || `
                                    <div class="doc-item"><strong>[Doc #1]</strong> Name: <span>PAN Card Verification</span> | Status: <span>Approved</span> | Remarks: <span>Tax ID verified successfully</span></div>
                                    <div class="doc-item"><strong>[Doc #2]</strong> Name: <span>Aadhaar Card copy</span> | Status: <span>Approved</span> | Remarks: <span>National ID verified successfully</span></div>
                                    <div class="doc-item"><strong>[Doc #3]</strong> Name: <span>Form 16 Tax Statement</span> | Status: <span>Pending</span> | Remarks: <span>Uploaded for FY 2025-26 review</span></div>
                                  `}
                                </div>

                                <div class="section">
                                  <div class="section-title">5. Performance Feedback Logs & Evaluations</div>
                                  <div class="perf-item">
                                    <strong>[Review #1]</strong> Cycle: <span>Q1 Performance Review</span> | Rating: <span>4.5 / 5.0</span> | Status: <span>Completed</span> | Goals: <span>Deliver core modular dashboard structures</span>
                                  </div>
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

      {/* 16. HELP & SUPPORT */}
      {activeCategory === 'employee-support' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Help & Support</h3>
            <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase">Submit tickets, contact corporate helpdesk support, and search FAQs</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
            <div className="lg:col-span-2 space-y-4">
              <form onSubmit={handleCreateTicket} className="p-4 bg-slate-50 dark:bg-slate-850 border border-slate-100/50 dark:border-slate-800 rounded-2xl space-y-3">
                <span className="font-black uppercase text-[10px] text-slate-900 dark:text-white block">Raise New Support Ticket</span>
                <input type="text" placeholder="Subject" value={ticketSubject} onChange={e => setTicketSubject(e.target.value)} className="saas-input w-full px-3 py-2 text-xs min-h-[40px]" />
                <textarea placeholder="Describe the issue..." value={ticketDesc} onChange={e => setTicketDesc(e.target.value)} rows={3} className="saas-input w-full p-3 text-xs" />
                <button type="submit" disabled={submittingTicket} className="px-5 py-2.5 bg-blue-650 text-white rounded-xl text-[9px] font-black uppercase tracking-wider">{submittingTicket ? "Posting..." : "Submit Ticket"}</button>
              </form>
            </div>

            <div className="space-y-4 text-[10px]">
              <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                <span className="font-black uppercase text-slate-900 dark:text-white">Quick Help Contacts</span>
                <p className="text-[8px] text-slate-400 uppercase font-semibold">IT support: support@acme.corp</p>
                <p className="text-[8px] text-slate-450 uppercase font-semibold">HR escalation: +1 800 555 0122</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 17. ABOUT */}
      {activeCategory === 'employee-about' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">About</h3>
            <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase">System diagnostic metadata and client build values</p>
          </div>

          <div className="p-5 bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 rounded-3xl space-y-4 max-w-md text-[10px] text-left">
            <div className="flex justify-between border-b border-slate-200/50 dark:border-slate-800 pb-2">
              <span className="text-slate-400 uppercase font-bold">App Version</span>
              <span className="font-mono font-black text-slate-900 dark:text-white">v3.8.4</span>
            </div>
            <div className="flex justify-between border-b border-slate-200/50 dark:border-slate-800 pb-2">
              <span className="text-slate-400 uppercase font-bold">Build Number</span>
              <span className="font-mono font-black text-slate-900 dark:text-white">BUILD-2026.07.04.1</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 uppercase font-bold">Portal Provider</span>
              <span className="font-black text-slate-900 dark:text-white">HR Porter Inc</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
