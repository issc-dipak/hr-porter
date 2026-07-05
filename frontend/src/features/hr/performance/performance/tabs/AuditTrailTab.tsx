import React from 'react';

interface AuditTrailTabProps {
  auditLogs: any[];
}

export const AuditTrailTab: React.FC<AuditTrailTabProps> = ({ auditLogs }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-100 dark:border-slate-805">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Compliance Audit Trail</h3>
          <p className="text-[10px] text-slate-400 mt-0.5">Cryptographic system logs tracking performance settings, KPI changes and reviewer actions.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/40 text-[9px] font-black text-slate-405 uppercase tracking-widest border-b border-slate-105 dark:border-slate-800">
                <th className="p-4">Action</th>
                <th className="p-4">Actor</th>
                <th className="p-4">Target Log</th>
                <th className="p-4">Timestamp</th>
                <th className="p-4">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-805 font-medium">
              {auditLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-55/50 dark:hover:bg-slate-800/10">
                  <td className="p-4 font-black text-slate-900 dark:text-white">{log.action}</td>
                  <td className="p-4 text-slate-500">{log.actor}</td>
                  <td className="p-4 text-slate-650 dark:text-slate-350">{log.target}</td>
                  <td className="p-4 text-slate-405 font-mono">{log.timestamp}</td>
                  <td className="p-4 text-slate-400 font-mono">{log.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
