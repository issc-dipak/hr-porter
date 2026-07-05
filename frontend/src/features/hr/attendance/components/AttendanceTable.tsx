"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  ArrowRight, X, MapPin, Calendar as CalendarIcon, CheckCircle2, Clock, AlertCircle, XCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";

interface AttendanceTableProps {
  filteredData: any[];
  onRefresh?: () => void;
  employees?: any[];
}

export default function AttendanceTable({ filteredData, onRefresh, employees = [] }: AttendanceTableProps) {
  const [selectedEntry, setSelectedEntry] = useState<any>(null);

  const openDetails = (entry: any) => {
    if (!entry) return;
    setSelectedEntry(entry);
  };

  const calculateTotalBreakTime = (breaks: any[]) => {
    if (!breaks || breaks.length === 0) return '0 min';
    let totalMinutes = 0;
    breaks.forEach((brk) => {
      if (brk.start && brk.end && brk.end !== '-') {
        try {
          const [sTime, sMod] = brk.start.split(' ');
          let [sHrs, sMins] = sTime.split(':').map(Number);
          if (sMod === 'PM' && sHrs < 12) sHrs += 12;
          if (sMod === 'AM' && sHrs === 12) sHrs = 0;
          
          const [eTime, eMod] = brk.end.split(' ');
          let [eHrs, eMins] = eTime.split(':').map(Number);
          if (eMod === 'PM' && eHrs < 12) eHrs += 12;
          if (eMod === 'AM' && eHrs === 12) eHrs = 0;
          
          const sMs = sHrs * 3600 + sMins * 60;
          const eMs = eHrs * 3600 + eMins * 60;
          const diffMin = Math.round((eMs - sMs) / 60);
          if (diffMin > 0) {
            totalMinutes += diffMin;
          }
        } catch (e) {
          // ignore parsing error
        }
      }
    });
    return totalMinutes > 0 ? `${totalMinutes} min` : '0 min';
  };

  const calculateLiveDuration = (row: any) => {
    if (!row.timeIn || row.timeIn === '-') return '0h 00m';
    
    let endTimeStr = row.timeOut;
    if (!endTimeStr || endTimeStr === '-') {
      // If today's date, calculate elapsed live time from check in to now
      const now = new Date();
      const offset = now.getTimezoneOffset();
      const localDate = new Date(now.getTime() - (offset * 60 * 1000));
      const todayStr = localDate.toISOString().split('T')[0];
      
      if (row.date === todayStr) {
        let hrs = now.getHours();
        const mins = now.getMinutes();
        const ampm = hrs >= 12 ? 'PM' : 'AM';
        hrs = hrs % 12;
        hrs = hrs ? hrs : 12;
        const minsStr = mins.toString().padStart(2, '0');
        const hrsStr = hrs.toString().padStart(2, '0');
        endTimeStr = `${hrsStr}:${minsStr} ${ampm}`;
      } else {
        return '0h 00m';
      }
    }

    try {
      const [inT, inMod] = row.timeIn.split(' ');
      let [inHrs, inMins] = inT.split(':').map(Number);
      if (inMod === 'PM' && inHrs < 12) inHrs += 12;
      if (inMod === 'AM' && inHrs === 12) inHrs = 0;

      const [outT, outMod] = endTimeStr.split(' ');
      let [outHrs, outMins] = outT.split(':').map(Number);
      if (outMod === 'PM' && outHrs < 12) outHrs += 12;
      if (outMod === 'AM' && outHrs === 12) outHrs = 0;

      const inM = inHrs * 60 + inMins;
      const outM = outHrs * 60 + outMins;
      let diff = outM - inM;
      if (diff <= 0) return '0h 00m';

      // Subtract break time
      let breakMins = 0;
      if (row.breaks && row.breaks.length > 0) {
        row.breaks.forEach((brk: any) => {
          if (brk.start && brk.end && brk.end !== '-') {
            try {
              const [sTime, sMod] = brk.start.split(' ');
              let [sHrs, sMins] = sTime.split(':').map(Number);
              if (sMod === 'PM' && sHrs < 12) sHrs += 12;
              if (sMod === 'AM' && sHrs === 12) sHrs = 0;
              
              const [eTime, eMod] = brk.end.split(' ');
              let [eHrs, eMins] = eTime.split(':').map(Number);
              if (eMod === 'PM' && eHrs < 12) eHrs += 12;
              if (eMod === 'AM' && eHrs === 12) eHrs = 0;
              
              const sMs = sHrs * 3600 + sMins * 60;
              const eMs = eHrs * 3600 + eMins * 60;
              const diffMin = Math.round((eMs - sMs) / 60);
              if (diffMin > 0) {
                breakMins += diffMin;
              }
            } catch (e) {}
          }
        });
      }

      diff = diff - breakMins;
      if (diff <= 0) return '0h 00m';

      const hrs = Math.floor(diff / 60);
      const mins = diff % 60;
      return `${hrs}h ${mins.toString().padStart(2, '0')}m`;
    } catch (e) {
      return '0h 00m';
    }
  };

  return (
    <div className="text-left">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50/50 dark:bg-slate-800/30">
            <tr>
              <th className="px-5 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">Employee</th>
              <th className="px-5 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">Check In</th>
              <th className="px-5 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">Check Out</th>
              <th className="px-5 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">Hours & Breaks</th>
              <th className="px-5 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">Status</th>
              <th className="px-5 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            <AnimatePresence mode="popLayout">
              {filteredData.map((row, idx) => (
                <motion.tr 
                  key={row._id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-all cursor-default"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 flex items-center justify-center font-black text-blue-600 dark:text-blue-400 text-xs shadow-sm group-hover:scale-110 transition-transform">
                        {row.name ? row.name[0] : 'U'}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white text-xs whitespace-nowrap">{row.name}</p>
                        <p className="text-[9px] text-slate-400 font-bold">{row.date}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-xs font-semibold text-slate-555 dark:text-slate-400 whitespace-nowrap">{row.timeIn}</td>
                  <td className="px-5 py-4 text-xs font-semibold text-slate-555 dark:text-slate-400 whitespace-nowrap">{row.timeOut}</td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-0.5 text-left">
                      <span className="text-[11px] font-black text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md w-fit whitespace-nowrap">
                        {calculateLiveDuration(row)}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 pl-0.5 whitespace-nowrap">
                        Break: {calculateTotalBreakTime(row.breaks)}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={cn(
                       "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 whitespace-nowrap",
                       row.status === 'Present' ? "bg-emerald-50 dark:bg-emerald-955/20 text-emerald-600 dark:text-emerald-450" :
                       row.status === 'Late' ? "bg-amber-50 dark:bg-amber-955/20 text-amber-600 dark:text-amber-450" :
                       row.status === 'On Leave' ? "bg-blue-50 dark:bg-blue-955/20 text-blue-600 dark:text-blue-450" :
                       "bg-rose-50 dark:bg-rose-955/20 text-rose-600 dark:text-rose-455"
                    )}>
                      <div className={cn("w-1 h-1 rounded-full", 
                        row.status === 'Present' ? "bg-emerald-500" :
                        row.status === 'Late' ? "bg-amber-500" :
                        row.status === 'On Leave' ? "bg-blue-500" : "bg-rose-500"
                      )} />
                      {row.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <button 
                      onClick={() => openDetails(row)}
                      className="w-8 h-8 flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all cursor-pointer border border-transparent"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {selectedEntry && (
          <AttendanceDetailsModal
            entry={selectedEntry}
            onClose={() => setSelectedEntry(null)}
            employees={employees}
            onRefresh={onRefresh}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

interface AttendanceDetailsModalProps {
  entry: any;
  onClose: () => void;
  employees: any[];
  onRefresh?: () => void;
}

function AttendanceDetailsModal({ entry, onClose, employees, onRefresh }: AttendanceDetailsModalProps) {
  const [mounted, setMounted] = useState(false);
  const [editTimeIn, setEditTimeIn] = useState('');
  const [editTimeOut, setEditTimeOut] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [remarks, setRemarks] = useState('');
  const [sendNotify, setSendNotify] = useState(false);
  const [notifyMessage, setNotifyMessage] = useState('');
  const [formattedDate, setFormattedDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!entry) return;
    setEditTimeIn(entry.timeIn || entry.checkIn || '-');
    setEditTimeOut(entry.timeOut || entry.checkOut || '-');
    setEditStatus(entry.status || 'Present');
    setRemarks(entry.remarks || '');
    setSendNotify(false);
    
    let friendlyDate = '';
    let longFriendlyDate = '';
    try {
      if (entry.date) {
        const d = new Date(entry.date);
        if (!isNaN(d.getTime())) {
          friendlyDate = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
          longFriendlyDate = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
        }
      }
    } catch (e) {
      console.warn("Date parsing failed:", e);
    }
    
    setFormattedDate(longFriendlyDate || entry.date || '');
    
    let firstName = 'Employee';
    try {
      const fullName = entry.name || entry.employee;
      if (fullName) {
        firstName = fullName.split(' ')[0];
      }
    } catch (e) {
      console.warn("Name split failed:", e);
    }

    setNotifyMessage(`Hi ${firstName}, your attendance for ${friendlyDate || 'today'} has been regularized by HR/Admin.`);
  }, [entry]);

  const calculateDuration = (inTime: string, outTime: string) => {
    if (!inTime || !outTime || inTime === '-' || outTime === '-') return '0h 00m';
    try {
      const [inT, inMod] = inTime.split(' ');
      let [inHrs, inMins] = inT.split(':').map(Number);
      if (inMod === 'PM' && inHrs < 12) inHrs += 12;
      if (inMod === 'AM' && inHrs === 12) inHrs = 0;

      const [outT, outMod] = outTime.split(' ');
      let [outHrs, outMins] = outT.split(':').map(Number);
      if (outMod === 'PM' && outHrs < 12) outHrs += 12;
      if (outMod === 'AM' && outHrs === 12) outHrs = 0;

      const inM = inHrs * 60 + inMins;
      const outM = outHrs * 60 + outMins;
      const diff = outM - inM;
      if (diff <= 0) return '0h 00m';
      
      const hrs = Math.floor(diff / 60);
      const mins = diff % 60;
      return `${hrs}h ${mins.toString().padStart(2, '0')}m`;
    } catch (e) {
      return '0h 00m';
    }
  };

  const handleSaveAttendance = async () => {
    setIsSaving(true);
    try {
      const dur = calculateDuration(editTimeIn, editTimeOut);
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          employee: entry.name,
          date: entry.date,
          checkIn: editTimeIn,
          checkOut: editTimeOut,
          status: editStatus,
          duration: dur,
          remarks: remarks,
          breaks: entry.breaks || []
        })
      });
      if (res.ok) {
        if (sendNotify && notifyMessage.trim()) {
          const emp = employees.find((e: any) => e.fullName === entry.name);
          if (emp && emp.email) {
            await fetch('/api/chat/direct-message', {
              method: 'POST',
              headers,
              body: JSON.stringify({
                toEmail: emp.email,
                messageBody: notifyMessage.trim(),
                fromName: 'HR / Admin System'
              })
            });
          }
        }

        if (onRefresh) onRefresh();
        onClose();
      } else {
        alert('Failed to update attendance');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!mounted) return null;

  return createPortal((
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 text-left">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-md cursor-pointer"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 40 }}
        transition={{ type: 'spring', duration: 0.3 }}
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[85vh] flex flex-col z-10 animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <h2 className="text-[10px] font-black text-slate-400 dark:text-slate-450 tracking-widest uppercase">Regularize Attendance</h2>
          <button 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-all cursor-pointer border-none"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>
        
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto no-scrollbar">
          <div className="flex items-center gap-4 text-left">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-755 flex items-center justify-center text-lg font-black text-white shadow-md shrink-0">
              {entry.name ? entry.name[0] : 'U'}
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight mb-0.5">{entry.name}</h3>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <CalendarIcon className="w-3.5 h-3.5 text-blue-500" />
                {formattedDate}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3.5 text-left">
            <div className="space-y-1">
              <label className="text-[8px] text-slate-400 uppercase font-black tracking-widest pl-1">Check In</label>
              <input 
                type="text" 
                value={editTimeIn} 
                onChange={(e) => setEditTimeIn(e.target.value)} 
                placeholder="e.g. 09:00 AM"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs font-bold text-slate-900 dark:text-white border border-slate-200/40 dark:border-slate-700/40 focus:border-blue-500/50 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] text-slate-400 uppercase font-black tracking-widest pl-1">Check Out</label>
              <input 
                type="text" 
                value={editTimeOut} 
                onChange={(e) => setEditTimeOut(e.target.value)} 
                placeholder="e.g. 06:00 PM"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs font-bold text-slate-900 dark:text-white border border-slate-200/40 dark:border-slate-700/40 focus:border-blue-500/50 outline-none"
              />
            </div>
            <div className="space-y-1 col-span-2">
              <label className="text-[8px] text-slate-400 uppercase font-black tracking-widest pl-1">Status</label>
              <select 
                value={editStatus} 
                onChange={(e) => setEditStatus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs font-bold text-slate-900 dark:text-white border border-slate-200/40 dark:border-slate-700/40 focus:border-blue-500/50 outline-none cursor-pointer"
              >
                <option value="Present">Present</option>
                <option value="Late">Late</option>
                <option value="Absent">Absent</option>
                <option value="On Leave">On Leave</option>
              </select>
            </div>
            <div className="space-y-1 col-span-2">
              <label className="text-[8px] text-slate-400 uppercase font-black tracking-widest pl-1">Reason for Regularization / Remarks</label>
              <input 
                type="text" 
                value={remarks} 
                onChange={(e) => setRemarks(e.target.value)} 
                placeholder="e.g. Forgot to check out / system issue"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs font-bold text-slate-900 dark:text-white border border-slate-200/40 dark:border-slate-700/40 focus:border-blue-500/50 outline-none"
              />
            </div>
            <div className="space-y-2 col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 mt-1">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="sendNotify"
                  checked={sendNotify} 
                  onChange={(e) => setSendNotify(e.target.checked)} 
                  className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-700 text-blue-650 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="sendNotify" className="text-[9px] text-slate-500 dark:text-slate-450 uppercase font-black tracking-wider cursor-pointer">
                  Send Direct Message notification to Employee
                </label>
              </div>
              {sendNotify && (
                <textarea 
                  value={notifyMessage}
                  onChange={(e) => setNotifyMessage(e.target.value)}
                  placeholder="Type message notification details..."
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs font-bold text-slate-900 dark:text-white border border-slate-200/40 dark:border-slate-700/40 focus:border-blue-500/50 outline-none resize-none"
                />
              )}
            </div>
          </div>

          {/* Breaks Log Timeline */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Breaks Taken</h4>
            {entry.breaks && entry.breaks.length > 0 ? (
              <div className="space-y-2 max-h-[120px] overflow-y-auto no-scrollbar">
                {entry.breaks.map((brk: any, bIdx: number) => {
                  let breakDur = '-';
                  if (brk.start && brk.end && brk.end !== '-') {
                    try {
                      const [sTime, sMod] = brk.start.split(' ');
                      let [sHrs, sMins] = sTime.split(':').map(Number);
                      if (sMod === 'PM' && sHrs < 12) sHrs += 12;
                      if (sMod === 'AM' && sHrs === 12) sHrs = 0;
                      
                      const [eTime, eMod] = brk.end.split(' ');
                      let [eHrs, eMins] = eTime.split(':').map(Number);
                      if (eMod === 'PM' && eHrs < 12) eHrs += 12;
                      if (eMod === 'AM' && eHrs === 12) eHrs = 0;
                      
                      const sMs = sHrs * 3600 + sMins * 60;
                      const eMs = eHrs * 3600 + eMins * 60;
                      const diffMin = Math.round((eMs - sMs) / 60);
                      breakDur = diffMin > 0 ? `${diffMin} min` : '1 min';
                    } catch (e) {
                      breakDur = '-';
                    }
                  }
                  
                  return (
                    <div key={bIdx} className="flex items-center justify-between p-2 bg-slate-50/80 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-700/20">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center font-bold text-[9px] text-amber-600 dark:text-amber-400">
                          #{bIdx + 1}
                        </span>
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-355 whitespace-nowrap">
                          {brk.start} - {brk.end}
                        </span>
                      </div>
                      <span className="text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded-md">
                        {breakDur}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[11px] font-semibold text-slate-400 italic">No breaks taken today.</p>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Work Location</span>
              <span className="text-slate-900 dark:text-slate-200 font-black text-xs flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-500" /> HQ Office, Pune
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Device Authentication</span>
              <span className="text-slate-900 dark:text-slate-200 font-black text-xs">Biometric (Face ID)</span>
            </div>
          </div>
          
          <div className="flex gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button 
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-655 dark:text-slate-300 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border-none cursor-pointer"
            >
              Cancel
            </button>
            <button 
              onClick={handleSaveAttendance}
              disabled={isSaving}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:scale-[1.01] transition-all shadow-md shrink-0 cursor-pointer border-none"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  ), document.body)}
