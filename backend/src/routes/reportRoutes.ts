import { Router } from 'express';
import { handleWebRoute } from '../adaptor';

// Import route handlers
import { GET as getDashboard } from '../api/reports/dashboard/route';
import { GET as getAttendance } from '../api/reports/attendance/route';
import { GET as getLeaves } from '../api/reports/leaves/route';
import { GET as getPayroll } from '../api/reports/payroll/route';
import { GET as getRecruitment } from '../api/reports/recruitment/route';
import { GET as getPerformance } from '../api/reports/performance/route';
import { GET as getWorkforce } from '../api/reports/workforce/route';
import { GET as exportCsv } from '../api/reports/export/csv/route';
import { GET as exportExcel } from '../api/reports/export/excel/route';
import { GET as exportPdf } from '../api/reports/export/pdf/route';

// Import schedules routes
import { GET as getSchedules, POST as createSchedule } from '../api/reports/schedules/route';
import { DELETE as deleteSchedule } from '../api/reports/schedules/[id]/route';

const router = Router();

router.get('/dashboard', handleWebRoute(getDashboard));
router.get('/attendance', handleWebRoute(getAttendance));
router.get('/leaves', handleWebRoute(getLeaves));
router.get('/payroll', handleWebRoute(getPayroll));
router.get('/recruitment', handleWebRoute(getRecruitment));
router.get('/performance', handleWebRoute(getPerformance));
router.get('/workforce', handleWebRoute(getWorkforce));

router.get('/export/csv', handleWebRoute(exportCsv));
router.get('/export/excel', handleWebRoute(exportExcel));
router.get('/export/pdf', handleWebRoute(exportPdf));

// Schedules CRUD endpoints
router.get('/schedules', handleWebRoute(getSchedules));
router.post('/schedules', handleWebRoute(createSchedule));
router.delete('/schedules/:id', handleWebRoute(deleteSchedule));

export default router;
