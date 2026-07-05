import { PayrollController } from '@/backend/modules/payroll/controllers/PayrollController';

export async function GET(req: Request) {
  return PayrollController.getBankDetails(req);
}

export async function POST(req: Request) {
  return PayrollController.updateBankDetails(req);
}

