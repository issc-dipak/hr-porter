import { LeaveController } from '@/backend/modules/leave/controllers/LeaveController';

export const dynamic = 'force-dynamic';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return LeaveController.updateLeaveStatus(req, { params });
}
