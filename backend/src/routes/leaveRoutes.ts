import { Router } from 'express';
import { handleWebRoute } from '../adaptor';
import { GET as getLeaves, POST as createLeave } from '../api/leaves/route';
import { PUT as updateLeaveStatus } from '../api/leaves/[id]/route';

const router = Router();

router.get('/', handleWebRoute(getLeaves));
router.post('/', handleWebRoute(createLeave));
router.put('/:id', handleWebRoute(updateLeaveStatus));

export default router;
