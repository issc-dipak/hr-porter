"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, Activity, FolderKanban, CheckSquare, Users, DollarSign, Shield, FileText, MessageSquare, RefreshCcw } from 'lucide-react';
import { motion } from 'framer-motion';

const API = '';
function getHeaders() {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('hr_system_token') || '';
  const companyId = localStorage.getItem('companyId') || 'company_001';
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'x-company-id': companyId };
}

const ENTITY_ICONS: Record<string, any> = {
  project: FolderKanban,
  task: CheckSquare,
  member: Users,
  budget: DollarSign,
  risk: Shield,
  file: FileText,
  comment: MessageSquare,
  sprint: Activity,
  milestone: Activity,
};

const ENTITY_COLORS: Record<string, string> = {
  project: 'bg-violet-500/10 text-violet-400',
  task: 'bg-blue-500/10 text-blue-400',
  member: 'bg-emerald-500/10 text-emerald-400',
  budget: 'bg-amber-500/10 text-amber-400',
  risk: 'bg-red-500/10 text-red-400',
  file: 'bg-cyan-500/10 text-cyan-400',
  comment: 'bg-indigo-500/10 text-indigo-400',
  sprint: 'bg-purple-500/10 text-purple-400',
  milestone: 'bg-pink-500/10 text-pink-400',
};

interface Props {
  projectId: string;
}

export default function ActivityTab({ projectId }: Props) {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/projects/${projectId}/activity?limit=100`, { headers: getHeaders() as any });
      const json = await res.json();
      if (json.success) setActivities(json.data || []);
    } catch (_) {}
    setLoading(false);
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-white">Activity Log</h2>
        <button onClick={load} className="flex items-center gap-2 text-xs text-slate-400 hover:text-white px-3 py-2 rounded-xl bg-slate-800 transition-colors">
          <RefreshCcw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-violet-400 animate-spin" /></div>
      ) : activities.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Activity className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>No activity logged yet</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-px bg-slate-800" />

          <div className="space-y-1">
            {activities.map((activity, i) => {
              const EntityIcon = ENTITY_ICONS[activity.entity] || Activity;
              const entityColor = ENTITY_COLORS[activity.entity] || 'bg-slate-500/10 text-slate-400';

              return (
                <motion.div key={activity._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}
                  className="flex gap-4 py-3 pl-3">
                  {/* Icon */}
                  <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${entityColor} mt-0.5`}>
                    <EntityIcon className="w-3 h-3" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {activity.actorName && (
                          <div className="w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center text-xs text-white font-bold flex-shrink-0">
                            {activity.actorName.charAt(0)}
                          </div>
                        )}
                        <p className="text-sm text-slate-300">
                          <span className="font-semibold text-white">{activity.actorName || 'System'}</span>
                          {' '}{activity.action}
                          {activity.entityName && (
                            <span className="font-medium text-slate-200"> "{activity.entityName}"</span>
                          )}
                        </p>
                      </div>
                      <span className="text-xs text-slate-500 flex-shrink-0">{formatTime(activity.createdAt)}</span>
                    </div>

                    {/* Old → New value */}
                    {activity.oldValue && activity.newValue && (
                      <div className="flex items-center gap-2 mt-1 ml-7">
                        <span className="text-xs text-slate-500 line-through">{activity.oldValue}</span>
                        <span className="text-xs text-slate-500">→</span>
                        <span className="text-xs text-violet-400 font-medium">{activity.newValue}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
