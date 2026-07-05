"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Building, Users, User, CreditCard, Clock, Calendar, Briefcase, Target, Shield, 
  Bell, Key, ArrowRight, CheckCircle, Database, Layout, Sparkles, Plus, 
  Trash2, Globe, ShieldAlert, FileText, Smartphone, Languages, RefreshCcw, 
  Power, Code, Info, Check, Eye, Save, X, Settings, Activity, KeyRound, 
  Workflow, Server, HelpCircle, Download, ShieldCheck, Heart, Moon, Sun, Lock,
  MessageSquare, Laptop, Palette, Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";
import { useUIStore } from '@/store/uiStore';
import { AdminTabs } from './settings/tabs/AdminTabs';
import { HRTabs } from './settings/tabs/HRTabs';
import { EmployeeTabs } from './settings/tabs/EmployeeTabs';
import { BrandingTab } from './settings/tabs/BrandingTab';

type Role = 'Admin' | 'HR' | 'Employee';

interface SettingsPageProps {
  userRole: Role;
  setUserRole: (role: Role) => void;
  addNotification?: (msg: string) => void;
  profile: any;
  setProfile: React.Dispatch<React.SetStateAction<any>>;
  notifications: any;
  setNotifications: React.Dispatch<React.SetStateAction<any>>;
  toggleTheme?: (useDark: boolean) => void;
  isDarkMode?: boolean;
}

export default function SettingsPage({ 
  userRole, 
  setUserRole, 
  addNotification,
  profile,
  setProfile,
  notifications: propNotifs,
  setNotifications: setPropNotifs,
  toggleTheme,
  isDarkMode
}: SettingsPageProps) {
  
  const [activeSettingsView, setActiveSettingsView] = useState<Role>(userRole);
  const [activeCategory, setActiveCategory] = useState<string>('company');
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // -------------------------------------------------------------
  // STATE DEFINITIONS
  // -------------------------------------------------------------

  // Admin -> Company settings
  const [companyBranding, setCompanyBranding] = useState({
    name: 'Acme Global Technologies Ltd',
    logo: '',
    timezone: 'UTC+05:30 (Kolkata)',
    currency: 'INR (₹)',
    departments: ['Engineering', 'Design', 'HR', 'Marketing', 'Sales', 'Finance']
  });

  // Admin -> Users & Roles
  const [usersList, setUsersList] = useState<any[]>([]);
  const [newUserFullName, setNewUserFullName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<Role>('Employee');
  const [newUserDepartment, setNewUserDepartment] = useState('Engineering');
  const [creatingUser, setCreatingUser] = useState(false);

  // Admin -> Permissions Matrix
  const [permissionsMatrix, setPermissionsMatrix] = useState<Record<string, Record<string, boolean>>>({
    'Admin': { 'Access System Logs': true, 'Run Payroll': true, 'Manage Roles': true, 'Configure Integrations': true },
    'HR': { 'Access System Logs': false, 'Run Payroll': true, 'Manage Roles': true, 'Configure Integrations': false },
    'Employee': { 'Access System Logs': false, 'Run Payroll': false, 'Manage Roles': false, 'Configure Integrations': false }
  });

  // Admin -> Payroll settings
  const [payrollConfig, setPayrollConfig] = useState({
    salaryCycle: 'Monthly (1st)',
    overtimeRate: '1.5x',
    taxRegime: 'Standard 2026',
    bonusRules: '15%',
    autoRelease: true
  });

  // Admin -> Attendance shift timings
  const [attendanceConfig, setAttendanceConfig] = useState({
    shiftStart: '09:00 AM',
    shiftEnd: '06:00 PM',
    graceBuffer: '15 Mins',
    maxBreakTime: '60 Mins',
    lateDeductionActive: false,
    biometricSync: true
  });

  const [leaveConfig, setLeaveConfig] = useState({
    leaveTypes: [
      { name: 'Sick Leave', days: 12 },
      { name: 'Casual Leave', days: 15 },
      { name: 'Paid Leave', days: 20 },
    ],
    holidayCalendar: [
      { title: 'New Year', date: '2026-01-01' },
      { title: 'Independence Day', date: '2026-08-15' },
      { title: 'Diwali', date: '2026-11-08' },
    ],
    approvalFlow: 'Manager -> HR -> Approved',
    hrMaxLeaves: 24,
    employeeMaxLeaves: 24
  });

  // Admin -> Recruitment Settings
  const [recruitmentConfig, setRecruitmentConfig] = useState({
    interviewStages: ['CV Screening', 'First Technical', 'System Design', 'Managerial Round', 'Offer Letter'],
    jobTemplates: [
      { title: 'Software Engineer', description: 'Fullstack Next.js developer with TypeScript experience.' },
      { title: 'Product Designer', description: 'UX designer to build enterprise dashboards using Figma.' }
    ]
  });

  // Admin -> Security rules
  const [securityConfig, setSecurityConfig] = useState({
    minPasswordLength: 8,
    twoFactorAuthActive: true,
    sessionExpiryMinutes: 60,
    ipRestrictions: '192.168.1.0/24'
  });

  // Admin -> Notification configurations
  const [notificationConfig, setNotificationConfig] = useState({
    emailNotifications: true,
    pushNotifications: true,
    hrAlerts: true,
    employeeReminders: true
  });

  // Admin -> Theme configurations
  const [themeSettings, setThemeSettings] = useState({
    defaultThemeMode: 'Dark',
    defaultLanguage: 'English (US)'
  });

  // Admin -> New Categories DB States
  const [orgConfig, setOrgConfig] = useState({
    branches: ['Headquarters (Mumbai)', 'Technical Center (Bengaluru)', 'Sales Office (Delhi)'],
    designations: ['Software Engineer', 'Technical Lead', 'Product Manager', 'HR Manager', 'Sales Specialist'],
    costCenters: ['Tech Ops', 'Product Development', 'Sales HQ']
  });
  const [workflowConfig, setWorkflowConfig] = useState({
    onboarding: [],
    offboarding: []
  });
  const [integrationsConfig, setIntegrationsConfig] = useState({
    google: 'Connected',
    m365: 'Configure',
    slack: 'Connected'
  });
  const [billingConfig, setBillingConfig] = useState({
    plan: 'Enterprise Growth',
    seats: 14
  });
  const [backupConfig, setBackupConfig] = useState({
    autoBackup: true,
    snapshots: [
      { file: 'backup_system_v2.6.2_20260625.zip', size: '24.2 MB', date: 'June 25, 2026' },
      { file: 'backup_system_v2.6.1_20260618.zip', size: '23.8 MB', date: 'June 18, 2026' }
    ]
  });

  // Admin/HR Workplace Chat settings
  const [chatConfig, setChatConfig] = useState({
    workspaceName: 'Acme Workspace',
    workspaceLogo: '',
    allowEmployeeChannelCreate: true,
    allowEmployeeChannelPrivateCreate: true,
    allowAnnouncementsPostAll: false,
    allowEmployeeEditDelete: true,
    restrictedKeywords: 'spam, offensive_word, leak'
  });

  // Employee specific chat settings
  const [chatDisplayName, setChatDisplayName] = useState('');
  const [chatStatusText, setChatStatusText] = useState('');
  const [chatStatusEmoji, setChatStatusEmoji] = useState('');
  const [chatPresence, setChatPresence] = useState('online');
  const [chatMuteSound, setChatMuteSound] = useState(false);
  const [chatNotifLevel, setChatNotifLevel] = useState('all');
  const [chatDndActive, setChatDndActive] = useState(false);

  // HR Specific -> Hiring workflow setup
  const [hiringWorkflow, setHiringWorkflow] = useState('Standard stages + System Design Check');
  const [interviewSetup, setInterviewSetup] = useState('Automated calendar invites on panel confirmation');

  // HR Specific -> Onboarding & Employee
  const [onboardingDocs, setOnboardingDocs] = useState([
    { id: 1, docName: 'Aadhar Card / Gov ID', mandatory: true },
    { id: 2, docName: 'Previous Employer Experience Letter', mandatory: true },
    { id: 3, docName: 'Signed Offer Acceptance Copy', mandatory: true }
  ]);
  const [newOnboardingDoc, setNewOnboardingDoc] = useState('');
  const [employeeCategories, setEmployeeCategories] = useState(['Full-time', 'Part-time', 'Contract', 'Intern']);
  const [newCategory, setNewCategory] = useState('');

  // HR Specific -> Attendance
  const [attendanceMonitoringActive, setAttendanceMonitoringActive] = useState(true);
  const [shiftRosterRule, setShiftRosterRule] = useState('Auto roll shifts monthly');

  // HR Specific -> Performance cycles
  const [kpiWeightage, setKpiWeightage] = useState({
    kpiScore: 40,
    peerScore: 30,
    managerScore: 30,
    cycleType: 'Quarterly'
  });

  // Employee specific settings & states
  const [employeeBio, setEmployeeBio] = useState('Senior Specialist');
  const [skillsList, setSkillsList] = useState<string[]>(['React', 'TypeScript', 'Tailwind CSS']);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [employeePrivacy, setEmployeePrivacy] = useState({
    showBirthday: true,
    showPhoneNumber: true,
    showEmail: true,
    showProfilePicture: true,
    showSkills: true,
    showWorkAnniversary: true
  });
  const [employeeNotifs, setEmployeeNotifs] = useState({
    taskReminders: true,
    payrollAlerts: true,
    attendanceAlerts: true
  });
  const [themeMode, setThemeMode] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('hr_system_theme_mode') || 'Dark';
    }
    return 'Dark';
  });
  const [fontSize, setFontSize] = useState<string>('Medium');
  const [compactLayout, setCompactLayout] = useState(false);
  const [focusModeTime, setFocusModeTime] = useState(25);
  const [dailyTaskGoal, setDailyTaskGoal] = useState(5);
  const [availability, setAvailability] = useState({
    startHour: '09:00 AM',
    endHour: '06:00 PM',
    timezone: 'GMT+05:30 (IST)',
    googleCalendarSynced: true
  });

  const [profileDetails, setProfileDetails] = useState({
    fullName: '',
    email: '',
    phone: '',
    department: '',
    designation: '',
    location: '',
    profilePicture: '',
    emergencyContact: '',
    dateOfBirth: '',
    gender: '',
    bloodGroup: '',
    address: '',
    panNumber: '',
    uanNumber: '',
    joinedDate: '' as string | null,
    documents: [] as any[],
    bankDetails: {
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      accountHolderName: ''
    }
  });


  // Change Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [sessionsList, setSessionsList] = useState<any[]>([]);

  // Dynamic additions state
  const [newDeptName, setNewDeptName] = useState('');
  const [newLeaveName, setNewLeaveName] = useState('');
  const [newLeaveDays, setNewLeaveDays] = useState(10);
  const [newHolidayTitle, setNewHolidayTitle] = useState('');
  const [newHolidayDate, setNewHolidayDate] = useState('');
  const [newStageName, setNewStageName] = useState('');
  const [newTemplateTitle, setNewTemplateTitle] = useState('');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');
  const [departmentsList, setDepartmentsList] = useState<string[]>([]);
  const [branchesList, setBranchesList] = useState<string[]>([]);

  // -------------------------------------------------------------
  // DATA SYNC LOGIC (FETCH & SAVE TO DATABASE)
  // -------------------------------------------------------------

  useEffect(() => {
    fetchSettings();
  }, [userRole]);

  // Sync activeSettingsView and default categories when role changes
  useEffect(() => {
    setActiveSettingsView(userRole);
    if (userRole === 'Admin') {
      setActiveCategory('company');
    } else if (userRole === 'HR') {
      setActiveCategory('employee-profile');
    } else {
      setActiveCategory('employee-profile');
    }
  }, [userRole]);

  // Auto-save user settings reactively when changed
  useEffect(() => {
    if (!hasLoaded || loading) return;

    const delayDebounceFn = setTimeout(async () => {
      try {
        const token = localStorage.getItem('hr_system_token');
        if (!token) return;
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        };

        const userPayload = {
          bio: employeeBio,
          skills: skillsList,
          privacy: employeePrivacy,
          notifications: employeeNotifs,
          appearance: {
            themeMode,
            fontSize,
            compactLayout
          },
          productivity: {
            focusModeTime,
            dailyTaskGoal,
            productivityReminders: true
          },
          availability,
          profile: profileDetails,
          chatSettings: {
            chatDisplayName,
            chatStatusText,
            chatStatusEmoji,
            chatPresence,
            chatMuteSound,
            chatNotifLevel,
            chatDndActive
          },
          sessions: sessionsList
        };

        const res = await fetch('/api/settings/user', {
          method: 'POST',
          headers,
          body: JSON.stringify(userPayload)
        });

        if (res.ok) {
          if (setProfile) {
            setProfile((prev: any) => ({
              ...prev,
              name: profileDetails.fullName,
              phone: profileDetails.phone,
              profilePicture: profileDetails.profilePicture,
              emergencyContact: profileDetails.emergencyContact,
              bankName: profileDetails.bankDetails?.bankName,
              accountNumber: profileDetails.bankDetails?.accountNumber,
              ifscCode: profileDetails.bankDetails?.ifscCode,
            }));
          }
        }
      } catch (err) {
        console.error("Auto-save user settings failed:", err);
      }
    }, 1000); // 1-second debounce

    return () => clearTimeout(delayDebounceFn);
  }, [
    hasLoaded,
    loading,
    employeeBio,
    skillsList,
    employeePrivacy,
    employeeNotifs,
    themeMode,
    fontSize,
    compactLayout,
    chatDisplayName,
    chatStatusText,
    chatStatusEmoji,
    chatPresence,
    chatMuteSound,
    chatNotifLevel,
    chatDndActive,
    profileDetails,
    focusModeTime,
    dailyTaskGoal,
    availability,
    sessionsList,
    setProfile
  ]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setHasLoaded(false);
      const token = localStorage.getItem('hr_system_token');
      if (!token) return;
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      try {
        const deptsRes = await fetch('/api/departments', { headers });
        if (deptsRes.ok) {
          const deptsData = await deptsRes.json();
          const names = (deptsData || []).map((d: any) => d.name || d.deptName || '').filter(Boolean);
          setDepartmentsList(names);
        }
      } catch (e) {
        console.error(e);
      }

      try {
        const branchesRes = await fetch('/api/branches', { headers });
        if (branchesRes.ok) {
          const branchesData = await branchesRes.json();
          const names = (branchesData || []).map((b: any) => b.branchName || b.name || '').filter(Boolean);
          setBranchesList(names);
        }
      } catch (e) {
        console.error(e);
      }

      // 1. Fetch system-wide settings
      const systemRes = await fetch('/api/settings/system', { headers });
      if (systemRes.ok) {
        const data = await systemRes.json();
        if (data) {
          if (data.company) setCompanyBranding(data.company);
          if (data.payroll) setPayrollConfig(data.payroll);
          if (data.attendance) setAttendanceConfig(data.attendance);
          if (data.leave) setLeaveConfig(data.leave);
          if (data.recruitment) setRecruitmentConfig(data.recruitment);
          if (data.security) setSecurityConfig(data.security);
          if (data.notifications) setNotificationConfig(data.notifications);
          if (data.theme) setThemeSettings(data.theme);
          if (data.chat) setChatConfig(data.chat);
          if (data.org) setOrgConfig(data.org);
          if (data.workflow) setWorkflowConfig(data.workflow);
          if (data.integrations) setIntegrationsConfig(data.integrations);
          if (data.billing) setBillingConfig(data.billing);
          if (data.backup) setBackupConfig(data.backup);
        }
      }

      // 2. Fetch user-specific preferences and profile
      const userRes = await fetch('/api/settings/user', { headers });
      if (userRes.ok) {
        const data = await userRes.json();
        if (data) {
          const s = data.settings;
          if (s) {
            setEmployeeBio(s.bio || '');
            setSkillsList(s.skills || []);
            if (s.privacy) setEmployeePrivacy(s.privacy);
            if (s.notifications) setEmployeeNotifs(s.notifications);
             if (s.appearance) {
              const userTheme = s.appearance.themeMode || 'Dark';
              setThemeMode(userTheme);
              setFontSize(s.appearance.fontSize || 'Medium');
              setCompactLayout(s.appearance.compactLayout || false);
              
              // Apply theme instantly on load
              const isDark = userTheme !== 'Light';
              if (typeof window !== 'undefined') {
                document.documentElement.classList.toggle('dark', isDark);
                localStorage.setItem('hr_system_dark_mode', String(isDark));
                localStorage.setItem('hr_system_theme_mode', userTheme);
              }
            } else {
              setThemeMode('Dark');
              if (typeof window !== 'undefined') {
                document.documentElement.classList.add('dark');
                localStorage.setItem('hr_system_dark_mode', 'true');
                localStorage.setItem('hr_system_theme_mode', 'Dark');
              }
            }
            if (s.productivity) {
              setFocusModeTime(s.productivity.focusModeTime || 25);
              setDailyTaskGoal(s.productivity.dailyTaskGoal || 5);
            }
            if (s.availability) setAvailability(s.availability);
            if (s.chatSettings) {
              setChatDisplayName(s.chatSettings.chatDisplayName || '');
              setChatStatusText(s.chatSettings.chatStatusText || '');
              setChatStatusEmoji(s.chatSettings.chatStatusEmoji || '');
              setChatPresence(s.chatSettings.chatPresence || 'online');
              setChatMuteSound(s.chatSettings.chatMuteSound || false);
              setChatNotifLevel(s.chatSettings.chatNotifLevel || 'all');
              setChatDndActive(s.chatSettings.chatDndActive || false);
            }
            if (s.sessions) {
              setSessionsList(s.sessions);
            } else {
              setSessionsList([
                { id: '1', device: "Chrome / Windows 11", ip: "192.168.1.102", location: "Kolkata (Current)", current: true },
                { id: '2', device: "Safari / iPhone 15 Pro", ip: "103.88.99.12", location: "Mobile Network", current: false }
              ]);
            }
          }
          if (data.profile) {
            setProfileDetails(data.profile);
          }
        }
      }

      // 3. Fetch Admin Users List (Admin Only)
      if (userRole === 'Admin') {
        const usersRes = await fetch('/api/settings/users', { headers });
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setUsersList(usersData);
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  };

  const triggerToast = (msg: string) => {
    useUIStore.getState().triggerToast(msg);
  };

  const handleSaveChanges = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('hr_system_token');
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      // 1. If active workspace is Admin/HR, update System settings
      if (activeSettingsView === 'Admin' || activeSettingsView === 'HR') {
        const systemPayload = {
          company: companyBranding,
          payroll: payrollConfig,
          attendance: attendanceConfig,
          leave: leaveConfig,
          recruitment: recruitmentConfig,
          security: securityConfig,
          notifications: notificationConfig,
          theme: themeSettings,
          chat: chatConfig,
          org: orgConfig,
          workflow: workflowConfig,
          integrations: integrationsConfig,
          billing: billingConfig,
          backup: backupConfig
        };
        const systemRes = await fetch('/api/settings/system', {
          method: 'POST',
          headers,
          body: JSON.stringify(systemPayload)
        });
        if (!systemRes.ok) {
          const err = await systemRes.json();
          throw new Error(err.error || 'Failed to save system settings');
        }
      }

      // 2. Update Employee settings
      const userPayload = {
        bio: employeeBio,
        skills: skillsList,
        privacy: employeePrivacy,
        notifications: employeeNotifs,
        appearance: {
          themeMode,
          fontSize,
          compactLayout
        },
        productivity: {
          focusModeTime,
          dailyTaskGoal,
          productivityReminders: true
        },
        availability,
        profile: profileDetails,
        chatSettings: {
          chatDisplayName,
          chatStatusText,
          chatStatusEmoji,
          chatPresence,
          chatMuteSound,
          chatNotifLevel,
          chatDndActive
        },
        sessions: sessionsList
      };

      const userRes = await fetch('/api/settings/user', {
        method: 'POST',
        headers,
        body: JSON.stringify(userPayload)
      });
      
      if (!userRes.ok) {
        const err = await userRes.json();
        throw new Error(err.error || 'Failed to save user settings');
      }

      // Update parent profile state
      if (setProfile) {
        setProfile((prev: any) => ({
          ...prev,
          name: profileDetails.fullName,
          phone: profileDetails.phone,
          profilePicture: profileDetails.profilePicture,
          emergencyContact: profileDetails.emergencyContact,
          bankName: profileDetails.bankDetails?.bankName,
          accountNumber: profileDetails.bankDetails?.accountNumber,
          ifscCode: profileDetails.bankDetails?.ifscCode,
        }));
      }

      triggerToast("Configurations stored to server database successfully.");
    } catch (error: any) {
      console.error('Error saving settings:', error);
      triggerToast(error.message || "Failed to save settings.");
    } finally {
      setSaving(false);
      fetchSettings();
    }
  };

  // Create user (Admin Only)
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserFullName || !newUserEmail || !newUserPassword) {
      triggerToast('Please fill all user details.');
      return;
    }
    try {
      setCreatingUser(true);
      const token = localStorage.getItem('hr_system_token');
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fullName: newUserFullName,
          email: newUserEmail,
          password: newUserPassword,
          role: newUserRole,
          companyName: companyBranding.name,
          department: newUserDepartment
        })
      });

      const data = await res.json();
      if (res.ok) {
        triggerToast('User created successfully');
        setNewUserFullName('');
        setNewUserEmail('');
        setNewUserPassword('');
        fetchSettings(); // Refresh list
      } else {
        triggerToast(data.error || 'Failed to create user');
      }
    } catch (error) {
      console.error(error);
      triggerToast('Server error while creating user');
    } finally {
      setCreatingUser(false);
    }
  };

  // Edit user role (Admin Only)
  const handleUpdateUserRole = async (userId: string, role: string) => {
    try {
      const token = localStorage.getItem('hr_system_token');
      const res = await fetch('/api/settings/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId, role })
      });
      if (res.ok) {
        triggerToast('User role updated successfully');
        fetchSettings();
      } else {
        const err = await res.json();
        triggerToast(err.error || 'Failed to update role');
      }
    } catch (error) {
      console.error(error);
      triggerToast('Server error updating role');
    }
  };

  // Delete user (Admin Only)
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This will also remove their employee profile.')) return;
    try {
      const token = localStorage.getItem('hr_system_token');
      const res = await fetch(`/api/settings/users?userId=${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        triggerToast('User deleted successfully');
        fetchSettings();
      } else {
        const err = await res.json();
        triggerToast(err.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error(error);
      triggerToast('Server error deleting user');
    }
  };

  // Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      triggerToast('Please fill all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      triggerToast('New passwords do not match.');
      return;
    }
    try {
      setChangingPassword(true);
      const token = localStorage.getItem('hr_system_token');
      const res = await fetch('/api/settings/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast('Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        triggerToast(data.error || 'Failed to change password');
      }
    } catch (error) {
      console.error(error);
      triggerToast('Server error changing password');
    } finally {
      setChangingPassword(false);
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // -------------------------------------------------------------
  // SIDEBAR SECTIONS DEFINITIONS
  // -------------------------------------------------------------

  const adminSidebarGroups = [
    {
      title: '🏢 Company',
      categories: [
        { id: 'company', label: 'Company Settings', icon: Building, description: 'Address, legal info, financial year & timezone' },
        { id: 'branding', label: 'Company Branding', icon: Sparkles, description: 'White-labeling, brand colors, favicon, logo' },
        { id: 'org', label: 'Organization Settings', icon: Layout, description: 'Branches, departments, designations, shifts' }
      ]
    },
    {
      title: '👥 Workforce',
      categories: [
        { id: 'roles', label: 'Users & Roles', icon: Users, description: 'Permissions matrix, role assignments' },
        { id: 'attendance', label: 'Attendance Settings', icon: Clock, description: 'Office shifts, geolocation, QR, biometric' },
        { id: 'leaves', label: 'Leave Settings', icon: Calendar, description: 'Leave policies, carry forward, approval workflow' },
        { id: 'payroll', label: 'Payroll Settings', icon: CreditCard, description: 'Salary components, PF, ESI, TDS, cycles' },
        { id: 'recruitment', label: 'Recruitment Settings', icon: Briefcase, description: 'Job templates, pipeline, referral settings' }
      ]
    },
    {
      title: '⚙️ System',
      categories: [
        { id: 'security', label: 'Security Settings', icon: Shield, description: 'Password policy, 2FA, session expiry, IP restrictions' },
        { id: 'notifications', label: 'Notification Settings', icon: Bell, description: 'Email, push notifications, alerts config' },
        { id: 'chat-admin', label: 'Workplace Chat Setup', icon: MessageSquare, description: 'Private/group channels, retention rules' },
        { id: 'workflow', label: 'Workflow Automation', icon: Workflow, description: 'Onboarding, offboarding, multi-level approvals' },
        { id: 'integrations', label: 'Integrations', icon: Server, description: 'M365, Slack, Zoom, Google Workspace, API keys' }
      ]
    },
    {
      title: '📊 Platform',
      categories: [
        { id: 'billing', label: 'Billing & Subscription', icon: CreditCard, description: 'Current subscription plan, usage & invoices' },
        { id: 'audit', label: 'Audit Logs', icon: Activity, description: 'User activities, security logs, export data' },
        { id: 'backup', label: 'Backup & Restore', icon: Database, description: 'Automatic/manual backups, restore point' },
        { id: 'theme', label: 'Theme & Appearance', icon: Palette, description: 'Light/Dark mode, global color scheme for all panels' }
      ]
    }
  ];

  const hrSidebarCategories = [
    { id: 'hr-profile', label: 'My Profile', icon: User, description: 'Upload picture, name, bio, skills, certification' },
    { id: 'hr-personal', label: 'Personal Information', icon: User, description: 'Legal details, date of birth, nationality' },
    { id: 'hr-contact', label: 'Contact Information', icon: Globe, description: 'Mobile, email, current and permanent address' },
    { id: 'hr-emergency', label: 'Emergency Contacts', icon: Heart, description: 'Primary and secondary contacts' },
    { id: 'hr-work', label: 'Work Information', icon: Briefcase, description: 'HR ID, reporting manager, shift allocation (Read Only)' },
    { id: 'hr-preferences', label: 'HR Preferences', icon: Layout, description: 'Default widgets, default filters, list layout' },
    { id: 'hr-attendance-pref', label: 'Attendance Preferences', icon: Clock, description: 'Attendance alerts, check-in notifications' },
    { id: 'hr-leave-pref', label: 'Leave Preferences', icon: Calendar, description: 'Leave approval alerts and calendars' },
    { id: 'hr-recruitment-pref', label: 'Recruitment Preferences', icon: Briefcase, description: 'Candidate alert rules and pipeline view' },
    { id: 'hr-project-pref', label: 'Project Preferences', icon: Target, description: 'Task and deadline reminders' },
    { id: 'hr-documents', label: 'Document Center', icon: FileText, description: 'View offer letters, upload tax PAN/Aadhaar' },
    { id: 'hr-security', label: 'Security', icon: Shield, description: 'Password change, 2FA setup, recovery email' },
    { id: 'hr-notifications', label: 'Notifications', icon: Bell, description: 'Manage notification preferences' },
    { id: 'hr-appearance', label: 'Appearance', icon: Palette, description: 'Light/Dark mode, compact density' },
    { id: 'hr-language', label: 'Language & Region', icon: Languages, description: 'Select timezone, date and time format' },
    { id: 'hr-privacy', label: 'Privacy Settings', icon: Lock, description: 'Visibility of birthday, phone, email' },
    { id: 'hr-devices', label: 'Devices & Sessions', icon: Laptop, description: 'Login history, revoke active sessions' },
    { id: 'hr-connected', label: 'Connected Accounts', icon: RefreshCcw, description: 'Google, Microsoft, Slack, Teams integration' },
    { id: 'hr-download', label: 'Download My Data', icon: Download, description: 'Export HR activity profile data' },
    { id: 'hr-chat', label: 'Workplace Chat Setup', icon: MessageSquare, description: 'Chat limits and workspace settings' },
    { id: 'hr-support', label: 'Help & Support', icon: HelpCircle, description: 'Submit ticket, documentation, guides' },
    { id: 'hr-about', label: 'About App', icon: Info, description: 'Version, build details, release notes' }
  ];

  const employeeSidebarCategories = [
    { id: 'employee-profile', label: 'My Profile', icon: User, description: 'Display picture, name, bio, skills, socials' },
    { id: 'employee-personal', label: 'Personal Information', icon: User, description: 'Full name, DOB, gender, blood group, marital status' },
    { id: 'employee-contact', label: 'Contact Information', icon: Globe, description: 'Mobile number, personal email, addresses' },
    { id: 'employee-emergency', label: 'Emergency Contacts', icon: Heart, description: 'Primary and secondary emergency contacts' },
    { id: 'employee-work', label: 'Work Information', icon: Briefcase, description: 'Employee ID, department, designation, branch (Read Only)' },
    { id: 'employee-bank', label: 'Bank & Tax Information', icon: CreditCard, description: 'Bank account, IFSC, PAN, Aadhaar, PF, ESIC' },
    { id: 'employee-documents', label: 'Document Center', icon: FileText, description: 'Download offer letters, payslips, upload certificates' },
    { id: 'employee-security', label: 'Security', icon: ShieldCheck, description: 'Password, 2FA, biometric login, passkeys' },
    { id: 'employee-notifications', label: 'Notifications', icon: Bell, description: 'Control email, push, SMS notifications' },
    { id: 'employee-appearance', label: 'Appearance', icon: Palette, description: 'Light, dark, system theme, density' },
    { id: 'employee-language', label: 'Language & Region', icon: Languages, description: 'Language, timezone, formats' },
    { id: 'employee-privacy', label: 'Privacy', icon: Lock, description: 'Control visibility of birthday, phone, email' },
    { id: 'employee-devices', label: 'Devices & Sessions', icon: Laptop, description: 'Current device, logged in devices, browser, IP' },
    { id: 'employee-connected', label: 'Connected Accounts', icon: RefreshCcw, description: 'Google, Microsoft, GitHub, Slack integration' },
    { id: 'employee-download', label: 'Download My Data', icon: Download, description: 'Export personal data, attendance, payroll' },
    { id: 'employee-support', label: 'Help & Support', icon: HelpCircle, description: 'Raise ticket, FAQs, user guide' },
    { id: 'employee-about', label: 'About', icon: Info, description: 'App version, build, release notes' }
  ];

  const getSidebarCategoriesGrouped = () => {
    if (activeSettingsView !== 'Admin') {
      const cats = activeSettingsView === 'HR' ? hrSidebarCategories : employeeSidebarCategories;
      const query = searchQuery.toLowerCase();
      const filtered = cats.filter(cat => 
        cat.label.toLowerCase().includes(query) || 
        cat.description.toLowerCase().includes(query)
      );
      return [{ title: `${activeSettingsView} Sections`, categories: filtered }];
    }
    
    const query = searchQuery.toLowerCase();
    if (!query) return adminSidebarGroups;

    return adminSidebarGroups.map(group => {
      const filtered = group.categories.filter(cat => 
        cat.label.toLowerCase().includes(query) || 
        cat.description.toLowerCase().includes(query)
      );
      return { ...group, categories: filtered };
    }).filter(group => group.categories.length > 0);
  };


  return (
    <div className="p-5 lg:p-6 max-w-7xl mx-auto space-y-6 min-h-screen text-left relative font-sans text-slate-800 dark:text-slate-200">
      


      {/* Header and top bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 border-b border-slate-100 dark:border-slate-800/40 pb-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            Settings Hub
            {loading && <RefreshCcw className="w-3.5 h-3.5 text-blue-500 animate-spin" />}
          </h1>
          <p className="text-[10.5px] text-slate-400 dark:text-slate-500 mt-0.5">
            {activeSettingsView === 'Admin' 
              ? 'Super admin system parameters control hub' 
              : activeSettingsView === 'HR' 
                ? 'HR administration and department parameters hub' 
                : 'Personal profile, appearance & account preferences'}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleSaveChanges}
            disabled={saving}
            className="px-3.5 h-9 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10.5px] font-medium flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/10 transition-all border-none"
          >
            {saving ? <RefreshCcw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Category Sidebar */}
        <div className="lg:w-60 shrink-0 bg-transparent p-1 space-y-3">
          {/* Redesigned Search Settings Bar */}
          <div className="px-2 relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search settings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-10 py-2 text-[10.5px] rounded-xl bg-slate-100/60 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/80 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-slate-350 dark:focus:border-slate-700 focus:ring-4 focus:ring-slate-900/5 dark:focus:ring-white/5 transition-all duration-200 font-semibold text-slate-800 dark:text-slate-200 shadow-sm"
            />
            <div className="absolute right-4.5 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-200/50 dark:bg-slate-800/60 border border-slate-300/10 dark:border-slate-700/20 pointer-events-none select-none">
              <span className="text-[7.5px] font-bold text-slate-455 tracking-tighter">⌘</span>
              <span className="text-[7.5px] font-bold text-slate-455">K</span>
            </div>
          </div>

          <div className="space-y-3 lg:overflow-y-auto lg:max-h-[calc(100vh-260px)] no-scrollbar">
            {getSidebarCategoriesGrouped().map((group) => (
              <div key={group.title} className="space-y-1">
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider block px-2.5 pt-1 pb-0.5 whitespace-nowrap">
                  {group.title}
                </span>
                <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible no-scrollbar p-1 rounded-xl bg-slate-100/30 dark:bg-slate-950/20 border border-slate-200/10 dark:border-slate-900/30 lg:bg-transparent lg:border-none lg:p-0">
                  {group.categories.map((cat) => {
                    const active = activeCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200 text-[11px] font-semibold text-left cursor-pointer whitespace-nowrap shrink-0 lg:w-full group active:scale-[0.98] border-l-2",
                          active
                            ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-900 dark:border-slate-400 shadow-sm"
                            : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 bg-transparent hover:bg-slate-100/60 dark:hover:bg-slate-800/40 border-transparent"
                        )}
                      >
                        {(() => {
                          const iconColorMap: Record<string, string> = {
                            company: '#475569',
                            branding: '#475569',
                            org: '#475569',
                            roles: '#475569',
                            payroll: '#475569',
                            attendance: '#475569',
                            leaves: '#475569',
                            recruitment: '#475569',
                            security: '#475569',
                            notifications: '#475569',
                            'chat-admin': '#475569',
                            workflow: '#475569',
                            integrations: '#475569',
                            billing: '#475569',
                            audit: '#475569',
                            backup: '#475569'
                          };
                          const iconHex = iconColorMap[cat.id] || '#64748b';
                          return (
                            <cat.icon
                              className={cn(
                                "w-3.5 h-3.5 shrink-0 transition-all duration-200 group-hover:scale-105",
                                active ? "opacity-100" : "opacity-80 group-hover:opacity-100"
                              )}
                              stroke={active ? 'currentColor' : iconHex}
                            />
                          );
                        })()}
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Content Viewports */}
        <div className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-[2rem] p-6 lg:p-8 min-h-[500px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeSettingsView}-${activeCategory}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-6 text-xs text-left"
            >
                           {/* ========================================================= */}
              {/* ADMIN SETTINGS MODULE RENDERS                            */}
              {/* ========================================================= */}
              {activeSettingsView === 'Admin' && activeCategory === 'branding' && (
                <BrandingTab
                  activeCategory={activeCategory}
                  triggerToast={triggerToast}
                />
              )}
              {activeSettingsView === 'Admin' && activeCategory === 'employee-appearance' && (
                <EmployeeTabs
                  activeCategory={activeCategory}
                  profileDetails={profileDetails}
                  setProfileDetails={setProfileDetails}
                  employeeBio={employeeBio}
                  setEmployeeBio={setEmployeeBio}
                  skillsList={skillsList}
                  setSkillsList={setSkillsList}
                  newSkillInput={newSkillInput}
                  setNewSkillInput={setNewSkillInput}
                  currentPassword={currentPassword}
                  setCurrentPassword={setCurrentPassword}
                  newPassword={newPassword}
                  setNewPassword={setNewPassword}
                  confirmPassword={confirmPassword}
                  setConfirmPassword={setConfirmPassword}
                  changingPassword={changingPassword}
                  handleChangePassword={handleChangePassword}
                  employeePrivacy={employeePrivacy}
                  setEmployeePrivacy={setEmployeePrivacy}
                  employeeNotifs={employeeNotifs}
                  setEmployeeNotifs={setEmployeeNotifs}
                  themeMode={themeMode}
                  setThemeMode={setThemeMode}
                  fontSize={fontSize}
                  setFontSize={setFontSize}
                  compactLayout={compactLayout}
                  setCompactLayout={setCompactLayout}
                  triggerToast={triggerToast}
                  chatDisplayName={chatDisplayName}
                  setChatDisplayName={setChatDisplayName}
                  chatStatusText={chatStatusText}
                  setChatStatusText={setChatStatusText}
                  chatStatusEmoji={chatStatusEmoji}
                  setChatStatusEmoji={setChatStatusEmoji}
                  chatPresence={chatPresence}
                  setChatPresence={setChatPresence}
                  chatMuteSound={chatMuteSound}
                  setChatMuteSound={setChatMuteSound}
                  chatNotifLevel={chatNotifLevel}
                  setChatNotifLevel={setChatNotifLevel}
                  chatDndActive={chatDndActive}
                  setChatDndActive={setChatDndActive}
                  sessionsList={sessionsList}
                  setSessionsList={setSessionsList}
                  onPhotoUploaded={(url) => {
                    if (setProfile) {
                      setProfile((prev: any) => ({ ...prev, profilePicture: url }));
                    }
                  }}
                />
              )}
              {activeSettingsView === 'Admin' && activeCategory !== 'branding' && activeCategory !== 'employee-appearance' && (
                <AdminTabs
                  onFieldChange={() => setHasUnsavedChanges(true)}
                  onThemeChange={toggleTheme}
                  isDarkMode={isDarkMode}
                  activeCategory={activeCategory}
                  companyBranding={companyBranding}
                  setCompanyBranding={setCompanyBranding}
                  usersList={usersList}
                  newUserFullName={newUserFullName}
                  setNewUserFullName={setNewUserFullName}
                  newUserEmail={newUserEmail}
                  setNewUserEmail={setNewUserEmail}
                  newUserPassword={newUserPassword}
                  setNewUserPassword={setNewUserPassword}
                  newUserRole={newUserRole}
                  setNewUserRole={setNewUserRole}
                  newUserDepartment={newUserDepartment}
                  setNewUserDepartment={setNewUserDepartment}
                  creatingUser={creatingUser}
                  handleCreateUser={handleCreateUser}
                  handleUpdateUserRole={handleUpdateUserRole}
                  handleDeleteUser={handleDeleteUser}
                  permissionsMatrix={permissionsMatrix}
                  setPermissionsMatrix={setPermissionsMatrix}
                  payrollConfig={payrollConfig}
                  setPayrollConfig={setPayrollConfig}
                  attendanceConfig={attendanceConfig}
                  setAttendanceConfig={setAttendanceConfig}
                  leaveConfig={leaveConfig}
                  setLeaveConfig={setLeaveConfig}
                  newLeaveName={newLeaveName}
                  setNewLeaveName={setNewLeaveName}
                  newLeaveDays={newLeaveDays}
                  setNewLeaveDays={setNewLeaveDays}
                  newHolidayTitle={newHolidayTitle}
                  setNewHolidayTitle={setNewHolidayTitle}
                  newHolidayDate={newHolidayDate}
                  setNewHolidayDate={setNewHolidayDate}
                  recruitmentConfig={recruitmentConfig}
                  setRecruitmentConfig={setRecruitmentConfig}
                  newStageName={newStageName}
                  setNewStageName={setNewStageName}
                  newTemplateTitle={newTemplateTitle}
                  setNewTemplateTitle={setNewTemplateTitle}
                  newTemplateDesc={newTemplateDesc}
                  setNewTemplateDesc={setNewTemplateDesc}
                  securityConfig={securityConfig}
                  setSecurityConfig={setSecurityConfig}
                  notificationConfig={notificationConfig}
                  setNotificationConfig={setNotificationConfig}
                  themeSettings={themeSettings}
                  setThemeSettings={setThemeSettings}
                  triggerToast={triggerToast}
                  chatConfig={chatConfig}
                  setChatConfig={setChatConfig}
                  orgConfig={orgConfig}
                  setOrgConfig={setOrgConfig}
                  workflowConfig={workflowConfig}
                  setWorkflowConfig={setWorkflowConfig}
                  integrationsConfig={integrationsConfig}
                  setIntegrationsConfig={setIntegrationsConfig}
                  billingConfig={billingConfig}
                  setBillingConfig={setBillingConfig}
                  backupConfig={backupConfig}
                  setBackupConfig={setBackupConfig}
                  onSaveSystemSettings={async (updates: { leave?: any; attendance?: any; company?: any }) => {
                    try {
                      const token = localStorage.getItem('hr_system_token');
                      const headers = {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                      };
                      const systemPayload = {
                        company: updates.company || companyBranding,
                        payroll: payrollConfig,
                        attendance: updates.attendance || attendanceConfig,
                        leave: updates.leave || leaveConfig,
                        recruitment: recruitmentConfig,
                        security: securityConfig,
                        notifications: notificationConfig,
                        theme: themeSettings,
                        chat: chatConfig,
                        org: orgConfig,
                        workflow: workflowConfig,
                        integrations: integrationsConfig,
                        billing: billingConfig,
                        backup: backupConfig
                      };
                      await fetch('/api/settings/system', {
                        method: 'POST',
                        headers,
                        body: JSON.stringify(systemPayload)
                      });
                      if (addNotification) addNotification("Updated system settings configuration.");
                    } catch (e) {
                      console.error("Failed to auto-save system settings:", e);
                    }
                  }}
                />
              )}

              {activeSettingsView === 'HR' && (
                <HRTabs
                  activeCategory={activeCategory}
                  profileDetails={profileDetails}
                  setProfileDetails={setProfileDetails}
                  employeeBio={employeeBio}
                  setEmployeeBio={setEmployeeBio}
                  skillsList={skillsList}
                  setSkillsList={setSkillsList}
                  newSkillInput={newSkillInput}
                  setNewSkillInput={setNewSkillInput}
                  currentPassword={currentPassword}
                  setCurrentPassword={setCurrentPassword}
                  newPassword={newPassword}
                  setNewPassword={setNewPassword}
                  confirmPassword={confirmPassword}
                  setConfirmPassword={setConfirmPassword}
                  changingPassword={changingPassword}
                  handleChangePassword={handleChangePassword}
                  employeePrivacy={employeePrivacy}
                  setEmployeePrivacy={setEmployeePrivacy}
                  employeeNotifs={employeeNotifs}
                  setEmployeeNotifs={setEmployeeNotifs}
                  themeMode={themeMode}
                  setThemeMode={setThemeMode}
                  fontSize={fontSize}
                  setFontSize={setFontSize}
                  compactLayout={compactLayout}
                  setCompactLayout={setCompactLayout}
                  triggerToast={triggerToast}
                  chatDisplayName={chatDisplayName}
                  setChatDisplayName={setChatDisplayName}
                  chatStatusText={chatStatusText}
                  setChatStatusText={setChatStatusText}
                  chatStatusEmoji={chatStatusEmoji}
                  setChatStatusEmoji={setChatStatusEmoji}
                  chatPresence={chatPresence}
                  setChatPresence={setChatPresence}
                  chatMuteSound={chatMuteSound}
                  setChatMuteSound={setChatMuteSound}
                  chatNotifLevel={chatNotifLevel}
                  setChatNotifLevel={setChatNotifLevel}
                  chatDndActive={chatDndActive}
                  setChatDndActive={setChatDndActive}
                  sessionsList={sessionsList}
                  setSessionsList={setSessionsList}
                  chatConfig={chatConfig}
                  setChatConfig={setChatConfig}
                  availability={availability}
                  setAvailability={setAvailability}
                  departmentsList={departmentsList}
                  branchesList={branchesList}
                  onPhotoUploaded={(url) => {
                    if (setProfile) {
                      setProfile((prev: any) => ({ ...prev, profilePicture: url }));
                    }
                  }}
                />
              )}

              {activeSettingsView === 'Employee' && (
              <EmployeeTabs
                  activeCategory={activeCategory}
                  profileDetails={profileDetails}
                  setProfileDetails={setProfileDetails}
                  employeeBio={employeeBio}
                  setEmployeeBio={setEmployeeBio}
                  skillsList={skillsList}
                  setSkillsList={setSkillsList}
                  newSkillInput={newSkillInput}
                  setNewSkillInput={setNewSkillInput}
                  currentPassword={currentPassword}
                  setCurrentPassword={setCurrentPassword}
                  newPassword={newPassword}
                  setNewPassword={setNewPassword}
                  confirmPassword={confirmPassword}
                  setConfirmPassword={setConfirmPassword}
                  changingPassword={changingPassword}
                  handleChangePassword={handleChangePassword}
                  employeePrivacy={employeePrivacy}
                  setEmployeePrivacy={setEmployeePrivacy}
                  employeeNotifs={employeeNotifs}
                  setEmployeeNotifs={setEmployeeNotifs}
                  themeMode={themeMode}
                  setThemeMode={setThemeMode}
                  fontSize={fontSize}
                  setFontSize={setFontSize}
                  compactLayout={compactLayout}
                  setCompactLayout={setCompactLayout}
                  triggerToast={triggerToast}
                  chatDisplayName={chatDisplayName}
                  setChatDisplayName={setChatDisplayName}
                  chatStatusText={chatStatusText}
                  setChatStatusText={setChatStatusText}
                  chatStatusEmoji={chatStatusEmoji}
                  setChatStatusEmoji={setChatStatusEmoji}
                  chatPresence={chatPresence}
                  setChatPresence={setChatPresence}
                  chatMuteSound={chatMuteSound}
                  setChatMuteSound={setChatMuteSound}
                  chatNotifLevel={chatNotifLevel}
                  setChatNotifLevel={setChatNotifLevel}
                  chatDndActive={chatDndActive}
                  setChatDndActive={setChatDndActive}
                  sessionsList={sessionsList}
                  setSessionsList={setSessionsList}
                  onPhotoUploaded={(url) => {
                    // Immediately update global profile so navbar avatar refreshes
                    if (setProfile) {
                      setProfile((prev: any) => ({ ...prev, profilePicture: url }));
                    }
                  }}
                />
              )}


            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Sticky Bottom Save Bar */}
      <AnimatePresence>
        {hasUnsavedChanges && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-6 py-4 bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md border border-slate-800/80 rounded-2xl shadow-2xl flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
              <div>
                <p className="text-xs font-black text-white uppercase tracking-wider">Unsaved Changes</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">You have modified setting fields. Save to update database.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  fetchSettings();
                  setHasUnsavedChanges(false);
                  triggerToast("Settings reset to last saved state.");
                }}
                className="px-4 py-2 bg-transparent hover:bg-slate-800/50 text-slate-400 hover:text-white border border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer transition-colors"
              >
                Reset
              </button>
              <button
                onClick={async () => {
                  await handleSaveChanges();
                  setHasUnsavedChanges(false);
                }}
                disabled={saving}
                className="saas-btn px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-500/10 transition-colors"
              >
                {saving ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save Changes
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
