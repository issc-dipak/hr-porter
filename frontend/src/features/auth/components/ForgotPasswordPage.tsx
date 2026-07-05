"use client";

import React, { useState } from 'react';
import { 
  Mail, Lock, ArrowRight, ArrowLeft,
  Target, AlertCircle, CheckCircle2, RefreshCcw, KeyRound
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ForgotPasswordPageProps {
  onSwitchToLogin: () => void;
}

export default function ForgotPasswordPage({ onSwitchToLogin }: ForgotPasswordPageProps) {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<1 | 2>(1); // Step 1: Send OTP, Step 2: Verify & Reset
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [emailSentStatus, setEmailSentStatus] = useState<'smtp' | 'console' | ''>('');

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMsg('');
    setEmailSentStatus('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to request OTP');
      }

      if (data.emailStatus === 'sent') {
        setSuccessMsg('OTP code sent successfully to your inbox!');
        setEmailSentStatus('smtp');
      } else {
        setSuccessMsg('OTP generated successfully (Logged to terminal console)!');
        setEmailSentStatus('console');
      }

      if (data.otp) {
        setOtp(data.otp);
      }
      
      setTimeout(() => {
        setStep(2);
        setSuccessMsg('');
      }, 600);

    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setIsLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update password');
      }

      setSuccessMsg('Password reset successfully! Redirecting...');
      
      setTimeout(() => {
        onSwitchToLogin();
      }, 600);

    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen max-h-[100dvh] w-screen bg-slate-950 flex flex-col justify-start md:justify-center items-center p-4 md:p-6 relative overflow-y-auto auth-page">
      {/* Moving Aura Background */}
      <div className="absolute inset-0">
        <motion.div 
          animate={{ 
            x: [0, 80, 0],
            y: [0, 40, 0],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 12, repeat: Infinity }}
          className="absolute top-[15%] left-[15%] w-[45%] h-[45%] bg-blue-600 blur-[130px] rounded-full"
        />
        <motion.div 
          animate={{ 
            x: [0, -80, 0],
            y: [0, -40, 0],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 16, repeat: Infinity }}
          className="absolute bottom-[15%] right-[15%] w-[45%] h-[45%] bg-purple-600 blur-[130px] rounded-full"
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, type: "spring" }}
        className="relative z-10 w-full max-w-[900px] bg-white/5 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden my-2 sm:my-4 lg:my-8 flex-none"
      >
        {/* Left Info Panel */}
        <div className="flex-1 p-8 lg:p-10 bg-slate-900 relative overflow-hidden hidden md:flex flex-col justify-between">
          <motion.div 
            animate={{ 
              background: [
                "linear-gradient(45deg, #1e3a8a, #581c87)",
                "linear-gradient(45deg, #581c87, #1e3a8a)"
              ]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 opacity-55"
          />

          <div className="relative z-10">
            <div className="flex items-center gap-2.5 mb-8">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/20">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-black text-white tracking-widest italic uppercase">HR CORE</h1>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-black text-white leading-tight uppercase tracking-tight">
                OTP <br />
                <span className="text-blue-400">Verification</span>
              </h2>
              <p className="text-slate-400 text-xs font-semibold leading-relaxed">
                An enterprise-grade 6-digit OTP security protocol has been established. Validate your profile using the code sent to your email.
              </p>
            </div>
          </div>

          <div className="relative z-10">
            <p className="text-white/40 text-[9px] font-black uppercase tracking-[0.3em]">OTP ENCRYPTION PROTOCOLS</p>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="flex-1 p-8 lg:p-10 bg-slate-900 flex flex-col justify-start lg:justify-center">
          <div className="max-w-xs mx-auto w-full">
            <motion.button 
              whileHover={{ x: -4 }}
              onClick={onSwitchToLogin} 
              className="flex items-center gap-1.5 text-slate-400 hover:text-blue-600 transition-colors mb-8 group"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="text-[9px] font-black uppercase tracking-widest">Back to Secure Login</span>
            </motion.button>

            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="mb-6">
                    <h3 className="text-xl font-black text-white tracking-tight leading-none mb-2 uppercase">Forgot Password</h3>
                    <p className="text-xs text-slate-400 font-semibold leading-relaxed">Enter your registered email address to receive a secure 6-digit OTP verification code.</p>
                  </div>

                  <form onSubmit={handleRequestOTP} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Corporate Email</label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <input 
                          type="email" 
                          required
                          placeholder="Enter corporate email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 bg-slate-800/50 border border-slate-800 rounded-xl text-xs font-bold outline-none focus:border-blue-500/55 focus:ring-4 focus:ring-blue-500/5 transition-all text-white"
                        />
                      </div>
                    </div>

                    <AnimatePresence>
                      {error && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="flex items-center gap-2.5 p-3 bg-rose-900/20 text-rose-450 rounded-xl text-[9px] font-black uppercase tracking-widest border border-rose-900/30"
                        >
                          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                        </motion.div>
                      )}
                      {successMsg && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="flex flex-col gap-1 p-3 bg-emerald-900/20 text-emerald-400 rounded-xl border border-emerald-900/30"
                        >
                          <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest">
                            <CheckCircle2 className="w-4 h-4 shrink-0" /> {successMsg}
                          </div>
                          {emailSentStatus === 'console' && (
                            <span className="text-[8px] font-bold text-slate-400 ml-6 uppercase tracking-wider leading-relaxed">
                              (Development Fallback: OTP logged to console)
                            </span>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      type="submit"
                      disabled={isLoading}
                      className="w-full relative group overflow-hidden py-3.5 bg-blue-600 text-white rounded-xl font-black uppercase tracking-[0.2em] text-[10px] shadow-lg shadow-blue-500/25 disabled:opacity-50 mt-2"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        {isLoading ? (
                          <RefreshCcw className="w-4 h-4 animate-spin" />
                        ) : (
                          <>SEND VERIFICATION OTP <ArrowRight className="w-4 h-4" /></>
                        )}
                      </span>
                    </motion.button>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="mb-6">
                    <h3 className="text-xl font-black text-white tracking-tight leading-none mb-2 uppercase">Verify OTP</h3>
                    <p className="text-xs text-slate-400 font-semibold leading-relaxed">Enter the 6-digit verification code sent to your email and set your new password.</p>
                  </div>

                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">6-Digit OTP Code</label>
                      <div className="relative group">
                        <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input 
                          type="text" 
                          required
                          maxLength={6}
                          placeholder="Enter OTP"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} // allow digits only
                          className="w-full pl-11 pr-4 py-3 bg-slate-800/50 border border-slate-800 rounded-xl text-xs font-black tracking-[0.5em] text-center outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all text-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">New Password</label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input 
                          type="password" 
                          required
                          placeholder="Enter new password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 bg-slate-800/50 border border-slate-800 rounded-xl text-xs font-bold outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all text-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Confirm Password</label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input 
                          type="password" 
                          required
                          placeholder="Confirm new password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 bg-slate-800/50 border border-slate-800 rounded-xl text-xs font-bold outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all text-white"
                        />
                      </div>
                    </div>

                    <AnimatePresence>
                      {error && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="flex items-center gap-2.5 p-3 bg-rose-900/20 text-rose-450 rounded-xl text-[9px] font-black uppercase tracking-widest border border-rose-900/30"
                        >
                          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                        </motion.div>
                      )}
                      {successMsg && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="flex items-center gap-2.5 p-3 bg-emerald-900/20 text-emerald-400 rounded-xl border border-emerald-900/30"
                        >
                          <CheckCircle2 className="w-4 h-4 shrink-0" /> {successMsg}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      type="submit"
                      disabled={isLoading}
                      className="w-full relative group overflow-hidden py-3.5 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-[0.2em] text-[10px] shadow-lg shadow-indigo-500/25 disabled:opacity-50 mt-2"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        {isLoading ? (
                          <RefreshCcw className="w-4 h-4 animate-spin" />
                        ) : (
                          <>UPDATE PASSWORD <ArrowRight className="w-4 h-4" /></>
                        )}
                      </span>
                    </motion.button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
