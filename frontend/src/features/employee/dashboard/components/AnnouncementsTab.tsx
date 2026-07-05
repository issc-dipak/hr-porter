"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, Clock, MapPin, CheckCircle2, AlertCircle, Sparkles, Loader2,
  Bookmark, Megaphone, Plus, User, Eye, Download, Users, XCircle, Grid, List, ChevronLeft, ChevronRight, Image as ImageIcon
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from 'framer-motion';

interface AnnouncementsTabProps {
  announcements: any[];
}

export function AnnouncementsTab({ announcements }: AnnouncementsTabProps) {
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [rsvpStates, setRsvpStates] = useState<{[eventId: string]: any}>({});
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());

  const fetchRsvpSummary = async (eventId: string) => {
    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`/api/announcements/${eventId}/rsvp`, { headers });
      if (res.ok) {
        const data = await res.json();
        setRsvpStates(prev => ({
          ...prev,
          [eventId]: data.summary
        }));
      }
    } catch (err) {
      console.error('Failed to sync RSVP:', err);
    }
  };

  useEffect(() => {
    const fetchAllRsvps = async () => {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      await Promise.all(
        announcements.map(async (ann) => {
          if (ann.category === 'Event') {
            try {
              const res = await fetch(`/api/announcements/${ann._id}/rsvp`, { headers });
              if (res.ok) {
                const data = await res.json();
                setRsvpStates(prev => ({
                  ...prev,
                  [ann._id]: data.summary
                }));
              }
            } catch (err) {
              console.error(err);
            }
          }
        })
      );
    };

    if (announcements.length > 0) {
      fetchAllRsvps();
    }
  }, [announcements]);

  const handleRsvpSubmit = async (eventId: string, status: 'Going' | 'Maybe' | 'Not Attending') => {
    try {
      const token = localStorage.getItem('hr_system_token');
      const res = await fetch(`/api/announcements/${eventId}/rsvp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        await fetchRsvpSummary(eventId);
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to submit RSVP');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const downloadIcsFile = (event: any) => {
    const title = event.title.replace(/,/g, '\\,');
    const description = event.content.replace(/\n/g, '\\n').replace(/,/g, '\\,');
    const location = (event.eventLocation || 'Corporate Headquarters').replace(/,/g, '\\,');
    
    const dateObj = new Date(event.eventDate || new Date());
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    
    const dateStr = `${year}${month}${day}`;
    
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Corporate Event Management//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `SUMMARY:${title}`,
      `UID:${event._id || Date.now()}@hrcore.com`,
      `SEQUENCE:0`,
      `STATUS:CONFIRMED`,
      `TRANSP:OPAQUE`,
      `DTSTART;VALUE=DATE:${dateStr}`,
      `DTEND;VALUE=DATE:${dateStr}`,
      `LOCATION:${location}`,
      `DESCRIPTION:${description}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `${title.replace(/\s+/g, '_')}_invite.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Reminders Widget calculations (Active events scheduled for today or tomorrow)
  const reminders = useMemo(() => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    return announcements.filter(a => {
      if (a.category !== 'Event' || !a.eventDate || a.isCompleted) return false;
      const evD = new Date(a.eventDate).toDateString();
      return evD === today.toDateString() || evD === tomorrow.toDateString();
    });
  }, [announcements]);

  // Calendar View month grid generator
  const calendarGridDays = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    
    // First day of month
    const firstDayIndex = new Date(year, month, 1).getDay();
    // Days in current month
    const totalDays = new Date(year, month + 1, 0).getDate();
    // Days in previous month
    const prevTotalDays = new Date(year, month, 0).getDate();

    const days = [];

    // Previous month filler days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({ day: prevTotalDays - i, isCurrentMonth: false, date: new Date(year, month - 1, prevTotalDays - i) });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      days.push({ day: i, isCurrentMonth: true, date: new Date(year, month, i) });
    }

    // Next month filler days to complete 42 calendar grid cells
    const remainingCells = 42 - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      days.push({ day: i, isCurrentMonth: false, date: new Date(year, month + 1, i) });
    }

    return days;
  }, [calendarDate]);

  const handlePrevMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1));
  };

  return (
    <div className="space-y-6 text-left max-w-5xl mx-auto">
      {/* Tab Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-black uppercase tracking-widest text-slate-900 dark:text-white font-outfit">Corporate Hub & Calendar</h2>
          <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider leading-none">Official announcements, policies, and interactive event scheduling.</p>
        </div>

        {/* View Mode Toggles */}
        <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800/80">
          <button 
            onClick={() => setViewMode('list')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest cursor-pointer transition-all border-none flex items-center gap-1 shrink-0",
              viewMode === 'list' ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
            )}
          >
            <List className="w-3.5 h-3.5" /> List view
          </button>
          <button 
            onClick={() => setViewMode('calendar')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest cursor-pointer transition-all border-none flex items-center gap-1 shrink-0",
              viewMode === 'calendar' ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
            )}
          >
            <Grid className="w-3.5 h-3.5" /> Calendar grid
          </button>
        </div>
      </div>

      {/* Today Reminders Alert Widget */}
      {reminders.length > 0 && (
        <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 p-4 rounded-2xl flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-blue-500 animate-pulse shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-blue-500 dark:text-blue-400 text-[10px] font-black uppercase tracking-wider">Upcoming reminder</p>
            <p className="text-slate-700 dark:text-slate-200 text-xs font-semibold truncate mt-0.5">
              Today/Tomorrow: "{reminders[0].title}" scheduled at {reminders[0].eventTime} in {reminders[0].eventLocation}.
            </p>
          </div>
        </div>
      )}

      {/* MAIN RENDER TABS */}
      {viewMode === 'list' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {announcements.length === 0 ? (
            <div className="saas-card bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900/90 dark:to-slate-950/70 border border-slate-205/30 dark:border-slate-800/80 rounded-[28px] py-20 text-center text-slate-400 dark:text-slate-550 text-[10px] font-black uppercase tracking-widest">
              No bulletins published to the directory.
            </div>
          ) : (
            announcements.map((ann) => {
              const isEv = ann.category === 'Event';
              const rsvp = rsvpStates[ann._id];
              const maxReached = ann.maxParticipants && rsvp && rsvp.going >= ann.maxParticipants;
              const userStatus = rsvp?.userRsvp || null;

              return (
                <div 
                  key={ann._id || ann.id} 
                  className="saas-card bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900/90 dark:to-slate-950/70 border border-slate-205/30 dark:border-slate-800/80 rounded-[28px] relative overflow-hidden shadow-md transition-all duration-300 group"
                >
                  {ann.category === 'Urgent' && (
                    <div className="absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-rose-500 to-pink-600 z-10" />
                  )}

                  {isEv && ann.eventBanner && (
                    <div className="h-32 w-full relative overflow-hidden">
                      <img src={ann.eventBanner} alt="Banner" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent" />
                      
                      <span className={cn(
                        "absolute top-4 right-4 px-2.5 py-0.5 rounded-full text-[8.5px] font-black uppercase border tracking-wider",
                        ann.isCompleted 
                          ? "bg-slate-900 border-slate-750 text-slate-400" 
                          : "bg-emerald-950/90 border-emerald-500/30 text-emerald-400"
                      )}>
                        {ann.isCompleted ? 'Completed Event' : 'Scheduled Event'}
                      </span>
                    </div>
                  )}

                  <div className="p-4 space-y-3.5">
                    <div className="flex justify-between items-center text-[9px] text-slate-455 font-bold uppercase tracking-wider">
                      <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase border tracking-widest ${
                        ann.category === 'Urgent' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                        ann.category === 'Policy' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                        ann.category === 'Event' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' :
                        'bg-slate-500/10 text-slate-500 border-slate-500/20'
                      }`}>
                        {ann.category === 'Event' ? ann.eventType || 'Event' : ann.category}
                      </span>
                      <span>{new Date(ann.createdAt).toLocaleDateString()}</span>
                    </div>

                    <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight leading-tight">{ann.title}</h4>
                    
                    <p className="text-xs text-slate-500 dark:text-slate-400 whitespace-pre-line leading-relaxed">{ann.content}</p>

                    {/* Event scheduling block details */}
                    {isEv && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-slate-50 dark:bg-slate-950/45 p-3 border border-slate-100 dark:border-slate-850 rounded-2xl text-[10px] text-slate-500 mt-3.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <Calendar className="w-4 h-4 text-blue-500 shrink-0" />
                          <span className="truncate font-semibold">{ann.eventDate ? new Date(ann.eventDate).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2 min-w-0">
                          <Clock className="w-4 h-4 text-blue-500 shrink-0" />
                          <span className="truncate font-semibold">{ann.eventTime}</span>
                        </div>
                        <div className="flex items-center gap-2 min-w-0">
                          <MapPin className="w-4 h-4 text-blue-500 shrink-0" />
                          <span className="truncate font-semibold">{ann.eventLocation}</span>
                        </div>
                      </div>
                    )}

                    {/* RSVP selection buttons */}
                    {isEv && ann.rsvpRequired && !ann.isCompleted && (
                      <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 mt-4 space-y-3">
                        <div className="flex justify-between items-center text-[10px] text-slate-450">
                          <span className="flex items-center gap-1 uppercase font-black tracking-wider">
                            <Users className="w-3.5 h-3.5" />
                            Participants: {rsvp ? rsvp.going : 0} {ann.maxParticipants ? ` / ${ann.maxParticipants}` : ''}
                          </span>
                          
                          {maxReached && <span className="text-rose-500 font-bold uppercase tracking-wider">Fully Booked</span>}
                        </div>

                        <div className="flex gap-2">
                          {[
                            { label: 'Going', status: 'Going', color: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
                            { label: 'Maybe', status: 'Maybe', color: 'bg-amber-600 hover:bg-amber-700 text-white' },
                            { label: 'Decline', status: 'Not Attending', color: 'bg-rose-600 hover:bg-rose-700 text-white' }
                          ].map((btn) => {
                             const active = userStatus === btn.status;
                             const isGoingAndFull = btn.status === 'Going' && maxReached && !active;

                             return (
                               <button
                                 key={btn.status}
                                 type="button"
                                 disabled={isGoingAndFull}
                                 onClick={() => handleRsvpSubmit(ann._id, btn.status as any)}
                                 className={cn(
                                   "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer border flex-1 text-center justify-center",
                                   active 
                                     ? btn.color 
                                     : "bg-slate-50/50 hover:bg-slate-100 border-slate-100 text-slate-500 dark:bg-slate-900 dark:hover:bg-slate-800 dark:border-slate-800"
                                 )}
                               >
                                 {btn.label}
                               </button>
                             );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Completion Summary & Media Gallery */}
                    {isEv && ann.isCompleted && (
                      <div className="bg-slate-50/50 dark:bg-slate-955/20 p-4 border border-slate-100 dark:border-slate-855 rounded-2xl space-y-3 mt-4 text-xs">
                        <div className="flex items-center gap-1 text-[9px] font-black uppercase text-emerald-500 tracking-wider">
                          <CheckCircle2 className="w-4 h-4" /> Published event recap
                        </div>
                        
                        {ann.eventSummary && (
                          <p className="text-slate-600 dark:text-slate-350 italic">"{ann.eventSummary}"</p>
                        )}

                        {ann.eventPhotos && ann.eventPhotos.length > 0 && (
                          <div className="grid grid-cols-4 gap-2 pt-2">
                            {ann.eventPhotos.map((photo: string, idx: number) => (
                              <a key={idx} href={photo} target="_blank" rel="noreferrer" className="h-16 rounded-xl overflow-hidden border border-slate-150 dark:border-slate-800/80 hover:opacity-90 transition-opacity">
                                <img src={photo} alt="Gallery" className="w-full h-full object-cover" />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="border-t border-slate-150/40 dark:border-slate-800/60 pt-3 mt-4 flex justify-between items-center text-[8.5px] font-black text-slate-400 uppercase tracking-widest">
                      <span>By: {ann.postedBy}</span>
                      
                      {isEv && (
                        <button
                          onClick={() => downloadIcsFile(ann)}
                          className="text-blue-500 hover:underline border-none bg-transparent cursor-pointer flex items-center gap-1 p-0"
                        >
                          <Download className="w-3.5 h-3.5" /> Calendar Invite
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* CALENDAR MONTH GRID VIEW */
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 shadow-md">
          {/* Calendar Month Header */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
              {calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h3>
            <div className="flex gap-2">
              <button 
                onClick={handlePrevMonth}
                className="p-2 border border-slate-150 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-450 dark:text-slate-300 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={handleNextMonth}
                className="p-2 border border-slate-150 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-450 dark:text-slate-300 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days of Week */}
          <div className="grid grid-cols-7 gap-2 text-center text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-100 dark:border-slate-800 pb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <div key={d}>{d}</div>)}
          </div>

          {/* Month Cell Grid */}
          <div className="grid grid-cols-7 gap-2">
            {calendarGridDays.map((cell, idx) => {
              const dateStr = cell.date.toDateString();
              const dayEvents = announcements.filter(a => {
                return a.category === 'Event' && a.eventDate && new Date(a.eventDate).toDateString() === dateStr;
              });

              return (
                <div 
                  key={idx} 
                  className={cn(
                    "min-h-[85px] border border-slate-100 dark:border-slate-800/60 rounded-2xl p-2 flex flex-col justify-between items-stretch",
                    cell.isCurrentMonth ? "bg-slate-50/20 dark:bg-slate-950/10" : "opacity-35 pointer-events-none"
                  )}
                >
                  <span className={cn(
                    "text-[10px] font-black uppercase text-left",
                    cell.date.toDateString() === new Date().toDateString() ? "text-blue-500 font-black scale-105" : "text-slate-400"
                  )}>
                    {cell.day}
                  </span>

                  <div className="space-y-1 mt-2">
                    {dayEvents.map((ev) => (
                      <div
                        key={ev._id}
                        onClick={() => {
                          setSelectedEvent(ev);
                          setShowModal(true);
                        }}
                        className="p-1 text-[8px] bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-md font-bold truncate max-w-full cursor-pointer hover:bg-blue-500 hover:text-white transition-all text-left"
                        title={ev.title}
                      >
                        {ev.eventType || 'Event'}: {ev.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Calendar Specific Detail Modal popup */}
      <AnimatePresence>
        {showModal && selectedEvent && (
          <div className="fixed inset-0 z-[9999] bg-slate-950/60 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative border border-slate-105 dark:border-slate-800"
            >
              {selectedEvent.eventBanner && (
                <div className="h-32 w-full relative">
                  <img src={selectedEvent.eventBanner} alt="Banner" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
                </div>
              )}

              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center text-[9px] text-slate-450 font-bold uppercase tracking-wider">
                  <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-lg">{selectedEvent.eventType || 'Event'}</span>
                  <span>{new Date(selectedEvent.eventDate).toLocaleDateString()}</span>
                </div>

                <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{selectedEvent.title}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{selectedEvent.content}</p>

                <div className="bg-slate-50 dark:bg-slate-950 p-3 border border-slate-100 dark:border-slate-850 rounded-xl text-[10.5px] space-y-1.5 text-slate-500">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span>Time: {selectedEvent.eventTime}</span>
                  </div>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="truncate">Location: {selectedEvent.eventLocation}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-150/70 dark:border-slate-800 flex justify-between items-center">
                <button
                  onClick={() => downloadIcsFile(selectedEvent)}
                  className="px-3.5 py-1.5 bg-blue-500/10 hover:bg-blue-500 text-blue-500 hover:text-white border border-blue-500/20 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
                >
                  <Download className="w-3 h-3 inline mr-1" /> Add to Calendar
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-white border-none rounded-xl text-[9px] font-black uppercase tracking-wider cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
