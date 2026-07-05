"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { 
  ChevronLeft, ChevronRight, AlertCircle, Trash2, Calendar, Edit2
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { usePermission } from '@/context/PermissionContext';

interface Holiday {
  title: string;
  date: string;
}

interface HolidaysCalendarProps {
  userRole: string;
  addNotification?: (msg: string) => void;
}

export function HolidaysCalendar({ userRole, addNotification }: HolidaysCalendarProps) {
  const { can } = usePermission();
  const [calDate, setCalDate] = useState(new Date(2026, 4, 1)); // May 2026 default to align with project mock data
  const [systemSettings, setSystemSettings] = useState<any>(null);
  const [selectedHolidayDetail, setSelectedHolidayDetail] = useState<{ date: string; title: string } | null>(null);
  const [newHolidayTitle, setNewHolidayTitle] = useState('');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);
  const [isAddingHoliday, setIsAddingHoliday] = useState(false);

  // Edit states
  const [isEditingSelected, setIsEditingSelected] = useState(false);
  const [editHolidayTitle, setEditHolidayTitle] = useState('');
  const [editHolidayDate, setEditHolidayDate] = useState('');

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/settings/system?t=${Date.now()}`, {
        headers
      });
      if (res.ok) {
        const data = await res.json();
        setSystemSettings(data);
      }
    } catch (e) {
      console.error("Failed to fetch system settings in calendar:", e);
    }
  };

  useEffect(() => {
    fetchSettings();
    // Poll settings every 60 seconds to sync calendar additions/deletions in real time
    const interval = setInterval(fetchSettings, 60000);
    return () => clearInterval(interval);
  }, []);

  const handlePrevMonth = () => {
    setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() - 1, 1));
    setSelectedHolidayDetail(null);
    setIsAddingHoliday(false);
    setIsEditingSelected(false);
  };

  const handleNextMonth = () => {
    setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() + 1, 1));
    setSelectedHolidayDetail(null);
    setIsAddingHoliday(false);
    setIsEditingSelected(false);
  };

  const monthName = calDate.toLocaleString('default', { month: 'long' });
  const yearName = calDate.getFullYear();

  const calendarCells = useMemo(() => {
    const year = calDate.getFullYear();
    const month = calDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDayOfWeek = new Date(year, month, 1).getDay();

    const cells = [];
    // Padding empty cells
    for (let i = 0; i < startDayOfWeek; i++) {
      cells.push({ day: null, dateStr: null, isHoliday: false, holidayTitle: null });
    }
    // Month days
    for (let day = 1; day <= daysInMonth; day++) {
      const dStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const hol = systemSettings?.leave?.holidayCalendar?.find((h: Holiday) => h.date === dStr);
      cells.push({
        day,
        dateStr: dStr,
        isHoliday: !!hol,
        holidayTitle: hol ? hol.title : null
      });
    }
    return cells;
  }, [calDate, systemSettings]);

  const currentMonthHolidays = useMemo(() => {
    const year = calDate.getFullYear();
    const month = calDate.getMonth();
    const prefix = `${year}-${(month + 1).toString().padStart(2, '0')}`;
    return systemSettings?.leave?.holidayCalendar?.filter((h: Holiday) => h.date.startsWith(prefix)) || [];
  }, [calDate, systemSettings]);

  const handleAddHoliday = async (title: string, dateStr: string) => {
    if (!title.trim() || !dateStr) return;
    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const existingCalendar = systemSettings?.leave?.holidayCalendar || [];
      if (existingCalendar.some((h: Holiday) => h.date === dateStr)) {
        alert("This date is already a holiday.");
        return;
      }

      const updatedCalendar = [...existingCalendar, { title: title.trim(), date: dateStr }];
      const updatedLeave = {
        ...(systemSettings?.leave || {}),
        holidayCalendar: updatedCalendar
      };

      const payload = {
        ...systemSettings,
        leave: updatedLeave
      };

      const res = await fetch('/api/settings/system', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const resData = await res.json();
        setSystemSettings(resData.settings);
        if (addNotification) addNotification(`Added holiday: "${title}" on ${dateStr}`);
      }
    } catch (e) {
      console.error("Failed to add holiday:", e);
    }
  };

  const handleEditHoliday = async (originalDate: string, newTitle: string, newDateStr: string) => {
    if (!newTitle.trim() || !newDateStr) return;
    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const existingCalendar = systemSettings?.leave?.holidayCalendar || [];
      
      // Validate date collision if date was changed
      if (originalDate !== newDateStr && existingCalendar.some((h: Holiday) => h.date === newDateStr)) {
        alert("The new date is already a holiday.");
        return;
      }

      const updatedCalendar = existingCalendar.map((h: Holiday) => {
        if (h.date === originalDate) {
          return { title: newTitle.trim(), date: newDateStr };
        }
        return h;
      });

      const updatedLeave = {
        ...(systemSettings?.leave || {}),
        holidayCalendar: updatedCalendar
      };

      const payload = {
        ...systemSettings,
        leave: updatedLeave
      };

      const res = await fetch('/api/settings/system', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const resData = await res.json();
        setSystemSettings(resData.settings);
        setSelectedHolidayDetail({ date: newDateStr, title: newTitle.trim() });
        setIsEditingSelected(false);
        if (addNotification) addNotification(`Updated holiday to "${newTitle}" on ${newDateStr}`);
      }
    } catch (e) {
      console.error("Failed to edit holiday:", e);
    }
  };

  const handleDeleteHoliday = async (dateStr: string) => {
    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const existingCalendar = systemSettings?.leave?.holidayCalendar || [];
      const updatedCalendar = existingCalendar.filter((h: Holiday) => h.date !== dateStr);
      const updatedLeave = {
        ...(systemSettings?.leave || {}),
        holidayCalendar: updatedCalendar
      };

      const payload = {
        ...systemSettings,
        leave: updatedLeave
      };

      const res = await fetch('/api/settings/system', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const resData = await res.json();
        setSystemSettings(resData.settings);
        if (addNotification) addNotification(`Removed holiday on ${dateStr}`);
      }
    } catch (e) {
      console.error("Failed to delete holiday:", e);
    }
  };

  return (
    <div className="relative overflow-hidden group/card p-4 border border-slate-200/50 dark:border-slate-800/80 shadow-md rounded-2xl space-y-3 bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900/90 dark:to-slate-950/70" style={{ overflow: 'visible' }}>
      {/* Ambient glassmorphic glow bubbles */}
      <div 
        className="absolute -right-8 -top-8 w-24 h-24 rounded-full opacity-[0.03] group-hover/card:opacity-[0.06] transition-all duration-500 blur-xl pointer-events-none"
        style={{ backgroundColor: 'rgba(99, 102, 241, 0.4)' }}
      />
      <div 
        className="absolute -left-6 -bottom-6 w-16 h-16 rounded-full opacity-[0.02] group-hover/card:opacity-[0.04] transition-all duration-500 blur-lg pointer-events-none"
        style={{ backgroundColor: 'rgba(99, 102, 241, 0.3)' }}
      />

      <div className="relative z-10 flex justify-between items-center">
        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white font-sans">Holidays Calendar</h3>
          <p className="text-[8.5px] font-bold text-slate-400 mt-0.5 uppercase">View corporate holidays</p>
        </div>
        <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200/30 dark:border-slate-750">
          <button onClick={handlePrevMonth} className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-650 dark:text-slate-300 cursor-pointer border-none bg-transparent">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 px-2">{monthName} {yearName}</span>
          <button onClick={handleNextMonth} className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-650 dark:text-slate-300 cursor-pointer border-none bg-transparent">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-7 gap-1 text-center text-[8.5px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
        <div>S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div>
      </div>
      <div className="relative z-10 grid grid-cols-7 gap-1">
        {calendarCells.map((cell, idx) => {
          if (!cell.day) return <div key={`empty-${idx}`} className="h-7" />;
          // Determine which row this cell is in (0-indexed)
          const rowIndex = Math.floor(idx / 7);
          const colIndex = idx % 7;
          const showBelow = rowIndex === 0; // first row: tooltip goes below
          const tooltipLeft = colIndex <= 1; // near left edge: align left
          const tooltipRight = colIndex >= 5; // near right edge: align right

          return (
            <div key={`day-${cell.day}`} className="relative group flex justify-center items-center">
              <button
                onClick={() => {
                  if (cell.isHoliday) {
                    setSelectedHolidayDetail({ date: cell.dateStr!, title: cell.holidayTitle! });
                    setIsEditingSelected(false);
                  } else {
                    setSelectedHolidayDetail(null);
                    setIsEditingSelected(false);
                    if (can('leave.holiday_calendar')) {
                      setSelectedCalendarDate(cell.dateStr);
                      setIsAddingHoliday(true);
                    }
                  }
                }}
                className={cn(
                  "h-7 w-7 rounded-lg flex items-center justify-center text-[10.5px] font-black cursor-pointer transition-all hover:scale-105 active:scale-95",
                  cell.isHoliday
                    ? "bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-md shadow-red-500/35 border border-red-400/40"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200"
                )}
              >
                {cell.day}
              </button>

              {/* Premium Tooltip - smart positioning */}
              {cell.isHoliday && (
                <div className={cn(
                  "absolute z-[200] w-48 invisible group-hover:visible opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 flex flex-col items-center pointer-events-none transition-all duration-200",
                  showBelow ? "top-full mt-2" : "bottom-full mb-2",
                  showBelow ? "flex-col" : "flex-col-reverse",
                  tooltipLeft ? "left-0" : tooltipRight ? "right-0" : "left-1/2 -translate-x-1/2"
                )}>
                  {showBelow ? (
                    <>
                      <div className="w-2.5 h-2.5 rotate-45 -mb-1.5 shrink-0 border-l border-t border-slate-700" style={{ background: '#0f172a' }} />
                      <div className="px-3 py-2.5 rounded-xl text-[10px] font-bold shadow-2xl border border-slate-700/60 text-center leading-snug w-full" style={{ background: '#0f172a', color: '#fff' }}>
                        <p className="font-black text-red-400 uppercase tracking-widest text-[8px] mb-1">Corporate Holiday</p>
                        <p className="line-clamp-2" style={{ color: 'rgba(255,255,255,0.9)' }}>{cell.holidayTitle}</p>
                        <p className="font-mono mt-1" style={{ fontSize: '7.5px', color: 'rgba(255,255,255,0.5)' }}>{cell.dateStr}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="px-3 py-2.5 rounded-xl text-[10px] font-bold shadow-2xl border border-slate-700/60 text-center leading-snug w-full" style={{ background: '#0f172a', color: '#fff' }}>
                        <p className="font-black text-red-400 uppercase tracking-widest text-[8px] mb-1">Corporate Holiday</p>
                        <p className="line-clamp-2" style={{ color: 'rgba(255,255,255,0.9)' }}>{cell.holidayTitle}</p>
                        <p className="font-mono mt-1" style={{ fontSize: '7.5px', color: 'rgba(255,255,255,0.5)' }}>{cell.dateStr}</p>
                      </div>
                      <div className="w-2.5 h-2.5 rotate-45 -mt-1.5 shrink-0 border-r border-b border-slate-700" style={{ background: '#0f172a' }} />
                    </>
                  )}
                </div>
              )}

              {!cell.isHoliday && can('leave.holiday_calendar') && (
                <div className={cn(
                  "absolute z-[200] w-36 invisible group-hover:visible opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 flex flex-col items-center pointer-events-none transition-all duration-200",
                  showBelow ? "top-full mt-2" : "bottom-full mb-2",
                  showBelow ? "flex-col" : "flex-col-reverse",
                  tooltipLeft ? "left-0" : tooltipRight ? "right-0" : "left-1/2 -translate-x-1/2"
                )}>
                  {showBelow ? (
                    <>
                      <div className="w-2 h-2 rotate-45 -mb-1 shrink-0 border-l border-t border-slate-700" style={{ background: '#0f172a' }} />
                      <div className="px-2.5 py-1.5 rounded-xl text-[9px] font-bold shadow-2xl border border-slate-700/60 text-center leading-snug w-full" style={{ background: '#0f172a' }}>
                        <p className="font-extrabold uppercase tracking-wider" style={{ color: '#94a3b8' }}>Click to add holiday</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="px-2.5 py-1.5 rounded-xl text-[9px] font-bold shadow-2xl border border-slate-700/60 text-center leading-snug w-full" style={{ background: '#0f172a' }}>
                        <p className="font-extrabold uppercase tracking-wider" style={{ color: '#94a3b8' }}>Click to add holiday</p>
                      </div>
                      <div className="w-2 h-2 rotate-45 -mt-1 shrink-0 border-r border-b border-slate-700" style={{ background: '#0f172a' }} />
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Holiday Detail callout / Edit Form */}
      {selectedHolidayDetail && (
        <div className="p-4 bg-red-50/50 dark:bg-red-950/10 border border-red-100/40 dark:border-red-900/30 rounded-[1.5rem] space-y-3 transition-all">
          {isEditingSelected && can('leave.holiday_calendar') ? (
            <div className="space-y-3">
              <div className="text-left">
                <p className="text-[10px] font-black uppercase text-slate-900 dark:text-white leading-none">Edit Holiday</p>
                <p className="text-[8.5px] text-slate-400 font-mono mt-1.5 leading-none">Original: {selectedHolidayDetail.date}</p>
              </div>
              <div className="space-y-1.5">
                <label className="block text-[8.5px] font-black uppercase text-slate-450 text-left">Holiday Date</label>
                <input
                  type="date"
                  value={editHolidayDate}
                  onChange={(e) => setEditHolidayDate(e.target.value)}
                  className="saas-input w-full px-3 py-2 text-xs bg-white text-slate-900 dark:text-white border border-slate-200"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[8.5px] font-black uppercase text-slate-455 text-left">Reason / Title</label>
                <input
                  type="text"
                  placeholder="Holiday Reason (Christmas, Independence Day...)"
                  value={editHolidayTitle}
                  onChange={(e) => setEditHolidayTitle(e.target.value)}
                  className="saas-input w-full px-3 py-2 text-xs bg-white text-slate-900 dark:text-white border border-slate-200"
                />
              </div>
              <div className="flex gap-2 justify-end pt-1">
                <button
                  onClick={() => setIsEditingSelected(false)}
                  className="px-3 py-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-400 rounded-lg text-[9px] font-black uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleEditHoliday(selectedHolidayDetail.date, editHolidayTitle, editHolidayDate);
                  }}
                  className="px-4.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[9px] font-black uppercase cursor-pointer shadow-md shadow-blue-500/10"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="text-left">
                  <p className="text-[9px] font-black uppercase text-red-600 dark:text-red-400 leading-none">Holiday Reason</p>
                  <p className="text-[10px] font-bold text-slate-800 dark:text-white mt-1.5 leading-tight">
                    {selectedHolidayDetail.title}
                  </p>
                  <p className="text-[8.5px] text-slate-400 font-mono mt-1 leading-none">{selectedHolidayDetail.date}</p>
                </div>
              </div>
              
              {can('leave.holiday_calendar') && (
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setEditHolidayTitle(selectedHolidayDetail.title);
                      setEditHolidayDate(selectedHolidayDetail.date);
                      setIsEditingSelected(true);
                    }}
                    className="p-1.5 bg-slate-100 hover:bg-slate-250 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-[9.5px] font-black uppercase cursor-pointer border-none flex items-center gap-1 shadow-sm"
                    title="Edit Holiday"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Do you want to delete holiday "${selectedHolidayDetail.title}" on ${selectedHolidayDetail.date}?`)) {
                        handleDeleteHoliday(selectedHolidayDetail.date);
                        setSelectedHolidayDetail(null);
                      }
                    }}
                    className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-500 rounded-lg cursor-pointer border-none flex items-center justify-center shadow-sm"
                    title="Delete Holiday"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Add Holiday Form Inline (Admin Only) */}
      {can('leave.holiday_calendar') && isAddingHoliday && selectedCalendarDate && (
        <div className="p-4 bg-slate-50 dark:bg-slate-850/60 border border-slate-200/50 dark:border-slate-850 rounded-2xl space-y-3">
          <div className="text-left">
            <p className="text-[10px] font-black uppercase text-slate-900 dark:text-white leading-none">Add Holiday</p>
            <p className="text-[8px] text-slate-450 font-mono mt-1 leading-none">{selectedCalendarDate}</p>
          </div>
          <input
            type="text"
            placeholder="Holiday Name (e.g. Christmas)..."
            value={newHolidayTitle}
            onChange={(e) => setNewHolidayTitle(e.target.value)}
            className="saas-input w-full px-3 py-2 text-xs bg-white text-slate-900 dark:text-white border border-slate-200"
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => {
                setIsAddingHoliday(false);
                setNewHolidayTitle('');
                setSelectedCalendarDate(null);
              }}
              className="px-3 py-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-400 rounded-lg text-[9px] font-black uppercase cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (!newHolidayTitle.trim()) return;
                handleAddHoliday(newHolidayTitle, selectedCalendarDate);
                setIsAddingHoliday(false);
                setNewHolidayTitle('');
                setSelectedCalendarDate(null);
              }}
              className="px-4.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[9px] font-black uppercase cursor-pointer shadow-md shadow-blue-500/10"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* Holiday List for selected month */}
      <div className="relative z-10 mt-3 space-y-1.5 border-t border-slate-100 dark:border-slate-800/40 pt-3">
        <h5 className="text-[8px] font-black uppercase text-slate-400 tracking-wider text-left">Holidays in {monthName}</h5>
        {currentMonthHolidays.length === 0 ? (
          <p className="text-[8px] text-slate-400 font-medium text-left">No holidays scheduled this month.</p>
        ) : (
          <div className="space-y-1.5 max-h-[100px] overflow-y-auto pr-1 no-scrollbar">
            {currentMonthHolidays.map((h: Holiday) => {
              const isSelected = selectedHolidayDetail?.date === h.date;
              return (
                <div 
                  key={h.date} 
                  onClick={() => {
                    setSelectedHolidayDetail({ date: h.date, title: h.title });
                    setIsEditingSelected(false);
                  }}
                  className={cn(
                    "flex justify-between items-center p-2 rounded-xl border cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99]",
                    isSelected 
                      ? "bg-red-50/70 dark:bg-red-950/20 border-red-200/50 dark:border-red-900/45 shadow-sm"
                      : "bg-red-50/30 dark:bg-red-950/10 border-red-100/30 dark:border-red-900/20 hover:bg-red-50/50 dark:hover:bg-red-950/15"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    <div className="text-left">
                      <p className="text-[9px] font-black text-red-600 dark:text-red-400 uppercase leading-none">{h.title}</p>
                      <p className="text-[7.5px] text-slate-450 font-mono mt-0.5 leading-none">{h.date}</p>
                    </div>
                  </div>
                  {can('leave.holiday_calendar') && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Do you want to delete holiday "${h.title}" on ${h.date}?`)) {
                          handleDeleteHoliday(h.date);
                          if (selectedHolidayDetail?.date === h.date) {
                            setSelectedHolidayDetail(null);
                          }
                        }
                      }}
                      className="text-slate-400 hover:text-rose-500 cursor-pointer p-1 border-none bg-transparent flex items-center justify-center"
                      title="Delete Holiday"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
