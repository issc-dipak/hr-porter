"use client";

import React from 'react';
import { 
  Clock, LogIn, LogOut, Coffee, Activity, Calendar, 
  CheckCircle2, AlertCircle, Sparkles, MapPin, ShieldAlert
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";

interface AttendanceTabProps {
  isCheckedIn: boolean;
  isOnBreak: boolean;
  secondsWorked: number;
  breakSeconds: number;
  totalBreakSeconds: number;
  formatTime: (sec: number) => string;
  handleClockIn: () => void;
  handleClockOut: () => void;
  toggleBreak: () => void;
  recentAttendance: any[];
  checkInTime?: string | null;
  isIdle?: boolean;
  shiftStart?: string;
  shiftEnd?: string;
  maxBreakTime?: string;
  companyName?: string;
}

const calculateTotalBreakTime = (breaks: any[]) => {
  if (!breaks || breaks.length === 0) return '0 Mins';
  
  let totalMinutes = 0;
  
  breaks.forEach(b => {
    try {
      const startStr = b.start;
      const endStr = b.end === '-' || !b.end ? null : b.end;
      
      if (!startStr) return;
      
      const parseTimeToMinutes = (timeStr: string) => {
        const [time, modifier] = timeStr.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        if (modifier === 'PM' && hours < 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0;
        return hours * 60 + minutes;
      };
      
      const startMin = parseTimeToMinutes(startStr);
      let endMin = startMin;
      
      if (endStr) {
        endMin = parseTimeToMinutes(endStr);
      } else {
        const now = new Date();
        const currentHours = now.getHours();
        const currentMinutes = now.getMinutes();
        endMin = currentHours * 60 + currentMinutes;
      }
      
      const diff = endMin - startMin;
      if (diff > 0) {
        totalMinutes += diff;
      }
    } catch (err) {
      console.error("Error parsing break times:", err);
    }
  });
  
  if (totalMinutes === 0) return '0 Mins';
  if (totalMinutes < 60) return `${totalMinutes} Mins`;
  
  const hrs = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
};

export function AttendanceTab({
  isCheckedIn,
  isOnBreak,
  secondsWorked,
  breakSeconds,
  totalBreakSeconds,
  formatTime,
  handleClockIn,
  handleClockOut,
  toggleBreak,
  recentAttendance,
  checkInTime,
  isIdle,
  shiftStart,
  shiftEnd,
  maxBreakTime,
  companyName
}: AttendanceTabProps) {
  const [statusFilter, setStatusFilter] = React.useState('All');
  const [dateSearch, setDateSearch] = React.useState('');

  const filteredAttendance = React.useMemo(() => {
    return recentAttendance.filter((log) => {
      const matchesStatus = statusFilter === 'All' || log.status === statusFilter;
      const matchesDate = !dateSearch || log.date.includes(dateSearch);
      return matchesStatus && matchesDate;
    });
  }, [recentAttendance, statusFilter, dateSearch]);
  
  const displayCheckIn = shiftStart || "09:00 AM";
  const displayCheckOut = shiftEnd || "06:00 PM";

  // Helper to parse time strings like "09:00 AM" or "10:00 AM" to total minutes
  const parseTimeToMinutes = (timeStr: string) => {
    try {
      const parts = timeStr.trim().split(/\s+/);
      const time = parts[0];
      const modifier = parts[1] ? parts[1].toUpperCase() : '';
      let [hours, minutes] = time.split(':').map(Number);
      if (isNaN(hours)) hours = 9;
      if (isNaN(minutes)) minutes = 0;
      if (modifier === 'PM' && hours < 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;
      return hours * 60 + minutes;
    } catch (e) {
      return 9 * 60; // fallback to 9 hours (540 mins)
    }
  };

  const startMin = parseTimeToMinutes(displayCheckIn);
  const endMin = parseTimeToMinutes(displayCheckOut);
  let diffMin = endMin - startMin;
  if (diffMin < 0) {
    diffMin += 24 * 60; // handle overnight shifts
  }
  const shiftDurationSeconds = diffMin * 60;
  const shiftDurationHours = diffMin / 60;

  // Calculate percentage of shift completed
  const shiftProgress = shiftDurationSeconds > 0 
    ? Math.min((secondsWorked / shiftDurationSeconds) * 100, 100) 
    : 0;

  const parsedMaxBreakSeconds = React.useMemo(() => {
    if (!maxBreakTime) return 3600; // fallback to 1 hour (3600s)
    try {
      const parts = maxBreakTime.trim().split(':');
      if (parts.length === 3) {
        const hrs = parseInt(parts[0], 10) || 0;
        const mins = parseInt(parts[1], 10) || 0;
        const secs = parseInt(parts[2], 10) || 0;
        return hrs * 3600 + mins * 60 + secs;
      }
      const minMatch = maxBreakTime.match(/(\d+)\s*(mins?|minutes?)/i);
      const hourMatch = maxBreakTime.match(/(\d+)\s*(hrs?|hours?)/i);
      let totalSecs = 0;
      if (hourMatch) totalSecs += parseInt(hourMatch[1], 10) * 3600;
      if (minMatch) totalSecs += parseInt(minMatch[1], 10) * 60;
      if (totalSecs === 0) {
        const num = parseInt(maxBreakTime, 10);
        if (!isNaN(num)) totalSecs = num * 60;
      }
      return totalSecs > 0 ? totalSecs : 3600;
    } catch (e) {
      return 3600;
    }
  }, [maxBreakTime]);

  const todayStr = (() => {
    const d = new Date();
    const offset = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  })();
  const todayRecord = recentAttendance.find((a: any) => a.date === todayStr);

  return (
    <div className="space-y-5 text-left">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/40 dark:from-slate-900 dark:via-slate-850 dark:to-slate-950 p-5 rounded-2xl border border-blue-100/50 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-450/5 blur-[80px] rounded-full pointer-events-none" />
        <div className="relative z-10 space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-blue-100/40 dark:bg-slate-800 text-blue-600 dark:text-slate-300 border border-blue-200/40 dark:border-slate-700 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5">
              <Activity className="w-2.5 h-2.5 animate-pulse text-emerald-500" /> Live Attendance Hub
            </span>
            {isCheckedIn && (
              <span className={cn(
                "w-1.5 h-1.5 rounded-full animate-ping",
                isOnBreak ? "bg-amber-500" : "bg-emerald-500"
              )} />
            )}
          </div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Attendance Console</h2>
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-300/90 max-w-xl">
            Check-in to start your active workspace hour log, toggle break sessions, and audit your verified log ledger.
          </p>
        </div>

        {/* Live Status Widget */}
        <div className="relative z-10 flex items-center gap-2.5 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 shrink-0 shadow-sm">
          <div className={cn(
            "w-2.5 h-2.5 rounded-full flex items-center justify-center relative",
            isCheckedIn ? (isOnBreak ? (isIdle ? "bg-rose-500" : "bg-amber-500") : "bg-emerald-500") : "bg-slate-700"
          )}>
            {isCheckedIn && <div className="absolute inset-0 bg-inherit rounded-full animate-ping opacity-60" />}
          </div>
          <div>
            <p className="text-[7.5px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              SYSTEM STATUS
            </p>
            <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-wider mt-0.5">
              {isCheckedIn ? (isOnBreak ? (isIdle ? 'AWAY (IDLE)' : 'ON BREAK') : 'SHIFT ONGOING') : 'OFFLINE'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Left Console: Controls */}
        <div className="saas-card bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900/90 dark:to-slate-950/70 border border-slate-205/30 dark:border-slate-800/80 p-4 space-y-3 rounded-[28px] shadow-md flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-slate-150/40 dark:border-slate-800/60">
              <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-1.5 font-sans">
                <Clock className="w-3.5 h-3.5 text-blue-500" /> Active Console
              </span>
            </div>

            {/* Glowing Shift Faceplate */}
            <div className={cn(
              "relative overflow-hidden p-3.5 rounded-2xl border transition-all duration-300 flex flex-col items-center justify-center text-center",
              isCheckedIn 
                ? isOnBreak 
                  ? "bg-gradient-to-br from-amber-500/5 to-orange-600/5 border-amber-500/35 shadow-[0_0_20px_rgba(245,158,11,0.05)]" 
                  : "bg-gradient-to-br from-emerald-500/5 to-teal-600/5 border-emerald-500/35 shadow-[0_0_20px_rgba(16,185,129,0.05)]"
                : "bg-slate-50/60 dark:bg-slate-950/40 border-slate-200/50 dark:border-slate-850"
            )}>
              {/* Outer Pulse ring if working */}
              {isCheckedIn && !isOnBreak && (
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent animate-pulse pointer-events-none" />
              )}

              <h4 className={cn(
                "text-xl font-black font-mono tracking-tight transition-colors duration-300",
                isCheckedIn 
                  ? isOnBreak 
                    ? "text-amber-500 drop-shadow-[0_0_6px_rgba(245,158,11,0.15)]" 
                    : "text-emerald-500 drop-shadow-[0_0_6px_rgba(16,185,129,0.15)]"
                  : "text-slate-400 dark:text-slate-500"
              )}>
                {isCheckedIn ? formatTime(secondsWorked) : '00:00:00'}
              </h4>

              <span className="text-[7.5px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest mt-1">
                {isCheckedIn ? (isOnBreak ? (isIdle ? 'AWAY (IDLE)' : 'HOURS ACCRUED (PAUSED)') : 'HOURS ACCRUED') : 'CONSOLE INACTIVE'}
              </span>

              {/* Progress Slider (Linear) */}
              {isCheckedIn && (
                <div className="w-full mt-2.5 space-y-1">
                  <div className="h-1 w-full bg-slate-100 dark:bg-slate-950 rounded-full p-0.5 border border-slate-200/40 dark:border-slate-800/60 overflow-hidden shadow-inner">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${shiftProgress}%` }}
                      className={cn(
                        "h-full rounded-full transition-colors duration-350",
                        isOnBreak 
                          ? "bg-amber-500 shadow-[0_0_4px_rgba(245,158,11,0.3)]" 
                          : "bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.3)]"
                      )}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[7px] font-black uppercase text-slate-405 tracking-widest">
                    <span>{isOnBreak ? "PROGRESS (PAUSED)" : "PROGRESS"}</span>
                    <span>{Math.round(shiftProgress)}% OF {shiftDurationHours}H</span>
                  </div>
                </div>
              )}
            </div>

            {/* Live Timing Statistics Grid */}
            <div className="grid grid-cols-3 gap-1.5 text-left">
              <div className="bg-slate-50/60 dark:bg-slate-850/30 p-1.5 rounded-xl border border-slate-100/50 dark:border-slate-800/60 shadow-inner flex flex-col justify-center">
                <span className="text-[7px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">SHIFT START</span>
                <span className="text-[9px] font-black text-slate-850 dark:text-white mt-0.5 font-mono tracking-tight uppercase">
                  {displayCheckIn ? displayCheckIn : '--:-- --'}
                </span>
              </div>
              <div className="bg-slate-50/60 dark:bg-slate-850/30 p-1.5 rounded-xl border border-slate-100/50 dark:border-slate-800/60 shadow-inner flex flex-col justify-center">
                <span className="text-[7px] font-black text-slate-405 dark:text-slate-500 uppercase tracking-widest">SHIFT END</span>
                <span className="text-[9px] font-black text-slate-850 dark:text-white mt-0.5 font-mono tracking-tight uppercase">
                  {displayCheckOut ? displayCheckOut : '--:-- --'}
                </span>
              </div>
              <div className="bg-slate-50/60 dark:bg-slate-850/30 p-1.5 rounded-xl border border-slate-100/50 dark:border-slate-800/60 shadow-inner flex flex-col justify-center">
                <span className={cn(
                  "text-[7px] font-black uppercase tracking-widest transition-colors duration-300",
                  isOnBreak ? "text-amber-500" : "text-slate-400 dark:text-slate-500"
                )}>
                  {isOnBreak ? "BREAK TIME" : "BREAK TIME"}
                </span>
                <span className={cn(
                  "text-[9px] font-black mt-0.5 font-mono tracking-tight transition-colors duration-300",
                  isOnBreak ? "text-amber-500 animate-pulse" : "text-slate-850 dark:text-white"
                )}>
                  {formatTime(Math.max(0, parsedMaxBreakSeconds - totalBreakSeconds))}
                </span>
              </div>
            </div>

            {/* Quick Shift Summary Rules */}
            <div className="bg-slate-50/60 dark:bg-slate-850/30 p-1.5 rounded-xl border border-slate-100/50 dark:border-slate-800/60 shadow-inner space-y-1">
              <div className="flex items-center gap-1.5 text-[8.5px] font-bold text-slate-500 uppercase tracking-wide">
                <MapPin className="w-2.5 h-2.5 text-blue-500" />
                <span>Shift: <strong className="text-slate-900 dark:text-white font-extrabold">{companyName || "HQ Office, Pune"}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 text-[8.5px] font-bold text-slate-500 uppercase tracking-wide">
                <ShieldAlert className="w-2.5 h-2.5 text-amber-500" />
                <span>Daily Req: <strong className="text-slate-900 dark:text-white font-extrabold">{shiftDurationHours.toFixed(1)} Hours</strong></span>
              </div>
            </div>
          </div>

          {/* Action Triggers */}
          <div className="space-y-1.5 pt-2 border-t border-slate-150/40 dark:border-slate-800/60">
            {!isCheckedIn ? (
              <button 
                onClick={handleClockIn}
                className="w-full h-9 bg-gradient-to-r from-blue-650 to-indigo-650 hover:scale-[1.01] hover:shadow-lg text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-md shadow-blue-500/10 cursor-pointer active:scale-97 transition-all flex items-center justify-center gap-1.5 border-none"
              >
                <LogIn className="w-3.5 h-3.5" /> Start Shift (Check In)
              </button>
            ) : (
              <div className="flex gap-2">
                <button 
                  onClick={toggleBreak}
                  className={cn(
                    "flex-1 h-9 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer active:scale-97 hover:scale-[1.01] flex items-center justify-center gap-1.5 border-none",
                    isOnBreak 
                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/10" 
                      : "bg-gradient-to-r from-amber-500 to-orange-550 text-white shadow-md shadow-amber-500/10"
                  )}
                >
                  <Coffee className="w-3.5 h-3.5 animate-bounce" /> {isOnBreak ? 'Return' : 'Break'}
                </button>
                <button 
                  onClick={handleClockOut}
                  className="flex-1 h-9 bg-gradient-to-r from-rose-500 to-red-650 hover:scale-[1.01] hover:shadow-lg text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-md shadow-rose-500/10 cursor-pointer active:scale-97 transition-all flex items-center justify-center gap-1.5 border-none"
                >
                  <LogOut className="w-3.5 h-3.5" /> Check Out
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Attendance Logs Table */}
        <div className="lg:col-span-2 saas-card bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900/90 dark:to-slate-950/70 border border-slate-205/30 dark:border-slate-800/80 p-6 space-y-5 rounded-[28px] shadow-md">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-150/40 dark:border-slate-800/60">
            <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-blue-500" /> Recent Check-in Logs
            </span>
            
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={dateSearch}
                onChange={(e) => setDateSearch(e.target.value)}
                placeholder="Search date (e.g. 2026-06)..."
                className="bg-slate-100/50 dark:bg-slate-950/50 border border-slate-205/30 dark:border-slate-800/80 rounded-lg px-2.5 py-1 text-[8.5px] font-bold text-slate-700 dark:text-slate-350 outline-none w-36 placeholder:text-slate-400 placeholder:dark:text-slate-600 focus:border-blue-500/50"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-100/50 dark:bg-slate-950/50 border border-slate-205/30 dark:border-slate-800/80 rounded-lg px-2 py-1 text-[8.5px] font-black text-slate-700 dark:text-slate-350 uppercase outline-none cursor-pointer focus:border-blue-500/50"
              >
                <option value="All">All Status</option>
                <option value="Present">Present</option>
                <option value="Late">Late</option>
                <option value="Absent">Absent</option>
              </select>
            </div>
          </div>
          
          <div className="saas-table-container saas-table-compact">
            <table className="saas-table">
              <thead className="saas-table-thead">
                <tr>
                  <th className="saas-table-th">Date</th>
                  <th className="saas-table-th">Check In</th>
                  <th className="saas-table-th">Check Out</th>
                  <th className="saas-table-th">Break Duration</th>
                  <th className="saas-table-th text-center">Duration</th>
                  <th className="saas-table-th text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttendance.length === 0 ? (
                  <tr className="saas-table-row">
                    <td colSpan={6} className="saas-table-td text-center text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase py-10">
                      No matching check-in logs found.
                    </td>
                  </tr>
                ) : (
                  filteredAttendance.map((log) => (
                    <tr 
                      key={log._id || log.id} 
                      className="saas-table-row"
                    >
                      {/* Date */}
                      <td className="saas-table-td">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          <span className="font-extrabold text-slate-900 dark:text-white uppercase">{log.date}</span>
                        </div>
                      </td>

                      {/* Check In */}
                      <td className="saas-table-td font-black text-slate-850 dark:text-slate-205">{log.checkIn}</td>

                      {/* Check Out */}
                      <td className="saas-table-td">
                        <span className="font-black text-slate-850 dark:text-slate-205">
                          {log.checkOut || (
                            <span className="px-2.5 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[8px] font-black rounded-full border border-blue-500/15 uppercase tracking-widest animate-pulse">
                              Active
                            </span>
                          )}
                        </span>
                      </td>

                      {/* Breaks */}
                      <td className="saas-table-td">
                        {log.breaks && log.breaks.length > 0 ? (
                          <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2.5 py-0.5 rounded-full text-[8px] font-black border border-amber-500/15 uppercase tracking-widest">
                            ☕ {calculateTotalBreakTime(log.breaks)}
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-600 text-[10px] font-bold pl-1">-</span>
                        )}
                      </td>

                      {/* Duration */}
                      <td className="saas-table-td text-center">
                        <span className="inline-block text-[10px] font-extrabold text-slate-900 dark:text-white px-2.5 py-0.5 bg-slate-100 dark:bg-slate-850 rounded-lg">
                          {log.hours && (log.hours.includes(':') || log.hours.includes('h') || log.hours.includes('m') || log.hours.includes('s')) ? log.hours : `${log.hours} Hrs`}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="saas-table-td text-right">
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border inline-flex items-center gap-1.5",
                          log.status === 'Present' ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border-emerald-500/15" :
                          log.status === 'Late' ? "bg-amber-500/10 text-amber-600 dark:text-amber-450 border-amber-500/15" :
                          "bg-rose-500/10 text-rose-600 dark:text-rose-455 border-rose-500/15"
                        )}>
                          <span className={cn(
                            "w-1 h-1 rounded-full",
                            log.status === 'Present' ? "bg-emerald-500 animate-pulse" :
                            log.status === 'Late' ? "bg-amber-500" : "bg-rose-500"
                          )} />
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
