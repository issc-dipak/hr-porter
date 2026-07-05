import React from 'react';
import { Clipboard, Sparkles, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReportsBuilderTabProps {
  reportScope: string;
  setReportScope: (val: string) => void;
  reportFormat: string;
  setReportFormat: (val: string) => void;
  employees: any[];
  handleTriggerReport: () => void;
  reportPreviewData: any;
  isLoadingPreview: boolean;
}

export const ReportsBuilderTab: React.FC<ReportsBuilderTabProps> = ({
  reportScope,
  setReportScope,
  reportFormat,
  setReportFormat,
  employees,
  handleTriggerReport,
  reportPreviewData,
  isLoadingPreview
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
      
      {/* Left Controls */}
      <div className="lg:col-span-2 p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-3xl shadow-sm space-y-6">
        <div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
            <Clipboard className="w-4 h-4 text-blue-600" /> Report Configurator
          </h3>
          <p className="text-[10px] text-slate-400 mt-1 font-bold">Customize scope, target format, and render a verified analytical report.</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Select Scope</label>
            <select 
              value={reportScope}
              onChange={e => setReportScope(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-205 dark:border-slate-808 rounded-xl px-3.5 py-3 text-xs font-black text-slate-900 dark:text-white outline-none cursor-pointer"
            >
              <option>Company Performance</option>
              <option>Employee Grid Metrics</option>
              <option>HR SLA Metrics</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Target Format</label>
            <select 
              value={reportFormat}
              onChange={e => setReportFormat(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-205 dark:border-slate-808 rounded-xl px-3.5 py-3 text-xs font-black text-slate-900 dark:text-white outline-none cursor-pointer"
            >
              <option>CSV</option>
              <option>PDF (Print Layout)</option>
            </select>
          </div>

          <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl text-[10px] font-bold text-slate-400 space-y-2 leading-relaxed">
            <div className="flex gap-2 text-blue-600 dark:text-blue-400 font-extrabold uppercase tracking-wider items-center">
              <Sparkles className="w-3.5 h-3.5" /> High-Fidelity Rendering Active
            </div>
            <p>Selecting PDF layout compiles a corporate-ready page design with formal headers, metadata boxes, summary indicators, tables, and signature signoffs.</p>
          </div>

          <button
            onClick={handleTriggerReport}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 cursor-pointer transition-all border border-transparent flex justify-center items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Generate & Export Report
          </button>
        </div>
      </div>

      {/* Right Live Preview Sheet */}
      <div className="lg:col-span-3 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Interactive Live Preview</span>
          {isLoadingPreview && (
            <span className="text-[9px] font-bold text-blue-500 uppercase tracking-wider animate-pulse">Recalculating...</span>
          )}
        </div>
        
        <div className="w-full bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-3xl p-8 shadow-md text-left text-slate-800 dark:text-slate-200 relative min-h-[500px] overflow-hidden">
          {/* Letterhead Header */}
          <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-5 mb-6">
            <div>
              <h1 className="text-sm font-black tracking-wider text-slate-900 dark:text-white uppercase">HR CORE SYSTEMS INC.</h1>
              <p className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest">Performance Management Division</p>
              <span className="mt-2 inline-block px-2 py-0.5 bg-rose-500/10 border border-rose-500/25 text-rose-500 text-[8px] font-black uppercase tracking-widest rounded">
                STRICTLY CONFIDENTIAL
              </span>
            </div>
            <div className="text-right text-[8px] text-slate-400 font-bold uppercase tracking-wider space-y-1">
              <div><strong>Document:</strong> Executive Review Plan</div>
              <div><strong>Scope:</strong> {reportScope}</div>
              <div><strong>Classification:</strong> Internal Use Only</div>
              <div><strong>Date:</strong> {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
            </div>
          </div>

          {/* Live Preview Summary KPIs */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {isLoadingPreview ? (
              <div className="col-span-3 text-center py-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider animate-pulse">
                Recalculating live preview...
              </div>
            ) : reportPreviewData?.summary ? (
              reportPreviewData.summary.map((sum: any, idx: number) => (
                <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-xl">
                  <span className="text-[8px] text-slate-400 font-black uppercase tracking-wider block">{sum.label}</span>
                  <div className="text-xs font-black text-slate-900 dark:text-white mt-1">{sum.value}</div>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider italic">
                No preview data loaded.
              </div>
            )}
          </div>

          {/* Table Data Preview */}
          <div className="overflow-x-auto text-[9px] mb-8">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-105 dark:bg-slate-900/60 font-black text-slate-400 uppercase tracking-widest border-b border-slate-205 dark:border-slate-800">
                  {reportScope === 'Company Performance' && (
                    <>
                      <th className="p-2">Department</th>
                      <th className="p-2 text-right">Productivity</th>
                      <th className="p-2 text-right">Attendance</th>
                      <th className="p-2 text-right">Fulfillment</th>
                      <th className="p-2 text-right">Budget Util</th>
                    </>
                  )}
                  {reportScope === 'Employee Grid Metrics' && (
                    <>
                      <th className="p-2">Employee</th>
                      <th className="p-2">Dept</th>
                      <th className="p-2 text-right">Rating</th>
                      <th className="p-2 text-right">Attendance</th>
                      <th className="p-2">Status</th>
                    </>
                  )}
                  {reportScope === 'HR SLA Metrics' && (
                    <>
                      <th className="p-2">Service category</th>
                      <th className="p-2 text-right">Target SLA</th>
                      <th className="p-2 text-right">Actual SLA</th>
                      <th className="p-2">Status</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-bold">
                {isLoadingPreview ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-slate-400">Loading live data...</td>
                  </tr>
                ) : !reportPreviewData?.tableData ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-slate-400">No report preview data available.</td>
                  </tr>
                ) : reportScope === 'Company Performance' ? (
                  reportPreviewData.tableData.map((d: any) => (
                    <tr key={d.name} className="border-b border-slate-100 dark:border-slate-900">
                      <td className="p-2 font-black text-slate-900 dark:text-white">{d.name}</td>
                      <td className="p-2 text-right">{d.Productivity}%</td>
                      <td className="p-2 text-right">{d.Attendance}%</td>
                      <td className="p-2 text-right">{d.TaskFulfillment}%</td>
                      <td className="p-2 text-right">{d.BudgetUtil}%</td>
                    </tr>
                  ))
                ) : reportScope === 'Employee Grid Metrics' ? (
                  reportPreviewData.tableData.slice(0, 5).map((e: any) => (
                    <tr key={e.id} className="border-b border-slate-100 dark:border-slate-900">
                      <td className="p-2 font-black text-slate-900 dark:text-white">{e.name}</td>
                      <td className="p-2">{e.dept}</td>
                      <td className="p-2 text-right">{e.score}%</td>
                      <td className="p-2 text-right">{e.attendance}%</td>
                      <td className="p-2">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider",
                          e.status === 'Top Performer' ? "bg-emerald-500/10 text-emerald-500" :
                          e.status === 'Needs Improvement' ? "bg-rose-500/10 text-rose-500" : "bg-blue-500/10 text-blue-500"
                        )}>
                          {e.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  reportPreviewData.tableData.map((row: any, idx: number) => (
                    <tr key={idx} className="border-b border-slate-100 dark:border-slate-900">
                      <td className="p-2 font-black text-slate-900 dark:text-white">{row.category}</td>
                      <td className="p-2 text-right">{row.target}</td>
                      <td className="p-2 text-right text-emerald-500">{row.actual}</td>
                      <td className="p-2">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[7px] font-black uppercase",
                          row.status === 'OPTIMAL' ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                        )}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {reportScope === 'Employee Grid Metrics' && !isLoadingPreview && reportPreviewData?.tableData && reportPreviewData.tableData.length > 5 && (
              <p className="text-[7.5px] italic text-slate-400 text-center mt-2.5">showing first 5 rows in live preview. complete document will contain {reportPreviewData.tableData.length} records.</p>
            )}
          </div>

          {/* Signature line simulation */}
          <div className="grid grid-cols-2 gap-8 border-t border-slate-200 dark:border-slate-800 pt-6 text-[8px] font-black uppercase tracking-widest text-slate-400 mt-12">
            <div className="text-center">
              <div className="h-0.5 bg-slate-200 dark:bg-slate-800 w-full mb-2"></div>
              Prepared By: HR Analytics Lead
            </div>
            <div className="text-center">
              <div className="h-0.5 bg-slate-200 dark:bg-slate-800 w-full mb-2"></div>
              Approved By: Chief HR Officer
            </div>
          </div>

          {/* Footer Disclaimer */}
          <div className="text-center text-[7px] text-slate-400 font-bold uppercase tracking-widest mt-12 pt-4 border-t border-slate-150 dark:border-slate-900">
            This report is generated dynamically by HR Core Systems Performance Management Module. Authorization required for replication or distribution.
          </div>
        </div>
      </div>

    </div>
  );
};

