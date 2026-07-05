import { create } from 'zustand';

interface PayrollState {
  selectedMonth: string;
  payrollSearchQuery: string;
  setSelectedMonth: (month: string) => void;
  setPayrollSearchQuery: (query: string) => void;
}

export const usePayrollStore = create<PayrollState>((set) => ({
  selectedMonth: 'May 2026',
  payrollSearchQuery: '',
  setSelectedMonth: (month) => set({ selectedMonth: month }),
  setPayrollSearchQuery: (query) => set({ payrollSearchQuery: query }),
}));
