import React from 'react';
import { Plus } from 'lucide-react';

interface PipTabProps {
  pips: any[];
  setIsPipModalOpen: (val: boolean) => void;
}

export const PipTab: React.FC<PipTabProps> = ({ pips, setIsPipModalOpen }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">PIP & Coaching monitoring</h3>
          <p className="text-[10px] font-bold text-slate-400 mt-0.5">Oversee development tracks, mentoring setups and PIP monitored progress.</p>
        </div>
        <button 
          onClick={() => setIsPipModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[9px] font-black uppercase tracking-wider cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Start PIP Monitor
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {pips.map(p => (
          <div key={p.id} className="p-5 bg-rose-500/5 border border-rose-500/10 rounded-2xl space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase">{p.name}</h4>
                <p className="text-[9px] font-bold text-rose-500 mt-1 uppercase">Issue: {p.issue}</p>
              </div>
              <span className="px-2 py-0.5 bg-rose-500/10 text-rose-500 text-[8px] font-black uppercase tracking-wider rounded">{p.status}</span>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                <span>PIP Targets Completion</span>
                <span className="text-slate-950 dark:text-white">{p.progress}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500" style={{ width: `${p.progress}%` }} />
              </div>
            </div>

            <p className="text-[9.5px] font-bold text-slate-500 leading-normal uppercase">
              Timeline: {p.timeline} • coach: {p.coach} • Targets: {p.targets}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
