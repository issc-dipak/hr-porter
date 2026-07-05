"use client";

import React, { useState } from 'react';
import { Smartphone } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SecurityTab() {
  const [is2FAEnabled, setIs2FAEnabled] = useState(true);

  return (
    <div className="space-y-4 text-left">
      <div className="p-4.5 bg-slate-900 rounded-xl text-white flex items-center justify-between">
        <div>
          <p className="text-xs font-black tracking-tight">Login Password</p>
          <p className="text-[9px] text-slate-400 mt-1">Last changed 12 days ago</p>
        </div>
        <button 
          onClick={() => alert("Redirecting to password reset workflow...")}
          className="px-3.5 py-2 bg-white/10 hover:bg-white text-white hover:text-slate-900 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer"
        >
          Update
        </button>
      </div>
      
      <div className="flex items-center justify-between p-4.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100/50 dark:border-slate-800/40">
        <div className="flex items-center gap-4">
          <Smartphone className="w-4 h-4 text-slate-400" />
          <div>
            <p className="text-xs font-black text-slate-900 dark:text-white">2FA Security</p>
            <p className="text-[9px] text-slate-400">Authenticator app enabled</p>
          </div>
        </div>
        <button 
          onClick={() => setIs2FAEnabled(!is2FAEnabled)}
          className={`w-12 h-6 rounded-full p-1 transition-all flex ${is2FAEnabled ? "bg-blue-600 justify-end" : "bg-slate-200 dark:bg-slate-700 justify-start"}`}
        >
          <motion.div layout className="w-4 h-4 bg-white rounded-full shadow-lg" />
        </button>
      </div>
    </div>
  );
}
