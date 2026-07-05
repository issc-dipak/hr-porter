import { NextResponse } from 'next/server';
import { AttendanceService } from '../services/AttendanceService';
import { verifyAuthToken, createErrorResponse } from '../../../middleware/auth';
import { connectToDatabase } from '../../../database';

export class AttendanceController {
  static async getAttendance(req: Request) {
    try {
      const decoded = verifyAuthToken(req);
      if (!decoded) {
        return createErrorResponse('Unauthorized', 401);
      }

      await connectToDatabase();
      const { searchParams } = new URL(req.url);
      const branchId = searchParams.get('branchId') || undefined;
      const employeeName = decoded.role === 'Employee' ? decoded.fullName : undefined;
      const result = await AttendanceService.getAttendance(decoded.companyId, employeeName, branchId, decoded);
      return NextResponse.json(result.data, { status: result.status });
    } catch (error: any) {
      console.error('AttendanceController getAttendance Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch attendance records', details: error.message },
        { status: 500 }
      );
    }
  }

  static async logAttendance(req: Request) {
    try {
      const decoded = verifyAuthToken(req);
      if (!decoded) {
        return createErrorResponse('Unauthorized', 401);
      }

      await connectToDatabase();
      const body = await req.json() as any;
      const result = await AttendanceService.logAttendance(body, decoded.companyId);
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: result.status });
      }

      // Trigger real-time system notification
      if (result.status === 200 || result.status === 201) {
        try {
          const { SystemNotificationService } = await import('../../../services/systemNotificationService');
          const { User } = await import('../../../models/User');
          const employeeName = body.name || body.employee;
          const dateVal = body.date || 'specified day';

          if (decoded.role === 'Employee') {
            // Employee checking in/out. Notify Admin & HR.
            await SystemNotificationService.notifyRoles(decoded.companyId, ['Admin', 'HR'], {
              companyId: decoded.companyId,
              title: 'Attendance Logged',
              content: `${decoded.fullName} logged attendance for ${dateVal} (Status: ${body.status || 'Present'})`,
              type: 'other',
              targetPage: 'attendance'
            });
          } else {
            // HR/Admin modifying employee's attendance. Notify employee.
            const empUser = await User.findOne({ fullName: employeeName, companyId: decoded.companyId });
            if (empUser && empUser.email) {
              await SystemNotificationService.createNotification({
                companyId: decoded.companyId,
                userId: empUser.email,
                title: 'Attendance Updated',
                content: `Your attendance record for ${dateVal} has been updated by ${decoded.fullName || 'HR Admin'}.`,
                type: 'other',
                targetPage: 'attendance'
              });
            }
          }
        } catch (notifErr) {
          console.error('Failed to trigger attendance notification:', notifErr);
        }
      }

      return NextResponse.json(result, { status: result.status });
    } catch (error: any) {
      console.error('AttendanceController logAttendance Error:', error);
      return NextResponse.json(
        { error: 'Failed to log attendance record', details: error.message },
        { status: 500 }
      );
    }
  }
}
