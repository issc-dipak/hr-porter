"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, Search, Eye, Filter, CheckCircle2, Clock, AlertCircle, 
  Download, BarChart3, Settings, ShieldAlert, Star, Users, 
  TrendingUp, Trash2, ArrowUpRight, CheckSquare, Sparkles, Lock, 
  ArrowLeft, RefreshCw, X, FileSpreadsheet, FileText, ChevronRight, 
  MapPin, Phone, Mail, Calendar, ZoomIn, ZoomOut, Move, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";
import { usePermission } from '@/context/PermissionContext';

interface OrgChartPageProps {
  userRole: string;
  profile: any;
  addNotification?: (msg: string) => void;
}

export default function OrgChartPage({ userRole, profile, addNotification }: OrgChartPageProps) {
  const { can } = usePermission();
  // Navigation / Views: 'tree', 'departments', 'managers', 'team-structure', 'analytics'
  const [activeTab, setActiveTab] = useState('tree');

  // Core Data States
  const [employees, setEmployees] = useState<any[]>([]);
  const [treeData, setTreeData] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [desigFilter, setDesigFilter] = useState('All');

  // Employee Detail Drawer State
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);
  const [selectedEmpRelation, setSelectedEmpRelation] = useState<any>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);

  // Tree View Controls
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());

  // HR/Admin Assignment Form State
  const [targetEmpId, setTargetEmpId] = useState('');
  const [targetManagerId, setTargetManagerId] = useState('');
  const [bulkEmpIds, setBulkEmpIds] = useState<string[]>([]);
  const [bulkManagerId, setBulkManagerId] = useState('');

  // Admin Config Creation States
  const [deptName, setDeptName] = useState('');
  const [deptDesc, setDeptDesc] = useState('');
  const [desigName, setDesigName] = useState('');
  const [desigLevel, setDesigLevel] = useState(4);

  // Fetch all org chart configurations, lists, and trees
  const fetchAllOrgData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // 1. Fetch configs and basic stats
      const configRes = await fetch(`/api/organization-chart?t=${Date.now()}`, { headers });
      if (configRes.ok) {
        const data = await configRes.json();
        setDepartments(data.departments || []);
        setDesignations(data.designations || []);
        setStats(data.stats || null);
      }

      // 2. Fetch employee list
      const empRes = await fetch(`/api/employees?t=${Date.now()}`, { headers });
      if (empRes.ok) {
        const data = await empRes.json();
        setEmployees(Array.isArray(data) ? data.filter((e: any) => e.status === 'Active') : []);
      }

      // 3. Fetch visual tree data
      const treeRes = await fetch(`/api/organization-chart/tree?t=${Date.now()}`, { headers });
      if (treeRes.ok) {
        const data = await treeRes.json();
        setTreeData(data || []);
      }

      // 4. Fetch managers queue
      const managersRes = await fetch(`/api/organization-chart/managers?t=${Date.now()}`, { headers });
      if (managersRes.ok) {
        const data = await managersRes.json();
        setManagers(data || []);
      }
    } catch (e) {
      console.error('Failed to load Org Chart data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllOrgData();
  }, [activeTab]);

  // Fetch employee relationship details (when card clicked)
  const handleOpenEmployeeDetail = async (empId: string) => {
    setSelectedEmpId(empId);
    setSelectedEmpRelation(null);
    setDrawerLoading(true);
    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/organization-chart/employee/${empId}?t=${Date.now()}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setSelectedEmpRelation(data);
      }
    } catch (e) {
      console.error('Failed to load employee details:', e);
    } finally {
      setDrawerLoading(false);
    }
  };

  // Assign Reporting Manager (HR/Admin)
  const handleAssignManager = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEmpId) return;

    setActionLoading(true);
    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/organization-chart/assign-manager', {
        method: 'POST',
        headers,
        body: JSON.stringify({ employeeId: targetEmpId, managerId: targetManagerId })
      });

      if (res.ok) {
        setTargetEmpId('');
        setTargetManagerId('');
        if (addNotification) addNotification('Reporting manager assigned successfully!');
        fetchAllOrgData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to assign manager');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  // Bulk Transfer reporting reassignments
  const handleBulkReassign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bulkEmpIds.length === 0) return;

    setActionLoading(true);
    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/organization-chart/update-reporting', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ employeeIds: bulkEmpIds, newManagerId: bulkManagerId })
      });

      if (res.ok) {
        setBulkEmpIds([]);
        setBulkManagerId('');
        if (addNotification) addNotification('Bulk reporting reassignment completed successfully!');
        fetchAllOrgData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed bulk reassign');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  // Admin Create Department
  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName) return;

    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/organization-chart', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'create-department', departmentName: deptName, description: deptDesc })
      });

      if (res.ok) {
        setDeptName('');
        setDeptDesc('');
        if (addNotification) addNotification(`Department "${deptName}" created.`);
        fetchAllOrgData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create department');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Admin Create Designation
  const handleCreateDesignation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!desigName) return;

    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/organization-chart', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'create-designation', designationName: desigName, level: desigLevel })
      });

      if (res.ok) {
        setDesigName('');
        setDesigLevel(4);
        if (addNotification) addNotification(`Designation "${desigName}" created.`);
        fetchAllOrgData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create designation');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Client-side tabular downloads (Excel/CSV)
  const handleExportOrgChart = async (format: 'csv' | 'excel') => {
    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/organization-chart/export', { headers });
      if (res.ok) {
        const data = await res.json();
        if (format === 'csv') {
          const keys = ['fullName', 'email', 'phone', 'department', 'designation', 'reportingManager', 'joiningDate'];
          const displayHeaders = ['Full Name', 'Email', 'Phone', 'Department', 'Designation', 'Reporting Manager', 'Joining Date'];
          const csv = [
            displayHeaders.join(','),
            ...data.map((item: any) => keys.map(k => `"${String(item[k] || '').replace(/"/g, '""')}"`).join(','))
          ].join('\n');

          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `company_orgchart_export_${new Date().toISOString().slice(0, 10)}.csv`;
          link.click();
        } else {
          // Excel mockup table download
          const keys = ['fullName', 'email', 'phone', 'department', 'designation', 'reportingManager', 'joiningDate'];
          const displayHeaders = ['Full Name', 'Email', 'Phone', 'Department', 'Designation', 'Reporting Manager', 'Joining Date'];
          let html = '<table border="1"><thead><tr>' + displayHeaders.map(h => `<th>${h}</th>`).join('') + '</tr></thead><tbody>';
          data.forEach((item: any) => {
            html += '<tr>' + keys.map(k => `<td>${item[k] || ''}</td>`).join('') + '</tr>';
          });
          html += '</tbody></table>';

          const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `company_orgchart_export_${new Date().toISOString().slice(0, 10)}.xls`;
          link.click();
        }
        if (addNotification) addNotification('Organization chart exported successfully.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Print Org Chart as formatted PDF report
  const handlePrintOrgChart = async () => {
    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/organization-chart/export', { headers });
      if (!res.ok) return;
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) {
        if (addNotification) addNotification('No data available to print.');
        return;
      }

      let tableRows = '';
      data.forEach((emp: any, idx: number) => {
        tableRows += `
          <tr>
            <td class="text-center" style="color:#64748b;">${idx + 1}</td>
            <td><strong>${emp.fullName || ''}</strong><br><small style="color:#64748b;">${emp.email || ''}</small></td>
            <td>${emp.department || ''}</td>
            <td>${emp.designation || ''}</td>
            <td>${emp.reportingManager || '<span style="color:#94a3b8;">—</span>'}</td>
            <td class="text-center">${emp.phone || ''}</td>
            <td class="text-center">${emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}</td>
          </tr>
        `;
      });

      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Organization Chart Report</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #1e293b;
      margin: 30px;
      padding: 0;
      background-color: #ffffff;
    }
    .header {
      border-bottom: 2px solid #3b82f6;
      padding-bottom: 15px;
      margin-bottom: 30px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .header h1 {
      margin: 0;
      font-size: 22px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #1e3a8a;
    }
    .header p {
      margin: 5px 0 0 0;
      font-size: 11px;
      color: #64748b;
    }
    .meta-box {
      font-size: 11px;
      text-align: right;
      color: #475569;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
      font-size: 11px;
    }
    th {
      background-color: #f1f5f9;
      color: #475569;
      text-align: left;
      padding: 10px 12px;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 9px;
      letter-spacing: 0.05em;
      border-bottom: 1px solid #cbd5e1;
    }
    td {
      padding: 10px 12px;
      border-bottom: 1px solid #e2e8f0;
      vertical-align: top;
    }
    tr:nth-child(even) {
      background-color: #f8fafc;
    }
    .text-center {
      text-align: center;
    }
    .footer {
      margin-top: 20px;
      padding-top: 15px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      font-size: 9px;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    @media print {
      body {
        margin: 15px;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>HR Core Systems</h1>
      <p>Organization Chart &mdash; Employee Hierarchy Report</p>
    </div>
    <div class="meta-box">
      <strong>Generated On:</strong> ${new Date().toLocaleString('en-IN')}<br>
      <strong>Total Employees:</strong> ${data.length}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th class="text-center">#</th>
        <th>Employee</th>
        <th>Department</th>
        <th>Designation</th>
        <th>Reporting Manager</th>
        <th class="text-center">Phone</th>
        <th class="text-center">Joining Date</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>

  <div class="footer">
    This is a system-generated document from the HR Core Systems platform. &copy; ${new Date().getFullYear()}
  </div>

  <script>
    window.onload = function() {
      window.print();
    }
  </script>
</body>
</html>
      `;

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        if (addNotification) addNotification('Print preview for Org Chart initialized.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Zooming Controls
  const zoomIn = () => setZoom(prev => Math.min(prev + 0.1, 1.5));
  const zoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));
  const resetZoom = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Dragging / Panning handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: touch.clientX - panOffset.x, y: touch.clientY - panOffset.y });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    setPanOffset({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y
    });
  };

  const handleTouchEnd = () => setIsDragging(false);

  // Collapse/Expand state management
  const toggleNodeCollapse = (nodeId: string) => {
    const next = new Set(collapsedNodes);
    if (next.has(nodeId)) {
      next.delete(nodeId);
    } else {
      next.add(nodeId);
    }
    setCollapsedNodes(next);
  };

  // Recurse Tree Component Render
  const renderTreeNode = (node: any) => {
    const isCollapsed = collapsedNodes.has(node._id);
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node._id} className="flex flex-col items-center relative">
        {/* Node employee card */}
        <div 
          className={cn(
            "p-3 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm relative shrink-0 w-44 hover:shadow-md hover:border-blue-500 transition-all text-center select-none cursor-pointer flex flex-col items-center gap-1.5",
            selectedEmpId === node._id ? "border-blue-500 ring-2 ring-blue-500/10" : ""
          )}
          onClick={(e) => {
            e.stopPropagation();
            handleOpenEmployeeDetail(node._id);
          }}
        >
          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-205">
            <img 
              src={node.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${node.fullName}`} 
              alt={node.fullName} 
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h4 className="text-[10.5px] font-black leading-none text-slate-900 dark:text-white truncate max-w-[150px]">{node.fullName}</h4>
            <p className="text-[8.5px] text-blue-600 dark:text-blue-400 font-bold truncate max-w-[150px] mt-1 uppercase tracking-wider">{node.designation}</p>
            <p className="text-[7.5px] text-slate-400 dark:text-slate-500 font-semibold truncate max-w-[150px] mt-0.5">{node.department}</p>
          </div>

          {/* Toggle kids expand/collapse button */}
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleNodeCollapse(node._id);
              }}
              className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-[9px] outline-none shadow-sm cursor-pointer z-10"
            >
              {isCollapsed ? '+' : '-'}
            </button>
          )}
        </div>

        {/* Tree children recursive segment */}
        {hasChildren && !isCollapsed && (
          <div className="pt-8 flex gap-6 relative">
            {/* Connecting visual branch lines using standard HTML layout borders */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-slate-200 dark:bg-slate-800" />
            <div className="absolute top-4 left-1/2 -translate-x-1/2 h-0.5 bg-slate-200 dark:bg-slate-800" style={{
              width: node.children.length > 1 ? 'calc(100% - 11rem)' : '0px'
            }} />
            
            {node.children.map((child: any, childIdx: number) => (
              <div key={child._id} className="relative">
                {/* Branch line for each child */}
                {node.children.length > 1 && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-slate-200 dark:bg-slate-800" />
                )}
                {renderTreeNode(child)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Filter lists matching search
  const filteredEmployeesList = useMemo(() => {
    return employees.filter(emp => {
      const search = searchTerm.toLowerCase();
      const matchText = 
        emp.fullName.toLowerCase().includes(search) ||
        emp.designation.toLowerCase().includes(search) ||
        emp.department.toLowerCase().includes(search) ||
        (emp.employeeId && emp.employeeId.toLowerCase().includes(search));
      
      const matchDept = deptFilter === 'All' ? true : (emp.department === deptFilter || emp.departmentId === deptFilter);
      const matchDesig = desigFilter === 'All' ? true : (emp.designation === desigFilter || emp.designationId === desigFilter);

      return matchText && matchDept && matchDesig;
    });
  }, [employees, searchTerm, deptFilter, desigFilter]);

  // AI Org Diagnostics calculations
  const aiDiagnostics = useMemo(() => {
    if (employees.length === 0) return null;
    
    // 1. Employees without manager
    const missingMgrs = employees.filter(e => {
      // Exclude top-most nodes (CEO)
      const designationName = e.designation.toLowerCase();
      const isTopLevel = designationName.includes('ceo') || designationName.includes('founder') || designationName.includes('president');
      return !e.managerId && !isTopLevel;
    });

    // 2. Overloaded managers (managers with more than 6 direct reports)
    const mgrCounts: Record<string, number> = {};
    employees.forEach(e => {
      if (e.managerId) {
        mgrCounts[e.managerId] = (mgrCounts[e.managerId] || 0) + 1;
      }
    });

    const overloadedManagers = Object.entries(mgrCounts)
      .filter(([mgrId, count]) => count > 6)
      .map(([mgrId, count]) => {
        const mgr = employees.find(e => e._id.toString() === mgrId);
        return {
          name: mgr ? mgr.fullName : 'Unknown Manager',
          count
        };
      });

    // 3. Department distribution summary
    const deptSizes: Record<string, number> = {};
    employees.forEach(e => {
      deptSizes[e.department] = (deptSizes[e.department] || 0) + 1;
    });
    const largestDept = Object.entries(deptSizes).sort((a, b) => b[1] - a[1])[0];

    // 4. Summaries text
    const summary = `Company structure currently logs ${employees.length} active employees across ${departments.length} departments. ${largestDept ? `The largest group is ${largestDept[0]} containing ${largestDept[1]} members.` : ''}`;
    const gaps = missingMgrs.length > 0 
      ? `${missingMgrs.length} employees are currently unassigned (missing a manager reporting relationship). Consider setting their reporting mapping to align the tree.`
      : 'All mid and junior level staff reporting relationships are currently mapped correctly.';

    return {
      missingMgrs,
      overloadedManagers,
      summary,
      gaps
    };
  }, [employees, departments]);

  return (
    <div className="flex flex-col w-full h-[calc(100vh-80px)] bg-transparent dark:bg-transparent overflow-hidden font-sans">
      {/* Top Header Section */}
      <div className="flex flex-col gap-4 p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 w-auto text-left print:hidden rounded-3xl m-4 sm:m-5 shadow-sm">
        {/* Row 1: Title block */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0 shadow-sm border border-blue-500/10">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">
              Organization Chart
            </h1>
            <p className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mt-1.5 leading-none">
              Team Reporting & Mapping
            </p>
          </div>
        </div>

        {/* Row 2: Description */}
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-3xl break-words whitespace-normal leading-relaxed">
          Explore team reporting relations, departments rosters, configure manager-employee relationships, and manage workforce hierarchy mappings.
        </p>

        {/* Row 3: Tab Selection Navigation */}
        <div className="premium-nav-container mt-2">
          <button 
            onClick={() => setActiveTab('tree')} 
            className={cn(
              "premium-nav-item active:scale-[0.98]",
              activeTab === 'tree' ? "premium-nav-item-active" : ""
            )}
          >
            Tree View
          </button>
          <button 
            onClick={() => setActiveTab('departments')} 
            className={cn(
              "premium-nav-item active:scale-[0.98]",
              activeTab === 'departments' ? "premium-nav-item-active" : ""
            )}
          >
            Departments
          </button>
          <button 
            onClick={() => setActiveTab('managers')} 
            className={cn(
              "premium-nav-item active:scale-[0.98]",
              activeTab === 'managers' ? "premium-nav-item-active" : ""
            )}
          >
            Managers
          </button>
          {can('employee.edit') && (
            <button 
              onClick={() => setActiveTab('team-structure')} 
              className={cn(
                "premium-nav-item active:scale-[0.98]",
                activeTab === 'team-structure' ? "premium-nav-item-active" : ""
              )}
            >
              Edit Structure
            </button>
          )}
          <button 
            onClick={() => setActiveTab('analytics')} 
            className={cn(
              "premium-nav-item active:scale-[0.98]",
              activeTab === 'analytics' ? "premium-nav-item-active" : ""
            )}
          >
            Insights & Analytics
          </button>
        </div>
      </div>

      {/* Workspace Body Panel */}
      <div className="flex-1 w-full overflow-hidden relative min-h-0 flex flex-col px-4 sm:px-5 pb-4 sm:pb-5">

        {loading && (
          <div className="absolute inset-0 flex justify-center items-center bg-slate-50/50 dark:bg-slate-950/50 z-50">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        )}

        {/* ==================== 1. TREE VIEW ==================== */}
        {activeTab === 'tree' && (
          <div className="flex-1 w-full h-full relative overflow-hidden flex flex-col">
            
            {/* Search Overlay floating top left */}
            <div className="absolute top-4 left-4 right-4 sm:right-auto z-20 flex gap-2 sm:w-64 bg-white/85 dark:bg-slate-900/85 backdrop-blur border border-slate-205/60 dark:border-slate-800 p-3 rounded-2xl shadow-lg">
              <Search className="w-4 h-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Search name, role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-[10.5px] font-medium outline-none bg-transparent dark:text-white"
              />
            </div>

            {/* Tree zoom / reset controls top right */}
            <div className="absolute top-20 right-4 sm:top-4 z-20 flex flex-col gap-2">
              <div className="flex items-center gap-1 bg-white/85 dark:bg-slate-900/85 backdrop-blur border border-slate-205/60 dark:border-slate-800 p-1.5 rounded-2xl shadow-lg">
                <button onClick={zoomIn} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500" title="Zoom In"><ZoomIn className="w-4 h-4" /></button>
                <button onClick={zoomOut} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500" title="Zoom Out"><ZoomOut className="w-4 h-4" /></button>
                <button onClick={resetZoom} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-[9px] font-black uppercase text-slate-500" title="Reset Zoom">Reset</button>
              </div>
            </div>

            {/* Panning / Drag Canvas Area */}
            <div 
              className="flex-1 w-full h-full cursor-grab active:cursor-grabbing overflow-hidden relative select-none"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Zoomable tree wrapper */}
              <div 
                className="absolute origin-center transition-transform duration-100 flex items-start justify-center p-24"
                style={{
                  transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
                  left: '30%',
                  top: '10%'
                }}
              >
                {treeData.length > 0 ? (
                  <div className="flex gap-16 items-start">
                    {treeData.map(rootNode => renderTreeNode(rootNode))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-450 py-24 text-center select-none pointer-events-none">No active employee hierarchy loaded.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================== 2. DEPARTMENTS VIEW ==================== */}
        {activeTab === 'departments' && (
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {departments.map((dept, index) => {
                  const deptEmployees = employees.filter(emp => emp.department === dept.departmentName);
                  const manager = deptEmployees.find(emp => emp.designation.toLowerCase().includes('manager') || emp.designation.toLowerCase().includes('head'));
                  
                  return (
                    <div key={index} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800 p-4 sm:p-6 shadow-sm flex flex-col justify-between space-y-6">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <h3 className="text-xs font-black text-slate-950 dark:text-white uppercase tracking-wider">{dept.departmentName}</h3>
                          <span className="text-[9px] font-black uppercase bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-md">
                            {deptEmployees.length} Members
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-relaxed">{dept.description || 'No department description provided.'}</p>
                      </div>

                      {/* Department Manager Profile box */}
                      <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-105/50">
                        <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden border border-slate-300">
                          <img 
                            src={manager?.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${manager?.fullName || 'Manager'}`} 
                            alt="Manager" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">Department Head</span>
                          <span className="text-[10.5px] font-black text-slate-900 dark:text-white block leading-none mt-0.5">{manager ? manager.fullName : 'Unassigned'}</span>
                          {manager && <span className="text-[7.5px] text-slate-450">{manager.designation}</span>}
                        </div>
                      </div>

                      {/* Department members list summary */}
                      <div className="space-y-1.5 pt-2">
                        <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest block">Department Roster</span>
                        <div className="max-h-24 overflow-y-auto space-y-1 pr-1.5 scrollbar-thin">
                          {deptEmployees.map((e, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleOpenEmployeeDetail(e._id)}
                              className="w-full flex items-center justify-between text-left p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 outline-none transition-colors"
                            >
                              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate max-w-[120px]">{e.fullName}</span>
                              <span className="text-[8px] text-slate-450 truncate max-w-[90px]">{e.designation}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ==================== 3. MANAGERS VIEW ==================== */}
        {activeTab === 'managers' && (
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-205/60 dark:border-slate-800/80 p-4 sm:p-6 shadow-sm overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800/80 pb-3">
                      <th className="pb-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Manager Name</th>
                      <th className="pb-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Designation</th>
                      <th className="pb-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Department</th>
                      <th className="pb-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Team Size</th>
                      <th className="pb-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Reports Roster</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {managers.map((mgr, index) => (
                      <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                        <td className="py-4 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                            <img 
                              src={mgr.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${mgr.fullName}`} 
                              alt="Manager" 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <button onClick={() => handleOpenEmployeeDetail(mgr._id)} className="text-[10.5px] font-black text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{mgr.fullName}</button>
                            <span className="text-[8px] text-slate-400 block">{mgr.email}</span>
                          </div>
                        </td>
                        <td className="py-4 text-[10px] font-bold text-slate-650 dark:text-slate-350">{mgr.designation}</td>
                        <td className="py-4 text-[10px] font-bold text-slate-600 dark:text-slate-450">{mgr.department}</td>
                        <td className="py-4">
                          <span className="text-[9px] font-black bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded">
                            {mgr.teamSize} direct reports
                          </span>
                        </td>
                        <td className="py-4 max-w-xs">
                          <div className="flex flex-wrap gap-1">
                            {mgr.reports.slice(0, 3).map((r: any, rIdx: number) => (
                              <span key={rIdx} className="text-[8px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded truncate max-w-[80px]" title={r.fullName}>
                                {r.fullName}
                              </span>
                            ))}
                            {mgr.reports.length > 3 && (
                              <span className="text-[8px] font-black text-slate-450 px-1.5 py-0.5 bg-slate-105 rounded">
                                +{mgr.reports.length - 3} more
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ==================== 4. EDIT STRUCTURE (HR / ADMIN ONLY) ==================== */}
        {activeTab === 'team-structure' && can('employee.edit') && (
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto max-w-4xl mx-auto w-full space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* MAPPING ASSIGNMENT FORM */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800 p-4 sm:p-6 shadow-sm space-y-5">
                <div>
                  <h3 className="text-xs font-black text-slate-950 dark:text-white uppercase tracking-wider">Assign Reporting Manager</h3>
                  <p className="text-[9.5px] text-slate-450 mt-1">Configure reporting manager hierarchy for single employees.</p>
                </div>

                <form onSubmit={handleAssignManager} className="space-y-4">
                  <div>
                    <label className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block mb-1">Select Employee</label>
                    <select
                      value={targetEmpId}
                      onChange={(e) => setTargetEmpId(e.target.value)}
                      required
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-205 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs outline-none focus:border-blue-500 dark:text-white"
                    >
                      <option value="">-- Choose Employee --</option>
                      {employees.map((e, idx) => (
                        <option key={idx} value={e._id}>{e.fullName} ({e.designation})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block mb-1">Select Reporting Manager</label>
                    <select
                      value={targetManagerId}
                      onChange={(e) => setTargetManagerId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-205 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs outline-none focus:border-blue-500 dark:text-white"
                    >
                      <option value="">-- No Manager (Top-most root) --</option>
                      {employees
                        .filter(e => e._id !== targetEmpId) // exclude self
                        .map((e, idx) => (
                          <option key={idx} value={e._id}>{e.fullName} ({e.designation})</option>
                        ))
                      }
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 text-[9.5px] font-black uppercase tracking-widest transition-all shadow-md shadow-blue-500/10"
                  >
                    {actionLoading ? 'Assigning...' : 'Assign Manager'}
                  </button>
                </form>
              </div>

              {/* BULK REASSIGNMENT FORM */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800 p-4 sm:p-6 shadow-sm space-y-5">
                <div>
                  <h3 className="text-xs font-black text-slate-950 dark:text-white uppercase tracking-wider">Bulk Transfer Reports</h3>
                  <p className="text-[9.5px] text-slate-450 mt-1">Reassign multiple employees to report to a new department lead.</p>
                </div>

                <form onSubmit={handleBulkReassign} className="space-y-4">
                  <div>
                    <label className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block mb-1">Select Employees to Reassign</label>
                    <div className="max-h-28 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-slate-50 dark:bg-slate-800 space-y-1.5 scrollbar-thin">
                      {employees.map((e, idx) => (
                        <label key={idx} className="flex items-center gap-2 cursor-pointer text-xs select-none">
                          <input 
                            type="checkbox"
                            checked={bulkEmpIds.includes(e._id)}
                            onChange={(checkbox) => {
                              if (checkbox.target.checked) {
                                setBulkEmpIds([...bulkEmpIds, e._id]);
                              } else {
                                setBulkEmpIds(bulkEmpIds.filter(id => id !== e._id));
                              }
                            }}
                            className="w-3.5 h-3.5 rounded"
                          />
                          <span className="text-[10.5px] font-medium text-slate-700 dark:text-slate-350">{e.fullName}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block mb-1">Select New Reporting Manager</label>
                    <select
                      value={bulkManagerId}
                      onChange={(e) => setBulkManagerId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-205 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs outline-none focus:border-blue-500 dark:text-white"
                    >
                      <option value="">-- No Manager (Top-most root) --</option>
                      {employees.map((e, idx) => (
                        <option key={idx} value={e._id}>{e.fullName} ({e.designation})</option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={actionLoading || bulkEmpIds.length === 0}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 text-[9.5px] font-black uppercase tracking-widest transition-all shadow-md shadow-blue-500/10 disabled:opacity-50"
                  >
                    {actionLoading ? 'Updating...' : `Reassign ${bulkEmpIds.length} Employees`}
                  </button>
                </form>
              </div>
            </div>

            {/* ADMIN CONFIGURATIONS MENU (DEPARTMENTS AND DESIGNATIONS CREATION) */}
            {can('employee.edit') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800 p-4 sm:p-6 shadow-sm space-y-4">
                  <div>
                    <h3 className="text-xs font-black text-slate-950 dark:text-white uppercase tracking-wider">Create Department</h3>
                    <p className="text-[9.5px] text-slate-450 mt-1">Register new organization departments into system.</p>
                  </div>
                  <form onSubmit={handleCreateDepartment} className="space-y-3">
                    <input 
                      type="text" 
                      placeholder="E.g., Research & Development" 
                      value={deptName} 
                      onChange={(e) => setDeptName(e.target.value)} 
                      required
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-205 dark:border-slate-750 px-3 py-2 rounded-xl text-xs dark:text-white"
                    />
                    <input 
                      type="text" 
                      placeholder="Department description..." 
                      value={deptDesc} 
                      onChange={(e) => setDeptDesc(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-205 dark:border-slate-750 px-3 py-2 rounded-xl text-xs dark:text-white"
                    />
                    <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-755 text-white rounded-xl text-[9px] font-black uppercase tracking-widest">Create</button>
                  </form>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800 p-4 sm:p-6 shadow-sm space-y-4">
                  <div>
                    <h3 className="text-xs font-black text-slate-950 dark:text-white uppercase tracking-wider">Create Designation</h3>
                    <p className="text-[9.5px] text-slate-450 mt-1">Configure structural employee roles and level chains.</p>
                  </div>
                  <form onSubmit={handleCreateDesignation} className="space-y-3">
                    <input 
                      type="text" 
                      placeholder="E.g., Senior Technical Architect" 
                      value={desigName} 
                      onChange={(e) => setDesigName(e.target.value)} 
                      required
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-205 dark:border-slate-750 px-3 py-2 rounded-xl text-xs dark:text-white"
                    />
                    <div>
                      <label className="text-[8px] font-black text-slate-450 uppercase mb-1 block">Level (1=CEO, 2=Manager/Lead, 3=Sr, 4=Junior)</label>
                      <input 
                        type="number" 
                        min={1} 
                        max={10} 
                        value={desigLevel} 
                        onChange={(e) => setDesigLevel(Number(e.target.value))} 
                        required
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-205 dark:border-slate-750 px-3 py-2 rounded-xl text-xs dark:text-white"
                      />
                    </div>
                    <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-755 text-white rounded-xl text-[9px] font-black uppercase tracking-widest">Create</button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== 5. ANALYTICS & AI INSIGHTS ==================== */}
        {activeTab === 'analytics' && (
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto max-w-4xl mx-auto w-full space-y-6">
            
            {/* AI Summary and insights section */}
            {aiDiagnostics && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-50 dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800/80 p-6 rounded-3xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] space-y-6 flex flex-col items-stretch text-left"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/50 dark:border-slate-800/60 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-2xl shadow-sm">
                      <Sparkles className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 block">AI Diagnostics</span>
                      <h3 className="text-sm font-black text-slate-850 dark:text-white uppercase tracking-wider">Organizational Insights</h3>
                    </div>
                  </div>
                  <span className="self-start sm:self-auto text-[9px] font-black bg-blue-500/10 dark:bg-blue-400/10 text-blue-600 dark:text-blue-450 px-3.5 py-1.5 rounded-full uppercase tracking-wider border border-blue-500/20 dark:border-blue-400/20">
                    Active Scanner
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Summary Card */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-5 shadow-[0_2px_12px_-3px_rgba(0,0,0,0.02)] flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
                        <Users className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Hierarchy Summary</h4>
                      <p className="text-xs font-semibold leading-relaxed text-slate-700 dark:text-slate-350 mt-1">{aiDiagnostics.summary}</p>
                    </div>
                  </div>

                  {/* Gaps Alert Card */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-5 shadow-[0_2px_12px_-3px_rgba(0,0,0,0.02)] flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl">
                        <ShieldAlert className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Reporting Gaps Alert</h4>
                      <p className="text-xs font-semibold leading-relaxed text-slate-700 dark:text-slate-350 mt-1">{aiDiagnostics.gaps}</p>
                    </div>
                  </div>
                </div>

                {aiDiagnostics.overloadedManagers.length > 0 && (
                  <div className="bg-rose-500/[0.02] dark:bg-rose-500/[0.01] border border-rose-500/10 dark:border-rose-500/5 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-500" />
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400">Overloaded Managers Alert (&gt; 6 Reports)</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {aiDiagnostics.overloadedManagers.map((mgr, i) => (
                        <span key={i} className="text-[9.5px] font-black bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-450 px-3.5 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1.5 border border-rose-500/10 shadow-sm">
                          <Users className="w-3.5 h-3.5" /> {mgr.name} : <strong className="text-rose-700 dark:text-rose-300 font-black">{mgr.count}</strong> Reports
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Numerical Grid Stats */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800 shadow-sm">
                  <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Total Employees</span>
                  <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.totalEmployees}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800 shadow-sm">
                  <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Total Departments</span>
                  <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.totalDepartments}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800 shadow-sm">
                  <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Reporting Managers</span>
                  <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.managersCount}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800 shadow-sm">
                  <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Unassigned Staff</span>
                  <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.employeesWithoutManagers}</p>
                </div>
              </div>
            )}

            {/* Department Wise charts distributions grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-3xl border border-slate-205/60 dark:border-slate-800 shadow-sm space-y-4">
                <h3 className="text-xs font-black text-slate-950 dark:text-white uppercase tracking-wider">Departmental Distributions</h3>
                <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                  {stats?.departmentDistribution && stats.departmentDistribution.map((dept: any, idx: number) => {
                    const maxCount = Math.max(...stats.departmentDistribution.map((d: any) => d.count));
                    const widthPercent = maxCount > 0 ? (dept.count / maxCount) * 100 : 0;
                    return (
                      <div key={idx} className="space-y-1 text-left">
                        <div className="flex justify-between text-[10.5px] font-bold text-slate-700 dark:text-slate-350">
                          <span>{dept.name}</span>
                          <span>{dept.count} Members</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div className="bg-blue-600 h-full rounded-full" style={{ width: `${widthPercent}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* PDF & spreadsheets exports tools */}
              <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-3xl border border-slate-205/60 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-black text-slate-950 dark:text-white uppercase tracking-wider">Export Organizational Layouts</h3>
                  <p className="text-[10px] text-slate-450 mt-1 leading-relaxed">Save tabular directories, manager indices, or printable reporting mappings locally.</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => handleExportOrgChart('csv')}
                    className="p-4 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 hover:border-blue-500 border border-slate-200 dark:border-slate-750 rounded-2xl flex flex-col items-center gap-2 cursor-pointer transition-colors"
                  >
                    <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">Export CSV</span>
                  </button>

                  <button 
                    onClick={() => handleExportOrgChart('excel')}
                    className="p-4 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 hover:border-blue-500 border border-slate-200 dark:border-slate-750 rounded-2xl flex flex-col items-center gap-2 cursor-pointer transition-colors"
                  >
                    <FileText className="w-5 h-5 text-blue-550" />
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">Export Excel</span>
                  </button>
                </div>

                <button
                  onClick={handlePrintOrgChart}
                  className="w-full py-2.5 border border-dashed border-slate-300 dark:border-slate-750 hover:border-blue-500 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Print Chart to PDF
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ==================== EMPLOYEE DETAILS DRAWER ==================== */}
      <AnimatePresence>
        {selectedEmpId && (
          <>
            {/* Drawer Overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedEmpId(null)}
              className="fixed inset-0 bg-slate-950 z-[160]"
            />
            {/* Drawer Slide */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full sm:w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-[170] p-4 sm:p-6 overflow-y-auto space-y-6 text-left"
            >
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Employee Relationships</span>
                <button 
                  onClick={() => setSelectedEmpId(null)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-450 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {drawerLoading ? (
                <div className="flex justify-center items-center py-20">
                  <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                </div>
              ) : selectedEmpRelation ? (
                <div className="space-y-6">
                  {/* Employee Info Header */}
                  <div className="flex flex-col items-center text-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-5">
                    <div className="w-16 h-16 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                      <img 
                        src={selectedEmpRelation.employee.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedEmpRelation.employee.fullName}`} 
                        alt="Photo" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-950 dark:text-white leading-tight uppercase">{selectedEmpRelation.employee.fullName}</h3>
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider block mt-1">{selectedEmpRelation.employee.designation}</span>
                      <span className="text-[9px] text-slate-400 font-semibold">{selectedEmpRelation.employee.department}</span>
                    </div>
                  </div>

                  {/* Upward Reporting manager hierarchy chain */}
                  <div className="space-y-3">
                    <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block">Reporting Line</span>
                    {selectedEmpRelation.reportingChain && selectedEmpRelation.reportingChain.length > 0 ? (
                      <div className="space-y-2 border-l border-dashed border-slate-250/60 dark:border-slate-800 pl-4 py-1 relative ml-2">
                        {selectedEmpRelation.reportingChain.map((mgr: any, i: number) => (
                          <div key={i} className="relative flex items-center gap-2.5">
                            {/* Dot indicator */}
                            <div className="absolute -left-[21px] w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700" />
                            <div className="w-6 h-6 rounded-full bg-slate-100 overflow-hidden shrink-0">
                              <img src={mgr.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${mgr.fullName}`} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div className="truncate">
                              <span className="text-[10px] font-black text-slate-800 dark:text-slate-200 block leading-tight">{mgr.fullName}</span>
                              <span className="text-[7.5px] text-slate-400 block">{mgr.designation}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[9.5px] text-slate-450 italic">Top-most role (CEO). No managers above.</p>
                    )}
                  </div>

                  {/* Immediate Direct Reports list */}
                  <div className="space-y-2.5">
                    <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block">Direct Reports ({selectedEmpRelation.reports.length})</span>
                    {selectedEmpRelation.reports.length > 0 ? (
                      <div className="space-y-2.5">
                        {selectedEmpRelation.reports.map((rep: any, i: number) => (
                          <div key={i} className="flex items-center gap-2.5 cursor-pointer" onClick={() => handleOpenEmployeeDetail(rep._id)}>
                            <div className="w-6 h-6 rounded-full bg-slate-100 overflow-hidden shrink-0">
                              <img src={rep.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${rep.fullName}`} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div className="truncate">
                              <span className="text-[10px] font-black text-slate-800 dark:text-slate-200 block leading-tight hover:text-blue-600 transition-colors">{rep.fullName}</span>
                              <span className="text-[7.5px] text-slate-450 block">{rep.designation}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[9.5px] text-slate-450 italic">No direct reports currently assigned.</p>
                    )}
                  </div>

                  {/* Peers (same manager) */}
                  <div className="space-y-2.5">
                    <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block">Peers ({selectedEmpRelation.peers.length})</span>
                    {selectedEmpRelation.peers.length > 0 ? (
                      <div className="space-y-2.5">
                        {selectedEmpRelation.peers.map((peer: any, i: number) => (
                          <div key={i} className="flex items-center gap-2.5 cursor-pointer" onClick={() => handleOpenEmployeeDetail(peer._id)}>
                            <div className="w-6 h-6 rounded-full bg-slate-100 overflow-hidden shrink-0">
                              <img src={peer.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${peer.fullName}`} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div className="truncate">
                              <span className="text-[10px] font-black text-slate-800 dark:text-slate-200 block leading-tight hover:text-blue-600 transition-colors">{peer.fullName}</span>
                              <span className="text-[7.5px] text-slate-450 block">{peer.designation}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[9.5px] text-slate-450 italic">No team peers found.</p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-450">Failed to load relationships details.</p>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
