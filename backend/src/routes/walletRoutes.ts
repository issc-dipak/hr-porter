import { Router } from 'express';
import { handleWebRoute } from '../adaptor';
import { GET as getWallet, POST as updateWallet } from '../api/wallet/route';
import { POST as createRazorpayOrder } from '../api/razorpay/order/route';

const router = Router();

router.get('/wallet', handleWebRoute(getWallet));
router.post('/wallet', handleWebRoute(updateWallet));
router.post('/razorpay/order', handleWebRoute(createRazorpayOrder));

export default router;
