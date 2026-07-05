import { NextResponse } from 'next/server';
import { sendEmail } from '@/app/api/lib/email';

export async function GET() {
  try {
    const to = process.env.EMAIL_FROM || 'test@example.com';
    const result = await sendEmail({
      to,
      subject: 'HR System SMTP Test Email',
      text: 'If you are reading this, your SMTP connection is fully operational!',
      html: `
        <div style="font-family: sans-serif; padding: 20px; line-height: 1.5; color: #1e293b;">
          <h2 style="color: #059669;">✓ SMTP Connection Successful</h2>
          <p>Congratulations! Your enterprise email server settings are working perfectly.</p>
          <p>Sent to: <strong>${to}</strong></p>
          <br/>
          <p>Best regards,<br/><strong>HR System Diagnostic Utility</strong></p>
        </div>
      `
    });

    return NextResponse.json({
      success: result.sent,
      result,
      env: {
        SMTP_HOST: process.env.SMTP_HOST || 'Not Configured',
        SMTP_PORT: process.env.SMTP_PORT || 'Not Configured',
        SMTP_USER: process.env.SMTP_USER ? 'Configured' : 'Not Configured',
        SMTP_PASS: process.env.SMTP_PASS ? 'Configured' : 'Not Configured',
        EMAIL_FROM: process.env.EMAIL_FROM || 'Not Configured',
      }
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
}

