import { Router } from 'express';
import { handleWebRoute } from '../adaptor';
import { GET as getBranding, PUT as updateBranding } from '../api/company/branding/route';
import { POST as uploadLogo } from '../api/company/logo/route';
import { POST as uploadFavicon } from '../api/company/favicon/route';
import { POST as uploadLoginBanner } from '../api/company/login-banner/route';

const router = Router();

router.get('/branding', handleWebRoute(getBranding));
router.put('/branding', handleWebRoute(updateBranding));
router.post('/logo', handleWebRoute(uploadLogo));
router.post('/favicon', handleWebRoute(uploadFavicon));
router.post('/login-banner', handleWebRoute(uploadLoginBanner));

export default router;
