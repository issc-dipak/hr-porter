"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, Search, Filter, Download, LayoutGrid, List, Trash2, Users, Archive, UserCheck, UserPlus
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from "@/lib/utils";

// Import modular employee subcomponents
import EmployeeCard from './components/EmployeeCard';
import EmployeeModal from './components/EmployeeModal';
import { useUIStore } from '@/store/uiStore';

export default function EmployeeManagementPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All Departments');
  const [selectedRole, setSelectedRole] = useState('All Roles');
  const [deletedEmployees, setDeletedEmployees] = useState<any[]>([]);
  const [isLoadingDeleted, setIsLoadingDeleted] = useState(false);
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');
  const [showDeletedHistory, setShowDeletedHistory] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'onboarding' | 'inactive' | 'archived'>('all');

  useEffect(() => {
    const savedView = localStorage.getItem('hr_system_employee_view_type');
    if (savedView === 'list' || savedView === 'grid') {
      setViewType(savedView);
    }
  }, []);

  const handleViewTypeChange = (type: 'grid' | 'list') => {
    setViewType(type);
    localStorage.setItem('hr_system_employee_view_type', type);
  };
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit' | 'details' | 'delete'>('add');
  const [currentEmployee, setCurrentEmployee] = useState<any>(null);
  const [departments, setDepartments] = useState<string[]>(['Engineering', 'Design', 'Sales', 'HR', 'Marketing', 'Finance']);

  // Fetch departments dynamically from backend API
  useEffect(() => {
    const token = localStorage.getItem('hr_system_token');
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    fetch('/api/departments', { headers })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const names = Array.from(new Set(data.map((d: any) => d.departmentName).filter(Boolean)));
          if (names.length > 0) {
            setDepartments(names);
          }
        }
      })
      .catch(err => console.warn('Failed to fetch departments:', err));
  }, []);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    dept: 'Engineering',
    designation: '',
    email: '',
    personalEmail: '',
    status: 'Active',
    joining: new Date().toISOString().split('T')[0],
    phone: '',
    location: 'Remote',
    profilePicture: '',
    emergencyContact: '',
    dateOfBirth: '',
    gender: '',
    bloodGroup: '',
    address: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    panNumber: '',
    uanNumber: '',
    password: '',
    role: 'Employee',
    employmentType: 'Full-Time',
    workEmailPassword: '',
    branchId: '',
    reportingManagerId: ''
  });

  const { selectedBranchId } = useUIStore();

  const fetchEmployees = async () => {
    const token = localStorage.getItem('hr_system_token');
    if (!token) return;
    setIsLoading(true);
    try {
      let url = '/api/employees';
      if (selectedBranchId) {
        url += `?branchId=${selectedBranchId}`;
      }
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        localStorage.removeItem('hr_system_token');
        localStorage.setItem('hr_system_auth', 'false');
        window.location.reload();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        const mappedData = data.map((emp: any) => ({
          ...emp,
          id: emp._id,
          name: emp.fullName,
          dept: emp.department,
          joining: emp.joinedDate ? new Date(emp.joinedDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          avatar: (emp.fullName || 'U').split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2)
        }));
        setEmployees(mappedData);
      }
    } catch (error) {
      console.error('Failed to fetch employees', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDeletedEmployees = async () => {
    const token = localStorage.getItem('hr_system_token');
    if (!token) return;
    setIsLoadingDeleted(true);
    try {
      let url = '/api/employees/deleted';
      if (selectedBranchId) {
        url += `?branchId=${selectedBranchId}`;
      }
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        localStorage.removeItem('hr_system_token');
        localStorage.setItem('hr_system_auth', 'false');
        window.location.reload();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setDeletedEmployees(data);
      }
    } catch (error) {
      console.error('Failed to fetch deleted employees', error);
    } finally {
      setIsLoadingDeleted(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchDeletedEmployees();
  }, [selectedBranchId]);

  useEffect(() => {
    const term = localStorage.getItem('employee_search_term');
    if (term) {
      setSearchTerm(term);
      localStorage.removeItem('employee_search_term');
    }
  }, []);

  // Filtered Employees
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const name = emp.name || '';
      const designation = emp.designation || '';
      const email = emp.email || '';
      
      const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDept = selectedDept === 'All Departments' || emp.dept === selectedDept;
      const matchesRole = selectedRole === 'All Roles' || emp.role === selectedRole;
      
      // Tab Filtering
      let matchesTab = true;
      const status = (emp.status || '').toLowerCase();
      const isActive = emp.isActive !== false;

      if (activeTab === 'active') {
        matchesTab = status === 'active' && isActive;
      } else if (activeTab === 'onboarding') {
        matchesTab = ['invited', 'profile pending', 'documents pending', 'verification pending', 'approved'].includes(status) && isActive;
      } else if (activeTab === 'inactive') {
        matchesTab = (status === 'inactive' || status === 'suspended') && isActive;
      } else if (activeTab === 'archived') {
        matchesTab = !isActive || ['terminated', 'resigned', 'archived'].includes(status);
      }

      return matchesSearch && matchesDept && matchesRole && matchesTab;
    });
  }, [employees, searchTerm, selectedDept, selectedRole, activeTab]);

  // Filtered and mapped displayed employees
  const displayedEmployees = useMemo(() => {
    if (showDeletedHistory) {
      return deletedEmployees.map((emp: any) => ({
        ...emp,
        id: emp._id || emp.id,
        name: emp.fullName,
        dept: emp.department || 'Engineering',
        designation: emp.designation,
        email: emp.email,
        joining: emp.joinedDate ? new Date(emp.joinedDate).toISOString().split('T')[0] : '',
        avatar: (emp.fullName || 'U').split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2),
        status: emp.status || 'Archived',
        isDeletedRecord: true
      })).filter(emp => {
        const name = emp.name || '';
        const designation = emp.designation || '';
        const email = emp.email || '';
        
        const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDept = selectedDept === 'All Departments' || emp.dept === selectedDept;
        const matchesRole = selectedRole === 'All Roles' || emp.role === selectedRole;
        return matchesSearch && matchesDept && matchesRole;
      });
    }
    return filteredEmployees;
  }, [showDeletedHistory, filteredEmployees, deletedEmployees, searchTerm, selectedDept, selectedRole]);

  const tabCounts = useMemo(() => {
    const counts = { all: 0, active: 0, onboarding: 0, inactive: 0, archived: 0 };
    employees.forEach(emp => {
      counts.all++;
      const status = (emp.status || '').toLowerCase();
      const isActive = emp.isActive !== false;
      if (status === 'active' && isActive) {
        counts.active++;
      } else if (['invited', 'profile pending', 'documents pending', 'verification pending', 'approved'].includes(status) && isActive) {
        counts.onboarding++;
      } else if ((status === 'inactive' || status === 'suspended') && isActive) {
        counts.inactive++;
      } else if (!isActive || ['terminated', 'resigned', 'archived'].includes(status)) {
        counts.archived++;
      }
    });
    return counts;
  }, [employees]);

  const openModal = (type: 'add' | 'edit' | 'details' | 'delete', employee?: any) => {
    setModalType(type);
    setCurrentEmployee(employee || null);
    if (type === 'edit' && employee) {
      setFormData({
        name: employee.name,
        dept: employee.dept,
        designation: employee.designation,
        email: employee.email,
        status: employee.status,
        joining: employee.joining,
        phone: employee.phone || '',
        location: employee.location || '',
        profilePicture: employee.profilePicture || '',
        emergencyContact: employee.emergencyContact || '',
        dateOfBirth: employee.dateOfBirth || '',
        gender: employee.gender || '',
        bloodGroup: employee.bloodGroup || '',
        address: employee.address || '',
        bankName: employee.bankName || '',
        accountNumber: employee.accountNumber || '',
        ifscCode: employee.ifscCode || '',
        panNumber: employee.panNumber || '',
        uanNumber: employee.uanNumber || '',
        password: '',
        role: employee.role || 'Employee',
        employmentType: employee.employmentType || 'Full-Time',
        personalEmail: employee.personalEmail || '',
        workEmailPassword: employee.workEmailPassword || '',
        branchId: employee.branchId || '',
        reportingManagerId: employee.reportingManagerId || ''
      });
    } else if (type === 'add') {
      setFormData({
        name: '',
        dept: departments[0] || 'Engineering',
        designation: '',
        email: '',
        status: 'Invited',
        joining: new Date().toISOString().split('T')[0],
        phone: '',
        location: 'Remote',
        profilePicture: '',
        emergencyContact: '',
        dateOfBirth: '',
        gender: '',
        bloodGroup: '',
        address: '',
        bankName: '',
        accountNumber: '',
        ifscCode: '',
        panNumber: '',
        uanNumber: '',
        password: '',
        role: 'Employee',
        employmentType: 'Full-Time',
        personalEmail: '',
        workEmailPassword: '',
        branchId: '',
        reportingManagerId: ''
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentEmployee(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        fullName: formData.name,
        department: formData.dept,
        designation: formData.designation,
        email: formData.email,
        status: formData.status,
        phone: formData.phone,
        joinedDate: formData.joining,
        location: formData.location || 'Remote',
        profilePicture: formData.profilePicture,
        emergencyContact: formData.emergencyContact,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        bloodGroup: formData.bloodGroup,
        address: formData.address,
        bankName: formData.bankName,
        accountNumber: formData.accountNumber,
        ifscCode: formData.ifscCode,
        panNumber: formData.panNumber,
        uanNumber: formData.uanNumber,
        password: formData.password,
        role: formData.role,
        employmentType: formData.employmentType || 'Full-Time',
        personalEmail: formData.personalEmail || '',
        workEmailPassword: formData.workEmailPassword || '',
        branchId: formData.branchId || '',
        reportingManagerId: (formData as any).reportingManagerId || ''
      };

      const token = localStorage.getItem('hr_system_token');
      if (modalType === 'add') {
        const res = await fetch('/api/employees', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        
        if (res.status === 401) {
          localStorage.removeItem('hr_system_token');
          localStorage.setItem('hr_system_auth', 'false');
          window.location.reload();
          return;
        }

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to create employee');
        }

        await fetchEmployees();
        useUIStore.getState().triggerToast('Employee created and invitation sent successfully!', 'success');
      } else if (modalType === 'edit' && currentEmployee) {
        const res = await fetch(`/api/employees/${currentEmployee.id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        
        if (res.status === 401) {
          localStorage.removeItem('hr_system_token');
          localStorage.setItem('hr_system_auth', 'false');
          window.location.reload();
          return;
        }

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to update employee');
        }
        await fetchEmployees();
        useUIStore.getState().triggerToast('Employee details updated!', 'success');
      }
      closeModal();
    } catch (error: any) {
      useUIStore.getState().triggerToast(error.message, 'error');
    }
  };

  const handleDelete = async () => {
    if (currentEmployee) {
      try {
        const token = localStorage.getItem('hr_system_token');
        const res = await fetch(`/api/employees/${currentEmployee.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          await fetchEmployees();
          await fetchDeletedEmployees();
          useUIStore.getState().triggerToast('Employee deleted successfully!', 'success');
        } else {
          const errData = await res.json();
          useUIStore.getState().triggerToast(`Failed to delete employee: ${errData.error || 'Unknown error'}`, 'error');
        }
      } catch (err: any) {
        console.error('Delete employee failed:', err);
        useUIStore.getState().triggerToast('Error deleting employee.', 'error');
      }
      closeModal();
    }
  };

  const handleExport = () => {
    const headers = ['ID', 'Name', 'Department', 'Designation', 'Status', 'Joining Date', 'Email'];
    const csvData = filteredEmployees.map(emp => [
      `#EMP-${String(emp.id).padStart(3, '0')}`,
      emp.name,
      emp.dept,
      emp.designation,
      emp.status,
      emp.joining,
      emp.email
    ]);
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `employees_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  return (
    <div className="p-5 lg:p-6 max-w-7xl mx-auto space-y-6 min-h-screen text-left">
      {/* Page Title & Actions */}
      <div className="flex flex-col gap-4 pb-5 border-b border-slate-200 dark:border-slate-800/80 text-left w-full">
        {/* Row 1: Title & Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 w-full">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 text-blue-605 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/[0.03] border border-blue-500/10">
              <Users className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none font-outfit">
                Employees
              </h1>
              <p className="text-[9px] font-black text-blue-500 dark:text-blue-400 uppercase tracking-widest mt-2 leading-none">
                Workforce Directory
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
            <button 
              type="button"
              onClick={handleExport}
              className="px-4 py-2.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-[10px] font-black uppercase tracking-widest border border-slate-205 dark:border-slate-800 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm cursor-pointer text-slate-700 dark:text-slate-300"
            >
              <Download className="w-3.5 h-3.5 text-blue-500" />
              <span className="sm:inline">Export</span>
            </button>
            <button 
              type="button"
              onClick={() => openModal('add')}
              className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-500 hover:to-indigo-650 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer border-none"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="sm:inline">Add Employee</span>
            </button>
          </div>
        </div>

        {/* Row 2: Description */}
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-3xl leading-relaxed">
          Manage and monitor your organization workforce database directory, update structural records, view designations, departments, and track employee onboarding pipelines.
        </p>
      </div>

      {/* Tab Switcher & Secondary Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full">
        {/* Tab Segment control */}
        <div className="premium-nav-container">
          {[
            { id: 'all', label: 'All' },
            { id: 'active', label: 'Active' },
            { id: 'onboarding', label: 'Onboarding' },
            { id: 'inactive', label: 'Inactive' },
            { id: 'archived', label: 'Archived' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id as any);
                setShowDeletedHistory(tab.id === 'archived');
              }}
              className={cn(
                "premium-nav-item active:scale-[0.98]",
                activeTab === tab.id ? "premium-nav-item-active" : ""
              )}
            >
              <span>{tab.label}</span>
              <span className={cn(
                "px-1 py-0.5 rounded text-[8.5px] font-semibold transition-all",
                activeTab === tab.id 
                  ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" 
                  : "bg-slate-200/50 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
              )}>
                {tab.id === 'all' && tabCounts.all}
                {tab.id === 'active' && tabCounts.active}
                {tab.id === 'onboarding' && tabCounts.onboarding}
                {tab.id === 'inactive' && tabCounts.inactive}
                {tab.id === 'archived' && tabCounts.archived}
              </span>
            </button>
          ))}
        </div>

        {/* View Mode Segment Switcher */}
        <div className="flex items-center gap-3 ml-auto md:ml-0">
          <div className="flex items-center bg-slate-100/80 dark:bg-slate-955 p-1 rounded-xl border border-slate-200/50 dark:border-slate-850 shadow-inner gap-0.5 shrink-0">
            <button
              type="button"
              onClick={() => handleViewTypeChange('grid')}
              className={cn(
                "p-1.5 rounded-lg transition-all duration-350 active:scale-95 cursor-pointer flex items-center justify-center border-none",
                viewType === 'grid' 
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" 
                  : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              )}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleViewTypeChange('list')}
              className={cn(
                "p-1.5 rounded-lg transition-all duration-350 active:scale-95 cursor-pointer flex items-center justify-center border-none",
                viewType === 'list' 
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" 
                  : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              )}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-center bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm w-full">
        <div className="flex-1 w-full relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 pointer-events-none" />
          <input 
            type="text" 
            placeholder="Search by name, role or email..." 
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50/50 dark:bg-slate-800/30 border border-slate-205/60 dark:border-slate-800/40 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all font-semibold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <div className="relative flex-1 md:w-48 flex items-center">
            <select 
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full pl-3 pr-8 py-2.5 bg-slate-50/50 dark:bg-slate-800/30 border border-slate-205/60 dark:border-slate-800/40 rounded-xl text-xs outline-none cursor-pointer text-slate-700 dark:text-slate-300 appearance-none font-semibold hover:border-slate-350 dark:hover:border-slate-700/60 transition-colors select-none"
            >
              <option>All Departments</option>
              {departments.map((d: string) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-3 pointer-events-none" />
          </div>
          <div className="relative flex-1 md:w-36 flex items-center">
            <select 
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full pl-3 pr-8 py-2.5 bg-slate-50/50 dark:bg-slate-800/30 border border-slate-205/60 dark:border-slate-800/40 rounded-xl text-xs outline-none cursor-pointer text-slate-700 dark:text-slate-300 appearance-none font-semibold hover:border-slate-350 dark:hover:border-slate-700/60 transition-colors select-none"
            >
              <option>All Roles</option>
              <option>Employee</option>
              <option>HR</option>
              <option>Admin</option>
            </select>
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-3 pointer-events-none" />
          </div>
          {(searchTerm !== '' || selectedDept !== 'All Departments' || selectedRole !== 'All Roles') && (
            <button 
              type="button"
              onClick={() => { setSearchTerm(''); setSelectedDept('All Departments'); setSelectedRole('All Roles'); }}
              className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-455 rounded-xl text-xs font-black transition-all cursor-pointer border-none whitespace-nowrap shadow-sm"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Grid listing */}
      <div className="w-full space-y-6">
        {isLoading ? (
          <div className="py-20 text-center text-xs font-black uppercase tracking-widest text-slate-400 animate-pulse">Loading employee database...</div>
        ) : (
          <>
            <div className={cn(
              viewType === 'grid' 
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" 
                : "flex flex-col gap-4"
              )}>
              <AnimatePresence mode="popLayout">
                {displayedEmployees.map((emp) => (
                  <EmployeeCard 
                    key={emp.id} 
                    emp={emp} 
                    openModal={openModal} 
                    viewType={viewType} 
                  />
                ))}
                {viewType === 'grid' && !showDeletedHistory && (
                  <motion.div
                    layout
                    onClick={() => openModal('add')}
                    className="flex flex-col items-center justify-center p-5 rounded-[24px] bg-slate-900/10 dark:bg-slate-900/30 border border-dashed border-slate-300 dark:border-slate-850 hover:border-indigo-500/50 hover:bg-slate-900/40 cursor-pointer min-h-[295px] transition-all duration-300 group text-center"
                  >
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center mb-3 group-hover:scale-105 group-hover:bg-indigo-500/10 transition-all">
                      <Plus className="w-5 h-5 text-slate-450 dark:text-slate-500 group-hover:text-indigo-400 transition-colors" />
                    </div>
                    <span className="text-xs font-black text-slate-505 dark:text-slate-400 group-hover:text-indigo-400 transition-colors">Add New Employee</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {displayedEmployees.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                  <Search className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {showDeletedHistory ? "No deleted employees found" : "No employees found"}
                </h3>
                <p className="text-slate-500 dark:text-slate-400">Try adjusting your search or filter to find what you're looking for.</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Dynamic Modals Sheet */}
      <AnimatePresence>
        {isModalOpen && (
          <EmployeeModal 
            modalType={modalType}
            currentEmployee={currentEmployee}
            formData={formData}
            closeModal={closeModal}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
            handleDelete={handleDelete}
            onEmployeeUpdated={fetchEmployees}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
