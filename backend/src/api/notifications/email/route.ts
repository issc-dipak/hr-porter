import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { UserSettings } from '@/app/api/models/UserSettings';
import { sendEmail } from '@/app/api/lib/email';

export async function POST(req: Request) {
  try {
    const { email, message, type: requestedType } = await req.json() as any;

    if (!email || !message) {
      return NextResponse.json({ error: 'Missing email or message parameter' }, { status: 400 });
    }

    await connectToDatabase();

    // Find User Settings to check notification preferences
    const settings = await UserSettings.findOne({ email: email.toLowerCase() });

    // Determine category based on message content or requestedType
    let category: 'task' | 'payroll' | 'attendance' | 'general' = 'general';
    const msgLower = message.toLowerCase();

    if (requestedType === 'task' || msgLower.includes('task') || msgLower.includes('project') || msgLower.includes('goal') || msgLower.includes('sprint') || msgLower.includes('stopwatch')) {
      category = 'task';
    } else if (requestedType === 'payroll' || msgLower.includes('payroll') || msgLower.includes('payslip') || msgLower.includes('salary') || msgLower.includes('slip')) {
      category = 'payroll';
    } else if (requestedType === 'attendance' || msgLower.includes('attendance') || msgLower.includes('clock') || msgLower.includes('shift') || msgLower.includes('break')) {
      category = 'attendance';
    }

    // Check user preferences
    if (settings && settings.notifications) {
      if (category === 'task' && settings.notifications.taskReminders === false) {
        console.log(`[Notification_Email_Skipped] Task email skipped for ${email} due to preferences.`);
        return NextResponse.json({ message: 'Email skipped based on user preferences' }, { status: 200 });
      }
      if (category === 'payroll' && settings.notifications.payrollAlerts === false) {
        console.log(`[Notification_Email_Skipped] Payroll email skipped for ${email} due to preferences.`);
        return NextResponse.json({ message: 'Email skipped based on user preferences' }, { status: 200 });
      }
      if (category === 'attendance' && settings.notifications.attendanceAlerts === false) {
        console.log(`[Notification_Email_Skipped] Attendance email skipped for ${email} due to preferences.`);
        return NextResponse.json({ message: 'Email skipped based on user preferences' }, { status: 200 });
      }
    }

    // Setup format properties
    let categoryLabel = 'General Update';
    let categoryClass = 'general';
    let subjectIcon = '🔔';

    if (category === 'task') {
      categoryLabel = 'Task Alert';
      categoryClass = 'task';
      subjectIcon = '📅';
    } else if (category === 'payroll') {
      categoryLabel = 'Payroll Alert';
      categoryClass = 'payroll';
      subjectIcon = '💰';
    } else if (category === 'attendance') {
      categoryLabel = 'Attendance Alert';
      categoryClass = 'attendance';
      subjectIcon = '⏰';
    }

    const subject = `${subjectIcon} HR Core Alert: ${categoryLabel}`;
    const timestamp = new Date().toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });

    const systemUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Premium HTML template
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #080b12;
      color: #f8fafc;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #080b12;
      padding: 30px 15px;
      box-sizing: border-box;
    }
    .container {
      max-width: 550px;
      margin: 0 auto;
      background-color: #0a0f1c;
      border: 1px solid #172033;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    }
    .header {
      background: linear-gradient(135deg, #3b82f6 0%, #4f46e5 100%);
      padding: 24px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 20px;
      font-weight: 800;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    .content {
      padding: 32px 24px;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 16px;
    }
    .badge-task {
      background-color: rgba(59, 130, 246, 0.1);
      color: #3b82f6;
      border: 1px solid rgba(59, 130, 246, 0.2);
    }
    .badge-payroll {
      background-color: rgba(16, 185, 129, 0.1);
      color: #10b981;
      border: 1px solid rgba(16, 185, 129, 0.2);
    }
    .badge-attendance {
      background-color: rgba(245, 158, 11, 0.1);
      color: #f59e0b;
      border: 1px solid rgba(245, 158, 11, 0.2);
    }
    .badge-general {
      background-color: rgba(99, 102, 241, 0.1);
      color: #6366f1;
      border: 1px solid rgba(99, 102, 241, 0.2);
    }
    .message-box {
      background-color: #111827;
      border: 1px solid #1f2937;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 24px;
    }
    .message-text {
      color: #f8fafc;
      font-size: 15px;
      line-height: 1.6;
      margin: 0;
      font-weight: 500;
    }
    .time-label {
      font-size: 11px;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .footer {
      background-color: #0d1321;
      padding: 20px;
      text-align: center;
      border-top: 1px solid #172033;
    }
    .footer p {
      font-size: 11px;
      color: #64748b;
      margin: 0 0 8px 0;
      line-height: 1.5;
    }
    .footer a {
      color: #3b82f6;
      text-decoration: none;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>HR Core System</h1>
      </div>
      <div class="content">
        <div class="badge badge-${categoryClass}">${categoryLabel}</div>
        <div class="message-box">
          <p class="message-text">${message}</p>
        </div>
        <div class="time-label">Logged At: ${timestamp}</div>
      </div>
      <div class="footer">
        <p>This is an automated notification. You received this because you opted in to receive email alerts.</p>
        <p>To change your preferences, go to <a href="${systemUrl}/settings">Settings Hub</a> in your HR Employee Panel.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    // Plain text version
    const text = `[HR CORE ALERT: ${categoryLabel}]\n\nMessage: ${message}\n\nTime: ${timestamp}\n\nTo change email preferences, configure your options in the Settings Hub.`;

    const result = await sendEmail({ to: email, subject, text, html });

    return NextResponse.json({ message: 'Notification email request processed', result }, { status: 200 });
  } catch (error: any) {
    console.error('[Notification_Email_Error]:', error);
    return NextResponse.json({ error: 'Failed to send notification email', details: error.message }, { status: 500 });
  }
}

