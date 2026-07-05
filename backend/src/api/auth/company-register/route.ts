import { AuthController } from '@/backend/modules/auth/controllers/AuthController';

export async function POST(req: Request) {
  return AuthController.companyRegister(req);
}

