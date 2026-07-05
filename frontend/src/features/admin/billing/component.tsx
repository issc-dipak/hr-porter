"use client";

import React, { useState, useEffect } from 'react';
import { 
  CreditCard, Check, AlertCircle, RefreshCcw, Download, Info, CheckCircle2, DollarSign, Calendar, Users, Cpu, Database
} from 'lucide-react';
import { cn } from "@/lib/utils";

interface BillingDashboardProps {
  addNotification?: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export default function BillingDashboard({ addNotification }: BillingDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [subData, setSubData] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Checkout Modal State
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<'starter' | 'professional'>('professional');
  const [checkoutCycle, setCheckoutCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [checkoutGateway, setCheckoutGateway] = useState<'stripe' | 'razorpay'>('stripe');

  // Fetch subscription & invoice history
  const fetchBillingDetails = async () => {
    const savedToken = localStorage.getItem('hr_system_token');
    try {
      // 1. Subscription details
      const subRes = await fetch('/api/saas/subscription', {
        headers: { 'Authorization': `Bearer ${savedToken}` }
      });
      const subJson = await subRes.json();
      if (subRes.ok) {
        setSubData(subJson);
      }

      // 2. Invoices list
      const invRes = await fetch('/api/saas/invoices', {
        headers: { 'Authorization': `Bearer ${savedToken}` }
      });
      const invJson = await invRes.json();
      if (invRes.ok) {
        setInvoices(invJson);
      }

    } catch (err) {
      console.error('Failed to query billing data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingDetails();
  }, []);

  // Trigger billing action (pause, resume, cancel, renew)
  const handleAction = async (action: string, extra = {}) => {
    setActionLoading(true);
    const savedToken = localStorage.getItem('hr_system_token');
    try {
      const res = await fetch('/api/saas/subscription/action', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${savedToken}`
        },
        body: JSON.stringify({ action, ...extra })
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Action failed');
      }

      if (addNotification) {
        addNotification(`Subscription action: ${action} succeeded.`, 'success');
      } else {
        alert(json.message || 'Action executed successfully');
      }
      
      await fetchBillingDetails();
    } catch (err: any) {
      if (addNotification) {
        addNotification(err.message, 'error');
      } else {
        alert(err.message);
      }
    } finally {
      setActionLoading(false);
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

  // Simulate or process real payment checkout
  const handleSimulatePayment = async () => {
    setActionLoading(true);
    const savedToken = localStorage.getItem('hr_system_token');
    try {
      if (checkoutGateway === 'razorpay') {
        const isLoaded = await loadRazorpayScript();
        if (!isLoaded) {
          throw new Error('Failed to load Razorpay client. Please check connection.');
        }

        // 1. Create order on backend
        const orderRes = await fetch('/api/saas/payments/create-order', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${savedToken}`
          },
          body: JSON.stringify({
            planCode: checkoutPlan,
            billingCycle: checkoutCycle
          })
        });

        const orderData = await orderRes.json();
        if (!orderRes.ok) {
          throw new Error(orderData.error || 'Failed to initialize payment.');
        }

        // 2. Open Razorpay options
        return new Promise<void>((resolve, reject) => {
          const options = {
            key: orderData.key,
            amount: Math.round(orderData.amount * 100),
            currency: orderData.currency || 'INR',
            name: 'HR Core SaaS',
            description: `${checkoutPlan.toUpperCase()} Plan Subscription Change`,
            order_id: orderData.id,
            handler: async (response: any) => {
              try {
                setActionLoading(true);
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
                    planCode: checkoutPlan,
                    billingCycle: checkoutCycle
                  })
                });

                const verifyData = await verifyRes.json();
                if (!verifyRes.ok) {
                  throw new Error(verifyData.error || 'Payment signature verification failed.');
                }

                if (addNotification) {
                  addNotification('Subscription upgraded successfully via Razorpay!', 'success');
                } else {
                  alert('Subscription upgraded successfully via Razorpay!');
                }

                setShowCheckoutModal(false);
                await fetchBillingDetails();
                resolve();
              } catch (err: any) {
                if (addNotification) {
                  addNotification(err.message, 'error');
                } else {
                  alert(err.message);
                }
                reject(err);
              } finally {
                setActionLoading(false);
              }
            },
            theme: {
              color: '#2563EB'
            },
            modal: {
              ondismiss: () => {
                setActionLoading(false);
                if (addNotification) {
                  addNotification('Payment window closed.', 'info');
                } else {
                  alert('Payment window closed.');
                }
              }
            }
          };

          const rzp = new (window as any).Razorpay(options);
          rzp.open();
        });
      } else {
        const res = await fetch('/api/saas/payments/simulate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${savedToken}`
          },
          body: JSON.stringify({
            planCode: checkoutPlan,
            billingCycle: checkoutCycle,
            gateway: checkoutGateway
          })
        });
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || 'Payment simulation failed');
        }

        if (addNotification) {
          addNotification('Simulated payment processed successfully!', 'success');
        } else {
          alert('Simulated payment processed successfully!');
        }

        setShowCheckoutModal(false);
        await fetchBillingDetails();
      }
    } catch (err: any) {
      if (addNotification) {
        addNotification(err.message, 'error');
      } else {
        alert(err.message);
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Download Invoice TXT simulated file
  const handleDownloadInvoice = (invoiceNumber: string) => {
    const savedToken = localStorage.getItem('hr_system_token');
    window.open(`/api/saas/invoices?download=true&invoiceNumber=${invoiceNumber}&token=${savedToken}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <RefreshCcw className="w-8 h-8 text-blue-500 animate-spin" />
        <span className="text-xs font-black uppercase tracking-widest text-slate-500">Querying billing records...</span>
      </div>
    );
  }

  const sub = subData?.subscription;
  const plan = subData?.plan;
  const usage = subData?.usage;
  const daysRemaining = subData?.daysRemaining || 0;
  const upcomingInvoice = subData?.upcomingInvoice;

  // Plan Quotas
  const empLimit = plan?.employeeLimit || 25;
  const empCount = usage?.activeEmployees || 0;
  const empPercent = Math.min(100, Math.round((empCount / empLimit) * 100));

  // Storage limit mock: Starter allows 50MB, Professional 5GB
  const storageLimit = sub?.planCode === 'starter' ? 50 * 1024 * 1024 : 5 * 1024 * 1024 * 1024;
  const storageCount = usage?.storageUsageBytes || 45 * 1024 * 1024;
  const storagePercent = Math.min(100, Math.round((storageCount / storageLimit) * 100));

  // API Count mock
  const apiLimit = sub?.planCode === 'starter' ? 1000 : 100000;
  const apiCount = usage?.apiCallsCount || 185;
  const apiPercent = Math.min(100, Math.round((apiCount / apiLimit) * 100));

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto text-left">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-wider">Billing & Subscription</h1>
          <p className="text-xs text-slate-500 font-bold uppercase mt-0.5">Manage plan tiers, invoice history, payment credentials and quotas</p>
        </div>
        
        {sub?.status === 'trial' && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl text-[10px] font-black uppercase tracking-wider animate-pulse">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{daysRemaining} Days Left in Free Trial</span>
          </div>
        )}
      </div>

      {/* Overview Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Current Plan Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-950/40 dark:to-blue-900/20 border border-blue-200 dark:border-blue-800/50 shadow-sm flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Active License Plan</span>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white leading-none mt-1 uppercase">
              {plan?.name || `${sub?.planCode} plan`}
            </h3>
            <span className="inline-block px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/15 rounded-full text-[8px] font-black uppercase mt-2">
              Status: {sub?.status}
            </span>
          </div>
          
          <div className="pt-4 border-t border-blue-200/50 dark:border-slate-800 mt-4 flex justify-between items-baseline">
            <span className="text-xl font-extrabold text-blue-600 dark:text-blue-400">
              ₹{sub?.price?.toLocaleString() || 0}
            </span>
            <span className="text-[9px] font-bold text-slate-500">/ {sub?.billingCycle}</span>
          </div>
        </div>

        {/* Renewal & Billing Period */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-violet-100 to-violet-50 dark:from-violet-950/40 dark:to-violet-900/20 border border-violet-200 dark:border-violet-800/50 shadow-sm flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Renewal Date</span>
            <div className="flex items-center gap-2 mt-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-black text-slate-850 dark:text-slate-200">
                {sub?.endDate ? new Date(sub.endDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
              </span>
            </div>
          </div>
          
          <div className="pt-4 border-t border-violet-200/50 dark:border-slate-800 mt-4 flex justify-between items-center text-[9px] font-bold text-slate-450 uppercase">
            <span>Auto Renew</span>
            <span className={cn(
              "px-1.5 py-0.2 rounded font-black",
              sub?.autoRenew ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
            )}>
              {sub?.autoRenew ? 'ENABLED' : 'DISABLED'}
            </span>
          </div>
        </div>

        {/* Quota Usage Meter */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-950/40 dark:to-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 shadow-sm flex flex-col justify-between md:col-span-2">
          <div className="space-y-3">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">License Quota Enforcement</span>
            
            {/* Employee Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[9px] font-black text-slate-450 uppercase">
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-blue-500" /> Active Employee Slots</span>
                <span>{empCount} / {empLimit === 999999 ? 'Unlimited' : empLimit} ({empPercent}%)</span>
              </div>
              <div className="h-1.5 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden w-full border border-slate-200 dark:border-slate-850">
                <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${empPercent}%` }} />
              </div>
            </div>

            {/* Storage Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[9px] font-black text-slate-450 uppercase">
                <span className="flex items-center gap-1"><Database className="w-3.5 h-3.5 text-emerald-500" /> Data Storage</span>
                <span>{(storageCount / (1024 * 1024)).toFixed(1)} MB / {storageLimit === 999999 ? 'Unlimited' : `${(storageLimit / (1024 * 1024 * 1024)).toFixed(0)} GB`} ({storagePercent}%)</span>
              </div>
              <div className="h-1.5 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden w-full border border-slate-200 dark:border-slate-850">
                <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${storagePercent}%` }} />
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Subscription Action Controls */}
      <div className="p-4 rounded-2xl bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-500 shrink-0" />
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Need to adjust user limits? You can manage plan cycles, toggle suspensions, or pause automatic billing cycles.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-start sm:justify-end">
          {sub?.status === 'paused' ? (
            <button 
              disabled={actionLoading}
              onClick={() => handleAction('resume')}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer active:scale-95 disabled:opacity-50"
            >
              Resume Billing
            </button>
          ) : (
            <button 
              disabled={actionLoading}
              onClick={() => handleAction('pause')}
              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer active:scale-95 disabled:opacity-50"
            >
              Pause Billing
            </button>
          )}

          {sub?.status !== 'cancelled' && (
            <button 
              disabled={actionLoading}
              onClick={() => handleAction('cancel')}
              className="px-3 py-1.5 bg-rose-600/10 hover:bg-rose-600/20 text-rose-500 rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer active:scale-95 disabled:opacity-50"
            >
              Cancel Subscription
            </button>
          )}

          {sub?.status === 'expired' && (
            <button 
              disabled={actionLoading}
              onClick={() => handleAction('renew')}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer active:scale-95 disabled:opacity-50 animate-pulse"
            >
              Renew License
            </button>
          )}

          <button 
            onClick={() => {
              setCheckoutPlan(sub?.planCode === 'starter' ? 'professional' : 'starter');
              setShowCheckoutModal(true);
            }}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer active:scale-95"
          >
            Change/Upgrade Plan
          </button>
        </div>
      </div>

      {/* Main Grid: Invoice list and Upcoming billing */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Invoice List */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">Invoice History</h3>
            <span className="text-[8.5px] font-bold text-slate-500 uppercase">Paid transactions logs</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[10px] font-semibold text-slate-600 dark:text-slate-400">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[8px] font-black uppercase text-slate-500 tracking-wider">
                  <th className="py-2.5 text-left pl-2">Invoice Number</th>
                  <th className="py-2.5 text-left">Period</th>
                  <th className="py-2.5 text-right">Tax (GST)</th>
                  <th className="py-2.5 text-right">Total</th>
                  <th className="py-2.5 text-center">Status</th>
                  <th className="py-2.5 text-right pr-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 font-bold uppercase text-[9px]">No billing invoices found</td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv._id} className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                      <td className="py-3 pl-2 font-bold text-slate-900 dark:text-slate-200">{inv.invoiceNumber}</td>
                      <td className="py-3 uppercase">{inv.billingPeriod}</td>
                      <td className="py-3 text-right">₹{inv.taxAmount?.toLocaleString()}</td>
                      <td className="py-3 text-right font-bold text-slate-800 dark:text-slate-100">₹{inv.totalAmount?.toLocaleString()}</td>
                      <td className="py-3 text-center">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[8px] font-black uppercase",
                          inv.paymentStatus === 'paid' ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                        )}>
                          {inv.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3 text-right pr-2">
                        <button 
                          onClick={() => handleDownloadInvoice(inv.invoiceNumber)}
                          className="p-1 text-slate-400 hover:text-blue-500 transition-colors cursor-pointer"
                          title="Download Invoice File"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upcoming Invoice Details */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">Upcoming Invoice</h3>
            <span className="text-[8px] font-black bg-blue-500/10 text-blue-500 px-1.5 py-0.2 rounded uppercase">Next cycle</span>
          </div>

          {upcomingInvoice ? (
            <div className="space-y-4 text-xs font-semibold">
              <div className="flex justify-between items-center text-slate-500 text-[10px]">
                <span>Reference ID</span>
                <span className="text-slate-800 dark:text-white font-bold">{upcomingInvoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between items-center text-slate-500 text-[10px]">
                <span>Associated Plan</span>
                <span className="text-slate-800 dark:text-white font-bold uppercase">{upcomingInvoice.planName}</span>
              </div>
              <div className="flex justify-between items-center text-slate-500 text-[10px]">
                <span>Due Date</span>
                <span className="text-slate-850 dark:text-slate-200 font-bold">
                  {new Date(upcomingInvoice.dueDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>

              <div className="h-px bg-slate-100 dark:bg-slate-800" />
              
              <div className="space-y-1.5 text-[10px] text-slate-500">
                <div className="flex justify-between">
                  <span>Subtotal Price</span>
                  <span className="text-slate-800 dark:text-white">₹{upcomingInvoice.amount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST Tax (18% added)</span>
                  <span className="text-slate-800 dark:text-white">₹{upcomingInvoice.taxAmount?.toLocaleString()}</span>
                </div>
                <div className="h-px bg-slate-100 dark:bg-slate-800/60 my-1" />
                <div className="flex justify-between text-[11px] font-black text-slate-800 dark:text-white uppercase">
                  <span>Estimated Total</span>
                  <span className="text-blue-500">₹{upcomingInvoice.totalAmount?.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-[9.5px] text-slate-500 font-bold uppercase py-8 text-center">No upcoming bill scheduled</p>
          )}
        </div>

      </div>

      {/* Raise Technical/Billing Ticket to Super Admin */}
      <div className="w-full">
        <SupportTicketForm addNotification={addNotification} />
      </div>

      {/* Plan Checkout Modal Simulation */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 relative space-y-5 shadow-2xl">
            
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Change/Upgrade subscription</h3>
                <p className="text-[7.5px] text-slate-505 font-bold uppercase mt-0.5">Transition billing plans dynamically</p>
              </div>
              <button 
                onClick={() => setShowCheckoutModal(false)}
                className="text-slate-400 hover:text-white text-[10px] font-black uppercase"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              
              {/* Starter option */}
              <div 
                onClick={() => setCheckoutPlan('starter')}
                className={cn(
                  "border p-3.5 rounded-xl cursor-pointer hover:border-blue-500/40 transition-all flex flex-col justify-between",
                  checkoutPlan === 'starter' ? "border-blue-500 bg-slate-950/60" : "border-slate-800 bg-slate-950/10"
                )}
              >
                <span className="text-[8px] font-black uppercase text-slate-500">Starter Tier</span>
                <span className="text-lg font-extrabold text-white mt-1">₹999</span>
                <span className="text-[7.5px] text-slate-400 mt-2">Up to 25 Employees limit</span>
              </div>

              {/* Professional option */}
              <div 
                onClick={() => setCheckoutPlan('professional')}
                className={cn(
                  "border p-3.5 rounded-xl cursor-pointer hover:border-blue-500/40 transition-all flex flex-col justify-between",
                  checkoutPlan === 'professional' ? "border-blue-500 bg-slate-950/60" : "border-slate-800 bg-slate-950/10"
                )}
              >
                <span className="text-[8px] font-black uppercase text-slate-500">Professional Tier</span>
                <span className="text-lg font-extrabold text-white mt-1">₹4,999</span>
                <span className="text-[7.5px] text-slate-400 mt-2">Up to 250 Employees limit</span>
              </div>

            </div>

            {/* Cycle Selector */}
            <div className="space-y-1.5">
              <label className="text-[7.5px] font-black uppercase tracking-widest text-slate-400 block ml-0.5">Select billing cycle</label>
              <div className="bg-slate-950 p-0.5 rounded-xl border border-slate-850 flex gap-1 items-center">
                <button
                  onClick={() => setCheckoutCycle('monthly')}
                  className={cn(
                    "flex-1 py-1.5 rounded-lg text-[8.5px] font-black uppercase tracking-wider transition-all",
                    checkoutCycle === 'monthly' ? "bg-slate-850 text-white" : "text-slate-500 hover:text-slate-350"
                  )}
                >
                  Monthly cycle
                </button>
                <button
                  onClick={() => setCheckoutCycle('yearly')}
                  className={cn(
                    "flex-1 py-1.5 rounded-lg text-[8.5px] font-black uppercase tracking-wider transition-all",
                    checkoutCycle === 'yearly' ? "bg-slate-850 text-white" : "text-slate-500 hover:text-slate-350"
                  )}
                >
                  Annual cycle
                </button>
              </div>
            </div>

            {/* Gateway Selector */}
            <div className="space-y-1.5">
              <label className="text-[7.5px] font-black uppercase tracking-widest text-slate-400 block ml-0.5">Gateway credentials</label>
              <div className="grid grid-cols-2 gap-3">
                <div 
                  onClick={() => setCheckoutGateway('stripe')}
                  className={cn(
                    "border p-2.5 rounded-xl cursor-pointer hover:border-blue-500/40 text-center font-black uppercase text-[8.5px] tracking-wider",
                    checkoutGateway === 'stripe' ? "border-blue-500 text-blue-400 bg-slate-950/60" : "border-slate-800 text-slate-500"
                  )}
                >
                  Stripe gateway
                </div>
                <div 
                  onClick={() => setCheckoutGateway('razorpay')}
                  className={cn(
                    "border p-2.5 rounded-xl cursor-pointer hover:border-blue-500/40 text-center font-black uppercase text-[8.5px] tracking-wider",
                    checkoutGateway === 'razorpay' ? "border-blue-500 text-indigo-400 bg-slate-950/60" : "border-slate-800 text-slate-500"
                  )}
                >
                  Razorpay gateway
                </div>
              </div>
            </div>

            {/* Simulated Checkout Button */}
            <button
              onClick={handleSimulatePayment}
              disabled={actionLoading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer shadow-lg active:scale-[0.98] disabled:opacity-50"
            >
              {actionLoading ? 'Connecting Gateway...' : 'Initialize Checkout Gateway & Pay'}
            </button>

          </div>
        </div>
      )}

    </div>
  );
}

export function SupportTicketForm({ addNotification }: { addNotification?: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void }) {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('TECHNICAL ISSUE');
  const [submitting, setSubmitting] = useState(false);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchTicketHistory = async () => {
    setLoadingHistory(true);
    const savedToken = localStorage.getItem('hr_system_token');
    try {
      const res = await fetch('/api/saas/support-tickets', {
        headers: { 'Authorization': `Bearer ${savedToken}` }
      });
      if (res.ok) {
        setTickets(await res.json());
      }
    } catch (err) {}
    setLoadingHistory(false);
  };

  useEffect(() => {
    fetchTicketHistory();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    setSubmitting(true);
    const savedToken = localStorage.getItem('hr_system_token');
    try {
      const res = await fetch('/api/saas/support-tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${savedToken}`
        },
        body: JSON.stringify({ subject, description, category })
      });
      const data = await res.json();
      if (res.ok) {
        if (addNotification) {
          addNotification('Support query ticket raised successfully to Super Admin!', 'success');
        } else {
          alert('Support ticket raised successfully!');
        }
        setSubject('');
        setDescription('');
        await fetchTicketHistory();
      } else {
        throw new Error(data.error || 'Failed to submit ticket');
      }
    } catch (err: any) {
      if (addNotification) {
        addNotification(err.message, 'error');
      } else {
        alert(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">Raise Ticket to Super Admin</h3>
          <p className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">Encountered technical issues, billing discrepancies, or server bugs? Report directly to the platform owners</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[7.5px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-550 block ml-0.5">Query Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-805 rounded-lg text-[10px] text-slate-800 dark:text-white outline-none cursor-pointer"
              >
                <option value="TECHNICAL ISSUE">Technical Issue / Bug</option>
                <option value="ACCOUNT ACCESS">Account Access / Permissions</option>
                <option value="BILLING ENQUIRY">Billing & Invoices Enquiry</option>
                <option value="ASSET ISSUE">Asset & Resource Management</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[7.5px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-550 block ml-0.5">Subject / Title</label>
              <input 
                type="text"
                required
                placeholder="Brief description of query"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-955 border border-slate-205 rounded-lg text-[10px] text-slate-800 dark:text-white outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[7.5px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-550 block ml-0.5">Detailed Description</label>
            <textarea
              required
              rows={3}
              placeholder="Please detail the exact steps to reproduce the technical issue or specify the details of the problem..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-955 border border-slate-205 rounded-lg text-[10px] text-slate-800 dark:text-white outline-none resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-550 text-white rounded-xl text-[9px] font-black uppercase tracking-wider cursor-pointer disabled:opacity-50"
          >
            {submitting ? 'Submitting query...' : 'Dispatched Support Ticket'}
          </button>
        </form>
      </div>

      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">Support Query History</h3>
            <p className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">Track status resolution history of your technical requests</p>
          </div>
          <button 
            onClick={fetchTicketHistory}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg transition-colors border-none cursor-pointer"
          >
            <RefreshCcw className={cn("w-3.5 h-3.5", loadingHistory && "animate-spin")} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[10px] font-semibold text-slate-400 dark:text-slate-400">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[8px] font-black uppercase text-slate-500 tracking-wider">
                <th className="py-2.5 text-left pl-2">Ticket Number</th>
                <th className="py-2.5 text-left">Subject / Category</th>
                <th className="py-2.5 text-center">Status</th>
                <th className="py-2.5 text-right pr-2">Date Created</th>
              </tr>
            </thead>
            <tbody>
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500 font-bold uppercase text-[9.5px]">No support ticket records found</td>
                </tr>
              ) : (
                tickets.map((t) => (
                  <tr key={t._id} className="border-b border-slate-100/50 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-950/20 transition-colors">
                    <td className="py-3 pl-2 font-mono font-bold text-slate-800 dark:text-white">{t.ticketNumber}</td>
                    <td className="py-3">
                      <div className="font-bold text-slate-800 dark:text-slate-200">{t.subject}</div>
                      <span className="text-[7.5px] text-slate-400 font-black uppercase">{t.category}</span>
                    </td>
                    <td className="py-3 text-center">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase",
                        t.status === 'resolved' ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                      )}>{t.status === 'resolved' ? 'Resolved' : 'Pending'}</span>
                    </td>
                    <td className="py-3 text-right pr-2 font-medium text-slate-500">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
