import { NextResponse } from 'next/server';
import { EmployeeService } from '../services/EmployeeService';
import { verifyAuthToken, createErrorResponse } from '../../../middleware/auth';
import { connectToDatabase } from '../../../database';

export class EmployeeController {
  static async getEmployees(req: Request) {
    try {
      const decoded = verifyAuthToken(req);
      if (!decoded) {
        return createErrorResponse('Unauthorized', 401);
      }

      await connectToDatabase();
      const { searchParams } = new URL(req.url);
      const email = searchParams.get('email');
      const branchId = searchParams.get('branchId') || undefined;

      console.log('[EmployeeController] getEmployees: companyId =', decoded.companyId, '| email filter =', email, '| branchId filter =', branchId);
      const result = await EmployeeService.getEmployees(decoded.companyId, email, decoded.companyCode, branchId, decoded);
      console.log('[EmployeeController] getEmployees: found', Array.isArray(result.data) ? result.data.length : 0, 'employees');
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: result.status });
      }
      return NextResponse.json(result.data, { status: result.status });
    } catch (error: any) {
      console.error('EmployeeController getEmployees Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch employees', details: error.message },
        { status: 500 }
      );
    }
  }

  static async createEmployee(req: Request) {
    try {
      const decoded = verifyAuthToken(req);
      if (!decoded) {
        return createErrorResponse('Unauthorized', 401);
      }

      await connectToDatabase();
      const body = await req.json() as any;
      const result = await EmployeeService.createEmployee(body, decoded);

      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: result.status });
      }
      return NextResponse.json(result, { status: result.status });
    } catch (error: any) {
      console.error('EmployeeController createEmployee Error:', error);
      return NextResponse.json(
        { error: 'Failed to create employee', details: error.message },
        { status: 500 }
      );
    }
  }

  static async updateEmployee(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
      const decoded = verifyAuthToken(req);
      if (!decoded) {
        return createErrorResponse('Unauthorized', 401);
      }

      const { id } = await params;
      await connectToDatabase();
      const body = await req.json() as any;
      const result = await EmployeeService.updateEmployee(id, body, decoded.companyId);

      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: result.status });
      }
      return NextResponse.json(result, { status: result.status });
    } catch (error: any) {
      console.error('EmployeeController updateEmployee Error:', error);
      return NextResponse.json(
        { error: 'Failed to update employee', details: error.message },
        { status: 500 }
      );
    }
  }

  static async deleteEmployee(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
      const decoded = verifyAuthToken(req);
      if (!decoded) {
        return createErrorResponse('Unauthorized', 401);
      }

      const { id } = await params;
      await connectToDatabase();
      const result = await EmployeeService.deleteEmployee(id, decoded);

      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: result.status });
      }
      return NextResponse.json(result, { status: result.status });
    } catch (error: any) {
      console.error('EmployeeController deleteEmployee Error:', error);
      return NextResponse.json(
        { error: 'Failed to delete employee', details: error.message },
        { status: 500 }
      );
    }
  }

  static async lifecycleEmployee(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
      const decoded = verifyAuthToken(req);
      if (!decoded) {
        return createErrorResponse('Unauthorized', 401);
      }

      const { id } = await params;
      await connectToDatabase();
      const body = await req.json() as any;
      const result = await EmployeeService.lifecycleEmployee(id, body, decoded);

      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: result.status });
      }
      return NextResponse.json(result, { status: result.status });
    } catch (error: any) {
      console.error('EmployeeController lifecycleEmployee Error:', error);
      return NextResponse.json(
        { error: 'Failed to process employee lifecycle action', details: error.message },
        { status: 500 }
      );
    }
  }

  static async getDeletedEmployees(req: Request) {
    try {
      const decoded = verifyAuthToken(req);
      if (!decoded) {
        return createErrorResponse('Unauthorized', 401);
      }

      await connectToDatabase();
      const result = await EmployeeService.getDeletedEmployees(decoded.companyId) as any;

      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: result.status });
      }
      return NextResponse.json(result.data, { status: result.status });
    } catch (error: any) {
      console.error('EmployeeController getDeletedEmployees Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch deleted employees', details: error.message },
        { status: 500 }
      );
    }
  }
}
