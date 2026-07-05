import { Router } from 'express';
import { handleWebRoute } from '../adaptor';
import { GET as getAttendance, POST as markAttendance } from '../api/attendance/route';

const router = Router();

router.get('/', handleWebRoute(getAttendance));
router.post('/', handleWebRoute(markAttendance));

export default router;
