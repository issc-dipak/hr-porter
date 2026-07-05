"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Plus, Sparkles, Send, X, Target, Clipboard, ShieldAlert,
  Award as RibbonIcon, BarChart3, UserCheck, FileText, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";
import { useUIStore } from '@/store/uiStore';

// Tab components imports
import { DashboardTab } from './performance/tabs/DashboardTab';
import { EmployeesTab } from './performance/tabs/EmployeesTab';
import { HrSLATab } from './performance/tabs/HrSLATab';
import { KpisTab } from './performance/tabs/KpisTab';
import { PipTab } from './performance/tabs/PipTab';
import { ReportsBuilderTab } from './performance/tabs/ReportsBuilderTab';
import { useAuthStore } from '@/store/authStore';
import { HrDashboard } from './performance/tabs/HrDashboard';
import { AdminDashboard } from './performance/tabs/AdminDashboard';
import ConfirmModal from '@/app/components/ConfirmModal';

export default function PerformancePage() {
  const { userRole } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'employees' | 'hr' | 'kpis' | 'pip' | 'reports'>('dashboard');
  const [isClient, setIsClient] = useState(false);
  const setShowToast = (msg: string | null) => {
    if (msg) {
      useUIStore.getState().triggerToast(msg);
    }
  };

  // Core Management States
  const [reviewsData, setReviewsData] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [kpis, setKpis] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [realtimeLogs, setRealtimeLogs] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Real computed dashboard stats
  const [dashboardStats, setDashboardStats] = useState({
    productivityIndex: 0,
    totalEmployees: 0,
    topDept: 'N/A',
    kpiCompletion: 0,
    completedGoalsCount: 0
  });

  // Real recruitment funnel from jobs/applicants
  const [recruitmentFunnel, setRecruitmentFunnel] = useState<any[]>([]);

  // Real SLA metrics computed from backend data
  const [slaMetrics, setSlaMetrics] = useState({
    hiringSuccess: 'N/A',
    payrollSpeed: '0.0 hrs',
    leaveApproval: 'N/A',
    conversionRate: 'N/A'
  });

  // Real chart data computed from attendance/tasks by month
  const [chartData, setChartData] = useState<any[]>([]);
  const [payrollData, setPayrollData] = useState<any[]>([]);

  // Goals History Filter States
  const [goalSearchQuery, setGoalSearchQuery] = useState('');
  const [goalDeptFilter, setGoalDeptFilter] = useState('All');
  const [goalStatusFilter, setGoalStatusFilter] = useState('All');

  // PIP States
  const [pips, setPips] = useState<any[]>([]);

  // Form Modals States
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isKpiModalOpen, setIsKpiModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isPipModalOpen, setIsPipModalOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);

  // New Forms State
  const [newGoal, setNewGoal] = useState({ title: '', assignee: '', dept: 'Engineering', deadline: '', progress: 0 });
  const [newKpi, setNewKpi] = useState({ title: '', dept: 'Engineering', target: '90%', current: '0%', period: 'Monthly', score: 0 });
  const [newReview, setNewReview] = useState({ name: '', dept: 'Engineering', rating: 4.5, status: 'Meets Expectations', goals: '8/10', feedback: '', recommendation: 'Retain' });
  const [newPip, setNewPip] = useState({ name: '', issue: '', targets: '', timeline: '30 Days', coach: '' });



  // Reports Generation States
  const [reportScope, setReportScope] = useState('Company Performance');
  const [reportFormat, setReportFormat] = useState('CSV');
  const [reportPreviewData, setReportPreviewData] = useState<any>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const fetchReportPreview = async (scope: string) => {
    setIsLoadingPreview(true);
    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`/api/performance/reports/preview?scope=${encodeURIComponent(scope)}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setReportPreviewData(data);
      }
    } catch (err) {
      console.error('Failed to fetch report preview:', err);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  useEffect(() => {
    if (isClient) {
      fetchReportPreview(reportScope);
    }
  }, [reportScope, isClient]);

  // Database Employee list state
  const [employeesList, setEmployeesList] = useState<any[]>([]);

  useEffect(() => {
    setIsClient(true);
    fetchAllDashboardData();
  }, []);

  const fetchAllDashboardData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // 1. Fetch reviews
      const reviewsRes = await fetch('/api/performance', { headers });
      let reviews: any[] = [];
      if (reviewsRes.ok) {
        reviews = await reviewsRes.json();
        setReviewsData(reviews);
      }

      // 2. Fetch tasks/goals
      const tasksRes = await fetch('/api/tasks', { headers });
      let tasks: any[] = [];
      if (tasksRes.ok) {
        tasks = await tasksRes.json();
        const mappedGoals = tasks.map((t: any) => ({
          id: t._id,
          title: t.title,
          assignee: t.assignedTo,
          dept: t.dept || 'Engineering',
          progress: t.completionPercent || 0,
          status: t.status === 'Done' ? 'Completed' : t.status === 'To Do' ? 'Pending' : 'In Progress',
          deadline: t.due,
          completedAt: t.completedAt
        }));
        setGoals(mappedGoals);
      }

      // 3. Fetch attendance to calculate real rates
      const attendanceRes = await fetch('/api/attendance', { headers });
      let attendance: any[] = [];
      if (attendanceRes.ok) {
        attendance = await attendanceRes.json();
      }

      // 4. Fetch employees
      let mappedEmployees: any[] = [];
      const empRes = await fetch('/api/employees', { headers });
      if (empRes.ok) {
        const list = await empRes.json();
        setEmployeesList(list);

        if (list.length > 0) {
          mappedEmployees = list.map((emp: any) => {
            const empReviews = reviews.filter((r: any) => r.name.toLowerCase() === emp.fullName.toLowerCase());
            const avgRating = empReviews.length > 0
              ? empReviews.reduce((sum: number, r: any) => sum + Number(r.rating || 0), 0) / empReviews.length
              : 0;

            const score = avgRating > 0 ? Math.round(avgRating * 20) : 0;
            const ratingStatus = score === 0 
              ? 'No Reviews' 
              : score >= 90 ? 'Top Performer' : score >= 80 ? 'Exceeds Expectations' : score >= 70 ? 'Meets Expectations' : 'Needs Improvement';

            const empTasks = tasks.filter((t: any) => t.assignedTo && t.assignedTo.toLowerCase() === emp.fullName.toLowerCase());
            const completedTasks = empTasks.filter((t: any) => t.status === 'Done').length;
            const totalTasks = empTasks.length;
            const taskStr = totalTasks > 0 ? `${completedTasks}/${totalTasks}` : '0/0';
            const kpiVal = totalTasks > 0 ? `${Math.round((completedTasks / totalTasks) * 100)}%` : score > 0 ? `${score}%` : '0%';

            const empAttendance = attendance.filter((a: any) => a.employee && a.employee.toLowerCase() === emp.fullName.toLowerCase());
            const presentCount = empAttendance.filter((a: any) => a.status === 'Present').length;
            const attendanceRate = empAttendance.length > 0
              ? Math.round((presentCount / empAttendance.length) * 100)
              : 0;

            return {
              id: emp._id,
              name: emp.fullName,
              dept: emp.department || 'Engineering',
              role: emp.role || 'Employee',
              score,
              attendance: attendanceRate,
              tasks: taskStr,
              kpis: kpiVal,
              status: ratingStatus,
              promotionReady: score >= 90,
              risk: score === 0 ? 'No Rating' : score < 70 ? 'High' : score < 85 ? 'Medium' : 'Low',
              joinedDate: emp.joinedDate || emp.createdAt,
              employeeStatus: emp.status || 'Active',
              updatedAt: emp.updatedAt || emp.createdAt,
              documents: emp.documents || []
            };
          });
          
          // Exclude Admin, Super Admin, and Company Admin roles from performance monitoring
          mappedEmployees = mappedEmployees.filter((emp: any) => {
            const isExcludedRole = ['admin', 'super admin', 'company admin'].includes(emp.role?.toLowerCase());
            return !isExcludedRole;
          });
          
          setEmployees(mappedEmployees);
        }
      }

      // 5. Fetch audit logs
      const auditRes = await fetch('/api/auditlogs', { headers });
      if (auditRes.ok) {
        const logs = await auditRes.json();
        if (logs.length > 0) {
          const mappedLogs = logs.map((l: any) => ({
            id: l._id,
            action: l.action,
            actor: l.performedBy,
            target: l.details,
            timestamp: new Date(l.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
            ip: l.ipAddress || '127.0.0.1'
          }));
          setAuditLogs(mappedLogs);
        }
      }

      // 6. Fetch jobs to compute real recruitment funnel
      const jobsRes = await fetch('/api/jobs', { headers });
      let jobs: any[] = [];
      if (jobsRes.ok) {
        jobs = await jobsRes.json();
      }

      // 7. Fetch leaves to compute real SLA metrics
      const leavesRes = await fetch('/api/leaves', { headers });
      let leaves: any[] = [];
      if (leavesRes.ok) {
        leaves = await leavesRes.json();
      }

      // 8. Fetch payroll records for dashboard calculations
      const payrollRes = await fetch('/api/payroll', { headers });
      if (payrollRes.ok) {
        const payrollList = await payrollRes.json();
        setPayrollData(payrollList);
      }

      // --- Compute Dashboard Stats from real data ---
      const totalEmployees = mappedEmployees.length;
      const avgScore = totalEmployees > 0
        ? Math.round(mappedEmployees.reduce((sum: number, e: any) => sum + e.score, 0) / totalEmployees)
        : 0;

      // Department with highest avg score
      const deptScores: Record<string, { total: number; count: number }> = {};
      mappedEmployees.forEach((e: any) => {
        if (!deptScores[e.dept]) deptScores[e.dept] = { total: 0, count: 0 };
        deptScores[e.dept].total += e.score;
        deptScores[e.dept].count++;
      });
      let topDeptName = 'N/A';
      let topDeptAvg = 0;
      Object.entries(deptScores).forEach(([dept, { total, count }]) => {
        const avg = total / count;
        if (avg > topDeptAvg) { topDeptAvg = avg; topDeptName = dept; }
      });

      // KPI completion = % of tasks that are Done
      const totalTasks = tasks.length;
      const doneTasks = tasks.filter((t: any) => t.status === 'Done').length;
      const kpiCompletion = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
      const completedGoalsCount = doneTasks;

      setDashboardStats({ productivityIndex: avgScore, totalEmployees, topDept: topDeptName, kpiCompletion, completedGoalsCount });

      // --- Compute Recruitment Funnel from jobs data ---
      const totalApplied = jobs.reduce((sum: number, j: any) => sum + (j.applicants?.length || 0), 0);
      const totalScreened = jobs.reduce((sum: number, j: any) => sum + (j.applicants?.filter((a: any) => ['Screening', 'Interview', 'Offer', 'Hired'].includes(a.status)).length || 0), 0);
      const totalInterviewed = jobs.reduce((sum: number, j: any) => sum + (j.applicants?.filter((a: any) => ['Interview', 'Offer', 'Hired'].includes(a.status)).length || 0), 0);
      const totalHired = jobs.reduce((sum: number, j: any) => sum + (j.applicants?.filter((a: any) => a.status === 'Hired').length || 0), 0);

      setRecruitmentFunnel([
        { name: 'Applied', candidates: totalApplied, fill: '#64748B' },
        { name: 'Screened', candidates: totalScreened, fill: '#3B82F6' },
        { name: 'Interviewed', candidates: totalInterviewed, fill: '#6366F1' },
        { name: 'Hired', candidates: totalHired, fill: '#10B981' }
      ]);

      // --- Compute SLA Metrics from real data ---
      const conversionRate = totalApplied > 0 ? ((totalHired / totalApplied) * 100).toFixed(1) + '%' : 'N/A';
      const hiringSuccess = jobs.length > 0 ? ((jobs.filter((j: any) => j.status === 'Closed' || totalHired > 0).length / Math.max(jobs.length, 1)) * 100).toFixed(0) + '%' : 'N/A';

      // Leave approval latency: avg time from createdAt to updatedAt for approved leaves
      const approvedLeaves = leaves.filter((l: any) => l.status === 'Approved' && l.createdAt && l.updatedAt);
      let avgLeaveHrs = 'N/A';
      if (approvedLeaves.length > 0) {
        const totalMs = approvedLeaves.reduce((sum: number, l: any) => {
          return sum + (new Date(l.updatedAt).getTime() - new Date(l.createdAt).getTime());
        }, 0);
        const avgMs = totalMs / approvedLeaves.length;
        const avgHrs = avgMs / (1000 * 60 * 60);
        avgLeaveHrs = avgHrs.toFixed(1) + ' hrs';
      }

      setSlaMetrics({
        hiringSuccess,
        payrollSpeed: '0.0 hrs',
        leaveApproval: avgLeaveHrs,
        conversionRate
      });

      // --- Compute monthly chart data from attendance ---
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const now = new Date();
      const monthlyMap: Record<string, { present: number; total: number }> = {};
      attendance.forEach((a: any) => {
        if (!a.date) return;
        const d = new Date(a.date);
        const key = monthNames[d.getMonth()];
        if (!monthlyMap[key]) monthlyMap[key] = { present: 0, total: 0 };
        monthlyMap[key].total++;
        if (a.status === 'Present') monthlyMap[key].present++;
      });

      // Build last 5 months
      const last5Months = Array.from({ length: 5 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (4 - i), 1);
        return monthNames[d.getMonth()];
      });

      const computedChart = last5Months.map(month => {
        const m = monthlyMap[month];
        const attendanceScore = m && m.total > 0 ? Math.round((m.present / m.total) * 100) : 0;
        // Productivity: average employee score for that month (use overall avg as proxy)
        return { name: month, Productivity: avgScore || 0, Attendance: attendanceScore };
      });

      setChartData(computedChart.length > 0 ? computedChart : []);
      fetchReportPreview(reportScope);
    } catch (err) {
      console.error('Failed to orchestrate dashboard data fetching:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const finalEmployeesList = useMemo(() => {
    return employeesList;
  }, [employeesList]);

  const addNotification = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(null), 3000);
  };

  // Add / Create handlers
  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();

    const selectedEmp = finalEmployeesList.find(emp => emp.fullName === newGoal.assignee);
    const assigneeEmail = selectedEmp?.email || 'emp@hr.com';

    try {
      const payload = {
        title: newGoal.title,
        assignee: newGoal.assignee,
        assigneeEmail,
        dept: newGoal.dept,
        deadline: newGoal.deadline
      };

      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/performance/goal', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        fetchAllDashboardData();
        addNotification(`Goal successfully assigned to ${newGoal.assignee} & email notification sent!`);
      } else {
        const err = await res.json();
        addNotification(`Error: ${err.error || 'Failed to assign goal'}`);
      }
    } catch (err) {
      console.error('Failed to assign performance goal:', err);
      addNotification('Server error while sending assignment');
    }

    setIsGoalModalOpen(false);
    setNewGoal({ title: '', assignee: '', dept: 'Engineering', deadline: '', progress: 0 });
  };

  const handleAddKpi = (e: React.FormEvent) => {
    e.preventDefault();
    const kpi = {
      id: String(kpis.length + 1),
      ...newKpi,
      trend: '+1%',
      status: 'On Track'
    };
    setKpis(prev => [kpi, ...prev]);
    setIsKpiModalOpen(false);
    addNotification(`New KPI "${newKpi.title}" registered in system`);
    setNewKpi({ title: '', dept: 'Engineering', target: '90%', current: '0%', period: 'Monthly', score: 0 });
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: newReview.name,
        dept: newReview.dept,
        rating: Number(newReview.rating),
        status: newReview.status,
        goals: newReview.goals,
        lastReview: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      };
      
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/performance', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        fetchAllDashboardData();
        addNotification(`Formal appraisal review saved for ${newReview.name}`);
      }
    } catch (err) {
      console.error('Failed to create performance review:', err);
    }
    setIsReviewModalOpen(false);
    setNewReview({ name: '', dept: 'Engineering', rating: 4.5, status: 'Meets Expectations', goals: '8/10', feedback: '', recommendation: 'Retain' });
  };

  const handleAddPip = (e: React.FormEvent) => {
    e.preventDefault();
    const pipObj = {
      id: String(pips.length + 1),
      name: newPip.name,
      issue: newPip.issue,
      targets: newPip.targets,
      timeline: newPip.timeline,
      progress: 10,
      coach: newPip.coach,
      status: 'Active Monitoring'
    };
    setPips(prev => [pipObj, ...prev]);
    
    // Add warning audit log
    const auditObj = {
      id: String(auditLogs.length + 1),
      action: 'Initiated PIP Plan',
      actor: 'Admin (System)',
      target: newPip.name,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      ip: '192.168.1.12'
    };
    setAuditLogs(prev => [auditObj, ...prev]);

    setIsPipModalOpen(false);
    addNotification(`PIP active coaching initiated for ${newPip.name}`);
    setNewPip({ name: '', issue: '', targets: '', timeline: '30 Days', coach: '' });
  };

  const handleDeleteReview = (id: string) => {
    setReviewToDelete(id);
  };

  const handleConfirmDeleteReview = async () => {
    if (!reviewToDelete) return;
    const id = reviewToDelete;
    setReviewToDelete(null);
    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`/api/performance/${id}`, { 
        method: 'DELETE',
        headers
      });
      if (res.ok) {
        fetchAllDashboardData();
        addNotification('Appraisal record deleted successfully');
      }
    } catch (err) {
      console.error('Failed to delete performance review:', err);
    }
  };

  // Export Custom Reports
  const handleTriggerReport = () => {
    if (!reportPreviewData || !reportPreviewData.tableData) {
      addNotification("Report data is still loading. Please try again in a moment.");
      return;
    }

    // Save report to database logs
    fetch('/api/performance/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scope: reportScope,
        format: reportFormat,
        generatedBy: 'HR Analytics Lead',
        previewData: reportPreviewData
      })
    }).catch(err => console.error('Failed to save report log to database:', err));

    if (reportFormat === 'CSV') {
      let content = "";
      if (reportScope === 'Company Performance') {
        content = "Department,Productivity Index,Attendance Score,Task Completion,Budget Util%\n" +
          reportPreviewData.tableData.map((d: any) => `"${d.name}",${d.Productivity}%,${d.Attendance}%,${d.TaskFulfillment}%,${d.BudgetUtil}%`).join("\n");
      } else if (reportScope === 'Employee Grid Metrics') {
        content = "Name,Department,Score,Attendance,Status\n" +
          reportPreviewData.tableData.map((e: any) => `"${e.name}","${e.dept}",${e.score}%,${e.attendance}%,"${e.status}"`).join("\n");
      } else {
        content = "Metric,Target SLA,Actual SLA,Status\n" +
          reportPreviewData.tableData.map((row: any) => `"${row.category}","${row.target}","${row.actual}","${row.status}"`).join("\n");
      }
      const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Executive_${reportScope.replace(/\s+/g, '_')}_Report.csv`);
      link.click();
      addNotification(`${reportScope} exported successfully as CSV!`);
    } else {
      // PDF / Print layout
      const printWindow = window.open('', '_blank', 'width=1000,height=800');
      if (!printWindow) {
        addNotification("Popup blocked! Please allow popups to download PDF.");
        return;
      }

      // Generate HTML report content
      let reportTableHTML = "";
      let summaryCardsHTML = "";

      if (reportScope === 'Company Performance') {
        const summary = reportPreviewData.summary;
        const avgProd = summary.find((s: any) => s.label === 'Avg Productivity')?.value || '91%';
        const avgAtt = summary.find((s: any) => s.label === 'Avg Attendance')?.value || '94%';
        const deptCount = summary.find((s: any) => s.label === 'Departments')?.value || 6;
        
        summaryCardsHTML = `
          <div class="summary-card">
            <h4>AVERAGE PRODUCTIVITY</h4>
            <div class="value">${avgProd}</div>
            <div class="trend green">Optimal Performance</div>
          </div>
          <div class="summary-card">
            <h4>AVERAGE ATTENDANCE</h4>
            <div class="value">${avgAtt}</div>
            <div class="trend green">On Track</div>
          </div>
          <div class="summary-card">
            <h4>TOTAL DEPARTMENTS</h4>
            <div class="value">${deptCount}</div>
            <div class="trend">Audited & Verified</div>
          </div>
        `;

        reportTableHTML = `
          <table>
            <thead>
              <tr>
                <th>DEPARTMENT</th>
                <th style="text-align: right;">PRODUCTIVITY INDEX</th>
                <th style="text-align: right;">ATTENDANCE RATE</th>
                <th style="text-align: right;">TASK FULFILLMENT</th>
                <th style="text-align: right;">BUDGET UTILIZATION</th>
              </tr>
            </thead>
            <tbody>
              ${reportPreviewData.tableData.map((d: any) => `
                <tr>
                  <td><strong>${d.name}</strong></td>
                  <td style="text-align: right;">${d.Productivity}%</td>
                  <td style="text-align: right;">${d.Attendance}%</td>
                  <td style="text-align: right;">${d.TaskFulfillment}%</td>
                  <td style="text-align: right;">${d.BudgetUtil}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
      } else if (reportScope === 'Employee Grid Metrics') {
        const summary = reportPreviewData.summary;
        const avgScore = summary.find((s: any) => s.label === 'Avg Score')?.value || '83.5%';
        const topPerformerCount = summary.find((s: any) => s.label === 'Top Performers')?.value || '3 Employees';
        const totalMonitored = summary.find((s: any) => s.label === 'Active Monitored')?.value || reportPreviewData.tableData.length;

        summaryCardsHTML = `
          <div class="summary-card">
            <h4>AVERAGE RATING SCORE</h4>
            <div class="value">${avgScore}</div>
            <div class="trend green">Grade A Average</div>
          </div>
          <div class="summary-card">
            <h4>TOP PERFORMERS</h4>
            <div class="value">${topPerformerCount}</div>
            <div class="trend green">Eligible for Promotion</div>
          </div>
          <div class="summary-card">
            <h4>TOTAL ACTIVE STAFF</h4>
            <div class="value">${totalMonitored}</div>
            <div class="trend">Monitored</div>
          </div>
        `;

        reportTableHTML = `
          <table>
            <thead>
              <tr>
                <th>EMPLOYEE NAME</th>
                <th>DEPARTMENT</th>
                <th style="text-align: right;">PERFORMANCE RATING</th>
                <th style="text-align: right;">ATTENDANCE RATE</th>
                <th>PERFORMANCE STATUS</th>
              </tr>
            </thead>
            <tbody>
              ${reportPreviewData.tableData.map((e: any) => `
                <tr>
                  <td><strong>${e.name}</strong></td>
                  <td>${e.dept}</td>
                  <td style="text-align: right; font-weight: bold;">${e.score}%</td>
                  <td style="text-align: right;">${e.attendance}%</td>
                  <td><span class="status-badge ${e.status === 'Top Performer' ? 'top-perf' : e.status === 'Needs Improvement' ? 'needs-imp' : 'meets-exp'}">${e.status}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
      } else {
        // HR SLA Metrics
        const summary = reportPreviewData.summary;
        const hiringSuccess = summary.find((s: any) => s.label === 'Hiring Success')?.value || '94%';
        const payrollSpeed = summary.find((s: any) => s.label === 'Payroll Compliant')?.value || '98.5%';
        const responseTime = summary.find((s: any) => s.label === 'Response SLA')?.value || '1.8 Hrs';

        summaryCardsHTML = `
          <div class="summary-card">
            <h4>HIRING SUCCESS</h4>
            <div class="value">${hiringSuccess}</div>
            <div class="trend green">Optimal</div>
          </div>
          <div class="summary-card">
            <h4>PAYROLL AUDIT STATUS</h4>
            <div class="value">${payrollSpeed}</div>
            <div class="trend green">SLA Compliant</div>
          </div>
          <div class="summary-card">
            <h4>RESPONSE LATENCY</h4>
            <div class="value">${responseTime}</div>
            <div class="trend green">Optimal</div>
          </div>
        `;

        reportTableHTML = `
          <table>
            <thead>
              <tr>
                <th>KPI SERVICE CATEGORY</th>
                <th style="text-align: right;">TARGET SLA</th>
                <th style="text-align: right;">ACTUAL PERFORMANCE</th>
                <th>STATUS CLASS</th>
              </tr>
            </thead>
            <tbody>
              ${reportPreviewData.tableData.map((row: any) => `
                <tr>
                  <td><strong>${row.category}</strong></td>
                  <td style="text-align: right;">${row.target}</td>
                  <td style="text-align: right; color: ${row.status === 'OPTIMAL' ? '#10b981' : '#f59e0b'}; font-weight: bold;">${row.actual}</td>
                  <td><span class="status-badge ${row.status === 'OPTIMAL' ? 'top-perf' : 'meets-exp'}">${row.status}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
      }

      printWindow.document.write(`
        <html>
          <head>
            <title>Executive ${reportScope} Report</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap');
              body { font-family: 'Outfit', sans-serif; color: #0f172a; background-color: #ffffff; margin: 0; padding: 40px; line-height: 1.5; }
              .header-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; border-bottom: 2px solid #0f172a; padding-bottom: 20px; }
              .header-title { font-size: 20px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; margin: 0; }
              .header-meta { text-align: right; font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #64748b; }
              .summary-container { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 45px; }
              .summary-card { background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 16px; }
              .summary-card h4 { font-size: 8px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; margin: 0 0 8px 0; }
              .summary-card .value { font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 4px 0; }
              .summary-card .trend { font-size: 8px; font-weight: 600; text-transform: uppercase; color: #64748b; }
              .summary-card .trend.green { color: #10b981; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 45px; font-size: 10px; }
              th { background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #64748b; text-align: left; }
              td { padding: 12px; border-bottom: 1px solid #f1f5f9; color: #334155; }
              .status-badge { font-size: 8px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; padding: 3px 8px; border-radius: 6px; display: inline-block; }
              .status-badge.top-perf { background-color: #e6fdf5; color: #10b981; }
              .status-badge.meets-exp { background-color: #eff6ff; color: #3b82f6; }
              .status-badge.needs-imp { background-color: #fff1f2; color: #f43f5e; }
              .signatures-container { width: 100%; border-collapse: collapse; margin-top: 60px; margin-bottom: 40px; }
              .signatures-container td { border: none; width: 50%; padding: 0 20px; }
              .signature-line { border-top: 1px solid #e2e8f0; padding-top: 10px; text-align: center; font-size: 8px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; }
              .footer { text-align: center; font-size: 7px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px; }
            </style>
          </head>
          <body>
            <table class="header-table">
              <tr>
                <td>
                  <h1 class="header-title">HR Core Systems Inc.</h1>
                  <div style="font-size: 8px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #64748b; margin-top: 4px;">
                    Performance Management Division
                  </div>
                  <div style="margin-top: 10px; display: inline-block; background-color: #fff1f2; border: 1px solid #ffe4e6; color: #f43f5e; font-size: 8px; font-weight: 850; letter-spacing: 1.5px; text-transform: uppercase; padding: 4px 8px; border-radius: 4px;">
                    STRICTLY CONFIDENTIAL
                  </div>
                </td>
                <td class="header-meta">
                  <div><strong>Document:</strong> Executive Review Plan</div>
                  <div><strong>Scope:</strong> ${reportScope}</div>
                  <div><strong>Date Generated:</strong> ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                </td>
              </tr>
            </table>

            <div class="summary-container">${summaryCardsHTML}</div>
            ${reportTableHTML}
            <table class="signatures-container">
              <tr>
                <td><div class="signature-line">Prepared By: HR Analytics Lead</div></td>
                <td><div class="signature-line">Approved By: Chief Human Resources Officer</div></td>
              </tr>
            </table>
            <div class="footer">This report is generated dynamically by HR Core Systems Performance Management Module. Authorization required for distribution.</div>
            <script>window.onload = function() { setTimeout(window.print, 150); };</script>
          </body>
        </html>
      `);

      printWindow.document.close();
      addNotification(`Executive ${reportScope} PDF report initialized.`);
    }
  };

  // Filtered appraisals
  const filteredAppraisals = useMemo(() => {
    return reviewsData.filter(r => 
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      r.dept.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [reviewsData, searchTerm]);

  return (
    <div className="p-5 lg:p-6 max-w-7xl mx-auto space-y-6 min-h-screen text-left relative font-sans">
      
      {/* Main Header Area */}
      <div className="flex flex-col gap-4 pb-4 border-b border-slate-200 dark:border-slate-800 text-left w-full print:hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 w-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0 shadow-sm border border-blue-500/10">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">
                Executive Performance Portal
              </h1>
              <p className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mt-1.5 leading-none">
                Appraisals & Coaching Plans
              </p>
            </div>
          </div>
 
          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={() => setIsReviewModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:scale-[1.02] transition-all active:scale-95 cursor-pointer border border-transparent"
            >
              <Plus className="w-3.5 h-3.5" /> Log Formal Appraisals
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-3xl break-words whitespace-normal leading-relaxed">
          Enterprise-grade dashboards, HR conversion funnels, and workforce risk forecasts.
        </p>
      </div>

      {/* Sub Navigation Tabs */}
      <div className="premium-nav-container print:hidden">
        {[
          { id: 'dashboard', label: 'Company Overview', icon: BarChart3 },
          { id: 'employees', label: 'Employee Grid & Promotion Engine', icon: UserCheck },
          { id: 'hr', label: 'HR Team SLAs', icon: Clipboard },
          { id: 'kpis', label: 'KPI & Goals Kanban', icon: Target },
          { id: 'pip', label: 'PIP & Coaching Monitor', icon: ShieldAlert },
          { id: 'reports', label: 'Reports Builder', icon: FileText }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "premium-nav-item active:scale-[0.98]",
              activeTab === tab.id ? "premium-nav-item-active" : ""
            )}
          >
            <tab.icon className="w-3 h-3 shrink-0" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Workspaces */}
      <div className="space-y-6">
        
        {/* Tab 1: Executive Overview */}
        {activeTab === 'dashboard' && (
          userRole === 'HR' ? (
            <HrDashboard
              employees={employees}
              isClient={isClient}
              chartData={chartData}
            />
          ) : userRole === 'Admin' ? (
            <AdminDashboard
              employees={employees}
              isClient={isClient}
              recruitmentFunnel={recruitmentFunnel}
              slaMetrics={slaMetrics}
              payrollData={payrollData}
            />
          ) : (
            <DashboardTab
              employees={employees}
              realtimeLogs={realtimeLogs}
              alerts={alerts}
              isClient={isClient}
              dashboardStats={dashboardStats}
              chartData={chartData}
            />
          )
        )}

        {/* Tab 2: Employee Performance Monitoring */}
        {activeTab === 'employees' && (
          <EmployeesTab
            employees={employees}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            setNewPip={setNewPip}
            setIsPipModalOpen={setIsPipModalOpen}
          />
        )}

        {/* Tab 3: HR Team Performance Monitor */}
        {activeTab === 'hr' && (
          <HrSLATab
            filteredAppraisals={filteredAppraisals}
            handleDeleteReview={handleDeleteReview}
            setIsReviewModalOpen={setIsReviewModalOpen}
            isClient={isClient}
            slaMetrics={slaMetrics}
            recruitmentFunnelData={recruitmentFunnel}
          />
        )}



        {/* Tab 5: KPI & Goals Kanban */}
        {activeTab === 'kpis' && (
          <KpisTab
            kpis={kpis}
            goals={goals}
            goalSearchQuery={goalSearchQuery}
            setGoalSearchQuery={setGoalSearchQuery}
            goalDeptFilter={goalDeptFilter}
            setGoalDeptFilter={setGoalDeptFilter}
            goalStatusFilter={goalStatusFilter}
            setGoalStatusFilter={setGoalStatusFilter}
            setIsKpiModalOpen={setIsKpiModalOpen}
            setIsGoalModalOpen={setIsGoalModalOpen}
          />
        )}

        {/* Tab 6: PIP & Coaching Monitor */}
        {activeTab === 'pip' && (
          <PipTab
            pips={pips}
            setIsPipModalOpen={setIsPipModalOpen}
          />
        )}





        {/* Tab 9: Reports Builder */}
        {activeTab === 'reports' && (
          <ReportsBuilderTab
            reportScope={reportScope}
            setReportScope={setReportScope}
            reportFormat={reportFormat}
            setReportFormat={setReportFormat}
            employees={employees}
            handleTriggerReport={handleTriggerReport}
            reportPreviewData={reportPreviewData}
            isLoadingPreview={isLoadingPreview}
          />
        )}

      </div>      {/* Dynamic Modals overlays */}
      {isClient && createPortal(
        <AnimatePresence>
          
          {/* Modal 1: Create Goal */}
          {isGoalModalOpen && (
            <div className="fixed inset-0 z-[150] overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsGoalModalOpen(false)} className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm pointer-events-auto" />
                <motion.div initial={{ opacity: 0, scale: 0.95, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 15 }} className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-808 text-left animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-805 mb-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-1.5"><Target className="w-4 h-4 text-blue-600" /> Assign Goal</h4>
                    <button onClick={() => setIsGoalModalOpen(false)} className="p-1 hover:bg-slate-105 dark:hover:bg-slate-805 rounded cursor-pointer"><X className="w-4 h-4 text-slate-400" /></button>
                  </div>
                  
                  <form onSubmit={handleAddGoal} className="space-y-4">
                    <div>
                      <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Goal Description</label>
                      <input type="text" required placeholder="e.g. Redesign analytics page load speeds" className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-205 dark:border-slate-808 rounded-xl text-xs font-bold outline-none" value={newGoal.title} onChange={e => setNewGoal({...newGoal, title: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Assignee</label>
                        <select 
                          required 
                          className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-805 border border-slate-205 dark:border-slate-808 rounded-xl text-xs font-bold outline-none cursor-pointer"
                          value={newGoal.assignee} 
                          onChange={e => {
                            const selectedEmp = finalEmployeesList.find(emp => emp.fullName === e.target.value);
                            setNewGoal({
                              ...newGoal, 
                              assignee: e.target.value,
                              dept: selectedEmp?.department || newGoal.dept
                            });
                          }}
                        >
                          <option value="">Select Employee</option>
                          {finalEmployeesList.map(emp => (
                            <option key={emp._id} value={emp.fullName}>{emp.fullName} ({emp.department || 'N/A'})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Department</label>
                        <select 
                          className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-205 dark:border-slate-808 rounded-xl text-xs font-bold outline-none cursor-pointer" 
                          value={newGoal.dept} 
                          onChange={e => {
                            const newDept = e.target.value;
                            const currentEmp = finalEmployeesList.find(emp => emp.fullName === newGoal.assignee);
                            const d1 = (currentEmp?.department || '').toLowerCase().trim();
                            const d2 = newDept.toLowerCase().trim();
                            const isSameDept = d1 === d2 || ((d1 === 'hr' || d1 === 'human resources') && (d2 === 'hr' || d2 === 'human resources'));
                            setNewGoal({
                              ...newGoal, 
                              dept: newDept,
                              assignee: isSameDept ? newGoal.assignee : ''
                            });
                          }}
                        >
                          <option>Engineering</option>
                          <option>Design</option>
                          <option>Sales</option>
                          <option>HR</option>
                          <option>Support</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Deadline</label>
                      <input type="date" required className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-205 dark:border-slate-808 rounded-xl text-xs font-bold outline-none cursor-pointer" value={newGoal.deadline} onChange={e => setNewGoal({...newGoal, deadline: e.target.value})} />
                    </div>
                    <div className="flex gap-3 pt-3">
                      <button type="submit" className="flex-1 py-3 bg-blue-600 hover:bg-blue-707 text-white rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer border border-transparent shadow-lg shadow-blue-500/20">Submit Goal</button>
                      <button type="button" onClick={() => setIsGoalModalOpen(false)} className="px-5 py-3 bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-350 rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer">Cancel</button>
                    </div>
                  </form>
                </motion.div>
              </div>
            </div>
          )}

          {/* Modal 2: Create KPI */}
          {isKpiModalOpen && (
            <div className="fixed inset-0 z-[150] overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsKpiModalOpen(false)} className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm pointer-events-auto" />
                <motion.div initial={{ opacity: 0, scale: 0.95, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 15 }} className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-808 text-left animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-805 mb-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-1.5"><Clipboard className="w-4 h-4 text-blue-600" /> Create KPI Target</h4>
                    <button onClick={() => setIsKpiModalOpen(false)} className="p-1 hover:bg-slate-105 dark:hover:bg-slate-850 rounded cursor-pointer"><X className="w-4 h-4 text-slate-400" /></button>
                  </div>
                  
                  <form onSubmit={handleAddKpi} className="space-y-4">
                    <div>
                      <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">KPI Title</label>
                      <input type="text" required placeholder="e.g. Sales Target Fulfillment" className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-205 dark:border-slate-808 rounded-xl text-xs font-bold outline-none" value={newKpi.title} onChange={e => setNewKpi({...newKpi, title: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Department</label>
                        <select className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-205 dark:border-slate-808 rounded-xl text-xs font-bold outline-none cursor-pointer" value={newKpi.dept} onChange={e => setNewKpi({...newKpi, dept: e.target.value})}>
                          <option>Engineering</option>
                          <option>Design</option>
                          <option>Sales</option>
                          <option>HR</option>
                          <option>Support</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Period</label>
                        <select className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-205 dark:border-slate-808 rounded-xl text-xs font-bold outline-none cursor-pointer" value={newKpi.period} onChange={e => setNewKpi({...newKpi, period: e.target.value})}>
                          <option>Weekly</option>
                          <option>Monthly</option>
                          <option>Quarterly</option>
                          <option>Yearly</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Target SLA</label>
                        <input type="text" required placeholder="e.g. 95%" className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-205 dark:border-slate-808 rounded-xl text-xs font-bold outline-none" value={newKpi.target} onChange={e => setNewKpi({...newKpi, target: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Completion score (%)</label>
                        <input type="number" required min={0} max={100} placeholder="e.g. 90" className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-205 dark:border-slate-808 rounded-xl text-xs font-bold outline-none" value={newKpi.score || ''} onChange={e => setNewKpi({...newKpi, score: Number(e.target.value)})} />
                      </div>
                    </div>
                    <div className="flex gap-3 pt-3">
                      <button type="submit" className="flex-1 py-3 bg-blue-600 hover:bg-blue-707 text-white rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer border border-transparent shadow-lg shadow-blue-500/20">Submit KPI</button>
                      <button type="button" onClick={() => setIsKpiModalOpen(false)} className="px-5 py-3 bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-350 rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer">Cancel</button>
                    </div>
                  </form>
                </motion.div>
              </div>
            </div>
          )}

          {/* Modal 3: Log Review */}
          {isReviewModalOpen && (
            <div className="fixed inset-0 z-[150] overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsReviewModalOpen(false)} className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm pointer-events-auto" />
                <motion.div initial={{ opacity: 0, scale: 0.95, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 15 }} className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-808 text-left animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-805 mb-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-1.5"><RibbonIcon className="w-4 h-4 text-blue-600" /> Log Performance Appraisals</h4>
                    <button onClick={() => setIsReviewModalOpen(false)} className="p-1 hover:bg-slate-105 dark:hover:bg-slate-850 rounded cursor-pointer"><X className="w-4 h-4 text-slate-400" /></button>
                  </div>
                  
                  <form onSubmit={handleAddReview} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Employee Name</label>
                        <select 
                          required 
                          className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-855 border border-slate-205 dark:border-slate-808 rounded-xl text-xs font-bold outline-none cursor-pointer"
                          value={newReview.name} 
                          onChange={e => {
                            const selectedEmp = finalEmployeesList.find(emp => emp.fullName === e.target.value);
                            setNewReview({
                              ...newReview, 
                              name: e.target.value,
                              dept: selectedEmp?.department || newReview.dept
                            });
                          }}
                        >
                          <option value="">Select Employee</option>
                          {finalEmployeesList
                            .filter(emp => {
                              if (!newReview.dept) return true;
                              const d1 = (emp.department || '').toLowerCase().trim();
                              const d2 = newReview.dept.toLowerCase().trim();
                              if (d1 === d2) return true;
                              if ((d1 === 'hr' || d1 === 'human resources') && (d2 === 'hr' || d2 === 'human resources')) return true;
                              return false;
                            })
                            .map(emp => (
                              <option key={emp._id} value={emp.fullName}>{emp.fullName}</option>
                            ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Department</label>
                        <select 
                          className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-855 border border-slate-205 dark:border-slate-808 rounded-xl text-xs font-bold outline-none cursor-pointer" 
                          value={newReview.dept} 
                          onChange={e => {
                            const newDept = e.target.value;
                            const currentEmp = finalEmployeesList.find(emp => emp.fullName === newReview.name);
                            const d1 = (currentEmp?.department || '').toLowerCase().trim();
                            const d2 = newDept.toLowerCase().trim();
                            const isSameDept = d1 === d2 || ((d1 === 'hr' || d1 === 'human resources') && (d2 === 'hr' || d2 === 'human resources'));
                            setNewReview({
                              ...newReview, 
                              dept: newDept,
                              name: isSameDept ? newReview.name : ''
                            });
                          }}
                        >
                          <option>Engineering</option>
                          <option>Design</option>
                          <option>Sales</option>
                          <option>HR</option>
                          <option>Support</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Rating Score (1.0 - 5.0)</label>
                        <input type="number" required min={1} max={5} step={0.1} placeholder="e.g. 4.8" className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-205 dark:border-slate-808 rounded-xl text-xs font-bold outline-none" value={newReview.rating || ''} onChange={e => setNewReview({...newReview, rating: Number(e.target.value)})} />
                      </div>
                      <div>
                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Assessment Status</label>
                        <select className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-855 border border-slate-205 dark:border-slate-808 rounded-xl text-xs font-bold outline-none cursor-pointer" value={newReview.status} onChange={e => setNewReview({...newReview, status: e.target.value})}>
                          <option>Top Performer</option>
                          <option>Exceeds Expectations</option>
                          <option>Meets Expectations</option>
                          <option>Under Review</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Goals completed ratio</label>
                        <input type="text" required placeholder="e.g. 9/10" className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-205 dark:border-slate-808 rounded-xl text-xs font-bold outline-none" value={newReview.goals} onChange={e => setNewReview({...newReview, goals: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Action recommendation</label>
                        <select className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-855 border border-slate-205 dark:border-slate-808 rounded-xl text-xs font-bold outline-none cursor-pointer" value={newReview.recommendation} onChange={e => setNewReview({...newReview, recommendation: e.target.value})}>
                          <option>Promotion</option>
                          <option>Retain</option>
                          <option>Warning</option>
                          <option>PIP Coaching</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-3 pt-3">
                      <button type="submit" className="flex-1 py-3 bg-blue-600 hover:bg-blue-707 text-white rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer border border-transparent shadow-lg shadow-blue-500/20">Log Review</button>
                      <button type="button" onClick={() => setIsReviewModalOpen(false)} className="px-5 py-3 bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-350 rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer">Cancel</button>
                    </div>
                  </form>
                </motion.div>
              </div>
            </div>
          )}

          {/* Modal 4: Start PIP */}
          {isPipModalOpen && (
            <div className="fixed inset-0 z-[150] overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsPipModalOpen(false)} className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm pointer-events-auto" />
                <motion.div initial={{ opacity: 0, scale: 0.95, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 15 }} className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-808 text-left animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-850 mb-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-1.5"><ShieldAlert className="w-4 h-4 text-rose-600" /> Start Performance Improvement Plan (PIP)</h4>
                    <button onClick={() => setIsPipModalOpen(false)} className="p-1 hover:bg-slate-105 dark:hover:bg-slate-850 rounded cursor-pointer"><X className="w-4 h-4 text-slate-400" /></button>
                  </div>
                  
                  <form onSubmit={handleAddPip} className="space-y-4">
                    <div>
                      <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Underperforming Staff Member</label>
                      <input type="text" required placeholder="e.g. Rohan Gupta" className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-205 dark:border-slate-808 rounded-xl text-xs font-bold outline-none" value={newPip.name} onChange={e => setNewPip({...newPip, name: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Identified Issue Description</label>
                      <input type="text" required placeholder="e.g. Consistent delay in tasks and sprints completion" className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-205 dark:border-slate-808 rounded-xl text-xs font-bold outline-none" value={newPip.issue} onChange={e => setNewPip({...newPip, issue: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Target Outcomes</label>
                        <input type="text" required placeholder="e.g. On-time tasks for 4 weeks" className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-205 dark:border-slate-808 rounded-xl text-xs font-bold outline-none" value={newPip.targets} onChange={e => setNewPip({...newPip, targets: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Monitoring Duration</label>
                        <select className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-205 dark:border-slate-808 rounded-xl text-xs font-bold outline-none cursor-pointer" value={newPip.timeline} onChange={e => setNewPip({...newPip, timeline: e.target.value})}>
                          <option>30 Days</option>
                          <option>60 Days</option>
                          <option>90 Days</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Coaching Mentor / supervisor</label>
                      <input type="text" required placeholder="Supervisor Name" className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-205 dark:border-slate-808 rounded-xl text-xs font-bold outline-none" value={newPip.coach} onChange={e => setNewPip({...newPip, coach: e.target.value})} />
                    </div>
                    <div className="flex gap-3 pt-3">
                      <button type="submit" className="flex-1 py-3 bg-blue-600 hover:bg-blue-707 text-white rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer border border-transparent shadow-lg shadow-blue-500/20">Submit Plan</button>
                      <button type="button" onClick={() => setIsPipModalOpen(false)} className="px-5 py-3 bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-350 rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer">Cancel</button>
                    </div>
                  </form>
                </motion.div>
              </div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      <ConfirmModal 
        isOpen={!!reviewToDelete}
        title="Delete Appraisal Record"
        message="Are you sure you want to permanently delete this performance appraisal review? This action cannot be undone."
        confirmText="Delete Record"
        cancelText="Cancel"
        onConfirm={handleConfirmDeleteReview}
        onCancel={() => setReviewToDelete(null)}
        type="danger"
      />

    </div>
  );
}
