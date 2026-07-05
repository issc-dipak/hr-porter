import { create } from 'zustand';

export interface BrandingData {
  companyId: string;
  companyName: string;
  companyShortName: string;
  companyTagline: string;
  companyLogo: string;
  favicon: string;
  loginBanner: string;
  loginBackground: string;
  companyWatermark: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  companyEmail: string;
  companyPhone: string;
  companyWebsite: string;
  companyAddress: string;
  companyCode: string;
  welcomeMessage: string;
  emailHeaderLogoVisible: boolean;
  companyHandbookUrl?: string;
  hrPoliciesUrl?: string;
  orgChartUrl?: string;
  trainingPortalUrl?: string;
}

interface BrandingState {
  branding: BrandingData;
  loading: boolean;
  fetchBranding: () => Promise<void>;
  updateBrandingState: (updates: Partial<BrandingData>) => void;
  saveBranding: () => Promise<void>;
  applyTheme: () => void;
}

const defaultBranding: BrandingData = {
  companyId: '',
  companyName: 'HR Core HRMS',
  companyShortName: 'HR Core',
  companyTagline: 'Next Generation HR Solutions',
  companyLogo: '',
  favicon: '',
  loginBanner: '',
  loginBackground: '',
  companyWatermark: '',
  primaryColor: '#1e3a5f', // Workday Deep Navy
  secondaryColor: '#2563eb', // Workday Cerulean Blue
  accentColor: '#60a5fa',  // Workday Sky Blue
  companyEmail: '',
  companyPhone: '',
  companyWebsite: '',
  companyAddress: '',
  companyCode: '',
  welcomeMessage: 'Welcome to HR Core HRMS Portal',
  emailHeaderLogoVisible: true,
  companyHandbookUrl: '',
  hrPoliciesUrl: '',
  orgChartUrl: '',
  trainingPortalUrl: ''
};

export const useBrandingStore = create<BrandingState>((set, get) => ({
  branding: defaultBranding,
  loading: false,

  fetchBranding: async () => {
    try {
      set({ loading: true });
      const token = localStorage.getItem('hr_system_token');
      if (!token) {
        set({ branding: defaultBranding });
        return;
      }
      
      const res = await fetch('/api/company/branding', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data) {
          set({ branding: { ...defaultBranding, ...data } });
          get().applyTheme();
        }
      }
    } catch (err) {
      console.error('Error fetching branding settings:', err);
    } finally {
      set({ loading: false });
    }
  },

  updateBrandingState: (updates) => {
    set((state) => ({
      branding: { ...state.branding, ...updates }
    }));
    get().applyTheme();
  },

  saveBranding: async () => {
    try {
      const token = localStorage.getItem('hr_system_token');
      if (!token) throw new Error('Not authenticated');

      const brandingData = get().branding;
      const res = await fetch('/api/company/branding', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(brandingData)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save branding settings');
      }
      
      const updated = await res.json();
      if (updated && updated.branding) {
        set({ branding: { ...defaultBranding, ...updated.branding } });
        get().applyTheme();
      }
    } catch (err) {
      console.error('Error saving branding settings:', err);
      throw err;
    }
  },

  applyTheme: () => {
    if (typeof window === 'undefined') return;
    const { branding } = get();
    
    const root = document.documentElement;

    // Inject custom colors as CSS variables
    const primary = branding.primaryColor || '#2563eb';
    const secondary = branding.secondaryColor || '#4f46e5';
    const accent = branding.accentColor || '#06b6d4';

    // Helper to calculate slightly darker/lighter variants
    root.style.setProperty('--primary', primary);
    root.style.setProperty('--secondary-accent', secondary);
    root.style.setProperty('--info', accent);
    
    // Dynamically update favicon link
    if (branding.favicon) {
      let faviconLink = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!faviconLink) {
        faviconLink = document.createElement('link');
        faviconLink.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(faviconLink);
      }
      faviconLink.href = branding.favicon;
    }
  }
}));
