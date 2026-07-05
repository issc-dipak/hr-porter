import React from 'react';
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DepartmentsTabProps {
  isClient: boolean;
  employees: any[];
}

export const DepartmentsTab: React.FC<DepartmentsTabProps> = ({ isClient, employees }) => {
  // Compute department data from real employees
  const deptMap: Record<string, { productivity: number[]; attendance: number[]; taskNums: number; taskDens: number }> = {};

  employees.forEach((e) => {
    const dept = e.dept || 'Other';
    if (!deptMap[dept]) deptMap[dept] = { productivity: [], attendance: [], taskNums: 0, taskDens: 0 };
    deptMap[dept].productivity.push(e.score || 0);
    deptMap[dept].attendance.push(e.attendance || 0);
    // tasks is like "3/5"
    const parts = (e.tasks || '0/0').split('/');
    deptMap[dept].taskNums += parseInt(parts[0]) || 0;
    deptMap[dept].taskDens += parseInt(parts[1]) || 0;
  });

  const computedDeptData = Object.entries(deptMap).map(([name, data]) => {
    const avgProductivity = data.productivity.length > 0
      ? Math.round(data.productivity.reduce((a, b) => a + b, 0) / data.productivity.length)
      : 0;
    const avgAttendance = data.attendance.length > 0
      ? Math.round(data.attendance.reduce((a, b) => a + b, 0) / data.attendance.length)
      : 0;
    const taskFulfillment = data.taskDens > 0 ? Math.round((data.taskNums / data.taskDens) * 100) : 0;
    return { name, Productivity: avgProductivity, Attendance: avgAttendance, TaskFulfillment: taskFulfillment };
  }).sort((a, b) => b.Productivity - a.Productivity);

  return (
    <div className="space-y-6">
      {/* Radar Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2 p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl shadow-sm space-y-6">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Department Metrics Comparison</h3>
            <p className="text-[10px] font-bold text-slate-400 mt-0.5">Comprehensive comparison of productivity, attendance and task completion by department.</p>
          </div>

          <div className="h-72">
            {isClient ? (
              computedDeptData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={computedDeptData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '9px', textTransform: 'uppercase', fontWeight: 'bold' }} />
                    <Bar name="Productivity Index" dataKey="Productivity" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    <Bar name="Attendance Rate" dataKey="Attendance" fill="#10B981" radius={[4, 4, 0, 0]} />
                    <Bar name="Task Completion" dataKey="TaskFulfillment" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-[11px] font-bold text-slate-400 uppercase">No department data available yet</div>
              )
            ) : <div className="h-full bg-slate-100 rounded-xl animate-pulse" />}
          </div>
        </div>

        {/* Department Rankings Grid */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl shadow-sm space-y-4">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Efficiency Ranking</h3>
          
          <div className="space-y-3.5">
            {computedDeptData.length > 0 ? computedDeptData.map((d, idx) => (
              <div key={d.name} className="flex justify-between items-center text-xs">
                <span className="font-extrabold text-slate-700 dark:text-slate-300">{idx + 1}. {d.name} Team</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-blue-600 dark:text-blue-400">{d.Productivity}%</span>
                  <div className="w-16 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600" style={{ width: `${d.Productivity}%` }} />
                  </div>
                </div>
              </div>
            )) : (
              <p className="text-[10px] text-slate-400 font-bold uppercase text-center py-4">Add employees to see department rankings</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
