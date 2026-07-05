"use client";

import React, { useState, useEffect } from 'react';
import { 
  Mail, Lock, ArrowRight, 
  Target, ShieldCheck, 
  AlertCircle, Eye, EyeOff, RefreshCcw, Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";

interface LoginPageProps {
  onLogin: (role: string, userObj?: any) => void;
  onSwitchToSignup: () => void;
  onSwitchToForgot: () => void;
  onUnverifiedUser?: (email: string) => void;
}

const ROLE_THEMES: Record<string, {
  primaryBg: string;
  primaryBorder: string;
  primaryText: string;
  focusRing: string;
  focusBorder: string;
  hoverText: string;
  leftGradient: string;
  leftAura1: string;
  leftAura2: string;
  title: string;
  highlight: string;
  highlightClass: string;
  iconFocusClass: string;
  subtitle: string;
  headingWords: string[];
}> = {
  Admin: {
    primaryBg: 'bg-cyan-600 hover:bg-cyan-700 shadow-cyan-500/20',
    primaryBorder: 'border-cyan-500',
    primaryText: 'text-cyan-500',
    focusRing: 'focus:ring-cyan-500/5',
    focusBorder: 'focus:border-cyan-500/50',
    hoverText: 'hover:text-cyan-650',
    leftGradient: 'linear-gradient(to bottom right, #0284c7, #06b6d4)',
    leftAura1: 'bg-blue-600',
    leftAura2: 'bg-cyan-600',
    title: 'Admin',
    highlight: 'Control Center',
    highlightClass: 'text-cyan-300',
    iconFocusClass: 'group-focus-within:text-cyan-500',
    subtitle: 'Access system controls, check audit logs, and configure security rules.',
    headingWords: ['System', 'Security', '&', 'Administration']
  },
  HR: {
    primaryBg: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20',
    primaryBorder: 'border-indigo-500',
    primaryText: 'text-indigo-500',
    focusRing: 'focus:ring-indigo-500/5',
    focusBorder: 'focus:border-indigo-500/50',
    hoverText: 'hover:text-indigo-600',
    leftGradient: 'linear-gradient(to bottom right, #4f46e5, #3b82f6)',
    leftAura1: 'bg-indigo-600',
    leftAura2: 'bg-pink-600',
    title: 'HR',
    highlight: 'Talent Management',
    highlightClass: 'text-pink-300',
    iconFocusClass: 'group-focus-within:text-indigo-500',
    subtitle: 'Manage employee payrolls, request pipelines, and team performance.',
    headingWords: ['Empowering', 'your', 'Workforce', 'Intelligence.']
  },
  Employee: {
    primaryBg: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20',
    primaryBorder: 'border-emerald-500',
    primaryText: 'text-emerald-500',
    focusRing: 'focus:ring-emerald-500/5',
    focusBorder: 'focus:border-emerald-500/50',
    hoverText: 'hover:text-emerald-600',
    leftGradient: 'linear-gradient(to bottom right, #059669, #0d9488)',
    leftAura1: 'bg-emerald-600',
    leftAura2: 'bg-teal-600',
    title: 'Employee',
    highlight: 'Workspace Hub',
    highlightClass: 'text-emerald-300',
    iconFocusClass: 'group-focus-within:text-emerald-500',
    subtitle: 'Mark daily attendance, apply for leaves, and track active project tasks.',
    headingWords: ['Productive', 'Collaborative', '&', 'Workspace']
  },
  'Super Admin': {
    primaryBg: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20',
    primaryBorder: 'border-indigo-500',
    primaryText: 'text-indigo-400',
    focusRing: 'focus:ring-indigo-500/5',
    focusBorder: 'focus:border-indigo-500/50',
    hoverText: 'hover:text-indigo-650',
    leftGradient: 'linear-gradient(to bottom right, #4f46e5, #312e81)',
    leftAura1: 'bg-indigo-600',
    leftAura2: 'bg-slate-900',
    title: 'Super Admin',
    highlight: 'SaaS Platform Owner',
    highlightClass: 'text-indigo-300',
    iconFocusClass: 'group-focus-within:text-indigo-500',
    subtitle: 'Access platform settings, manage subscription tiers, billing, feature gates, and monitor server/queue status.',
    headingWords: ['SaaS', 'Multi-Tenant', 'Control', 'Panel']
  }
};

export default function LoginPage({ onLogin, onSwitchToSignup, onSwitchToForgot, onUnverifiedUser }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Super Admin');
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [branding, setBranding] = useState<any>(null);

  const activeTheme = ROLE_THEMES[role] || ROLE_THEMES['Super Admin'];

  useEffect(() => {
    const fetchLoginBranding = async () => {
      const params = new URLSearchParams(window.location.search);
      const companyId = params.get('companyId');
      const companyCode = params.get('companyCode');
      
      let lookupId = companyId || '';
      let lookupCode = companyCode || '';
      
      if (!lookupId && !lookupCode) {
        const savedProfile = localStorage.getItem('hr_system_profile');
        if (savedProfile) {
          try {
            const parsed = JSON.parse(savedProfile);
            lookupId = parsed.companyId || '';
            lookupCode = parsed.companyCode || '';
          } catch (_) {}
        }
      }

      if (lookupId || lookupCode) {
        const query = lookupId ? `companyId=${lookupId}` : `companyCode=${lookupCode}`;
        try {
          const res = await fetch(`/api/company/branding?${query}`);
          if (res.ok) {
            const data = await res.json();
            if (data) {
              setBranding(data);
              // Apply theme variables dynamically to the document root
              const root = document.documentElement;
              if (data.primaryColor) root.style.setProperty('--primary', data.primaryColor);
              if (data.secondaryColor) root.style.setProperty('--secondary-accent', data.secondaryColor);
              if (data.accentColor) root.style.setProperty('--info', data.accentColor);
              
              if (data.favicon) {
                let faviconLink = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
                if (!faviconLink) {
                  faviconLink = document.createElement('link');
                  faviconLink.rel = 'icon';
                  document.getElementsByTagName('head')[0].appendChild(faviconLink);
                }
                faviconLink.href = data.favicon;
              }
            }
          }
        } catch (err) {
          console.error(err);
        }
      }
    };
    fetchLoginBranding();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.requiresVerification) {
          try {
            await fetch('/api/auth/send-otp', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email }),
            });
          } catch (otpErr) {
            console.error('Auto resend OTP failed:', otpErr);
          }
          if (onUnverifiedUser) {
            onUnverifiedUser(email);
            return;
          }
        }
        throw new Error(data.error || 'Invalid credentials');
      }

      localStorage.setItem('hr_system_token', data.token);

      // Decode JWT to get companyCode and companyName
      try {
        const payload = JSON.parse(atob(data.token.split('.')[1]));
        const savedProfile = localStorage.getItem('hr_system_profile');
        const existingProfile = savedProfile ? JSON.parse(savedProfile) : {};
        localStorage.setItem('hr_system_profile', JSON.stringify({
          ...existingProfile,
          companyName: payload.companyName || data.user?.companyName || '',
          companyCode: payload.companyCode || '',
          companyId: payload.companyId || data.user?.companyId || 'company_001',
          name: payload.fullName || data.user?.fullName || '',
          email: payload.email || data.user?.email || '',
        }));
      } catch (e) {
        console.warn('Could not decode JWT payload', e);
      }

      if (data.user && data.user.role) {
        onLogin(data.user.role, data.user);
      } else {
        onLogin('HR', { fullName: 'HR Manager', email });
      }
      
    } catch (err: any) {
      localStorage.removeItem('hr_system_token');
      setError(err.message || 'Invalid credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="h-screen max-h-[100dvh] w-screen bg-slate-950 flex flex-col justify-start md:justify-center items-center p-4 md:p-6 relative overflow-y-auto auth-page" 
      style={branding?.loginBackground ? { backgroundImage: `url(${branding.loginBackground})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
      suppressHydrationWarning
    >
      {branding?.loginBackground && (
        <div className="absolute inset-0 bg-slate-950/75 z-0 pointer-events-none" />
      )}
      {/* Dynamic Shifting Background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 45, 0],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className={cn("absolute top-[-20%] left-[-10%] w-[60%] h-[60%] blur-[150px] rounded-full transition-colors duration-500", activeTheme.leftAura1)}
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            rotate: [0, -45, 0],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className={cn("absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] blur-[150px] rounded-full transition-colors duration-500", activeTheme.leftAura2)}
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-[760px] bg-white/5 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden my-2 sm:my-4 lg:my-8 flex-none"
      >
        {/* Left Side - Design */}
        <div className="flex-1 p-6 lg:p-8 bg-slate-900 relative overflow-hidden hidden md:flex flex-col justify-between">
          <motion.div 
            style={{ backgroundImage: activeTheme.leftGradient }}
            className="absolute inset-0 opacity-40 transition-all duration-500"
          />
          
          <div className="relative z-10">
            <motion.div 
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-1.5 mb-4"
            >
              <div className="w-6.5 h-6.5 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-md border border-white/20 shadow-lg shadow-white/5">
                {branding?.companyLogo ? (
                  <img src={branding.companyLogo} alt="Logo" className="w-5 h-5 object-contain" />
                ) : (
                  <Target className="w-4 h-4 text-white" />
                )}
              </div>
              <h1 className="text-xs font-black text-white tracking-tight uppercase italic">
                {branding?.companyShortName || branding?.companyName || 'HR CORE'}
              </h1>
            </motion.div>
            
             <div className="space-y-1.5">
              {activeTheme.headingWords.map((word, i) => (
                <motion.h2 
                  key={word + i}
                  initial={{ x: -15, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                  className={cn(
                    "text-xl lg:text-2xl font-black leading-none tracking-wide transition-colors duration-500 uppercase",
                    i === activeTheme.headingWords.length - 1 ? "text-indigo-400" : "text-white"
                  )}
                >
                  {word}
                </motion.h2>
              ))}
            </div>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.95 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-slate-350 dark:text-slate-300 text-[10px] font-bold mt-4 leading-relaxed max-w-xs transition-colors duration-500"
            >
              {activeTheme.subtitle}
            </motion.p>
          </div>

          <motion.div 
            initial={{ y: 5, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="relative z-10"
          >
            <div className="flex items-center gap-2 p-2.5 bg-white/5 rounded-lg backdrop-blur-md border border-white/10 shadow-lg max-w-[210px]">
              <div className="w-7 h-7 bg-gradient-to-tr from-emerald-400 to-cyan-400 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-900" />
              </div>
              <div>
                <p className="text-[8.5px] font-black text-white uppercase tracking-widest leading-none">Enterprise Security</p>
                <p className="text-[7px] text-blue-200 font-bold opacity-60 mt-0.5">Military-grade protection</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Side - Form */}
        <div className="flex-1 p-5 md:p-6 lg:p-8 bg-slate-900 flex flex-col justify-start lg:justify-center transition-colors duration-500">
          <div className="max-w-xs mx-auto w-full">
            {branding?.companyLogo && (
              <div className="flex justify-center md:justify-start mb-4">
                <img src={branding.companyLogo} alt="Logo" className="h-10 w-auto object-contain" />
              </div>
            )}
            {branding?.loginBanner && (
              <div className="mb-4 rounded-lg overflow-hidden border border-slate-800">
                <img src={branding.loginBanner} alt="Banner" className="w-full h-auto object-cover max-h-24" />
              </div>
            )}
            <motion.div 
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-4 text-center md:text-left"
            >
              <h3 className="text-base font-bold text-white tracking-tight leading-none mb-0.5">
                {branding?.welcomeMessage || 'Login'}
              </h3>
              <p className="text-[9px] text-slate-400 font-semibold">
                {branding?.companyShortName ? `Welcome to ${branding.companyShortName} HR Portal` : 'Access your secure workspace'}
              </p>
            </motion.div>

             <form onSubmit={handleLogin} className="space-y-2.5">
              <motion.div 
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-0.5"
              >
                <label className="text-[7.5px] font-bold uppercase tracking-[0.12em] text-slate-400 ml-0.5">Corporate Email</label>
                <div className="relative group">
                  <Mail className={cn("absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 transition-colors", activeTheme.iconFocusClass)} />
                  <input 
                    type="email" 
                    required
                    placeholder="Enter corporate email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={cn(
                      "w-full pl-8 pr-2.5 py-1.5 bg-slate-800/50 border border-slate-800 rounded-lg text-[10px] text-white font-medium outline-none transition-all",
                      activeTheme.focusBorder,
                      activeTheme.focusRing
                    )}
                    suppressHydrationWarning
                  />
                </div>
              </motion.div>



              <motion.div 
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-0.5"
              >
                <div className="flex justify-between items-center ml-0.5">
                  <label className="text-[7.5px] font-bold uppercase tracking-[0.12em] text-slate-400">Security Key</label>
                  <button type="button" onClick={onSwitchToForgot} className={cn("text-[7.5px] font-black uppercase tracking-widest hover:underline transition-colors", activeTheme.primaryText)} suppressHydrationWarning>Forgot?</button>
                </div>
                <div className="relative group">
                  <Lock className={cn("absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 transition-colors", activeTheme.iconFocusClass)} />
                  <input 
                    type={showPass ? 'text' : 'password'} 
                    required
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={cn(
                      "w-full pl-8 pr-8 py-1.5 bg-slate-800/50 border border-slate-800 rounded-lg text-[10px] text-white font-medium outline-none transition-all",
                      activeTheme.focusBorder,
                      activeTheme.focusRing
                    )}
                    suppressHydrationWarning
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                    suppressHydrationWarning
                  >
                    {showPass ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </button>
                </div>
              </motion.div>

              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    className="flex items-center gap-1.5 p-2 bg-rose-900/20 text-rose-450 rounded-lg text-[7.5px] font-black uppercase tracking-widest border border-rose-900/30"
                  >
                    <AlertCircle className="w-3 h-3 shrink-0" /> {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={isLoading}
                className={cn(
                  "w-full relative group overflow-hidden py-2 text-white rounded-lg font-bold uppercase tracking-[0.2em] text-[8.5px] shadow-lg disabled:opacity-70 mt-0.5 transition-colors duration-500",
                  activeTheme.primaryBg
                )}
                suppressHydrationWarning
              >
                <span className="relative z-10 flex items-center justify-center gap-1">
                  {isLoading ? (
                    <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>AUTHORIZE ACCESS <ArrowRight className="w-3.5 h-3.5" /></>
                  )}
                </span>
              </motion.button>
            </form>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-4 pt-3.5 border-t border-slate-800 text-center"
            >
              <p className="text-slate-450 text-[8.5px] font-bold">
                Don't have an account? 
                <button 
                  onClick={onSwitchToSignup} 
                  className={cn("ml-1.5 hover:underline transition-colors font-black", activeTheme.primaryText)}
                  suppressHydrationWarning
                >
                  Create Secure Account
                </button>
              </p>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
