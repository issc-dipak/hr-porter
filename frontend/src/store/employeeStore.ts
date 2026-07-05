import { create } from 'zustand';

interface EmployeeState {
  searchQuery: string;
  selectedDepartment: string;
  selectedStatus: string;
  selectedEmployeeId: string | null;
  setSearchQuery: (query: string) => void;
  setSelectedDepartment: (dept: string) => void;
  setSelectedStatus: (status: string) => void;
  setSelectedEmployeeId: (id: string | null) => void;
  resetFilters: () => void;
}

export const useEmployeeStore = create<EmployeeState>((set) => ({
  searchQuery: '',
  selectedDepartment: 'All',
  selectedStatus: 'All',
  selectedEmployeeId: null,
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedDepartment: (dept) => set({ selectedDepartment: dept }),
  setSelectedStatus: (status) => set({ selectedStatus: status }),
  setSelectedEmployeeId: (id) => set({ selectedEmployeeId: id }),
  resetFilters: () => set({ searchQuery: '', selectedDepartment: 'All', selectedStatus: 'All' }),
}));
