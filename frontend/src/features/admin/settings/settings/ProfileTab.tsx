"use client";

import React, { useState } from 'react';
import { User, Mail, Phone, MapPin, Briefcase, Users, Key, Calendar, Eye } from 'lucide-react';

interface ProfileTabProps {
  profile: any;
  setProfile: React.Dispatch<React.SetStateAction<any>>;
  userRole: 'Admin' | 'HR' | 'Employee';
}

export default function ProfileTab({ profile, setProfile, userRole }: ProfileTabProps) {
  const [showBankAcc, setShowBankAcc] = useState(false);

  return (
    <div className="space-y-6 text-left">
      {/* Card 1: Primary details */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-200/50 dark:border-slate-800 space-y-5">
        <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800/60 pb-2">
          Organizational Profile Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 block mb-1.5">Full Name</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text" 
                value={profile.name}
                onChange={(e) => setProfile((prev: any) => ({ ...prev, name: e.target.value }))}
                className="w-full pl-12 pr-6 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-150/40 dark:border-slate-800/80 rounded-xl text-xs font-bold outline-none focus:border-blue-500/50 shadow-sm transition-all text-slate-900 dark:text-white"
              />
            </div>
          </div>
          <div>
            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 block mb-1.5">Work Email</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="email" 
                value={profile.email}
                onChange={(e) => setProfile((prev: any) => ({ ...prev, email: e.target.value }))}
                className="w-full pl-12 pr-6 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-150/40 dark:border-slate-800/80 rounded-xl text-xs font-bold outline-none focus:border-blue-500/50 shadow-sm transition-all text-slate-900 dark:text-white"
              />
            </div>
          </div>
          <div>
            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 block mb-1.5">Contact Number</label>
            <div className="relative group">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text" 
                value={profile.phone}
                onChange={(e) => setProfile((prev: any) => ({ ...prev, phone: e.target.value }))}
                className="w-full pl-12 pr-6 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-150/40 dark:border-slate-800/80 rounded-xl text-xs font-bold outline-none focus:border-blue-500/50 shadow-sm transition-all text-slate-900 dark:text-white"
              />
            </div>
          </div>
          <div>
            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 block mb-1.5">
              {userRole === 'Employee' ? 'Current City' : 'Office Location'}
            </label>
            <div className="relative group">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text" 
                value={profile.location}
                onChange={(e) => setProfile((prev: any) => ({ ...prev, location: e.target.value }))}
                className="w-full pl-12 pr-6 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-150/40 dark:border-slate-800/80 rounded-xl text-xs font-bold outline-none focus:border-blue-500/50 shadow-sm transition-all text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Card 2: Enterprise Positions */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-200/50 dark:border-slate-800 space-y-5">
        <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800/60 pb-2">
          Employment Hierarchy Details
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 block mb-1.5">Designation</label>
            <div className="relative group">
              <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text" 
                value={profile.designation || (userRole === 'Admin' ? 'Lead System Administrator' : userRole === 'HR' ? 'Chief HR Officer' : 'Senior Designer')}
                onChange={(e) => setProfile((prev: any) => ({ ...prev, designation: e.target.value }))}
                className="w-full pl-12 pr-6 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-150/40 dark:border-slate-800/80 rounded-xl text-xs font-bold outline-none focus:border-blue-500/50 shadow-sm transition-all text-slate-900 dark:text-white"
              />
            </div>
          </div>
          <div>
            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 block mb-1.5">Department Name</label>
            <div className="relative group">
              <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text" 
                value={profile.dept || 'Design Team'}
                onChange={(e) => setProfile((prev: any) => ({ ...prev, dept: e.target.value }))}
                className="w-full pl-12 pr-6 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-150/40 dark:border-slate-800/80 rounded-xl text-xs font-bold outline-none focus:border-blue-500/50 shadow-sm transition-all text-slate-900 dark:text-white"
              />
            </div>
          </div>
          <div>
            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 block mb-1.5">Employee ID</label>
            <div className="relative group">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text" 
                value={profile.empId || 'EMP-2024-042'}
                onChange={(e) => setProfile((prev: any) => ({ ...prev, empId: e.target.value }))}
                className="w-full pl-12 pr-6 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-150/40 dark:border-slate-800/80 rounded-xl text-xs font-bold outline-none focus:border-blue-500/50 shadow-sm transition-all text-slate-900 dark:text-white"
              />
            </div>
          </div>
          <div>
            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 block mb-1.5">Joining Timeline</label>
            <div className="relative group">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text" 
                value={profile.joined || 'Jan 2022'}
                onChange={(e) => setProfile((prev: any) => ({ ...prev, joined: e.target.value }))}
                className="w-full pl-12 pr-6 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-150/40 dark:border-slate-800/80 rounded-xl text-xs font-bold outline-none focus:border-blue-500/50 shadow-sm transition-all text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Card 3: Secure Banking & Emergency Liaison */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-200/50 dark:border-slate-800 space-y-5">
        <h3 className="text-[10px] font-black text-slate-405 dark:text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800/60 pb-2">
          Compensation Banking & Emergency Liaison
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 block mb-1.5">Bank Name</label>
            <input 
              type="text" 
              value={profile.bankName || 'HDFC Bank Ltd'}
              onChange={(e) => setProfile((prev: any) => ({ ...prev, bankName: e.target.value }))}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-150/40 dark:border-slate-800/80 rounded-xl text-xs font-bold outline-none focus:border-blue-500/50 shadow-sm transition-all text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 block mb-1.5">Account Number</label>
            <div className="relative group">
              <input 
                type={showBankAcc ? "text" : "password"} 
                value={profile.accountNumber || '50100432109876'}
                onChange={(e) => setProfile((prev: any) => ({ ...prev, accountNumber: e.target.value }))}
                className="w-full pl-4 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-150/40 dark:border-slate-800/80 rounded-xl text-xs font-bold outline-none focus:border-blue-500/50 shadow-sm transition-all font-mono text-slate-900 dark:text-white"
              />
              <button 
                type="button"
                onClick={() => setShowBankAcc(!showBankAcc)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500 transition-colors cursor-pointer"
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div>
            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 block mb-1.5">Bank IFSC Code</label>
            <input 
              type="text" 
              value={profile.ifscCode || 'HDFC0000001'}
              onChange={(e) => setProfile((prev: any) => ({ ...prev, ifscCode: e.target.value }))}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-150/40 dark:border-slate-800/80 rounded-xl text-xs font-bold outline-none focus:border-blue-500/50 shadow-sm transition-all uppercase text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div>
          <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 block mb-1.5">Emergency Contact Details</label>
          <input 
            type="text" 
            value={profile.emergencyContact || 'Sarah Doe (+91 98765 11111)'}
            onChange={(e) => setProfile((prev: any) => ({ ...prev, emergencyContact: e.target.value }))}
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-150/40 dark:border-slate-800/80 rounded-xl text-xs font-bold outline-none focus:border-blue-500/50 shadow-sm transition-all text-slate-900 dark:text-white"
          />
        </div>
      </div>
    </div>
  );
}
