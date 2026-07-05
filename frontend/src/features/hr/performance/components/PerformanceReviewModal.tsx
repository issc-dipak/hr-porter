"use client";

import React from 'react';
import { X, Award, Target, Star, BarChart3, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";

interface PerformanceReviewModalProps {
  modalType: 'add' | 'edit' | 'history';
  selectedItem: any;
  form: any;
  setForm: (form: any) => void;
  closeModal: () => void;
  handleSubmit: (e: React.FormEvent) => void;
}

export default function PerformanceReviewModal({
  modalType,
  selectedItem,
  form,
  setForm,
  closeModal,
  handleSubmit
}: PerformanceReviewModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={closeModal}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden mx-4 text-left"
      >
        <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-850 mb-6">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-600" />
            {modalType === 'add' && 'Create Performance Review'}
            {modalType === 'edit' && 'Edit Performance Assessment'}
            {modalType === 'history' && 'Career Growth History'}
          </h2>
          <button onClick={closeModal} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* GROWTH HISTORY VIEW */}
        {modalType === 'history' && selectedItem && (
          <div className="space-y-6">
            <div className="flex items-center gap-4.5 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-150/40 dark:border-slate-800">
              <div className="w-14 h-14 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white text-lg">
                {selectedItem.avatar || 'U'}
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white leading-none">{selectedItem.name}</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">{selectedItem.dept} • Assessment Score: {selectedItem.rating}/5.0</p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Quarterly Review Milestones</h4>
              <div className="relative border-l-2 border-slate-100 dark:border-slate-800 pl-6 ml-3 space-y-6">
                {[
                  { quarter: 'Q1 2026', status: 'Top Performer', rating: '4.8/5.0', desc: 'Outstanding design and workflow leadership on major client apps.' },
                  { quarter: 'Q4 2025', status: 'Meets Expectations', rating: '4.1/5.0', desc: 'Consistent engineering deliverables with solid team contributions.' },
                  { quarter: 'Q3 2025', status: 'Meets Expectations', rating: '4.0/5.0', desc: 'Quick onboarding, learned architecture tools swiftly.' }
                ].map((q, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-blue-600 border-4 border-white dark:border-slate-900" />
                    <div>
                      <div className="flex justify-between items-baseline">
                        <h5 className="text-xs font-black text-slate-900 dark:text-slate-200">{q.quarter}</h5>
                        <span className="text-[9px] font-black text-blue-600">{q.rating}</span>
                      </div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mt-0.5">{q.status}</p>
                      <p className="text-[10px] font-bold text-slate-500 mt-1 leading-relaxed">{q.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button 
              onClick={closeModal}
              className="w-full py-4.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition-all cursor-pointer"
            >
              Close History
            </button>
          </div>
        )}

        {/* ADD & EDIT FORMS */}
        {(modalType === 'add' || modalType === 'edit') && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Employee Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Rahul Sharma"
                  className="saas-input w-full px-3 py-2 text-xs border border-slate-150/40 rounded-xl outline-none"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Department</label>
                <select 
                  className="saas-input w-full px-3 py-2 text-xs border border-slate-150/40 rounded-xl outline-none cursor-pointer"
                  value={form.dept}
                  onChange={(e) => setForm({ ...form, dept: e.target.value })}
                >
                  <option>Engineering</option>
                  <option>Design</option>
                  <option>Sales</option>
                  <option>HR</option>
                </select>
              </div>
              <div>
                <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Evaluation Score (of 5.0)</label>
                <input 
                  type="number" 
                  required
                  min={1}
                  max={5}
                  step={0.1}
                  className="saas-input w-full px-3 py-2 text-xs border border-slate-150/40 rounded-xl outline-none"
                  value={form.rating}
                  onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Assessment Grade</label>
                <select 
                  className="saas-input w-full px-3 py-2 text-xs border border-slate-150/40 rounded-xl outline-none cursor-pointer"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option>Top Performer</option>
                  <option>Exceeds Expectations</option>
                  <option>Meets Expectations</option>
                  <option>Under Review</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Goals Completed (e.g. 9/10)</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. 8/10 Goals Met"
                  className="saas-input w-full px-3 py-2 text-xs border border-slate-150/40 rounded-xl outline-none"
                  value={form.goals}
                  onChange={(e) => setForm({ ...form, goals: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-slate-100 dark:border-slate-805 mt-6">
              <button 
                type="submit"
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer shadow-lg shadow-blue-500/20 transition-all"
              >
                {modalType === 'add' ? 'Save Review' : 'Save Changes'}
              </button>
              <button 
                type="button" 
                onClick={closeModal}
                className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-655 dark:text-slate-400 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
