import { Router } from 'express';
import { handleWebRoute } from '../adaptor';
import { POST as changePassword } from '../api/settings/password/route';
import { GET as getSystemSettings, POST as updateSystemSettings } from '../api/settings/system/route';
import { GET as getUserSettings, POST as updateUserSettings } from '../api/settings/user/route';
import { GET as getUsersList, PUT as updateUsersList } from '../api/settings/users/route';
import { GET as downloadData } from '../api/settings/download-data/route';

const router = Router();

router.post('/password', handleWebRoute(changePassword));
router.get('/system', handleWebRoute(getSystemSettings));
router.post('/system', handleWebRoute(updateSystemSettings));
router.get('/user', handleWebRoute(getUserSettings));
router.post('/user', handleWebRoute(updateUserSettings));
router.get('/users', handleWebRoute(getUsersList));
router.put('/users', handleWebRoute(updateUsersList));
router.get('/download-data', handleWebRoute(downloadData));

export default router;
