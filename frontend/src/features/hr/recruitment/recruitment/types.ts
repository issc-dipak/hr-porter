export interface IScorecard {
  interviewerRating?: number;
  feedbackComments?: string;
  recommendation?: string;
}

export interface IInterviewSchedule {
  round: string;
  date: string;
  time: string;
  interviewer: string;
  meetingLink: string;
  completed: boolean;
  location?: string;
}

export interface IApplicant {
  name: string;
  email: string;
  phone: string;
  status: string; // Stage: Applied, Screening, Shortlisted, etc.
  date: string;
  skills?: string[];
  experience?: string;
  rating?: number; // AI match score (1-100)
  resumeUrl?: string;
  scorecard?: IScorecard;
  interviews?: IInterviewSchedule[];
  jobId?: string;
  jobTitle?: string;
  jobDept?: string;
  aiSummary?: string;
  aiSuggestedQuestions?: string[];
  education?: string;
}

export interface IJob {
  _id: string;
  title: string;
  dept: string;
  location: string;
  salary: string;
  type: string;
  experienceLevel?: string;
  description?: string;
  requirements?: string[];
  applicants: IApplicant[];
  status: string; // Active, Closed, On Hold, Draft
  postedDate?: string;
  publicUrlSlug?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IReferral {
  id: number;
  referrerName: string;
  referrerEmail: string;
  candidateName: string;
  jobTitle: string;
  status: string;
  bonus: number;
  date: string;
}
