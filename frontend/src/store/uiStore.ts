import { create } from 'zustand';

interface ToastInfo {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

export interface SelectedBranch {
  id: string;
  name: string;
}

interface ConfirmModalInfo {
  title: string;
  message: string;
  onConfirm: () => void;
}

interface UIState {
  sidebarOpen: boolean;
  isMobile: boolean;
  currentPage: string;
  showToast: ToastInfo | string | null;
  selectedBranchId: string;
  selectedBranch: SelectedBranch | null;
  confirmModal: ConfirmModalInfo | null;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setIsMobile: (isMobile: boolean) => void;
  setCurrentPage: (page: string) => void;
  triggerToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  clearToast: () => void;
  setSelectedBranchId: (branchId: string) => void;
  setSelectedBranch: (branch: SelectedBranch | null) => void;
  triggerConfirm: (title: string, message: string, onConfirm: () => void) => void;
  closeConfirm: () => void;
}

const getInitialBranch = (): SelectedBranch | null => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('hr_selected_branch');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (_) {}
    }
  }
  return null;
};

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  isMobile: false,
  currentPage: 'dashboard',
  showToast: null,
  selectedBranchId: getInitialBranch()?.id || '',
  selectedBranch: getInitialBranch(),
  confirmModal: null,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setIsMobile: (mobile) => set({ isMobile: mobile }),
  setCurrentPage: (page) => set({ currentPage: page }),
  triggerToast: (message, type = 'info') => {
    set({ showToast: { message, type } });
    setTimeout(() => {
      set({ showToast: null });
    }, 4000);
  },
  clearToast: () => set({ showToast: null }),
  setSelectedBranchId: (branchId) => set({ selectedBranchId: branchId }),
  setSelectedBranch: (branch) => {
    set({ selectedBranch: branch, selectedBranchId: branch ? branch.id : '' });
    if (typeof window !== 'undefined') {
      if (branch) {
        localStorage.setItem('hr_selected_branch', JSON.stringify(branch));
      } else {
        localStorage.removeItem('hr_selected_branch');
      }
    }
  },
  triggerConfirm: (title, message, onConfirm) => set({ confirmModal: { title, message, onConfirm } }),
  closeConfirm: () => set({ confirmModal: null }),
}));
