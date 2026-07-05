import { Router } from 'express';
import { handleWebRoute } from '../adaptor';

// Import route handlers
import { POST as publishJob } from '../api/jobs/[id]/publish/route';
import { GET as getCareersSlug, POST as applyCareersSlug } from '../api/careers/[slug]/route';
import { GET as getCareers } from '../api/careers/route';
import { GET as getApplications } from '../api/applications/route';
import { GET as getApplicationById, PUT as updateApplication } from '../api/applications/[id]/route';
import { POST as scheduleInterview } from '../api/interviews/route';
import { GET as getRecruitmentAnalytics } from '../api/analytics/recruitment/route';
import { POST as parseResume } from '../api/applications/parse-resume/route';

const router = Router();

// Public Careers Page APIs
router.get('/careers', handleWebRoute(getCareers));
router.get('/careers/:slug', handleWebRoute(getCareersSlug));
router.post('/careers/:slug/apply', handleWebRoute(applyCareersSlug));

// Authenticated ATS APIs
router.post('/jobs/:id/publish', handleWebRoute(publishJob));
router.get('/applications', handleWebRoute(getApplications));
router.get('/applications/:id', handleWebRoute(getApplicationById));
router.put('/applications/:id/stage', handleWebRoute(updateApplication));
router.post('/applications/parse-resume', handleWebRoute(parseResume));
router.post('/interviews', handleWebRoute(scheduleInterview));
router.get('/analytics/recruitment', handleWebRoute(getRecruitmentAnalytics));

export default router;
