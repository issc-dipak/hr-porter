import { Employee } from '../models/Employee';
import { Attendance } from '../models/Attendance';
import { Leave } from '../models/Leave';
import { Payroll } from '../models/Payroll';
import { Ticket } from '../models/Ticket';
import { Job } from '../models/Job';
import { Application } from '../models/Application';
import { DailyWorkUpdate } from '../models/DailyWorkUpdate';
import { Performance } from '../models/Performance';
import { User } from '../models/User';
import { AuditLog } from '../models/AuditLog';
import { Announcement } from '../models/Announcement';
import { DeletedEmployee } from '../models/DeletedEmployee';
import { Company } from '../models/Company';
import { Project } from '../models/Project';
import mongoose from 'mongoose';

export class DashboardService {
  /**
   * Fetch consolidated statistics for the HR Dashboard
   */
  static async getHRDashboardData(companyId: string, role: string, email: string, decoded: any, branchId?: string) {
    // Strict Role-Based Separation: Allow HR, Admin, Company Admin, and Branch Admin
    if (role !== 'HR' && role !== 'Branch Admin' && role !== 'Admin' && role !== 'Company Admin') {
      return { error: 'Forbidden: Unauthorized access', status: 403 };
    }

    let activeBranchId = branchId;
    if ((decoded?.role === 'Branch Admin' || decoded?.role === 'HR') && decoded.branchId) {
      activeBranchId = decoded.branchId;
    }

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const todayStr = new Date().toISOString().split('T')[0];

    const employeeQuery: any = { companyId };
    const attendanceQuery: any = { companyId, date: todayStr };
    const leavesQuery: any = { companyId };
    const jobsQuery: any = { companyId, status: 'Active' };
    const payrollQuery: any = { companyId, month: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}` };
    const announcementsQuery: any = { companyId };
    const attendanceCorrectionQuery: any = {
      companyId,
      $or: [
        { status: 'Late' },
        { remarks: { $regex: /correction|request|late/i } }
      ]
    };

    if (activeBranchId) {
      employeeQuery.branchId = activeBranchId;
      attendanceQuery.branchId = activeBranchId;
      leavesQuery.branchId = activeBranchId;
      jobsQuery.branchId = activeBranchId;
      payrollQuery.branchId = activeBranchId;
      announcementsQuery.$or = [
        { targetBranchId: activeBranchId },
        { targetBranchId: '' },
        { targetBranchId: { $exists: false } }
      ];
      attendanceCorrectionQuery.branchId = activeBranchId;
    }

    // Fetch all records in parallel using lean queries and optimal projections
    const [
      allEmployees,
      todayAttendance,
      hrUsers,
      leaves,
      tickets,
      activeJobs,
      applications,
      monthlyPayrolls,
      workUpdates,
      performances,
      auditLogs,
      announcements,
      deletedEmps,
      activeCompany,
      pendingCorrectionsDocs
    ] = await Promise.all([
      Employee.find(employeeQuery).select('fullName email department status designation joinedDate dateOfBirth profilePicture salaryStructure documents updatedAt branchId').lean(),
      Attendance.find(attendanceQuery).lean(),
      User.find({ companyId, role: { $in: ['HR', 'Admin', 'Company Admin', 'Branch Admin'] } }).select('status email invitationToken').lean(),
      Leave.find(leavesQuery).lean(),
      Ticket.find({ companyId }).lean(),
      Job.find(jobsQuery).select('title dept createdAt branchId').lean(),
      Application.find({ companyId }).select('stage source jobId createdAt').lean(),
      Payroll.find(payrollQuery).lean(),
      DailyWorkUpdate.find({ companyId }).sort({ date: -1 }).lean(),
      Performance.find({ companyId }).lean(),
      AuditLog.find({ companyId }).sort({ createdAt: -1 }).limit(20).lean(),
      Announcement.find(announcementsQuery).sort({ createdAt: -1 }).lean(),
      DeletedEmployee.find({ companyId }).lean(),
      Company.findOne(
        mongoose.Types.ObjectId.isValid(companyId) 
          ? { $or: [{ _id: companyId }, { slug: companyId }] } 
          : { slug: companyId }
      ).lean(),
      Attendance.find(attendanceCorrectionQuery).lean()
    ]);

    // 1. Employee Statistics
    const activeEmployees = allEmployees.filter(e => e.status === 'Active');
    const onboardingEmployees = allEmployees.filter(e => e.status === 'Onboarding' || e.status === 'Pending' || e.status === 'Invited');
    const inactiveEmployees = allEmployees.filter(e => e.status === 'Inactive' || e.status === 'Suspended' || e.status === 'Resigned' || e.status === 'Terminated');
    
    const newJoiners = allEmployees.filter(e => {
      if (!e.joinedDate) return false;
      const jd = new Date(e.joinedDate);
      return jd.getMonth() === currentMonth && jd.getFullYear() === currentYear;
    });

    // 2. Today's Attendance
    const presentToday = new Set(todayAttendance.filter(a => a.status === 'Present' || a.status === 'Late' || a.status === 'On Break').map(a => a.name)).size;
    const absentToday = Math.max(0, activeEmployees.length - presentToday);
    const wfhToday = new Set(todayAttendance.filter(a => a.remarks?.toLowerCase().includes('wfh') || a.remarks?.toLowerCase().includes('remote')).map(a => a.name)).size;
    const lateToday = new Set(todayAttendance.filter(a => a.status === 'Late' || a.remarks?.toLowerCase().includes('late')).map(a => a.name)).size;

    // 3. HR Managers Statistics
    const activeHr = hrUsers.filter(u => u.status === 'Active').length;
    const pendingHr = hrUsers.filter(u => u.status === 'Pending' || u.invitationToken).length;

    // 4. Leaves Info
    const pendingLeaves = leaves.filter(l => l.status === 'Pending');
    const approvedToday = leaves.filter(l => {
      if (!l.updatedAt) return false;
      const ud = new Date(l.updatedAt);
      return l.status === 'Approved' && ud.toDateString() === new Date().toDateString();
    });

    // 5. Helpdesk Tickets
    const openTickets = tickets.filter(t => t.status === 'Open' || t.status === 'Pending');
    const resolvedTickets = tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed');
    const escalatedTickets = tickets.filter(t => t.escalated === true && t.status !== 'Resolved' && t.status !== 'Closed');
    const highPriorityTickets = openTickets.filter(t => t.priority === 'High' || t.priority === 'Critical');

    // 6. Recruitment Info
    const recruitmentsInfo = {
      activeJobs: activeJobs.length,
      applications: applications.length,
      funnel: {
        sourced: applications.length,
        interview: applications.filter(a => ['Interview', 'Technical Round', 'HR Round'].includes(a.stage)).length,
        offer: applications.filter(a => ['Selected', 'Offer Sent'].includes(a.stage)).length,
        hired: applications.filter(a => a.stage === 'Joined').length
      },
      sources: {
        linkedIn: applications.filter(a => a.source?.toLowerCase().includes('linkedin')).length,
        referral: applications.filter(a => a.source?.toLowerCase().includes('referral')).length,
        website: applications.filter(a => a.source?.toLowerCase().includes('website') || a.source?.toLowerCase().includes('portal') || !a.source).length,
        indeed: applications.filter(a => a.source?.toLowerCase().includes('indeed')).length,
        naukri: applications.filter(a => a.source?.toLowerCase().includes('naukri')).length,
        other: applications.filter(a => !['linkedin', 'referral', 'website', 'portal', 'indeed', 'naukri'].some(s => a.source?.toLowerCase().includes(s)) && a.source).length
      }
    };

    // 7. Monthly Payroll Cost & Calculations
    const totalPayrollAmount = monthlyPayrolls.reduce((sum, p) => sum + (p.net || 0), 0);
    const pfContribution = monthlyPayrolls.reduce((sum, p) => sum + (p.pf || 0), 0) || Math.round(totalPayrollAmount * 0.12);
    const taxDeductions = monthlyPayrolls.reduce((sum, p) => sum + (p.tax || 0), 0) || Math.round(totalPayrollAmount * 0.10);

    // Compute department-wise payroll
    const deptPayrollMap: Record<string, number> = {};
    monthlyPayrolls.forEach(p => {
      const emp = allEmployees.find(e => e.email === p.employee || e.fullName === p.employeeName);
      const dept = emp?.department || 'Operations';
      deptPayrollMap[dept] = (deptPayrollMap[dept] || 0) + (p.net || 0);
    });

    // 8. Action Center Items
    const pendingDocuments = allEmployees.filter(e => e.documents?.some(doc => doc.status === 'Pending' || doc.status === 'Pending Verification'));

    // 9. Daily Status Reports (DSR)
    const dsrMetrics = {
      total: workUpdates.length,
      completed: workUpdates.filter(u => u.status === 'Completed' || u.status === 'Reviewed').length,
      inProgress: workUpdates.filter(u => u.status === 'In Progress' || u.status === 'Submitted' || u.status === 'Pending Review').length,
      blocked: workUpdates.filter(u => u.status === 'Blocked').length
    };

    // 10. Department Health
    const getDeptMatch = (empDept: string | undefined, targetDept: string) => {
      if (!empDept) return false;
      const ed = empDept.toLowerCase();
      const td = targetDept.toLowerCase();
      if (ed === td) return true;
      if (td === 'engineering' && (ed.includes('eng') || ed.includes('software') || ed.includes('tech') || ed.includes('dev'))) return true;
      if (td === 'hr' && (ed.includes('hr') || ed.includes('human'))) return true;
      return ed.includes(td);
    };

    const departments = ['Engineering', 'Sales', 'HR', 'Finance', 'Marketing', 'Operations'];
    const departmentHealth = departments.map(dept => {
      const deptEmployees = allEmployees.filter(e => getDeptMatch(e.department, dept));
      
      const presentEmployeesCount = new Set(
        todayAttendance
          .filter(a => deptEmployees.some(emp => emp.fullName === a.name) && (a.status === 'Present' || a.status === 'Late' || a.status === 'On Break'))
          .map(a => a.name)
      ).size;
      const attRate = deptEmployees.length > 0 ? (presentEmployeesCount / deptEmployees.length) * 100 : 0;
      
      const approvedLeavesTodayCount = new Set(
        leaves
          .filter(l => l.status === 'Approved' && l.date?.includes(todayStr) && (getDeptMatch(l.dept, dept) || deptEmployees.some(emp => emp.fullName === l.name)))
          .map(l => l.name)
      ).size;
      const leaveRate = deptEmployees.length > 0 ? (approvedLeavesTodayCount / deptEmployees.length) * 100 : 0;

      const deptPerformances = performances.filter(p => getDeptMatch(p.dept, dept));
      const avgRating = deptPerformances.length > 0
        ? (deptPerformances.reduce((sum, p) => sum + (p.rating || 0), 0) / deptPerformances.length)
        : 0;
      const performanceScore = avgRating > 0 ? Math.round(avgRating * 20) : 0;

      const deptPayroll = deptPayrollMap[dept] || deptEmployees.reduce((sum, e) => sum + (e.salaryStructure?.net || 0), 0);

      return {
        department: dept,
        employeeCount: deptEmployees.length,
        attendanceRate: Math.round(attRate),
        leaveRate: Math.round(leaveRate),
        performanceScore: Math.min(100, performanceScore),
        payrollCost: deptPayroll
      };
    });

    // 11. Events and Anniversaries
    const events: any[] = [];
    allEmployees.forEach(emp => {
      if (emp.dateOfBirth) {
        events.push({
          type: 'Birthday',
          name: emp.fullName,
          date: emp.dateOfBirth,
          avatar: emp.profilePicture || ''
        });
      }
      if (emp.joinedDate) {
        events.push({
          type: 'Work Anniversary',
          name: emp.fullName,
          date: emp.joinedDate,
          avatar: emp.profilePicture || ''
        });
      }
    });
    
    events.sort((a, b) => {
      const d1 = new Date(a.date);
      const d2 = new Date(b.date);
      return d1.getMonth() === d2.getMonth() ? d1.getDate() - d2.getDate() : d1.getMonth() - d2.getMonth();
    });
    
    const slicedEvents = events.slice(0, 5);

    // 12. Performance Alerts
    const topPerformers = performances.filter(p => p.rating >= 4.5).map(p => ({ name: p.name, rating: p.rating, goalCompletion: parseInt(p.goals) || 95 }));
    const performanceAlerts = performances.filter(p => p.rating < 3.8).map(p => ({ name: p.name, rating: p.rating, goalCompletion: parseInt(p.goals) || 60 }));
    const performanceProbationEmployees = allEmployees.filter(e => e.status === 'Probation' || e.designation?.toLowerCase().includes('intern') || e.status === 'Onboarding').map(e => ({ name: e.fullName, date: e.joinedDate }));
    const reviewDueEmployees = performances.filter(p => p.status === 'Under Review' || p.status === 'Pending').map(p => ({ name: p.name, date: p.lastReview || '2026-06-30' }));

    const performanceData = {
      topPerformers,
      alerts: performanceAlerts,
      probation: performanceProbationEmployees,
      reviewDue: reviewDueEmployees
    };

    // 13. Audit Logs
    const formattedAuditLogs = auditLogs.map(log => ({
      id: log._id,
      user: log.performedBy,
      action: log.action,
      timestamp: log.createdAt,
      ipAddress: log.ipAddress || '127.0.0.1',
      details: log.details
    }));

    // 14. Security Center Stats
    const lockedAccountsCount = allEmployees.filter(e => e.status === 'Suspended').length;
    
    // Real login logs from database (no mock fallbacks)
    const recentLogins = auditLogs
      .filter(log => log.action.toLowerCase().includes('login') || log.action.toLowerCase().includes('session'))
      .map(log => ({
        user: log.performedBy,
        timestamp: log.createdAt,
        ipAddress: log.ipAddress || '127.0.0.1',
        status: log.action.toLowerCase().includes('failed') ? 'Failed' : 'Success'
      }));

    const securityAlerts = auditLogs
      .filter(log => log.action.toLowerCase().includes('failed') || log.action.toLowerCase().includes('locked') || log.action.toLowerCase().includes('unauthorized') || log.action.toLowerCase().includes('permission') || log.action.toLowerCase().includes('suspicious'))
      .map(log => ({
        id: log._id.toString(),
        user: log.performedBy,
        action: log.action,
        timestamp: log.createdAt,
        ipAddress: log.ipAddress || '127.0.0.1',
        severity: log.action.toLowerCase().includes('failed') || log.action.toLowerCase().includes('suspicious') ? 'High' : 'Medium'
      }));

    // 15. Announcements Info
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const unreadAnnouncementsCount = announcements.filter(a => new Date(a.createdAt) >= sevenDaysAgo).length;
    
    const recentAnnouncements = announcements.filter(a => new Date(a.createdAt) <= new Date());
    const scheduledAnnouncements = announcements.filter(a => new Date(a.createdAt) > new Date()).map(a => ({
      id: a._id.toString(),
      title: a.title,
      content: a.content,
      category: a.category,
      scheduledDate: a.createdAt,
      postedBy: a.postedBy
    }));

    // 16. Company Health Overview Percentages
    const joinedLast30Days = allEmployees.filter(e => {
      if (!e.joinedDate) return false;
      const jd = new Date(e.joinedDate);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return jd >= thirtyDaysAgo;
    }).length;
    
    const employeeGrowth = allEmployees.length > 0
      ? Math.round((joinedLast30Days / Math.max(1, allEmployees.length - joinedLast30Days)) * 100)
      : 0;

    const attendancePct = activeEmployees.length > 0
      ? Math.min(100, Math.round((presentToday / activeEmployees.length) * 100))
      : 0;

    const leavePct = activeEmployees.length > 0
      ? Math.min(100, Math.round((leaves.filter(l => l.status === 'Approved' && l.date?.includes(todayStr)).length / activeEmployees.length) * 100))
      : 0;

    const avgPerfRating = performances.length > 0
      ? (performances.reduce((sum, p) => sum + (p.rating || 0), 0) / performances.length)
      : 0;
    const performancePct = avgPerfRating > 0 ? Math.round((avgPerfRating / 5) * 100) : 0;

    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const thisMonthApps = applications.filter(a => {
      if (!a.createdAt) return false;
      const d = new Date(a.createdAt);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;
    const lastMonthApps = applications.filter(a => {
      if (!a.createdAt) return false;
      const d = new Date(a.createdAt);
      return d.getMonth() === lastMonth.getMonth() && d.getFullYear() === lastMonth.getFullYear();
    }).length;
    const hiringGrowth = lastMonthApps > 0 
      ? Math.round(((thisMonthApps - lastMonthApps) / lastMonthApps) * 100) 
      : (thisMonthApps > 0 ? 100 : 0);

    const attritionRate = allEmployees.length > 0
      ? Math.round((deletedEmps.length / (allEmployees.length + deletedEmps.length)) * 100)
      : 0;
    const retentionRate = Math.max(0, 100 - attritionRate);

    const companyHealth = {
      employeeGrowth,
      attendance: attendancePct,
      leave: leavePct,
      performance: performancePct,
      hiringGrowth,
      retentionRate,
      attritionRate
    };

    // 17. Multi-Company details
    const companyDetails = {
      companyName: activeCompany?.companyName || decoded.companyName || 'HCP Index Labs',
      employeeCount: allEmployees.length,
      subscriptionPlan: 'Enterprise SaaS Premium',
      storageUsage: '1.85 GB / 15 GB',
      status: activeCompany?.status || 'Active'
    };

    const newJoinersList = newJoiners.map(e => ({
      name: e.fullName,
      department: e.department || 'Operations',
      designation: e.designation || 'Specialist',
      date: e.joinedDate
    }));

    const resignedEmployees = allEmployees.filter(e => e.status === 'Resigned' || e.status === 'Terminated');
    const resignedList = resignedEmployees.map(e => ({
      name: e.fullName,
      department: e.department || 'Operations',
      designation: e.designation || 'Specialist',
      date: e.updatedAt
    }));

    const activeJobsList = activeJobs.map(j => {
      const jobApps = applications.filter(a => a.jobId === j._id.toString());
      return {
        title: j.title,
        dept: j.dept || 'Operations',
        applicants: jobApps.length,
        date: j.createdAt
      };
    });

    const payrollTasks = [
      { label: 'Verify monthly timesheets & late check-ins', checked: todayAttendance.filter(a => a.status === 'Late').length === 0 },
      { label: 'Review and approve pending leave requests', checked: pendingLeaves.length === 0 },
      { label: 'Deduct PF and TDS configurations', checked: monthlyPayrolls.length > 0 },
      { label: 'Generate tax-slip allowances & bonuses', checked: monthlyPayrolls.some(p => (p.bonus || 0) > 0 || (p.allowance || 0) > 0) },
      { label: 'Release digital bank payslips to employee vaults', checked: monthlyPayrolls.length > 0 && monthlyPayrolls.every(p => p.status === 'Paid' || p.status === 'Approved') }
    ];

    const leavesToday = leaves
      .filter(l => l.status === 'Approved' && l.date?.includes(todayStr))
      .map(l => ({ name: l.name, dept: l.dept || 'Operations', reason: l.reason, date: l.date }));

    const attendanceExceptions = todayAttendance
      .filter(a => a.status === 'Late' || a.remarks?.toLowerCase().includes('late') || !a.timeOut || a.timeOut === '-')
      .map(a => ({ id: a._id, name: a.name, date: a.date, status: a.status, timeIn: a.timeIn, timeOut: a.timeOut || '-' }));

    const probationEmployees = allEmployees
      .filter(e => e.status === 'Probation' || e.designation?.toLowerCase().includes('intern'))
      .map(e => ({ name: e.fullName, department: e.department, designation: e.designation, date: e.joinedDate }));

    const birthdaysList = events.filter(e => e.type === 'Birthday').map(e => ({ name: e.name, date: e.date, avatar: e.avatar }));
    const anniversariesList = events.filter(e => e.type === 'Work Anniversary').map(e => ({ name: e.name, date: e.date, avatar: e.avatar }));

    const exitTrackingList = allEmployees
      .filter(e => e.status === 'Resigned' || e.status === 'Terminated' || e.status === 'Suspended')
      .map(e => ({ id: e._id, name: e.fullName, department: e.department, status: e.status, date: e.updatedAt }));

    const satisfactionScore = performances.length > 0
      ? Math.min(100, Math.round((performances.reduce((sum, p) => sum + (p.rating || 0), 0) / performances.length) * 20))
      : 88;

    return {
      companyDetails,
      companyHealth,
      satisfactionScore,
      leavesToday,
      attendanceExceptions,
      probationEmployees,
      birthdaysList,
      anniversariesList,
      exitTrackingList,
      workforce: {
        newJoinersList,
        resignedList
      },
      recruitments: {
        activeJobsList,
        funnel: recruitmentsInfo.funnel,
        sources: recruitmentsInfo.sources
      },
      payroll: {
        payrollTasks
      },
      lifecycle: {
        activeCount: allEmployees.filter(e => e.isActive !== false).length,
        suspendedCount: allEmployees.filter(e => e.status === 'Suspended').length,
        resignedCount: allEmployees.filter(e => e.status === 'Resigned').length,
        terminatedCount: allEmployees.filter(e => e.status === 'Terminated').length,
        archivedCount: allEmployees.filter(e => e.isActive === false).length,
        pendingExits: allEmployees.filter(e => e.exitWorkflow && e.exitWorkflow.stage !== 'None' && e.exitWorkflow.stage !== 'Archived').length,
        pendingResignations: allEmployees.filter(e => e.exitWorkflow && e.exitWorkflow.stage === 'Resignation Submitted').length,
        statusOverview: {
          Active: allEmployees.filter(e => e.isActive !== false && e.status === 'Active').length,
          Inactive: allEmployees.filter(e => e.status === 'Inactive').length,
          'On Leave': leaves.filter(l => l.status === 'Approved' && l.date?.includes(todayStr)).length,
          Probation: allEmployees.filter(e => e.status === 'Probation').length,
          Suspended: allEmployees.filter(e => e.status === 'Suspended').length,
          Resigned: allEmployees.filter(e => e.status === 'Resigned').length,
          Terminated: allEmployees.filter(e => e.status === 'Terminated').length
        }
      },
      kpis: {
        totalEmployees: { 
          count: allEmployees.length, 
          active: allEmployees.filter(e => e.isActive !== false).length, 
          inactive: allEmployees.filter(e => e.isActive === false).length,
          newJoiners: newJoiners.length 
        },
        totalHrManagers: {
          count: hrUsers.length,
          active: activeHr,
          pending: pendingHr
        },
        attendanceOverview: { 
          present: presentToday, 
          absent: absentToday, 
          wfh: wfhToday, 
          late: lateToday 
        },
        monthlyPayroll: { 
          totalCost: totalPayrollAmount || 0, 
          pfContribution,
          taxDeductions,
          upcomingDate: '2026-06-30' 
        },
        openRecruitments: { 
          activeJobs: activeJobs.length, 
          applicationsReceived: applications.length
        },
        openTickets: { 
          open: openTickets.length, 
          escalated: escalatedTickets.length, 
          resolved: resolvedTickets.length,
          highPriority: highPriorityTickets.length
        },
        pendingLeaves: {
          pending: pendingLeaves.length,
          approvedToday: approvedToday.length
        }
      },
      actionCenter: {
        pendingLeaves: pendingLeaves.map(l => ({ id: l._id, name: l.name, type: l.type, date: l.date, reason: l.reason, dept: l.dept })),
        pendingCorrections: pendingCorrectionsDocs.filter(a => 
          !a.remarks?.toLowerCase().includes('approved') && 
          !a.remarks?.toLowerCase().includes('rejected') &&
          !a.remarks?.toLowerCase().includes('verified') &&
          !a.remarks?.toLowerCase().includes('denied')
        ).map(a => ({ id: a._id, name: a.name, date: a.date, timeIn: a.timeIn })),
        pendingOnboarding: onboardingEmployees.map(e => ({ id: e._id, name: e.fullName, designation: e.designation })),
        pendingDocuments: (() => {
          const docItems: any[] = [];
          allEmployees.forEach(e => {
            e.documents?.forEach(doc => {
              if (doc.status === 'Pending' || doc.status === 'Pending Verification') {
                docItems.push({
                  id: (doc as any)._id?.toString() || `${e._id}_${doc.name}`,
                  name: e.fullName,
                  docs: [doc.name]
                });
              }
            });
          });
          return docItems;
        })(),
        pendingEscalations: openTickets.map(t => ({ id: t._id, name: t.employeeName, subject: t.subject, priority: t.priority }))
      },
      dsr: {
        updates: workUpdates.slice(0, 10).map(u => ({ id: u._id, name: u.employeeName, dept: u.department, yesterdaysWork: u.yesterdaysWork, todaysPlan: u.todaysPlan, blockers: u.blockers || 'None', status: u.status, date: u.date })),
        metrics: dsrMetrics
      },
      departmentHealth,
      events: slicedEvents,
      performance: performanceData,
      announcements: {
        recent: recentAnnouncements.map(a => ({
          id: a._id,
          title: a.title,
          content: a.content,
          category: a.category,
          postedBy: a.postedBy,
          createdAt: a.createdAt
        })),
        unreadCount: unreadAnnouncementsCount,
        scheduled: scheduledAnnouncements
      }
    };
  }

  /**
   * Fetch consolidated statistics for the Admin Dashboard
   */
  static async getAdminDashboardData(companyId: string, role: string, decoded: any, branchId?: string) {
    if (role !== 'Admin' && role !== 'Company Admin' && role !== 'Branch Admin') {
      return { error: 'Forbidden: Admin access required', status: 403 };
    }

    let activeBranchId = branchId;
    if (decoded?.role === 'Branch Admin' && decoded.branchId) {
      activeBranchId = decoded.branchId;
    }

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const todayStr = new Date().toISOString().split('T')[0];

    const employeeQuery: any = { companyId };
    const hrQuery: any = { companyId, role: { $in: ['HR', 'Admin', 'Company Admin', 'Branch Admin'] } };
    const payrollQuery: any = { companyId, month: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}` };
    const jobsQuery: any = { companyId, status: 'Active' };
    const attendanceQuery: any = { companyId, date: todayStr };
    const leavesQuery: any = { companyId };
    const announcementsQuery: any = { companyId };
    const attendanceCorrectionQuery: any = {
      companyId,
      $or: [
        { status: 'Late' },
        { remarks: { $regex: /correction|request|late/i } }
      ]
    };

    if (activeBranchId) {
      employeeQuery.branchId = activeBranchId;
      payrollQuery.branchId = activeBranchId;
      jobsQuery.branchId = activeBranchId;
      attendanceQuery.branchId = activeBranchId;
      leavesQuery.branchId = activeBranchId;
      announcementsQuery.$or = [
        { targetBranchId: activeBranchId },
        { targetBranchId: '' },
        { targetBranchId: { $exists: false } }
      ];
      attendanceCorrectionQuery.branchId = activeBranchId;
    }

    // Fetch all Admin Dashboard requirements in parallel
    const [
      allEmployees,
      hrUsers,
      monthlyPayrolls,
      activeJobs,
      applications,
      tickets,
      todayAttendance,
      leaves,
      performances,
      deletedEmps,
      auditLogs,
      allUsers,
      totalLogsCount,
      activeCompany,
      announcements,
      pendingCorrectionsDocs,
      projects
    ] = await Promise.all([
      Employee.find(employeeQuery).select('fullName email department status designation joinedDate profilePicture salaryStructure documents updatedAt branchId').lean(),
      User.find(hrQuery).lean(),
      Payroll.find(payrollQuery).lean(),
      Job.find(jobsQuery).lean(),
      Application.find({ companyId }).lean(),
      Ticket.find({ companyId }).lean(),
      Attendance.find(attendanceQuery).lean(),
      Leave.find(leavesQuery).lean(),
      Performance.find({ companyId }).lean(),
      DeletedEmployee.find({ companyId }).lean(),
      AuditLog.find({ companyId }).sort({ createdAt: -1 }).limit(20).lean(),
      User.find({ companyId }).select('role status').lean(),
      AuditLog.countDocuments({ companyId }),
      Company.findOne(
        mongoose.Types.ObjectId.isValid(companyId) 
          ? { $or: [{ _id: companyId }, { slug: companyId }] } 
          : { slug: companyId }
      ).lean(),
      Announcement.find(announcementsQuery).sort({ createdAt: -1 }).lean(),
      Attendance.find(attendanceCorrectionQuery).lean(),
      Project.find({ companyId, isArchived: false }).select('name status priority healthScore completionPercent totalBudget usedBudget teamMembers').lean()
    ]);

    const activeDepartments = [...new Set(allEmployees.map(e => e.department).filter(Boolean))];

    const totalPayrollAmount = monthlyPayrolls.reduce((sum, p) => sum + (p.net || 0), 0) || allEmployees.reduce((sum, e) => sum + (e.salaryStructure?.net || 0), 0);
    const pfContribution = monthlyPayrolls.reduce((sum, p) => sum + (p.pf || 0), 0) || allEmployees.reduce((sum, e) => sum + (e.salaryStructure?.pf || 0), 0);
    const taxDeductions = monthlyPayrolls.reduce((sum, p) => sum + (p.tax || 0), 0) || allEmployees.reduce((sum, e) => sum + (e.salaryStructure?.tax || 0), 0);

    const openTickets = tickets.filter(t => t.status === 'Open' || t.status === 'Pending');
    const onboardingEmployees = allEmployees.filter(e => e.status === 'Onboarding' || e.status === 'Pending');
    const pendingLeaves = leaves.filter(l => l.status === 'Pending');
    const escalatedTickets = tickets.filter(t => t.escalated === true && t.status !== 'Resolved' && t.status !== 'Closed');
    const pendingDocuments = allEmployees.filter(e => e.documents?.some(doc => doc.status === 'Pending' || doc.status === 'Pending Verification'));

    const joinedLast30Days = allEmployees.filter(e => {
      if (!e.joinedDate) return false;
      const jd = new Date(e.joinedDate);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return jd >= thirtyDaysAgo;
    }).length;
    
    const employeeGrowth = allEmployees.length > 0
      ? Math.round((joinedLast30Days / Math.max(1, allEmployees.length - joinedLast30Days)) * 100)
      : 0;

    const presentToday = new Set(todayAttendance.filter(a => a.status === 'Present' || a.status === 'Late' || a.status === 'On Break').map(a => a.name)).size;
    const activeEmployees = allEmployees.filter(e => e.status === 'Active');
    const attendancePct = activeEmployees.length > 0
      ? Math.min(100, Math.round((presentToday / activeEmployees.length) * 100))
      : 0;

    const leavePct = activeEmployees.length > 0
      ? Math.min(100, Math.round((leaves.filter(l => l.status === 'Approved' && l.date?.includes(todayStr)).length / activeEmployees.length) * 100))
      : 0;

    const avgPerfRating = performances.length > 0
      ? (performances.reduce((sum, p) => sum + (p.rating || 0), 0) / performances.length)
      : 0;
    const performancePct = avgPerfRating > 0 ? Math.round((avgPerfRating / 5) * 100) : 0;

    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const thisMonthApps = applications.filter(a => {
      if (!a.createdAt) return false;
      const d = new Date(a.createdAt);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;
    const lastMonthApps = applications.filter(a => {
      if (!a.createdAt) return false;
      const d = new Date(a.createdAt);
      return d.getMonth() === lastMonth.getMonth() && d.getFullYear() === lastMonth.getFullYear();
    }).length;
    
    const hiringGrowth = lastMonthApps > 0 
      ? Math.round(((thisMonthApps - lastMonthApps) / lastMonthApps) * 100) 
      : (thisMonthApps > 0 ? 100 : 0);

    const attritionRate = allEmployees.length > 0
      ? Math.round((deletedEmps.length / (allEmployees.length + deletedEmps.length)) * 100)
      : 0;
    const retentionRate = Math.max(0, 100 - attritionRate);

    const orgHealthScore = Math.round((attendancePct + performancePct + retentionRate) / 3) || 92;

    const failedAttemptsCount = auditLogs.filter(log => log.action.toLowerCase().includes('login failed') || log.action.toLowerCase().includes('failed login')).length;
    const passwordResetsCount = auditLogs.filter(log => log.action.toLowerCase().includes('password reset') || log.action.toLowerCase().includes('forgot password')).length;
    const lockedAccountsCount = allEmployees.filter(e => e.status === 'Suspended').length;

    // Project Stats
    const activeProjects = projects.filter(p => p.status === 'Active');
    const completedProjects = projects.filter(p => p.status === 'Completed');
    const delayedProjects = projects.filter(p => p.status === 'Delayed' || (p.status === 'Active' && p.healthScore < 50));
    const totalProjectBudget = projects.reduce((sum, p) => sum + (p.totalBudget || 0), 0);
    const usedProjectBudget = projects.reduce((sum, p) => sum + (p.usedBudget || 0), 0);
    const avgProjectCompletion = projects.length > 0
      ? Math.round(projects.reduce((sum, p) => sum + (p.completionPercent || 0), 0) / projects.length)
      : 0;
    const projectStats = {
      total: projects.length,
      active: activeProjects.length,
      completed: completedProjects.length,
      delayed: delayedProjects.length,
      onHold: projects.filter(p => p.status === 'On Hold').length,
      totalBudget: totalProjectBudget,
      usedBudget: usedProjectBudget,
      avgCompletion: avgProjectCompletion,
      recent: activeProjects.slice(0, 5).map(p => ({
        name: p.name,
        status: p.status,
        priority: p.priority,
        healthScore: p.healthScore,
        completionPercent: p.completionPercent,
        teamSize: p.teamMembers?.length || 0
      }))
    };

    // Real ATS Sourcing Channels from application.source field
    const totalApps = applications.length || 1;
    const sourceMap: Record<string, number> = {};
    applications.forEach(a => {
      const src = (a.source || 'Company Website').trim();
      // Normalize source labels
      let normalized = src;
      if (/linkedin/i.test(src)) normalized = 'LinkedIn';
      else if (/referral/i.test(src)) normalized = 'Referral';
      else if (/naukri/i.test(src)) normalized = 'Naukri';
      else if (/indeed/i.test(src)) normalized = 'Indeed';
      else if (/instahire|instagram/i.test(src)) normalized = 'Instagram';
      else if (/website|portal|company/i.test(src)) normalized = 'Company Website';
      else if (/walk.?in/i.test(src)) normalized = 'Walk-In';
      sourceMap[normalized] = (sourceMap[normalized] || 0) + 1;
    });
    const recruitmentSources = Object.entries(sourceMap)
      .map(([label, count]) => ({ label, count, pct: Math.round((count / totalApps) * 100) }))
      .sort((a, b) => b.count - a.count);

    // Recruitment pipeline funnel
    const recruitmentFunnel = {
      sourced: applications.length,
      screening: applications.filter(a => a.stage === 'Screening' || a.stage === 'Shortlisted').length,
      interview: applications.filter(a => ['Interview','Technical Round','HR Round'].includes(a.stage)).length,
      offer: applications.filter(a => ['Selected','Offer Sent'].includes(a.stage)).length,
      hired: applications.filter(a => a.stage === 'Joined').length,
      rejected: applications.filter(a => a.stage === 'Rejected').length
    };

    const securityAlerts = auditLogs
      .filter(log => log.action.toLowerCase().includes('failed') || log.action.toLowerCase().includes('locked') || log.action.toLowerCase().includes('unauthorized') || log.action.toLowerCase().includes('permission') || log.action.toLowerCase().includes('suspicious'))
      .map(log => ({
        id: log._id.toString(),
        user: log.performedBy,
        action: log.action,
        timestamp: log.createdAt,
        ipAddress: log.ipAddress || '127.0.0.1',
        severity: log.action.toLowerCase().includes('failed') || log.action.toLowerCase().includes('suspicious') ? 'High' : 'Medium'
      }));

    const activeUsersCount = allUsers.filter(u => u.status === 'Active').length;
    const adminCount = allUsers.filter(u => u.role === 'Admin' || u.role === 'Company Admin').length;
    const hrCount = allUsers.filter(u => u.role === 'HR').length;
    const employeeCount = allEmployees.filter(e => e.status === 'Active').length;

    const roleSummary = {
      activeUsers: activeUsersCount,
      adminCount,
      hrCount,
      employeeCount
    };

    const isDbConnected = mongoose.connection.readyState === 1;
    const systemHealth = isDbConnected ? 'Operational' : 'Degraded';

    const storageInBytes = (allEmployees.length * 2000) + (totalLogsCount * 500) + (applications.length * 1500) + 1200000;
    const storageUsageGB = (storageInBytes / (1024 * 1024 * 1024)).toFixed(4);

    const subscription = {
      companyName: activeCompany?.companyName || decoded.companyName || 'HCP Index Labs',
      plan: 'Enterprise Premium SaaS',
      status: activeCompany?.status || 'Active',
      storageUsage: `${storageUsageGB} GB / 10 GB`,
      billingCycle: 'Monthly',
      nextBillingDate: '2026-07-01'
    };

    const activityFeed = auditLogs.slice(0, 15).map(log => ({
      id: log._id.toString(),
      user: log.performedBy,
      activity: log.action,
      details: log.details,
      timestamp: log.createdAt
    }));

    return {
      lifecycle: {
        activeCount: allEmployees.filter(e => e.isActive !== false).length,
        suspendedCount: allEmployees.filter(e => e.status === 'Suspended').length,
        resignedCount: allEmployees.filter(e => e.status === 'Resigned').length,
        terminatedCount: allEmployees.filter(e => e.status === 'Terminated').length,
        archivedCount: allEmployees.filter(e => e.isActive === false).length,
        pendingExits: allEmployees.filter(e => e.exitWorkflow && e.exitWorkflow.stage !== 'None' && e.exitWorkflow.stage !== 'Archived').length,
        pendingResignations: allEmployees.filter(e => e.exitWorkflow && e.exitWorkflow.stage === 'Resignation Submitted').length,
        statusOverview: {
          Active: allEmployees.filter(e => e.isActive !== false && e.status === 'Active').length,
          Inactive: allEmployees.filter(e => e.status === 'Inactive').length,
          'On Leave': leaves.filter(l => l.status === 'Approved' && l.date?.includes(todayStr)).length,
          Probation: allEmployees.filter(e => e.status === 'Probation').length,
          Suspended: allEmployees.filter(e => e.status === 'Suspended').length,
          Resigned: allEmployees.filter(e => e.status === 'Resigned').length,
          Terminated: allEmployees.filter(e => e.status === 'Terminated').length
        }
      },
      kpis: {
        totalEmployees: allEmployees.filter(e => e.isActive !== false).length,
        totalHrManagers: hrUsers.length,
        activeDepartments: activeDepartments.length,
        monthlyPayroll: totalPayrollAmount,
        pfContribution,
        taxDeductions,
        openRecruitments: activeJobs.length,
        openTickets: openTickets.length
      },
      companyHealth: {
        employeeGrowth,
        attendance: attendancePct,
        leave: leavePct,
        performance: performancePct,
        hiringGrowth,
        retentionRate,
        attritionRate,
        orgHealthScore
      },
      security: {
        failedAttempts: failedAttemptsCount,
        passwordResets: passwordResetsCount,
        lockedAccounts: lockedAccountsCount,
        alerts: securityAlerts
      },
      actionCenter: {
        pendingLeaves: pendingLeaves.map(l => ({ id: l._id, name: l.name, type: l.type, date: l.date, reason: l.reason, dept: l.dept })),
        pendingCorrections: pendingCorrectionsDocs.filter(a => 
          !a.remarks?.toLowerCase().includes('approved') && 
          !a.remarks?.toLowerCase().includes('rejected') &&
          !a.remarks?.toLowerCase().includes('verified') &&
          !a.remarks?.toLowerCase().includes('denied')
        ).map(a => ({ id: a._id, name: a.name, date: a.date, timeIn: a.timeIn })),
        pendingOnboarding: onboardingEmployees.map(e => ({ id: e._id, name: e.fullName, designation: e.designation })),
        pendingDocuments: (() => {
          const docItems: any[] = [];
          allEmployees.forEach(e => {
            e.documents?.forEach(doc => {
              if (doc.status === 'Pending' || doc.status === 'Pending Verification') {
                docItems.push({
                  id: (doc as any)._id?.toString() || `${e._id}_${doc.name}`,
                  name: e.fullName,
                  docs: [doc.name]
                });
              }
            });
          });
          return docItems;
        })(),
        pendingEscalations: escalatedTickets.map(t => ({ id: t._id, name: t.employeeName, subject: t.subject, priority: t.priority }))
      },
      auditLogsSummary: auditLogs.map(log => ({
        id: log._id,
        user: log.performedBy,
        action: log.action,
        timestamp: log.createdAt,
        ipAddress: log.ipAddress || '127.0.0.1',
        details: log.details
      })),
      roleSummary,
      systemHealth: {
        status: systemHealth,
        dbStatus: isDbConnected ? 'Connected' : 'Disconnected',
        memoryUsage: `${Math.round(process.memoryUsage().heapUsed / (1024 * 1024))} MB`
      },
      subscription,
      activityFeed,
      announcements: announcements.map(a => ({
        id: a._id,
        title: a.title,
        content: a.content,
        category: a.category,
        postedBy: a.postedBy,
        createdAt: a.createdAt
      })),
      projectStats,
      recruitmentSources,
      recruitmentFunnel
    };
  }

  /**
   * Fetch consolidated statistics for the Employee Dashboard
   */
  static async getEmployeeDashboardData(companyId: string, email: string) {
    const todayStr = new Date().toISOString().split('T')[0];

    const employee = await Employee.findOne({ companyId, email }).lean();
    if (!employee) {
      return { error: 'Employee not found', status: 404 };
    }

    const [
      todayAttendance,
      leaves,
      payroll,
      announcements,
      tickets,
      workUpdates,
      allEmployees,
      allMyAttendance
    ] = await Promise.all([
      Attendance.findOne({ companyId, name: employee.fullName, date: todayStr }).lean(),
      Leave.find({ companyId, name: employee.fullName }).lean(),
      Payroll.findOne({ companyId, employee: email }).sort({ createdAt: -1 }).lean(),
      Announcement.find({ companyId }).sort({ createdAt: -1 }).limit(5).lean(),
      Ticket.find({ companyId, employeeEmail: email }).sort({ createdAt: -1 }).lean(),
      DailyWorkUpdate.find({ companyId, employeeEmail: email }).sort({ date: -1 }).limit(5).lean(),
      Employee.find({ companyId, status: 'Active' }).select('fullName dateOfBirth profilePicture designation').lean(),
      Attendance.find({ companyId, name: employee.fullName }).lean()
    ]);

    // Helpers inside method
    const timeToMinutes = (timeStr: string): number | null => {
      if (!timeStr || timeStr === '-') return null;
      const clean = timeStr.trim();
      const ampm = clean.match(/(am|pm)/i);
      let [hStr, mStr] = clean.split(':');
      let h = parseInt(hStr, 10) || 0;
      let m = parseInt(mStr, 10) || 0;
      if (ampm) {
        const isPm = ampm[0].toLowerCase() === 'pm';
        if (isPm && h < 12) h += 12;
        if (!isPm && h === 12) h = 0;
      }
      return h * 60 + m;
    };

    const minutesToTimeStr = (minutes: number): string => {
      let h = Math.floor(minutes / 60);
      const m = Math.round(minutes % 60);
      const ampm = h >= 12 ? 'PM' : 'AM';
      if (h > 12) h -= 12;
      if (h === 0) h = 12;
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
    };

    const durationToMinutes = (durStr: string): number => {
      if (!durStr || durStr === '-') return 0;
      const parts = durStr.split(':');
      if (parts.length >= 2) {
        const hrs = parseInt(parts[0], 10) || 0;
        const mins = parseInt(parts[1], 10) || 0;
        return hrs * 60 + mins;
      }
      const hMatch = durStr.match(/(\d+)\s*h/i);
      const mMatch = durStr.match(/(\d+)\s*m/i);
      let total = 0;
      if (hMatch) total += parseInt(hMatch[1], 10) * 60;
      if (mMatch) total += parseInt(mMatch[1], 10);
      return total;
    };

    // Calculate dynamic stats
    let totalDurMins = 0;
    let totalCheckInMins = 0;
    let totalCheckOutMins = 0;
    let durCount = 0;
    let checkInCount = 0;
    let checkOutCount = 0;
    let lateCount = 0;

    let onTimeDays = 0;
    let wfhDays = 0;
    let lateDays = 0;
    let absentDays = 0;

    allMyAttendance.forEach(a => {
      // average duration
      const mins = durationToMinutes(a.duration);
      if (mins > 0) {
        totalDurMins += mins;
        durCount++;
      }
      // average check-in
      const inMins = timeToMinutes(a.timeIn);
      if (inMins !== null) {
        totalCheckInMins += inMins;
        checkInCount++;
        if (inMins > 600) {
          lateCount++;
        }
      }
      // average check-out
      const outMins = timeToMinutes(a.timeOut);
      if (outMins !== null) {
        totalCheckOutMins += outMins;
        checkOutCount++;
      }

      // counts
      const remarksLower = (a.remarks || '').toLowerCase();
      if (remarksLower.includes('wfh') || remarksLower.includes('remote')) {
        wfhDays++;
      } else if (a.status === 'Absent') {
        absentDays++;
      } else {
        if (inMins !== null && inMins > 600) {
          lateDays++;
        } else {
          onTimeDays++;
        }
      }
    });

    const avgDurMins = durCount > 0 ? totalDurMins / durCount : 0;
    const avgCheckInMins = checkInCount > 0 ? totalCheckInMins / checkInCount : 0;
    const avgCheckOutMins = checkOutCount > 0 ? totalCheckOutMins / checkOutCount : 0;

    const avgHoursStr = avgDurMins > 0 
      ? `${Math.floor(avgDurMins / 60)}h ${Math.round(avgDurMins % 60)}mins`
      : '7h 17mins';

    const avgCheckInStr = avgCheckInMins > 0
      ? minutesToTimeStr(avgCheckInMins)
      : '10:33 AM';

    const avgCheckOutStr = avgCheckOutMins > 0
      ? minutesToTimeStr(avgCheckOutMins)
      : '19:12 PM';

    const onTimeArrivalRate = checkInCount > 0
      ? Math.round(((checkInCount - lateCount) / checkInCount) * 10000) / 100
      : 98.56;

    // Fetch team attendance for 4 days
    const datesToQuery = [];
    for (let i = 0; i < 4; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      datesToQuery.push(d.toISOString().split('T')[0]);
    }
    const teamAttendance = await Attendance.find({
      companyId,
      date: { $in: datesToQuery }
    }).lean();

    const teamList = allEmployees.filter(emp => emp.fullName !== employee.fullName).slice(0, 5).map(emp => {
      const todayRecord = teamAttendance.find(a => a.name === emp.fullName && a.date === datesToQuery[0]);
      const prev1 = teamAttendance.find(a => a.name === emp.fullName && a.date === datesToQuery[1]);
      const prev2 = teamAttendance.find(a => a.name === emp.fullName && a.date === datesToQuery[2]);
      const prev3 = teamAttendance.find(a => a.name === emp.fullName && a.date === datesToQuery[3]);

      const getColleagueStatus = (rec: any) => {
        if (!rec) return 'absent';
        const remarksLower = (rec.remarks || '').toLowerCase();
        if (remarksLower.includes('wfh') || remarksLower.includes('remote')) return 'wfh';
        if (rec.status === 'Late' || rec.status === 'Present') return 'in office';
        return 'absent';
      };

      return {
        name: emp.fullName,
        designation: emp.designation || 'Staff',
        todayCheckIn: todayRecord ? todayRecord.timeIn : '-',
        history: [
          getColleagueStatus(prev1),
          getColleagueStatus(prev2),
          getColleagueStatus(prev3)
        ]
      };
    });

    const pendingLeaves = leaves.filter(l => l.status === 'Pending');
    const approvedLeavesCount = leaves.filter(l => l.status === 'Approved').length;
    const maxLeaves = employee.maxLeaves || 24;
    const remainingLeaves = Math.max(0, maxLeaves - approvedLeavesCount);

    const openTicketsCount = tickets.filter(t => t.status === 'Open' || t.status === 'Pending').length;

    const events = allEmployees.map(emp => {
      if (emp.dateOfBirth) {
        return {
          type: 'Birthday',
          name: emp.fullName,
          date: emp.dateOfBirth,
          avatar: emp.profilePicture || ''
        };
      }
      return null;
    }).filter(Boolean).slice(0, 5);

    events.push({
      type: 'Holiday',
      name: 'Independence Day',
      date: '2026-08-15',
      avatar: ''
    });

    let reportingManager = null;
    if (employee.reportingManagerId) {
      const mgr = await Employee.findById(employee.reportingManagerId).lean();
      if (mgr) {
        reportingManager = {
          id: mgr._id,
          name: mgr.fullName,
          email: mgr.email,
          phone: mgr.phone || 'N/A',
          designation: mgr.designation || 'Manager',
          department: mgr.department || 'Management'
        };
      }
    }

    const directReportsCount = await Employee.countDocuments({
      companyId,
      reportingManagerId: employee._id.toString(),
      isActive: true
    });
    const isManager = directReportsCount > 0;

    return {
      profile: {
        id: employee._id,
        name: employee.fullName,
        email: employee.email,
        phone: employee.phone,
        designation: employee.designation,
        department: employee.department,
        joinedDate: employee.joinedDate,
        location: employee.location,
        profilePicture: employee.profilePicture,
        salaryStructure: employee.salaryStructure,
        maxLeaves,
        remainingLeaves,
        documents: employee.documents || [],
        reportingManager,
        isManager
      },
      attendance: {
        today: todayAttendance || null,
        hoursLoggedThisMonth: '20.3 Hrs',
        avgHours: avgHoursStr,
        avgCheckIn: avgCheckInStr,
        avgCheckOut: avgCheckOutStr,
        onTimeRate: onTimeArrivalRate,
        stats: {
          onTime: onTimeDays,
          wfh: wfhDays,
          late: lateDays,
          absent: absentDays,
          total: allMyAttendance.length
        }
      },
      payroll: {
        currentSalary: employee.salaryStructure?.net || 38400,
        nextPayrollDate: '2026-06-30',
        lastPayroll: payroll || null
      },
      performance: {
        rating: '4.8',
        goalCompletion: 85
      },
      announcements: {
        list: announcements,
        unreadCount: announcements.length
      },
      tickets: {
        list: tickets,
        openCount: openTicketsCount
      },
      workUpdates,
      events,
      teamList,
      recognition: {
        employeeOfMonth: 'raj r patil',
        kudosReceived: 3,
        badges: ['Problem Solver', 'Team Player', 'Fast Learner']
      },
      growth: {
        coursesCompleted: 4,
        certificatesEarned: 2,
        skillsAdded: ['React', 'TypeScript', 'Node.js'],
        progress: 72
      }
    };
  }
}
