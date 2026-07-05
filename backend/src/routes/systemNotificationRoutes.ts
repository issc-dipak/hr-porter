import { Router } from 'express';
import { handleWebRoute } from '../adaptor';
import { GET as getNotifications, PUT as updateNotifications } from '../api/system-notifications/route';

const router = Router();

router.get('/', handleWebRoute(getNotifications));
router.put('/', handleWebRoute(updateNotifications));

export default router;
