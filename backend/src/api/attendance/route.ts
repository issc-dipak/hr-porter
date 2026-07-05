import { AttendanceController } from '@/backend/modules/attendance/controllers/AttendanceController';

export async function GET(req: Request) {
  return AttendanceController.getAttendance(req);
}

export async function POST(req: Request) {
  return AttendanceController.logAttendance(req);
}

