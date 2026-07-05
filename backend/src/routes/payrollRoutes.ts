import { Router } from 'express';
import { handleWebRoute } from '../adaptor';
import { GET as getPayroll, POST as createPayroll } from '../api/payroll/route';
import { POST as generatePayroll } from '../api/payroll/generate/route';
import { GET as getBankDetails, POST as updateBankDetails } from '../api/payroll/bank/route';
import { PUT as updatePayroll, DELETE as deletePayroll } from '../api/payroll/[id]/route';
import { GET as getSalary, PUT as updateSalary } from '../api/salary/route';
import { GET as getSalaryRevisions, POST as createRevision, PUT as processRevision } from '../api/salary/revision/route';

const router = Router();

// Payroll routes
router.get('/', handleWebRoute(getPayroll));
router.post('/', handleWebRoute(createPayroll));
router.post('/generate', handleWebRoute(generatePayroll));
router.get('/bank', handleWebRoute(getBankDetails));
router.post('/bank', handleWebRoute(updateBankDetails));
router.put('/:id', handleWebRoute(updatePayroll));
router.delete('/:id', handleWebRoute(deletePayroll));

// Salary Management routes
router.get('/salary', handleWebRoute(getSalary));
router.put('/salary', handleWebRoute(updateSalary));
router.get('/salary/revision', handleWebRoute(getSalaryRevisions));
router.post('/salary/revision', handleWebRoute(createRevision));
router.put('/salary/revision', handleWebRoute(processRevision));

export default router;

