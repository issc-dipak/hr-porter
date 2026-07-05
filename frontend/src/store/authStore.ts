import { create } from 'zustand';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  empId: string;
  joined: string;
  dept: string;
  role: string;
  profilePicture: string;
  emergencyContact: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  maxLeaves?: number;
  companyName?: string;
  companyCode?: string;
  companyId?: string;
  branchId?: string;
  reportingManager?: any;
  isManager?: boolean;
}

export interface ISubscriptionState {
  planCode: 'starter' | 'professional' | 'enterprise';
  status: 'trial' | 'active' | 'paused' | 'cancelled' | 'expired';
  price: number;
  endDate: string;
  daysRemaining: number;
  employeeLimit: number;
}

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  userRole: string;
  userPermissions: string[];           // ← NEW: RBAC permission keys
  permissionsLoaded: boolean;          // ← NEW: whether permissions have been fetched
  profile: UserProfile;
  subscription: ISubscriptionState | null;
  setToken: (token: string | null) => void;
  setIsAuthenticated: (auth: boolean) => void;
  setUserRole: (role: string) => void;
  setUserPermissions: (perms: string[]) => void;   // ← NEW
  setPermissionsLoaded: (v: boolean) => void;      // ← NEW
  hasPermission: (key: string) => boolean;          // ← NEW helper
  setProfile: (profileUpdates: Partial<UserProfile> | ((prev: UserProfile) => Partial<UserProfile>)) => void;
  setSubscription: (sub: ISubscriptionState | null) => void;
  logout: () => void;
}

const initialProfile: UserProfile = {
  id: '',
  name: '',
  email: '',
  phone: '',
  location: '',
  empId: '',
  joined: '',
  dept: '',
  role: '',
  profilePicture: '',
  emergencyContact: '',
  bankName: '',
  accountNumber: '',
  ifscCode: '',
  maxLeaves: 24,
  branchId: '',
};

export const useAuthStore = create<AuthState>((set, get) => ({
  token: typeof window !== 'undefined' ? localStorage.getItem('hr_system_token') : null,
  isAuthenticated: typeof window !== 'undefined' ? localStorage.getItem('hr_system_auth') === 'true' : false,
  userRole: typeof window !== 'undefined' ? localStorage.getItem('hr_system_role') || 'HR' : 'HR',
  userPermissions: [],
  permissionsLoaded: false,
  profile: initialProfile,
  subscription: null,
  
  setToken: (token) => {
    if (token) {
      localStorage.setItem('hr_system_token', token);
    } else {
      localStorage.removeItem('hr_system_token');
    }
    set({ token });
  },
  
  setIsAuthenticated: (auth) => {
    localStorage.setItem('hr_system_auth', String(auth));
    set({ isAuthenticated: auth });
  },
  
  setUserRole: (role) => {
    localStorage.setItem('hr_system_role', role);
    set({ userRole: role });
  },

  setUserPermissions: (perms) => {
    set({ userPermissions: perms, permissionsLoaded: true });
  },

  setPermissionsLoaded: (v) => {
    set({ permissionsLoaded: v });
  },

  /**
   * hasPermission(key) — check if user has a specific permission key.
   * Admin always returns true (all permissions).
   */
  hasPermission: (key: string) => {
    const state = get();
    // Admin always has everything
    if (state.userRole === 'Admin' || state.userRole === 'Super Admin') return true;
    return state.userPermissions.includes(key);
  },
  
  setProfile: (profileUpdates) => {
    set((state) => {
      const updates = typeof profileUpdates === 'function'
        ? profileUpdates(state.profile)
        : profileUpdates;
      return {
        profile: { ...state.profile, ...updates }
      };
    });
  },

  setSubscription: (subscription) => {
    set({ subscription });
  },
  
  logout: () => {
    localStorage.removeItem('hr_system_token');
    localStorage.setItem('hr_system_auth', 'false');
    localStorage.removeItem('hr_system_role');
    localStorage.removeItem('hr_system_page');
    localStorage.removeItem('hr_rbac_permissions'); // Clear permission cache
    set({
      token: null,
      isAuthenticated: false,
      userRole: 'HR',
      userPermissions: [],
      permissionsLoaded: false,
      profile: initialProfile,
      subscription: null,
    });
  },
}));
