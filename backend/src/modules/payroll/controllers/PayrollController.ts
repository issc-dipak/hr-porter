import { NextResponse } from 'next/server';
import { PayrollService } from '../services/PayrollService';
import { verifyAuthToken, createErrorResponse } from '../../../middleware/auth';
import { connectToDatabase } from '../../../database';

export class PayrollController {
  static async getPayrolls(req: Request) {
    try {
      const decoded = verifyAuthToken(req);
      if (!decoded) {
        return createErrorResponse('Unauthorized', 401);
      }

      await connectToDatabase();
      const { searchParams } = new URL(req.url);
      const branchId = searchParams.get('branchId') || undefined;
      const employeeEmail = decoded.role === 'Employee' ? decoded.email : undefined;
      const result = await PayrollService.getPayrolls(decoded.companyId, employeeEmail, branchId, decoded);
      return NextResponse.json(result.data, { status: result.status });
    } catch (error: any) {
      console.error('PayrollController getPayrolls Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch payrolls', details: error.message },
        { status: 500 }
      );
    }
  }

  static async createPayroll(req: Request) {
    try {
      const decoded = verifyAuthToken(req);
      if (!decoded) {
        return createErrorResponse('Unauthorized', 401);
      }

      await connectToDatabase();
      const body = await req.json() as any;
      const result = await PayrollService.createPayroll(body, decoded.companyId);

      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: result.status });
      }
      return NextResponse.json(result, { status: result.status });
    } catch (error: any) {
      console.error('PayrollController createPayroll Error:', error);
      return NextResponse.json(
        { error: 'Failed to create payroll', details: error.message },
        { status: 500 }
      );
    }
  }

  static async generatePayroll(req: Request) {
    try {
      const decoded = verifyAuthToken(req);
      if (!decoded) {
        return createErrorResponse('Unauthorized', 401);
      }

      await connectToDatabase();
      const body = await req.json() as any;
      const result = await PayrollService.generatePayroll(body.month, decoded.companyId);

      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: result.status });
      }
      return NextResponse.json(result, { status: result.status });
    } catch (error: any) {
      console.error('PayrollController generatePayroll Error:', error);
      return NextResponse.json(
        { error: 'Failed to generate payroll', details: error.message },
        { status: 500 }
      );
    }
  }

  static async updatePayroll(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
      const decoded = verifyAuthToken(req);
      if (!decoded) {
        return createErrorResponse('Unauthorized', 401);
      }

      const { id } = await params;
      await connectToDatabase();
      const body = await req.json() as any;
      const result = await PayrollService.updatePayroll(id, body, decoded.companyId);

      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: result.status });
      }
      return NextResponse.json(result, { status: result.status });
    } catch (error: any) {
      console.error('PayrollController updatePayroll Error:', error);
      return NextResponse.json(
        { error: 'Failed to update payroll', details: error.message },
        { status: 500 }
      );
    }
  }

  static async deletePayroll(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
      const decoded = verifyAuthToken(req);
      if (!decoded) {
        return createErrorResponse('Unauthorized', 401);
      }

      const { id } = await params;
      await connectToDatabase();
      const result = await PayrollService.deletePayroll(id, decoded.companyId);

      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: result.status });
      }
      return NextResponse.json(result, { status: result.status });
    } catch (error: any) {
      console.error('PayrollController deletePayroll Error:', error);
      return NextResponse.json(
        { error: 'Failed to delete payroll', details: error.message },
        { status: 500 }
      );
    }
  }

  static async getBankDetails(req: Request) {
    try {
      const decoded = verifyAuthToken(req);
      if (!decoded) {
        return createErrorResponse('Unauthorized', 401);
      }

      await connectToDatabase();
      const { searchParams } = new URL(req.url);
      const email = searchParams.get('email');

      if (!email) {
        return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 });
      }

      const result = await PayrollService.getBankDetails(email, decoded.companyId);
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: result.status });
      }
      return NextResponse.json(result, { status: result.status });
    } catch (error: any) {
      console.error('PayrollController getBankDetails Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch bank details', details: error.message },
        { status: 500 }
      );
    }
  }

  static async updateBankDetails(req: Request) {
    try {
      const decoded = verifyAuthToken(req);
      if (!decoded) {
        return createErrorResponse('Unauthorized', 401);
      }

      await connectToDatabase();
      const body = await req.json() as any;
      const result = await PayrollService.updateBankDetails(body.email, body.bankDetails, decoded.companyId);

      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: result.status });
      }
      return NextResponse.json(result, { status: result.status });
    } catch (error: any) {
      console.error('PayrollController updateBankDetails Error:', error);
      return NextResponse.json(
        { error: 'Failed to update bank details', details: error.message },
        { status: 500 }
      );
    }
  }
}
