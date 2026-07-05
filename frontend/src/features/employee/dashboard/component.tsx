"use client";

import React, { useState, useEffect } from 'react';
import { 
  Clock, FileText, DollarSign, Target, Megaphone, 
  LayoutDashboard, User, ShieldCheck, Download, Eye,
  Plus, CheckSquare, MessageSquare, Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";

// Modal & Shared Component imports
import { LeaveRequestModal } from './components/LeaveRequestModal';

// Divided Sub-component imports
import { OverviewTab } from './components/OverviewTab';
import { AttendanceTab } from './components/AttendanceTab';
import { LeaveTab } from './components/LeaveTab';
import { HolidaysCalendar } from '@/features/hr/leave/components/HolidaysCalendar';
import { PayrollTab } from './components/PayrollTab';
import { PerformanceTab } from './components/PerformanceTab';
import { ProfileTab } from './components/ProfileTab';
import { AnnouncementsTab } from './components/AnnouncementsTab';
import { RecruitmentTab } from './components/RecruitmentTab';
import { DailyWorkUpdatesTab } from './components/DailyWorkUpdatesTab';
import HrAiAssistant from './components/HrAiAssistant';
import { CompanyPoliciesTab } from './components/CompanyPoliciesTab';

// Extra page components for tabs not handled inside sub-components
import WorkplaceChat from '@/features/employee/messages/component';
import CommunityFeed from '@/features/employee/feed/component';
import HelpDeskPage from '@/features/employee/helpdesk/component';
import OrgChartPage from '@/features/employee/orgchart/component';
import ExpensesPage from '@/features/employee/expenses/component';
import OffboardingPage from '@/features/hr/offboarding/component';
import SettingsPage from '@/features/admin/settings/component';

const parseTimeToDate = (timeStr: string, dateStr?: string) => {
  try {
    const cleanStr = timeStr.replace(/\s+/g, ' ').trim();
    const match = cleanStr.match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?\s*(AM|PM|am|pm)?$/i);
    
    let hours = 9;
    let minutes = 0;
    let seconds = 0;
    let ampm = null;

    if (match) {
      hours = parseInt(match[1], 10);
      minutes = parseInt(match[2], 10);
      seconds = match[3] ? parseInt(match[3], 10) : 0;
      ampm = match[4] ? match[4].toUpperCase() : null;

      if (ampm === 'PM' && hours < 12) {
        hours += 12;
      } else if (ampm === 'AM' && hours === 12) {
        hours = 0;
      }
    } else {
      // Fallback
      const parts = cleanStr.split(' ');
      const timeVal = parts[0];
      const modifier = parts[1] || '';
      
      let [h, m, s = 0] = timeVal.split(':').map(Number);
      hours = h;
      minutes = m;
      seconds = s;
      if (modifier.toUpperCase() === 'PM' && hours < 12) hours += 12;
      if (modifier.toUpperCase() === 'AM' && hours === 12) hours = 0;
    }

    let d = new Date();
    if (dateStr) {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // 0-indexed month
        const day = parseInt(parts[2], 10);
        d = new Date(year, month, day);
      }
    }
    
    d.setHours(hours, minutes, seconds, 0);
    if (isNaN(d.getTime())) {
      return new Date();
    }
    return d;
  } catch (e) {
    console.error("Failed to parse time:", timeStr, e);
    return new Date();
  }
};

const parseDurationToSeconds = (durationStr: string): number => {
  if (!durationStr) return 0;
  const parts = durationStr.split(':');
  if (parts.length === 3) {
    const hrs = parseInt(parts[0], 10) || 0;
    const mins = parseInt(parts[1], 10) || 0;
    const secs = parseInt(parts[2], 10) || 0;
    return hrs * 3600 + mins * 60 + secs;
  }
  const hourMatch = durationStr.match(/(\d+)\s*h/);
  const minMatch = durationStr.match(/(\d+)\s*m/);
  const secMatch = durationStr.match(/(\d+)\s*s/);
  let totalSecs = 0;
  if (hourMatch) totalSecs += parseInt(hourMatch[1], 10) * 3600;
  if (minMatch) totalSecs += parseInt(minMatch[1], 10) * 60;
  if (secMatch) totalSecs += parseInt(secMatch[1], 10);
  return totalSecs;
};

const getLocalDateString = (d = new Date()) => {
  const offset = d.getTimezoneOffset();
  const localDate = new Date(d.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().split('T')[0];
};

export default function EmployeeDashboard({ 
  activeTab = 'overview',
  setActiveTab = () => {},
  leaves = [], 
  setLeaves, 
  addNotification = () => {},
  profile = {},
  jobs = [],
  setJobs,
  hrViewAsEmployee = false,
  onSwitchToHR = () => {},
  onOpenSearch
}: { 
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  leaves?: any[];
  setLeaves: React.Dispatch<React.SetStateAction<any[]>>;
  addNotification?: (msg: string) => void;
  profile?: any;
  jobs?: any[];
  setJobs: React.Dispatch<React.SetStateAction<any[]>>;
  hrViewAsEmployee?: boolean;
  onSwitchToHR?: () => void;
  onOpenSearch?: () => void;
}) {

  
  // Shift States - Persisted in localStorage so navigating pages or unmounting doesn't reset active session state
  const [isCheckedIn, setIsCheckedIn] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('attendance_isCheckedIn');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });

  const [isOnBreak, setIsOnBreak] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('attendance_isOnBreak');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });

  const [checkInTime, setCheckInTime] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('attendance_checkInTime');
    }
    return null;
  });

  const [secondsWorked, setSecondsWorked] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('attendance_secondsWorked');
      return saved ? Number(saved) : 0;
    }
    return 0;
  });

  const [breakSeconds, setBreakSeconds] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('attendance_breakSeconds');
      return saved ? Number(saved) : 0;
    }
    return 0;
  });

  const [totalBreakSeconds, setTotalBreakSeconds] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('attendance_totalBreakSeconds');
      return saved ? Number(saved) : 0;
    }
    return 0;
  });

  const [recentAttendance, setRecentAttendance] = useState<any[]>([]);
  const [isIdle, setIsIdle] = useState(false);
  const [shiftStart, setShiftStart] = useState<string>('09:00 AM');
  const [shiftEnd, setShiftEnd] = useState<string>('06:00 PM');
  const [maxBreakTime, setMaxBreakTime] = useState<string>('60 Mins');
  const [companyName, setCompanyName] = useState<string>('');
  const [totalHoursLogged, setTotalHoursLogged] = useState<number>(0);
  const [sickLeaveLimit, setSickLeaveLimit] = useState<number>(12);
  const [performanceReviews, setPerformanceReviews] = useState<any[]>([]);

  // Task States
  const [employeeTasks, setEmployeeTasks] = useState<any[]>([]);

  // Announcements State
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [totalLeavesLimit, setTotalLeavesLimit] = useState(24);

  // Profile Edit States
  const [profileData, setProfileData] = useState({
    id: profile?.id || '',
    name: profile?.name || 'Pravin Patil',
    email: profile?.email || 'emp@hr.com',
    phone: profile?.phone || '+91 98765 43210',
    designation: profile?.designation || 'Senior Software Engineer',
    department: profile?.department || 'Engineering',
    bankName: profile?.bankName || 'HDFC Bank Ltd',
    accountNumber: profile?.accountNumber || '50100234567890',
    ifscCode: profile?.ifscCode || 'HDFC0001234',
    emergencyContact: profile?.emergencyContact || 'Mrs. Patil (+91 98765 99999)',
    avatar: ''
  });

  // Payroll States
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [showSlipModal, setShowSlipModal] = useState<any>(null);

  const TARGET_SECONDS = 8 * 3600; // 8 hours target

  // Sync shift states to localStorage to persist state across page navigation and unmounts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('attendance_isCheckedIn', JSON.stringify(isCheckedIn));
      localStorage.setItem('attendance_isOnBreak', JSON.stringify(isOnBreak));
      if (checkInTime) {
        localStorage.setItem('attendance_checkInTime', checkInTime);
      } else {
        localStorage.removeItem('attendance_checkInTime');
      }
    }
  }, [isCheckedIn, isOnBreak, checkInTime]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('attendance_secondsWorked', secondsWorked.toString());
    }
  }, [secondsWorked]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('attendance_breakSeconds', breakSeconds.toString());
    }
  }, [breakSeconds]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('attendance_totalBreakSeconds', totalBreakSeconds.toString());
    }
  }, [totalBreakSeconds]);

  // Live Timer Effect
  useEffect(() => {
    let interval: any = null;
    if (isCheckedIn && !isOnBreak) {
      interval = setInterval(() => {
        setSecondsWorked(prev => prev + 1);
      }, 1000);
    } else if (isCheckedIn && isOnBreak) {
      interval = setInterval(() => {
        setBreakSeconds(prev => prev + 1);
        setTotalBreakSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCheckedIn, isOnBreak]);

  // Sync authenticated profile prop to local profileData state
  useEffect(() => {
    if (profile && profile.name) {
      setProfileData(prev => ({
        ...prev,
        id: profile.id || prev.id,
        name: profile.name,
        email: profile.email || prev.email,
        phone: profile.phone || prev.phone,
        designation: profile.role || profile.designation || prev.designation,
        department: profile.dept || profile.department || prev.department,
        bankName: profile.bankName || prev.bankName,
        accountNumber: profile.accountNumber || prev.accountNumber,
        ifscCode: profile.ifscCode || prev.ifscCode,
        emergencyContact: profile.emergencyContact || prev.emergencyContact,
        reportingManager: profile.reportingManager || null,
        isManager: profile.isManager || false
      }));
    }
  }, [profile]);


  // Fetch all employee contextual database records
  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Fetch Announcements
      const annRes = await fetch('/api/announcements', { headers });
      if (annRes.ok) {
        const data = await annRes.json();
        setAnnouncements(data);
      }

      // Fetch Tasks
      const taskRes = await fetch('/api/tasks', { headers });
      if (taskRes.ok) {
        const data = await taskRes.json();
        const filteredTasks = data.filter((t: any) => {
          if (!t.assignedTo) return false;
          const assignee = t.assignedTo.trim().toLowerCase();
          const empName = profileData.name.trim().toLowerCase();
          const empEmail = profileData.email.trim().toLowerCase();
          const assigneeEmail = t.assignedToEmail ? t.assignedToEmail.trim().toLowerCase() : '';

          return assignee === empEmail || 
                 assignee === empName || 
                 assigneeEmail === empEmail ||
                 empName.includes(assignee) || 
                 assignee.includes(empName) ||
                 empEmail.includes(assignee) ||
                 assignee.includes(empEmail) ||
                 assignee === 'emp@hr.com';
        });
        setEmployeeTasks(filteredTasks);
      }

      // Fetch Attendance History
      const attRes = await fetch('/api/attendance', { headers });
      if (attRes.ok) {
        const data = await attRes.json();
        const employeeAttendance = data.filter((a: any) => a.employee === profileData.name);
        setRecentAttendance(employeeAttendance.slice(0, 10));
        
        let totalSecs = 0;
        employeeAttendance.forEach((att: any) => {
          if (att.hours) {
            totalSecs += parseDurationToSeconds(att.hours);
          }
        });
        setTotalHoursLogged(totalSecs);
      }

      // Fetch Payroll History
      const payRes = await fetch('/api/payroll', { headers });
      if (payRes.ok) {
        const data = await payRes.json();
        setPayrolls(data.filter((p: any) => p.employeeName === profileData.name || p.email === profileData.email));
      }

      // Fetch Leaves History
      const leavesRes = await fetch(`/api/leaves?t=${Date.now()}`, { cache: 'no-store', headers });
      if (leavesRes.ok) {
        const data = await leavesRes.json();
        setLeaves(data);
      }

      // Fetch individual profile details first to check for custom maxLeaves limit
      let customMaxLeaves: number | undefined = undefined;
      if (profileData.email) {
        const empProfileRes = await fetch(`/api/employees?email=${encodeURIComponent(profileData.email)}`, { headers });
        if (empProfileRes.ok) {
          const empProfileData = await empProfileRes.json();
          if (empProfileData && !empProfileData.error && typeof empProfileData.maxLeaves === 'number') {
            customMaxLeaves = empProfileData.maxLeaves;
          }
        }
      }

      // Fetch System Settings (Leave limits fallback)
      const settingsRes = await fetch(`/api/settings/system?t=${Date.now()}`, { headers });
      if (settingsRes.ok) {
        const data = await settingsRes.json();
        if (data) {
          if (data.leave) {
            const roleDefault = profileData.department === 'HR' ? (data.leave.hrMaxLeaves || 24) : (data.leave.employeeMaxLeaves || 24);
            setTotalLeavesLimit(customMaxLeaves !== undefined ? customMaxLeaves : roleDefault);
            
            if (Array.isArray(data.leave.leaveTypes)) {
              const sickType = data.leave.leaveTypes.find((t: any) => t.name === 'Sick Leave');
              if (sickType) {
                setSickLeaveLimit(sickType.days);
              }
            }
          }
          if (data.company && data.company.name) {
            setCompanyName(data.company.name);
          }
          if (data.attendance) {
            if (data.attendance.shiftStart) setShiftStart(data.attendance.shiftStart);
            if (data.attendance.shiftEnd) setShiftEnd(data.attendance.shiftEnd);
            if (data.attendance.maxBreakTime) setMaxBreakTime(data.attendance.maxBreakTime);
          }
        }
      }

      // Fetch Performance Reviews
      const reviewsRes = await fetch('/api/performance', { headers });
      if (reviewsRes.ok) {
        const allReviews = await reviewsRes.json();
        if (Array.isArray(allReviews)) {
          const myReviews = allReviews.filter(r => r.name && r.name.toLowerCase() === profileData.name.toLowerCase());
          setPerformanceReviews(myReviews);
        }
      }
    } catch (err) {
      console.error("Failed to sync employee dashboard APIs:", err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [profileData.name, profileData.email]);

  // Restore clock state and live timer counts directly from database attendance records
  useEffect(() => {
    const todayStr = getLocalDateString();
    const todayRecord = recentAttendance.find((a: any) => a.date === todayStr);
    
    if (todayRecord && todayRecord.checkIn && todayRecord.checkIn !== '-' && (!todayRecord.checkOut || todayRecord.checkOut === '-')) {
      setIsCheckedIn(true);
      setCheckInTime(todayRecord.checkIn);
      
      let hasActiveBreak = false;
      if (todayRecord.breaks && todayRecord.breaks.length > 0) {
        const lastBreak = todayRecord.breaks[todayRecord.breaks.length - 1];
        if (lastBreak.end === '-') {
          hasActiveBreak = true;
        }
      }
      setIsOnBreak(hasActiveBreak);
      
      // Calculate accrued work seconds and active break seconds
      try {
        const checkInTimeDate = parseTimeToDate(todayRecord.checkIn, todayRecord.date);
        let totalCompletedBreakSecs = 0;
        let activeBreakSecs = 0;
        
        if (todayRecord.breaks && todayRecord.breaks.length > 0) {
          todayRecord.breaks.forEach((b: any) => {
            if (b.start) {
              const startD = parseTimeToDate(b.start, todayRecord.date);
              if (b.end === '-') {
                activeBreakSecs = Math.max(0, Math.floor((Date.now() - startD.getTime()) / 1000));
              } else {
                const endD = parseTimeToDate(b.end, todayRecord.date);
                totalCompletedBreakSecs += Math.max(0, Math.floor((endD.getTime() - startD.getTime()) / 1000));
              }
            }
          });
        }
        
        if (hasActiveBreak) {
          setBreakSeconds(activeBreakSecs);
          setTotalBreakSeconds(totalCompletedBreakSecs + activeBreakSecs);
          const elapsedSinceCheckIn = Math.max(0, Math.floor((Date.now() - checkInTimeDate.getTime()) / 1000));
          setSecondsWorked(Math.max(0, elapsedSinceCheckIn - (totalCompletedBreakSecs + activeBreakSecs)));
        } else {
          setBreakSeconds(0);
          setTotalBreakSeconds(totalCompletedBreakSecs);
          const elapsedSinceCheckIn = Math.max(0, Math.floor((Date.now() - checkInTimeDate.getTime()) / 1000));
          setSecondsWorked(Math.max(0, elapsedSinceCheckIn - totalCompletedBreakSecs));
        }
      } catch (err) {
        console.error("Error restoring timers:", err);
      }
    } else {
      setIsCheckedIn(false);
      setIsOnBreak(false);
      setCheckInTime(null);
      setSecondsWorked(0);
      setBreakSeconds(0);
      setTotalBreakSeconds(0);
    }
  }, [recentAttendance]);

  const formatTime = (totalSeconds: number) => {
    const seconds = Math.max(0, Math.floor(totalSeconds));
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return [
      hrs.toString().padStart(2, '0'),
      mins.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].join(':');
  };

  const handleClockIn = async () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setIsCheckedIn(true);
    setCheckInTime(timeStr);
    setSecondsWorked(0);
    setBreakSeconds(0);
    setTotalBreakSeconds(0);
    if (addNotification) addNotification(`Clocked In successfully at ${timeStr}`);

    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      await fetch('/api/attendance', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          employee: profileData.name,
          date: getLocalDateString(now),
          checkIn: timeStr,
          checkOut: '',
          status: 'Present',
          hours: '00:00:00',
          breaks: []
        })
      });
      fetchDashboardData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleClockOut = async () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    setIsCheckedIn(false);
    setIsOnBreak(false);
    setCheckInTime(null);
    setSecondsWorked(0);
    setBreakSeconds(0);
    setTotalBreakSeconds(0);

    if (typeof window !== 'undefined') {
      localStorage.removeItem('attendance_isCheckedIn');
      localStorage.removeItem('attendance_isOnBreak');
      localStorage.removeItem('attendance_checkInTime');
      localStorage.removeItem('attendance_secondsWorked');
      localStorage.removeItem('attendance_breakSeconds');
      localStorage.removeItem('attendance_totalBreakSeconds');
    }

    if (addNotification) addNotification('Clocked Out successfully!');

    const formattedDuration = formatTime(secondsWorked);

    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      await fetch('/api/attendance', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          employee: profileData.name,
          date: getLocalDateString(now),
          checkIn: checkInTime || '09:00:00 AM',
          checkOut: timeStr,
          status: 'Present',
          hours: formattedDuration
        })
      });
      fetchDashboardData();
    } catch (error) {
      console.error(error);
    }
  };

  const toggleBreak = async () => {
    const nextOnBreak = !isOnBreak;
    setIsOnBreak(nextOnBreak);
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    if (addNotification) addNotification(nextOnBreak ? `Break started at ${timeStr}` : `Break ended at ${timeStr}. Shift resumed!`);

    try {
      const todayStr = getLocalDateString(now);
      // Find today's record in recentAttendance
      const todayRecord = recentAttendance.find((a: any) => a.date === todayStr);
      let existingBreaks = [];
      if (todayRecord && Array.isArray(todayRecord.breaks)) {
        existingBreaks = todayRecord.breaks.map((b: any) => ({
          start: b.start,
          end: b.end
        }));
      }

      if (nextOnBreak) {
        // Start a new break
        existingBreaks.push({ start: timeStr, end: '-' });
      } else {
        // End the last active break
        if (existingBreaks.length > 0) {
          const lastIdx = existingBreaks.length - 1;
          existingBreaks[lastIdx] = { ...existingBreaks[lastIdx], end: timeStr };
        } else {
          existingBreaks.push({ start: timeStr, end: timeStr });
        }
      }

      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      await fetch('/api/attendance', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          employee: profileData.name,
          date: todayStr,
          breaks: existingBreaks
        })
      });
      fetchDashboardData();
    } catch (error) {
      console.error("Error updating break status:", error);
    }
  };

  // Idle detection effect (5 minutes = 300,000 ms)
  useEffect(() => {
    let idleTimeout: any = null;

    const resetIdleTimer = () => {
      setIsIdle(false);
      if (idleTimeout) clearTimeout(idleTimeout);
      
      // Auto-break/offline after 5 minutes of total inactivity (300000ms)
      idleTimeout = setTimeout(() => {
        setIsIdle(true);
      }, 300000); 
    };

    resetIdleTimer();

    window.addEventListener('mousemove', resetIdleTimer);
    window.addEventListener('keydown', resetIdleTimer);
    window.addEventListener('mousedown', resetIdleTimer);
    window.addEventListener('scroll', resetIdleTimer);
    window.addEventListener('touchstart', resetIdleTimer);

    return () => {
      if (idleTimeout) clearTimeout(idleTimeout);
      window.removeEventListener('mousemove', resetIdleTimer);
      window.removeEventListener('keydown', resetIdleTimer);
      window.removeEventListener('mousedown', resetIdleTimer);
      window.removeEventListener('scroll', resetIdleTimer);
      window.removeEventListener('touchstart', resetIdleTimer);
    };
  }, []);

  // Leave Form States
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveDates, setLeaveDates] = useState('');
  const [leaveType, setLeaveType] = useState('Annual Leave');

  const handleApplyLeave = async (type: string, date: string, reason: string) => {
    const payload = {
      employee: profileData.email,
      name: profileData.name,
      type: type || 'Annual Leave',
      date: date || 'Selected Dates',
      duration: '1 Day',
      status: 'Pending',
      reason: reason || 'Applied from Employee Hub',
      dept: profileData.department || 'Corporate'
    };

    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/leaves', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const resData = await res.json();
        const savedLeave = resData.leave || { ...payload, _id: Date.now().toString() };
        setLeaves(prev => [savedLeave, ...prev]);
        setShowLeaveModal(false);
        addNotification('Leave application submitted to HR!');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const toggleTaskStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Completed' ? 'Pending' : 'Completed';
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setEmployeeTasks(prev => prev.map(t => t._id === id ? { ...t, status: newStatus } : t));
        addNotification(`Task marked as ${newStatus}!`);
      } else {
        addNotification('Failed to update task status.');
      }
    } catch (error) {
      console.error("Error toggling task status:", error);
      addNotification('Error connecting to database to update task.');
    }
  };

  // Leave Analytics Calculation
  const myLeaves = leaves.filter(l => l.employee === profileData.name || l.name === profileData.name);
  const pendingCount = myLeaves.filter(l => l.status === 'Pending').length;
  const approvedCount = myLeaves.filter(l => l.status === 'Approved').length;
  const remainingLeaves = totalLeavesLimit - approvedCount;

  // Format dynamic stat strings
  const totalSecs = totalHoursLogged + (isCheckedIn && !isOnBreak ? secondsWorked : 0);
  const hoursLoggedStr = `${(totalSecs / 3600).toFixed(1)} Hrs`;

  const averageRating = performanceReviews.length > 0
    ? (performanceReviews.reduce((sum, r) => sum + r.rating, 0) / performanceReviews.length).toFixed(1)
    : null;
  const performanceRatingStr = averageRating ? `${averageRating} Score` : 'N/A Score';

  const sickLeavesAllowedStr = `${sickLeaveLimit} Allowed`;

  return (
    <div className="flex flex-col font-sans w-full min-h-[calc(100vh-80px)] bg-transparent dark:bg-transparent">
      
      {/* Dynamic Tabs Workspace Content */}
      <div className="flex-1 w-full overflow-y-auto no-scrollbar bg-transparent dark:bg-transparent">
 
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={cn(
              "w-full",
              activeTab === 'messages' 
                ? "p-0 max-w-none h-full" 
                : "p-5 lg:p-6 max-w-6xl mx-auto"
            )}
          >
            
            {activeTab === 'overview' && (
              <OverviewTab 
                profileData={profileData}
                isCheckedIn={isCheckedIn}
                isOnBreak={isOnBreak}
                secondsWorked={secondsWorked}
                breakSeconds={breakSeconds}
                TARGET_SECONDS={TARGET_SECONDS}
                formatTime={formatTime}
                toggleBreak={toggleBreak}
                isCheckedInToggler={isCheckedIn ? handleClockOut : handleClockIn}
                remainingLeaves={remainingLeaves}
                announcements={announcements}
                jobs={jobs}
                setActiveTab={setActiveTab}
                setShowLeaveModal={setShowLeaveModal}
                profile={profile}
                onOpenMessenger={() => setActiveTab('messages')}
                hoursLogged={hoursLoggedStr}
                sickLeavesAllowed={sickLeavesAllowedStr}
                performanceRating={performanceRatingStr}
                checkInTime={checkInTime}
                hrViewAsEmployee={hrViewAsEmployee}
                onSwitchToHR={onSwitchToHR}
                onOpenSearch={onOpenSearch}
              />
            )}

            {activeTab === 'attendance' && (
              <AttendanceTab 
                isCheckedIn={isCheckedIn}
                isOnBreak={isOnBreak}
                secondsWorked={secondsWorked}
                breakSeconds={breakSeconds}
                totalBreakSeconds={totalBreakSeconds}
                formatTime={formatTime}
                handleClockIn={handleClockIn}
                handleClockOut={handleClockOut}
                toggleBreak={toggleBreak}
                recentAttendance={recentAttendance}
                checkInTime={checkInTime}
                isIdle={isIdle}
                shiftStart={shiftStart}
                shiftEnd={shiftEnd}
                maxBreakTime={maxBreakTime}
                companyName={companyName}
              />
            )}

            {activeTab === 'leaves' && (
              <LeaveTab 
                totalLeavesLimit={totalLeavesLimit}
                approvedCount={approvedCount}
                remainingLeaves={remainingLeaves}
                myLeaves={myLeaves}
                setShowLeaveModal={setShowLeaveModal}
                calendarWidget={<HolidaysCalendar userRole="Employee" addNotification={addNotification} />}
              />
            )}

            {activeTab === 'payroll' && (
              <PayrollTab 
                payrolls={payrolls}
                setShowSlipModal={setShowSlipModal}
              />
            )}



            {activeTab === 'performance' && (
              <PerformanceTab 
                profileData={profileData}
                addNotification={addNotification}
              />
            )}

            {activeTab === 'profile' && (
              <ProfileTab 
                profileData={profileData}
                setProfileData={setProfileData}
                addNotification={addNotification}
              />
            )}



            {activeTab === 'recruitment' && (
              <RecruitmentTab 
                jobs={jobs}
                setJobs={setJobs}
                profileData={profileData}
                addNotification={addNotification}
              />
            )}

            {activeTab === 'announcements' && (
              <AnnouncementsTab announcements={announcements} />
            )}

            {activeTab === 'daily-updates' && (
              <DailyWorkUpdatesTab 
                profileData={profileData}
                addNotification={addNotification}
              />
            )}

            {activeTab === 'policies' && (
              <CompanyPoliciesTab />
            )}

            {/* ── Full-page tabs rendered inside Employee Dashboard ── */}
            {activeTab === 'messages' && (
              <WorkplaceChat profile={profile} addNotification={addNotification} />
            )}

            {activeTab === 'feed' && (
              <CommunityFeed profile={profile} addNotification={addNotification} />
            )}

            {activeTab === 'helpdesk' && (
              <HelpDeskPage userRole="Employee" profile={profile} addNotification={addNotification} />
            )}

            {activeTab === 'orgchart' && (
              <OrgChartPage userRole="Employee" profile={profile} addNotification={addNotification} />
            )}

            {activeTab === 'expenses' && (
              <ExpensesPage />
            )}

            {activeTab === 'offboarding' && (
              <OffboardingPage userRole="Employee" profile={profile} />
            )}

            {activeTab === 'settings' && (
              <SettingsPage
                userRole="Employee"
                setUserRole={() => {}}
                addNotification={addNotification}
                profile={profile}
                setProfile={() => {}}
                notifications={{}}
                setNotifications={() => {}}
              />
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* Leave Application Modal overlay */}
      <AnimatePresence>
        {showLeaveModal && (
          <LeaveRequestModal 
            key="leave-modal"
            isOpen={showLeaveModal}
            onClose={() => setShowLeaveModal(false)}
            leaveReason={leaveReason}
            setLeaveReason={setLeaveReason}
            leaveType={leaveType}
            setLeaveType={setLeaveType}
            leaveDates={leaveDates}
            setLeaveDates={setLeaveDates}
            onSubmit={handleApplyLeave}
          />
        )}

        {/* Payslip details Viewer Modal with isolation print capability */}
        {showSlipModal && (() => {
          const basicVal = Number(showSlipModal.basic || showSlipModal.basicSalary || 0);
          const hraVal = Number(showSlipModal.hra || 0);
          const allowanceVal = Number(showSlipModal.allowance || showSlipModal.allowances || 0);
          const bonusVal = Number(showSlipModal.bonus || 0);
          const overtimeVal = Number(showSlipModal.overtime || 0);

          const pfVal = Number(showSlipModal.pf || 0);
          const esiVal = Number(showSlipModal.esi || 0);
          const taxVal = Number(showSlipModal.tax || showSlipModal.tds || 0);
          const lopVal = Number(showSlipModal.leaveDeductions || 0);
          const otherDeductVal = Number(showSlipModal.otherDeductions || 0);

          const grossEarnings = basicVal + hraVal + allowanceVal + bonusVal + overtimeVal;
          const totalDeductions = pfVal + esiVal + taxVal + lopVal + otherDeductVal;
          const netDisbursed = Number(showSlipModal.net || showSlipModal.netSalary || (grossEarnings - totalDeductions));

          const numberToWords = (num: number): string => {
            if (num === 0) return 'Zero Rupees Only';
            const a = [
              '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
              'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
            ];
            const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
            
            const convertLessThanThousand = (n: number): string => {
              if (n === 0) return '';
              if (n < 20) return a[n] + ' ';
              const temp = n % 100;
              if (temp < 20) {
                return a[Math.floor(n / 100)] + (n >= 100 ? ' Hundred ' : '') + a[temp] + ' ';
              }
              return a[Math.floor(n / 100)] + (n >= 100 ? ' Hundred ' : '') + b[Math.floor(temp / 10)] + ' ' + a[temp % 10] + ' ';
            };
            
            let word = '';
            let tempNum = Math.floor(num);
            
            if (tempNum >= 10000000) {
              word += convertLessThanThousand(Math.floor(tempNum / 10000000)) + 'Crore ';
              tempNum %= 10000000;
            }
            if (tempNum >= 100000) {
              word += convertLessThanThousand(Math.floor(tempNum / 100000)) + 'Lakh ';
              tempNum %= 100000;
            }
            if (tempNum >= 1000) {
              word += convertLessThanThousand(Math.floor(tempNum / 1000)) + 'Thousand ';
              tempNum %= 1000;
            }
            if (tempNum > 0) {
              word += convertLessThanThousand(tempNum);
            }
            
            return word.trim() + ' Rupees Only';
          };

          return (
            <div className="fixed inset-0 z-[200] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
              <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                  body * {
                    visibility: hidden;
                  }
                  .printable-slip, .printable-slip * {
                    visibility: visible;
                  }
                  .printable-slip {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    padding: 0 !important;
                    margin: 0 !important;
                    box-shadow: none !important;
                    background: white !important;
                    color: black !important;
                  }
                  .print-hidden {
                    display: none !important;
                  }
                }
              `}} />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl p-5 shadow-2xl relative border border-slate-150/40 dark:border-slate-800/85 printable-slip max-h-[92vh] overflow-y-auto print:max-h-full print:p-0 print:border-none print:shadow-none scrollbar-thin scrollbar-thumb-slate-205 dark:scrollbar-thumb-slate-800"
              >
                {/* Header controls */}
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 print-hidden">
                  <span className="text-[9px] font-black uppercase tracking-widest bg-blue-50 dark:bg-slate-800 text-blue-650 dark:text-blue-400 px-2.5 py-1 rounded-lg">
                    Salary Payslip Receipt
                  </span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => window.print()}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-755 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 shadow-md shadow-blue-500/10 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" /> Print / Save PDF
                    </button>
                    <button 
                      onClick={() => setShowSlipModal(null)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white text-slate-650 rounded-lg text-[9px] font-black uppercase tracking-widest cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>

                {/* Printable Document Sheet */}
                <div className="space-y-4 text-slate-800 dark:text-slate-100 print:text-black">
                  {/* Top Header Block */}
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-3 pb-3 border-b border-slate-200 dark:border-slate-805">
                    <div className="text-left space-y-0.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-650 rounded-xl flex items-center justify-center font-black text-white text-xs print:bg-black">
                          HC
                        </div>
                        <div>
                          <h1 className="text-base font-black tracking-tight text-slate-900 dark:text-white print:text-black">HR CORE SYSTEMS INC.</h1>
                          <p className="text-[7.5px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">ISO 27001 & 9001 Certified Enterprise Portal</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-405 dark:text-slate-400">PAY SLIP & ADVICE</h2>
                      <p className="text-sm font-black text-blue-650 print:text-black uppercase mt-0.5">{showSlipModal.month}</p>
                      <p className="text-[7.5px] font-mono text-slate-400 uppercase">SLIP ID: SLIP-{showSlipModal._id?.slice(-8).toUpperCase() || 'MOCK'}</p>
                    </div>
                  </div>

                  {/* Personnel & Payroll Metadata Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2.5 p-3.5 bg-slate-50/50 dark:bg-slate-850/30 rounded-xl border border-slate-100 dark:border-slate-800 print:bg-white print:border-none print:p-0">
                    <div className="space-y-0.5 text-left">
                      <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest">Employee Name</span>
                      <p className="text-[11px] font-black text-slate-900 dark:text-white print:text-black uppercase">{showSlipModal.employeeName}</p>
                    </div>
                    <div className="space-y-0.5 text-left">
                      <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest">Designation</span>
                      <p className="text-[11px] font-bold text-slate-655 dark:text-slate-350">{profileData.designation}</p>
                    </div>
                    <div className="space-y-0.5 text-left">
                      <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest">Department</span>
                      <p className="text-[11px] font-bold text-slate-655 dark:text-slate-350">{profileData.department}</p>
                    </div>
                    <div className="space-y-0.5 text-left">
                      <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest">Employee Email</span>
                      <p className="text-[11px] font-bold text-slate-655 dark:text-slate-350 truncate">{showSlipModal.employee || profileData.email}</p>
                    </div>

                    <div className="space-y-0.5 text-left border-t border-slate-100 dark:border-slate-800/40 pt-1.5 md:border-t-0 md:pt-0">
                      <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest">Bank Account Info</span>
                      <p className="text-[11px] font-bold text-slate-655 dark:text-slate-350 uppercase">{profileData.bankName}</p>
                      <p className="text-[9px] text-slate-450 font-mono">A/c: ****{profileData.accountNumber?.slice(-4) || '7890'}</p>
                    </div>
                    <div className="space-y-0.5 text-left border-t border-slate-100 dark:border-slate-800/40 pt-1.5 md:border-t-0 md:pt-0">
                      <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest">IFSC Code</span>
                      <p className="text-[11px] font-bold text-slate-655 dark:text-slate-350 font-mono">{profileData.ifscCode}</p>
                    </div>
                    <div className="space-y-0.5 text-left border-t border-slate-100 dark:border-slate-800/40 pt-1.5 md:border-t-0 md:pt-0">
                      <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest">UAN / PF Number</span>
                      <p className="text-[11px] font-bold text-slate-655 dark:text-slate-350 font-mono">UAN-10098{showSlipModal._id?.slice(-5) || '4029'}</p>
                    </div>
                    <div className="space-y-0.5 text-left border-t border-slate-100 dark:border-slate-800/40 pt-1.5 md:border-t-0 md:pt-0">
                      <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest">Month Paid Days</span>
                      <p className="text-[11px] font-bold text-slate-655 dark:text-slate-350">{showSlipModal.workingDays || 30} / 30 Days</p>
                    </div>
                  </div>

                  {/* Calculations Details Columns */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Earnings Segment */}
                    <div className="border border-slate-150/40 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                      <div className="bg-slate-50 dark:bg-slate-850 px-3.5 py-1.5 border-b border-slate-150/40 text-left">
                        <span className="text-[8.5px] font-black uppercase tracking-widest text-slate-900 dark:text-white print:text-black">Earnings Summary</span>
                      </div>
                      <div className="p-3 space-y-1.5 text-[11px] text-left">
                        <div className="flex justify-between font-bold">
                          <span className="text-slate-455">Basic Salary (Adjusted):</span>
                          <span className="text-slate-900 dark:text-white print:text-black font-extrabold">₹{basicVal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-bold">
                          <span className="text-slate-455">House Rent Allowance (HRA):</span>
                          <span className="text-slate-900 dark:text-white print:text-black font-extrabold">₹{hraVal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-bold">
                          <span className="text-slate-455">Special Allowances:</span>
                          <span className="text-slate-900 dark:text-white print:text-black font-extrabold">₹{allowanceVal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-bold">
                          <span className="text-slate-455">Performance Bonus:</span>
                          <span className="text-slate-900 dark:text-white print:text-black font-extrabold">₹{bonusVal.toLocaleString()}</span>
                        </div>
                        {overtimeVal > 0 && (
                          <div className="flex justify-between font-bold">
                            <span className="text-slate-455">Overtime Payout:</span>
                            <span className="text-slate-900 dark:text-white print:text-black font-extrabold">₹{overtimeVal.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex justify-between font-black text-slate-950 dark:text-white print:text-black">
                          <span>Gross Salary:</span>
                          <span>₹{grossEarnings.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Deductions Segment */}
                    <div className="border border-slate-150/40 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                      <div className="bg-slate-50 dark:bg-slate-850 px-3.5 py-1.5 border-b border-slate-150/40 text-left">
                        <span className="text-[8.5px] font-black uppercase tracking-widest text-slate-900 dark:text-white print:text-black">Statutory Deductions</span>
                      </div>
                      <div className="p-3 space-y-1.5 text-[11px] text-left">
                        <div className="flex justify-between font-bold">
                          <span className="text-slate-455">Provident Fund (PF):</span>
                          <span className="text-rose-500 font-extrabold">₹{pfVal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-bold">
                          <span className="text-slate-455">ESI Contribution:</span>
                          <span className="text-rose-500 font-extrabold">₹{esiVal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-bold">
                          <span className="text-slate-455">TDS Income Tax:</span>
                          <span className="text-rose-500 font-extrabold">₹{taxVal.toLocaleString()}</span>
                        </div>
                        {lopVal > 0 && (
                          <div className="flex justify-between font-bold">
                            <span className="text-slate-455">LOP Days Deductions:</span>
                            <span className="text-rose-500 font-extrabold">₹{lopVal.toLocaleString()}</span>
                          </div>
                        )}
                        {otherDeductVal > 0 && (
                          <div className="flex justify-between font-bold">
                            <span className="text-slate-455">Other Deductions:</span>
                            <span className="text-rose-500 font-extrabold">₹{otherDeductVal.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex justify-between font-black text-rose-600 dark:text-rose-500 print:text-black">
                          <span>Total Deductions:</span>
                          <span>₹{totalDeductions.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Net Pay Gradient Banner */}
                  <div className="p-4 bg-slate-900 dark:bg-blue-900/20 text-white dark:text-blue-100 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 print:bg-white print:text-black print:border-y-2 print:border-black print:rounded-none print:p-3">
                    <div className="text-left space-y-0.5">
                      <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-blue-300">NET DISBURSED AMOUNT</p>
                      <p className="text-[9.5px] font-black text-slate-300 dark:text-blue-200">{numberToWords(netDisbursed)}</p>
                      <p className="text-[7.5px] font-bold text-slate-400 dark:text-slate-450 italic">Credited directly to the salary bank account above</p>
                    </div>
                    <div className="text-right w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800 flex sm:flex-col justify-between sm:justify-start items-center sm:items-end">
                      <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">Disbursed net</span>
                      <h3 className="text-xl font-black text-white print:text-black">₹{netDisbursed.toLocaleString()}</h3>
                    </div>
                  </div>

                  {/* Corporate note and Disclaimers */}
                  <div className="flex justify-between items-end pt-3 text-[8.5px] font-bold text-slate-405 dark:text-slate-500">
                    <div className="text-left">
                      <p className="uppercase tracking-wider">Corporate Systems Protocol</p>
                      <p className="text-slate-900 dark:text-white print:text-black font-black mt-0.5">Certified Secure by HR Core Portal Finance Team</p>
                    </div>
                    <div className="text-right border-t border-slate-200 dark:border-slate-800 pt-1.5 w-44">
                      <p className="text-slate-900 dark:text-white print:text-black font-black">Authorized Digital Signature</p>
                      <p className="text-[7.5px] font-medium mt-0.5">No physical signature required</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
      <HrAiAssistant />
    </div>
  );
}
