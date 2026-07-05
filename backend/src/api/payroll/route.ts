import { PayrollController } from '@/backend/modules/payroll/controllers/PayrollController';

export async function GET(req: Request) {
  return PayrollController.getPayrolls(req);
}

export async function POST(req: Request) {
  return PayrollController.createPayroll(req);
}

