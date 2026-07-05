"use client";

import React, { useState, useEffect } from 'react';
import { 
  Calendar, Users, Clock, Video, Copy, Check, ChevronLeft, ChevronRight, 
  VideoOff, MapPin, Search, CalendarDays, ExternalLink, Filter, Sparkles, Building
} from 'lucide-react';
import { IApplicant } from './types';
import { cn } from "@/lib/utils";

interface InterviewsSchedulerProps {
  allApplicantsList: IApplicant[];
}

export default function InterviewsScheduler({ allApplicantsList }: InterviewsSchedulerProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Extract all scheduled interviews from active candidates
  const scheduledList = allApplicantsList.flatMap(app => 
    (app.interviews || []).map((int: any) => ({
      ...int,
      candidateName: app.name,
      jobTitle: app.jobTitle || 'General Application'
    }))
  );

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  // Get first day of month (0 = Sun, 1 = Mon, etc.)
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

  // Get total days in month
  const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Reset selected day when month changes
  useEffect(() => {
    setSelectedDay(null);
  }, [currentMonth, currentYear]);

  const getInterviewDayInfo = (dateStr: string) => {
    if (!dateStr) return null;
    const parts = dateStr.split('-');
    if (parts.length !== 3) return null;
    return {
      year: parseInt(parts[0], 10),
      month: parseInt(parts[1], 10) - 1, // convert to 0-indexed
      day: parseInt(parts[2], 10)
    };
  };

  const interviewsThisMonth = scheduledList.filter((int: any) => {
    const info = getInterviewDayInfo(int.date);
    return info && info.year === currentYear && info.month === currentMonth;
  });

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleGoToToday = () => {
    setCurrentDate(new Date());
  };

  const filteredInterviews = scheduledList.filter((int: any) => {
    const matchesSearch = 
      int.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      int.round.toLowerCase().includes(searchQuery.toLowerCase()) ||
      int.interviewer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      int.jobTitle.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedDay !== null) {
      const info = getInterviewDayInfo(int.date);
      return info && info.year === currentYear && info.month === currentMonth && info.day === selectedDay;
    }

    return true;
  });

  const sortedFiltered = [...filteredInterviews].sort((a, b) => {
    const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
    if (dateDiff !== 0) return dateDiff;
    return a.time.localeCompare(b.time);
  });

  const copyToClipboard = (link: string, idx: number) => {
    navigator.clipboard.writeText(link);
    setCopiedIndex(idx);
    setTimeout(() => {
      setCopiedIndex(null);
    }, 2000);
  };

  const getAvatarBg = (name: string) => {
    const colors = [
      'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
      'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
      'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20',
      'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % colors.length;
    return colors[idx];
  };

  return (
    <div className="space-y-6">
      {/* Top statistics overview bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-150/40 dark:border-slate-800 rounded-2xl gap-3 text-left">
        <div>
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-blue-500" /> Dynamic Interview Hub
          </h4>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Automated screening slots synchronized with corporate calendar integrations</p>
        </div>
        <div className="flex items-center gap-4 text-right">
          <div className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-650 dark:text-blue-400 rounded-xl text-[10px] font-black uppercase tracking-wider">
            {interviewsThisMonth.length} Slots Locked in {monthName}
          </div>
          <div className="hidden md:flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-black uppercase text-slate-450 dark:text-slate-400">Calendar Sync Online</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
        {/* Left side: Calendar Scheduler view */}
        <div className="lg:col-span-2 p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-850 pb-4">
            <div className="flex items-center gap-2">
              <button 
                onClick={handlePrevMonth}
                className="w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-850 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white w-28 text-center">
                {monthName} {currentYear}
              </h3>
              <button 
                onClick={handleNextMonth}
                className="w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-850 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button 
                onClick={handleGoToToday}
                className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 border border-transparent dark:border-slate-800 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer"
              >
                Today
              </button>
              {selectedDay !== null && (
                <button 
                  onClick={() => setSelectedDay(null)}
                  className="px-3.5 py-1.5 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-450 border border-rose-100/50 dark:border-rose-900/30 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1"
                >
                  <Filter className="w-3 h-3" /> Clear Filter
                </button>
              )}
            </div>
          </div>

          {/* Monthly grid simulation */}
          <div className="p-4 bg-slate-50/50 dark:bg-slate-850/30 rounded-2xl border border-slate-150/40 dark:border-slate-800">
            <div className="grid grid-cols-7 gap-2 text-center text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">
              <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
            </div>
            <div className="grid grid-cols-7 gap-2.5">
              {/* Empty offsets */}
              {Array.from({ length: firstDayIndex }).map((_, idx) => (
                <div key={`offset-${idx}`} className="aspect-square bg-slate-100/30 dark:bg-slate-800/10 rounded-xl border border-transparent" />
              ))}
              {/* Days */}
              {Array.from({ length: totalDays }).map((_, idx) => {
                const day = idx + 1;
                const isSelected = selectedDay === day;
                const dayInterviews = scheduledList.filter((int: any) => {
                  const info = getInterviewDayInfo(int.date);
                  return info && info.year === currentYear && info.month === currentMonth && info.day === day;
                });
                const hasInterview = dayInterviews.length > 0;

                return (
                  <div 
                    key={idx} 
                    onClick={() => hasInterview && setSelectedDay(isSelected ? null : day)}
                    className={cn(
                      "aspect-square p-2 border rounded-xl flex flex-col justify-between hover:border-blue-500/40 transition-all cursor-pointer text-left relative group",
                      isSelected
                        ? "bg-blue-600 border-blue-600 text-white font-extrabold shadow-md shadow-blue-500/10"
                        : hasInterview
                          ? "bg-blue-500/5 dark:bg-blue-950/20 border-blue-500/20 text-blue-600 dark:text-blue-400 font-extrabold"
                          : "bg-white dark:bg-slate-900 border-slate-105 dark:border-slate-850/60 text-slate-800 dark:text-slate-300"
                    )}
                  >
                    <span className="text-[10px] font-black">{day}</span>
                    {hasInterview && (
                      <div className="flex items-center justify-between mt-auto">
                        <span className={cn(
                          "text-[8px] font-black px-1.5 py-0.5 rounded-md leading-none uppercase tracking-wider",
                          isSelected 
                            ? "bg-white/20 text-white" 
                            : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                        )}>
                          {dayInterviews.length} Round{dayInterviews.length > 1 ? 's' : ''}
                        </span>
                        <span className={cn(
                          "w-1.5 h-1.5 rounded-full shrink-0",
                          isSelected ? "bg-white" : "bg-blue-600"
                        )} />
                      </div>
                    )}

                    {/* Hover details card popup */}
                    {hasInterview && !isSelected && (
                      <div 
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 text-white rounded-xl p-2.5 text-[9px] border border-slate-800 opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none shadow-xl text-left space-y-1.5" 
                        style={{ background: '#0f172a' }}
                      >
                        <p className="font-extrabold border-b border-slate-800 pb-1 mb-1 text-[8.5px] uppercase tracking-wider text-blue-400 flex items-center justify-between">
                          <span>{monthName} {day} Rounds</span>
                          <span>{dayInterviews.length} Total</span>
                        </p>
                        {dayInterviews.map((int: any, i: number) => (
                          <div key={i} className="truncate text-slate-300 border-b border-slate-800/40 pb-1 last:border-b-0 last:pb-0">
                            <strong className="text-white block">{int.candidateName}</strong>
                            <span className="text-[8px] text-slate-400 block">{int.round}</span>
                            <span className="text-[7.5px] text-slate-500 block">{int.time} Evaluator: {int.interviewer.split(' ')[0]}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right side: Interviews List */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm space-y-4 flex flex-col max-h-[440px] overflow-hidden">
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Upcoming Evaluation Slots</h4>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Chronological checklist of upcoming candidate rounds</p>
          </div>

          {/* Search container */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search candidate name, panel..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pr-1">
            {sortedFiltered.map((int: any, idx: number) => {
              const isCompleted = int.completed;
              const isVideo = int.meetingLink && int.meetingLink.trim().length > 0;
              return (
                <div key={idx} className="p-4 bg-slate-50/50 dark:bg-slate-800/30 border border-slate-150/40 dark:border-slate-800/70 hover:border-slate-205 dark:hover:border-slate-700 rounded-2xl space-y-3 transition-all">
                  <div className="flex gap-3 items-start">
                    <div className={cn(
                      "w-9 h-9 rounded-full font-black text-xs flex items-center justify-center shrink-0 border",
                      getAvatarBg(int.candidateName)
                    )}>
                      {int.candidateName.split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <div className="min-w-0 flex-1">
                      <strong className="block text-xs font-black text-slate-900 dark:text-white truncate">{int.candidateName}</strong>
                      <span className="text-[8.5px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider block mt-0.5">{int.jobTitle}</span>
                      <span className="text-[8px] font-bold text-slate-450 dark:text-slate-400 uppercase block mt-0.5">{int.round}</span>
                    </div>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider shrink-0",
                      isCompleted 
                        ? "bg-emerald-500/10 text-emerald-600" 
                        : "bg-amber-500/10 text-amber-600"
                    )}>
                      {isCompleted ? 'Completed' : 'Upcoming'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[9.5px] text-slate-500 font-bold border-t border-slate-100 dark:border-slate-800/60 pt-2.5">
                    <p className="flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5 text-slate-400" /> {int.date}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" /> {int.time}
                    </p>
                    <p className="col-span-2 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" /> {int.interviewer}
                    </p>
                    {int.location && (
                      <p className="col-span-2 flex items-center gap-1.5">
                        {isVideo ? <Video className="w-3.5 h-3.5 text-slate-400" /> : <MapPin className="w-3.5 h-3.5 text-slate-400" />} 
                        <span className="truncate">{int.location}</span>
                      </p>
                    )}
                  </div>

                  {isVideo ? (
                    <div className="flex gap-2 pt-1.5">
                      <a 
                        href={int.meetingLink}
                        target="_blank" 
                        rel="noreferrer"
                        className="flex-1 text-center py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1"
                      >
                        <Video className="w-3 h-3" /> Join {int.meetingLink.includes('zoom.us') ? 'Zoom' : 'Google Meet'} <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                      <button 
                        onClick={() => copyToClipboard(int.meetingLink, idx)}
                        className="px-3.5 py-2 bg-slate-200/60 hover:bg-slate-250 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center"
                      >
                        {copiedIndex === idx ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  ) : (
                    int.location && !isVideo && (
                      <div className="pt-1 text-center border border-slate-100 dark:border-slate-800/80 rounded-xl bg-slate-100/20 p-2 text-[9px] font-bold text-slate-500">
                        In-Person Interview Session
                      </div>
                    )
                  )}
                </div>
              );
            })}

            {sortedFiltered.length === 0 && (
              <div className="py-12 text-center text-slate-400 font-bold uppercase text-[9px] tracking-widest flex flex-col items-center justify-center gap-2">
                <VideoOff className="w-6 h-6 text-slate-350" />
                <span>No interview sessions found</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
