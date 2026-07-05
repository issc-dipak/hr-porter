import React from 'react';
import { Search, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmployeesTabProps {
  employees: any[];
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  setNewPip: React.Dispatch<React.SetStateAction<any>>;
  setIsPipModalOpen: (val: boolean) => void;
}

export const EmployeesTab: React.FC<EmployeesTabProps> = ({
  employees,
  searchTerm,
  setSearchTerm,
  setNewPip,
  setIsPipModalOpen
}) => {
  return (
    <div className="space-y-6">
      {/* Performance Grid Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-100 dark:border-slate-805 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Employee Performance Grid</h3>
          
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search employee metrics..." 
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-205 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/40 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-805">
                <th className="p-4">Name</th>
                <th className="p-4">Department</th>
                <th className="p-4">Performance Score</th>
                <th className="p-4">Attendance Rate</th>
                <th className="p-4">Tasks Completed</th>
                <th className="p-4">KPI Met</th>
                <th className="p-4">Assessment</th>
                <th className="p-4">PIP Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-805 font-medium">
              {employees.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase())).map(e => (
                <tr key={e.id} className="hover:bg-slate-55/50 dark:hover:bg-slate-800/20">
                  <td className="p-4 font-black text-slate-900 dark:text-white">{e.name}</td>
                  <td className="p-4 text-slate-500">{e.dept}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-blue-600 dark:text-blue-400">{e.score}%</span>
                      <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600" style={{ width: `${e.score}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-slate-808 dark:text-slate-250 font-semibold">{e.attendance}%</td>
                  <td className="p-4 text-slate-500 font-mono">{e.tasks}</td>
                  <td className="p-4 text-slate-808 dark:text-slate-205 font-mono">{e.kpis}</td>
                  <td className="p-4">
                    <span className={cn(
                      "px-2.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border",
                      e.status === 'Top Performer' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                      e.status === 'Exceeds Expectations' ? "bg-blue-500/10 text-blue-500 border-blue-500/20" : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                    )}>
                      {e.status}
                    </span>
                  </td>
                  <td className="p-4">
                    {e.score < 60 ? (
                      <button
                        onClick={() => {
                          setNewPip((prev: any) => ({ ...prev, name: e.name }));
                          setIsPipModalOpen(true);
                        }}
                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[8px] font-black uppercase tracking-wider cursor-pointer"
                      >
                        Assign PIP Plan
                      </button>
                    ) : (
                      <span className="text-[9px] text-slate-400 uppercase tracking-widest font-black">Satisfactory</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
