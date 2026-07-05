import { Router } from 'express';
import { handleWebRoute } from '../adaptor';
import { GET as getBranches, POST as createBranch } from '../api/branches/route';
import { PUT as updateBranch, DELETE as deleteBranch } from '../api/branches/[id]/route';
import { GET as getDepartments, POST as createDepartment } from '../api/departments/route';
import { PUT as updateDepartment, DELETE as deleteDepartment } from '../api/departments/[id]/route';
import { GET as getDesignations, POST as createDesignation } from '../api/designations/route';
import { PUT as updateDesignation, DELETE as deleteDesignation } from '../api/designations/[id]/route';

const router = Router();

router.get('/branches', handleWebRoute(getBranches));
router.post('/branches', handleWebRoute(createBranch));
router.put('/branches/:id', handleWebRoute(updateBranch));
router.delete('/branches/:id', handleWebRoute(deleteBranch));

router.get('/departments', handleWebRoute(getDepartments));
router.post('/departments', handleWebRoute(createDepartment));
router.put('/departments/:id', handleWebRoute(updateDepartment));
router.delete('/departments/:id', handleWebRoute(deleteDepartment));

router.get('/designations', handleWebRoute(getDesignations));
router.post('/designations', handleWebRoute(createDesignation));
router.put('/designations/:id', handleWebRoute(updateDesignation));
router.delete('/designations/:id', handleWebRoute(deleteDesignation));

export default router;
