"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  HelpCircle, Plus, Search, Eye, Filter, CheckCircle2, 
  Clock, AlertCircle, MessageSquare, Send, Paperclip, 
  Download, BarChart3, Settings, ShieldAlert, Star, 
  TrendingUp, Trash2, ArrowUpRight, CheckSquare, Users, 
  Sparkles, Lock, ArrowLeft, RefreshCw, X, FileSpreadsheet, FileText, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";
import { PastelStatCard } from '@/components/ui/PastelStatCard';
import { usePermission } from '@/context/PermissionContext';

interface HelpDeskPageProps {
  userRole: string;
  profile: any;
  addNotification?: (msg: string) => void;
}

export default function HelpDeskPage({ userRole, profile, addNotification }: HelpDeskPageProps) {
  const { can } = usePermission();
  // Navigation / Tabs
  // Employee tabs: 'my-tickets', 'raise-ticket'
  // HR tabs: 'all-tickets', 'assigned-to-me', 'analytics'
  // Admin tabs: 'analytics', 'all-tickets', 'categories-settings', 'reports'
  const isSupportStaff = can('helpdesk.resolve') || can('helpdesk.assign');
  const defaultTab = !isSupportStaff ? 'my-tickets' : (can('settings.company') ? 'analytics' : 'all-tickets');
  const [activeTab, setActiveTab] = useState(defaultTab);

  // States
  const [tickets, setTickets] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [selectedTicketData, setSelectedTicketData] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // New Ticket Form State
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('');
  const [description, setDescription] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

  // New Comment State
  const [newComment, setNewComment] = useState('');
  const [isCommentInternal, setIsCommentInternal] = useState(false);
  const [commentAttachment, setCommentAttachment] = useState('');

  // Rating Popover
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingFeedback, setRatingFeedback] = useState('');
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  // Analytics Stats State
  const [analytics, setAnalytics] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Profile update form states (HR Approval)
  const [targetEmployee, setTargetEmployee] = useState<any>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editDob, setEditDob] = useState('');
  const [editGender, setEditGender] = useState('Male');
  const [editBloodGroup, setEditBloodGroup] = useState('O+');
  const [editMaritalStatus, setEditMaritalStatus] = useState('Single');
  const [editNationality, setEditNationality] = useState('Indian');
  const [editBankName, setEditBankName] = useState('');
  const [editAccountNumber, setEditAccountNumber] = useState('');
  const [editIfscCode, setEditIfscCode] = useState('');
  const [editPan, setEditPan] = useState('');
  const [editAadhaar, setEditAadhaar] = useState('');
  const [editPf, setEditPf] = useState('');
  const [updatingProfileDb, setUpdatingProfileDb] = useState(false);

  useEffect(() => {
    if (selectedTicketData && isSupportStaff && employees.length > 0) {
      const emp = employees.find(e => e.email === selectedTicketData.employeeEmail);
      if (emp) {
        setTargetEmployee(emp);
        
        const isPersonalReq = selectedTicketData.subject.includes('Personal Information');
        const isBankReq = selectedTicketData.subject.includes('Bank');

        const extractVal = (key: string, fallback: string) => {
          const match = selectedTicketData.description.match(new RegExp(`-\\s*${key}:\\s*(.*)`));
          return match && match[1].trim() !== 'N/A' ? match[1].trim() : fallback;
        };

        if (isPersonalReq) {
          setEditFullName(extractVal('Full Name', emp.fullName || ''));
          setEditDob(extractVal('Date of Birth', emp.dateOfBirth ? new Date(emp.dateOfBirth).toISOString().split('T')[0] : ''));
          setEditGender(extractVal('Gender', emp.gender || 'Male'));
          setEditBloodGroup(extractVal('Blood Group', emp.bloodGroup || 'O+'));
          setEditMaritalStatus(extractVal('Marital Status', emp.maritalStatus || 'Single'));
          setEditNationality(extractVal('Nationality', emp.nationality || 'Indian'));
        } else if (isBankReq) {
          setEditBankName(extractVal('Bank Name', emp.bankName || ''));
          setEditAccountNumber(extractVal('Account Number', emp.accountNumber || ''));
          setEditIfscCode(extractVal('IFSC Code', emp.ifscCode || ''));
          setEditPan(extractVal('PAN Number', emp.panNumber || ''));
          setEditAadhaar(extractVal('Aadhaar Number', emp.aadhaarNumber || ''));
          setEditPf(extractVal('PF Number', emp.pfNumber || ''));
        } else {
          setEditFullName(emp.fullName || '');
          setEditDob(emp.dateOfBirth ? new Date(emp.dateOfBirth).toISOString().split('T')[0] : '');
          setEditGender(emp.gender || 'Male');
          setEditBloodGroup(emp.bloodGroup || 'O+');
          setEditMaritalStatus(emp.maritalStatus || 'Single');
          setEditNationality(emp.nationality || 'Indian');
          setEditBankName(emp.bankName || '');
          setEditAccountNumber(emp.accountNumber || '');
          setEditIfscCode(emp.ifscCode || '');
          setEditPan(emp.panNumber || '');
          setEditAadhaar(emp.aadhaarNumber || '');
          setEditPf(emp.pfNumber || '');
        }
      } else {
        setTargetEmployee(null);
      }
    }
  }, [selectedTicketData, employees, isSupportStaff]);

  // Admin Config settings (stored locally for demo/configuration)
  const [categoriesList, setCategoriesList] = useState([
    'Leave Issue', 'Attendance Issue', 'Payroll Issue', 'Document Request', 
    'IT Support', 'HR Support', 'Asset Issue', 'Account Access', 'General Inquiry'
  ]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [prioritiesList, setPrioritiesList] = useState(['Low', 'Medium', 'High', 'Urgent']);

  // Fetch Tickets
  const fetchTickets = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // Call our backend API
      const res = await fetch(`/api/tickets?t=${Date.now()}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setTickets(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error('Failed to load tickets:', e);
    } finally {
      setLoading(false);
    }
  };

  // Fetch HR/Agents (employees list) for assignment dropdown
  const fetchEmployeesList = async () => {
    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/employees', { headers });
      if (res.ok) {
        const data = await res.json();
        setEmployees(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error('Failed to load employees:', e);
    }
  };

  // Fetch Analytics stats
  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/tickets/analytics?t=${Date.now()}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (e) {
      console.error('Failed to load analytics:', e);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    if (isSupportStaff) {
      fetchEmployeesList();
      fetchAnalytics();
    }
  }, [userRole]);

  // Load ticket details and comments
  const handleSelectTicket = async (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setComments([]);
    setRatingSubmitted(false);
    setRatingFeedback('');
    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/tickets/${ticketId}?t=${Date.now()}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setSelectedTicketData(data.ticket);
        setComments(data.comments || []);
      }
    } catch (e) {
      console.error('Failed to load ticket details:', e);
    }
  };

  // Client-side instant keyword-based AI auto-classifier (runs as user types)
  const aiClassifiedResult = useMemo(() => {
    if (!subject && !description) return null;
    const content = `${subject} ${description}`.toLowerCase();
    
    let category = 'General Inquiry';
    let priority = 'Medium';
    let explanation = 'Based on keywords in your request.';
    
    if (content.includes('payroll') || content.includes('salary') || content.includes('paycheck') || content.includes('slip') || content.includes('pf ') || content.includes('deduction')) {
      category = 'Payroll Issue';
      explanation = 'Detected payroll or salary related details.';
    } else if (content.includes('leave') || content.includes('vacation') || content.includes('sick') || content.includes('holiday') || content.includes('casual')) {
      category = 'Leave Issue';
      explanation = 'Detected leave request or date adjustment related terms.';
    } else if (content.includes('attendance') || content.includes('biometric') || content.includes('checkin') || content.includes('checkout') || content.includes('clock') || content.includes('punch')) {
      category = 'Attendance Issue';
      explanation = 'Detected biometric punch or time logging references.';
    } else if (content.includes('laptop') || content.includes('computer') || content.includes('keyboard') || content.includes('mouse') || content.includes('monitor') || content.includes('asset') || content.includes('hardware')) {
      category = 'Asset Issue';
      explanation = 'Detected IT hardware or asset assignment references.';
    } else if (content.includes('password') || content.includes('login') || content.includes('account') || content.includes('access') || content.includes('reset') || content.includes('portal')) {
      category = 'Account Access';
      explanation = 'Detected authentication or system access terms.';
    } else if (content.includes('vpn') || content.includes('wifi') || content.includes('internet') || content.includes('software') || content.includes('printer')) {
      category = 'IT Support';
      explanation = 'Detected general technical and network support terms.';
    }

    if (content.includes('urgent') || content.includes('critical') || content.includes('blocker') || content.includes('immediate') || content.includes('broken') || content.includes('cannot work') || content.includes('fail')) {
      priority = 'Urgent';
    } else if (content.includes('high') || content.includes('important') || content.includes('error') || content.includes('missing') || content.includes('wrong')) {
      priority = 'High';
    } else if (content.includes('low') || content.includes('minor') || content.includes('query') || content.includes('ask') || content.includes('how to')) {
      priority = 'Low';
    }

    return { category, priority, explanation };
  }, [subject, description]);

  // Set AI suggestions to form fields
  const applyAISuggestions = () => {
    if (aiClassifiedResult) {
      setCategory(aiClassifiedResult.category);
      setPriority(aiClassifiedResult.priority);
      if (addNotification) addNotification('Applied AI recommended category and priority!');
    }
  };

  // Submit Ticket
  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !description) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const finalCategory = category || (aiClassifiedResult ? aiClassifiedResult.category : 'General Inquiry');
      const finalPriority = priority || (aiClassifiedResult ? aiClassifiedResult.priority : 'Medium');

      const payload = {
        subject,
        category: finalCategory,
        priority: finalPriority,
        description,
        department: profile.dept || 'Corporate',
        attachments: attachmentUrl ? [attachmentUrl] : []
      };

      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const newTicket = await res.json();
        setTickets(prev => [newTicket, ...prev]);
        setSubject('');
        setDescription('');
        setAttachmentUrl('');
        setCategory('');
        setPriority('');
        setActiveTab('my-tickets');
        if (addNotification) addNotification(`Ticket ${newTicket.ticketNumber} created successfully!`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle local file upload (simulated, or mock path)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isComment = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (isComment) {
      setCommentAttachment(URL.createObjectURL(file)); // mockup file path
    } else {
      setUploadingAttachment(true);
      // Simulate file upload or use system endpoint if active
      setTimeout(() => {
        setAttachmentUrl(`/uploads/tickets/${file.name}`);
        setUploadingAttachment(false);
        if (addNotification) addNotification(`Uploaded file: ${file.name}`);
      }, 800);
    }
  };

  // Submit Comment
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedTicketId) return;

    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/tickets/${selectedTicketId}/comment`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          comment: newComment,
          isInternal: isCommentInternal,
          attachments: commentAttachment ? [commentAttachment] : []
        })
      });

      if (res.ok) {
        const addedComment = await res.json();
        setComments(prev => [...prev, addedComment]);
        setNewComment('');
        setCommentAttachment('');
        setIsCommentInternal(false);
        
        // Refresh ticket status locally (might have updated to Waiting for Employee, etc.)
        if (selectedTicketData) {
          const updatedStatus = userRole === 'Employee' ? 'In Progress' : 'Waiting for Employee';
          setSelectedTicketData({ ...selectedTicketData, status: updatedStatus });
          setTickets(prev => prev.map(t => t._id === selectedTicketId ? { ...t, status: updatedStatus } : t));
        }

        if (addNotification) addNotification('Reply added successfully!');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Assign Ticket (HR / Admin)
  const handleAssignTicket = async (agentEmail: string, agentName: string) => {
    if (!selectedTicketId) return;

    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/tickets/${selectedTicketId}/assign`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ assignedTo: agentEmail, assignedToName: agentName })
      });

      if (res.ok) {
        const updated = await res.json();
        setSelectedTicketData(updated);
        setTickets(prev => prev.map(t => t._id === selectedTicketId ? updated : t));
        if (addNotification) addNotification(`Ticket assigned to ${agentName}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Update Status (HR / Admin, or Employee resolve)
  const handleUpdateStatus = async (status: string) => {
    if (!selectedTicketId) return;

    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/tickets/${selectedTicketId}/status`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status })
      });

      if (res.ok) {
        const updated = await res.json();
        setSelectedTicketData(updated);
        setTickets(prev => prev.map(t => t._id === selectedTicketId ? updated : t));
        if (addNotification) addNotification(`Ticket status updated to ${status}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Reopen Ticket
  const handleReopenTicket = async () => {
    if (!selectedTicketId) return;

    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/tickets/${selectedTicketId}/reopen`, {
        method: 'POST',
        headers
      });

      if (res.ok) {
        const updated = await res.json();
        setSelectedTicketData(updated);
        setTickets(prev => prev.map(t => t._id === selectedTicketId ? updated : t));
        if (addNotification) addNotification('Ticket reopened successfully.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Submit Rating & Feedback
  const handleSubmitRating = async () => {
    if (!selectedTicketId) return;

    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/tickets/${selectedTicketId}/status`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ rating: ratingValue, feedback: ratingFeedback })
      });

      if (res.ok) {
        const updated = await res.json();
        setSelectedTicketData(updated);
        setTickets(prev => prev.map(t => t._id === selectedTicketId ? updated : t));
        setRatingSubmitted(true);
        if (addNotification) addNotification('Thank you for rating our resolution!');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Escalate Ticket (HR / Admin only)
  const handleEscalateTicket = async (reason: string) => {
    if (!selectedTicketId) return;

    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/tickets/${selectedTicketId}/status`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ escalated: true, escalatedReason: reason })
      });

      if (res.ok) {
        const updated = await res.json();
        setSelectedTicketData(updated);
        setTickets(prev => prev.map(t => t._id === selectedTicketId ? updated : t));
        if (addNotification) addNotification('Ticket escalated successfully to Admin. Priority set to Urgent.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleApproveProfileChange = async (isBank: boolean) => {
    if (!targetEmployee || !selectedTicketId) return;
    setUpdatingProfileDb(true);
    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const payload = isBank ? {
        bankName: editBankName,
        accountNumber: editAccountNumber,
        ifscCode: editIfscCode,
        panNumber: editPan,
        aadhaarNumber: editAadhaar,
        pfNumber: editPf
      } : {
        fullName: editFullName,
        dateOfBirth: editDob,
        gender: editGender,
        bloodGroup: editBloodGroup,
        maritalStatus: editMaritalStatus,
        nationality: editNationality
      };

      const res = await fetch(`/api/employees/${targetEmployee._id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        if (addNotification) addNotification('Employee database updated successfully! Resolving ticket...');
        // Resolve ticket
        await handleUpdateStatus('Resolved');
        // Refresh employees list
        fetchEmployeesList();
      } else {
        const err = await res.json().catch(() => ({}));
        if (addNotification) addNotification(err.error || 'Failed to update employee details.');
      }
    } catch (err) {
      console.error(err);
      if (addNotification) addNotification('Error updating employee database.');
    } finally {
      setUpdatingProfileDb(false);
    }
  };

  // Admin Export Reports to CSV
  const handleExportReports = async (format: 'csv' | 'excel' | 'pdf') => {
    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/tickets/reports', { headers });
      if (!res.ok) return;

      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) {
        if (addNotification) addNotification('No data available to export.');
        return;
      }

      const exportKeys = ['_id', 'title', 'description', 'category', 'priority', 'status', 'employeeName', 'employeeEmail', 'createdAt'];
      const displayHeaders = ['Ticket ID', 'Title', 'Description', 'Category', 'Priority', 'Status', 'Employee Name', 'Employee Email', 'Created At'];

      if (format === 'csv') {
        const csvContent = [
          displayHeaders.join(','),
          ...data.map(item => exportKeys.map(k => `"${String(item[k] || '').replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `helpdesk_tickets_report_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        if (addNotification) addNotification('CSV report downloaded successfully.');
      } else if (format === 'excel') {
        let htmlTable = '<table border="1"><thead><tr>' + displayHeaders.map(h => `<th>${h}</th>`).join('') + '</tr></thead><tbody>';
        data.forEach(item => {
          htmlTable += '<tr>' + exportKeys.map(k => `<td>${item[k] || ''}</td>`).join('') + '</tr>';
        });
        htmlTable += '</tbody></table>';

        const blob = new Blob([htmlTable], { type: 'application/vnd.ms-excel' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `helpdesk_tickets_report_${new Date().toISOString().slice(0, 10)}.xls`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        if (addNotification) addNotification('Excel report downloaded successfully.');
      } else {
        // Build beautiful printable HTML for Help Desk Tickets
        let tableRows = '';
        data.forEach((t: any) => {
          tableRows += `
            <tr>
              <td><strong>#${String(t._id || t.id).slice(-6).toUpperCase()}</strong></td>
              <td><strong>${t.title}</strong><br><small style="color: #64748b;">${t.description || ''}</small></td>
              <td class="text-center">${t.category || ''}</td>
              <td class="text-center"><span class="badge ${String(t.priority || '').toLowerCase()}">${t.priority}</span></td>
              <td class="text-center"><span class="badge ${String(t.status || '').toLowerCase()}">${t.status}</span></td>
              <td>${t.employeeName || ''}<br><small style="color: #64748b;">${t.employeeEmail || ''}</small></td>
              <td class="text-center">${t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}</td>
            </tr>
          `;
        });

        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Help Desk Tickets Report</title>
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
    .badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 8.5px;
      font-weight: 700;
      text-transform: uppercase;
      background-color: #e2e8f0;
      color: #475569;
    }
    .badge.high, .badge.critical, .badge.open {
      background-color: #fee2e2;
      color: #b91c1c;
    }
    .badge.medium, .badge.in_progress, .badge.pending {
      background-color: #fef3c7;
      color: #b45309;
    }
    .badge.low, .badge.closed, .badge.resolved {
      background-color: #dcfce7;
      color: #15803d;
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
      <h1>HR Core systems - Help Desk</h1>
      <p>Consolidated Tickets Performance Report</p>
    </div>
    <div class="meta-box">
      <strong>Generated On:</strong> ${new Date().toLocaleString('en-IN')}<br>
      <strong>Total Records:</strong> ${data.length}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Ticket ID</th>
        <th>Title & Description</th>
        <th class="text-center">Category</th>
        <th class="text-center">Priority</th>
        <th class="text-center">Status</th>
        <th>Employee Details</th>
        <th class="text-center">Created At</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>

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
          if (addNotification) addNotification('PDF report preview initialized.');
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Add category (Admin settings)
  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    if (categoriesList.includes(newCategoryName.trim())) return;
    setCategoriesList([...categoriesList, newCategoryName.trim()]);
    setNewCategoryName('');
    if (addNotification) addNotification(`Added category: ${newCategoryName}`);
  };

  // Delete category
  const handleDeleteCategory = (cat: string) => {
    setCategoriesList(categoriesList.filter(c => c !== cat));
    if (addNotification) addNotification(`Removed category: ${cat}`);
  };

  // Filter & Search Tickets List
  const filteredTicketsList = useMemo(() => {
    return tickets.filter(t => {
      const matchSearch = 
        t.subject.toLowerCase().includes(searchTerm.toLowerCase()) || 
        t.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchStatus = statusFilter === 'All' ? true : t.status === statusFilter;
      const matchPriority = priorityFilter === 'All' ? true : t.priority === priorityFilter;
      const matchCategory = categoryFilter === 'All' ? true : t.category === categoryFilter;

      return matchSearch && matchStatus && matchPriority && matchCategory;
    });
  }, [tickets, searchTerm, statusFilter, priorityFilter, categoryFilter]);

  // HR Agents list for assignments dropdown
  const hrAgents = useMemo(() => {
    return employees.filter(e => e.department === 'HR' || e.designation?.toLowerCase().includes('hr') || e.role === 'Admin');
  }, [employees]);

  return (
    <div className="flex flex-col w-full h-[calc(100vh-80px)] bg-transparent dark:bg-transparent overflow-hidden font-sans">
      {/* Top Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 sm:p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 gap-3.5 rounded-3xl m-4 sm:m-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-black text-slate-950 dark:text-white uppercase tracking-tight">Employee Help Desk</h1>
          </div>
          <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Raise support issues, IT requests, leave concerns and track resolutions.</p>
        </div>

        {/* Dynamic Navigation Action Tabs based on role */}
        <div className="flex bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-200/40 dark:border-slate-800 w-fit max-w-full overflow-x-auto scrollbar-none shadow-inner print-invisible ml-4 sm:ml-5 mb-4">
          {userRole === 'Employee' && (
            <>
              <button 
                onClick={() => setActiveTab('my-tickets')} 
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer border-none whitespace-nowrap shrink-0",
                  activeTab === 'my-tickets' 
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm" 
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                )}
              >
                My Tickets
              </button>
              <button 
                onClick={() => setActiveTab('raise-ticket')} 
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer border-none whitespace-nowrap shrink-0",
                  activeTab === 'raise-ticket' 
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm" 
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                )}
              >
                Raise Ticket
              </button>
            </>
          )}

          {can('helpdesk.resolve') && !can('settings.company') && (
            <>
              <button 
                onClick={() => setActiveTab('all-tickets')} 
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer border-none whitespace-nowrap shrink-0",
                  activeTab === 'all-tickets' 
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm" 
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                )}
              >
                All Requests
              </button>
              <button 
                onClick={() => setActiveTab('assigned-to-me')} 
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer border-none whitespace-nowrap shrink-0",
                  activeTab === 'assigned-to-me' 
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm" 
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                )}
              >
                My Queue
              </button>
              <button 
                onClick={() => setActiveTab('analytics')} 
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer border-none whitespace-nowrap shrink-0",
                  activeTab === 'analytics' 
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm" 
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                )}
              >
                Analytics
              </button>
            </>
          )}

          {can('settings.company') && (
            <>
              <button 
                onClick={() => setActiveTab('analytics')} 
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer border-none whitespace-nowrap shrink-0",
                  activeTab === 'analytics' 
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm" 
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                )}
              >
                Dashboard
              </button>
              <button 
                onClick={() => setActiveTab('all-tickets')} 
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer border-none whitespace-nowrap shrink-0",
                  activeTab === 'all-tickets' 
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm" 
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                )}
              >
                Tickets
              </button>
              <button 
                onClick={() => setActiveTab('categories-settings')} 
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer border-none whitespace-nowrap shrink-0",
                  activeTab === 'categories-settings' 
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm" 
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                )}
              >
                Settings
              </button>
              <button 
                onClick={() => setActiveTab('reports')} 
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer border-none whitespace-nowrap shrink-0",
                  activeTab === 'reports' 
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm" 
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                )}
              >
                Reports
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Workspace Body Content */}
      <div className="flex-1 w-full overflow-hidden flex flex-col min-h-0 px-4 sm:px-5 pb-4 sm:pb-5">
        
        {/* 1. ANALYTICS VIEW */}
        {activeTab === 'analytics' && (
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            {/* Top Cards Grid */}
            {analyticsLoading ? (
              <div className="w-full flex items-center justify-center p-24">
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-left">
                  {[
                    { label: 'Total Tickets', value: analytics?.totalTickets || 0, icon: HelpCircle, accent: '#3B82F6', sub: 'All registered requests' },
                    { label: 'Open Tickets', value: analytics?.openTickets || 0, icon: Clock, accent: '#F59E0B', sub: 'Awaiting resolution' },
                    { label: 'Closed Tickets', value: analytics?.closedTickets || 0, icon: CheckCircle2, accent: '#10B981', sub: 'Resolved queries' },
                    { label: 'Urgent / High', value: analytics?.highPriorityTickets || 0, icon: ShieldAlert, accent: '#F43F5E', sub: 'Critical priority status' }
                  ].map((stat, idx) => (
          <PastelStatCard key={idx} icon={stat.icon} label={stat.label} value={stat.value} sub={stat.sub || stat.desc} accent={stat.accent} />
        ))}
                </div>

                {/* Second Level Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* SLA Compliance and satisfaction rating */}
                  <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800 shadow-sm space-y-6">
                    <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Service Levels & Feedback</h2>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-105/50">
                        <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">SLA Compliance</span>
                        <div className="flex items-baseline gap-2 mt-2">
                          <p className="text-3xl font-black text-blue-650 dark:text-blue-400">{analytics?.slaCompliance || 100}%</p>
                          <span className="text-[9px] text-slate-450">&lt; 24h Resolution</span>
                        </div>
                      </div>

                      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-105/50">
                        <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Satisfaction Score</span>
                        <div className="flex items-center gap-1.5 mt-2 text-amber-500">
                          <Star className="w-6 h-6 fill-current" />
                          <p className="text-3xl font-black text-slate-900 dark:text-white">{analytics?.employeeSatisfactionScore || '5.0'}</p>
                          <span className="text-[9px] text-slate-450">/ 5.0 Rating</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-105/50 flex justify-between items-center">
                      <div>
                        <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Average Resolution Time</span>
                        <p className="text-lg font-black text-slate-900 dark:text-white mt-1">{analytics?.averageResolutionTime || 0} Hours</p>
                      </div>
                      <TrendingUp className="w-10 h-10 text-emerald-500 opacity-60" />
                    </div>
                  </div>

                  {/* Issues by Department */}
                  <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800 shadow-sm space-y-4">
                    <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Tickets by Department</h2>
                    <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2">
                      {analytics?.departmentWiseIssues && analytics.departmentWiseIssues.length > 0 ? (
                        analytics.departmentWiseIssues.map((item: any, idx: number) => {
                          const max = Math.max(...analytics.departmentWiseIssues.map((i: any) => i.count));
                          const percent = max > 0 ? (item.count / max) * 100 : 0;
                          return (
                            <div key={idx} className="space-y-1.5">
                              <div className="flex justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                <span>{item.name}</span>
                                <span>{item.count} Tickets</span>
                              </div>
                              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                <div className="bg-blue-600 h-full rounded-full" style={{ width: `${percent}%` }} />
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-xs text-slate-450 py-12 text-center">No department wise tickets logged yet.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Trend Chart (Simple bar visual) */}
                <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Weekly Ticket Trend</h2>
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-3 py-1.5 rounded-lg uppercase font-bold tracking-wider">Last 7 Days</span>
                  </div>

                  <div className="overflow-x-auto no-scrollbar w-full">
                    <div className="flex items-end justify-between h-48 pt-6 border-b border-slate-100 dark:border-slate-800 min-w-[340px] sm:min-w-0">
                      {analytics?.ticketTrends && analytics.ticketTrends.length > 0 ? (
                        analytics.ticketTrends.map((t: any, idx: number) => {
                          const maxVal = Math.max(...analytics.ticketTrends.map((tr: any) => Math.max(tr.created, tr.resolved)), 1);
                          const createdHeight = (t.created / maxVal) * 120;
                          const resolvedHeight = (t.resolved / maxVal) * 120;
                          return (
                            <div key={idx} className="flex flex-col items-center flex-1 gap-2">
                              <div className="flex gap-1.5 items-end justify-center h-32">
                                <div className="w-4 bg-blue-600 rounded-t-sm" style={{ height: `${createdHeight}px` }} title={`Created: ${t.created}`} />
                                <div className="w-4 bg-emerald-500 rounded-t-sm" style={{ height: `${resolvedHeight}px` }} title={`Resolved: ${t.resolved}`} />
                              </div>
                              <span className="text-[9px] font-bold text-slate-400 truncate w-12 text-center">{t.date}</span>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-xs text-slate-450 w-full text-center py-20">No weekly trends available yet.</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-4 justify-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />
                      <span>Created</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                      <span>Resolved</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* 2. RAISE TICKET FORM */}
        {activeTab === 'raise-ticket' && (
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto max-w-2xl mx-auto w-full">
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-8 rounded-3xl border border-slate-200/50 dark:border-slate-800 shadow-sm space-y-6">
              <h2 className="text-base font-black text-slate-950 dark:text-white uppercase tracking-tight">Raise a Support Ticket</h2>
              <form onSubmit={handleSubmitTicket} className="space-y-4">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Subject</label>
                  <input 
                    type="text" 
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                    placeholder="Brief summary of your concern (e.g., Access card biometric punch failure)"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-2xl text-xs dark:text-white outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-2xl text-xs dark:text-white outline-none focus:border-blue-500 transition-colors"
                    >
                      <option value="">-- Choose Category --</option>
                      {categoriesList.map((cat, idx) => (
                        <option key={idx} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-2xl text-xs dark:text-white outline-none focus:border-blue-500 transition-colors"
                    >
                      <option value="">-- Select Priority --</option>
                      {prioritiesList.map((pr, idx) => (
                        <option key={idx} value={pr}>{pr}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* LIVE AI HELPER CARD */}
                {aiClassifiedResult && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 p-4 rounded-2xl space-y-2.5"
                  >
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                      <Sparkles className="w-4 h-4 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-wider">AI Support Copilot Recommendation</span>
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-350 space-y-1.5">
                      <p>AI suggests setting Category to <strong className="text-slate-900 dark:text-white font-bold">{aiClassifiedResult.category}</strong> and Priority to <strong className="text-slate-900 dark:text-white font-bold">{aiClassifiedResult.priority}</strong>.</p>
                      <p className="text-[9px] italic opacity-70">Reason: {aiClassifiedResult.explanation}</p>
                    </div>
                    <button
                      type="button"
                      onClick={applyAISuggestions}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                    >
                      Apply Recommendation
                    </button>
                  </motion.div>
                )}

                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Detailed Description</label>
                  <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    rows={5}
                    placeholder="Provide full details here to help HR and IT support solve your issue faster..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-2xl text-xs dark:text-white outline-none focus:border-blue-500 transition-colors resize-none"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">File Attachment (Optional)</label>
                  <div className="flex items-center gap-4">
                    <label className="cursor-pointer px-4 py-2.5 border border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 bg-slate-50 dark:bg-slate-800 text-slate-500 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-colors flex items-center gap-2">
                      <Paperclip className="w-4 h-4" />
                      <span>{uploadingAttachment ? 'Uploading...' : 'Choose File'}</span>
                      <input 
                        type="file" 
                        onChange={(e) => handleFileUpload(e, false)} 
                        className="hidden" 
                        disabled={uploadingAttachment}
                      />
                    </label>
                    {attachmentUrl && (
                      <span className="text-[10px] text-emerald-500 font-bold truncate max-w-xs">{attachmentUrl.split('/').pop()}</span>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md shadow-blue-500/20 disabled:opacity-50"
                  >
                    {submitting ? 'Submitting Ticket...' : 'Submit Support Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 3. ALL TICKETS / MY QUEUE LIST & CHAT WORKSPACE */}
        {(activeTab === 'all-tickets' || activeTab === 'my-tickets' || activeTab === 'assigned-to-me') && (
          <div className="flex-1 w-full flex overflow-hidden min-h-0 border border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 shadow-sm">
            {/* Split Screen Panel A: Tickets Sidebar Queue */}
            <div className={cn("w-full md:w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col min-h-0 bg-transparent dark:bg-transparent shrink-0 transition-all", selectedTicketId ? "hidden md:flex" : "flex")}>
              
              {/* Search & Filters block */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    placeholder="Search ticket number, subject..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 pl-9 pr-4 py-2 rounded-xl text-xs outline-none focus:border-blue-500 dark:text-white text-slate-900 transition-colors"
                  />
                </div>

                {/* Inline filter tags */}
                <div className="flex flex-wrap gap-1.5 items-center">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="text-[9px] bg-slate-100 dark:bg-slate-800 border-none outline-none font-bold text-slate-500 rounded-lg p-1.5 cursor-pointer"
                  >
                    <option value="All">Status: All</option>
                    <option value="Open">Open</option>
                    <option value="Assigned">Assigned</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Waiting for Employee">Waiting</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                    <option value="Reopened">Reopened</option>
                  </select>

                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="text-[9px] bg-slate-100 dark:bg-slate-800 border-none outline-none font-bold text-slate-500 rounded-lg p-1.5 cursor-pointer"
                  >
                    <option value="All">Priority: All</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Tickets List */}
              <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-slate-100 dark:divide-slate-800/60 p-2 space-y-1">
                {loading ? (
                  <div className="flex justify-center items-center py-20">
                    <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                  </div>
                ) : filteredTicketsList.length === 0 ? (
                  <p className="text-[10px] font-black text-slate-450 uppercase text-center py-16">No tickets found</p>
                ) : (
                  filteredTicketsList.map((t, idx) => {
                    const isSelected = t._id === selectedTicketId;
                    const dateStr = new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    
                    // Filter for 'assigned-to-me' context
                    if (activeTab === 'assigned-to-me' && t.assignedTo !== profile.email) {
                      return null;
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectTicket(t._id)}
                        className={cn(
                          "w-full text-left p-3.5 rounded-2xl border transition-all flex flex-col gap-1.5 outline-none relative group",
                          isSelected 
                            ? "bg-blue-50/70 border-blue-200 dark:bg-blue-900/10 dark:border-blue-900/60" 
                            : "border-transparent bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200 dark:bg-transparent dark:hover:bg-slate-900/50 dark:hover:border-slate-800"
                        )}
                      >
                        <div className="flex justify-between items-start gap-2 w-full">
                          <span className="text-[9px] font-black font-mono bg-slate-150/60 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded">
                            {t.ticketNumber}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400">{dateStr}</span>
                        </div>

                        <p className="text-[11px] font-black text-slate-900 dark:text-white leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate w-full">
                          {t.subject}
                        </p>

                        <div className="flex justify-between items-center gap-2 mt-1 w-full">
                          <span className={cn(
                            "text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md",
                            t.priority === 'Urgent' ? "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400" :
                            t.priority === 'High' ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-450" :
                            t.priority === 'Medium' ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" :
                            "bg-slate-100 dark:bg-slate-800 text-slate-500"
                          )}>
                            {t.priority}
                          </span>

                          <span className={cn(
                            "text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md",
                            t.status === 'Resolved' || t.status === 'Closed' ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" :
                            t.status === 'In Progress' ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" :
                            t.status === 'Waiting for Employee' ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-450" :
                            "bg-slate-100 dark:bg-slate-800 text-slate-500"
                          )}>
                            {t.status}
                          </span>
                        </div>

                        {isSelected && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-r-full" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Split Screen Panel B: Conversation / Chat thread panel */}
            <div className={cn("flex-1 h-full flex flex-col min-h-0 bg-transparent dark:bg-transparent transition-all", selectedTicketId ? "flex" : "hidden md:flex items-center justify-center p-8")}>
              
              {!selectedTicketId ? (
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                    <HelpCircle className="w-8 h-8 text-slate-400" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">No Ticket Selected</h3>
                    <p className="text-[10px] text-slate-450 mt-1 max-w-xs mx-auto">Select a ticket from the left panel to view the details, conversations, and resolution steps.</p>
                  </div>
                </div>
              ) : !selectedTicketData ? (
                <div className="flex-1 flex justify-center items-center">
                  <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
                </div>
              ) : (
                <div className="flex-1 h-full flex flex-col min-h-0 relative">
                  
                  {/* Conversations Top bar header */}
                  <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <button 
                        onClick={() => setSelectedTicketId(null)} 
                        className="md:hidden p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-250 rounded-xl text-slate-500"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-mono font-black uppercase text-slate-450">{selectedTicketData.ticketNumber}</span>
                          <span className={cn(
                            "text-[8px] font-black uppercase px-2 py-0.5 rounded",
                            selectedTicketData.status === 'Resolved' || selectedTicketData.status === 'Closed' ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" :
                            selectedTicketData.status === 'In Progress' ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" :
                            selectedTicketData.status === 'Waiting for Employee' ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600" :
                            "bg-slate-100 dark:bg-slate-800 text-slate-500"
                          )}>
                            {selectedTicketData.status}
                          </span>
                          {selectedTicketData.escalated && (
                            <span className="text-[8px] bg-rose-500 text-white font-black uppercase px-2 py-0.5 rounded flex items-center gap-1">
                              <ShieldAlert className="w-2.5 h-2.5" /> Escalated
                            </span>
                          )}
                        </div>
                        <h2 className="text-xs font-black text-slate-950 dark:text-white uppercase mt-1 tracking-tight truncate max-w-[200px] xs:max-w-xs sm:max-w-md">{selectedTicketData.subject}</h2>
                      </div>
                    </div>

                    {/* HR Action Dropdowns (Restricted) */}
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-start sm:justify-end">
                      {/* HR / Agent Assignment */}
                      {isSupportStaff && (
                        <div className="relative">
                          <select
                            value={selectedTicketData.assignedTo || ''}
                            onChange={(e) => {
                              const email = e.target.value;
                              const name = hrAgents.find(a => a.email === email)?.fullName || 'Unassigned';
                              handleAssignTicket(email, name);
                            }}
                            className="bg-slate-100 dark:bg-slate-800 border-none outline-none font-bold text-slate-600 dark:text-slate-300 text-[9px] uppercase tracking-wider rounded-xl px-3 py-2 cursor-pointer"
                          >
                            <option value="">Assign Agent</option>
                            {hrAgents.map((agent, i) => (
                              <option key={i} value={agent.email}>{agent.fullName || agent.email}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Status Update Trigger */}
                      {isSupportStaff && (
                        <div>
                          <select
                            value={selectedTicketData.status}
                            onChange={(e) => handleUpdateStatus(e.target.value)}
                            className="bg-slate-150/70 dark:bg-slate-800 border-none outline-none font-bold text-slate-600 dark:text-slate-350 text-[9px] uppercase tracking-wider rounded-xl px-3 py-2 cursor-pointer"
                          >
                            <option value="Open">Set Open</option>
                            <option value="In Progress">Set In Progress</option>
                            <option value="Waiting for Employee">Set Waiting</option>
                            <option value="Resolved">Set Resolved</option>
                            <option value="Closed">Set Closed</option>
                          </select>
                        </div>
                      )}

                      {/* Escalate action */}
                      {isSupportStaff && !selectedTicketData.escalated && (
                        <button
                          onClick={() => {
                            const reason = prompt('Specify escalation reason:');
                            if (reason) handleEscalateTicket(reason);
                          }}
                          className="px-3 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 text-rose-500 rounded-xl text-[9px] font-black uppercase tracking-wider"
                        >
                          Escalate
                        </button>
                      )}

                      {/* Employee reopen button */}
                      {userRole === 'Employee' && ['Resolved', 'Closed'].includes(selectedTicketData.status) && (
                        <button
                          onClick={handleReopenTicket}
                          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                        >
                          Reopen Ticket
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Chat Conversation Thread */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-transparent dark:bg-transparent no-scrollbar">
                    
                    {/* Ticket description details box (The Original Post) */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-sm space-y-4 text-left">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs uppercase text-slate-500">
                            {selectedTicketData.employeeName.substring(0, 2)}
                          </div>
                          <div>
                            <span className="text-xs font-black text-slate-900 dark:text-white leading-none block">{selectedTicketData.employeeName}</span>
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{selectedTicketData.department} • Creator</span>
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold">{new Date(selectedTicketData.createdAt).toLocaleDateString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      <div className="text-xs text-slate-700 dark:text-slate-350 leading-relaxed whitespace-pre-wrap">
                        {selectedTicketData.description}
                      </div>

                      {/* Original Attachments */}
                      {selectedTicketData.attachments && selectedTicketData.attachments.length > 0 && (
                        <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3 flex flex-wrap gap-2">
                          {selectedTicketData.attachments.map((url: string, idx: number) => (
                            <a 
                              key={idx} 
                              href={url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-[10px] text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1.5"
                            >
                              <Paperclip className="w-3.5 h-3.5" />
                              <span>Attachment {idx + 1}</span>
                            </a>
                          ))}
                        </div>
                      )}

                      {/* HR Profile Change Request Approval Inline Panel */}
                      {isSupportStaff && selectedTicketData.subject.startsWith('Profile Update Request:') && targetEmployee && (
                        <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-3">
                          <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span className="text-[9px] font-black uppercase tracking-wider">HR Profile Approval Portal</span>
                          </div>
                          
                          <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                            <span className="text-[10px] font-black text-slate-850 dark:text-white uppercase block">
                              Verify &amp; Update Employee details in Database
                            </span>

                            {selectedTicketData.subject.includes('Personal Information') ? (
                              <div className="grid grid-cols-2 gap-3 text-left">
                                <div className="space-y-1">
                                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Full Name</label>
                                  <input type="text" value={editFullName} onChange={e => setEditFullName(e.target.value)} className="saas-input w-full px-2.5 py-1 text-xs" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Date of Birth</label>
                                  <input type="date" value={editDob} onChange={e => setEditDob(e.target.value)} className="saas-input w-full px-2.5 py-1 text-xs" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Gender</label>
                                  <select value={editGender} onChange={e => setEditGender(e.target.value)} className="saas-input w-full px-2.5 py-1 text-xs font-semibold">
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                  </select>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Blood Group</label>
                                  <input type="text" value={editBloodGroup} onChange={e => setEditBloodGroup(e.target.value)} className="saas-input w-full px-2.5 py-1 text-xs" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Marital Status</label>
                                  <select value={editMaritalStatus} onChange={e => setEditMaritalStatus(e.target.value)} className="saas-input w-full px-2.5 py-1 text-xs font-semibold">
                                    <option value="Single">Single</option>
                                    <option value="Married">Married</option>
                                    <option value="Divorced">Divorced</option>
                                  </select>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Nationality</label>
                                  <input type="text" value={editNationality} onChange={e => setEditNationality(e.target.value)} className="saas-input w-full px-2.5 py-1 text-xs" />
                                </div>
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 gap-3 text-left">
                                <div className="space-y-1">
                                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Bank Name</label>
                                  <input type="text" value={editBankName} onChange={e => setEditBankName(e.target.value)} className="saas-input w-full px-2.5 py-1 text-xs" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Account Number</label>
                                  <input type="text" value={editAccountNumber} onChange={e => setEditAccountNumber(e.target.value)} className="saas-input w-full px-2.5 py-1 text-xs" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">IFSC Code</label>
                                  <input type="text" value={editIfscCode} onChange={e => setEditIfscCode(e.target.value)} className="saas-input w-full px-2.5 py-1 text-xs" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">PAN Number</label>
                                  <input type="text" value={editPan} onChange={e => setEditPan(e.target.value)} className="saas-input w-full px-2.5 py-1 text-xs" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Aadhaar Number</label>
                                  <input type="text" value={editAadhaar} onChange={e => setEditAadhaar(e.target.value)} className="saas-input w-full px-2.5 py-1 text-xs" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">PF Number</label>
                                  <input type="text" value={editPf} onChange={e => setEditPf(e.target.value)} className="saas-input w-full px-2.5 py-1 text-xs" />
                                </div>
                              </div>
                            )}

                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-800">
                              <button
                                type="button"
                                disabled={updatingProfileDb}
                                onClick={() => handleApproveProfileChange(selectedTicketData.subject.includes('Bank'))}
                                className="px-4 py-2 bg-blue-650 hover:bg-blue-700 text-white rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                              >
                                {updatingProfileDb ? 'Saving...' : 'Approve & Save Changes'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Local AI Summary block for HR/Admin */}
                      {isSupportStaff && selectedTicketData.aiSummary && (
                        <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-2">
                          <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span className="text-[9px] font-black uppercase tracking-wider">AI Automated Synthesis</span>
                          </div>
                          <div className="p-3 bg-blue-50/20 dark:bg-blue-950/10 rounded-2xl border border-blue-100/30 dark:border-blue-900/20">
                            <p className="text-[11px] text-slate-600 dark:text-slate-300 italic">"{selectedTicketData.aiSummary}"</p>
                            {selectedTicketData.aiSuggestedResponse && (
                              <div className="mt-2.5 pt-2 border-t border-blue-100/30 dark:border-blue-900/10 space-y-1">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">AI Suggested Response Template:</span>
                                <p className="text-[10px] text-slate-500 leading-snug">{selectedTicketData.aiSuggestedResponse}</p>
                                <button 
                                  onClick={() => setNewComment(selectedTicketData.aiSuggestedResponse)}
                                  className="text-[9px] text-blue-600 dark:text-blue-400 font-black uppercase tracking-wider mt-1 hover:underline outline-none"
                                >
                                  Use Suggested Template
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Chat Comments Loop */}
                    {comments.map((comment, index) => {
                      const isOwner = comment.userId === profile.id || comment.userName === profile.name;
                      const dateStr = new Date(comment.createdAt).toLocaleDateString('en-US', { hour: '2-digit', minute: '2-digit' });
                      
                      return (
                        <div 
                          key={index} 
                          className={cn(
                            "flex flex-col gap-1 w-full text-left",
                            isOwner ? "items-end" : "items-start"
                          )}
                        >
                          <div className={cn(
                            "max-w-[85%] sm:max-w-md p-3.5 sm:p-4 rounded-3xl text-xs space-y-2 relative border shadow-sm",
                            comment.isInternal 
                              ? "bg-amber-50/70 border-amber-200 dark:bg-amber-955 dark:border-amber-900/50 text-amber-900 dark:text-amber-300"
                              : isOwner 
                                ? "bg-blue-600 text-white rounded-br-none border-blue-600 shadow-blue-500/5" 
                                : "bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-800 dark:text-slate-300 rounded-bl-none"
                          )}>
                            
                            {/* Comment Metadata */}
                            <div className="flex justify-between items-center gap-4 border-b border-white/10 dark:border-slate-800/80 pb-1.5">
                              <span className={cn(
                                "text-[9px] font-black uppercase tracking-wider",
                                comment.isInternal ? "text-amber-600 dark:text-amber-400" : isOwner ? "text-blue-100" : "text-slate-400"
                              )}>
                                {comment.isInternal ? 'Internal Note' : `${comment.userName} (${comment.userRole})`}
                              </span>
                              <span className={cn("text-[8.5px] opacity-70", isOwner ? "text-blue-100" : "text-slate-450")}>
                                {dateStr}
                              </span>
                            </div>

                            <p className="leading-relaxed whitespace-pre-wrap text-[11.5px]">{comment.comment}</p>

                            {/* Comment Attachments */}
                            {comment.attachments && comment.attachments.length > 0 && (
                              <div className="flex gap-1.5 flex-wrap pt-1.5 border-t border-white/10 dark:border-slate-800/80">
                                {comment.attachments.map((url: string, aIdx: number) => (
                                  <a 
                                    key={aIdx} 
                                    href={url} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className={cn(
                                      "px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer",
                                      isOwner ? "bg-blue-700 hover:bg-blue-800 text-white" : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-blue-650"
                                    )}
                                  >
                                    <Paperclip className="w-3 h-3" />
                                    <span>Attachment</span>
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Employee Rating Resolution box (When ticket is Resolved or Closed) */}
                    {['Resolved', 'Closed'].includes(selectedTicketData.status) && (
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-sm space-y-4 max-w-lg mx-auto text-center">
                        <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 text-amber-500 rounded-2xl flex items-center justify-center mx-auto">
                          <Star className="w-6 h-6 fill-current" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Ticket Resolution Review</h4>
                          <p className="text-[10px] text-slate-450 mt-1">Please rate the support quality and speed of resolution to help us improve our desk operations.</p>
                        </div>

                        {selectedTicketData.rating ? (
                          <div className="space-y-2">
                            <div className="flex gap-1 justify-center text-amber-500">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star key={s} className={cn("w-5 h-5", s <= selectedTicketData.rating ? "fill-current" : "opacity-30")} />
                              ))}
                            </div>
                            {selectedTicketData.feedback && (
                              <p className="text-[11px] text-slate-500 italic">"{selectedTicketData.feedback}"</p>
                            )}
                          </div>
                        ) : userRole === 'Employee' && !ratingSubmitted ? (
                          <div className="space-y-4 pt-2">
                            <div className="flex gap-2 justify-center">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => setRatingValue(s)}
                                  className="outline-none hover:scale-110 active:scale-95 transition-transform"
                                >
                                  <Star className={cn("w-6 h-6", s <= ratingValue ? "text-amber-500 fill-current" : "text-slate-300 dark:text-slate-700")} />
                                </button>
                              ))}
                            </div>
                            <input 
                              type="text" 
                              placeholder="Write a brief comment (optional)..."
                              value={ratingFeedback}
                              onChange={(e) => setRatingFeedback(e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-2xl text-[11px] outline-none dark:text-white"
                            />
                            <button
                              onClick={handleSubmitRating}
                              className="px-5 py-2.5 bg-blue-650 hover:bg-blue-755 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all"
                            >
                              Submit Rating
                            </button>
                          </div>
                        ) : (
                          <p className="text-[10px] text-slate-450 italic">Waiting for employee review rating...</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Message Input compose box (Only when ticket is NOT Closed) */}
                  {selectedTicketData.status !== 'Closed' && (
                    <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                      <form onSubmit={handleSubmitComment} className="flex flex-col gap-2.5">
                        <div className="flex items-center gap-3">
                          <input 
                            type="text" 
                            placeholder="Type support reply or follow-up note..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-2xl text-xs dark:text-white outline-none focus:border-blue-500 transition-colors"
                          />
                          <button 
                            type="submit"
                            className="w-11 h-11 bg-blue-650 hover:bg-blue-755 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20 active:scale-95 transition-all"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Input controls (attachment and internal toggle) */}
                        <div className="flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center px-1">
                          <div className="flex flex-wrap items-center gap-4">
                            <label className="cursor-pointer text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 flex items-center gap-1.5 transition-colors">
                              <Paperclip className="w-4 h-4" />
                              <span className="text-[9px] font-black uppercase tracking-wider">Attach File</span>
                              <input 
                                type="file" 
                                onChange={(e) => handleFileUpload(e, true)} 
                                className="hidden" 
                              />
                            </label>
                            {commentAttachment && (
                              <span className="text-[10px] text-emerald-500 font-bold truncate max-w-xs">{commentAttachment.split('/').pop()}</span>
                            )}
                          </div>

                          {/* Internal note switch (HR / Admin only) */}
                          {isSupportStaff && (
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input 
                                type="checkbox"
                                checked={isCommentInternal}
                                onChange={(e) => setIsCommentInternal(e.target.checked)}
                                className="w-3.5 h-3.5 accent-amber-500 border border-slate-300 dark:border-slate-700 rounded focus:ring-0 outline-none"
                              />
                              <span className="text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest flex items-center gap-1">
                                <Lock className="w-2.5 h-2.5" /> Internal Note
                              </span>
                            </label>
                          )}
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. CONFIGURE CATEGORIES & SETTINGS (ADMIN ONLY) */}
        {activeTab === 'categories-settings' && can('settings.company') && (
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto max-w-3xl mx-auto w-full space-y-6">
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-8 rounded-3xl border border-slate-200/50 dark:border-slate-800 shadow-sm space-y-6">
              <div>
                <h2 className="text-base font-black text-slate-950 dark:text-white uppercase tracking-tight">Configure Categories</h2>
                <p className="text-[10px] text-slate-450 mt-1">Add or remove support request categories available to employees.</p>
              </div>

              {/* Add category form */}
              <div className="flex items-center gap-3">
                <input 
                  type="text" 
                  placeholder="E.g., Medical Reimbursement Issue"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="flex-1 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-2xl text-xs dark:text-white outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleAddCategory}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all shadow-md shadow-blue-500/10 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>

              {/* Categories list */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {categoriesList.map((cat, i) => (
                  <div key={i} className="flex justify-between items-center p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/40 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{cat}</span>
                    <button 
                      onClick={() => handleDeleteCategory(cat)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 sm:p-8 rounded-3xl border border-slate-200/50 dark:border-slate-800 shadow-sm space-y-4">
              <div>
                <h2 className="text-base font-black text-slate-950 dark:text-white uppercase tracking-tight font-sans">Ticketing Rules</h2>
                <p className="text-[10px] text-slate-450 mt-1">Define systemic settings for helpdesk workflows.</p>
              </div>
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Auto SLA Tracking</h4>
                    <p className="text-[9px] text-slate-450 mt-0.5">Enforce SLA breaches when a ticket is not resolved within 24 hours.</p>
                  </div>
                  <div className="w-10 h-6 bg-blue-600 rounded-full p-1 cursor-pointer flex items-center justify-end">
                    <div className="w-4 h-4 bg-white rounded-full" />
                  </div>
                </div>

                <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">AI Ticket Classifications</h4>
                    <p className="text-[9px] text-slate-450 mt-0.5">Enable real-time AI assistant keyword suggestions for categorizing incoming issues.</p>
                  </div>
                  <div className="w-10 h-6 bg-blue-600 rounded-full p-1 cursor-pointer flex items-center justify-end">
                    <div className="w-4 h-4 bg-white rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. REPORTS EXPORT PAGE (ADMIN ONLY) */}
        {activeTab === 'reports' && userRole === 'Admin' && (
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto max-w-4xl mx-auto w-full space-y-6">
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-8 rounded-3xl border border-slate-200/50 dark:border-slate-800 shadow-sm space-y-6">
              <div>
                <h2 className="text-base font-black text-slate-950 dark:text-white uppercase tracking-tight">Export Help Desk Reports</h2>
                <p className="text-[10px] text-slate-450 mt-1">Download consolidated ticketing, performance, assignment, and SLA logs.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => handleExportReports('csv')}
                  className="p-6 bg-slate-50 dark:bg-slate-800/50 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 border border-slate-200/60 dark:border-slate-800 hover:border-blue-500 rounded-3xl text-left transition-all space-y-3 cursor-pointer group"
                >
                  <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-2xl flex items-center justify-center">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Export to CSV</h4>
                    <p className="text-[9.5px] text-slate-450 mt-1">Download raw spreadsheet values suited for analytics software.</p>
                  </div>
                </button>

                <button
                  onClick={() => handleExportReports('excel')}
                  className="p-6 bg-slate-50 dark:bg-slate-800/50 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 border border-slate-200/60 dark:border-slate-800 hover:border-blue-500 rounded-3xl text-left transition-all space-y-3 cursor-pointer group"
                >
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Export to Excel</h4>
                    <p className="text-[9.5px] text-slate-450 mt-1">Download formatted workbook spreadsheet files.</p>
                  </div>
                </button>

                <button
                  onClick={() => handleExportReports('pdf')}
                  className="p-6 bg-slate-50 dark:bg-slate-800/50 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 border border-slate-200/60 dark:border-slate-800 hover:border-blue-500 rounded-3xl text-left transition-all space-y-3 cursor-pointer group"
                >
                  <div className="w-10 h-10 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-2xl flex items-center justify-center">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Export PDF Report</h4>
                    <p className="text-[9.5px] text-slate-450 mt-1">Generate a styled, print-friendly system report sheet.</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
