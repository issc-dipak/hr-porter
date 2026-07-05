"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";
import { Gift, Send, CheckCircle, Loader2, AlertCircle, Cake } from 'lucide-react';

const AVATAR_COLORS = [
  'from-blue-500 to-indigo-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-emerald-500 to-teal-600',
  'from-violet-500 to-purple-600',
  'from-cyan-500 to-sky-600',
];

interface BirthdayEmployee {
  _id: string;
  name: string;
  email: string;
  department: string;
  profilePicture: string;
  daysUntil: number;
  isToday: boolean;
  birthdayDisplay: string;
}

export const EmployeeHighlights = () => {
  const [employees, setEmployees] = useState<BirthdayEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBirthdays();
  }, []);

  const fetchBirthdays = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('hr_system_token');
      const res = await fetch('/api/messages/birthday', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.slice(0, 5));
      }
    } catch (err) {
      console.error('Failed to fetch birthdays:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendWishes = async () => {
    const todayBirthdays = employees.filter(e => e.isToday);
    if (todayBirthdays.length === 0) {
      // If no one's birthday is today, offer to send to the first upcoming person
      setError("No birthdays today. Wishes will be sent to upcoming birthday employees.");
      setTimeout(() => setError(null), 4000);
      return;
    }

    try {
      setSending(true);
      const token = localStorage.getItem('hr_system_token');
      const res = await fetch('/api/messages/birthday', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ employeeEmails: todayBirthdays.map(e => e.email) }),
      });
      const data = await res.json();
      if (res.ok) {
        setSent(true);
        setSentCount(data.sent || todayBirthdays.length);
        setTimeout(() => { setSent(false); setSentCount(0); }, 4000);
      } else {
        setError(data.error || 'Failed to send wishes');
        setTimeout(() => setError(null), 3000);
      }
    } catch (err) {
      setError('Network error. Try again.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="saas-card bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900/90 dark:to-slate-950/70 border border-slate-205/30 dark:border-slate-800/80 rounded-[24px] p-5 shadow-md relative overflow-hidden group">
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-2.5">
          <h2 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Employee Highlights</h2>
          <span className="px-2 py-0.5 rounded-full text-[7.5px] font-black bg-rose-500/10 text-rose-500 border border-rose-500/25 uppercase tracking-widest shadow-sm">Birthdays</span>
        </div>
        <div className="flex items-center gap-2">
          {!loading && employees.filter(e => e.isToday).length > 0 && (
            <span className="text-[8.5px] font-black text-rose-500 uppercase tracking-widest animate-pulse">Today!</span>
          )}
          <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
        </div>
      </div>

      {/* Birthday List */}
      <div className="space-y-2.5">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-800 animate-pulse">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700" />
                <div className="space-y-1.5">
                  <div className="h-2.5 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
                  <div className="h-2 w-16 bg-slate-100 dark:bg-slate-800 rounded" />
                </div>
              </div>
              <div className="h-3 w-12 bg-slate-100 dark:bg-slate-800 rounded" />
            </div>
          ))
        ) : employees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-3 text-center">
            <div className="p-3 bg-slate-500/5 dark:bg-slate-500/10 rounded-full border border-slate-500/10">
              <Cake className="w-7 h-7 text-slate-405 dark:text-slate-500" />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-900 dark:text-white uppercase tracking-widest">No upcoming birthdays</p>
              <p className="text-[8.5px] text-slate-400 mt-1 max-w-[200px] leading-relaxed mx-auto">Add employee date of birth in their profiles to see corporate highlights</p>
            </div>
          </div>
        ) : (
          employees.map((person, idx) => (
            <motion.div
              key={person._id}
              whileHover={{ x: 3 }}
              className={cn(
                "flex items-center justify-between px-3 py-2 rounded-xl border transition-all duration-300 group cursor-pointer relative overflow-hidden",
                person.isToday
                  ? "border-rose-250 dark:border-rose-900/50 bg-rose-500/5 dark:bg-rose-500/10"
                  : "border-slate-100/40 dark:border-slate-800/40 bg-slate-50/60 dark:bg-slate-850/30 hover:bg-white dark:hover:bg-slate-800/60 hover:border-slate-200 dark:hover:border-slate-700/65"
              )}
            >
              {person.isToday && (
                <div className="absolute inset-0 bg-gradient-to-r from-rose-500/5 to-transparent pointer-events-none" />
              )}
              <div className="flex items-center gap-2.5">
                <div className={cn(
                  "w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center font-black text-white text-[11px] shadow-md group-hover:rotate-3 transition-transform shrink-0 relative p-[2px]",
                  person.isToday ? "from-rose-500 to-pink-600 ring-2 ring-rose-500/20" : AVATAR_COLORS[idx % AVATAR_COLORS.length]
                )}>
                  {person.profilePicture ? (
                    <img src={person.profilePicture} alt={person.name} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    person.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                  )}
                  {person.isToday && (
                    <span className="absolute -top-1.5 -right-1.5 text-xs drop-shadow">🎂</span>
                  )}
                </div>
                <div>
                  <h4 className="font-black text-slate-900 dark:text-white text-[11px] tracking-tight leading-tight uppercase">{person.name}</h4>
                  <p className="text-[8.5px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{person.department}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-black text-rose-600 dark:text-rose-400 tabular-nums leading-tight">{person.birthdayDisplay}</p>
                <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest mt-0.5 block">
                  {person.isToday ? '🎉 Today!' : `${person.daysUntil}d away`}
                </span>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Error / Success feedback */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3.5 flex items-center gap-1.5 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl"
          >
            <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <p className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">{error}</p>
          </motion.div>
        )}
        {sent && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3.5 flex items-center gap-1.5 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl"
          >
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <p className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
              🎉 Birthday wishes sent to {sentCount} employee{sentCount !== 1 ? 's' : ''}! Delivered to inbox.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Send Wishes Button */}
      <button
        onClick={handleSendWishes}
        disabled={sending || loading}
        className={cn(
          "w-full mt-4 py-2 rounded-xl text-[8.5px] font-black uppercase tracking-[0.2em] shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border-none",
          sent
            ? "bg-emerald-600 text-white shadow-emerald-500/10"
            : "bg-gradient-to-r from-blue-650 to-indigo-650 text-white shadow-blue-500/10 hover:shadow-lg hover:shadow-blue-500/15 active:scale-95",
          (sending || loading) && "opacity-60 cursor-not-allowed"
        )}
      >
        {sending ? (
          <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending...</>
        ) : sent ? (
          <><CheckCircle className="w-3.5 h-3.5" /> Wishes Sent!</>
        ) : (
          <><Gift className="w-3.5 h-3.5" /> Send Group Wishes</>
        )}
      </button>
    </div>
  );
};
