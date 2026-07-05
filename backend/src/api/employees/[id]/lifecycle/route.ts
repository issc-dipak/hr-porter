import { EmployeeController } from '@/backend/modules/employees/controllers/EmployeeController';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return EmployeeController.lifecycleEmployee(req, { params });
}
