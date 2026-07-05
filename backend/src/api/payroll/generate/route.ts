import { PayrollController } from '@/backend/modules/payroll/controllers/PayrollController';

export async function POST(req: Request) {
  return PayrollController.generatePayroll(req);
}

