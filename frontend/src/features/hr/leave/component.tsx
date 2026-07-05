"use client";

import React, { useState, useMemo } from 'react';
import { 
  Plus, Calendar, Clock, CheckCircle2, XCircle, 
  ChevronRight, ChevronLeft, X, Search, AlertCircle, Trash2,
  ChevronDown, Briefcase, Sliders, Sparkles, Users, UserCheck, Info, Filter,
  LayoutGrid, List
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";
import { PastelStatCard } from '@/components/ui/PastelStatCard';
import { usePermission } from '@/context/PermissionContext';

// Modular HR sub-components
import { ApplyLeaveModal } from './components/ApplyLeaveModal';
import { LeaveDetailsModal } from './components/LeaveDetailsModal';
import { LeaveTab } from '@/features/employee/dashboard/components/LeaveTab';
import { HolidaysCalendar } from './components/HolidaysCalendar';

const parseLeaveDates = (leave: any) => {
  const dateStr = leave?.date || '';
  const createdAt = leave?.createdAt ? new Date(leave.createdAt) : new Date();
  const defaultYear = createdAt.getFullYear();
  
  // Try parsing ISO or simple format first
  const parsed = Date.parse(dateStr);
  if (!isNaN(parsed)) {
    const d = new Date(parsed);
    return { start: d, end: d };
  }
  
  // Try splitting by hyphen or "to"
  const parts = dateStr.split(/[-–—]|to/i).map((s: string) => s.trim());
  
  const parsePart = (part: string) => {
    if (!part) return null;
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const words = part.toLowerCase().split(/\s+/);
    let monthIdx = -1;
    let day = -1;
    let year = defaultYear;
    
    for (const word of words) {
      const cleanWord = word.replace(/[^a-z0-9]/g, '');
      const m = months.findIndex(name => name === cleanWord || name.substring(0, 3) === cleanWord.substring(0, 3));
      if (m !== -1) {
        monthIdx = m;
      } else {
        const num = parseInt(cleanWord, 10);
        if (!isNaN(num)) {
          if (num > 1000) {
            year = num;
          } else if (day === -1) {
            day = num;
          } else if (monthIdx === -1 && num >= 1 && num <= 12) {
            monthIdx = num - 1;
          }
        }
      }
    }
    
    if (monthIdx !== -1 && day !== -1) {
      return new Date(year, monthIdx, day);
    }
    return null;
  };
  
  const startDate = parsePart(parts[0]);
  let endDate = parts[1] ? parsePart(parts[1]) : startDate;
  
  if (parts[1] && !endDate && startDate) {
    const num = parseInt(parts[1].replace(/[^0-9]/g, ''), 10);
    if (!isNaN(num)) {
      endDate = new Date(startDate.getFullYear(), startDate.getMonth(), num);
    }
  }
  
  return {
    start: startDate || createdAt,
    end: endDate || startDate || createdAt
  };
};

export default function LeaveManagementPage({ 
  leaves, 
  setLeaves, 
  userRole, 
  addNotification,
  profile
}: { 
  leaves: any[], 
  setLeaves: React.Dispatch<React.SetStateAction<any[]>>, 
  userRole: string, 
  addNotification?: (msg: string) => void,
  profile?: any
}) {
  const { can } = usePermission();
  const [activeTab, setActiveTab] = useState('All Requests');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedLeaveId, setSelectedLeaveId] = useState<string | number | null>(null);
  const [hrMaxLeaves, setHrMaxLeaves] = useState(24);
  const [employeeMaxLeaves, setEmployeeMaxLeaves] = useState(24);
  const [systemSettings, setSystemSettings] = useState<any>(null);
  const [hrActiveView, setHrActiveView] = useState<'my-leaves' | 'employee-requests'>('employee-requests');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [hrRequestStatusFilter, setHrRequestStatusFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('Pending');
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>('All Employees');
  const [isStaffDropdownOpen1, setIsStaffDropdownOpen1] = useState(false);
  const [isStaffDropdownOpen2, setIsStaffDropdownOpen2] = useState(false);
  const [dbEmployees, setDbEmployees] = useState<any[]>([]);
  const [ledgerRoleFilter, setLedgerRoleFilter] = useState<'All' | 'HR' | 'Employee'>('All');
  const [localHrLimit, setLocalHrLimit] = useState(24);
  const [localEmpLimit, setLocalEmpLimit] = useState(24);

  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('All Departments');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('All Types');
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');

  const [isDeptDropdownOpen1, setIsDeptDropdownOpen1] = useState(false);
  const [isDeptDropdownOpen2, setIsDeptDropdownOpen2] = useState(false);
  const [isTypeDropdownOpen1, setIsTypeDropdownOpen1] = useState(false);
  const [isTypeDropdownOpen2, setIsTypeDropdownOpen2] = useState(false);

  React.useEffect(() => {
    setLocalHrLimit(hrMaxLeaves);
  }, [hrMaxLeaves]);

  React.useEffect(() => {
    setLocalEmpLimit(employeeMaxLeaves);
  }, [employeeMaxLeaves]);

  React.useEffect(() => {
    if (activeTab === 'HR Leaves') {
      setLedgerRoleFilter('HR');
    } else if (activeTab === 'Employee Leaves') {
      setLedgerRoleFilter('Employee');
    } else {
      setLedgerRoleFilter('All');
    }
  }, [activeTab]);



  const handleUpdateAllowances = async (newHrLimit: number, newEmpLimit: number) => {
    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const updatedLeave = {
        ...(systemSettings?.leave || {}),
        hrMaxLeaves: newHrLimit,
        employeeMaxLeaves: newEmpLimit
      };

      const payload = {
        ...systemSettings,
        leave: updatedLeave
      };

      const res = await fetch('/api/settings/system', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setHrMaxLeaves(newHrLimit);
        setEmployeeMaxLeaves(newEmpLimit);
        if (addNotification) {
          addNotification(`Updated leave limits: HR (${newHrLimit} days), Employee (${newEmpLimit} days).`);
        }
      }
    } catch (e) {
      console.error("Failed to save allowances:", e);
    }
  };



  React.useEffect(() => {
    const fetchLeavesAndSettingsLocally = async () => {
      try {
        const token = localStorage.getItem('hr_system_token');
        const headers: HeadersInit = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(`/api/leaves?t=${Date.now()}`, { 
          cache: 'no-store',
          headers
        });
        if (res.ok) {
          const data = await res.json();
          setLeaves(data);
        }

        const settingsRes = await fetch(`/api/settings/system?t=${Date.now()}`, {
          headers
        });
        if (settingsRes.ok) {
          const data = await settingsRes.json();
          setSystemSettings(data);
          if (data && data.leave) {
            if (typeof data.leave.hrMaxLeaves === 'number') {
              setHrMaxLeaves(data.leave.hrMaxLeaves);
            }
            if (typeof data.leave.employeeMaxLeaves === 'number') {
              setEmployeeMaxLeaves(data.leave.employeeMaxLeaves);
            }
          }
        }

        const empRes = await fetch(`/api/employees?t=${Date.now()}`, {
          headers
        });
        if (empRes.ok) {
          const empData = await empRes.json();
          setDbEmployees(empData);
        }
      } catch (e) {
        console.error(e);
      }
    };
    
    // Initial fetch
    fetchLeavesAndSettingsLocally();

    // Poll every 30 seconds
    const interval = setInterval(fetchLeavesAndSettingsLocally, 30000);
    return () => clearInterval(interval);
  }, []);

  const currentLeaves = useMemo(() => {
    return leaves.map((l: any, idx: number) => ({
      ...l,
      id: l.id || l._id || `leave-${idx}`
    }));
  }, [leaves]);

  const selectedLeave = useMemo(() => 
    currentLeaves.find(l => l.id === selectedLeaveId),
    [currentLeaves, selectedLeaveId]
  );

  const departments = useMemo(() => {
    const depts = new Set<string>();
    leaves.forEach(l => {
      if (l.dept) depts.add(l.dept);
    });
    dbEmployees.forEach(e => {
      const d = e.dept || e.department;
      if (d) depts.add(d);
    });
    return ['All Departments', ...Array.from(depts)];
  }, [leaves, dbEmployees]);

  const leaveTypes = useMemo(() => {
    const types = new Set<string>();
    leaves.forEach(l => {
      if (l.type) types.add(l.type);
    });
    types.add('Sick Leave');
    types.add('Casual Leave');
    types.add('Paid Leave');
    types.add('Unpaid Leave');
    return ['All Types', ...Array.from(types)];
  }, [leaves]);

  const employeeRequestsList = useMemo(() => {
    return currentLeaves.filter((leave: any) => {
      if (!leave) return false;
      const empName = leave.employee || leave.name || '';
      const empDept = leave.dept || '';
      const isHr = empDept === 'HR' || empName === 'Priya Patel' || empName === 'Dipak Patil';
      
      const matchesSearch = empName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            empDept.toLowerCase().includes(searchTerm.toLowerCase());
      
      return !isHr && matchesSearch;
    });
  }, [currentLeaves, searchTerm]);

  const filteredEmployeeRequests = useMemo(() => {
    return employeeRequestsList.filter((leave: any) => {
      const empName = leave.employee || leave.name || '';
      const empDept = leave.dept || '';
      const leaveType = leave.type || '';

      const matchesStatus = hrRequestStatusFilter === 'All' ? true : leave.status === hrRequestStatusFilter;
      const matchesStaff = selectedStaffFilter === 'All Employees' ? true : empName === selectedStaffFilter;
      const matchesDept = selectedDeptFilter === 'All Departments' ? true : empDept === selectedDeptFilter;
      const matchesType = selectedTypeFilter === 'All Types' ? true : leaveType === selectedTypeFilter;

      let matchesDateRange = true;
      if (startDateFilter || endDateFilter) {
        const leaveDates = parseLeaveDates(leave);
        if (leaveDates.start && leaveDates.end) {
          if (startDateFilter) {
            const startLimit = new Date(startDateFilter);
            if (leaveDates.end < startLimit) matchesDateRange = false;
          }
          if (endDateFilter) {
            const endLimit = new Date(endDateFilter);
            if (leaveDates.start > endLimit) matchesDateRange = false;
          }
        }
      }

      return matchesStatus && matchesStaff && matchesDept && matchesType && matchesDateRange;
    });
  }, [employeeRequestsList, hrRequestStatusFilter, selectedStaffFilter, selectedDeptFilter, selectedTypeFilter, startDateFilter, endDateFilter]);

  const staffLeavesSummary = useMemo(() => {
    const summary: Record<string, { name: string; dept: string; approvedDays: number; pendingCount: number; maxLeaves?: number }> = {};
    
    // First, populate all database employees to capture everyone
    dbEmployees.forEach((emp: any) => {
      const empName = emp.name || emp.fullName || '';
      const empDept = emp.dept || emp.department || '';
      const isHr = empDept === 'HR' || empName === 'Priya Patel' || empName === 'Dipak Patil';
      const shouldExclude = userRole === 'HR' && isHr;
      if (!shouldExclude && empName) {
        summary[empName] = { name: empName, dept: empDept, approvedDays: 0, pendingCount: 0, maxLeaves: emp.maxLeaves };
      }
    });

    // Then, parse actual leaves data
    currentLeaves.forEach((leave: any) => {
      if (!leave) return;
      const empName = leave.employee || leave.name || '';
      const empDept = leave.dept || '';
      const isHr = empDept === 'HR' || empName === 'Priya Patel' || empName === 'Dipak Patil';
      const shouldExclude = userRole === 'HR' && isHr;
      
      if (shouldExclude) return;

      if (!summary[empName]) {
        summary[empName] = { name: empName, dept: empDept, approvedDays: 0, pendingCount: 0 };
      }

      if (leave.status === 'Approved') {
        const durationStr = leave.duration || '1 Day';
        const days = parseFloat(durationStr.replace(/[^\d.]/g, '')) || 1;
        summary[empName].approvedDays += days;
      }
      
      if (leave.status === 'Pending') {
        summary[empName].pendingCount += 1;
      }
    });
    
    return Object.values(summary);
  }, [dbEmployees, currentLeaves, userRole]);

  const staffNames = useMemo(() => {
    return ['All Employees', ...staffLeavesSummary.map(s => s.name)];
  }, [staffLeavesSummary]);

  const displayedLedgerItems = useMemo(() => {
    return staffLeavesSummary.filter(emp => {
      const isHr = emp.dept === 'HR' || emp.name === 'Priya Patel' || emp.name === 'Dipak Patil';
      if (ledgerRoleFilter === 'HR') return isHr;
      if (ledgerRoleFilter === 'Employee') return !isHr;
      return true;
    });
  }, [staffLeavesSummary, ledgerRoleFilter]);

  const displayedStaffNames = useMemo(() => {
    return ['All Employees', ...displayedLedgerItems.map(s => s.name)];
  }, [displayedLedgerItems]);

  // New Leave Form State
  const [newLeave, setNewLeave] = useState({
    employee: profile?.name || '',
    type: 'Sick Leave',
    duration: '',
    date: '',
    reason: '',
    dept: profile?.dept || 'Engineering'
  });

  // Sync newLeave form with profile when it loads
  React.useEffect(() => {
    if (profile?.name) {
      setNewLeave(prev => ({
        ...prev,
        employee: profile.name,
        dept: profile.dept || 'Engineering'
      }));
    }
  }, [profile]);

  const myLeavesOnly = useMemo(() => {
    return currentLeaves.filter((l: any) => {
      const empName = l.employee || l.name || '';
      return empName === profile?.name || 
             (profile?.name === 'Dipak Rajendra Patil' && (empName === 'Administrator' || empName === 'Dipak Patil' || empName === '')) ||
             (empName === 'Dipak Rajendra Patil' && (profile?.name === 'Administrator' || profile?.name === 'Dipak Patil' || profile?.name === ''));
    });
  }, [currentLeaves, profile?.name]);

  const myApprovedCount = useMemo(() => {
    return myLeavesOnly.filter((l: any) => l.status === 'Approved').length;
  }, [myLeavesOnly]);

  const tabList = useMemo(() => {
    if (userRole === 'Admin') {
      return ['All Requests', 'Pending', 'Approved', 'Rejected'];
    }
    if (userRole === 'HR') {
      return ['All Requests', 'Pending', 'Approved', 'Rejected', 'My Leaves'];
    }
    return ['All Requests', 'Pending', 'Approved', 'Rejected'];
  }, [userRole]);

  React.useEffect(() => {
    if (!tabList.includes(activeTab)) {
      setActiveTab('All Requests');
    }
  }, [tabList, activeTab]);

  const filteredLeaves = useMemo(() => {
    return currentLeaves.filter(leave => {
      if (!leave) return false;
      const empName = leave.employee || leave.name || '';
      const empDept = leave.dept || '';
      const leaveType = leave.type || '';
      
      const matchesStaff = selectedStaffFilter === 'All Employees' ? true : empName === selectedStaffFilter;
      if (!matchesStaff) return false;

      if (activeTab === 'My Leaves') {
        return empName === profile?.name;
      }

      if (activeTab === 'HR Leaves') {
        if (!(empDept === 'HR' || empName === 'Priya Patel' || empName === 'Dipak Patil')) return false;
      }

      if (activeTab === 'Employee Leaves') {
        if (empDept === 'HR' || empName === 'Priya Patel' || empName === 'Dipak Patil') return false;
      }

      const isOwner = userRole === 'Employee' ? (empName === profile?.name || empName === 'John Doe') : true;
      if (!isOwner) return false;

      const matchesTab = activeTab === 'All Requests' || leave.status === activeTab;
      if (!matchesTab) return false;

      const matchesDept = selectedDeptFilter === 'All Departments' ? true : empDept === selectedDeptFilter;
      if (!matchesDept) return false;

      const matchesType = selectedTypeFilter === 'All Types' ? true : leaveType === selectedTypeFilter;
      if (!matchesType) return false;

      let matchesDateRange = true;
      if (startDateFilter || endDateFilter) {
        const leaveDates = parseLeaveDates(leave);
        if (leaveDates.start && leaveDates.end) {
          if (startDateFilter) {
            const startLimit = new Date(startDateFilter);
            if (leaveDates.end < startLimit) matchesDateRange = false;
          }
          if (endDateFilter) {
            const endLimit = new Date(endDateFilter);
            if (leaveDates.start > endLimit) matchesDateRange = false;
          }
        }
      }
      if (!matchesDateRange) return false;

      const matchesSearch = userRole === 'Employee' ? true : (
        empName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        empDept.toLowerCase().includes(searchTerm.toLowerCase())
      );
      return matchesSearch;
    });
  }, [currentLeaves, activeTab, searchTerm, userRole, profile?.name, selectedStaffFilter, selectedDeptFilter, selectedTypeFilter, startDateFilter, endDateFilter]);

  const handleStatusChange = async (id: string | number, newStatus: string) => {
    try {
      // Optimistic update
      setLeaves(prev => prev.map(leave => (leave._id === id || leave.id === id) ? { ...leave, status: newStatus } : leave));
      
      const targetLeave = currentLeaves.find(l => l.id === id);
      if (targetLeave && addNotification) {
        addNotification(`Leave ${newStatus} for ${targetLeave.employee}`);
      }

      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      await fetch(`/api/leaves/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status: newStatus })
      });
      
      // Fetch latest leaves from backend right away
      const fetchHeaders: HeadersInit = {};
      if (token) {
        fetchHeaders['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`/api/leaves?t=${Date.now()}`, { cache: 'no-store', headers: fetchHeaders });
      if (res.ok) {
        const data = await res.json();
        setLeaves(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalEmployee = (userRole === 'Employee' || userRole === 'HR') ? (profile?.name || newLeave.employee) : newLeave.employee;
    
    const payload = { ...newLeave, employee: finalEmployee, name: finalEmployee };
    
    const token = localStorage.getItem('hr_system_token');
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    try {
      const res = await fetch('/api/leaves', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        // Fetch latest leaves from backend right away
        const fetchHeaders: HeadersInit = {};
        if (token) {
          fetchHeaders['Authorization'] = `Bearer ${token}`;
        }
        const fetchRes = await fetch(`/api/leaves?t=${Date.now()}`, { cache: 'no-store', headers: fetchHeaders });
        if (fetchRes.ok) {
          const data = await fetchRes.json();
          setLeaves(data);
        }
      }
    } catch (error) {
      console.error('Failed to submit leave', error);
    }
    
    setIsApplyModalOpen(false);
    setNewLeave({ employee: profile?.name || '', type: 'Sick Leave', duration: '', date: '', reason: '', dept: profile?.dept || 'Engineering' });
  };

  const openDetails = (leave: any) => {
    setSelectedLeaveId(leave.id);
    setIsDetailsModalOpen(true);
  };
  if (userRole === 'HR') {
    const totalRequests = employeeRequestsList.length;
    const pendingRequests = employeeRequestsList.filter((l: any) => l.status === 'Pending').length;
    const approvedRequests = employeeRequestsList.filter((l: any) => l.status === 'Approved').length;
    const rejectedRequests = employeeRequestsList.filter((l: any) => l.status === 'Rejected').length;

    return (
      <div className="p-5 lg:p-6 max-w-7xl mx-auto space-y-5 min-h-screen text-slate-800 dark:text-slate-200">
        
        {/* Switcher at the top of HR Leaves Hub */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 pb-5 border-b border-slate-155/40 dark:border-slate-800/40">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Briefcase className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest bg-blue-500/5 px-2.5 py-0.5 rounded-full border border-blue-500/10">HR Portal</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">Leaves Hub</h1>
          </div>
        </div>

        {hrActiveView === 'my-leaves' ? (
          <LeaveTab 
            totalLeavesLimit={hrMaxLeaves}
            approvedCount={myApprovedCount}
            remainingLeaves={hrMaxLeaves - myApprovedCount}
            myLeaves={myLeavesOnly}
            setShowLeaveModal={setIsApplyModalOpen}
            calendarWidget={<HolidaysCalendar userRole={userRole} addNotification={addNotification} />}
          />
        ) : (
          <div className="space-y-4">
            {/* Filter and Search Bar for Employee Requests */}
            <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200/50 dark:border-slate-800/80 shadow-md relative z-30 space-y-3">
              {/* Row 1: Status Filter & Search & View Mode */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="flex bg-slate-100/80 dark:bg-slate-955 p-0.5 rounded-lg border border-slate-200/40 dark:border-slate-800 gap-0.5 max-w-md w-full shadow-inner">
                  {(['Pending', 'Approved', 'Rejected', 'All'] as const).map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setHrRequestStatusFilter(filter)}
                      className={cn(
                        "px-2.5 py-1 rounded-md text-[8px] font-black tracking-wider uppercase transition-all whitespace-nowrap flex-1 text-center cursor-pointer border-none bg-transparent",
                        hrRequestStatusFilter === filter 
                          ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-md font-extrabold" 
                          : "text-slate-400 hover:text-slate-655 dark:hover:text-slate-200"
                      )}
                    >
                      {filter}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5 w-full lg:w-auto items-center">
                  <div className="relative w-full sm:w-56">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-3 w-3 text-slate-400" />
                    </span>
                    <input 
                      type="text" 
                      placeholder="Search staff..." 
                      className="w-full pl-9 pr-3.5 h-8.5 bg-slate-50 dark:bg-slate-955 text-[11px] text-slate-900 dark:text-white border border-slate-200/50 dark:border-slate-800/60 rounded-lg focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  {/* View Mode Switcher */}
                  <div className="flex items-center gap-1 bg-slate-150/70 dark:bg-slate-955/80 p-0.5 rounded-lg border border-slate-200/50 dark:border-slate-800 shadow-inner shrink-0 justify-center">
                    <button
                      type="button"
                      onClick={() => setViewMode('grid')}
                      className={cn(
                        "p-1 rounded-md transition-all cursor-pointer border-none bg-transparent flex items-center justify-center",
                        viewMode === 'grid'
                          ? "bg-white dark:bg-slate-805 text-blue-600 dark:text-blue-400 shadow-sm"
                          : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-305"
                      )}
                      title="Card View"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('list')}
                      className={cn(
                        "p-1 rounded-md transition-all cursor-pointer border-none bg-transparent flex items-center justify-center",
                        viewMode === 'list'
                          ? "bg-white dark:bg-slate-805 text-blue-600 dark:text-blue-400 shadow-sm"
                          : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-305"
                      )}
                      title="Row View"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Separator */}
              <div className="border-t border-slate-150/50 dark:border-slate-800/40 my-1" />

              {/* Row 2: Advanced Filters Grid & Reset */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                    <Sliders className="w-3 h-3 text-blue-500" />
                    Advanced Filters
                  </span>
                  {(selectedStaffFilter !== 'All Employees' || selectedDeptFilter !== 'All Departments' || selectedTypeFilter !== 'All Types' || startDateFilter || endDateFilter) && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStaffFilter('All Employees');
                        setSelectedDeptFilter('All Departments');
                        setSelectedTypeFilter('All Types');
                        setStartDateFilter('');
                        setEndDateFilter('');
                      }}
                      className="text-[9px] font-black uppercase tracking-wider text-rose-500 hover:text-rose-600 transition-all cursor-pointer bg-transparent border-none"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  {/* Department Dropdown */}
                  <div className="relative z-[80]">
                    <button
                      type="button"
                      onClick={() => {
                        setIsDeptDropdownOpen1(!isDeptDropdownOpen1);
                        setIsTypeDropdownOpen1(false);
                      }}
                      className="w-full h-8.5 px-3 bg-slate-50 dark:bg-slate-955 text-[11px] text-slate-900 dark:text-white border border-slate-200/50 dark:border-slate-800/60 rounded-lg cursor-pointer outline-none flex items-center justify-between transition-all duration-200 hover:border-slate-350 dark:hover:border-slate-700"
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        <Briefcase className="w-3 h-3 text-slate-400" />
                        {selectedDeptFilter === 'All Departments' ? 'All Departments' : selectedDeptFilter}
                      </span>
                      <ChevronDown className={cn("w-3 h-3 ml-1.5 text-slate-400 dark:text-slate-500 transition-transform duration-200", isDeptDropdownOpen1 && "transform rotate-180")} />
                    </button>
                    <AnimatePresence>
                      {isDeptDropdownOpen1 && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setIsDeptDropdownOpen1(false)} />
                          <motion.div
                            initial={{ opacity: 0, y: -8, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.95 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="absolute left-0 right-0 mt-1.5 py-1 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto no-scrollbar backdrop-blur-md origin-top"
                          >
                            {departments.map((dept) => (
                              <button
                                key={dept}
                                type="button"
                                onClick={() => {
                                  setSelectedDeptFilter(dept);
                                  setIsDeptDropdownOpen1(false);
                                }}
                                className={cn(
                                  "w-full text-left px-3 py-1.5 text-[11px] transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/60 block border-none bg-transparent cursor-pointer",
                                  selectedDeptFilter === dept 
                                    ? "text-blue-600 dark:text-blue-400 font-bold bg-blue-50/50 dark:bg-blue-955/20" 
                                    : "text-slate-700 dark:text-slate-300"
                                )}
                              >
                                {dept}
                              </button>
                            ))}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Leave Type Dropdown */}
                  <div className="relative z-[70]">
                    <button
                      type="button"
                      onClick={() => {
                        setIsTypeDropdownOpen1(!isTypeDropdownOpen1);
                        setIsDeptDropdownOpen1(false);
                      }}
                      className="w-full h-8.5 px-3 bg-slate-50 dark:bg-slate-955 text-[11px] text-slate-900 dark:text-white border border-slate-200/50 dark:border-slate-800/60 rounded-lg cursor-pointer outline-none flex items-center justify-between transition-all duration-200 hover:border-slate-355 dark:hover:border-slate-700"
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        <Info className="w-3 h-3 text-slate-400" />
                        {selectedTypeFilter === 'All Types' ? 'All Types' : selectedTypeFilter}
                      </span>
                      <ChevronDown className={cn("w-3.5 h-3.5 ml-1.5 text-slate-400 dark:text-slate-500 transition-transform duration-200", isTypeDropdownOpen1 && "transform rotate-180")} />
                    </button>
                    <AnimatePresence>
                      {isTypeDropdownOpen1 && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setIsTypeDropdownOpen1(false)} />
                          <motion.div
                            initial={{ opacity: 0, y: -8, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.95 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="absolute left-0 right-0 mt-1.5 py-1 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto no-scrollbar backdrop-blur-md origin-top"
                          >
                            {leaveTypes.map((type) => (
                              <button
                                key={type}
                                type="button"
                                onClick={() => {
                                  setSelectedTypeFilter(type);
                                  setIsTypeDropdownOpen1(false);
                                }}
                                className={cn(
                                  "w-full text-left px-3 py-1.5 text-[11px] transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/60 block border-none bg-transparent cursor-pointer",
                                  selectedTypeFilter === type 
                                    ? "text-blue-600 dark:text-blue-400 font-bold bg-blue-50/50 dark:bg-blue-955/20" 
                                    : "text-slate-700 dark:text-slate-300"
                                )}
                              >
                                {type}
                              </button>
                            ))}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Start Date */}
                  <div className="relative flex items-center bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800/60 rounded-lg px-2.5 h-8.5 text-[11px] font-bold text-slate-700 dark:text-slate-305 flex-1">
                    <Calendar className="w-3 h-3 text-slate-400 mr-1.5 shrink-0" />
                    <span className="text-[8px] text-slate-400 uppercase tracking-wider mr-1.5 shrink-0">From:</span>
                    <input 
                      type="date"
                      value={startDateFilter}
                      onChange={(e) => setStartDateFilter(e.target.value)}
                      className="bg-transparent outline-none text-slate-900 dark:text-white cursor-pointer w-full border-none p-0 text-[11px] font-bold"
                    />
                  </div>

                  {/* End Date */}
                  <div className="relative flex items-center bg-slate-50 dark:bg-slate-955 border border-slate-200/50 dark:border-slate-800/60 rounded-lg px-2.5 h-8.5 text-[11px] font-bold text-slate-700 dark:text-slate-305 flex-1">
                    <Calendar className="w-3 h-3 text-slate-400 mr-1.5 shrink-0" />
                    <span className="text-[8px] text-slate-400 uppercase tracking-wider mr-1.5 shrink-0">To:</span>
                    <input 
                      type="date"
                      value={endDateFilter}
                      onChange={(e) => setEndDateFilter(e.target.value)}
                      className="bg-transparent outline-none text-slate-900 dark:text-white cursor-pointer w-full border-none p-0 text-[11px] font-bold"
                    />
                  </div>
                </div>

                {/* Active Filter Badges */}
                {selectedStaffFilter !== 'All Employees' && (
                  <div className="flex flex-wrap gap-2 pt-2 items-center">
                    <span className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Active Filter:</span>
                    <div className="flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 px-2.5 py-0.5 rounded-full text-[10px] font-bold w-fit animate-fadeIn">
                      <span>Staff: {selectedStaffFilter}</span>
                      <button 
                        type="button"
                        onClick={() => setSelectedStaffFilter('All Employees')}
                        className="hover:text-blue-800 dark:hover:text-blue-200 transition-colors bg-transparent border-none cursor-pointer p-0 leading-none flex items-center shrink-0"
                      >
                        <X className="w-3 h-3 ml-1" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Overview Stats for Employee Requests */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 text-left">
              {[
                { label: 'Total Requests', value: totalRequests, icon: Calendar, accent: '#3B82F6', sub: 'All submitted leaves' },
                { label: 'Pending Approval', value: pendingRequests, icon: Clock, accent: '#F59E0B', sub: 'Awaiting HR decision' },
                { label: 'Approved Leaves', value: approvedRequests, icon: CheckCircle2, accent: '#10B981', sub: 'Granted off-times' },
                { label: 'Rejected Requests', value: rejectedRequests, icon: XCircle, accent: '#F43F5E', sub: 'Declined applications' }
              ].map((stat, idx) => (
                <PastelStatCard key={idx} icon={stat.icon} label={stat.label} value={stat.value} sub={stat.sub} accent={stat.accent} />
              ))}
            </div>

            {/* Split Grid for Requests + Ledger */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              
              {/* Left Column: Requests List */}
              <div className="xl:col-span-2 space-y-6">
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <AnimatePresence mode="popLayout">
                      {filteredEmployeeRequests.map((leave, idx) => {
                        const initial = leave.employee?.[0] || 'E';
                        return (
                          <motion.div
                            key={leave.id}
                            layout
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: idx * 0.03 }}
                            className="saas-card bg-white/80 dark:bg-slate-900/60 backdrop-blur-md p-3.5 relative group border border-slate-200/40 dark:border-slate-800/80 shadow-md hover:shadow-xl hover:border-slate-350/40 dark:hover:border-slate-700/60 transition-all duration-305 flex flex-col justify-between rounded-xl text-left"
                          >
                            <div className="space-y-2.5">
                              {/* Header: Employee Profile & Status */}
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-650 text-white flex items-center justify-center font-bold text-[11px] shadow-sm shadow-blue-500/10 shrink-0">
                                    {initial.toUpperCase()}
                                  </div>
                                  <div className="text-left min-w-0">
                                    <h3 className="font-bold text-xs text-slate-900 dark:text-white capitalize leading-tight mb-0.5 truncate">{leave.employee}</h3>
                                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider truncate">{leave.dept}</p>
                                  </div>
                                </div>
                                <span className={cn(
                                  "px-2 py-0.5 rounded text-[7.5px] font-bold uppercase tracking-wider border shadow-sm",
                                  leave.status === 'Approved' ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border-emerald-500/20" :
                                  leave.status === 'Pending' ? "bg-amber-500/10 text-amber-600 dark:text-amber-455 border-amber-500/20" :
                                  "bg-rose-500/10 text-rose-600 dark:text-rose-455 border-rose-500/20"
                                )}>
                                  {leave.status}
                                </span>
                              </div>

                              {/* Details Row: Dates & Duration */}
                              <div className="p-2.5 bg-slate-50/60 dark:bg-slate-950/40 border border-slate-100/30 dark:border-slate-850/30 rounded-xl flex items-center justify-between text-left">
                                <div className="flex items-center gap-2">
                                  <div className="p-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg">
                                    <Calendar className="w-3.5 h-3.5" />
                                  </div>
                                  <div className="leading-tight">
                                    <p className="text-[7.5px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Dates</p>
                                    <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200">{leave.date}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="px-2 py-0.5 bg-blue-500/15 text-blue-600 dark:text-blue-400 rounded text-[8px] font-bold uppercase tracking-wider">{leave.duration}</span>
                                </div>
                              </div>

                              {/* Type & Time Row */}
                              <div className="flex justify-between items-center text-[9.5px] font-medium text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/40 pt-2 px-0.5">
                                <span className="uppercase tracking-wider flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  Type: <strong className="text-slate-900 dark:text-slate-200 font-bold">{leave.type}</strong>
                                </span>
                                <span className="text-[8px] text-slate-400 font-semibold uppercase tracking-wider">
                                  {leave.createdAt ? new Date(leave.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>

                              {/* Reason for Request */}
                              <div className="bg-slate-50/45 dark:bg-slate-950/20 p-2.5 rounded-lg border border-slate-100 dark:border-slate-850 text-left">
                                <p className="text-[7.5px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Reason</p>
                                <p className="text-[11px] text-slate-650 dark:text-slate-350 font-medium leading-normal line-clamp-2 italic">
                                  "{leave.reason}"
                                </p>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div>
                              {leave.status === 'Pending' ? (
                                <div className="flex gap-2 mt-2.5">
                                  <button 
                                    onClick={() => handleStatusChange(leave.id, 'Approved')}
                                    className="flex-1 py-1.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-lg text-[8.5px] font-bold uppercase tracking-wider shadow-sm shadow-emerald-500/10 hover:shadow-md transition-all flex items-center justify-center gap-1 active:scale-95 cursor-pointer border-none"
                                  >
                                    <CheckCircle2 className="w-3 h-3" />
                                    Approve
                                  </button>
                                  <button 
                                    onClick={() => handleStatusChange(leave.id, 'Rejected')}
                                    className="flex-1 py-1.5 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white rounded-lg text-[8.5px] font-bold uppercase tracking-wider shadow-sm shadow-rose-500/10 hover:shadow-md transition-all flex items-center justify-center gap-1 active:scale-95 cursor-pointer border-none"
                                  >
                                    <XCircle className="w-3 h-3" />
                                    Reject
                                  </button>
                                </div>
                              ) : (
                                <button 
                                  onClick={() => openDetails(leave)}
                                  className="w-full mt-2.5 py-1.5 bg-slate-105 hover:bg-slate-200/80 dark:bg-slate-800/60 dark:hover:bg-slate-850/80 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg text-[9px] font-bold uppercase tracking-widest flex items-center justify-center gap-1 transition-all active:scale-[0.98] cursor-pointer border-none"
                                >
                                  View Details
                                  <ChevronRight className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="hidden md:grid grid-cols-12 gap-3 px-4 py-2.5 text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800/40">
                      <div className="col-span-3 text-left">Employee</div>
                      <div className="col-span-2 text-left">Type</div>
                      <div className="col-span-3 text-left">Dates & Duration</div>
                      <div className="col-span-2 text-left">Status</div>
                      <div className="col-span-2 text-right">Actions</div>
                    </div>
                    <AnimatePresence mode="popLayout">
                      {filteredEmployeeRequests.map((leave, idx) => {
                        const initial = leave.employee?.[0] || 'E';
                        return (
                          <motion.div
                            key={leave.id}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ delay: idx * 0.02 }}
                            className="saas-card bg-white/80 dark:bg-slate-900/60 backdrop-blur-md p-3 relative group border border-slate-200/40 dark:border-slate-800/80 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-750 transition-all rounded-xl grid grid-cols-1 md:grid-cols-12 gap-3 items-center"
                          >
                            {/* Profile & Info (Mobile Friendly) */}
                            <div className="col-span-1 md:col-span-3 flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-[10px] shadow-sm shrink-0">
                                {initial}
                              </div>
                              <div className="text-left min-w-0">
                                <h4 className="font-black text-xs text-slate-900 dark:text-white leading-tight truncate">{leave.employee}</h4>
                                <p className="text-[8px] text-slate-455 font-bold uppercase tracking-wider truncate">{leave.dept}</p>
                              </div>
                            </div>

                            {/* Type */}
                            <div className="col-span-1 md:col-span-2 text-left">
                              <span className="text-[9px] font-black uppercase text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/60 px-2 py-0.5 rounded-md">
                                {leave.type}
                              </span>
                            </div>

                            {/* Dates & Duration */}
                            <div className="col-span-1 md:col-span-3 text-left">
                              <p className="text-[10.5px] font-bold text-slate-800 dark:text-slate-200 leading-tight">{leave.date}</p>
                              <span className="text-[8px] font-black uppercase text-blue-500 tracking-wider mt-0.5 block">{leave.duration}</span>
                            </div>

                            {/* Status */}
                            <div className="col-span-1 md:col-span-2 text-left">
                              <span className={cn(
                                "px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border shadow-sm",
                                leave.status === 'Approved' ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border-emerald-500/20" :
                                leave.status === 'Pending' ? "bg-amber-500/10 text-amber-600 dark:text-amber-450 border-amber-500/20" :
                                "bg-rose-500/10 text-rose-600 dark:text-rose-450 border-rose-500/20"
                              )}>
                                {leave.status}
                              </span>
                            </div>

                            {/* Action Buttons */}
                            <div className="col-span-1 md:col-span-2 flex justify-end gap-1.5">
                              {leave.status === 'Pending' ? (
                                <>
                                  <button 
                                    onClick={() => handleStatusChange(leave.id, 'Approved')}
                                    className="p-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg cursor-pointer transition-all border-none flex items-center justify-center hover:scale-105 active:scale-95"
                                    title="Approve Leave"
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => handleStatusChange(leave.id, 'Rejected')}
                                    className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-500 rounded-lg cursor-pointer transition-all border-none flex items-center justify-center hover:scale-105 active:scale-95"
                                    title="Reject Leave"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </>
                              ) : (
                                <button 
                                  onClick={() => openDetails(leave)}
                                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-205 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-650 dark:text-slate-350 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer border-none"
                                >
                                  Details
                                  <ChevronRight className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}

                {filteredEmployeeRequests.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-24 text-center bg-white/70 dark:bg-slate-900/60 rounded-[32px] border border-slate-200/50 dark:border-slate-800/80 shadow-md">
                    <div className="w-20 h-20 bg-slate-50 dark:bg-slate-950 rounded-3xl flex items-center justify-center mb-6 shadow-inner border border-slate-100 dark:border-slate-850">
                      <AlertCircle className="w-9 h-9 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">No requests found</h3>
                    <p className="text-slate-400 dark:text-slate-500 text-xs font-medium max-w-xs">No employee requests found matching the current filters.</p>
                  </div>
                )}
              </div>

              {/* Right Column: Staff Leaves Ledger Card */}
              <div className="xl:col-span-1 space-y-6">
                <div className="saas-card bg-white/80 dark:bg-slate-900/60 backdrop-blur-md p-4.5 border border-slate-200/50 dark:border-slate-800/80 shadow-md rounded-2xl space-y-4">
                  <div className="flex justify-between items-center pb-2.5 border-b border-slate-100 dark:border-slate-800/40">
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white font-sans flex items-center gap-1.5 leading-none">
                        <Users className="w-3.5 h-3.5 text-blue-500" />
                        Staff Leaves Ledger
                      </h3>
                      <p className="text-[8px] font-bold text-slate-400 mt-1.5 uppercase leading-none">Taken vs Remaining Balance</p>
                    </div>
                    {selectedStaffFilter !== 'All Employees' && (
                      <button 
                        onClick={() => setSelectedStaffFilter('All Employees')}
                        className="text-[8.5px] font-black uppercase tracking-wider text-blue-500 hover:text-blue-600 transition-all cursor-pointer bg-transparent border-none"
                      >
                        Clear Filter
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
                    {displayedLedgerItems.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Info className="w-6 h-6 text-slate-300 mb-1.5" />
                        <p className="text-[10px] text-slate-400 font-medium">No employee records found.</p>
                      </div>
                    ) : (
                      displayedLedgerItems.map((emp) => {
                        const isSelected = selectedStaffFilter === emp.name;
                        const isHr = emp.dept === 'HR' || emp.name === 'Priya Patel' || emp.name === 'Dipak Patil';
                        const maxAllowance = emp.maxLeaves !== undefined ? emp.maxLeaves : (isHr ? hrMaxLeaves : employeeMaxLeaves);
                        const remaining = Math.max(0, maxAllowance - emp.approvedDays);
                        return (
                          <div 
                            key={emp.name}
                            onClick={() => setSelectedStaffFilter(isSelected ? 'All Employees' : emp.name)}
                            className={cn(
                              "flex flex-col p-2.5 rounded-xl border transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99] group/ledger",
                              isSelected 
                                ? "bg-gradient-to-r from-blue-50/40 to-indigo-50/40 dark:from-blue-950/20 dark:to-indigo-950/10 border-blue-500/35 shadow-sm shadow-blue-500/5"
                                : "bg-slate-50/50 dark:bg-slate-950/20 border-slate-100 dark:border-slate-800/40 hover:bg-slate-100/50 dark:hover:bg-slate-800/60"
                            )}
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <div className={cn(
                                  "w-7 h-7 rounded-lg flex items-center justify-center font-black text-[10px] shadow-sm shrink-0 transition-all duration-300",
                                  isSelected 
                                    ? "bg-gradient-to-tr from-blue-600 to-indigo-650 text-white" 
                                    : "bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-350 group-hover/ledger:bg-blue-600 group-hover/ledger:text-white"
                                )}>
                                  {emp.name[0]}
                                </div>
                                <div className="text-left min-w-0">
                                  <p className="text-[10px] font-black text-slate-900 dark:text-white leading-none truncate">{emp.name}</p>
                                  <p className={cn(
                                    "text-[7.5px] font-bold uppercase tracking-wider mt-1 leading-none",
                                    isHr ? "text-amber-500 dark:text-amber-400 font-extrabold" : "text-slate-400 dark:text-slate-500"
                                  )}>
                                    {emp.dept} {isHr && "(HR)"}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-[10px] font-bold text-slate-755 dark:text-slate-300 leading-none">
                                  <span className="text-blue-600 dark:text-blue-400 font-black">{remaining}</span> / {maxAllowance} Left
                                </p>
                                {emp.pendingCount > 0 ? (
                                  <span className="inline-block px-1.5 py-0.5 bg-amber-500 text-white text-[7px] rounded font-black uppercase tracking-wider mt-1 animate-pulse leading-none">
                                    {emp.pendingCount} Pend
                                  </span>
                                ) : (
                                  <span className="text-[7.5px] font-bold text-slate-400 dark:text-slate-500 block mt-1 leading-none">
                                    {emp.approvedDays} Taken
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Ultra compact mini Progress Bar */}
                            <div className="w-full bg-slate-100 dark:bg-slate-905/60 h-1 rounded-full overflow-hidden mt-2.5 shadow-inner">
                              <div 
                                className={cn(
                                  "h-full rounded-full transition-all duration-550",
                                  remaining <= 5 
                                    ? "bg-gradient-to-r from-amber-500 to-rose-500" 
                                    : "bg-gradient-to-r from-blue-500 to-indigo-550"
                                )}
                                style={{ width: `${Math.min(100, (emp.approvedDays / maxAllowance) * 100)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
                <HolidaysCalendar userRole={userRole} addNotification={addNotification} />
              </div>

            </div>
          </div>
        )}

        {/* Apply Leave Modal */}
        <ApplyLeaveModal
          isOpen={isApplyModalOpen}
          onClose={() => setIsApplyModalOpen(false)}
          userRole={userRole}
          profile={profile}
          newLeave={newLeave}
          setNewLeave={setNewLeave}
          handleApplyLeave={handleApplyLeave}
        />

        {/* Leave Details Modal */}
        <LeaveDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          selectedLeave={selectedLeave}
        />
      </div>
    );
  }

  return (
    <div className="p-5 lg:p-6 max-w-7xl mx-auto space-y-5 min-h-screen text-slate-800 dark:text-slate-200">
      {/* Header */}
      <div className="flex flex-col gap-4 pb-5 border-b border-slate-150/40 dark:border-slate-800/40 w-full text-left print:hidden">
        {/* Row 1: Title & Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 w-full">
          {activeTab === 'My Leaves' ? (
            <>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0 shadow-sm border border-blue-500/10">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">
                    My Leaves
                  </h1>
                  <p className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mt-1.5 leading-none">
                    Personal Space
                  </p>
                </div>
              </div>
              {userRole !== 'Admin' && (
                <button 
                  onClick={() => setIsApplyModalOpen(true)} 
                  className="saas-btn-primary cursor-pointer w-full sm:w-auto px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/10 hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-[10px] font-black uppercase tracking-wider shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" /> Request Time Off
                </button>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0 shadow-sm border border-blue-500/10">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                    Leave Manager
                  </h1>
                  <p className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mt-1.5 leading-none">
                    Control Room
                  </p>
                </div>
              </div>
              {userRole !== 'Admin' && (
                <button 
                  onClick={() => setIsApplyModalOpen(true)}
                  className="saas-btn-primary cursor-pointer w-full sm:w-auto px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/10 hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-[10px] font-black uppercase tracking-wider shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" /> Apply Leave
                </button>
              )}
            </>
          )}
        </div>

        {/* Row 2: Description */}
        <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-3xl break-words whitespace-normal leading-relaxed">
          {activeTab === 'My Leaves' 
            ? "Book paid off-times, view remaining balances across types, configure dates, and track your pending approval pipelines."
            : "Configure custom employee leave allowances, monitor active requests across all company departments, and review pending staff applications."}
        </p>

        {/* Row 3: Tabs Selection Navigation */}
        <div className="premium-nav-container mt-1.5">
          {tabList.map((tab) => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)}
              className={cn(
                "premium-nav-item active:scale-[0.98]",
                activeTab === tab ? "premium-nav-item-active" : ""
              )}
            >
              <span>{tab}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Filters (Conditional) */}
      {userRole !== 'Employee' ? (
        <div className="space-y-5 text-left">
          {activeTab !== 'My Leaves' && (
            <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200/50 dark:border-slate-800/80 shadow-md relative z-30 space-y-2.5">
              
              {/* Row 1: Header Title & Search & View Mode */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
                <div className="text-left w-full lg:w-auto">
                  <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-1.5">
                    <Filter className="w-2.5 h-2.5 text-blue-500" />
                    {activeTab.toLowerCase().includes('requests') || activeTab.toLowerCase().includes('leaves') ? activeTab : `${activeTab} Requests`}
                  </h3>
                  <p className="text-[7.5px] text-slate-455 font-bold uppercase tracking-wider mt-0.5">Viewing time-off requests and logs</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2.5 w-full lg:w-auto items-center">
                  <div className="relative w-full sm:w-56">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-3 w-3 text-slate-400" />
                    </span>
                    <input 
                      type="text" 
                      placeholder="Search employee..." 
                      className="w-full pl-9 pr-3.5 h-8.5 bg-slate-50 dark:bg-slate-955 text-[11px] text-slate-900 dark:text-white border border-slate-200/50 dark:border-slate-800/60 rounded-lg focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  {/* View Mode Switcher */}
                  <div className="flex items-center gap-1 bg-slate-150/70 dark:bg-slate-955/80 p-0.5 rounded-lg border border-slate-200/50 dark:border-slate-800 shadow-inner shrink-0 justify-center">
                    <button
                      type="button"
                      onClick={() => setViewMode('grid')}
                      className={cn(
                        "p-1 rounded-md transition-all cursor-pointer border-none bg-transparent flex items-center justify-center",
                        viewMode === 'grid'
                          ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm"
                          : "text-slate-400 hover:text-slate-655 dark:hover:text-slate-300"
                      )}
                      title="Card View"
                    >
                      <LayoutGrid className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('list')}
                      className={cn(
                        "p-1 rounded-md transition-all cursor-pointer border-none bg-transparent flex items-center justify-center",
                        viewMode === 'list'
                          ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm"
                          : "text-slate-400 hover:text-slate-655 dark:hover:text-slate-300"
                      )}
                      title="Row View"
                    >
                      <List className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Separator */}
              <div className="border-t border-slate-150/50 dark:border-slate-800/40 my-0.5" />

              {/* Row 2: Advanced Filters Grid & Reset */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                    <Sliders className="w-2.5 h-2.5 text-blue-500" />
                    Advanced Filters
                  </span>
                  {(selectedStaffFilter !== 'All Employees' || selectedDeptFilter !== 'All Departments' || selectedTypeFilter !== 'All Types' || startDateFilter || endDateFilter) && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStaffFilter('All Employees');
                        setSelectedDeptFilter('All Departments');
                        setSelectedTypeFilter('All Types');
                        setStartDateFilter('');
                        setEndDateFilter('');
                      }}
                      className="text-[8px] font-black uppercase tracking-wider text-rose-500 hover:text-rose-600 transition-all cursor-pointer bg-transparent border-none"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  {/* Department Dropdown */}
                  <div className="relative z-[80]">
                    <button
                      type="button"
                      onClick={() => {
                        setIsDeptDropdownOpen2(!isDeptDropdownOpen2);
                        setIsTypeDropdownOpen2(false);
                      }}
                      className="w-full h-8.5 px-3 bg-slate-50 dark:bg-slate-955 text-[11px] text-slate-900 dark:text-white border border-slate-200/50 dark:border-slate-800/60 rounded-lg cursor-pointer outline-none flex items-center justify-between transition-all duration-200 hover:border-slate-350 dark:hover:border-slate-700"
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        <Briefcase className="w-3 h-3 text-slate-400" />
                        {selectedDeptFilter === 'All Departments' ? 'All Departments' : selectedDeptFilter}
                      </span>
                      <ChevronDown className={cn("w-3.5 h-3.5 ml-1.5 text-slate-400 dark:text-slate-500 transition-transform duration-200", isDeptDropdownOpen2 && "transform rotate-180")} />
                    </button>
                    <AnimatePresence>
                      {isDeptDropdownOpen2 && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setIsDeptDropdownOpen2(false)} />
                          <motion.div
                            initial={{ opacity: 0, y: -8, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.95 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="absolute left-0 right-0 mt-1.5 py-1 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto no-scrollbar backdrop-blur-md origin-top"
                          >
                            {departments.map((dept) => (
                              <button
                                key={dept}
                                type="button"
                                onClick={() => {
                                  setSelectedDeptFilter(dept);
                                  setIsDeptDropdownOpen2(false);
                                }}
                                className={cn(
                                  "w-full text-left px-3 py-1.5 text-[11px] transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/60 block border-none bg-transparent cursor-pointer",
                                  selectedDeptFilter === dept 
                                    ? "text-blue-600 dark:text-blue-400 font-bold bg-blue-50/50 dark:bg-blue-955/20" 
                                    : "text-slate-700 dark:text-slate-300"
                                )}
                              >
                                {dept}
                              </button>
                            ))}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Leave Type Dropdown */}
                  <div className="relative z-[70]">
                    <button
                      type="button"
                      onClick={() => {
                        setIsTypeDropdownOpen2(!isTypeDropdownOpen2);
                        setIsDeptDropdownOpen2(false);
                      }}
                      className="w-full h-8.5 px-3 bg-slate-50 dark:bg-slate-955 text-[11px] text-slate-900 dark:text-white border border-slate-200/50 dark:border-slate-800/60 rounded-lg cursor-pointer outline-none flex items-center justify-between transition-all duration-200 hover:border-slate-355 dark:hover:border-slate-700"
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        <Info className="w-3 h-3 text-slate-400" />
                        {selectedTypeFilter === 'All Types' ? 'All Types' : selectedTypeFilter}
                      </span>
                      <ChevronDown className={cn("w-3.5 h-3.5 ml-1.5 text-slate-400 dark:text-slate-500 transition-transform duration-200", isTypeDropdownOpen2 && "transform rotate-180")} />
                    </button>
                    <AnimatePresence>
                      {isTypeDropdownOpen2 && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setIsTypeDropdownOpen2(false)} />
                          <motion.div
                            initial={{ opacity: 0, y: -8, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.95 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="absolute left-0 right-0 mt-1.5 py-1 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto no-scrollbar backdrop-blur-md origin-top"
                          >
                            {leaveTypes.map((type) => (
                              <button
                                key={type}
                                type="button"
                                onClick={() => {
                                  setSelectedTypeFilter(type);
                                  setIsTypeDropdownOpen2(false);
                                }}
                                className={cn(
                                  "w-full text-left px-3 py-1.5 text-[11px] transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/60 block border-none bg-transparent cursor-pointer",
                                  selectedTypeFilter === type 
                                    ? "text-blue-600 dark:text-blue-400 font-bold bg-blue-50/50 dark:bg-blue-955/20" 
                                    : "text-slate-700 dark:text-slate-300"
                                )}
                              >
                                {type}
                              </button>
                            ))}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Start Date */}
                  <div className="relative flex items-center bg-slate-50 dark:bg-slate-955 border border-slate-200/50 dark:border-slate-800/60 rounded-lg px-2.5 h-8.5 text-[11px] font-bold text-slate-700 dark:text-slate-305 flex-1">
                    <Calendar className="w-3 h-3 text-slate-400 mr-1.5 shrink-0" />
                    <span className="text-[8px] text-slate-400 uppercase tracking-wider mr-1.5 shrink-0">From:</span>
                    <input 
                      type="date"
                      value={startDateFilter}
                      onChange={(e) => setStartDateFilter(e.target.value)}
                      className="bg-transparent outline-none text-slate-900 dark:text-white cursor-pointer w-full border-none p-0 text-[11px] font-bold"
                    />
                  </div>

                  {/* End Date */}
                  <div className="relative flex items-center bg-slate-50 dark:bg-slate-955 border border-slate-200/50 dark:border-slate-800/60 rounded-lg px-2.5 h-8.5 text-[11px] font-bold text-slate-700 dark:text-slate-305 flex-1">
                    <Calendar className="w-3 h-3 text-slate-400 mr-1.5 shrink-0" />
                    <span className="text-[8px] text-slate-400 uppercase tracking-wider mr-1.5 shrink-0">To:</span>
                    <input 
                      type="date"
                      value={endDateFilter}
                      onChange={(e) => setEndDateFilter(e.target.value)}
                      className="bg-transparent outline-none text-slate-900 dark:text-white cursor-pointer w-full border-none p-0 text-[11px] font-bold"
                    />
                  </div>
                </div>

                {/* Active Filter Badges */}
                {selectedStaffFilter !== 'All Employees' && (
                  <div className="flex flex-wrap gap-2 pt-2 items-center">
                    <span className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Active Filter:</span>
                    <div className="flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 px-2.5 py-0.5 rounded-full text-[10px] font-bold w-fit animate-fadeIn">
                      <span>Staff: {selectedStaffFilter}</span>
                      <button 
                        type="button"
                        onClick={() => setSelectedStaffFilter('All Employees')}
                        className="hover:text-blue-800 dark:hover:text-blue-200 transition-colors bg-transparent border-none cursor-pointer p-0 leading-none flex items-center shrink-0"
                      >
                        <X className="w-3 h-3 ml-1" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* General Leaves Dashboard Stats for HR/Admin */}
      {activeTab !== 'My Leaves' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
          {[
            { label: 'Total Requests', value: leaves.length, icon: Calendar, accent: '#3B82F6', sub: 'All submitted leaves' },
            { label: 'Pending Approval', value: leaves.filter((l: any) => l.status === 'Pending').length, icon: Clock, accent: '#F59E0B', sub: 'Awaiting HR decision' },
            { label: 'Approved Leaves', value: leaves.filter((l: any) => l.status === 'Approved').length, icon: CheckCircle2, accent: '#10B981', sub: 'Granted off-times' },
            { label: 'Rejected Requests', value: leaves.filter((l: any) => l.status === 'Rejected').length, icon: XCircle, accent: '#F43F5E', sub: 'Declined applications' },
          ].map((stat, idx) => (
            <PastelStatCard key={idx} icon={stat.icon} label={stat.label} value={stat.value} sub={stat.sub} accent={stat.accent} />
          ))}
        </div>
      )}

      {activeTab === 'My Leaves' ? (
        <LeaveTab 
          totalLeavesLimit={userRole === 'HR' ? hrMaxLeaves : employeeMaxLeaves}
          approvedCount={myApprovedCount}
          remainingLeaves={(userRole === 'HR' ? hrMaxLeaves : employeeMaxLeaves) - myApprovedCount}
          myLeaves={myLeavesOnly}
          setShowLeaveModal={setIsApplyModalOpen}
          calendarWidget={<HolidaysCalendar userRole={userRole} addNotification={addNotification} />}
        />
      ) : (
        <>
          {/* Main Grid Layout - Split between leave requests and control widgets for Admin */}
          <div className={cn("grid grid-cols-1 gap-5", userRole === 'Admin' ? "xl:grid-cols-3" : "")}>
            <div className={cn("space-y-5", userRole === 'Admin' ? "xl:col-span-2" : "")}>
              {/* Leave Cards Grid or Row List depending on viewMode */}
              {viewMode === 'grid' ? (
                <div className={cn("grid grid-cols-1 gap-5", userRole === 'Admin' ? "md:grid-cols-1 lg:grid-cols-2" : "lg:grid-cols-2")}>
                  <AnimatePresence mode="popLayout">
                    {filteredLeaves.map((leave, idx) => {
                      const initial = leave.employee?.[0] || 'E';
                      return (
                        <motion.div
                          key={leave.id}
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ delay: idx * 0.05 }}
                          className="saas-card bg-white/80 dark:bg-slate-900/60 backdrop-blur-md p-3.5 relative group border border-slate-200/40 dark:border-slate-800/80 shadow-md hover:shadow-xl hover:border-slate-350/40 dark:hover:border-slate-700/60 transition-all duration-300 flex flex-col justify-between rounded-xl text-left"
                        >
                          <div>
                            <div className="flex justify-between items-start mb-2.5">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-650 text-white flex items-center justify-center font-bold text-[11px] shadow-sm shadow-blue-500/10 shrink-0">
                                  {initial.toUpperCase()}
                                </div>
                                <div>
                                  <h3 className="font-bold text-xs text-slate-900 dark:text-white capitalize leading-tight mb-0.5">{leave.employee}</h3>
                                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">{leave.dept}</p>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-0.5">
                                <span className={cn(
                                  "px-2 py-0.5 rounded text-[7.5px] font-bold uppercase tracking-wider border shadow-sm",
                                  leave.status === 'Approved' ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-455 border-emerald-500/20" :
                                  leave.status === 'Pending' ? "bg-amber-500/10 text-amber-600 dark:text-amber-455 border-amber-500/20" :
                                  "bg-rose-500/10 text-rose-600 dark:text-rose-455 border-rose-500/20"
                                )}>
                                  {leave.status}
                                </span>
                                {leave.status === 'Pending' && (leave.dept === 'HR' || leave.employee === 'Priya Patel' || leave.employee === (profile?.name || 'Rahul Sharma')) && (
                                  <span className="text-[7px] font-bold text-rose-500 uppercase tracking-widest mt-0.5 border border-rose-500/10 px-1.5 py-0.5 rounded bg-rose-500/5">
                                    Requires Admin Approval
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="space-y-2.5 mb-2.5">
                              <div className="p-2.5 bg-slate-50/60 dark:bg-slate-950/40 border border-slate-100/30 dark:border-slate-850/30 rounded-xl flex items-center justify-between text-left">
                                <div className="flex items-center gap-2">
                                  <div className="p-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg">
                                    <Calendar className="w-3.5 h-3.5" />
                                  </div>
                                  <div className="leading-tight">
                                    <p className="text-[7.5px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Dates</p>
                                    <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200">{leave.date}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="px-2 py-0.5 bg-blue-500/15 text-blue-600 dark:text-blue-400 rounded text-[8px] font-bold uppercase tracking-wider">{leave.duration}</span>
                                </div>
                              </div>

                              <div className="flex justify-between items-center text-[9.5px] font-medium text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/40 pt-2 px-0.5">
                                <span className="uppercase tracking-wider flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  Type: <strong className="text-slate-900 dark:text-slate-200 font-bold">{leave.type}</strong>
                                </span>
                                <span className="text-[8px] text-slate-400 font-semibold uppercase tracking-wider">
                                  Applied: {leave.createdAt ? new Date(leave.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>

                              <div className="px-0.5 border-t border-slate-100 dark:border-slate-800/40 pt-2">
                                <p className="text-[7.5px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Reason</p>
                                <div className="p-2.5 bg-slate-50/45 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 rounded-lg">
                                  <p className="text-[11px] text-slate-650 dark:text-slate-350 font-medium leading-normal line-clamp-2 italic">
                                    "{leave.reason}"
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div>
                            {(() => {
                              const isHrLeave = leave.dept === 'HR' || leave.employee === 'Priya Patel' || leave.employee === (profile?.name || 'Rahul Sharma');
                              const canApprove = leave.status === 'Pending' && (
                                can('leave.approve') && (!isHrLeave || userRole === 'Admin' || userRole === 'Super Admin')
                              );
                              
                              if (canApprove) {
                                return (
                                  <div className="flex gap-2 mt-2.5">
                                    <button 
                                      onClick={() => handleStatusChange(leave.id, 'Approved')}
                                      className="flex-1 py-1.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-lg text-[8.5px] font-bold uppercase tracking-wider shadow-sm shadow-emerald-500/10 hover:shadow-md transition-all flex items-center justify-center gap-1 active:scale-95 cursor-pointer border-none"
                                    >
                                      <CheckCircle2 className="w-3 h-3" />
                                      Approve
                                    </button>
                                    <button 
                                      onClick={() => handleStatusChange(leave.id, 'Rejected')}
                                      className="flex-1 py-1.5 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white rounded-lg text-[8.5px] font-bold uppercase tracking-wider shadow-sm shadow-rose-500/10 hover:shadow-md transition-all flex items-center justify-center gap-1 active:scale-95 cursor-pointer border-none"
                                    >
                                      <XCircle className="w-3 h-3" />
                                      Reject
                                    </button>
                                  </div>
                                );
                              }
                              
                              return (
                                <button 
                                  onClick={() => openDetails(leave)}
                                  className="w-full mt-2.5 py-1.5 bg-slate-105 hover:bg-slate-200/80 dark:bg-slate-800/60 dark:hover:bg-slate-850/80 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg text-[9px] font-bold uppercase tracking-widest flex items-center justify-center gap-1 transition-all active:scale-[0.98] cursor-pointer border-none"
                                >
                                  View Details
                                  <ChevronRight className="w-3 h-3" />
                                </button>
                              );
                            })()}
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="hidden md:grid grid-cols-12 gap-3 px-4 py-2.5 text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800/40">
                    <div className="col-span-3 text-left">Employee</div>
                    <div className="col-span-2 text-left">Type</div>
                    <div className="col-span-3 text-left">Dates & Duration</div>
                    <div className="col-span-2 text-left">Status</div>
                    <div className="col-span-2 text-right">Actions</div>
                  </div>
                  <AnimatePresence mode="popLayout">
                    {filteredLeaves.map((leave, idx) => {
                      const initial = leave.employee?.[0] || 'E';
                      return (
                        <motion.div
                          key={leave.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          transition={{ delay: idx * 0.02 }}
                          className="saas-card bg-white/80 dark:bg-slate-900/60 backdrop-blur-md p-3 relative group border border-slate-200/40 dark:border-slate-800/80 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-750 transition-all rounded-xl grid grid-cols-1 md:grid-cols-12 gap-3 items-center text-left"
                        >
                          {/* Profile & Info */}
                          <div className="col-span-1 md:col-span-3 flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-650 text-white flex items-center justify-center font-black text-[10px] shadow-sm shrink-0">
                              {initial.toUpperCase()}
                            </div>
                            <div className="text-left min-w-0">
                              <h4 className="font-black text-xs text-slate-900 dark:text-white leading-tight truncate">{leave.employee}</h4>
                              <p className="text-[8px] text-slate-455 font-bold uppercase tracking-wider truncate">{leave.dept}</p>
                            </div>
                          </div>

                          {/* Type */}
                          <div className="col-span-1 md:col-span-2 text-left">
                            <span className="text-[9px] font-black uppercase text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/60 px-2 py-0.5 rounded-md">
                              {leave.type}
                            </span>
                          </div>

                          {/* Dates & Duration */}
                          <div className="col-span-1 md:col-span-3 text-left">
                            <p className="text-[10.5px] font-bold text-slate-800 dark:text-slate-200 leading-tight">{leave.date}</p>
                            <span className="text-[8px] font-black uppercase text-blue-500 tracking-wider mt-0.5 block">{leave.duration}</span>
                          </div>

                          {/* Status */}
                          <div className="col-span-1 md:col-span-2 text-left">
                            <span className={cn(
                              "px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border shadow-sm",
                              leave.status === 'Approved' ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border-emerald-500/20" :
                              leave.status === 'Pending' ? "bg-amber-500/10 text-amber-600 dark:text-amber-450 border-amber-500/20" :
                              "bg-rose-500/10 text-rose-600 dark:text-rose-455 border-rose-500/20"
                            )}>
                              {leave.status}
                            </span>
                          </div>

                          {/* Action Buttons */}
                          <div className="col-span-1 md:col-span-2 flex justify-end gap-1.5">
                            {(() => {
                              const isHrLeave = leave.dept === 'HR' || leave.employee === 'Priya Patel' || leave.employee === (profile?.name || 'Rahul Sharma');
                              const canApprove = leave.status === 'Pending' && (
                                can('leave.approve') && (!isHrLeave || userRole === 'Admin' || userRole === 'Super Admin')
                              );
                              
                              if (canApprove) {
                                return (
                                  <>
                                    <button 
                                      onClick={() => handleStatusChange(leave.id, 'Approved')}
                                      className="p-1.5 bg-emerald-55/10 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg cursor-pointer transition-all border-none flex items-center justify-center hover:scale-105 active:scale-95"
                                      title="Approve Leave"
                                    >
                                      <CheckCircle2 className="w-4 h-4" />
                                    </button>
                                    <button 
                                      onClick={() => handleStatusChange(leave.id, 'Rejected')}
                                      className="p-1.5 bg-rose-55/10 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-500 rounded-lg cursor-pointer transition-all border-none flex items-center justify-center hover:scale-105 active:scale-95"
                                      title="Reject Leave"
                                    >
                                      <XCircle className="w-4 h-4" />
                                    </button>
                                  </>
                                );
                              }

                              return (
                                <button 
                                  onClick={() => openDetails(leave)}
                                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-205 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-650 dark:text-slate-350 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer border-none"
                                >
                                  Details
                                  <ChevronRight className="w-3 h-3" />
                                </button>
                              );
                            })()}
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}

              {filteredLeaves.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 text-center bg-white/70 dark:bg-slate-900/60 rounded-[32px] border border-slate-200/50 dark:border-slate-800/80 shadow-md">
                  <div className="w-20 h-20 bg-slate-50 dark:bg-slate-950 rounded-3xl flex items-center justify-center mb-6 shadow-inner border border-slate-100 dark:border-slate-850">
                    <AlertCircle className="w-9 h-9 text-slate-300" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">No results found</h3>
                  <p className="text-slate-400 dark:text-slate-500 text-xs font-medium max-w-xs font-medium">Try adjusting your filters or search term.</p>
                </div>
              )}
            </div>

            {/* Right Column: Calendar & Settings Control (Admin Only) */}
            {can('leave.configure_policy') && (
              <div className="xl:col-span-1 space-y-5">
                {/* Staff Leaves Ledger Card for Admin */}
                <div className="saas-card bg-white/80 dark:bg-slate-900/60 backdrop-blur-md p-5 border border-slate-200/50 dark:border-slate-800/80 shadow-md rounded-[24px] space-y-4">
                  <div className="flex flex-col gap-2.5 pb-2.5 border-b border-slate-105 dark:border-slate-800/40">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-white font-sans flex items-center gap-1.5">
                          <Users className="w-3 h-3 text-blue-500" />
                          Staff Leaves Ledger
                        </h3>
                        <p className="text-[8px] font-bold text-slate-400 mt-0.5 uppercase">Approved (Taken) vs Remaining Balance</p>
                      </div>
                      {selectedStaffFilter !== 'All Employees' && (
                        <button 
                          onClick={() => setSelectedStaffFilter('All Employees')}
                          className="text-[8.5px] font-black uppercase tracking-wider text-blue-500 hover:text-blue-600 transition-all cursor-pointer bg-transparent border-none"
                        >
                          Clear Filter
                        </button>
                      )}
                    </div>

                    {/* Ledger Sub-tabs for Admin */}
                    <div className="premium-nav-container w-full">
                      {(['All', 'HR', 'Employee'] as const).map((role) => (
                        <button
                          key={role}
                          onClick={(e) => {
                            e.stopPropagation();
                            setLedgerRoleFilter(role);
                          }}
                          className={cn(
                            "premium-nav-item flex-1 justify-center active:scale-[0.98]",
                            ledgerRoleFilter === role ? "premium-nav-item-active" : ""
                          )}
                        >
                          <span>{role === 'Employee' ? 'Staff' : role}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
                    {displayedLedgerItems.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Info className="w-7 h-7 text-slate-355 mb-1.5" />
                        <p className="text-xs text-slate-400 font-medium">No employee records found.</p>
                      </div>
                    ) : (
                      displayedLedgerItems.map((emp) => {
                        const isSelected = selectedStaffFilter === emp.name;
                        const isHr = emp.dept === 'HR' || emp.name === 'Priya Patel' || emp.name === 'Dipak Patil';
                        const maxAllowance = emp.maxLeaves !== undefined ? emp.maxLeaves : (isHr ? hrMaxLeaves : employeeMaxLeaves);
                        const remaining = Math.max(0, maxAllowance - emp.approvedDays);
                        return (
                          <div 
                            key={emp.name}
                            onClick={() => setSelectedStaffFilter(isSelected ? 'All Employees' : emp.name)}
                            className={cn(
                              "flex flex-col p-3 rounded-xl border transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99] group/ledger",
                              isSelected 
                                ? "bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/10 border-blue-500/30 shadow-md shadow-blue-500/5"
                                : "bg-slate-50/60 dark:bg-slate-950/30 border-slate-100/40 dark:border-slate-800/40 hover:bg-slate-100/50 dark:hover:bg-slate-800/60"
                            )}
                          >
                            <div className="flex justify-between items-center mb-2">
                              <div className="flex items-center gap-2">
                                <div className={cn(
                                  "w-7 h-7 rounded-lg flex items-center justify-center font-black text-[11px] shadow-sm transition-all duration-300",
                                  isSelected 
                                    ? "bg-gradient-to-tr from-blue-600 to-indigo-650 text-white" 
                                    : "bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover/ledger:bg-blue-600 group-hover/ledger:text-white"
                                  )}>
                                  {emp.name[0]}
                                </div>
                                <div className="text-left">
                                  <p className="text-[9.5px] font-black text-slate-800 dark:text-white uppercase leading-tight">{emp.name}</p>
                                  <p className={cn(
                                    "text-[7.5px] font-bold uppercase tracking-wider mt-0.5",
                                    isHr ? "text-amber-500 dark:text-amber-400 font-extrabold" : "text-slate-450 dark:text-slate-500"
                                  )}>
                                    {emp.dept} {isHr && "(HR)"}
                                  </p>
                                </div>
                              </div>
                              {emp.pendingCount > 0 && (
                                <span className="px-2 py-0.5 bg-amber-500 text-white text-[7.5px] rounded-full font-black uppercase tracking-wider shadow-sm animate-pulse">
                                  {emp.pendingCount} Pending
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-2 border-t border-slate-100 dark:border-slate-800/40 pt-2">
                              <div className="text-left">
                                <p className="text-[7.5px] text-slate-405 font-black uppercase tracking-wider mb-0.5">Leaves Taken</p>
                                <p className="text-[11px] font-bold text-slate-750 dark:text-slate-355">{emp.approvedDays} Days</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[7.5px] text-slate-405 font-black uppercase tracking-wider mb-0.5">Remaining</p>
                                <p className="text-[11px] font-bold text-blue-600 dark:text-blue-450">{remaining} / {maxAllowance} Days</p>
                              </div>
                            </div>

                            {/* Premium Progress Bar */}
                            <div className="w-full bg-slate-100 dark:bg-slate-955/60 h-1 rounded-full overflow-hidden mt-2.5 shadow-inner">
                              <div 
                                className={cn(
                                  "h-full rounded-full transition-all duration-550",
                                  remaining <= 5 
                                    ? "bg-gradient-to-r from-amber-500 to-rose-500" 
                                    : "bg-gradient-to-r from-blue-500 to-indigo-550"
                                )}
                                style={{ width: `${Math.min(100, (emp.approvedDays / maxAllowance) * 100)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Leave Limits Card */}
                <div className="saas-card bg-white/80 dark:bg-slate-900/60 backdrop-blur-md p-5 space-y-4 border border-slate-200/50 dark:border-slate-800/80 shadow-md rounded-[24px]">
                  <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800/40">
                    <div className="p-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      <Sliders className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Allowance Configurator</h3>
                      <p className="text-[8px] font-bold text-slate-450 mt-0.5 uppercase">Set yearly leave limits per role</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[9.5px] font-black text-slate-900 dark:text-slate-200 uppercase tracking-wider">HR Allowance</span>
                        <span className="text-[11px] font-black text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md">{localHrLimit} Days</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => setLocalHrLimit(Math.max(1, localHrLimit - 1))}
                          className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-black flex items-center justify-center cursor-pointer transition-all active:scale-90 border-none"
                        >
                          -
                        </button>
                        <input
                          type="range"
                          min="1"
                          max="50"
                          value={localHrLimit}
                          onChange={(e) => setLocalHrLimit(parseInt(e.target.value))}
                          className="flex-1 h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <button
                          onClick={() => setLocalHrLimit(Math.min(50, localHrLimit + 1))}
                          className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-black flex items-center justify-center cursor-pointer transition-all active:scale-90 border-none"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[9.5px] font-black text-slate-900 dark:text-slate-200 uppercase tracking-wider">Employee Allowance</span>
                        <span className="text-[11px] font-black text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md">{localEmpLimit} Days</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => setLocalEmpLimit(Math.max(1, localEmpLimit - 1))}
                          className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-black flex items-center justify-center cursor-pointer transition-all active:scale-90 border-none"
                        >
                          -
                        </button>
                        <input
                          type="range"
                          min="1"
                          max="50"
                          value={localEmpLimit}
                          onChange={(e) => setLocalEmpLimit(parseInt(e.target.value))}
                          className="flex-1 h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <button
                          onClick={() => setLocalEmpLimit(Math.min(50, localEmpLimit + 1))}
                          className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-black flex items-center justify-center cursor-pointer transition-all active:scale-90 border-none"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {(localHrLimit !== hrMaxLeaves || localEmpLimit !== employeeMaxLeaves) && (
                      <button
                        onClick={() => handleUpdateAllowances(localHrLimit, localEmpLimit)}
                        className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-750 text-white rounded-xl text-[9px] font-black uppercase tracking-wider cursor-pointer shadow-md shadow-blue-500/15 transition-all hover:scale-[1.02] active:scale-95 border-none mt-2"
                      >
                        Save New Allowances
                      </button>
                    )}
                  </div>
                </div>

                <HolidaysCalendar userRole={userRole} addNotification={addNotification} />
              </div>
            )}
          </div>
        </>
      )}

      {/* Apply Leave Modal */}
      <ApplyLeaveModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        userRole={userRole}
        profile={profile}
        newLeave={newLeave}
        setNewLeave={setNewLeave}
        handleApplyLeave={handleApplyLeave}
      />

      {/* Leave Details Modal */}
      <LeaveDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        selectedLeave={selectedLeave}
      />
    </div>
  );
}
