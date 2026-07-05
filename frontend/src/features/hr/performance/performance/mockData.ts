// Seed initial mock datasets for Admin Overview
export const initialKPIs = [
  { id: '1', title: 'Task Completion Rate', dept: 'Engineering', target: '95%', current: '92%', period: 'Monthly', score: 92, trend: '+2%', status: 'On Track' },
  { id: '2', title: 'Client Satisfaction Index', dept: 'Sales', target: '4.8/5', current: '4.7/5', period: 'Quarterly', score: 94, trend: '+4%', status: 'On Track' },
  { id: '3', title: 'Code Review Response Time', dept: 'Engineering', target: '2.0h', current: '2.5h', period: 'Weekly', score: 80, trend: '-5%', status: 'Needs Attention' },
  { id: '4', title: 'SLA Achievement Rate', dept: 'Support', target: '99%', current: '99.5%', period: 'Yearly', score: 100, trend: 'Stable', status: 'On Track' },
  { id: '5', title: 'Productivity Index', dept: 'HR', target: '90%', current: '88%', period: 'Monthly', score: 88, trend: '+1%', status: 'On Track' }
];

export const initialGoals = [
  { id: '1', title: 'Launch Enterprise Payroll Engine', assignee: 'Dipak Patil', dept: 'Engineering', progress: 85, status: 'In Progress', deadline: '2026-06-15' },
  { id: '2', title: 'Optimize Next.js Initial Page Load to < 1s', assignee: 'Puja Patil', dept: 'Engineering', progress: 40, status: 'In Progress', deadline: '2026-07-01' },
  { id: '3', title: 'Hire 3 Senior Frontend Engineers', assignee: 'Pravin', dept: 'HR', progress: 100, status: 'Completed', deadline: '2026-05-18' },
  { id: '4', title: 'Redesign Client Onboarding Flow', assignee: 'Sneha Patel', dept: 'Design', progress: 90, status: 'In Progress', deadline: '2026-05-30' },
  { id: '5', title: 'Expand API documentation coverage', assignee: 'Amit Mishra', dept: 'Engineering', progress: 20, status: 'Pending', deadline: '2026-08-10' }
];

export const initialEmployeesList = [
  { id: 'emp-1', name: 'Dipak Patil', dept: 'Engineering', score: 96, attendance: 98, tasks: '28/30', kpis: '94%', status: 'Top Performer', promotionReady: true, risk: 'Low' },
  { id: 'emp-2', name: 'Puja Patil', dept: 'Design', score: 95, attendance: 97, tasks: '24/25', kpis: '96%', status: 'Top Performer', promotionReady: true, risk: 'Low' },
  { id: 'emp-3', name: 'Pravin', dept: 'HR', score: 85, attendance: 92, tasks: '18/20', kpis: '85%', status: 'Meets Expectations', promotionReady: false, risk: 'Low' },
  { id: 'emp-4', name: 'Rohan Gupta', dept: 'Design', score: 58, attendance: 80, tasks: '12/24', kpis: '50%', status: 'Needs Improvement', promotionReady: false, risk: 'High' },
  { id: 'emp-5', name: 'Amit Mishra', dept: 'Engineering', score: 78, attendance: 90, tasks: '19/25', kpis: '75%', status: 'Meets Expectations', promotionReady: false, risk: 'Medium' },
  { id: 'emp-6', name: 'Sneha Patel', dept: 'Marketing', score: 92, attendance: 96, tasks: '22/24', kpis: '90%', status: 'Exceeds Expectations', promotionReady: true, risk: 'Low' }
];

export const initialHrSlaMetrics = {
  hiringSuccess: '94%',
  payrollSpeed: '98.5%',
  leaveApproval: '2.1 hrs',
  responseTime: '1.8 hrs',
  conversionRate: '12.4%',
  slaStatus: 'Optimal'
};

export const initialRealtimeActivity = [
  { id: 'log-1', message: 'Dipak Patil completed task "Integrate WebSockets"', time: '2 mins ago', type: 'task' },
  { id: 'log-2', message: 'Rohan Gupta missed deadline for "Figma Component Lib"', time: '15 mins ago', type: 'alert' },
  { id: 'log-3', message: 'HR completed payroll processing for May 2026', time: '1 hr ago', type: 'payroll' },
  { id: 'log-4', message: 'Puja Patil checked in via biometric terminal', time: '2 hrs ago', type: 'attendance' }
];

export const initialAuditLogs = [
  { id: 'audit-1', action: 'Modified KPI Target', actor: 'Admin (System)', target: 'Code Review Response Time', timestamp: '2026-05-20 08:12', ip: '192.168.1.12' },
  { id: 'audit-2', action: 'Initiated PIP Plan', actor: 'HR Manager', target: 'Rohan Gupta', timestamp: '2026-05-19 14:40', ip: '192.168.1.25' },
  { id: 'audit-3', action: 'Created Performance Goal', actor: 'Admin (System)', target: 'Hire 3 Frontend Engineers', timestamp: '2026-05-18 10:05', ip: '192.168.1.12' }
];

export const initialAlerts = [
  { id: 'alert-1', message: 'Productivity dropped by 12% in Design Department', type: 'warning', source: 'System Engine' },
  { id: 'alert-2', message: 'Goal "Optimize Next.js Load" has crossed 70% duration with only 40% progress', type: 'danger', source: 'Projects Pipeline' }
];

// Recharts Charts Data
export const monthlyPerformanceData = [
  { name: 'Jan', Productivity: 78, Attendance: 82, PayrollCost: 120000 },
  { name: 'Feb', Productivity: 82, Attendance: 85, PayrollCost: 122000 },
  { name: 'Mar', Productivity: 80, Attendance: 89, PayrollCost: 121000 },
  { name: 'Apr', Productivity: 89, Attendance: 91, PayrollCost: 125000 },
  { name: 'May', Productivity: 94, Attendance: 95, PayrollCost: 128000 }
];

export const recruitmentFunnelData = [
  { name: 'Applied', candidates: 320, fill: '#64748B' },
  { name: 'Screened', candidates: 180, fill: '#3B82F6' },
  { name: 'Interviewed', candidates: 65, fill: '#6366F1' },
  { name: 'Hired', candidates: 12, fill: '#10B981' }
];

export const deptCompareData = [
  { name: 'HR', Productivity: 85, Attendance: 92, TaskFulfillment: 88, BudgetUtil: 90 },
  { name: 'IT', Productivity: 94, Attendance: 98, TaskFulfillment: 95, BudgetUtil: 95 },
  { name: 'Sales', Productivity: 88, Attendance: 91, TaskFulfillment: 85, BudgetUtil: 88 },
  { name: 'Marketing', Productivity: 82, Attendance: 93, TaskFulfillment: 80, BudgetUtil: 85 },
  { name: 'Finance', Productivity: 90, Attendance: 95, TaskFulfillment: 92, BudgetUtil: 90 },
  { name: 'Operations', Productivity: 86, Attendance: 94, TaskFulfillment: 89, BudgetUtil: 92 }
];
