import { Router } from 'express';
import { handleWebRoute } from '../adaptor';
import { GET as getExpenses, POST as createExpense } from '../api/expenses/route';
import { POST as processOcr } from '../api/expenses/ocr/route';
import { GET as getPolicies, POST as updatePolicy } from '../api/expenses/policies/route';
import { GET as getAnalytics } from '../api/expenses/analytics/route';
import { PUT as updateExpense, DELETE as deleteExpense } from '../api/expenses/[id]/route';
import { GET as getBankDetails, POST as saveBankDetails } from '../api/expenses/bank/route';
import { POST as verifyBank } from '../api/expenses/bank/verify/route';
import { POST as receiveWebhook } from '../api/expenses/webhooks/route';
import { GET as getPayouts } from '../api/expenses/payouts/route';

const router = Router();

// OCR receipt scanner
router.post('/ocr', handleWebRoute(processOcr));

// Policy limits management
router.get('/policies', handleWebRoute(getPolicies));
router.post('/policies', handleWebRoute(updatePolicy));

// Expenses analytics
router.get('/analytics', handleWebRoute(getAnalytics));

// Bank details endpoints
router.get('/bank', handleWebRoute(getBankDetails));
router.post('/bank', handleWebRoute(saveBankDetails));
router.post('/bank/verify', handleWebRoute(verifyBank));

// Webhook listener
router.post('/webhooks', handleWebRoute(receiveWebhook));

// Payout transactions query
router.get('/payouts', handleWebRoute(getPayouts));

// CRUD & Workflow actions on claims
router.get('/', handleWebRoute(getExpenses));
router.post('/', handleWebRoute(createExpense));
router.put('/:id', handleWebRoute(updateExpense));
router.delete('/:id', handleWebRoute(deleteExpense));

export default router;
