import { Router } from 'express';
import { handleWebRoute } from '../adaptor';

// Import route handlers
import { GET as getUpdates, POST as saveUpdate } from '../api/daily-updates/route';
import { GET as getMyUpdates } from '../api/daily-updates/my/route';
import { GET as getCompanyUpdates } from '../api/daily-updates/company/route';
import { GET as getAnalytics } from '../api/daily-updates/analytics/route';
import { GET as getUpdateById } from '../api/daily-updates/[id]/route';
import { POST as reviewUpdate } from '../api/daily-updates/[id]/review/route';
import { POST as addComment } from '../api/daily-updates/[id]/comments/route';

const router = Router();

router.get('/', handleWebRoute(getUpdates));
router.post('/', handleWebRoute(saveUpdate));
router.get('/my', handleWebRoute(getMyUpdates));
router.get('/company', handleWebRoute(getCompanyUpdates));
router.get('/analytics', handleWebRoute(getAnalytics));
router.get('/:id', handleWebRoute(getUpdateById));
router.post('/:id/review', handleWebRoute(reviewUpdate));
router.post('/:id/comments', handleWebRoute(addComment));

export default router;
