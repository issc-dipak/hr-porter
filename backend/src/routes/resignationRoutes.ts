import { Router } from 'express';
import { handleWebRoute } from '../adaptor';
import { GET as getResignations, POST as submitResignation } from '../api/resignations/route';
import { GET as getResignation, PUT as updateResignation } from '../api/resignations/[id]/route';
import { GET as getAnalytics } from '../api/resignations/analytics/route';
import { POST as generateExpLetter, GET as printExpLetter } from '../api/resignations/[id]/experience-letter/route';
import { POST as generateRelLetter, GET as printRelLetter } from '../api/resignations/[id]/relieving-letter/route';

const router = Router();

router.get('/analytics', handleWebRoute(getAnalytics));
router.get('/', handleWebRoute(getResignations));
router.post('/', handleWebRoute(submitResignation));
router.get('/:id', handleWebRoute(getResignation));
router.put('/:id', handleWebRoute(updateResignation));
router.post('/:id/experience-letter', handleWebRoute(generateExpLetter));
router.get('/:id/experience-letter', handleWebRoute(printExpLetter));
router.post('/:id/relieving-letter', handleWebRoute(generateRelLetter));
router.get('/:id/relieving-letter', handleWebRoute(printRelLetter));

export default router;
