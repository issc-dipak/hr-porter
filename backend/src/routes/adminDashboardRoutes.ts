import { Router } from 'express';
import { handleWebRoute } from '../adaptor';
import { NextResponse } from 'next/server';
import { verifyAuth } from '../api/lib/auth';
import connectToDatabase from '../api/lib/mongodb';
import { Employee } from '../models/Employee';
import { Payroll } from '../models/Payroll';
import { Ticket } from '../models/Ticket';
import { Job } from '../models/Job';
import { Application } from '../models/Application';
import { User } from '../models/User';
import { AuditLog } from '../models/AuditLog';
import { Announcement } from '../models/Announcement';
import { DeletedEmployee } from '../models/DeletedEmployee';
import { Company } from '../models/Company';
import { Leave } from '../models/Leave';
import { Performance } from '../models/Performance';
import { Attendance } from '../models/Attendance';
import mongoose from 'mongoose';
import { DashboardService } from '../services/DashboardService';

const router = Router();

// GET /api/admin/dashboard
router.get('/admin/dashboard', handleWebRoute(async (req: Request) => {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { companyId, role } = decoded;

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get('branchId') || undefined;
    const result = await DashboardService.getAdminDashboardData(companyId, role, decoded, branchId);

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status as number });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Failed to get Admin consolidated dashboard data:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}));

// POST /api/admin/action
router.post('/admin/action', handleWebRoute(async (req: Request) => {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { companyId, role } = decoded;

    if (role !== 'Admin' && role !== 'Company Admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { actionType, targetId, data } = await req.json() as any;
    if (!actionType) return NextResponse.json({ error: 'Missing actionType' }, { status: 400 });

    await connectToDatabase();

    await AuditLog.create({
      companyId,
      action: `ADMIN_ACTION_${actionType.toUpperCase()}`,
      performedBy: decoded.email || 'admin@company.com',
      details: `Admin triggered action: ${actionType} on target ${targetId || 'N/A'}`,
      ipAddress: '127.0.0.1'
    });

    return NextResponse.json({ success: true, message: 'Admin action executed successfully' }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}));

export default router;
