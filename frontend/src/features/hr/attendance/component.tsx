"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Download, Filter, Search, Calendar as CalendarIcon, 
  CheckCircle2, Clock, AlertCircle, XCircle
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { useUIStore } from '@/store/uiStore';
import { usePermission } from '@/context/PermissionContext';

// Import modular attendance components
import AttendanceStats from './components/AttendanceStats';
import AttendanceTable from './components/AttendanceTable';
import { AttendanceTab } from '@/features/employee/dashboard/components/AttendanceTab';

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
    }

    let d = new Date();
    if (dateStr) {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        d = new Date(year, month, day);
      }
    }
    
    d.setHours(hours, minutes, seconds, 0);
    return d;
  } catch (e) {
    return new Date();
  }
};

export default function AttendancePage({ userRole = 'Admin', profile = { name: 'Rahul Sharma' } }: any) {
  const { can } = usePermission();
  const { selectedBranchId } = useUIStore();
  const [activeSubTab, setActiveSubTab] = useState<'workforce' | 'self'>(
    !can('attendance.approve') ? 'self' : 'workforce'
  );

  const [isCheckedIn, setIsCheckedIn] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hr_attendance_isCheckedIn');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });

  const [isOnBreak, setIsOnBreak] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hr_attendance_isOnBreak');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });

  const [checkInTime, setCheckInTime] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('hr_attendance_checkInTime');
    }
    return null;
  });

  const [secondsWorked, setSecondsWorked] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hr_attendance_secondsWorked');
      return saved ? Number(saved) : 0;
    }
    return 0;
  });

  const [breakSeconds, setBreakSeconds] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hr_attendance_breakSeconds');
      return saved ? Number(saved) : 0;
    }
    return 0;
  });

  const [totalBreakSeconds, setTotalBreakSeconds] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hr_attendance_totalBreakSeconds');
      return saved ? Number(saved) : 0;
    }
    return 0;
  });

  const [selfRecentAttendance, setSelfRecentAttendance] = useState<any[]>([]);
  const [isIdle, setIsIdle] = useState(false);

  const [attendance, setAttendance] = useState<any[]>([]);

  // Sync self-attendance states to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('hr_attendance_isCheckedIn', JSON.stringify(isCheckedIn));
      localStorage.setItem('hr_attendance_isOnBreak', JSON.stringify(isOnBreak));
      if (checkInTime) {
        localStorage.setItem('hr_attendance_checkInTime', checkInTime);
      } else {
        localStorage.removeItem('hr_attendance_checkInTime');
      }
    }
  }, [isCheckedIn, isOnBreak, checkInTime]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('hr_attendance_secondsWorked', secondsWorked.toString());
    }
  }, [secondsWorked]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('hr_attendance_breakSeconds', breakSeconds.toString());
    }
  }, [breakSeconds]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('hr_attendance_totalBreakSeconds', totalBreakSeconds.toString());
    }
  }, [totalBreakSeconds]);

  // Live Timer Effect for self-attendance
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

  // Fetch self attendance logs
  const fetchSelfAttendance = async () => {
    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const attRes = await fetch('/api/attendance', { headers });
      if (attRes.ok) {
        const data = await attRes.json();
        const hrAttendance = data.filter((a: any) => a.employee === profile?.name);
        setSelfRecentAttendance(hrAttendance.slice(0, 14));
      }
    } catch (err) {
      console.error("Failed to fetch self attendance logs:", err);
    }
  };

  useEffect(() => {
    if (profile?.name) {
      fetchSelfAttendance();
    }
  }, [profile?.name, attendance]);

  // Restore clock state from database
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayRecord = selfRecentAttendance.find((a: any) => a.date === todayStr);
    
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
  }, [selfRecentAttendance]);

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

    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const offset = now.getTimezoneOffset();
      const localDate = new Date(now.getTime() - (offset * 60 * 1000));
      const todayStr = localDate.toISOString().split('T')[0];

      await fetch('/api/attendance', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          employee: profile?.name || 'Rahul Sharma',
          date: todayStr,
          checkIn: timeStr,
          checkOut: '',
          status: 'Present',
          hours: '00:00:00',
          breaks: []
        })
      });
      fetchAttendance();
      fetchSelfAttendance();
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
      localStorage.removeItem('hr_attendance_isCheckedIn');
      localStorage.removeItem('hr_attendance_isOnBreak');
      localStorage.removeItem('hr_attendance_checkInTime');
      localStorage.removeItem('hr_attendance_secondsWorked');
      localStorage.removeItem('hr_attendance_breakSeconds');
      localStorage.removeItem('hr_attendance_totalBreakSeconds');
    }

    const formattedDuration = formatTime(secondsWorked);

    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const offset = now.getTimezoneOffset();
      const localDate = new Date(now.getTime() - (offset * 60 * 1000));
      const todayStr = localDate.toISOString().split('T')[0];

      await fetch('/api/attendance', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          employee: profile?.name || 'Rahul Sharma',
          date: todayStr,
          checkIn: checkInTime || '09:00:00 AM',
          checkOut: timeStr,
          status: 'Present',
          hours: formattedDuration
        })
      });
      fetchAttendance();
      fetchSelfAttendance();
    } catch (error) {
      console.error(error);
    }
  };

  const toggleBreak = async () => {
    const nextOnBreak = !isOnBreak;
    setIsOnBreak(nextOnBreak);
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    try {
      const offset = now.getTimezoneOffset();
      const localDate = new Date(now.getTime() - (offset * 60 * 1000));
      const todayStr = localDate.toISOString().split('T')[0];

      let existingBreaks = [];
      const todayRecord = selfRecentAttendance.find((a: any) => a.date === todayStr);
      if (todayRecord && Array.isArray(todayRecord.breaks)) {
        existingBreaks = todayRecord.breaks.map((b: any) => ({
          start: b.start,
          end: b.end
        }));
      }

      if (nextOnBreak) {
        existingBreaks.push({ start: timeStr, end: '-' });
      } else {
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
          employee: profile?.name || 'Rahul Sharma',
          date: todayStr,
          breaks: existingBreaks
        })
      });
      fetchAttendance();
      fetchSelfAttendance();
    } catch (error) {
      console.error("Error updating break status:", error);
    }
  };

  useEffect(() => {
    let idleTimeout: any = null;
    const resetIdleTimer = () => {
      setIsIdle(false);
      if (idleTimeout) clearTimeout(idleTimeout);
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
  const [employees, setEmployees] = useState<any[]>([]);
  const [shiftStart, setShiftStart] = useState<string>('09:00 AM');
  const [shiftEnd, setShiftEnd] = useState<string>('06:00 PM');
  const [maxBreakTime, setMaxBreakTime] = useState<string>('60 Mins');
  const [companyName, setCompanyName] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All Departments');
  const [roleFilter, setRoleFilter] = useState<'All' | 'HR' | 'Employee'>('All');
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    const offset = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  });
  const [timeRange, setTimeRange] = useState('Week');

  const fetchSystemSettings = async () => {
    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`/api/settings/system?t=${Date.now()}`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data) {
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
    } catch (err) {
      console.error("Failed to fetch system settings in AttendancePage:", err);
    }
  };

  useEffect(() => {
    fetchSystemSettings();
    fetchAttendance();
    fetchEmployees();
  }, [selectedBranchId]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchAttendance();
      fetchEmployees();
    }, 10000);
    return () => clearInterval(interval);
  }, [selectedBranchId]);

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      let url = '/api/employees';
      if (selectedBranchId) {
        url += `?branchId=${selectedBranchId}`;
      }
      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        setEmployees(data);
      }
    } catch (err) {
      console.error('Failed to fetch employees:', err);
    }
  };

  const fetchAttendance = async () => {
    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      let url = '/api/attendance';
      if (selectedBranchId) {
        url += `?branchId=${selectedBranchId}`;
      }
      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        setAttendance(data);
      }
    } catch (err) {
      console.error('Failed to fetch attendance logs:', err);
    }
  };

  useEffect(() => {
    setTimeRange(can('attendance.approve') ? 'Today' : 'Week');
  }, [userRole]);

  const filteredData = useMemo(() => {
    let dataToFilter = attendance;
    
    if (!can('attendance.approve')) {
      dataToFilter = dataToFilter.filter(item => item.name === profile?.name);
    } else if (can('attendance.approve') && !can('settings.company')) {
      // HR only sees employees (no HR role, no HR department, and not themselves)
      dataToFilter = dataToFilter.filter(item => {
        if (item.name.toLowerCase() === profile?.name?.toLowerCase()) {
          return false;
        }
        const emp = employees.find(e => e.fullName === item.name);
        return emp ? (emp.department !== 'HR' && emp.role !== 'HR') : true;
      });
    } else if (can('settings.company')) {
      if (roleFilter === 'HR') {
        dataToFilter = dataToFilter.filter(item => {
          const emp = employees.find(e => e.fullName === item.name);
          return emp ? (emp.department === 'HR' || emp.role === 'HR') : false;
        });
      } else if (roleFilter === 'Employee') {
        dataToFilter = dataToFilter.filter(item => {
          const emp = employees.find(e => e.fullName === item.name);
          return emp ? (emp.department !== 'HR' && emp.role !== 'HR') : true;
        });
      }
    }

    // Apply department filter
    if (selectedDept !== 'All Departments') {
      dataToFilter = dataToFilter.filter(item => {
        const emp = employees.find(e => e.fullName === item.name);
        return emp ? emp.department === selectedDept : false;
      });
    }

    const selDate = new Date(selectedDate);
    selDate.setHours(0, 0, 0, 0);
    
    return dataToFilter.filter(item => {
      const itemDate = new Date(item.date);
      itemDate.setHours(0, 0, 0, 0);
      
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesRange = false;
      if (timeRange === 'Today') {
        matchesRange = item.date === selectedDate;
      } else if (timeRange === 'Week') {
        const diffTime = selDate.getTime() - itemDate.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        matchesRange = diffDays >= 0 && diffDays < 7;
      } else if (timeRange === 'Month') {
        matchesRange = itemDate.getMonth() === selDate.getMonth() && 
                       itemDate.getFullYear() === selDate.getFullYear();
      } else if (timeRange === 'Year') {
        matchesRange = itemDate.getFullYear() === selDate.getFullYear();
      }
      
      return matchesSearch && matchesRange;
    });
  }, [attendance, employees, searchTerm, roleFilter, selectedDate, timeRange, userRole, profile?.name, selectedDept]);

  // Stats Calculation
  const stats = useMemo(() => {
    const present = filteredData.filter(i => i.status === 'Present').length;
    const late = filteredData.filter(i => i.status === 'Late').length;
    const onLeave = filteredData.filter(i => i.status === 'On Leave').length;
    const absent = filteredData.filter(i => i.status === 'Absent').length;
    
    return [
      { label: 'Present', value: present, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
      { label: 'Late', value: late, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' },
      { label: 'On Leave', value: onLeave, icon: AlertCircle, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
      { label: 'Absent', value: absent, icon: XCircle, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-500/10' },
    ];
  }, [filteredData]);

  const handleExport = () => {
    const headers = ['Employee', 'Check In', 'Check Out', 'Work Hours', 'Status', 'Date'];
    const csvData = filteredData.map(item => [
      item.name, item.timeIn, item.timeOut, item.duration, item.status, item.date
    ]);
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_${timeRange.toLowerCase()}_report_${selectedDate}.csv`);
    link.click();
  };

  return (
    <div className="p-5 lg:p-6 max-w-7xl mx-auto space-y-6 min-h-screen text-left">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Attendance</h1>
          <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
            {userRole === 'Employee' ? 'Tracking your attendance and punctuality.' : 'Tracking workforce availability and punctuality.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="premium-nav-container">
            {(can('attendance.approve') ? ['Today', 'Week', 'Month', 'Year'] : ['Week', 'Month', 'Year']).map((range) => (
              <button 
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  "premium-nav-item active:scale-[0.98]",
                  timeRange === range ? "premium-nav-item-active" : ""
                )}
              >
                <span>{range === 'Today' ? "Today's" : range}</span>
              </button>
            ))}
          </div>
          <button 
            onClick={handleExport}
            className="px-4.5 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-[14px] text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Report
          </button>
        </div>
      </div>



      {activeSubTab === 'self' && userRole !== 'Admin' ? (
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
          recentAttendance={selfRecentAttendance}
          checkInTime={checkInTime}
          isIdle={isIdle}
          shiftStart={shiftStart}
          shiftEnd={shiftEnd}
          maxBreakTime={maxBreakTime}
          companyName={companyName}
        />
      ) : (
        <>

      {/* Quick Stats */}
      <AttendanceStats stats={stats} />

      {/* Table Section */}
      <div className="saas-card bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-150/40 dark:border-slate-800 shadow-sm">
        <div className="p-4.5 border-b border-slate-100 dark:border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
            {can('attendance.approve') && (
              <div className="w-full sm:max-w-[240px]">
                <input 
                  type="text" 
                  placeholder="Search employee name..." 
                  className="saas-input w-full pr-4 py-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none border border-transparent focus:border-blue-500/50"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            )}
            
            {can('settings.company') && (
              <div className="premium-nav-container">
                <button
                  onClick={() => setRoleFilter('All')}
                  className={cn(
                    "premium-nav-item active:scale-[0.98]",
                    roleFilter === 'All' ? "premium-nav-item-active" : ""
                  )}
                >
                  All
                </button>
                <button
                  onClick={() => setRoleFilter('HR')}
                  className={cn(
                    "premium-nav-item active:scale-[0.98]",
                    roleFilter === 'HR' ? "premium-nav-item-active" : ""
                  )}
                >
                  HR
                </button>
                <button
                  onClick={() => setRoleFilter('Employee')}
                  className={cn(
                    "premium-nav-item active:scale-[0.98]",
                    roleFilter === 'Employee' ? "premium-nav-item-active" : ""
                  )}
                >
                  Employees
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div>
              <input 
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="saas-input w-40 sm:w-44 pr-3 py-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer outline-none border border-transparent focus:border-blue-500/50"
              />
            </div>
            <div className="relative flex items-center">
              <select 
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-40 sm:w-44 pl-3 pr-8 py-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer outline-none border border-transparent focus:border-blue-500/50 appearance-none"
              >
                <option>All Departments</option>
                <option>Engineering</option>
                <option>Design</option>
                <option>Sales</option>
                <option>HR</option>
              </select>
              <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-3 pointer-events-none" />
            </div>
          </div>
        </div>

        {filteredData.length > 0 ? (
          <AttendanceTable filteredData={filteredData} onRefresh={fetchAttendance} employees={employees} />
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-[2.5rem] flex items-center justify-center mb-6">
              <CalendarIcon className="w-10 h-10 text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">No records found</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto font-medium">
              We couldn't find any attendance logs for {timeRange.toLowerCase()} on this date.
            </p>
          </div>
        )}
      </div>
      </>
      )}
    </div>
  );
}
