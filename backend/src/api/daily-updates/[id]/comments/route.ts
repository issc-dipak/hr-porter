import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { DailyWorkUpdate } from '@/app/api/models/DailyWorkUpdate';
import { verifyAuth } from '@/app/api/lib/auth';
import { sendEmail } from '@/app/api/lib/email';

// POST: Add comment to daily status report
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Missing report ID parameter' }, { status: 400 });
    }

    const { content } = await req.json() as any;
    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Missing comment content' }, { status: 400 });
    }

    await connectToDatabase();

    const report = await DailyWorkUpdate.findById(id);
    if (!report) {
      return NextResponse.json({ error: 'Daily status report not found' }, { status: 404 });
    }

    const isHrOrAdmin = decoded.role === 'HR' || decoded.role === 'Admin';

    // Verification check
    if (!isHrOrAdmin && report.employeeEmail.toLowerCase() !== decoded.email.toLowerCase()) {
      return NextResponse.json({ error: 'Forbidden. You cannot comment on other employees reports.' }, { status: 403 });
    }

    const newComment = {
      authorEmail: decoded.email.toLowerCase(),
      authorName: decoded.fullName || decoded.email.split('@')[0],
      authorRole: decoded.role,
      content: content.trim(),
      createdAt: new Date()
    };

    report.comments.push(newComment);
    await report.save();

    // Trigger Real-time System Notification
    try {
      const { SystemNotificationService } = await import('../../../../services/systemNotificationService');
      if (isHrOrAdmin) {
        // HR/Admin commented. Notify the employee.
        await SystemNotificationService.createNotification({
          companyId: report.companyId,
          userId: report.employeeEmail,
          title: 'New Comment on DSR',
          content: `${newComment.authorName} (${newComment.authorRole}) commented: "${newComment.content.substring(0, 40)}..."`,
          type: 'daily-update',
          targetPage: 'daily-updates'
        });
      } else {
        // Employee commented. Notify Admin & HR.
        await SystemNotificationService.notifyRoles(report.companyId, ['Admin', 'HR'], {
          companyId: report.companyId,
          title: 'New Comment on DSR',
          content: `${newComment.authorName} commented on DSR: "${newComment.content.substring(0, 40)}..."`,
          type: 'daily-update',
          targetPage: 'daily-updates'
        });
      }
    } catch (notifErr) {
      console.error('Failed to trigger daily-update comment notification:', notifErr);
    }

    // Trigger Email Notification
    try {
      let recipientEmail = '';
      let commentTargetName = '';

      if (isHrOrAdmin) {
        // Notify the employee
        recipientEmail = report.employeeEmail;
        commentTargetName = report.employeeName;
      } else {
        // Employee commented. If it has been reviewed, notify the reviewer. Otherwise, notify standard HR support.
        recipientEmail = 'hr@hrcore.com'; // Default HR email
        commentTargetName = 'HR Manager';
      }

      if (recipientEmail) {
        const emailSubject = `💬 New Comment Added to DSR Update - ${new Date(report.date).toLocaleDateString()}`;
        const emailText = `Hello,\n\nA new comment was added to the DSR report for ${new Date(report.date).toLocaleDateString()} by ${newComment.authorName} (${newComment.authorRole}):\n\n"${newComment.content}"\n\nBest regards,\nHR Core Systems`;
        
        const emailHtml = `
          <div style="font-family: sans-serif; padding: 20px; background-color: #080b12; color: #f8fafc; border-radius: 12px; max-width: 500px; margin: 0 auto; border: 1px solid #1f2937;">
            <h2 style="color: #3b82f6; border-bottom: 1px solid #1f2937; padding-bottom: 10px; margin-top: 0;">New Comment Posted</h2>
            <p>Hello,</p>
            <p>A new comment was added to the Daily Status Report (DSR) for <strong>${new Date(report.date).toLocaleDateString()}</strong>.</p>
            <div style="background-color: #111827; padding: 15px; border-radius: 8px; border: 1px solid #1f2937; margin: 15px 0;">
              <p style="margin: 0; font-size: 14px; color: #94a3b8;"><strong>From:</strong> ${newComment.authorName} (${newComment.authorRole})</p>
              <p style="margin: 10px 0 0 0; font-size: 14px; font-style: italic; color: #f8fafc;">"${newComment.content}"</p>
            </div>
            <p style="font-size: 12px; color: #94a3b8;">This is an automated notification from your HR Core Systems portal.</p>
          </div>
        `;

        await sendEmail({
          to: recipientEmail,
          subject: emailSubject,
          text: emailText,
          html: emailHtml
        });
      }
    } catch (emailErr: any) {
      console.error('Failed to send comment email notification:', emailErr.message);
    }

    return NextResponse.json({ message: 'Comment added successfully', report }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to add comment to update:', error);
    return NextResponse.json({ error: 'Failed to add comment', details: error.message }, { status: 500 });
  }
}
