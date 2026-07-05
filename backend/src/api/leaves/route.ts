import { LeaveController } from '@/backend/modules/leave/controllers/LeaveController';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  return LeaveController.getLeaves(req);
}

export async function POST(req: Request) {
  return LeaveController.createLeave(req);
}

