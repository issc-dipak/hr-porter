import { EmployeeController } from '@/backend/modules/employees/controllers/EmployeeController';

export async function GET(req: Request) {
  return EmployeeController.getEmployees(req);
}

export async function POST(req: Request) {
  return EmployeeController.createEmployee(req);
}

