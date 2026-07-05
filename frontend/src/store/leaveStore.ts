import { create } from 'zustand';

interface LeaveItem {
  id: number;
  employee: string;
  name: string;
  type: string;
  duration: string;
  date: string;
  status: string;
  reason: string;
  dept: string;
}

interface LeaveState {
  leaves: LeaveItem[];
  setLeaves: (leaves: LeaveItem[]) => void;
  addLeave: (leave: LeaveItem) => void;
  updateLeaveStatus: (id: number, status: string) => void;
}

const initialLeaves: LeaveItem[] = [];

export const useLeaveStore = create<LeaveState>((set) => ({
  leaves: initialLeaves,
  setLeaves: (leaves) => set({ leaves }),
  addLeave: (leave) => set((state) => ({ leaves: [leave, ...state.leaves] })),
  updateLeaveStatus: (id, status) => set((state) => ({
    leaves: state.leaves.map((l) => (l.id === id ? { ...l, status } : l))
  })),
}));
