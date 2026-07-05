import { EmployeeController } from '@/backend/modules/employees/controllers/EmployeeController';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return EmployeeController.updateEmployee(req, { params });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return EmployeeController.deleteEmployee(req, { params });
}
