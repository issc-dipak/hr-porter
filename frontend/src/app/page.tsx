"use client";

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  BarChart3, Users, Clock, FileText, Briefcase, Target, CheckSquare, 
  Settings, LogOut, Menu, X, Plus, Edit2, Trash2, Search, Filter,
  Eye, Download, Calendar, MapPin, Phone, Mail, DollarSign, TrendingUp,
  AlertCircle, CheckCircle, Clock3, User, Home, ChevronDown, ChevronRight,
  Bell, ShieldCheck, UserCircle, Laptop, Megaphone, Sparkles, MessageSquare, Share2,
  HelpCircle, Network, Sun, Moon, ArrowRight, ArrowLeftRight, RefreshCcw, Cpu, Database, Fingerprint, KeyRound, Shield,
  Receipt, CreditCard, UserMinus, UserPlus, Building2, Award, ClipboardCheck, Sliders, FolderKanban, Trophy
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";

import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { useLeaveStore } from '@/store/leaveStore';
import { useJobStore } from '@/store/jobStore';
import { useBrandingStore } from '@/store/useBrandingStore';
import { useChatStore } from '@/store/chatStore';
import { useSystemNotificationStore } from '@/store/useSystemNotificationStore';
import { PermissionProvider } from '@/context/PermissionContext';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

import { LoginPage, SignupPage, ForgotPasswordPage, AcceptInvitePage } from '@/features/auth';

// Admin Feature Imports
import DashboardPage from '@/features/admin/dashboard/component';
import SettingsPage from '@/features/admin/settings/component';
import { AssetsPage } from '@/features/admin/assets/component';
import { AnnouncementsPage } from '@/features/admin/announcements/component';
import { AuditLogsPage } from '@/features/admin/auditlogs/component';
import { RolesPermissionsPage } from '@/features/admin/permissions/component';
import BillingDashboard, { SupportTicketForm } from '@/features/admin/billing/component';
import SuperAdminDashboard from '@/features/superadmin/dashboard/component';
import CompanyPoliciesPage from '@/features/admin/policies/component';
import BranchesPage from '@/features/admin/branches/component';
import DepartmentsPage from '@/features/admin/departments/component';
import DesignationsPage from '@/features/admin/designations/component';
import ProjectsPage from '@/features/admin/projects/component';
import RewardsPage from '@/features/admin/rewards/component';

// HR Feature Imports
import AttendancePage from '@/features/hr/attendance/component';
import EmployeeManagementPage from '@/features/admin/employees/component';
import LeaveManagementPage from '@/features/hr/leave/component';
import PayrollPage from '@/features/hr/payroll/component';
import PerformancePage from '@/features/hr/performance/component';
import RecruitmentPage from '@/features/hr/recruitment/component';
import ReportsPage from '@/features/hr/reports/component';
import { OnboardingDashboard } from '@/features/hr/onboarding/OnboardingDashboard';
import { EmployeeSelfSetup } from '@/features/auth/EmployeeSelfSetup';


// Employee Feature Imports
import EmployeeDashboard from '@/features/employee/dashboard/component';

// Feed, Messages, Copilot Imports
import CommunityFeed from '@/features/employee/feed/component';
import WorkplaceChat from '@/features/employee/messages/component';
import HelpDeskPage from '@/features/employee/helpdesk/component';
import OrgChartPage from '@/features/employee/orgchart/component';

// Daily Updates DSR Imports
import DailyUpdatesManagement from '@/features/hr/daily-updates/component';
import DailyUpdatesAnalytics from '@/features/admin/daily-updates/component';
import ExpensesPage from '@/features/employee/expenses/component';
import OffboardingPage from '@/features/hr/offboarding/component';
import ApprovalCenter from '@/features/hr/approval-center/component';
import MyTeamDashboard from '@/features/employee/dashboard/components/MyTeamTab';

const SidebarItem = ({
  icon: Icon,
  label,
  page,
  roles,
  currentPage,
  userRole,
  isMobile,
  sidebarOpen,
  setCurrentPage,
  setSidebarOpen,
  badge,
}: {
  icon: any;
  label: string;
  page: string;
  roles?: string[];
  currentPage: string;
  userRole: string;
  isMobile: boolean;
  sidebarOpen: boolean;
  setCurrentPage: (p: string) => void;
  setSidebarOpen: (v: boolean) => void;
  badge?: number | boolean;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ top: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({
        top: rect.top + rect.height / 2
      });
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const allowedRoles = roles || ['Admin', 'HR', 'Employee', 'Super Admin'];
  if (!allowedRoles.includes(userRole)) return null;

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={() => {
        setCurrentPage(page);
        if (isMobile) setSidebarOpen(false);
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "w-full flex items-center transition-all duration-300 ease-out group relative hover:translate-x-1 active:scale-[0.98]",
        sidebarOpen ? "gap-3 px-3 py-2.5 rounded-xl" : "p-2.5 justify-center mb-0.5 rounded-xl",
        currentPage === page
          ? "saas-sidebar-item-active"
          : "saas-sidebar-item hover:bg-[var(--sidebar-hover)]"
      )}
    >
      <div className="relative flex-shrink-0">
        {(() => {
          const isCurrent = currentPage === page;
          return (
            <Icon 
              className={cn(
                "w-4.5 h-4.5 transition-all duration-200 group-hover:scale-105",
                isCurrent 
                  ? "text-[#6B2E1F] dark:text-[#E6A490] opacity-100" 
                  : "text-slate-400 dark:text-slate-500 opacity-80 group-hover:opacity-100 group-hover:text-slate-700 dark:group-hover:text-slate-350"
              )}
              stroke="currentColor"
            />
          );
        })()}
        {badge && (!sidebarOpen || typeof badge === 'boolean') && (
          <span className="absolute -top-1.5 -right-1.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
          </span>
        )}
      </div>
      {sidebarOpen && (
        <motion.span
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="font-semibold text-[12px] whitespace-nowrap tracking-tight transition-transform duration-300 group-hover:translate-x-0.5"
        >
          {label}
        </motion.span>
      )}

      {sidebarOpen && badge && typeof badge === 'number' && (
        <span className="ml-auto inline-flex items-center justify-center px-1.5 py-0.5 text-[8px] font-black leading-none text-white bg-rose-500 rounded-full min-w-[14px]">
          {badge}
        </span>
      )}

      {mounted && createPortal(
        <AnimatePresence>
          {!isMobile && !sidebarOpen && isHovered && coords && (
            <div 
              className="fixed left-[96px] z-[90] pointer-events-none"
              style={{ 
                top: `${coords.top}px`,
                transform: 'translateY(-50%)'
              }}
            >
              <motion.div
                initial={{ opacity: 0, x: -15, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -15, scale: 0.95 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="px-3 py-1.5 border border-slate-750 rounded-xl shadow-xl text-[10px] font-semibold whitespace-nowrap flex items-center gap-1.5"
                style={{ background: '#0f172a', color: '#fff' }}
              >
                {label}
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-y-4 border-y-transparent border-r-4" style={{ borderRightColor: '#0f172a' }} />
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {currentPage === page && (
        <div className="absolute left-0 w-[3px] h-4 bg-blue-500 dark:bg-blue-400 rounded-r-full" />
      )}
    </button>
  );
};

export default function HRManagementSystem() {
  const [mounted, setMounted] = useState(false);
  const [authScreen, setAuthScreen] = useState<'login' | 'signup' | 'forgot'>('login');

  const [prefilledEmail, setPrefilledEmail] = useState('');
  const [prefilledCompany, setPrefilledCompany] = useState('');
  const [prefilledCompanyCode, setPrefilledCompanyCode] = useState('');
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [onboardingToken, setOnboardingToken] = useState<string | null>(null);
  const [initialSignupStep, setInitialSignupStep] = useState<number>(1);
  const [welcomeInfo, setWelcomeInfo] = useState<{ userName: string; companyName: string } | null>(null);
  const [welcomeStep, setWelcomeStep] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState("Initializing secure session...");
  
  // Zustand State hooks
  const { 
    token, 
    isAuthenticated, 
    userRole,
    userPermissions,
    hasPermission,
    profile, 
    setIsAuthenticated, 
    setUserRole, 
    setProfile,
    setUserPermissions,
    logout 
  } = useAuthStore();

  const { 
    sidebarOpen, 
    isMobile, 
    currentPage, 
    showToast, 
    selectedBranchId,
    setSidebarOpen, 
    setIsMobile, 
    setCurrentPage, 
    triggerToast, 
    clearToast,
    setSelectedBranch
  } = useUIStore();

  const { leaves, setLeaves: setLeavesRaw } = useLeaveStore();
  const { jobs, setJobs: setJobsRaw } = useJobStore();
  const { branding, fetchBranding } = useBrandingStore();
  const [branches, setBranches] = useState<any[]>([]);

  // Chat Zustand state hooks
  const {
    initSocket,
    disconnectSocket,
    loadConversations,
    loadNotifications,
    notifications,
    activeConversationId,
    markNotificationsRead,
  } = useChatStore();

  const totalUnreadMessages = notifications.length;

  // System Notifications state hooks
  const {
    notifications: systemNotifications,
    fetchNotifications: fetchSystemNotifications,
    markRead: markSystemNotificationRead,
    markAllRead: markAllSystemNotificationsRead,
  } = useSystemNotificationStore();

  // Connect socket and load conversations/notifications globally on auth
  useEffect(() => {
    if (isAuthenticated && token) {
      initSocket(token);
      loadConversations();
      loadNotifications();
      fetchSystemNotifications();
    }
    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated, token, initSocket, loadConversations, loadNotifications, disconnectSocket, fetchSystemNotifications]);

  // Mark active conversation notifications read when opening Workplace Chat
  useEffect(() => {
    if (currentPage === 'messages' && activeConversationId) {
      const id = activeConversationId;
      const isDm = !id.includes(':') && id.includes('|');
      if (isDm) {
        const parts = id.split('|');
        const currentUserEmail = profile?.email || '';
        const partnerEmail = parts.find(p => p.toLowerCase().trim() !== currentUserEmail.toLowerCase().trim()) || parts[0];
        markNotificationsRead(undefined, partnerEmail);
      } else {
        markNotificationsRead(id);
      }
    }
  }, [currentPage, activeConversationId, profile?.email, markNotificationsRead]);

  const setLeaves = (value: any) => {
    if (typeof value === 'function') {
      setLeavesRaw(value(leaves));
    } else {
      setLeavesRaw(value);
    }
  };

  const setJobs = (value: any) => {
    if (typeof value === 'function') {
      setJobsRaw(value(jobs));
    } else {
      setJobsRaw(value);
    }
  };
  const [isMenuHovered, setIsMenuHovered] = useState(false);
  const [isLogoutHovered, setIsLogoutHovered] = useState(false);
  const [isThemeHovered, setIsThemeHovered] = useState(false);
  const [isBranchMenuOpen, setIsBranchMenuOpen] = useState(false);
  const branchMenuRef = useRef<HTMLDivElement>(null);
  // HR viewing their own Employee Dashboard
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [globalEmployees, setGlobalEmployees] = useState<any[]>([]);
  const [selectedSearchEmployee, setSelectedSearchEmployee] = useState<any>(null);
  const [hrViewAsEmployee, setHrViewAsEmployee] = useState(false);

  useEffect(() => {
    if (isAuthenticated || isGlobalSearchOpen) {
      const savedToken = localStorage.getItem('hr_system_token') || token;
      console.log("[Global Search] Fetching employees. token exists:", !!savedToken, "isGlobalSearchOpen:", isGlobalSearchOpen);
      if (savedToken) {
        fetch('/api/employees', {
          headers: { 'Authorization': `Bearer ${savedToken}` }
        })
        .then(res => {
          console.log("[Global Search] API Status:", res.status);
          return res.json();
        })
        .then(data => {
          console.log("[Global Search] API Data received:", data);
          if (Array.isArray(data)) {
            setGlobalEmployees(data);
          } else {
            console.warn("[Global Search] API returned non-array:", data);
          }
        })
        .catch(err => console.error("[Global Search] Fetch error:", err));
      }
    }
  }, [isAuthenticated, isGlobalSearchOpen, token]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key?.toLowerCase() === 'k') {
        e.preventDefault();
        setIsGlobalSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (branchMenuRef.current && !branchMenuRef.current.contains(event.target as Node)) {
        setIsBranchMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('hr_system_dark_mode');
      return stored === null ? true : stored === 'true';
    }
    return true;
  });

  const toggleTheme = (useDark: boolean) => {
    setIsDarkMode(useDark);
    if (typeof window !== 'undefined') {
      document.documentElement.classList.toggle('dark', useDark);
      localStorage.setItem('hr_system_dark_mode', String(useDark));
    }
    
    // Save to server database if authenticated
    if (isAuthenticated) {
      const savedToken = localStorage.getItem('hr_system_token');
      if (savedToken) {
        fetch('/api/settings/user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${savedToken}`
          },
          body: JSON.stringify({
            appearance: {
              themeMode: useDark ? 'Dark' : 'Light'
            }
          })
        }).catch(err => console.error("Failed to auto-save theme mode:", err));
      }
    }
  };

  // Global Notification Settings
  const [notifSettings, setNotifSettings] = useState({
    email: true,
    push: true,
    sms: false,
    payroll: true,
    recruitment: false
  });

  const addNotification = (message: string) => {
    triggerToast(message);

    if (profile && profile.email) {
      fetch('/api/notifications/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: profile.email, message })
      })
      .then(res => {
        if (!res.ok) console.warn('[Notification_Email_Dispatch] Server returned status', res.status);
      })
      .catch(err => console.error('[Notification_Email_Dispatch] Failed to send email:', err));
    }
  };

  const [liveTime, setLiveTime] = useState({ date: '', time: '' });

  // Sync state settings on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchBranding();
    }
  }, [isAuthenticated, fetchBranding]);

  useEffect(() => {
    const savedToken = localStorage.getItem('hr_system_token');
    const storedAuth = localStorage.getItem('hr_system_auth') === 'true';
    
    if (storedAuth && !savedToken) {
      setIsAuthenticated(false);
    }
    
    const storedPage = localStorage.getItem('hr_system_page') || 'dashboard';
    setCurrentPage(storedPage);
    
    const storedRole = localStorage.getItem('hr_system_role') || 'HR';
    setUserRole(storedRole);

    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    const emailParam = params.get('email');
    const companyParam = params.get('company');
    const companyCodeParam = params.get('companyCode');
    const inviteTokenParam = params.get('token');
    
    if (mode === 'signup') {
      setAuthScreen('signup');
      if (emailParam) setPrefilledEmail(emailParam);
      if (companyParam) setPrefilledCompany(companyParam);
      if (companyCodeParam) setPrefilledCompanyCode(companyCodeParam);
    } else if (mode === 'accept-invite' && inviteTokenParam) {
      setInviteToken(inviteTokenParam);
    } else if (mode === 'accept-onboarding' && inviteTokenParam) {
      setOnboardingToken(inviteTokenParam);
    }

    setMounted(true);


    if (typeof window !== 'undefined') {
      window.alert = (message: string) => {
        let type: 'success' | 'error' | 'info' | 'warning' = 'info';
        const lower = (message || '').toLowerCase();
        if (
          lower.includes('error') || 
          lower.includes('failed') || 
          lower.includes('insufficient') ||
          lower.includes('already exists') ||
          lower.includes('invalid') ||
          lower.includes('prevented') ||
          lower.includes('unable')
        ) {
          type = 'error';
        } else if (
          lower.includes('success') || 
          lower.includes('saved') || 
          lower.includes('uploaded') ||
          lower.includes('thank you') ||
          lower.includes('completed')
        ) {
          type = 'success';
        } else if (lower.includes('please') || lower.includes('warning') || lower.includes('attention')) {
          type = 'warning';
        }
        
        useUIStore.getState().triggerToast(message, type);
      };
    }

    const updateTime = () => {
      const now = new Date();
      setLiveTime({
        date: now.toLocaleDateString('en-US', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        }),
        time: now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        })
      });
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (welcomeInfo) {
      setWelcomeStep(0);
      setLoadingStatus("Initializing Workspace...");

      const stepInterval = setInterval(() => {
        setWelcomeStep((prev) => {
          if (prev < 6) {
            return prev + 1;
          }
          clearInterval(stepInterval);
          return prev;
        });
      }, 600);

      const t1 = setTimeout(() => {
        setWelcomeInfo(null);
      }, 6500);

      return () => {
        clearInterval(stepInterval);
        clearTimeout(t1);
      };
    }
  }, [welcomeInfo]);

  // Sync theme mode globally from system-wide settings set by Admin
  useEffect(() => {
    if (isAuthenticated) {
      const savedToken = localStorage.getItem('hr_system_token');
      if (savedToken) {
        // Fetch system settings to get the theme set by Admin
        fetch('/api/settings/system', {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${savedToken}`
          }
        })
        .then(res => {
          if (res.ok) return res.json();
        })
        .then(data => {
          if (data && data.theme) {
            let mode = data.theme.defaultThemeMode || 'Dark';
            let isDark = mode === 'Dark';
            if (mode === 'System' && typeof window !== 'undefined') {
              isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            }
            setIsDarkMode(isDark);
            if (typeof window !== 'undefined') {
              document.documentElement.classList.toggle('dark', isDark);
              localStorage.setItem('hr_system_dark_mode', String(isDark));
            }
          } else {
            setIsDarkMode(true);
            if (typeof window !== 'undefined') {
              document.documentElement.classList.add('dark');
              localStorage.setItem('hr_system_dark_mode', 'true');
            }
          }
        })
        .catch(err => console.error("Error syncing system theme settings on mount:", err));
      }
    }
  }, [isAuthenticated]);

  // Sync settings/pages to storage when mounted changes
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('hr_system_auth', String(isAuthenticated));
    }
  }, [isAuthenticated, mounted]);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('hr_system_role', userRole);
    }
  }, [userRole, mounted]);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('hr_system_page', currentPage);
    }
  }, [currentPage, mounted]);

  // Guard admin/hr only pages from employee role
  useEffect(() => {
    if (mounted && userRole === 'Employee') {
      const adminHrOnlyPages = ['employees', 'onboarding', 'assets', 'auditlogs', 'permissions', 'reports'];
      if (adminHrOnlyPages.includes(currentPage)) {
        setCurrentPage('dashboard');
      }
    }
  }, [userRole, currentPage, mounted, setCurrentPage]);

  // ── RBAC: Fetch current user's dynamic permissions from backend ──────────
  useEffect(() => {
    if (!isAuthenticated) return;

    const PERM_CACHE_KEY = 'hr_rbac_permissions';
    const PERM_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

    const fetchUserPermissions = async () => {
      const savedToken = localStorage.getItem('hr_system_token');
      if (!savedToken) return;
      try {
        const res = await fetch('/api/rbac/me', {
          headers: { 'Authorization': `Bearer ${savedToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.permissions)) {
            setUserPermissions(data.permissions);
            // Cache in localStorage with timestamp
            localStorage.setItem(PERM_CACHE_KEY, JSON.stringify({
              permissions: data.permissions,
              role: data.role,
              ts: Date.now()
            }));
            if (data.role && data.role !== userRole) {
              setUserRole(data.role);
            }
          }
        }
      } catch (err) {
        console.warn('Could not fetch user permissions:', err);
      }
    };

    // Load cached permissions instantly (no loading delay)
    try {
      const cached = localStorage.getItem(PERM_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.permissions) {
          // Use cached permissions immediately for instant UI load
          setUserPermissions(parsed.permissions);
          if (parsed.role && parsed.role !== userRole) setUserRole(parsed.role);
        }
      }
    } catch (_) {}

    // Always fetch fresh in background to ensure permissions are in sync (Stale-While-Revalidate)
    fetchUserPermissions();
  }, [isAuthenticated]);


  // Sync Leaves from API
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchAndSyncLeaves = () => {
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      let url = `/api/leaves?t=${Date.now()}`;
      if (selectedBranchId) {
        url += `&branchId=${selectedBranchId}`;
      }
      fetch(url, { cache: 'no-store', headers })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setLeaves(data);
          }
        })
        .catch(err => console.warn("Could not sync leaves:", err.message));
    };

    fetchAndSyncLeaves();
    const interval = setInterval(fetchAndSyncLeaves, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, selectedBranchId]);

  // Fetch office branches registry list
  useEffect(() => {
    if (isAuthenticated && (userRole === 'Admin' || userRole === 'HR' || userRole === 'Branch Admin')) {
      const savedToken = localStorage.getItem('hr_system_token') || token;
      if (savedToken) {
        fetch('/api/branches', {
          headers: { 'Authorization': `Bearer ${savedToken}` }
        })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setBranches(data);
          }
        })
        .catch(err => console.error("Failed to load branches:", err));
      }
    }
  }, [isAuthenticated, token, userRole]);

  // Lock branch selector for HR if they are assigned to a branch
  useEffect(() => {
    if (isAuthenticated && userRole === 'HR' && profile?.branchId) {
      const matched = branches.find(b => b._id === profile.branchId);
      const branchName = matched ? matched.branchName : 'Assigned Branch';
      setSelectedBranch({ id: profile.branchId, name: branchName });
    }
  }, [isAuthenticated, userRole, profile?.branchId, branches, setSelectedBranch]);

  // Sync detailed profile
  useEffect(() => {
    if (isAuthenticated && profile.email) {
      const token = localStorage.getItem('hr_system_token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      fetch(`/api/employees?email=${encodeURIComponent(profile.email)}`, { headers })
        .then(res => res.json())
        .then(data => {
          if (data && !data.error) {
            setProfile({
              id: data._id,
              name: data.fullName,
              email: data.email,
              phone: data.phone || '',
              location: data.location || '',
              empId: data._id ? `EMP-${data._id.substring(data._id.length - 4).toUpperCase()}` : 'EMP-2026-NEW',
              joined: data.joinedDate ? new Date(data.joinedDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'May 2026',
              dept: data.department || '',
              role: data.designation || '',
              emergencyContact: data.emergencyContact || '',
              bankName: data.bankName || '',
              accountNumber: data.accountNumber || '',
              ifscCode: data.ifscCode || '',
              profilePicture: data.profilePicture || '',
              maxLeaves: data.maxLeaves,
              branchId: data.branchId || '',
              reportingManager: data.reportingManager || null,
              isManager: data.isManager || false,
            });
          }
        })
        .catch(err => console.warn("Error fetching profile details:", err.message));
    }
  }, [isAuthenticated, profile.email]);

  // Fetch and sync Jobs
  useEffect(() => {
    const savedJobs = localStorage.getItem('hr_system_jobs');
    if (savedJobs) {
      try {
        setJobs(JSON.parse(savedJobs));
      } catch (e) {
        console.warn("Failed to parse saved jobs", e);
      }
    }

    if (!isAuthenticated) return;

    const fetchAndSyncJobs = () => {
      const savedToken = localStorage.getItem('hr_system_token') || token;
      const headers: HeadersInit = {};
      if (savedToken) {
        headers['Authorization'] = `Bearer ${savedToken}`;
      }
      let url = '/api/jobs';
      if (selectedBranchId) {
        url += `?branchId=${selectedBranchId}`;
      }
      fetch(url, { headers })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setJobs(data);
          }
        })
        .catch(err => console.warn("Error fetching jobs:", err.message));
    };

    fetchAndSyncJobs();
    const interval = setInterval(fetchAndSyncJobs, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, token, selectedBranchId]);

  // Save jobs
  useEffect(() => {
    if (mounted && jobs.length > 0) {
      localStorage.setItem('hr_system_jobs', JSON.stringify(jobs));
    }
  }, [jobs, mounted]);

  // Sync profile and settings
  useEffect(() => {
    const savedProfile = localStorage.getItem('hr_system_profile');
    if (savedProfile) {
      try {
        setProfile(JSON.parse(savedProfile));
      } catch (e) {}
    }
    
    const savedToken = localStorage.getItem('hr_system_token');
    if (savedToken) {
      try {
        const payload = JSON.parse(atob(savedToken.split('.')[1]));
        if (payload) {
          setProfile((prev) => ({
            name: prev.name || payload.fullName || '',
            email: prev.email || payload.email || '',
            companyName: prev.companyName || payload.companyName || 'Corporate',
            companyCode: prev.companyCode || payload.companyCode || '',
            companyId: prev.companyId || payload.companyId || 'company_001',
          }));
        }
      } catch (e) {
        console.warn("Failed to decode token on mount:", e);
      }
    }
    
    const savedSettings = localStorage.getItem('hr_system_notif_settings');
    if (savedSettings) setNotifSettings(JSON.parse(savedSettings));
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('hr_system_profile', JSON.stringify(profile));
    }
  }, [profile, mounted]);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('hr_system_notif_settings', JSON.stringify(notifSettings));
    }
  }, [notifSettings, mounted]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isMobile) {
      setSidebarOpen(currentPage !== 'chat');
    }
  }, [currentPage, isMobile]);

  const handleLogin = (role: string, userObj?: any) => {
    setUserRole(role);
    setIsAuthenticated(true);
    if (userObj) {
      const company = userObj.companyName || 'Corporate';
      setProfile({
        name: userObj.fullName || profile.name,
        email: userObj.email || profile.email,
        companyName: company,
      });
      setWelcomeInfo({
        userName: userObj.fullName || 'User',
        companyName: company,
      });
    } else {
      setWelcomeInfo({
        userName: 'User',
        companyName: 'HR Core HRMS',
      });
    }
  };

  const handleLogout = () => {
    logout();
    setAuthScreen('login');
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Workspace...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">
        {inviteToken ? (
          <AcceptInvitePage 
            token={inviteToken}
            onSuccess={() => {
              setInviteToken(null);
              const url = new URL(window.location.href);
              url.searchParams.delete('mode');
              url.searchParams.delete('token');
              window.history.replaceState({}, '', url.pathname + url.search);
              setAuthScreen('login');
            }}
            onBackToLogin={() => {
              setInviteToken(null);
              const url = new URL(window.location.href);
              url.searchParams.delete('mode');
              url.searchParams.delete('token');
              window.history.replaceState({}, '', url.pathname + url.search);
              setAuthScreen('login');
            }}
          />
        ) : onboardingToken ? (
          <EmployeeSelfSetup 
            token={onboardingToken}
            onComplete={() => {
              setOnboardingToken(null);
              const url = new URL(window.location.href);
              url.searchParams.delete('mode');
              url.searchParams.delete('token');
              window.history.replaceState({}, '', url.pathname + url.search);
              setAuthScreen('login');
            }}
          />
        ) : authScreen === 'login' ? (
          <LoginPage 
            onLogin={handleLogin} 
            onSwitchToSignup={() => {
              setInitialSignupStep(1);
              setAuthScreen('signup');
            }} 
            onSwitchToForgot={() => setAuthScreen('forgot')} 
            onUnverifiedUser={(email) => {
              setPrefilledEmail(email);
              setInitialSignupStep(4);
              setAuthScreen('signup');
            }}
          />
        ) : authScreen === 'forgot' ? (
          <ForgotPasswordPage onSwitchToLogin={() => setAuthScreen('login')} />
        ) : (
          <SignupPage 
            onSignup={() => setAuthScreen('login')} 
            onSwitchToLogin={() => setAuthScreen('login')} 
            prefilledEmail={prefilledEmail}
            prefilledCompany={prefilledCompany}
            prefilledCompanyCode={prefilledCompanyCode}
            initialStep={initialSignupStep}
          />
        )}
      </div>
    );
  }

  const sidebarItemProps = { currentPage, userRole, isMobile, sidebarOpen, setCurrentPage, setSidebarOpen };

  return (
    <PermissionProvider>
      <div className="fixed inset-0 flex h-screen w-screen overflow-hidden font-sans bg-transparent p-3 md:p-4 gap-3 md:gap-4">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobile && sidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[60]"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ 
          width: isMobile ? (sidebarOpen ? '240px' : '0px') : (sidebarOpen ? 240 : 72),
          x: isMobile && !sidebarOpen ? -240 : 0
        }}        className={cn(
          "flex h-full min-h-0 flex-col bg-[var(--sidebar-bg)] border border-[var(--sidebar-border)] text-[var(--sidebar-fg)] transition-colors duration-300 z-[150] overflow-hidden rounded-3xl shadow-md shrink-0",
          isMobile ? "fixed inset-y-3 left-3 h-[calc(100vh-24px)] shadow-2xl" : "",
          isMobile && !sidebarOpen ? "pointer-events-none" : ""
        )}
      >
        <div className={cn("p-4 flex items-center shrink-0 relative", sidebarOpen ? "justify-between" : "justify-center")}>
          {sidebarOpen ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2"
            >
              {branding.companyLogo ? (
                <img src={branding.companyLogo} alt="Logo" className="h-7 max-w-[70px] object-contain shrink-0" />
              ) : (
                <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
                  <Target className="w-4.5 h-4.5 text-white" />
                </div>
              )}
              <div className="min-w-0">
                <h1 className="text-xs font-black text-[var(--sidebar-fg)] tracking-tight leading-none uppercase truncate max-w-[140px]">
                  {branding.companyShortName || branding.companyName || 'HR Core'}
                </h1>
                <p className="text-[7.5px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mt-1 leading-none">{userRole} PANEL</p>
              </div>
            </motion.div>
          ) : (
            <button 
              onClick={() => setSidebarOpen(true)}
              onMouseEnter={() => setIsMenuHovered(true)}
              onMouseLeave={() => setIsMenuHovered(false)}
              className="w-8.5 h-8.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-md shrink-0 border border-slate-700/50 relative"
            >
              <Menu className="w-4.5 h-4.5" />
              <AnimatePresence>
                {isMenuHovered && (
                  <motion.div
                    initial={{ opacity: 0, x: -15, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -15, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="fixed left-[96px] z-[90] px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl text-[8.5px] font-black uppercase tracking-widest text-white whitespace-nowrap pointer-events-none flex items-center gap-1.5"
                  >
                    Expand Menu
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-y-4 border-y-transparent border-r-4 border-r-slate-950" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          )}
          {sidebarOpen && !isMobile && (
            <button 
              onClick={() => setSidebarOpen(false)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          {isMobile && sidebarOpen && (
             <button 
              onClick={() => setSidebarOpen(false)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <nav className={cn(
          "flex-1 mt-4 px-4 space-y-1 min-h-0 overflow-y-auto no-scrollbar",
          isMobile && !sidebarOpen && "hidden"
        )}>
          {userRole === 'Super Admin' ? (
            <div className="py-2 border-t border-slate-200 dark:border-slate-800/40 first:border-t-0">
              {sidebarOpen ? (
                <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] px-3 mb-2 mt-1">
                  Super Admin Menu
                </p>
              ) : (
                <div className="h-px bg-slate-200 dark:bg-slate-800/50 my-2 mx-2" />
              )}
              <SidebarItem icon={Home} label="Dashboard" page="dashboard" {...sidebarItemProps} />
              <SidebarItem icon={Building2} label="Companies (Tenants)" page="companies" {...sidebarItemProps} />
              <SidebarItem icon={CreditCard} label="Billing & Subscriptions" page="billing" {...sidebarItemProps} />
              <SidebarItem icon={Sliders} label="Plans & Limits" page="features" {...sidebarItemProps} />
              <SidebarItem icon={BarChart3} label="Platform Analytics" page="analytics" {...sidebarItemProps} />
              <SidebarItem icon={Megaphone} label="Announcements" page="announcements" {...sidebarItemProps} />
              <SidebarItem icon={HelpCircle} label="Support Center" page="support" {...sidebarItemProps} />
              <SidebarItem icon={ShieldCheck} label="Security Center" page="security" {...sidebarItemProps} />
              <SidebarItem icon={Cpu} label="AI Management" page="ai" {...sidebarItemProps} />
              <SidebarItem icon={Database} label="Backups" page="backups" {...sidebarItemProps} />
              <SidebarItem icon={Settings} label="Platform Settings" page="settings" {...sidebarItemProps} />
              <SidebarItem icon={Network} label="Developer Center" page="developer" {...sidebarItemProps} />
              <SidebarItem icon={Users} label="Profile" page="profile" {...sidebarItemProps} />
            </div>
          ) : (userRole === 'Employee' || (userRole === 'HR' && hrViewAsEmployee)) ? (
            // ══════════════════════════════════════════
            // EMPLOYEE SIDEBAR (also shown when HR switches to Employee view)
            // ══════════════════════════════════════════
            <div className="py-2 border-t border-slate-200 dark:border-slate-800/40 first:border-t-0">
              {sidebarOpen ? (
                <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] px-3 mb-2 mt-1">
                  {userRole === 'HR' && hrViewAsEmployee ? 'My Employee Menu' : 'Employee Menu'}
                </p>
              ) : (
                <div className="h-px bg-slate-200 dark:bg-slate-800/50 my-2 mx-2" />
              )}
              <SidebarItem icon={Home} label="Overview" page="dashboard" {...sidebarItemProps} />
              {(profile?.isManager || (userRole === 'HR' && hrViewAsEmployee)) && (
                <SidebarItem icon={Users} label="My Team" page="my-team" {...sidebarItemProps} />
              )}
              {hasPermission('attendance.view') && <SidebarItem icon={Clock} label="Attendance Hub" page="attendance" {...sidebarItemProps} />}
              {hasPermission('leave.view') && <SidebarItem icon={FileText} label="Leaves" page="leaves" {...sidebarItemProps} />}
              {hasPermission('daily_update.submit') && <SidebarItem icon={FileText} label="Daily Status Reports" page="daily-updates" {...sidebarItemProps} />}
              {hasPermission('chat.private') && <SidebarItem icon={MessageSquare} label="Workplace Chat" page="messages" badge={totalUnreadMessages > 0 ? totalUnreadMessages : undefined} {...sidebarItemProps} />}
              {hasPermission('helpdesk.raise') && <SidebarItem icon={HelpCircle} label="Help Desk" page="helpdesk" {...sidebarItemProps} />}
              {hasPermission('employee.view') && <SidebarItem icon={Network} label="Org Chart" page="orgchart" {...sidebarItemProps} />}
              {hasPermission('payroll.view') && <SidebarItem icon={DollarSign} label="Payroll & Slips" page="payroll" {...sidebarItemProps} />}
              {hasPermission('expense.submit') && <SidebarItem icon={Receipt} label="Expenses & Claims" page="expenses" {...sidebarItemProps} />}
              {hasPermission('recruitment.view') && <SidebarItem icon={Briefcase} label="Careers & Referrals" page="recruitment" {...sidebarItemProps} />}
              {hasPermission('performance.view_review') && <SidebarItem icon={Target} label="Performance" page="performance" {...sidebarItemProps} />}
              {hasPermission('announcement.view') && <SidebarItem icon={Megaphone} label="Announcements" page="announcements" {...sidebarItemProps} />}
              {hasPermission('policy.acknowledgement') && <SidebarItem icon={Shield} label="Company Policies" page="policies" {...sidebarItemProps} />}
              <SidebarItem icon={FolderKanban} label="Projects & Tasks" page="projects" {...sidebarItemProps} />
              <SidebarItem icon={Trophy} label="Rewards & Recognition" page="rewards" {...sidebarItemProps} />
              {hasPermission('feed.view') && <SidebarItem icon={Share2} label="Company Feed" page="feed" {...sidebarItemProps} />}
              {hasPermission('offboarding.create') && <SidebarItem icon={UserMinus} label="Offboarding" page="offboarding" {...sidebarItemProps} />}
              <SidebarItem icon={Settings} label="Settings" page="settings" {...sidebarItemProps} />
            </div>

          ) : userRole === 'HR' ? (
            // ══════════════════════════════════════════
            // HR SIDEBAR — Dedicated workforce management nav
            // Admin-only: Billing, Audit, Permissions are HIDDEN
            // ══════════════════════════════════════════
            <>
              {/* ── MAIN MENU ── */}
              <div className="py-2 first:border-t-0">
                {sidebarOpen ? (
                  <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] px-3 mb-2 mt-1">Main Menu</p>
                ) : (
                  <div className="h-px bg-slate-200 dark:bg-slate-800/50 my-2 mx-2" />
                )}
                <SidebarItem icon={Home} label="Dashboard" page="dashboard" {...sidebarItemProps} />
                <SidebarItem icon={Users} label="My Team" page="my-team" {...sidebarItemProps} />
                {hasPermission('employee.view') && <SidebarItem icon={Users} label="Employees" page="employees" {...sidebarItemProps} />}
                <SidebarItem icon={FolderKanban} label="Projects" page="projects" {...sidebarItemProps} />
                <SidebarItem icon={Trophy} label="Rewards" page="rewards" {...sidebarItemProps} />
                {hasPermission('onboarding.create') && <SidebarItem icon={UserPlus} label="Onboarding Center" page="onboarding" {...sidebarItemProps} />}
                {hasPermission('attendance.view') && <SidebarItem icon={Clock} label="Attendance" page="attendance" {...sidebarItemProps} />}
                {hasPermission('leave.view') && <SidebarItem icon={FileText} label="Leaves" page="leaves" {...sidebarItemProps} />}
                {hasPermission('daily_update.view') && <SidebarItem icon={CheckSquare} label="Daily Status Reports" page="daily-updates" {...sidebarItemProps} />}
                {hasPermission('chat.private') && <SidebarItem icon={MessageSquare} label="Workplace Chat" page="messages" badge={totalUnreadMessages > 0 ? totalUnreadMessages : undefined} {...sidebarItemProps} />}
                {hasPermission('helpdesk.raise') && <SidebarItem icon={HelpCircle} label="Help Desk" page="helpdesk" {...sidebarItemProps} />}
                {hasPermission('employee.view') && <SidebarItem icon={Network} label="Org Chart" page="orgchart" {...sidebarItemProps} />}
                {hasPermission('feed.view') && <SidebarItem icon={Share2} label="Company Feed" page="feed" {...sidebarItemProps} />}
              </div>

              {/* ── ORGANIZATION ── */}
              <div className="py-2 border-t border-slate-200 dark:border-slate-800/40">
                {sidebarOpen ? (
                  <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] px-3 mb-2 mt-1">Organization</p>
                ) : (
                  <div className="h-px bg-slate-200 dark:bg-slate-800/50 my-2 mx-2" />
                )}
                {/* Branches: HR view-only (no create/delete) */}
                {hasPermission('branch.view') && <SidebarItem icon={Building2} label="Branches" page="branches" {...sidebarItemProps} />}
                {hasPermission('employee.view') && <SidebarItem icon={BarChart3} label="Departments" page="departments" {...sidebarItemProps} />}
                {hasPermission('employee.view') && <SidebarItem icon={Award} label="Designations" page="designations" {...sidebarItemProps} />}
              </div>

              {/* ── MANAGEMENT ── */}
              <div className="py-2 border-t border-slate-200 dark:border-slate-800/40">
                {sidebarOpen ? (
                  <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] px-3 mb-2 mt-1">Management</p>
                ) : (
                  <div className="h-px bg-slate-200 dark:bg-slate-800/50 my-2 mx-2" />
                )}
                {hasPermission('payroll.view') && <SidebarItem icon={DollarSign} label="Payroll" page="payroll" {...sidebarItemProps} />}
                {hasPermission('expense.view') && <SidebarItem icon={Receipt} label="Expenses & Claims" page="expenses" {...sidebarItemProps} />}
                {hasPermission('recruitment.view') && <SidebarItem icon={Briefcase} label="Recruitment" page="recruitment" {...sidebarItemProps} />}
                {hasPermission('performance.view_review') && <SidebarItem icon={Target} label="Performance" page="performance" {...sidebarItemProps} />}
                {hasPermission('assets.view') && <SidebarItem icon={Laptop} label="Assets" page="assets" {...sidebarItemProps} />}
                {hasPermission('offboarding.view') && <SidebarItem icon={UserMinus} label="Offboarding" page="offboarding" {...sidebarItemProps} />}
                {hasPermission('policy.publish') && <SidebarItem icon={Shield} label="Company Policies" page="policies" {...sidebarItemProps} />}
                {hasPermission('leave.approve') && <SidebarItem icon={ClipboardCheck} label="Approval Center" page="approval-center" {...sidebarItemProps} />}
              </div>

              {/* ── INSIGHTS ── */}
              <div className="py-2 border-t border-slate-200 dark:border-slate-800/40">
                {sidebarOpen ? (
                  <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] px-3 mb-2 mt-1">Insights</p>
                ) : (
                  <div className="h-px bg-slate-200 dark:bg-slate-800/50 my-2 mx-2" />
                )}
                {hasPermission('announcement.create') && <SidebarItem icon={Megaphone} label="Announcements" page="announcements" {...sidebarItemProps} />}
                {hasPermission('reports.dashboard') && <SidebarItem icon={BarChart3} label="Reports" page="reports" {...sidebarItemProps} />}
                <SidebarItem icon={Settings} label="Settings" page="settings" {...sidebarItemProps} />
              </div>
            </>

          ) : (
            // ══════════════════════════════════════════
            // ADMIN SIDEBAR — Full access
            // ══════════════════════════════════════════
            <>
              <div className="py-2 border-t border-slate-200 dark:border-slate-800/40 first:border-t-0">
                {sidebarOpen ? (
                  <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] px-3 mb-2 mt-1">
                    Main Menu
                  </p>
                ) : (
                  <div className="h-px bg-slate-200 dark:bg-slate-800/50 my-2 mx-2" />
                )}
                <SidebarItem icon={Home} label="Dashboard" page="dashboard" roles={['Admin']} {...sidebarItemProps} />
                {hasPermission('employee.view') && <SidebarItem icon={Users} label="Employees" page="employees" roles={['Admin']} {...sidebarItemProps} />}
                <SidebarItem icon={FolderKanban} label="Projects" page="projects" roles={['Admin']} {...sidebarItemProps} />
                <SidebarItem icon={Trophy} label="Rewards" page="rewards" roles={['Admin']} {...sidebarItemProps} />
                {hasPermission('onboarding.manage') && <SidebarItem icon={UserPlus} label="Onboarding Center" page="onboarding" roles={['Admin']} {...sidebarItemProps} />}
                {hasPermission('attendance.view') && <SidebarItem icon={Clock} label="Attendance" page="attendance" roles={['Admin']} {...sidebarItemProps} />}
                {hasPermission('leave.view') && <SidebarItem icon={FileText} label="Leaves" page="leaves" roles={['Admin']} {...sidebarItemProps} />}
                <SidebarItem icon={FileText} label="Daily Status Reports" page="daily-updates" roles={['Admin']} {...sidebarItemProps} />
                <SidebarItem icon={MessageSquare} label="Workplace Chat" page="messages" roles={['Admin']} badge={totalUnreadMessages > 0 ? totalUnreadMessages : undefined} {...sidebarItemProps} />
                {hasPermission('helpdesk.view') && <SidebarItem icon={HelpCircle} label="Help Desk" page="helpdesk" roles={['Admin']} {...sidebarItemProps} />}
                {hasPermission('employee.view') && <SidebarItem icon={Network} label="Org Chart" page="orgchart" roles={['Admin']} {...sidebarItemProps} />}
                <SidebarItem icon={Share2} label="Company Feed" page="feed" roles={['Admin']} {...sidebarItemProps} />
              </div>

              <div className="py-2 border-t border-slate-200 dark:border-slate-800/40">
                {sidebarOpen ? (
                  <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] px-3 mb-2 mt-1">
                    Organization
                  </p>
                ) : (
                  <div className="h-px bg-slate-200 dark:bg-slate-800/50 my-2 mx-2" />
                )}
                {hasPermission('branch.view') && <SidebarItem icon={Building2} label="Branches" page="branches" roles={['Admin', 'Branch Admin']} {...sidebarItemProps} />}
                {hasPermission('employee.view') && <SidebarItem icon={Network} label="Departments" page="departments" roles={['Admin', 'Branch Admin']} {...sidebarItemProps} />}
                {hasPermission('employee.view') && <SidebarItem icon={Award} label="Designations" page="designations" roles={['Admin', 'Branch Admin']} {...sidebarItemProps} />}
              </div>

              <div className="py-2 border-t border-slate-200 dark:border-slate-800/40">
                {sidebarOpen ? (
                  <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] px-3 mb-2 mt-1">
                    Management
                  </p>
                ) : (
                  <div className="h-px bg-slate-200 dark:bg-slate-800/50 my-2 mx-2" />
                )}
                {hasPermission('payroll.view') && <SidebarItem icon={DollarSign} label="Payroll" page="payroll" roles={['Admin']} {...sidebarItemProps} />}
                {hasPermission('expense.view') && <SidebarItem icon={Receipt} label="Expenses & Claims" page="expenses" roles={['Admin']} {...sidebarItemProps} />}
                {hasPermission('recruitment.view') && <SidebarItem icon={Briefcase} label="Recruitment" page="recruitment" roles={['Admin']} {...sidebarItemProps} />}
                <SidebarItem icon={Target} label="Performance" page="performance" roles={['Admin']} {...sidebarItemProps} />
                {hasPermission('assets.view') && <SidebarItem icon={Laptop} label="Assets" page="assets" roles={['Admin']} {...sidebarItemProps} />}
                {hasPermission('offboarding.view') && <SidebarItem icon={UserMinus} label="Offboarding" page="offboarding" roles={['Admin']} {...sidebarItemProps} />}
                {hasPermission('policy.edit') && <SidebarItem icon={Shield} label="Company Policies" page="policies" roles={['Admin']} {...sidebarItemProps} />}
              </div>

              <div className="py-2 border-t border-slate-200 dark:border-slate-800/40">
                {sidebarOpen ? (
                  <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] px-3 mb-2 mt-1">
                    Insights
                  </p>
                ) : (
                  <div className="h-px bg-slate-200 dark:bg-slate-800/50 my-2 mx-2" />
                )}
                {hasPermission('announcement.create') && <SidebarItem icon={Megaphone} label="Announcements" page="announcements" roles={['Admin']} {...sidebarItemProps} />}
                <SidebarItem icon={BarChart3} label="Reports" page="reports" roles={['Admin']} {...sidebarItemProps} />
                <SidebarItem icon={Settings} label="Settings" page="settings" roles={['Admin']} {...sidebarItemProps} />
                {hasPermission('billing.manage') && <SidebarItem icon={CreditCard} label="Billing & Plan" page="billing" roles={['Admin']} {...sidebarItemProps} />}
                {hasPermission('audit.view') && <SidebarItem icon={ShieldCheck} label="Audit Trail" page="auditlogs" roles={['Admin']} {...sidebarItemProps} />}
                <SidebarItem icon={HelpCircle} label="Support Center" page="support-center" roles={['Admin']} {...sidebarItemProps} />
              </div>
            </>
          )}
        </nav>

        <div className={cn("p-3 border-t border-[var(--sidebar-border)] shrink-0 space-y-2.5", isMobile && !sidebarOpen && "hidden")}>

          {/* User Profile Card — Redesigned Premium */}
          {sidebarOpen ? (
            <div
              onClick={() => setCurrentPage('settings')}
              className="group/profile relative flex items-center gap-2.5 px-3 py-2.5 rounded-2xl cursor-pointer bg-gradient-to-br from-slate-50 to-slate-100/80 dark:from-slate-900/80 dark:to-slate-950/60 border border-slate-200/60 dark:border-slate-800/60 hover:border-blue-500/30 dark:hover:border-blue-500/20 hover:shadow-lg hover:shadow-blue-500/5 hover:-translate-y-0.5 transition-all duration-300 shadow-sm"
            >
              {/* Avatar with gradient ring */}
              <div className="relative shrink-0">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 p-[1.5px] shadow-md shadow-blue-500/20">
                  <div className="w-full h-full rounded-[10px] overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img
                      src={profile.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.name || 'Admin'}`}
                      alt="User"
                      className="w-full h-full object-cover group-hover/profile:scale-110 transition-transform duration-300"
                    />
                  </div>
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-950 shadow-sm" />
              </div>
              {/* Name & Role */}
              <div className="flex-1 min-w-0 text-left">
                <p className="text-[11px] font-black text-slate-800 dark:text-slate-100 truncate leading-tight tracking-tight">
                  {profile.name || "Administrator"}
                </p>
                <span className="inline-flex items-center mt-0.5 px-1.5 py-px rounded-md text-[8px] font-black uppercase tracking-widest leading-none bg-blue-500/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  {userRole}
                </span>
              </div>
              {/* Action buttons */}
              <div className="flex items-center gap-0.5 shrink-0">
                {userRole === 'HR' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setHrViewAsEmployee(!hrViewAsEmployee); setCurrentPage('dashboard'); }}
                    className={cn(
                      "p-1.5 rounded-lg transition-all border-none cursor-pointer",
                      hrViewAsEmployee ? "bg-violet-500/10 text-violet-500 hover:bg-violet-500/20" : "text-slate-400 hover:bg-slate-200/80 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200"
                    )}
                    title={hrViewAsEmployee ? "Back to HR View" : "Switch to Employee Mode"}
                  >
                    <ArrowLeftRight className="w-3 h-3" />
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleTheme(!isDarkMode); }}
                  className="p-1.5 text-slate-400 hover:bg-slate-200/80 dark:hover:bg-slate-800 hover:text-amber-500 dark:hover:text-yellow-400 rounded-lg transition-all border-none cursor-pointer"
                  title={isDarkMode ? "Light Mode" : "Dark Mode"}
                >
                  {isDarkMode ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleLogout(); }}
                  className="p-1.5 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500 rounded-lg transition-all border-none cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="w-3 h-3" />
                </button>
              </div>
            </div>
          ) : (
            /* Collapsed sidebar — avatar + icon buttons stacked */
            <div className="flex flex-col items-center gap-2">
              <div
                onClick={() => setCurrentPage('settings')}
                className="relative cursor-pointer group/profile"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 p-[1.5px] shadow-md hover:shadow-blue-500/30 transition-shadow duration-300">
                  <div className="w-full h-full rounded-[10px] overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img
                      src={profile.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.name || 'Admin'}`}
                      alt="User"
                      className="w-full h-full object-cover group-hover/profile:scale-110 transition-transform duration-300"
                    />
                  </div>
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-950" />
              </div>
              {userRole === 'HR' && (
                <button
                  onClick={() => { setHrViewAsEmployee(!hrViewAsEmployee); setCurrentPage('dashboard'); }}
                  className={cn("w-7 h-7 rounded-xl flex items-center justify-center border border-slate-200/10 dark:border-slate-800/40 cursor-pointer active:scale-95 transition-all", hrViewAsEmployee ? "bg-violet-500/10 text-violet-500" : "bg-slate-50/20 dark:bg-slate-900/10 text-slate-450 hover:bg-slate-500/10")}
                  title={hrViewAsEmployee ? "Back to HR View" : "Switch to Employee Mode"}
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                </button>
              )}
              <button onClick={() => toggleTheme(!isDarkMode)} className="w-7 h-7 rounded-xl flex items-center justify-center text-slate-455 hover:bg-slate-500/10 hover:text-amber-500 dark:hover:text-yellow-400 border border-slate-200/10 dark:border-slate-800/40 cursor-pointer active:scale-95 transition-all bg-slate-50/20 dark:bg-slate-900/10" title={isDarkMode ? "Light Mode" : "Dark Mode"}>
                {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              </button>
              <button onClick={handleLogout} className="w-7 h-7 rounded-xl flex items-center justify-center text-slate-450 hover:bg-rose-500/10 hover:text-rose-500 dark:hover:text-rose-455 border border-slate-200/10 dark:border-slate-800/40 cursor-pointer active:scale-95 transition-all bg-slate-50/20 dark:bg-slate-900/10" title="Logout">
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </motion.aside>

      {/* Toast Notification — rendered via portal to escape overflow-hidden */}
      {typeof document !== 'undefined' && createPortal(
        <>
          <AnimatePresence>
            {showToast && (() => {
              const toastMessage = typeof showToast === 'string' ? showToast : showToast.message;
              const toastType = typeof showToast === 'string' ? 'info' : (showToast.type || 'info');
              
              const toastConfig = {
                success: {
                  bg: 'bg-white/95 dark:bg-slate-950/95 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-[0_10px_30px_rgba(16,185,129,0.1)]',
                  icon: CheckCircle,
                  iconColor: 'text-emerald-500',
                  labelBg: 'bg-emerald-50 dark:bg-emerald-950/50'
                },
                error: {
                  bg: 'bg-white/95 dark:bg-slate-950/95 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-[0_10px_30px_rgba(239,68,68,0.1)]',
                  icon: AlertCircle,
                  iconColor: 'text-rose-500',
                  labelBg: 'bg-rose-50 dark:bg-rose-950/50'
                },
                warning: {
                  bg: 'bg-white/95 dark:bg-slate-950/95 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-[0_10px_30px_rgba(245,158,11,0.1)]',
                  icon: AlertCircle,
                  iconColor: 'text-amber-500',
                  labelBg: 'bg-amber-50 dark:bg-amber-950/50'
                },
                info: {
                  bg: 'bg-white/95 dark:bg-slate-950/95 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-[0_10px_30px_rgba(79,70,229,0.15)]',
                  icon: Sparkles,
                  iconColor: 'text-indigo-500',
                  labelBg: 'bg-indigo-50 dark:bg-indigo-950/50'
                }
              }[toastType] || {
                bg: 'bg-white/95 dark:bg-slate-950/95 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-[0_10px_30px_rgba(79,70,229,0.15)]',
                icon: Sparkles,
                iconColor: 'text-indigo-500',
                labelBg: 'bg-indigo-50 dark:bg-indigo-950/50'
              };

              const IconComp = toastConfig.icon;

              return (
                <motion.div 
                  initial={{ opacity: 0, y: -40, scale: 0.9, x: '-50%' }}
                  animate={{ opacity: 1, y: 20, scale: 1, x: '-50%' }}
                  exit={{ opacity: 0, y: -40, scale: 0.9, x: '-50%' }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className={cn(
                    "fixed top-0 left-1/2 z-[9999] px-4 py-2.5 rounded-full flex items-center gap-3 border backdrop-blur-lg max-w-[90vw] transition-all",
                    toastConfig.bg
                  )}
                >
                  <div className={cn("p-1.5 rounded-full shrink-0 flex items-center justify-center", toastConfig.labelBg)}>
                    <IconComp className={cn("w-4 h-4", toastConfig.iconColor, toastType === 'info' && "animate-pulse")} />
                  </div>
                  <span className="text-[11.5px] font-semibold tracking-wide leading-none">{toastMessage}</span>
                </motion.div>
              );
            })()}
          </AnimatePresence>
          <ConfirmModal />
        </>,
        document.body
      )}

      <main className={cn(
        "flex-1 min-w-0 flex h-full min-h-0 flex-col justify-start bg-transparent dark:bg-transparent relative transition-colors duration-300",
        ['messages', 'helpdesk', 'orgchart'].includes(currentPage) ? "overflow-hidden" : "overflow-auto",
        "rounded-3xl border border-[var(--sidebar-border)] shadow-sm"
      )}>
        {/* Subtle top-edge highlight — light: none, dark: blue tint */}
        <div className="absolute top-0 left-0 right-0 h-px bg-[var(--border)] pointer-events-none" />
        
        {/* Mobile Header */}
        <div className={cn(
          "lg:hidden flex items-center justify-between p-6 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 relative z-20"
        )}>
          <div className="flex items-center gap-3">
            {branding.companyLogo ? (
              <img src={branding.companyLogo} alt="Logo" className="h-8 w-auto object-contain" />
            ) : (
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
            )}
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-none">
              {branding.companyShortName || branding.companyName || 'HR Core'}
            </h1>
          </div>
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        <div className={cn("relative z-10 min-h-0 w-full", currentPage === 'messages' ? "flex-1 flex flex-col h-full" : "")}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className={cn("w-full", currentPage === 'messages' ? "flex-1 flex flex-col min-h-0" : "")}
            >
              {(() => {
                const PAGE_PERMISSIONS: Record<string, string | string[]> = {
                  'employees': 'employee.view',
                  'onboarding': 'onboarding.create',
                  'attendance': 'attendance.view',
                  'leaves': 'leave.view',
                  'payroll': 'payroll.view',
                  'recruitment': 'recruitment.view',
                  'assets': 'assets.view',
                  'auditlogs': 'audit.view',
                  'billing': 'billing.view',
                  'branches': 'branch.view',
                  'policies': 'policy.acknowledgement',
                  'orgchart': 'employee.view',
                  'expenses': ['expense.view', 'expense.submit'],
                  'offboarding': ['offboarding.view', 'offboarding.create'],
                  'approval-center': ['leave.approve', 'attendance.approve'],
                  'departments': 'employee.view',
                  'designations': 'employee.view',
                  'daily-updates': ['daily_update.submit', 'daily_update.view'],
                  'feed': 'feed.view',
                };
                const requiredPerm = PAGE_PERMISSIONS[currentPage];
                const hasPageAccess = !requiredPerm || (
                  Array.isArray(requiredPerm)
                    ? requiredPerm.some(p => hasPermission(p))
                    : hasPermission(requiredPerm)
                );
                if (!hasPageAccess) {
                  const permLabel = Array.isArray(requiredPerm) ? requiredPerm.join(' or ') : requiredPerm;
                  return (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-slate-900/40 min-h-[60vh] rounded-3xl border border-slate-800/50 backdrop-blur-md">
                      <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center mb-6 border border-rose-500/20 text-rose-500 shadow-lg shadow-rose-500/10">
                        <Shield className="w-8 h-8" />
                      </div>
                      <h1 className="text-xl font-black text-white tracking-tight uppercase">403 Permission Denied</h1>
                      <p className="text-slate-400 text-xs mt-2 max-w-sm">
                        You do not have the required administrative permission ({permLabel}) to view this module.
                      </p>
                      <button
                        type="button"
                        onClick={() => setCurrentPage('dashboard')}
                        className="mt-6 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all border-none cursor-pointer"
                      >
                        Go Back to Dashboard
                      </button>
                    </div>
                  );
                }
                return null;
              })() || (userRole === 'Super Admin' ? (
                <>
                  {[
                    'dashboard', 'superadmin', 'companies', 'billing', 'features', 
                    'analytics', 'announcements', 'support', 'security', 'ai', 
                    'backups', 'settings', 'developer', 'profile'
                  ].includes(currentPage) && (
                    <SuperAdminDashboard 
                      addNotification={addNotification} 
                      initialTab={
                        currentPage === 'companies' ? 'tenants' :
                        currentPage === 'billing' ? 'billing' :
                        currentPage === 'features' ? 'features' :
                        currentPage === 'settings' ? 'gateways' :
                        currentPage === 'security' ? 'security' :
                        currentPage === 'support' ? 'support' :
                        currentPage === 'backups' ? 'system' :
                        currentPage === 'analytics' ? 'dashboard' :
                        currentPage === 'ai' ? 'ai' :
                        currentPage === 'developer' ? 'developer' :
                        currentPage === 'profile' ? 'profile' : 'dashboard'
                      }
                      key={currentPage}
                    />
                  )}
                </>
              ) : (userRole === 'Employee' || (userRole === 'HR' && hrViewAsEmployee)) &&
                 // If employee has announcement.create, route announcements through the full page (not employee dashboard tab)
                !(currentPage === 'announcements' && hasPermission('announcement.create') && !hrViewAsEmployee) &&
                [
                  'dashboard', 'attendance', 'leaves', 'payroll', 'recruitment',
                  'performance', 'profile', 'announcements', 'daily-updates', 'policies',
                  'feed', 'messages', 'helpdesk', 'orgchart', 'expenses', 'offboarding', 'settings'
                ].includes(currentPage) ? (
                <EmployeeDashboard 
                  activeTab={currentPage === 'dashboard' ? 'overview' : currentPage}
                  setActiveTab={(tab: string) => {
                    setCurrentPage(tab === 'overview' ? 'dashboard' : tab);
                  }}
                  leaves={leaves} 
                  setLeaves={setLeaves} 
                  addNotification={addNotification}
                  profile={profile}
                  jobs={jobs}
                  setJobs={setJobs}
                  hrViewAsEmployee={hrViewAsEmployee}
                  onSwitchToHR={() => { setHrViewAsEmployee(false); setCurrentPage('dashboard'); }}
                  onOpenSearch={() => setIsGlobalSearchOpen(true)}
                />
              ) : (
                <>
                   {/* Normal HR/Admin Dashboard */}
                   {currentPage === 'dashboard' && (userRole === 'Admin' || userRole === 'HR') && (
                     <DashboardPage 
                       role={userRole} 
                       setCurrentPage={setCurrentPage} 
                       onSwitchToEmployee={userRole === 'HR' ? () => setHrViewAsEmployee(true) : undefined} 
                       onOpenSearch={() => setIsGlobalSearchOpen(true)}
                     />
                   )}
                   {currentPage === 'employees' && (userRole === 'Admin' || userRole === 'HR') && <EmployeeManagementPage />}
                   {currentPage === 'projects' && <ProjectsPage role={userRole} />}
                   {currentPage === 'rewards' && <RewardsPage role={userRole} />}
                   {currentPage === 'onboarding' && (userRole === 'Admin' || userRole === 'HR') && <OnboardingDashboard />}
                   {currentPage === 'attendance' && <AttendancePage userRole={userRole} profile={profile} />}
                   {currentPage === 'leaves' && <LeaveManagementPage leaves={leaves} setLeaves={setLeaves} userRole={userRole} addNotification={addNotification} profile={profile} />}
                   {currentPage === 'payroll' && <PayrollPage userRole={userRole} profile={profile} />}
                   {currentPage === 'recruitment' && <RecruitmentPage jobs={jobs} setJobs={setJobs} />}
                   {currentPage === 'performance' && <PerformancePage />}
                   {currentPage === 'assets' && (userRole === 'Admin' || userRole === 'HR') && <AssetsPage />}
                   {currentPage === 'announcements' && <AnnouncementsPage userRole={userRole} />}

                   {currentPage === 'auditlogs' && userRole === 'Admin' && <AuditLogsPage />}
                   {currentPage === 'daily-updates' && (userRole === 'Admin' || userRole === 'HR') && (
                      userRole === 'HR' 
                        ? <DailyUpdatesManagement addNotification={addNotification} profile={profile} />
                        : <DailyUpdatesAnalytics addNotification={addNotification} />
                    )}
                   {currentPage === 'feed' && <CommunityFeed profile={profile} addNotification={addNotification} />}
                   {currentPage === 'messages' && <WorkplaceChat profile={profile} addNotification={addNotification} />}
                   {currentPage === 'helpdesk' && <HelpDeskPage userRole={userRole} profile={profile} addNotification={addNotification} />}
                   {currentPage === 'orgchart' && <OrgChartPage userRole={userRole} profile={profile} addNotification={addNotification} />}
                   {currentPage === 'reports' && (userRole === 'Admin' || userRole === 'HR') && <ReportsPage />}
                   {currentPage === 'expenses' && <ExpensesPage />}
                   {currentPage === 'offboarding' && <OffboardingPage userRole={userRole} profile={profile} />}
                   {currentPage === 'policies' && (userRole === 'Admin' || userRole === 'HR') && <CompanyPoliciesPage />}
                   {currentPage === 'branches' && (userRole === 'Admin' || userRole === 'HR' || userRole === 'Branch Admin') && <BranchesPage />}
                   {currentPage === 'departments' && (userRole === 'Admin' || userRole === 'HR' || userRole === 'Branch Admin') && <DepartmentsPage />}
                   {currentPage === 'designations' && (userRole === 'Admin' || userRole === 'HR' || userRole === 'Branch Admin') && <DesignationsPage />}
                   {currentPage === 'approval-center' && (userRole === 'Admin' || userRole === 'HR') && <ApprovalCenter />}
                   {currentPage === 'my-team' && <MyTeamDashboard profile={profile} />}

                  {currentPage === 'settings' && (
                    <SettingsPage 
                      userRole={userRole as any} 
                      setUserRole={setUserRole as any} 
                      addNotification={addNotification} 
                      profile={profile}
                      setProfile={setProfile}
                      notifications={notifSettings}
                      setNotifications={setNotifSettings}
                      toggleTheme={toggleTheme}
                      isDarkMode={isDarkMode}
                    />
                  )}

                  {currentPage === 'billing' && userRole === 'Admin' && <BillingDashboard addNotification={addNotification} />}

                  {currentPage === 'support-center' && userRole === 'Admin' && (
                    <div className="p-6 space-y-6 max-w-7xl mx-auto text-left">
                      <SupportTicketForm addNotification={addNotification} />
                    </div>
                  )}
                </>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Premium Welcome Overlay */}
      <AnimatePresence>
        {welcomeInfo && (() => {
          const isWhiteBranding = branding.primaryColor?.toLowerCase() === '#ffffff' || branding.primaryColor?.toLowerCase() === '#fff';
          
          return (
            <div className="dark">
              {/* Local styles override to bypass light-mode global resets */}
              <style dangerouslySetInnerHTML={{ __html: `
                .premium-welcome-overlay {
                  background-color: #050B14 !important;
                }
                .premium-modal {
                  background-color: rgba(15, 23, 42, 0.9) !important;
                  border-color: rgba(255, 255, 255, 0.08) !important;
                  box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.9) !important;
                }
                .premium-btn-text {
                  color: ${isWhiteBranding ? '#050B14' : '#FFFFFF'} !important;
                }
                .premium-welcome-title {
                  color: #FFFFFF !important;
                }
                .premium-welcome-subtitle {
                  color: #94A3B8 !important;
                }
                .premium-welcome-time {
                  color: #64748B !important;
                }
                .premium-metric-label {
                  color: #64748B !important;
                }
                .premium-metric-value {
                  color: #E2E8F0 !important;
                }
                .step-completed {
                  color: #34D399 !important;
                }
                .step-active {
                  color: #818CF8 !important;
                }
                .step-pending {
                  color: #475569 !important;
                }
              `}} />

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[10000] flex items-center justify-center p-4 backdrop-blur-xl premium-welcome-overlay"
              >
                {/* Ambient glowing background circles */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
                  <motion.div 
                    animate={{
                      x: [0, 30, -15, 0],
                      y: [0, -20, 15, 0],
                      scale: [1, 1.1, 0.95, 1],
                      opacity: [0.3, 0.45, 0.3],
                    }}
                    transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-1/4 left-1/4 w-[250px] h-[250px] bg-indigo-500/20 rounded-full blur-[90px]" 
                  />
                  <motion.div 
                    animate={{
                      x: [0, -20, 20, 0],
                      y: [0, 30, -20, 0],
                      scale: [1, 0.95, 1.05, 1],
                      opacity: [0.25, 0.35, 0.25],
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-violet-600/20 rounded-full blur-[100px]" 
                  />
                </div>

                {/* Particle overlay */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-1 h-1 bg-white rounded-full"
                      style={{
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                      }}
                      animate={{
                        y: [0, -40, 0],
                        opacity: [0.1, 0.6, 0.1],
                        scale: [1, 1.3, 1],
                      }}
                      transition={{
                        duration: 7 + Math.random() * 5,
                        repeat: Infinity,
                        delay: Math.random() * 4,
                        ease: "easeInOut",
                      }}
                    />
                  ))}
                </div>

                {/* Main Premium Centered Container - Compact Size */}
                <motion.div
                  initial={{ scale: 0.96, y: 15, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  exit={{ scale: 0.96, y: -15, opacity: 0 }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="relative w-full max-w-[390px] border rounded-[2rem] p-5 premium-modal overflow-hidden text-center"
                >
                  {/* Top accent line */}
                  <div 
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{ 
                      background: `linear-gradient(90deg, transparent, ${branding.primaryColor || '#4F46E5'}, ${branding.secondaryColor || '#6366F1'}, transparent)`,
                      boxShadow: `0 2px 15px ${(branding.primaryColor || '#4F46E5')}70`
                    }}
                  />

                  <div className="relative z-10 flex flex-col items-center">
                    {/* Secure Badge */}
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-500/5 border border-emerald-500/10 rounded-full mb-4"
                    >
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                      <span className="text-[8px] font-black uppercase tracking-[0.15em] text-emerald-400">🔒 Secure Enterprise Session</span>
                    </motion.div>

                    {/* Logo & Greeting Header */}
                    <div className="flex flex-col items-center gap-2 mb-3">
                      <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", delay: 0.2, damping: 20 }}
                        className="relative shrink-0"
                      >
                        <div 
                          className="absolute -inset-1.5 rounded-2xl opacity-20 blur-md animate-pulse bg-gradient-to-tr from-indigo-500 to-violet-500"
                          style={{ animationDuration: '3s' }}
                        />
                        {branding.companyLogo ? (
                          <div className="p-2 bg-white/[0.03] backdrop-blur-md rounded-xl border border-white/10 shadow-xl flex items-center justify-center w-11 h-11 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                            <img src={branding.companyLogo} alt="Logo" className="max-h-7 w-auto object-contain relative z-10 filter drop-shadow-md" />
                          </div>
                        ) : (
                          <div 
                            className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-650 to-violet-650 flex items-center justify-center text-lg font-black text-white shadow-2xl border border-white/15 relative"
                          >
                            <div className="absolute inset-0 bg-white/10 rounded-xl" />
                            <span className="relative z-10 font-sans tracking-wide">
                              {(welcomeInfo.companyName || 'C').charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </motion.div>

                      <div>
                        <span className="text-[8px] font-black tracking-[0.25em] block uppercase mb-0.5" style={{ color: '#818CF8' }}>
                          Welcome Back
                        </span>
                        <h3 className="text-lg font-extrabold tracking-tight leading-none uppercase premium-welcome-title">
                          {welcomeInfo.userName}
                        </h3>
                        <span className="text-[9px] font-bold block mt-1 premium-welcome-subtitle">
                          {userRole} • {branches.find(b => b._id === profile.branchId)?.branchName || 'Pune'}
                        </span>
                        <div className="text-[8.5px] font-medium font-mono mt-0.5 premium-welcome-time">
                          {liveTime.date} • {liveTime.time}
                        </div>
                      </div>
                    </div>

                    {/* Sequential Steps Checklist - Compact */}
                    <div 
                      className="space-y-1.5 w-full text-left my-3 p-3.5 rounded-xl border"
                      style={{
                        backgroundColor: 'rgba(2, 6, 23, 0.45)',
                        borderColor: 'rgba(255, 255, 255, 0.05)'
                      }}
                    >
                      {(() => {
                        const loadingSteps = [
                          "Initializing Workspace...",
                          "Loading User Permissions...",
                          "Loading Company Data...",
                          "Synchronizing Departments...",
                          "Connecting Notifications...",
                          "Preparing Dashboard...",
                          "All Connected ✅"
                        ];

                        return loadingSteps.map((step, idx) => {
                          const isCompleted = welcomeStep > idx || (welcomeStep === 6 && idx === 6);
                          const isActive = welcomeStep === idx && welcomeStep < 6;

                          const stepClass = isCompleted ? 'step-completed' : isActive ? 'step-active' : 'step-pending';

                          return (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, x: -4 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.02 }}
                              className={cn("flex items-center gap-2 text-[10px] transition-colors duration-300", stepClass)}
                              style={{
                                fontWeight: isActive ? '700' : '500'
                              }}
                            >
                              {isCompleted ? (
                                <CheckCircle className="w-3 h-3 text-emerald-450 shrink-0" />
                              ) : isActive ? (
                                <RefreshCcw className="w-3 h-3 text-indigo-400 animate-spin shrink-0" />
                              ) : (
                                <div className="w-3 h-3 rounded-full border border-slate-800/85 flex items-center justify-center shrink-0">
                                  <div className="w-1.5 h-1.5 rounded-full bg-slate-700/50" />
                                </div>
                              )}
                              <span className={cn(isActive && "animate-pulse")}>{step}</span>
                            </motion.div>
                          );
                        });
                      })()}
                    </div>

                    {/* Enter Workspace Button */}
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      type="button"
                      onClick={() => setWelcomeInfo(null)}
                      className={cn(
                        "w-full py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] cursor-pointer border-none transition-all flex items-center justify-center gap-2 group relative overflow-hidden",
                        welcomeStep === 6 ? "shadow-[0_0_15px_rgba(79,70,229,0.35)]" : "shadow-sm"
                      )}
                      style={{
                        background: welcomeStep === 6
                          ? `linear-gradient(95deg, ${branding.primaryColor || '#4F46E5'}, ${branding.secondaryColor || '#6366F1'})`
                          : `linear-gradient(95deg, ${branding.primaryColor || '#4F46E5'}dd, ${branding.secondaryColor || '#6366F1'}dd)`,
                      }}
                    >
                      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                      <span className="premium-btn-text">Enter Workspace</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform duration-300 premium-btn-text" />
                    </motion.button>

                    {/* Bottom Mini Metrics Grid */}
                    <div className="grid grid-cols-5 gap-1.5 mt-4 w-full">
                      <div className="border rounded-lg p-1 text-center" style={{ backgroundColor: 'rgba(2, 6, 23, 0.4)', borderColor: 'rgba(255, 255, 255, 0.05)' }}>
                        <span className="text-[6.5px] font-bold uppercase tracking-wider block mb-0.5 premium-metric-label">Role</span>
                        <span className="text-[8px] font-black uppercase truncate block premium-metric-value">{userRole || 'Admin'}</span>
                      </div>
                      <div className="border rounded-lg p-1 text-center" style={{ backgroundColor: 'rgba(2, 6, 23, 0.4)', borderColor: 'rgba(255, 255, 255, 0.05)' }}>
                        <span className="text-[6.5px] font-bold uppercase tracking-wider block mb-0.5 premium-metric-label">Company</span>
                        <span className="text-[8px] font-black truncate block max-w-full premium-metric-value">{welcomeInfo.companyName || 'POPUPTECH'}</span>
                      </div>
                      <div className="border rounded-lg p-1 text-center" style={{ backgroundColor: 'rgba(2, 6, 23, 0.4)', borderColor: 'rgba(255, 255, 255, 0.05)' }}>
                        <span className="text-[6.5px] font-bold uppercase tracking-wider block mb-0.5 premium-metric-label">Branch</span>
                        <span className="text-[8px] font-black uppercase truncate block premium-metric-value">
                          {branches.find(b => b._id === profile.branchId)?.branchName || 'Pune'}
                        </span>
                      </div>
                      <div className="border rounded-lg p-1 text-center" style={{ backgroundColor: 'rgba(2, 6, 23, 0.4)', borderColor: 'rgba(255, 255, 255, 0.05)' }}>
                        <span className="text-[6.5px] font-bold uppercase tracking-wider block mb-0.5 premium-metric-label">Version</span>
                        <span className="text-[8px] font-black truncate block premium-metric-value">v2.0</span>
                      </div>
                      <div className="border rounded-lg p-1 text-center flex flex-col justify-center items-center" style={{ backgroundColor: 'rgba(2, 6, 23, 0.4)', borderColor: 'rgba(255, 255, 255, 0.05)' }}>
                        <span className="text-[6.5px] font-bold uppercase tracking-wider block mb-0.5 premium-metric-label">Server</span>
                        <div className="flex items-center gap-0.5">
                          <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                          <span className="text-[7.5px] font-black uppercase tracking-wider step-completed">Online</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Progress timer bar at the bottom */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-950">
                    <motion.div
                      initial={{ width: "100%" }}
                      animate={{ width: "0%" }}
                      transition={{ duration: 6.5, ease: "linear" }}
                      onAnimationComplete={() => setWelcomeInfo(null)}
                      className="h-full"
                      style={{
                        background: `linear-gradient(90deg, ${branding.primaryColor || '#4F46E5'}, ${branding.secondaryColor || '#6366F1'})`
                      }}
                    />
                  </div>
                </motion.div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* Global Search command palette */}
      <AnimatePresence>
        {isGlobalSearchOpen && (
          <div className="fixed inset-0 z-[99999] bg-slate-950/75 backdrop-blur-md flex items-start justify-center pt-28 px-4" onClick={() => { setIsGlobalSearchOpen(false); setGlobalSearchQuery(""); }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -10 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-left"
            >
              <div className="p-4 border-b border-slate-100 dark:border-slate-800/60 flex items-center gap-3">
                <Search className="w-5 h-5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Type a page name or quick action..."
                  value={globalSearchQuery}
                  onChange={(e) => setGlobalSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400 text-xs py-1"
                />
                <button
                  type="button"
                  onClick={() => { setIsGlobalSearchOpen(false); setGlobalSearchQuery(""); }}
                  className="px-2 py-1 text-[8.5px] font-black tracking-widest text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-lg uppercase hover:text-slate-600 dark:hover:text-white transition-colors"
                >
                  ESC
                </button>
              </div>

              {/* Results */}
              <div className="max-h-[340px] overflow-y-auto p-2 space-y-3">
                {(() => {
                  const isEmp = userRole === 'Employee' || (userRole === 'HR' && hrViewAsEmployee);
                  const searchItems = [
                    /* Navigation */
                    { category: "Navigation", title: "Dashboard Overview", desc: "Go to your main dashboard page", icon: Home, action: () => { setCurrentPage('dashboard'); setIsGlobalSearchOpen(false); setGlobalSearchQuery(""); } },
                    { category: "Navigation", title: "Workplace Chat Messages", desc: "Connect and talk with your team", icon: MessageSquare, action: () => { setCurrentPage('messages'); setIsGlobalSearchOpen(false); setGlobalSearchQuery(""); } },
                    { category: "Navigation", title: "Attendance & Shifts", desc: "Clock in, clock out and view log history", icon: Clock, action: () => { setCurrentPage('attendance'); setIsGlobalSearchOpen(false); setGlobalSearchQuery(""); } },
                    { category: "Navigation", title: "Leaves & Time Off", desc: "Apply for leaves and view leaves status", icon: FileText, action: () => { setCurrentPage('leaves'); setIsGlobalSearchOpen(false); setGlobalSearchQuery(""); } },
                    { category: "Navigation", title: "Projects & Task Boards", desc: "Manage projects, tasks and kanban boards", icon: FolderKanban, action: () => { setCurrentPage('projects'); setIsGlobalSearchOpen(false); setGlobalSearchQuery(""); } },
                    { category: "Navigation", title: "Rewards & kudos Recognition", desc: "Give kudos, earn badges and view leaderboard", icon: Trophy, action: () => { setCurrentPage('rewards'); setIsGlobalSearchOpen(false); setGlobalSearchQuery(""); } },
                    { category: "Navigation", title: "Company Feed Updates", desc: "Read and post community updates", icon: Share2, action: () => { setCurrentPage('feed'); setIsGlobalSearchOpen(false); setGlobalSearchQuery(""); } },
                    { category: "Navigation", title: "System Settings", desc: "Update profile, credentials and appearance", icon: Settings, action: () => { setCurrentPage('settings'); setIsGlobalSearchOpen(false); setGlobalSearchQuery(""); } },
                  ];

                  if (!isEmp) {
                    searchItems.push(
                      { category: "Management", title: "Employees Management", desc: "Manage company employees directory", icon: Users, action: () => { setCurrentPage('employees'); setIsGlobalSearchOpen(false); setGlobalSearchQuery(""); } },
                      { category: "Management", title: "Onboarding Center", desc: "Onboard new employees with workflows", icon: UserPlus, action: () => { setCurrentPage('onboarding'); setIsGlobalSearchOpen(false); setGlobalSearchQuery(""); } },
                      { category: "Management", title: "Company Branches", desc: "View and manage office branches", icon: Building2, action: () => { setCurrentPage('branches'); setIsGlobalSearchOpen(false); setGlobalSearchQuery(""); } },
                      { category: "Management", title: "Audit Trail logs", desc: "Review platform security logs", icon: ShieldCheck, action: () => { setCurrentPage('auditlogs'); setIsGlobalSearchOpen(false); setGlobalSearchQuery(""); } },
                      { category: "Management", title: "Assets Inventory", desc: "Track laptops, phones and devices list", icon: Laptop, action: () => { setCurrentPage('assets'); setIsGlobalSearchOpen(false); setGlobalSearchQuery(""); } },
                      { category: "Management", title: "Payroll & Slips Manager", desc: "Process salary payouts and run payroll", icon: DollarSign, action: () => { setCurrentPage('payroll'); setIsGlobalSearchOpen(false); setGlobalSearchQuery(""); } }
                    );
                  }

                  searchItems.push(
                    { category: "Quick Actions", title: `Switch to ${isDarkMode ? 'Light' : 'Dark'} Mode`, desc: `Change layout style to ${isDarkMode ? 'light' : 'dark'} mode`, icon: isDarkMode ? Sun : Moon, action: () => { toggleTheme(!isDarkMode); setIsGlobalSearchOpen(false); setGlobalSearchQuery(""); } },
                    { category: "Quick Actions", title: sidebarOpen ? "Collapse Sidebar" : "Expand Sidebar", desc: "Toggle side navigation layout width", icon: Menu, action: () => { setSidebarOpen(!sidebarOpen); setIsGlobalSearchOpen(false); setGlobalSearchQuery(""); } },
                    { category: "Quick Actions", title: "Log Out of Session", desc: "Securely sign out of your current session", icon: LogOut, action: () => { handleLogout(); setIsGlobalSearchOpen(false); setGlobalSearchQuery(""); } }
                  );

                  const filtered = searchItems.filter(item => 
                    item.title.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                    item.desc.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                    item.category.toLowerCase().includes(globalSearchQuery.toLowerCase())
                  );

                  // Filter dynamic employees list if query is entered
                  const matchedEmployees = globalSearchQuery.trim()
                    ? globalEmployees.filter(emp => {
                        const name = (emp.fullName || emp.personalInfo?.fullName || '').toLowerCase();
                        const email = (emp.email || '').toLowerCase();
                        const designation = (emp.designation || emp.professionalInfo?.designation || '').toLowerCase();
                        const department = (emp.department || '').toLowerCase();
                        const query = globalSearchQuery.toLowerCase().trim();
                        return name.includes(query) || email.includes(query) || designation.includes(query) || department.includes(query);
                      })
                    : [];

                  // Map matched employees to searchItems format
                  const employeeSearchItems = matchedEmployees.map(emp => ({
                    category: "Employees",
                    title: emp.fullName || 'Employee Name',
                    desc: `${emp.designation || 'Staff'} • ${emp.department || 'Workforce'}`,
                    icon: User,
                    action: () => {
                      setSelectedSearchEmployee(emp);
                      setIsGlobalSearchOpen(false);
                      setGlobalSearchQuery("");
                    },
                    avatarUrl: emp.profilePicture
                  }));

                  // Combine results
                  const combinedResults = [...filtered, ...employeeSearchItems];

                  if (combinedResults.length === 0) {
                    return (
                      <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-[11px] font-medium">
                        No results found for "{globalSearchQuery}"
                      </div>
                    );
                  }

                  // Group by category
                  const categories = Array.from(new Set(combinedResults.map(f => f.category)));

                  return categories.map(cat => (
                    <div key={cat} className="space-y-1">
                      <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 px-3 py-1">
                        {cat}
                      </div>
                      <div className="space-y-0.5">
                        {combinedResults.filter(f => f.category === cat).map((item: any, idx) => {
                          const Icon = item.icon;
                          return (
                            <button
                              key={idx}
                              onClick={item.action}
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 text-left border-none bg-transparent transition-all active:scale-[0.99] cursor-pointer"
                            >
                              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-850 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0 overflow-hidden">
                                {item.avatarUrl ? (
                                  <img src={item.avatarUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <Icon className="w-4 h-4" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 leading-tight">
                                  {item.title}
                                </p>
                                <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 block truncate mt-0.5">
                                  {item.desc}
                                </span>
                              </div>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-350 dark:text-slate-600" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Searched Employee Detail Modal */}
      <AnimatePresence>
        {selectedSearchEmployee && (
          <div className="fixed inset-0 z-[100000] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setSelectedSearchEmployee(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur-xl overflow-hidden text-center"
            >
              {/* Top Accent Gradient line */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-violet-500 via-indigo-500 to-blue-600" />
              
              <button
                onClick={() => setSelectedSearchEmployee(null)}
                className="absolute top-4 right-4 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-all cursor-pointer border-none bg-transparent"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Avatar */}
              <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-tr from-violet-500 to-indigo-650 p-[2px] shadow-lg shadow-indigo-500/25 mb-4">
                <div className="w-full h-full rounded-[14px] overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <img
                    src={selectedSearchEmployee.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedSearchEmployee.fullName || 'Member'}`}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Info details */}
              <h3 className="text-base font-black text-slate-900 dark:text-white font-outfit uppercase">
                {selectedSearchEmployee.fullName}
              </h3>
              <span className="inline-flex items-center mt-1 px-2.5 py-0.5 rounded-lg text-[8.5px] font-black uppercase tracking-widest leading-none bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                {selectedSearchEmployee.designation || 'Staff Member'}
              </span>

              <div className="mt-5 space-y-2.5 text-left text-[10px]">
                <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/40">
                  <span className="text-slate-400 font-bold uppercase tracking-wider">Department</span>
                  <span className="text-slate-800 dark:text-slate-200 font-extrabold capitalize">{selectedSearchEmployee.department || 'General'}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/40">
                  <span className="text-slate-400 font-bold uppercase tracking-wider">Email Address</span>
                  <span className="text-slate-800 dark:text-slate-200 font-mono font-bold select-all">{selectedSearchEmployee.email}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/40">
                  <span className="text-slate-400 font-bold uppercase tracking-wider">Phone number</span>
                  <span className="text-slate-800 dark:text-slate-200 font-mono font-bold">{selectedSearchEmployee.phone || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/40">
                  <span className="text-slate-400 font-bold uppercase tracking-wider">Location</span>
                  <span className="text-slate-800 dark:text-slate-200 font-bold">{selectedSearchEmployee.location || 'Pune Head Office'}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/40">
                  <span className="text-slate-400 font-bold uppercase tracking-wider">Joined Date</span>
                  <span className="text-slate-800 dark:text-slate-200 font-bold">
                    {selectedSearchEmployee.joinedDate ? new Date(selectedSearchEmployee.joinedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Message Quick Action Button */}
              <button
                type="button"
                onClick={() => {
                  setSelectedSearchEmployee(null);
                  setCurrentPage('messages');
                  // Trigger conversation select if chat store is loaded
                  const partnerEmail = selectedSearchEmployee.email;
                  if (partnerEmail) {
                    const currentUserEmail = profile?.email || '';
                    const convoId = [currentUserEmail, partnerEmail].sort().join('|');
                    useChatStore.getState().setActiveConversation(convoId);
                  }
                }}
                className="w-full mt-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-650 hover:from-violet-600 hover:to-indigo-700 text-white text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer border-none active:scale-[0.98] shadow-md shadow-indigo-500/10 flex items-center justify-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Start Direct Chat</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>
    </PermissionProvider>
  );
}
