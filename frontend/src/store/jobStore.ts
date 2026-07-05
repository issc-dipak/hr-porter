import { create } from 'zustand';

interface Applicant {
  name: string;
  status: string;
  date: string;
  avatar: string;
}

interface JobItem {
  id: number;
  title: string;
  dept: string;
  location: string;
  salary: string;
  type: string;
  applicants: Applicant[];
  status: string;
  postedDate: string;
  applied: boolean;
  description: string;
  requirements: string[];
}

interface JobState {
  jobs: JobItem[];
  setJobs: (jobs: JobItem[]) => void;
  addJob: (job: JobItem) => void;
  updateJob: (id: number, updates: Partial<JobItem>) => void;
}

const initialJobs: JobItem[] = [];

export const useJobStore = create<JobState>((set) => ({
  jobs: initialJobs,
  setJobs: (jobs) => set({ jobs }),
  addJob: (job) => set((state) => ({ jobs: [job, ...state.jobs] })),
  updateJob: (id, updates) => set((state) => ({
    jobs: state.jobs.map((j) => (j.id === id ? { ...j, ...updates } : j))
  })),
}));
