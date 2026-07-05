"use client";

import React from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";

interface HolidayCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDate: Date;
  setCurrentDate: React.Dispatch<React.SetStateAction<Date>>;
  holidaysData: { [key: string]: any[] };
}

export const HolidayCalendarModal = ({
  isOpen,
  onClose,
  currentDate,
  setCurrentDate,
  holidaysData
}: HolidayCalendarModalProps) => {
  if (!isOpen) return null;

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const currentMonthKey = `${currentDate.getMonth()}-${currentDate.getFullYear()}`;
  const monthHolidays = holidaysData[currentMonthKey] || [];
  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 10 }}
        className="bg-white dark:bg-slate-900 rounded-[2.5rem] md:rounded-[3rem] shadow-2xl relative overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh] max-w-full md:max-w-[420px] w-full mx-4 md:mx-0"
      >
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-600" />
        </div>
        
        <div className="p-6 flex justify-between items-center border-b border-slate-50 dark:border-slate-800 shrink-0">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] leading-none mb-2">
              Holiday Schedule
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-2xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all shadow-sm border border-transparent hover:border-rose-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto no-scrollbar">
          {/* Navigation for Calendar */}
          <div className="flex items-center justify-between mb-6 bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-full border border-slate-100/50">
            <button onClick={handlePrevMonth} className="w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-700 rounded-full transition-all shadow-sm border border-slate-200 dark:border-slate-600 hover:scale-105 hover:border-blue-200"><ChevronLeft className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" /></button>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-800 dark:text-slate-200">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
            <button onClick={handleNextMonth} className="w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-700 rounded-full transition-all shadow-sm border border-slate-200 dark:border-slate-600 hover:scale-105 hover:border-blue-200"><ChevronRight className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" /></button>
          </div>
          
          <div className="grid grid-cols-7 gap-y-1 gap-x-1 mb-6 px-1">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <div key={`${day}-${i}`} className="text-center w-7 h-7 mx-auto flex items-center justify-center text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase bg-blue-50 dark:bg-blue-900/20 rounded-full">{day}</div>
            ))}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="w-8 h-8 mx-auto" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isHoliday = monthHolidays.find(h => h.date === day);
              return (
                <div key={day} className={cn("w-8 h-8 mx-auto rounded-full flex items-center justify-center text-[11px] font-black transition-all cursor-default mt-1", isHoliday ? "bg-rose-500 text-white shadow-md shadow-rose-500/40 scale-110 z-10" : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800")}>
                  {day}
                </div>
              );
            })}
          </div>
          
          {/* Holiday List */}
          <div className="space-y-2.5">
            {monthHolidays.map((holiday, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700/50 hover:border-blue-200 hover:shadow-md transition-all group">
                <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/20 flex flex-col items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                  <span className="text-[11px] font-black text-rose-600 dark:text-rose-400 leading-none mb-0.5">{holiday.date}</span>
                  <span className="text-[7px] font-bold text-rose-400 dark:text-rose-500 uppercase">{currentDate.toLocaleString('default', { month: 'short' })}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black text-slate-900 dark:text-white mb-0.5 truncate">{holiday.name}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{holiday.type}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
