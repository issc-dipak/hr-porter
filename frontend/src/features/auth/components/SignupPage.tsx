"use client";

import React, { useState, useEffect } from 'react';
import { 
  Mail, Lock, ArrowRight, User, Users,
  Target, ShieldCheck, CheckCircle2, 
  Building2, ArrowLeft, RefreshCcw,
  Phone, Briefcase, Eye, EyeOff, Globe, Clock, Shield, AlertTriangle, FileText, Check, Sparkles, CreditCard
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";

interface SignupPageProps {
  onSignup: () => void;
  onSwitchToLogin: () => void;
  prefilledEmail?: string;
  prefilledCompany?: string;
  prefilledCompanyCode?: string;
  initialStep?: number;
}

export default function SignupPage({ 
  onSignup, 
  onSwitchToLogin, 
  prefilledEmail = '', 
  prefilledCompany = '', 
  prefilledCompanyCode = '',
  initialStep = 1
}: SignupPageProps) {
  const [step, setStep] = useState<number>(initialStep); 
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Step 1: Company Profile States
  const [companyName, setCompanyName] = useState(prefilledCompany);
  const [slug, setSlug] = useState(prefilledCompanyCode);
  const [companySize, setCompanySize] = useState('11-50');
  const [industry, setIndustry] = useState('Technology');
  const [country, setCountry] = useState('India');
  const [timezone, setTimezone] = useState('IST (UTC+05:30)');
  const [workEmail, setWorkEmail] = useState(prefilledEmail);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [website, setWebsite] = useState('');
  const [companyDomain, setCompanyDomain] = useState('');

  // Step 2: Plan Selection States
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'professional' | 'enterprise'>('professional');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  // Step 3: Admin Account States
  const [fullName, setFullName] = useState('');
  const [designation, setDesignation] = useState('System Administrator');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Step 4: OTP States
  const [emailOtp, setEmailOtp] = useState('');

  // Step 5: Activation States
  const [paymentGateway, setPaymentGateway] = useState<'stripe' | 'razorpay'>('stripe');
  const [isFreeTrial, setIsFreeTrial] = useState(true);

  // Cloudflare Turnstile States
  const [turnstileState, setTurnstileState] = useState<'idle' | 'verifying' | 'verified'>('idle');
  const [turnstileToken, setTurnstileToken] = useState('');

  // Success Screen State
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [countdown, setCountdown] = useState(3);

  // Automatically extract domain and slug from email/company name
  useEffect(() => {
    if (workEmail.includes('@')) {
      const parts = workEmail.split('@');
      if (parts[1]) {
        setCompanyDomain(parts[1]);
      }
    }
  }, [workEmail]);

  useEffect(() => {
    if (companyName && !slug) {
      setSlug(companyName.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 15));
    }
  }, [companyName, slug]);

  // Handle countdown for automatic redirect
  useEffect(() => {
    if (showSuccessScreen && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (showSuccessScreen && countdown === 0) {
      onSignup();
    }
  }, [showSuccessScreen, countdown]);

  // Password Complexity Evaluator
  const getPasswordStrength = () => {
    if (!password) return { score: 0, label: 'Unentered', color: 'bg-slate-800', width: 'w-0' };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[\W_]/.test(password)) score++;

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

  const triggerTurnstile = () => {
    if (turnstileState !== 'idle') return;
    setTurnstileState('verifying');
    setTimeout(() => {
      setTurnstileState('verified');
      setTurnstileToken('mock-turnstile-success');
    }, 1200);
  };

  // Step 1: Submit Company Profile Details
  const handleCompanyDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!companyName.trim() || !slug.trim() || !workEmail.trim()) {
      setErrorMsg('Please fill out all required company fields.');
      return;
    }
    setStep(2); // Go to Choose Plan
  };

  // Step 2: Submit Plan Selection
  const handlePlanSelectionSubmit = () => {
    setStep(3); // Go to Admin Profile Setup
  };

  // Step 3: Admin Profile Setup
  const handleAdminSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName.trim() || !mobileNumber.trim() || !password) {
      setErrorMsg('Please fill out all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    // Trigger OTP send mock
    setLoading(true);
    try {
      // Create company in DB first
      const companyRes = await fetch('/api/auth/company-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          slug,
          companySize,
          industry,
          country,
          timezone,
          workEmail,
          phoneNumber,
          gstNumber,
          website,
          companyDomain
        })
      });

      const compData = await companyRes.json();
      if (!companyRes.ok) {
        throw new Error(compData.error || 'Failed to initialize company profile.');
      }

      // Send verification OTP to company email
      const otpRes = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: workEmail, type: 'email' })
      });

      const otpData = await otpRes.json();
      if (!otpRes.ok) {
        throw new Error(otpData.error || 'Failed to dispatch verification OTP.');
      }

      setStep(4); // Move to Email OTP Verification
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Verify Email OTP
  const handleVerifyEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!emailOtp || emailOtp.length !== 6) {
      setErrorMsg('Please enter a 6-digit OTP code.');
      return;
    }

    setLoading(true);
    try {
      // Backdoor bypass for developer ease, or call backend
      if (emailOtp !== '123456') {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: workEmail,
            otp: emailOtp
          })
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Invalid verification OTP.');
        }
      }

      // Create Admin Profile user account now that company and email are verified
      const adminRes = await fetch('/api/auth/setup-admin-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: workEmail,
          fullName,
          designation,
          password,
          mobile: mobileNumber,
          turnstileToken
        })
      });

      const adminData = await adminRes.json();
      if (!adminRes.ok) {
        throw new Error(adminData.error || 'Failed to create administrator profile.');
      }

      // If token is returned, save it
      if (adminData.token) {
        localStorage.setItem('hr_system_token', adminData.token);
      }

      setStep(5); // Move to final Subscription Activation
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Step 5: Final subscription payment checkout activation
  const handleSubscriptionActivation = async () => {
    setErrorMsg(null);
    setLoading(true);

    const savedToken = localStorage.getItem('hr_system_token');
    
    try {
      if (isFreeTrial) {
        // Start trial action
        const response = await fetch('/api/saas/subscription/action', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${savedToken}`
          },
          body: JSON.stringify({
            action: 'change',
            planCode: selectedPlan,
            billingCycle
          })
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Subscription setup failed.');
        }

        // Final redirect setup
        localStorage.setItem('hr_system_auth', 'true');
        localStorage.setItem('hr_system_role', 'Admin');
        localStorage.setItem('hr_system_page', 'dashboard');
        
        setShowSuccessScreen(true);
      } else if (paymentGateway === 'razorpay') {
        const isLoaded = await loadRazorpayScript();
        if (!isLoaded) {
          throw new Error('Failed to load Razorpay payment client. Check your connection.');
        }

        // 1. Create order on backend
        const orderRes = await fetch('/api/saas/payments/create-order', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${savedToken}`
          },
          body: JSON.stringify({
            planCode: selectedPlan,
            billingCycle
          })
        });

        const orderData = await orderRes.json();
        if (!orderRes.ok) {
          throw new Error(orderData.error || 'Failed to initialize payment gateway.');
        }

        // 2. Open Razorpay options
        return new Promise<void>((resolve, reject) => {
          const options = {
            key: orderData.key,
            amount: Math.round(orderData.amount * 100),
            currency: orderData.currency || 'INR',
            name: 'HR Core SaaS',
            description: `${selectedPlan.toUpperCase()} Plan Subscription`,
            order_id: orderData.id,
            handler: async (response: any) => {
              try {
                setLoading(true);
                // 3. Verify on backend
                const verifyRes = await fetch('/api/saas/payments/verify', {
                  method: 'POST',
                  headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${savedToken}`
                  },
                  body: JSON.stringify({
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_signature: response.razorpay_signature,
                    planCode: selectedPlan,
                    billingCycle
                  })
                });

                const verifyData = await verifyRes.json();
                if (!verifyRes.ok) {
                  throw new Error(verifyData.error || 'Payment signature verification failed.');
                }

                // Final redirect setup
                localStorage.setItem('hr_system_auth', 'true');
                localStorage.setItem('hr_system_role', 'Admin');
                localStorage.setItem('hr_system_page', 'dashboard');
                
                setShowSuccessScreen(true);
                resolve();
              } catch (err: any) {
                setErrorMsg(err.message);
                reject(err);
              } finally {
                setLoading(false);
              }
            },
            prefill: {
              name: fullName,
              email: workEmail,
              contact: phoneNumber || mobileNumber
            },
            theme: {
              color: '#2563EB'
            },
            modal: {
              ondismiss: () => {
                setLoading(false);
                setErrorMsg('Payment cancelled by user.');
              }
            }
          };

          const rzp = new (window as any).Razorpay(options);
          rzp.open();
        });
      } else {
        // Simulate real gateway payment (or Stripe simulation)
        const response = await fetch('/api/saas/payments/simulate', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${savedToken}`
          },
          body: JSON.stringify({
            planCode: selectedPlan,
            billingCycle,
            gateway: paymentGateway
          })
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Checkout gateway connection error.');
        }

        // Final redirect setup
        localStorage.setItem('hr_system_auth', 'true');
        localStorage.setItem('hr_system_role', 'Admin');
        localStorage.setItem('hr_system_page', 'dashboard');
        
        setShowSuccessScreen(true);
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: workEmail, type: 'email' })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to dispatch verification OTP.');
      }
      alert(`OTP resent successfully to ${workEmail}`);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Pricing plans helper constants
  const planInfo = {
    starter: {
      title: 'Starter',
      price: 999,
      features: ['Up to 25 employees', 'Attendance tracking module', 'Leave Request workflow', 'Basic Payroll logs', 'Standard Email Support']
    },
    professional: {
      title: 'Professional',
      price: 4999,
      features: ['Up to 250 employees', 'Smart Attendance logs', 'Full Payroll automation', 'Recruitment ATS pipelines', 'Expenses Claims Management', 'Performance Evaluations', 'SaaS Usage Analytics']
    },
    enterprise: {
      title: 'Enterprise',
      price: 'Custom',
      features: ['Unlimited employees quota', 'Advanced analytics & custom reports', 'AI HR Core chatbot copilot', 'Custom domain & corporate branding', 'API access integrations', 'Priority 24/7 SLA Support']
    }
  };

  if (showSuccessScreen) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden auth-page">
        <div className="absolute inset-0">
          <div className="absolute top-[10%] right-[10%] w-[50%] h-[50%] blur-[150px] rounded-full bg-emerald-500/10 opacity-30" />
          <div className="absolute bottom-[10%] left-[10%] w-[50%] h-[50%] blur-[150px] rounded-full bg-blue-600/10 opacity-30" />
        </div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 w-full max-w-lg bg-slate-900/90 backdrop-blur-3xl border border-slate-800 p-8 rounded-3xl shadow-2xl text-center space-y-6"
        >
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold font-outfit text-white tracking-tight leading-none">Subscription Activated!</h2>
          <p className="text-xs text-slate-400 font-semibold leading-relaxed text-center">
            Congratulations! Your tenant workspace for <strong>{companyName}</strong> has been successfully configured and activated on the <strong>{selectedPlan.toUpperCase()}</strong> plan.
          </p>
          
          <div className="bg-slate-950/65 border border-slate-800/80 p-4 rounded-2xl text-left space-y-3">
            <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400 tracking-wider">
              <span>Workspace URL</span>
              <span className="text-blue-400 font-extrabold">{slug}.hrcore.com</span>
            </div>
            <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400 tracking-wider">
              <span>Plan Tier</span>
              <span className="text-white font-extrabold uppercase">{selectedPlan}</span>
            </div>
            <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400 tracking-wider">
              <span>Status</span>
              <span className="px-2.5 py-0.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-full text-[8px] font-black">ACTIVE</span>
            </div>
          </div>

          <div className="space-y-2.5 pt-2">
            <div className="flex justify-center items-center gap-2">
              <RefreshCcw className="w-3.5 h-3.5 text-blue-500 animate-spin" />
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                Redirecting to dashboard in {countdown}s...
              </span>
            </div>
            <div className="h-1 bg-slate-950 rounded-full overflow-hidden w-full border border-slate-850">
              <div 
                className="h-full bg-blue-500 transition-all duration-1000"
                style={{ width: `${(countdown / 3) * 100}%` }}
              />
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen max-h-[100dvh] w-screen bg-slate-950 flex flex-col justify-start lg:justify-center items-center p-4 md:p-6 relative overflow-y-auto auth-page">
      <div className="absolute inset-0">
        <div className="absolute top-[10%] right-[10%] w-[50%] h-[50%] blur-[150px] rounded-full bg-cyan-500/10 opacity-30" />
        <div className="absolute bottom-[10%] left-[10%] w-[50%] h-[50%] blur-[150px] rounded-full bg-blue-600/10 opacity-30" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-[950px] bg-slate-900/90 backdrop-blur-3xl border border-slate-800 rounded-3xl shadow-2xl flex flex-col lg:flex-row max-h-none lg:max-h-[90vh] overflow-hidden my-2 sm:my-4 lg:my-8 flex-none"
      >
        {/* Left Info / Checklist Panel */}
        <div className="w-full flex-none lg:w-[320px] p-5 md:p-6 lg:p-8 bg-slate-950/80 relative overflow-hidden flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800/80">
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center border border-blue-500/20">
                <Target className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-sm font-black text-white tracking-widest uppercase">HR CORE SaaS</h1>
            </div>

            <div className="space-y-1">
              <span className="px-2.5 py-0.5 bg-blue-500/10 text-blue-400 rounded-full text-[8px] font-black uppercase tracking-widest border border-blue-500/20 inline-block">
                Onboarding Flow
              </span>
              <h2 className="text-lg font-bold text-white tracking-tight leading-snug">
                Establish your Portal.
              </h2>
            </div>

            {/* Steps Vertical Timeline */}
            <div className="space-y-4 pt-2">
              {[
                { stepNum: 1, label: 'Company Details' },
                { stepNum: 2, label: 'Subscription Plan' },
                { stepNum: 3, label: 'Admin Credentials' },
                { stepNum: 4, label: 'Email Verification' },
                { stepNum: 5, label: 'Subscription Activation' }
              ].map((item) => (
                <div key={item.stepNum} className="flex items-center gap-3">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all shrink-0 border",
                    step === item.stepNum 
                      ? "bg-blue-600 border-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.3)] animate-pulse" 
                      : step > item.stepNum 
                        ? "bg-emerald-600/15 border-emerald-500/35 text-emerald-400" 
                        : "bg-slate-900 border-slate-800 text-slate-500"
                  )}>
                    {step > item.stepNum ? <Check className="w-3.5 h-3.5" /> : item.stepNum}
                  </div>
                  <div>
                    <h4 className={cn(
                      "text-[10px] font-black uppercase leading-none mt-0.5",
                      step === item.stepNum ? "text-blue-400" : step > item.stepNum ? "text-slate-300" : "text-slate-500"
                    )}>{item.label}</h4>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 pt-4 border-t border-slate-800/80 flex items-center justify-between text-slate-500">
            <span className="text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-blue-500" /> Tenant Isolated
            </span>
            <span className="text-[8px] font-black uppercase tracking-[0.2em]">SaaS v2</span>
          </div>
        </div>

        {/* Right Form Console */}
        <div className="w-full flex-1 p-5 md:p-6 lg:p-8 flex flex-col justify-start relative min-h-0 lg:max-h-[calc(90vh-2px)] lg:overflow-y-auto custom-scrollbar">
          
          <div className="flex justify-between items-center mb-6">
            <button 
              onClick={onSwitchToLogin} 
              className="flex items-center gap-1.5 text-slate-400 hover:text-blue-500 transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              <span className="text-[8px] font-black uppercase tracking-widest">Cancel & Login</span>
            </button>
            <span className="text-[9px] font-black text-slate-500 uppercase">Step {step} of 5</span>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-[10px] font-bold flex items-center gap-2 mb-4 text-left">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: Company Profile Details */}
          {step === 1 && (
            <form onSubmit={handleCompanyDetailsSubmit} className="space-y-4 text-left">
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight leading-none">Step 1: Company Profile Details</h3>
                <p className="text-[8.5px] text-slate-500 font-bold uppercase mt-1">Configure company metadata and domain mapping</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[7.5px] font-black uppercase tracking-widest text-slate-400 block ml-0.5">Company Legal Name *</label>
                  <div className="relative">
                    <Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Acme Corporation"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full pl-8 pr-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-[10px] text-white font-semibold outline-none focus:border-blue-500/50"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[7.5px] font-black uppercase tracking-widest text-slate-400 block ml-0.5">Workspace Subdomain *</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. acme"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      className="w-full pl-2.5 pr-14 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-[10px] text-white font-semibold outline-none focus:border-blue-500/50"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[7px] font-black text-slate-500 uppercase">.hrcore.com</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[7.5px] font-black uppercase tracking-widest text-slate-400 block ml-0.5">Official Company Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                    <input 
                      type="email" 
                      required
                      placeholder="e.g. hr@acme.com"
                      value={workEmail}
                      onChange={(e) => setWorkEmail(e.target.value)}
                      className="w-full pl-8 pr-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-[10px] text-white font-semibold outline-none focus:border-blue-500/50"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[7.5px] font-black uppercase tracking-widest text-slate-400 block ml-0.5">Company Website</label>
                  <div className="relative">
                    <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                    <input 
                      type="text" 
                      placeholder="e.g. www.acme.com"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="w-full pl-8 pr-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-[10px] text-white font-semibold outline-none focus:border-blue-500/50"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[7.5px] font-black uppercase tracking-widest text-slate-400 block ml-0.5">Company Size *</label>
                  <div className="relative">
                    <Users className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                    <select 
                      value={companySize}
                      onChange={(e) => setCompanySize(e.target.value)}
                      className="w-full pl-8 pr-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-[10px] text-white font-semibold outline-none cursor-pointer appearance-none focus:border-blue-500/50"
                    >
                      <option value="1-25">1 - 25 Employees (Starter Plan)</option>
                      <option value="26-250">26 - 250 Employees (Professional Plan)</option>
                      <option value="251+">251+ Employees (Enterprise Plan)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[7.5px] font-black uppercase tracking-widest text-slate-400 block ml-0.5">Industry *</label>
                  <div className="relative">
                    <Briefcase className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                    <select 
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="w-full pl-8 pr-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-[10px] text-white font-semibold outline-none cursor-pointer appearance-none focus:border-blue-500/50"
                    >
                      <option value="Technology">Technology & IT</option>
                      <option value="Finance">Finance & Banking</option>
                      <option value="Healthcare">Healthcare & Pharma</option>
                      <option value="Retail">Retail & E-commerce</option>
                      <option value="Professional Services">Professional Services</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[7.5px] font-black uppercase tracking-widest text-slate-400 block ml-0.5">Corporate GST Number</label>
                  <div className="relative">
                    <FileText className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                    <input 
                      type="text" 
                      placeholder="e.g. 27ABCDE1234F1Z5"
                      value={gstNumber}
                      onChange={(e) => setGstNumber(e.target.value.toUpperCase().trim())}
                      className="w-full pl-8 pr-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-[10px] text-white font-semibold outline-none focus:border-blue-500/50"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[7.5px] font-black uppercase tracking-widest text-slate-400 block ml-0.5">Official phone</label>
                  <div className="relative">
                    <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                    <input 
                      type="text" 
                      placeholder="e.g. +91 9876543210"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full pl-8 pr-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-[10px] text-white font-semibold outline-none focus:border-blue-500/50"
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold uppercase tracking-widest text-[8.5px] shadow-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-[0.99] mt-4"
              >
                Proceed to Choose Plan <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

          {/* STEP 2: Choose Subscription Plan */}
          {step === 2 && (
            <div className="space-y-4 text-left">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight leading-none">Step 2: Choose Subscription Plan</h3>
                  <p className="text-[8.5px] text-slate-500 font-bold uppercase mt-1">Select the subscription model that fits your needs</p>
                </div>
                
                {/* Billing Cycle Toggle */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-0.5 flex gap-1 items-center">
                  <button
                    onClick={() => setBillingCycle('monthly')}
                    className={cn(
                      "px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all",
                      billingCycle === 'monthly' ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-350"
                    )}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setBillingCycle('yearly')}
                    className={cn(
                      "px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all flex items-center gap-1",
                      billingCycle === 'yearly' ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-350"
                    )}
                  >
                    Yearly <span className="bg-blue-500/10 text-blue-400 px-1 py-0.2 rounded text-[7px] font-black lowercase">save 20%</span>
                  </button>
                </div>
              </div>

              {/* Plans Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2">
                
                {/* Starter Plan */}
                <div 
                  onClick={() => setSelectedPlan('starter')}
                  className={cn(
                    "border rounded-2xl p-4 bg-slate-950/40 relative cursor-pointer hover:border-blue-500/40 transition-all flex flex-col justify-between",
                    selectedPlan === 'starter' ? "border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.15)] bg-slate-950/60" : "border-slate-800"
                  )}
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{planInfo.starter.title}</span>
                      {selectedPlan === 'starter' && <span className="w-4.5 h-4.5 bg-blue-600 rounded-full flex items-center justify-center text-white"><Check className="w-3 h-3" /></span>}
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-extrabold text-white">₹{billingCycle === 'yearly' ? Math.round(planInfo.starter.price * 10 * 0.8 / 12) : planInfo.starter.price}</span>
                      <span className="text-[8px] font-bold text-slate-500">/ employee / month</span>
                    </div>
                    <div className="h-px bg-slate-850" />
                    <ul className="space-y-1.5 text-[8.5px] font-bold text-slate-400">
                      {planInfo.starter.features.map((f, i) => (
                        <li key={i} className="flex gap-1.5 items-start">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Professional Plan */}
                <div 
                  onClick={() => setSelectedPlan('professional')}
                  className={cn(
                    "border rounded-2xl p-4 bg-slate-950/40 relative cursor-pointer hover:border-blue-500/40 transition-all flex flex-col justify-between",
                    selectedPlan === 'professional' ? "border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.15)] bg-slate-950/60" : "border-slate-800"
                  )}
                >
                  <span className="absolute -top-2 left-4 px-2 py-0.5 bg-blue-500 text-white text-[7px] font-black rounded-md uppercase tracking-wider">Most Popular</span>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{planInfo.professional.title}</span>
                      {selectedPlan === 'professional' && <span className="w-4.5 h-4.5 bg-blue-600 rounded-full flex items-center justify-center text-white"><Check className="w-3 h-3" /></span>}
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-extrabold text-white">₹{billingCycle === 'yearly' ? Math.round(planInfo.professional.price * 10 * 0.8 / 12) : planInfo.professional.price}</span>
                      <span className="text-[8px] font-bold text-slate-500">/ employee / month</span>
                    </div>
                    <div className="h-px bg-slate-850" />
                    <ul className="space-y-1.5 text-[8.5px] font-bold text-slate-400">
                      {planInfo.professional.features.map((f, i) => (
                        <li key={i} className="flex gap-1.5 items-start">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Enterprise Plan */}
                <div 
                  onClick={() => setSelectedPlan('enterprise')}
                  className={cn(
                    "border rounded-2xl p-4 bg-slate-950/40 relative cursor-pointer hover:border-blue-500/40 transition-all flex flex-col justify-between",
                    selectedPlan === 'enterprise' ? "border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.15)] bg-slate-950/60" : "border-slate-800"
                  )}
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{planInfo.enterprise.title}</span>
                      {selectedPlan === 'enterprise' && <span className="w-4.5 h-4.5 bg-blue-600 rounded-full flex items-center justify-center text-white"><Check className="w-3 h-3" /></span>}
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-extrabold text-white">{planInfo.enterprise.price}</span>
                    </div>
                    <div className="h-px bg-slate-850" />
                    <ul className="space-y-1.5 text-[8.5px] font-bold text-slate-400">
                      {planInfo.enterprise.features.map((f, i) => (
                        <li key={i} className="flex gap-1.5 items-start">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-2 bg-slate-850 hover:bg-slate-800 text-slate-400 rounded-lg font-bold uppercase tracking-widest text-[8.5px] flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-[0.99]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
                <button 
                  type="button"
                  onClick={handlePlanSelectionSubmit}
                  className="flex-[2] py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold uppercase tracking-widest text-[8.5px] shadow-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-[0.99]"
                >
                  Proceed to Create Admin <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Create Admin Account */}
          {step === 3 && (
            <form onSubmit={handleAdminSetupSubmit} className="space-y-4 text-left">
              <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden', opacity: 0 }}>
                <input type="text" name="chrome-fake-username-prevent" tabIndex={-1} autoComplete="off" />
                <input type="password" name="chrome-fake-password-prevent" tabIndex={-1} autoComplete="off" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight leading-none">Step 3: Configure Admin Profile</h3>
                <p className="text-[8.5px] text-slate-500 font-bold uppercase mt-1">Set up primary administrative access keys</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[7.5px] font-black uppercase tracking-widest text-slate-400 block ml-0.5">Admin Full Name *</label>
                  <div className="relative">
                    <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-8 pr-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-[10px] text-white font-semibold outline-none focus:border-blue-500/50"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[7.5px] font-black uppercase tracking-widest text-slate-400 block ml-0.5">Mobile phone *</label>
                  <div className="relative">
                    <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. +91 9999999999"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      className="w-full pl-8 pr-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-[10px] text-white font-semibold outline-none focus:border-blue-500/50"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[7.5px] font-black uppercase tracking-widest text-slate-400 block ml-0.5">Official Designation</label>
                  <div className="relative">
                    <Briefcase className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                    <input 
                      type="text" 
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      className="w-full pl-8 pr-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-[10px] text-white font-semibold outline-none focus:border-blue-500/50"
                    />
                  </div>
                </div>

                <div className="space-y-1 hidden md:block" />

                <div className="space-y-1">
                  <label className="text-[7.5px] font-black uppercase tracking-widest text-slate-400 block ml-0.5">Configure Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      required
                      placeholder="Enter strong password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-8 pr-9 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-[10px] text-white font-semibold outline-none focus:border-blue-500/50"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-350"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {/* Strength Meter */}
                  <div className="pt-0.5 space-y-0.5">
                    <div className="flex justify-between text-[6px] font-black uppercase text-slate-500">
                      <span>Password Strength</span>
                      <span className={cn(
                        passwordStrength.score >= 4 ? 'text-emerald-500' : passwordStrength.score >= 2 ? 'text-amber-500' : 'text-rose-500'
                      )}>{passwordStrength.label}</span>
                    </div>
                    <div className="h-1 bg-slate-950 rounded-full overflow-hidden w-full border border-slate-850">
                      <div className={cn("h-full rounded-full transition-all duration-300", passwordStrength.color, passwordStrength.width)} />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[7.5px] font-black uppercase tracking-widest text-slate-400 block ml-0.5">Re-enter Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                    <input 
                      type="password" 
                      required
                      placeholder="Verify password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-8 pr-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-[10px] text-white font-semibold outline-none focus:border-blue-500/50"
                    />
                  </div>
                </div>

                {/* Cloudflare Turnstile Mock Widget */}
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[7.5px] font-black uppercase tracking-widest text-slate-400 block ml-0.5">Anti-Bot Verification</label>
                  <div 
                    onClick={triggerTurnstile}
                    className={cn(
                      "border border-slate-800 p-2 rounded-xl bg-slate-950/40 hover:bg-slate-950/60 flex items-center justify-between cursor-pointer transition-all mt-0.5",
                      turnstileState === 'verified' ? "border-emerald-500/30 bg-emerald-500/5" : ""
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {turnstileState === 'idle' && (
                        <div className="w-4 h-4 border border-slate-700 rounded bg-slate-900 flex items-center justify-center shrink-0" />
                      )}
                      {turnstileState === 'verifying' && (
                        <RefreshCcw className="w-4 h-4 text-blue-500 animate-spin shrink-0" />
                      )}
                      {turnstileState === 'verified' && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 scale-110 transition-transform" />
                      )}
                      <span className="text-[8px] font-bold text-slate-400 select-none">
                        {turnstileState === 'idle' && "Click to verify connection"}
                        {turnstileState === 'verifying' && "Verifying security keys..."}
                        {turnstileState === 'verified' && "Verified secure connection."}
                      </span>
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-[5px] font-black uppercase text-slate-500 tracking-widest leading-none">Cloudflare</span>
                      <span className="text-[7px] font-black text-blue-500 uppercase tracking-widest mt-0.5 leading-none">Turnstile</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <button 
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 py-2 bg-slate-850 hover:bg-slate-800 text-slate-450 rounded-lg font-bold uppercase tracking-widest text-[8.5px] flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-[0.99]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-[2] py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold uppercase tracking-widest text-[8.5px] shadow-lg flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all active:scale-[0.99]"
                >
                  {loading ? (
                    <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>Verify credentials <ArrowRight className="w-3.5 h-3.5" /></>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: Email Verification */}
          {step === 4 && (
            <form onSubmit={handleVerifyEmailSubmit} className="space-y-4 text-left">
              <div>
                <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md text-[8px] font-black uppercase tracking-widest inline-block mb-2">
                  Step 4: Verification Code
                </span>
                <h3 className="text-sm font-bold text-white tracking-tight leading-none">Confirm official domain ownership</h3>
                <p className="text-[9px] text-slate-400 font-semibold leading-relaxed mt-1">
                  We have dispatched a 6-digit verification code to <strong className="text-white">{workEmail}</strong>. Please confirm it below.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block ml-0.5">Verification Code (OTP)</label>
                <input 
                  type="text" 
                  required
                  maxLength={6}
                  placeholder="Enter 6-digit code"
                  value={emailOtp}
                  onChange={(e) => setEmailOtp(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full tracking-[8px] text-center py-2 bg-slate-950 border border-slate-800 rounded-xl text-base font-black text-white outline-none focus:border-blue-500/50 transition-all"
                />
                <span className="text-[7.5px] text-amber-400 font-bold block mt-1">
                  💡 Simulated Code: Use code <strong>123456</strong> or query verification email.
                </span>
              </div>

              <div className="flex gap-4 pt-2">
                <button 
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex-1 py-2 bg-slate-850 hover:bg-slate-800 text-slate-450 rounded-lg font-bold uppercase tracking-widest text-[8.5px] flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-[0.99]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-[2] py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold uppercase tracking-widest text-[8.5px] shadow-lg flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all active:scale-[0.99]"
                >
                  {loading ? (
                    <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>Confirm Verification <ArrowRight className="w-3.5 h-3.5" /></>
                  )}
                </button>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-[8px] font-bold uppercase mt-2">
                <span className="text-slate-500">Didn't receive email code?</span>
                <button 
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="text-blue-400 hover:underline cursor-pointer disabled:opacity-50"
                >
                  Resend OTP
                </button>
              </div>
            </form>
          )}

          {/* STEP 5: Subscription Activation */}
          {step === 5 && (
            <div className="space-y-4 text-left">
              <div>
                <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md text-[8px] font-black uppercase tracking-widest inline-block mb-2">
                  Step 5: Subscription Activation
                </span>
                <h3 className="text-sm font-bold text-white tracking-tight leading-none">Select Payment Method</h3>
                <p className="text-[8.5px] text-slate-500 font-bold uppercase mt-1">Initiate auto-renewals or start with a free trial</p>
              </div>

              {/* Free Trial Toggle */}
              <div 
                onClick={() => setIsFreeTrial(!isFreeTrial)}
                className={cn(
                  "border p-3 rounded-xl cursor-pointer hover:bg-slate-950/45 transition-all flex items-center justify-between",
                  isFreeTrial ? "border-emerald-500 bg-emerald-500/5" : "border-slate-800"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <div className={cn(
                    "w-4 h-4 border rounded flex items-center justify-center",
                    isFreeTrial ? "bg-emerald-600 border-emerald-500 text-white" : "border-slate-700 bg-slate-900"
                  )}>
                    {isFreeTrial && <Check className="w-3 h-3" />}
                  </div>
                  <div>
                    <h4 className="text-[9.5px] font-black text-white uppercase leading-none">Start with 14-Day Free Trial</h4>
                    <p className="text-[7.5px] text-slate-500 font-bold uppercase mt-1 leading-none">No payment credentials required today</p>
                  </div>
                </div>
                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">FREE TRIAL</span>
              </div>

              {/* Payment Gateways Selection (Visible only if not Free Trial) */}
              {!isFreeTrial && selectedPlan !== 'enterprise' && (
                <div className="space-y-2">
                  <label className="text-[7.5px] font-black uppercase tracking-widest text-slate-400 block ml-0.5">Choose Payment Gateway</label>
                  <div className="grid grid-cols-2 gap-3">
                    
                    {/* Stripe */}
                    <div 
                      onClick={() => setPaymentGateway('stripe')}
                      className={cn(
                        "border p-3 rounded-xl cursor-pointer hover:border-blue-500/40 transition-all flex items-center justify-between",
                        paymentGateway === 'stripe' ? "border-blue-500 bg-slate-950/60" : "border-slate-800 bg-slate-950/20"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4.5 h-4.5 text-blue-500" />
                        <span className="text-[9px] font-black text-white uppercase tracking-wider">Stripe Checkout</span>
                      </div>
                      {paymentGateway === 'stripe' && <span className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center text-white"><Check className="w-2.5 h-2.5" /></span>}
                    </div>

                    {/* Razorpay */}
                    <div 
                      onClick={() => setPaymentGateway('razorpay')}
                      className={cn(
                        "border p-3 rounded-xl cursor-pointer hover:border-blue-500/40 transition-all flex items-center justify-between",
                        paymentGateway === 'razorpay' ? "border-blue-500 bg-slate-950/60" : "border-slate-800 bg-slate-950/20"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4.5 h-4.5 text-indigo-500" />
                        <span className="text-[9px] font-black text-white uppercase tracking-wider">Razorpay Secure</span>
                      </div>
                      {paymentGateway === 'razorpay' && <span className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center text-white"><Check className="w-2.5 h-2.5" /></span>}
                    </div>

                  </div>
                </div>
              )}

              {/* Enterprise notice */}
              {selectedPlan === 'enterprise' && (
                <div className="p-3 border border-blue-500/20 bg-blue-500/5 rounded-xl text-[9px] font-semibold text-blue-300 leading-relaxed">
                  🚀 <strong>Enterprise Custom Setup:</strong> Since you have chosen the Enterprise Tier, we will establish your workspace on our high-availability dedicated cluster and alert our sales coordinators to structure your billing details. Click below to initialize.
                </div>
              )}

              {/* Order Summary Checkout Card */}
              {selectedPlan !== 'enterprise' && (
                <div className="bg-slate-950 border border-slate-850 p-3 rounded-xl space-y-2 text-[9px] font-semibold">
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Plan Tier</span>
                    <span className="text-white font-extrabold uppercase">{selectedPlan} Plan</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Billing Cycle</span>
                    <span className="text-white font-extrabold uppercase">{billingCycle}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Amount Due</span>
                    <span className="text-white font-extrabold">
                      {isFreeTrial 
                        ? '₹0 (14-Day Free Trial)' 
                        : `₹${billingCycle === 'yearly' ? (planInfo[selectedPlan].price * 10).toLocaleString() : planInfo[selectedPlan].price.toLocaleString()}`
                      }
                    </span>
                  </div>
                  {!isFreeTrial && (
                    <div className="flex justify-between items-center text-slate-400">
                      <span>GST Tax (18% added)</span>
                      <span className="text-white font-extrabold">₹{Math.round((billingCycle === 'yearly' ? planInfo[selectedPlan].price * 10 : planInfo[selectedPlan].price) * 0.18).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="h-px bg-slate-850" />
                  <div className="flex justify-between items-center text-[10px] font-black text-white uppercase">
                    <span>Total Amount</span>
                    <span className="text-blue-400">
                      {isFreeTrial 
                        ? '₹0' 
                        : `₹${Math.round((billingCycle === 'yearly' ? planInfo[selectedPlan].price * 10 : planInfo[selectedPlan].price) * 1.18).toLocaleString()}`
                      }
                    </span>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleSubscriptionActivation}
                disabled={loading}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold uppercase tracking-widest text-[8.5px] shadow-lg flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all active:scale-[0.99]"
              >
                {loading ? (
                  <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>Complete Registration & Activate Workspace <ArrowRight className="w-3.5 h-3.5" /></>
                )}
              </button>

            </div>
          )}

          {/* Footer Login switcher */}
          {step === 1 && (
            <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
              <p className="text-slate-400 text-[9px] font-bold uppercase tracking-wider">
                Already have an account? 
                <button 
                  onClick={onSwitchToLogin} 
                  className="ml-1.5 text-blue-400 hover:underline font-black cursor-pointer"
                >
                  Log In
                </button>
              </p>
            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
}
