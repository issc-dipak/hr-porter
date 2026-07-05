export interface IReferral {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string; // 'Submitted' | 'Under Review' | 'Interview Scheduled' | 'Selected' | 'Rejected' | 'Bonus Credited'
  bonus: number;
  date: string;
  notes: string;
}

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
}

export interface IApplicant {
  name: string;
  email: string;
  phone: string;
  status: string;
  date: string;
  skills?: string[];
  experience?: string;
  rating?: number;
  resumeUrl?: string;
  scorecard?: IScorecard;
  interviews?: IInterviewSchedule[];
  jobId?: string;
  jobTitle?: string;
}

export interface IJob {
  id?: number | string;
  _id?: string;
  title: string;
  dept: string;
  location: string;
  salary: string;
  type: string;
  description?: string;
  requirements?: string[];
  applicants?: IApplicant[];
  status: string;
  aiScore?: number;
}
