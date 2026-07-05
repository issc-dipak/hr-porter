import { EmployeeController } from '@/backend/modules/employees/controllers/EmployeeController';

export async function GET(req: Request) {
  return EmployeeController.getDeletedEmployees(req);
}

