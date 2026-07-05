import { Router } from 'express';
import { handleWebRoute } from '../adaptor';
import { NextResponse } from 'next/server';
import { verifyAuth } from '../api/lib/auth';
import connectToDatabase from '../api/lib/mongodb';
import { Employee } from '../models/Employee';
import { Attendance } from '../models/Attendance';
import { Leave } from '../models/Leave';
import { Payroll } from '../models/Payroll';
import { Ticket } from '../models/Ticket';
import { Job } from '../models/Job';
import { Application } from '../models/Application';
import { DailyWorkUpdate } from '../models/DailyWorkUpdate';
import { Performance } from '../models/Performance';
import { User } from '../models/User';
import { AuditLog } from '../models/AuditLog';
import { Announcement } from '../models/Announcement';
import { DeletedEmployee } from '../models/DeletedEmployee';
import { Company } from '../models/Company';
import mongoose from 'mongoose';
import { DashboardService } from '../services/DashboardService';

const router = Router();

// GET /api/hr/dashboard
router.get('/hr/dashboard', handleWebRoute(async (req: Request) => {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { companyId, role, email } = decoded;

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get('branchId') || undefined;
    const result = await DashboardService.getHRDashboardData(companyId, role, email, decoded, branchId);

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status as number });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Failed to get HR Command Center data:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}));

// POST /api/hr/action
router.post('/hr/action', handleWebRoute(async (req: Request) => {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { companyId } = decoded;

    const data = await req.json() as any;
    const { type, id, action } = data; // type: 'leave' | 'ticket' | 'document' | 'correction' | 'onboarding'

    if (!type || !id || !action) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    await connectToDatabase();

    // Log the approval action in the AuditLog
    await AuditLog.create({
      companyId,
      action: `${type.toUpperCase()} ${action.toUpperCase()}`,
      performedBy: decoded.email || 'admin@company.com',
      details: `Admin ${action}d ${type} request for ID: ${id}`,
      ipAddress: '127.0.0.1'
    });

    if (type === 'leave') {
      const statusMap = action === 'approve' ? 'Approved' : 'Rejected';
      const updated = await Leave.findOneAndUpdate({ _id: id, companyId }, { status: statusMap }, { new: true });
      return NextResponse.json({ success: true, item: updated }, { status: 200 });
    }

    if (type === 'ticket') {
      const statusMap = action === 'approve' ? 'Resolved' : 'Closed';
      const updated = await Ticket.findOneAndUpdate({ _id: id, companyId }, { status: statusMap }, { new: true });
      return NextResponse.json({ success: true, item: updated }, { status: 200 });
    }

    if (type === 'document') {
      const statusMap = action === 'approve' ? 'Verified' : 'Rejected';
      const updated = await Employee.findOneAndUpdate(
        { companyId, "documents._id": id },
        { $set: { "documents.$.status": statusMap } },
        { new: true }
      );
      return NextResponse.json({ success: true, item: updated }, { status: 200 });
    }

    if (type === 'onboarding') {
      const statusMap = action === 'approve' ? 'Active' : 'Pending';
      const updated = await Employee.findOneAndUpdate(
        { _id: id, companyId },
        { $set: { status: statusMap } },
        { new: true }
      );
      return NextResponse.json({ success: true, item: updated }, { status: 200 });
    }

    if (type === 'correction') {
      const statusMap = action === 'approve' ? 'Present' : 'Late';
      const remarksMap = action === 'approve' ? 'Late arrival correction approved' : 'Late arrival correction rejected';
      const updated = await Attendance.findOneAndUpdate(
        { _id: id, companyId },
        { $set: { status: statusMap, remarks: remarksMap } },
        { new: true }
      );
      return NextResponse.json({ success: true, item: updated }, { status: 200 });
    }

    return NextResponse.json({ error: 'Invalid action type' }, { status: 400 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}));

export default router;
