import { PayrollController } from '@/backend/modules/payroll/controllers/PayrollController';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return PayrollController.updatePayroll(req, { params });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return PayrollController.deletePayroll(req, { params });
}
