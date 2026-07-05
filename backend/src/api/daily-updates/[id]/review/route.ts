import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { DailyWorkUpdate } from '@/app/api/models/DailyWorkUpdate';
import { verifyAuth } from '@/app/api/lib/auth';
import { sendEmail } from '@/app/api/lib/email';

// POST: Review a daily status report (HR or Admin only)
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (decoded.role !== 'HR' && decoded.role !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden. HR and Admins only.' }, { status: 403 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Missing report ID parameter' }, { status: 400 });
    }

    await connectToDatabase();

    const report = await DailyWorkUpdate.findById(id);
    if (!report) {
      return NextResponse.json({ error: 'Daily status report not found' }, { status: 404 });
    }

    // Update status to Reviewed
    report.status = 'Reviewed';
    report.reviewedBy = decoded.fullName || decoded.email;
    report.reviewedAt = new Date();
    await report.save();

    // Send real-time system notification to employee
    try {
      const { SystemNotificationService } = await import('../../../../services/systemNotificationService');
      await SystemNotificationService.createNotification({
        companyId: report.companyId,
        userId: report.employeeEmail,
        title: 'Daily Update Reviewed',
        content: `Your Daily Work Update for ${new Date(report.date).toLocaleDateString()} has been reviewed by ${decoded.fullName || decoded.email}.`,
        type: 'daily-update',
        targetPage: 'daily-updates'
      });
    } catch (notifErr) {
      console.error('Failed to trigger daily-update review notification:', notifErr);
    }

    // Send email notification to employee
    try {
      const emailSubject = `⏰ Daily Status Report Reviewed - ${new Date(report.date).toLocaleDateString()}`;
      const emailText = `Hello,\n\nYour Daily Status Report (DSR) for ${new Date(report.date).toLocaleDateString()} has been marked as Reviewed by ${decoded.fullName || decoded.email}.\n\nBest regards,\nHR Core Systems`;
      
      const emailHtml = `
        <div style="font-family: sans-serif; padding: 20px; background-color: #080b12; color: #f8fafc; border-radius: 12px; max-width: 500px; margin: 0 auto; border: 1px solid #1f2937;">
          <h2 style="color: #10b981; border-bottom: 1px solid #1f2937; padding-bottom: 10px; margin-top: 0;">Daily Update Reviewed</h2>
          <p>Hello,</p>
          <p>Your Daily Status Report (DSR) for <strong>${new Date(report.date).toLocaleDateString()}</strong> has been reviewed.</p>
          <div style="background-color: #111827; padding: 15px; border-radius: 8px; border: 1px solid #1f2937; margin: 15px 0;">
            <p style="margin: 0; font-size: 14px;"><strong>Reviewer:</strong> ${decoded.fullName || decoded.email}</p>
            <p style="margin: 5px 0 0 0; font-size: 14px;"><strong>Status:</strong> Reviewed</p>
          </div>
          <p style="font-size: 12px; color: #94a3b8;">This is an automated notification from your HR Core Systems portal.</p>
        </div>
      `;

      await sendEmail({
        to: report.employeeEmail,
        subject: emailSubject,
        text: emailText,
        html: emailHtml
      });
    } catch (emailErr: any) {
      console.error('Failed to send review email notification:', emailErr.message);
    }

    return NextResponse.json({ message: 'Report reviewed successfully', report }, { status: 200 });
  } catch (error: any) {
    console.error('Failed to review daily update:', error);
    return NextResponse.json({ error: 'Failed to review daily update', details: error.message }, { status: 500 });
  }
}
