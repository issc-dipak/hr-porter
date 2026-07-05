"use client";

import React, { useState, useEffect } from 'react';
import { 
  Lock, ArrowRight, ShieldCheck, 
  CheckCircle2, RefreshCcw, Phone, 
  Eye, EyeOff, Shield, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";

interface AcceptInvitePageProps {
  token: string;
  onSuccess: () => void;
  onBackToLogin: () => void;
}

export default function AcceptInvitePage({ token, onSuccess, onBackToLogin }: AcceptInvitePageProps) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Security Verification CAPTCHA States
  const [captcha, setCaptcha] = useState({ num1: 0, num2: 0, ans: 0 });
  const [captchaInput, setCaptchaInput] = useState('');

  useEffect(() => {
    generateCaptcha();
  }, []);

  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 9) + 1;
    const num2 = Math.floor(Math.random() * 9) + 1;
    setCaptcha({ num1, num2, ans: num1 + num2 });
    setCaptchaInput('');
  };

  // Password Complexity Evaluator
  const getPasswordStrength = () => {
    if (!password) return { score: 0, label: 'Unentered', color: 'bg-slate-800', width: 'w-0' };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/\W/.test(password)) score++;

    switch (score) {
      case 0:
      case 1:
        return { score, label: 'Weak', color: 'bg-red-500', width: 'w-1/4' };
      case 2:
      case 3:
        return { score, label: 'Medium', color: 'bg-amber-500', width: 'w-2/4' };
      case 4:
        return { score, label: 'Strong', color: 'bg-indigo-500', width: 'w-3/4' };
      case 5:
      default:
        return { score, label: 'Excellent', color: 'bg-emerald-500', width: 'w-full' };
    }
  };

  const passwordStrength = getPasswordStrength();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (passwordStrength.score < 5) {
      setErrorMsg('Password strength is not sufficient. Ensure it has at least 8 characters and includes uppercase, lowercase, numbers, and special characters.');
      return;
    }

    if (parseInt(captchaInput, 10) !== captcha.ans) {
      setErrorMsg('CAPTCHA verification failed. Please try again.');
      generateCaptcha();
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password,
          phoneNumber
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept invitation.');
      }

      alert('Account activated successfully! You can now log in.');
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message);
      generateCaptcha();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen max-h-[100dvh] w-screen bg-slate-950 flex flex-col justify-start lg:justify-center items-center p-4 md:p-6 relative overflow-y-auto auth-page">
      {/* Aura background */}
      <div className="absolute inset-0">
        <div className="absolute top-[10%] left-[10%] w-[50%] h-[50%] blur-[150px] rounded-full bg-indigo-500/10 opacity-30" />
        <div className="absolute bottom-[10%] right-[10%] w-[50%] h-[50%] blur-[150px] rounded-full bg-violet-600/10 opacity-30" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-[850px] bg-slate-900/90 backdrop-blur-3xl border border-slate-800 rounded-3xl shadow-2xl flex flex-col lg:flex-row overflow-hidden my-2 sm:my-4 lg:my-8 flex-none"
      >
        {/* Left info panel */}
        <div className="w-full flex-none lg:flex-1 p-5 md:p-6 lg:p-8 bg-slate-950/80 relative overflow-hidden flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800/80">
          <div className="relative z-10 space-y-4 md:space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center border border-indigo-500/20">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-sm font-black text-white tracking-widest uppercase">HR CORE</h1>
            </div>

            <div className="space-y-2">
              <span className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-full text-[9px] font-black uppercase tracking-widest border border-indigo-500/20 inline-block">
                Secure Invitation Verification
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight leading-snug">
                Join your workspace. <br />
                <span className="text-indigo-400">Activate your profile.</span>
              </h2>
              <p className="text-slate-400 text-[10px] leading-relaxed max-w-xs">
                To finalize registration, configure a secure password and enter your contact details below.
              </p>
            </div>

            {/* Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 pt-2">
              {[
                { title: 'Secure Password Standard', desc: 'Uppercase, lowercase, numbers & symbol required' },
                { title: 'Profile Activation', desc: 'Link employee record with workspace status' },
                { title: 'SaaS Architecture Isolation', desc: 'Securely map role into tenant database' }
              ].map((item, idx) => (
                <div key={idx} className="flex gap-3 text-left">
                  <div className="w-5 h-5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-indigo-400 shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black text-slate-200 uppercase leading-none mt-0.5">{item.title}</h4>
                    <p className="text-[8px] text-slate-500 font-bold uppercase mt-1 leading-none">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 pt-4 md:pt-6 border-t border-slate-800/80 flex items-center justify-between text-slate-500">
            <span className="text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" /> Authorized Setup
            </span>
            <span className="text-[7px] font-black uppercase tracking-[0.2em]">HR Core v2026</span>
          </div>
        </div>

        {/* Right Form Console */}
        <div className="w-full flex-none lg:flex-[1.4] p-5 md:p-6 lg:p-8 flex flex-col justify-start relative min-h-0 lg:max-h-[calc(90vh-2px)] lg:overflow-y-auto custom-scrollbar">
          
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-bold text-white tracking-tight leading-none">Accept Workspace Invite</h3>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-[10px] font-bold flex items-center gap-2 mb-4 text-left">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div className="space-y-1">
              <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block ml-0.5">Mobile Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="tel" 
                  placeholder="e.g. +91 99999 99999"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-bold outline-none focus:border-indigo-500/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block ml-0.5">Set Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-bold outline-none focus:border-indigo-500/50"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {/* Strength Meter */}
                <div className="pt-1 space-y-1">
                  <div className="flex justify-between text-[7px] font-black uppercase text-slate-500">
                    <span>Password Strength</span>
                    <span className={cn(
                      passwordStrength.score >= 5 ? 'text-emerald-500' : passwordStrength.score >= 3 ? 'text-amber-500' : 'text-rose-500'
                    )}>{passwordStrength.label}</span>
                  </div>
                  <div className="h-1 bg-slate-950 rounded-full overflow-hidden w-full border border-slate-855">
                    <div className={cn("h-full rounded-full transition-all duration-300", passwordStrength.color, passwordStrength.width)} />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block ml-0.5">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input 
                    type="password" 
                    required
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-bold outline-none focus:border-indigo-500/50"
                  />
                </div>
              </div>

              {/* Math CAPTCHA */}
              <div className="space-y-1 md:col-span-2 bg-slate-950/40 border border-slate-800/60 p-3 rounded-2xl">
                <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block ml-0.5">Anti-Bot Security Challenge</label>
                <div className="flex items-center gap-3 mt-1.5">
                  <div className="px-4 py-2 bg-slate-950 border border-slate-800 text-slate-300 font-mono text-xs rounded-xl font-black select-none tracking-wider shrink-0">
                    {captcha.num1} + {captcha.num2} = ?
                  </div>
                  <input 
                    type="number"
                    required
                    placeholder="Answer"
                    value={captchaInput}
                    onChange={(e) => setCaptchaInput(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-bold outline-none focus:border-indigo-500/50"
                  />
                  <button 
                    type="button" 
                    onClick={generateCaptcha}
                    className="p-2 hover:bg-slate-850 rounded-xl text-slate-400 hover:text-white shrink-0"
                  >
                    <RefreshCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button 
                type="button"
                onClick={onBackToLogin}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold uppercase tracking-widest text-[9px] flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-[0.99]"
              >
                Back to Login
              </button>
              <button 
                type="submit"
                disabled={loading}
                className="flex-[2] py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold uppercase tracking-widest text-[9px] shadow-lg flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all active:scale-[0.99]"
              >
                {loading ? (
                  <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>Activate Account <ArrowRight className="w-3.5 h-3.5" /></>
                )}
              </button>
            </div>
          </form>

        </div>
      </motion.div>
    </div>
  );
}
