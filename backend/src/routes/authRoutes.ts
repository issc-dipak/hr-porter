import { Router } from 'express';
import { handleWebRoute } from '../adaptor';
import { POST as forgotPassword } from '../api/auth/forgot-password/route';
import { POST as login } from '../api/auth/login/route';
import { POST as resetPassword } from '../api/auth/reset-password/route';
import { POST as signup } from '../api/auth/signup/route';
import { POST as companyRegister } from '../api/auth/company-register/route';
import { POST as verifyEmail } from '../api/auth/verify-email/route';
import { POST as sendOtp } from '../api/auth/send-otp/route';
import { POST as inviteUser } from '../api/auth/invite-user/route';
import { POST as acceptInvite } from '../api/auth/accept-invite/route';
import { POST as setupAdminProfile } from '../api/auth/setup-admin-profile/route';
import { POST as verifyMobileOtp } from '../api/auth/verify-mobile-otp/route';

const router = Router();
router.post('/forgot-password', handleWebRoute(forgotPassword));
router.post('/login', handleWebRoute(login));
router.post('/reset-password', handleWebRoute(resetPassword));
router.post('/signup', handleWebRoute(signup));
router.post('/company-register', handleWebRoute(companyRegister));
router.post('/verify-email', handleWebRoute(verifyEmail));
router.post('/send-otp', handleWebRoute(sendOtp));
router.post('/invite-user', handleWebRoute(inviteUser));
router.post('/accept-invite', handleWebRoute(acceptInvite));
router.post('/setup-admin-profile', handleWebRoute(setupAdminProfile));
router.post('/verify-mobile-otp', handleWebRoute(verifyMobileOtp));

export default router;
