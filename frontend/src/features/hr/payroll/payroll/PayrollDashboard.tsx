"use client";

import React, { useState, useEffect } from 'react';
import { 
  Wallet, AlertCircle, TrendingUp, Users, X, Landmark, CheckCircle, Info, Cpu, Sparkles
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { PastelStatCard } from '@/components/ui/PastelStatCard';
import { usePermission } from '@/context/PermissionContext';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell 
} from 'recharts';

const formatCurrencyShort = (value: number) => {
  if (value >= 100000) {
    return `₹${(value / 100000).toFixed(value % 100000 === 0 ? 0 : 2)}L`;
  } else if (value >= 1000) {
    return `₹${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}K`;
  } else {
    return `₹${value.toLocaleString()}`;
  }
};


interface PayrollDashboardProps {
  dashboardStats: {
    totalPayout: number;
    pendingApproval: number;
    monthlyExpenses: number;
    totalEmployeesProcessed: number;
  };
  wallet: any;
  fetchWallet: () => Promise<void>;
  userRole?: string;
  payroll?: any[];
  employees?: any[];
}

export default function PayrollDashboard({ dashboardStats, wallet, fetchWallet, userRole = 'HR', payroll = [], employees = [] }: PayrollDashboardProps) {
  const { can } = usePermission();
  const [mounted, setMounted] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('100000');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTxns, setShowTxns] = useState(false);
  
  // Custom key input states
  const [customKeyId, setCustomKeyId] = useState('');
  const [envKeyDetected, setEnvKeyDetected] = useState(false);

  // Dynamic Monthly Expense Trend
  const expenseTrendData = React.useMemo(() => {
    const list = payroll || [];
    if (list.length === 0) {
      return [
        { month: 'Jan', expense: 0 },
        { month: 'Feb', expense: 0 },
        { month: 'Mar', expense: 0 },
        { month: 'Apr', expense: 0 },
        { month: 'May', expense: 0 }
      ];
    }
    const grouped: Record<string, number> = {};
    list.forEach(p => {
      const monthPart = p.month ? p.month.split(' ')[0] : 'May';
      grouped[monthPart] = (grouped[monthPart] || 0) + (p.gross || 0);
    });
    const monthsOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const activeMonths = Object.keys(grouped).sort((a, b) => monthsOrder.indexOf(a) - monthsOrder.indexOf(b));
    
    if (activeMonths.length <= 1) {
      const singleMonth = activeMonths[0] || 'May';
      const idx = monthsOrder.indexOf(singleMonth);
      const trend = [];
      for (let i = Math.max(0, idx - 4); i <= idx; i++) {
        const m = monthsOrder[i];
        trend.push({ month: m, expense: grouped[m] || 0 });
      }
      return trend;
    }
    
    return activeMonths.map(m => ({ month: m, expense: grouped[m] }));
  }, [payroll]);

  // Dynamic Department distribution
  const departmentCostData = React.useMemo(() => {
    const list = payroll || [];
    const deptCosts: Record<string, number> = {};
    
    list.forEach(p => {
      const emp = employees?.find(e => e.fullName === p.employeeName || e.email === p.employee);
      const dept = emp?.department || p.department || 'Other';
      deptCosts[dept] = (deptCosts[dept] || 0) + (p.gross || 0);
    });

    const totalCost = Object.values(deptCosts).reduce((a, b) => a + b, 0);

    if (totalCost === 0) {
      return [
        { name: 'Design', cost: 0, percentage: '0%', displayCost: '₹0L', color: 'bg-blue-600', fill: '#2563EB' },
        { name: 'Dev', cost: 0, percentage: '0%', displayCost: '₹0L', color: 'bg-pink-600', fill: '#DB2777' },
        { name: 'Mktg & HR', cost: 0, percentage: '0%', displayCost: '₹0L', color: 'bg-emerald-600', fill: '#10B981' }
      ];
    }

    const COLORS = ['bg-blue-600', 'bg-pink-600', 'bg-emerald-600', 'bg-purple-650', 'bg-amber-600'];
    const FILLS = ['#2563EB', '#DB2777', '#10B981', '#8B5CF6', '#F59E0B'];

    return Object.entries(deptCosts).map(([name, cost], idx) => {
      const percentage = totalCost > 0 ? Math.round((cost / totalCost) * 100) : 0;
      return {
        name,
        cost,
        percentage: `${percentage}%`,
        displayCost: `₹${(cost / 100000).toFixed(1)}L`,
        color: COLORS[idx % COLORS.length],
        fill: FILLS[idx % FILLS.length]
      };
    });
  }, [payroll, employees]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Check if key is in localStorage
    const savedKey = localStorage.getItem('rzp_test_key_id');
    if (savedKey) {
      setCustomKeyId(savedKey);
    }

    // Ping backend to check if .env has valid keys configured
    const checkConfig = async () => {
      try {
        const token = localStorage.getItem('hr_system_token');
        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        const res = await fetch('/api/razorpay/order', {
          method: 'POST',
          headers,
          body: JSON.stringify({ amount: 100 })
        });
        const order = await res.json();
        if (order.key && order.key !== 'rzp_test_YOUR_KEY_HERE') {
          setEnvKeyDetected(true);
        }
      } catch (e) {
        console.error(e);
      }
    };
    checkConfig();
  }, []);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleAddBalance = async (amount: number) => {
    setIsProcessing(true);
    const isScriptLoaded = await loadRazorpayScript();
    
    if (!isScriptLoaded) {
      alert("Failed to load Razorpay SDK. Please check your internet connection.");
      setIsProcessing(false);
      return;
    }

    try {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/razorpay/order', {
        method: 'POST',
        headers,
        body: JSON.stringify({ amount })
      });
      const order = await res.json();
      
      // Determine which key to use
      let activeKey = order.key;
      if (!activeKey || activeKey === 'rzp_test_YOUR_KEY_HERE') {
        activeKey = customKeyId;
      }

      if (!activeKey || activeKey.trim() === '' || activeKey === 'rzp_test_YOUR_KEY_HERE') {
        alert("Please set RAZORPAY_KEY_ID in .env.local OR paste your Razorpay Test Key ID (e.g. rzp_test_...) below to launch the checkout modal.");
        setIsProcessing(false);
        return;
      }

      // Save custom key if used
      if (activeKey === customKeyId) {
        localStorage.setItem('rzp_test_key_id', customKeyId);
      }

      const completePayment = async (paymentId: string) => {
        const token = localStorage.getItem('hr_system_token');
        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        const creditRes = await fetch('/api/wallet', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            amount,
            paymentId,
            type: 'Credit',
            description: 'Deposited funds via Razorpay Secure Checkout'
          })
        });
        if (creditRes.ok) {
          alert(`₹${amount.toLocaleString()} added to your wallet successfully!`);
          await fetchWallet();
          setShowDepositModal(false);
        } else {
          alert("Failed to credit payment to wallet.");
        }
      };

      const options: any = {
        key: activeKey,
        amount: Math.round(amount * 100),
        currency: "INR",
        name: "HR Core Systems Inc.",
        description: "Add Funds to Company Payout Wallet",
        handler: async function (response: any) {
          await completePayment(response.razorpay_payment_id || `PAY-${Date.now()}`);
        },
        prefill: {
          name: "Company Admin",
          email: "finance@hrcore.com",
          contact: "9999999999"
        },
        theme: {
          color: "#2563EB"
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
          }
        }
      };

      // Attach order_id only if generated by backend (configured env keys)
      if (order.id) {
        options.order_id = order.id;
      }

      const rzp1 = new (window as any).Razorpay(options);
      rzp1.open();
    } catch (err) {
      console.error(err);
      alert("Something went wrong during payment initiation.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-5 text-left">
      {/* Wallet Card Banner */}
      <div className="bg-white dark:bg-slate-900 relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] transition-all duration-300 hover:shadow-[0_6px_24px_-4px_rgba(0,0,0,0.04)] group">
        
        {/* Subtle Light Glow Effects */}
        <div className="absolute top-0 right-0 w-64 h-64 -mr-16 -mt-16 bg-gradient-to-bl from-blue-500/[0.03] via-indigo-500/[0.03] to-transparent rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-110" />
        <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-purple-500/[0.02] rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center gap-4 text-left relative z-10">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-100/60 dark:border-blue-900/40 shrink-0 shadow-sm">
            <Wallet className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Company Payout Vault</span>
              <span className="text-[8px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-400/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-black uppercase flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Secure
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-none">
                ₹{wallet?.balance?.toLocaleString() ?? '0'}
              </h2>
              <span className="text-[8px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-widest">Instant Payouts Active</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto relative z-10">
          <button 
            onClick={() => setShowTxns(!showTxns)}
            className={cn(
              "flex-1 md:flex-initial px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all duration-300 border cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-95",
              showTxns 
                ? "bg-[#0f172a] text-white border-[#0f172a] dark:bg-[#ffffff] dark:text-[#0f172a] dark:border-transparent hover:bg-[#1e293b] dark:hover:bg-[#f1f5f9]"
                : "bg-[#f8fafc] hover:bg-[#f1f5f9] dark:bg-slate-800/40 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-300 border-slate-200/80 dark:border-slate-800 hover:text-slate-[#0f172a] dark:hover:text-white"
            )}
          >
            {showTxns ? 'Close Ledger' : 'Statement History'}
          </button>

          {can('payroll.release_salary') ? (
            <button 
              onClick={() => setShowDepositModal(true)}
              className="flex-1 md:flex-initial px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-[8px] font-black uppercase tracking-widest transition-all duration-300 active:scale-95 shadow-[0_2px_8px_-2px_rgba(37,99,235,0.25)] flex items-center justify-center gap-1.5 cursor-pointer border border-transparent"
            >
              <Landmark className="w-3.5 h-3.5" /> Add Balance
            </button>
          ) : (
            <div className="flex-1 md:flex-initial px-4 py-2 bg-slate-50 dark:bg-slate-800/20 border border-slate-200/50 dark:border-slate-800/40 text-slate-400 dark:text-slate-500 rounded-xl text-[8px] font-black uppercase tracking-widest text-center flex items-center justify-center select-none font-extrabold">
              HR Review Queue
            </div>
          )}
        </div>
      </div>

      {/* Transaction History Logs */}
      {showTxns && (
        <div className="saas-card bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] text-left">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800/80 mb-3">
            <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-900 dark:text-white">Transaction Log Ledger</h4>
            <p className="text-[8px] text-slate-400 font-bold uppercase mt-0.5">Real-time deposit and debit statements</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[10.5px]">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[8.5px] uppercase text-slate-400 font-black">
                  <th className="py-2 text-left">Transaction ID</th>
                  <th className="py-2 text-left">Description</th>
                  <th className="py-2 text-left">Type</th>
                  <th className="py-2 text-right">Amount</th>
                  <th className="py-2 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-55 dark:divide-slate-800/50">
                {wallet?.transactions?.slice().reverse().map((txn: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                    <td className="py-2.5 font-mono font-bold text-slate-500">{txn.transactionId}</td>
                    <td className="py-2.5 text-slate-700 dark:text-slate-300 font-semibold">{txn.description}</td>
                    <td className="py-2.5">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[7.5px] font-black uppercase border",
                        txn.type === 'Credit' 
                          ? "bg-emerald-50 text-emerald-600 border-emerald-500/10 dark:bg-emerald-950/20 dark:text-emerald-400" 
                          : "bg-rose-50 text-rose-600 border-rose-500/10 dark:bg-rose-950/20 dark:text-rose-400"
                      )}>
                        {txn.type}
                      </span>
                    </td>
                    <td className={cn(
                      "py-2.5 text-right font-black text-xs",
                      txn.type === 'Credit' ? "text-emerald-600" : "text-rose-600"
                    )}>
                      {txn.type === 'Credit' ? '+' : '-'}₹{txn.amount.toLocaleString()}
                    </td>
                    <td className="py-2.5 text-right text-slate-405 font-bold">{new Date(txn.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
                {(!wallet?.transactions || wallet.transactions.length === 0) && (
                  <tr>
                    <td colSpan={5} className="py-5 text-center text-slate-400 font-bold text-[9px] uppercase">No transactions logged yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Paid Salaries',
            value: formatCurrencyShort(dashboardStats.totalPayout),
            sub: `Real payout: ₹${dashboardStats.totalPayout.toLocaleString()}`,
            icon: Wallet,
            accent: '#3B82F6'
          },
          {
            label: 'Pending Approvals',
            value: formatCurrencyShort(dashboardStats.pendingApproval),
            sub: `Awaiting Finance: ₹${dashboardStats.pendingApproval.toLocaleString()}`,
            icon: AlertCircle,
            accent: '#F59E0B'
          },
          {
            label: 'Monthly Net Expense',
            value: formatCurrencyShort(dashboardStats.monthlyExpenses),
            sub: `Gross cost: ₹${dashboardStats.monthlyExpenses.toLocaleString()}`,
            icon: TrendingUp,
            accent: '#F43F5E'
          },
          {
            label: 'Processed Employees',
            value: `${dashboardStats.totalEmployeesProcessed} Active`,
            sub: 'Unique database users',
            icon: Users,
            accent: '#10B981'
          }
        ].map((stat, idx) => (
          <PastelStatCard key={idx} icon={stat.icon} label={stat.label} value={stat.value} sub={stat.sub} accent={stat.accent} />
        ))}
      </div>

      {/* Graphical Analytics Map */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="saas-card bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-xl p-3.5 lg:col-span-2 space-y-2.5 shadow-sm">
          <div className="flex justify-between items-center pb-2.5 border-b border-slate-100 dark:border-slate-855">
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-900 dark:text-white">Monthly Expense Trend</h4>
              <p className="text-[7.5px] text-slate-400 font-bold uppercase mt-0.5">Calculated from processed pay cycles</p>
            </div>
            <span className="text-[7px] font-black bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded uppercase tracking-wider">Live Atlas Feed</span>
          </div>
          
          <div className="h-48 pt-4 pb-1">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={expenseTrendData}
                  margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-slate-800" />
                  <XAxis dataKey="month" tick={{ fontSize: 9, fontWeight: 'bold', fill: '#94A3B8' }} />
                  <YAxis tick={{ fontSize: 9, fontWeight: 'bold', fill: '#94A3B8' }} tickFormatter={(v) => formatCurrencyShort(v)} />
                  <Tooltip 
                    contentStyle={{ fontSize: 10, fontWeight: 'bold', borderRadius: 8, backgroundColor: '#0F172A', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF' }}
                    formatter={(v: any) => [`₹${v.toLocaleString()}`, 'Monthly Expense']}
                  />
                  <Area type="monotone" dataKey="expense" stroke="#2563EB" strokeWidth={2.5} fillOpacity={1} fill="url(#colorExpense)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-[10px] uppercase font-bold text-slate-400">Loading chart data...</div>
            )}
          </div>
        </div>

        <div className="saas-card bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-xl p-3.5 space-y-2.5 shadow-sm">
          <div className="pb-2.5 border-b border-slate-100 dark:border-slate-855">
            <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-900 dark:text-white">Department distribution</h4>
            <p className="text-[7.5px] text-slate-400 font-bold uppercase mt-0.5">Cost center allocation</p>
          </div>
          
          <div className="h-32 pt-2">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={departmentCostData}
                  margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-slate-800" />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 'bold', fill: '#94A3B8' }} />
                  <YAxis tick={{ fontSize: 9, fontWeight: 'bold', fill: '#94A3B8' }} tickFormatter={(v) => `₹${v/1000}k`} />
                  <Tooltip 
                    contentStyle={{ fontSize: 10, fontWeight: 'bold', borderRadius: 8, backgroundColor: '#0F172A', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF' }}
                    formatter={(v: any) => [`₹${v.toLocaleString()}`, 'Cost Center']}
                  />
                  <Bar dataKey="cost" radius={[4, 4, 0, 0]}>
                    {departmentCostData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-[10px] uppercase font-bold text-slate-400">Loading distribution...</div>
            )}
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            {departmentCostData.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-[8px] font-black uppercase tracking-wider">
                <span className="flex items-center gap-1 text-slate-500">
                  <span className={cn("w-1.5 h-1.5 rounded-full", item.color)} />
                  {item.name}
                </span>
                <span className="text-slate-900 dark:text-white">{item.displayCost} ({item.percentage})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Deposit Amount Selection Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 z-[200] bg-slate-950/70 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="wallet-deposit-modal rounded-[2rem] p-7 max-w-md w-full border border-slate-150/40 dark:border-slate-800/80 shadow-2xl space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex justify-between items-center pb-3.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5 text-left">
                <div className="p-2 bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 rounded-xl border border-blue-100/10">
                  <Wallet className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">Fund Payout Wallet</h3>
                  <p className="text-[8px] text-slate-400 font-bold uppercase mt-0.5">Secure Gateway Integration</p>
                </div>
              </div>
              <button 
                onClick={() => setShowDepositModal(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer transition-colors"
              >
                <X className="w-4.5 h-4.5 text-slate-400" />
              </button>
            </div>
            
            <div className="space-y-5 text-left">
              {/* Dynamic Key Status Header */}
              {envKeyDetected || (customKeyId && customKeyId.trim() !== '') ? (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/15 border border-emerald-150/30 dark:border-emerald-900/30 rounded-2xl flex justify-between items-center text-[9.5px] font-bold text-emerald-800 dark:text-emerald-400">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="tracking-wide">
                      Razorpay Active: <code className="font-mono bg-emerald-100/60 dark:bg-slate-950 px-1.5 py-0.5 rounded text-[8.5px] font-black">{envKeyDetected ? 'System Key (.env)' : `${customKeyId.slice(0, 12)}...`}</code>
                    </span>
                  </div>
                  <button 
                    onClick={() => {
                      if (envKeyDetected) {
                        alert("To change the system key, please edit the RAZORPAY_KEY_ID in .env.local.");
                      } else {
                        setCustomKeyId('');
                        localStorage.removeItem('rzp_test_key_id');
                      }
                    }}
                    className="text-[8.5px] text-blue-600 dark:text-blue-450 hover:underline cursor-pointer font-black uppercase"
                  >
                    {envKeyDetected ? 'System Key' : 'Change Key'}
                  </button>
                </div>
              ) : (
                <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100/60 dark:border-amber-900/30 rounded-2xl flex flex-col gap-2 text-[10px] text-amber-800 dark:text-amber-450">
                  <div className="flex items-center gap-2 font-black">
                    <Info className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>RAZORPAY INTEGRATION REQUIRED</span>
                  </div>
                  <p className="font-medium text-slate-550 dark:text-slate-400 leading-relaxed text-[9.5px]">
                    To trigger the real Razorpay payment window, define your credentials in <code className="font-mono bg-slate-100 dark:bg-slate-950 px-1 py-0.5 rounded">.env.local</code> or paste your test key ID below:
                  </p>
                  <input 
                    type="text" 
                    placeholder="Paste rzp_test_xxxxxxxxxxxxxx"
                    value={customKeyId}
                    onChange={(e) => {
                      setCustomKeyId(e.target.value);
                      localStorage.setItem('rzp_test_key_id', e.target.value);
                    }}
                    className="w-full mt-1 px-4 py-3 bg-white dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-2xl font-mono text-[10px] font-black outline-none focus:border-blue-500/50"
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-450 dark:text-slate-400 uppercase tracking-widest block">Enter Deposit Amount (INR)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-lg">₹</span>
                  <input 
                    type="number"
                    placeholder="e.g. 50000"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-2xl text-lg font-black outline-none focus:border-blue-500/50 transition-all focus:bg-white"
                  />
                </div>
              </div>

              {/* Amount Preset Chips */}
              <div className="flex gap-2">
                {[
                  { label: '₹10K', value: '10000' },
                  { label: '₹50K', value: '50000' },
                  { label: '₹100K', value: '100000' },
                  { label: '₹500K', value: '500000' }
                ].map(item => (
                  <button
                    key={item.value}
                    onClick={() => setDepositAmount(item.value)}
                    className={cn(
                      "flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer border",
                      depositAmount === item.value 
                        ? "bg-blue-600 border-blue-650 text-white shadow-md shadow-blue-500/10" 
                        : "bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-750"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Secure checkout info */}
              <div className="p-4 bg-blue-50/50 dark:bg-blue-950/15 border border-blue-100/40 dark:border-blue-900/30 rounded-2xl flex gap-3 text-xs">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl h-fit border border-blue-150/20">
                  <Landmark className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="space-y-0.5">
                  <p className="font-black text-blue-900 dark:text-blue-300">Razorpay Secure Checkout</p>
                  <p className="text-[9px] text-slate-455 dark:text-slate-400 leading-normal">Supports UPI, Netbanking, Cards, and Wallets with instantaneous settlements.</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowDepositModal(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-250 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-750 dark:text-white rounded-2xl text-[9.5px] font-black uppercase tracking-widest cursor-pointer transition-all active:scale-95 border border-slate-200/40"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAddBalance(Number(depositAmount))}
                disabled={!depositAmount || Number(depositAmount) <= 0 || isProcessing}
                className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl text-[9.5px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/10 cursor-pointer disabled:opacity-50 transition-all active:scale-95"
              >
                {isProcessing ? 'Opening Gateway...' : 'Initiate Checkout'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
