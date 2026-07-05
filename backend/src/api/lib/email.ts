import nodemailer from 'nodemailer';

interface SendMailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export async function sendEmail({ to, subject, text, html }: SendMailOptions) {
  const brevoApiKey = process.env.BREVO_API_KEY || (process.env.SMTP_PASS?.startsWith('xkeysib-') ? process.env.SMTP_PASS : '');
  const fromEmail = process.env.EMAIL_FROM || 'no-reply@yourdomain.com';

  // Dynamically inject white-label email branding headers
  try {
    const { User } = await import('../../models/User');
    const { CompanyBranding } = await import('../../models/CompanyBranding');
    const user = await User.findOne({ email: to.toLowerCase().trim() });
    if (user && user.companyId) {
      const branding = await CompanyBranding.findOne({ companyId: user.companyId });
      if (branding && branding.companyLogo && branding.emailHeaderLogoVisible !== false) {
        const primaryColor = branding.primaryColor || '#2563eb';
        const brandedHeader = `
          <div style="text-align: center; padding: 20px; border-bottom: 1px solid #eaeaea; margin-bottom: 20px; font-family: sans-serif;">
            <img src="${branding.companyLogo}" alt="${branding.companyName}" style="max-height: 50px; object-fit: contain; display: inline-block;" />
            <h2 style="margin: 10px 0 0 0; color: ${primaryColor}; font-size: 18px; font-weight: bold;">${branding.companyName}</h2>
          </div>
        `;
        html = `${brandedHeader}${html}`;
      }
    }
  } catch (err) {
    console.error('Failed to inject email branding header:', err);
  }

  if (brevoApiKey) {
    console.log(`[Brevo_API] Requesting email delivery via Brevo REST API to ${to}...`);
    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': brevoApiKey,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: 'HR System', email: fromEmail },
          to: [{ email: to }],
          subject,
          htmlContent: html,
          textContent: text
        })
      });

      if (response.ok) {
        const result = await response.json() as any;
        console.log(`[Brevo_API_SUCCESS] Email sent successfully via REST API to ${to}. Message ID: ${result.messageId}`);
        return { sent: true, method: 'brevo_api' };
      } else {
        const errText = await response.text();
        throw new Error(`Brevo API returned status ${response.status}: ${errText}`);
      }
    } catch (error: any) {
      console.error(`[Brevo_API_EXCEPTION] Failed to send email via API to ${to}:`, error);
      // Fallback to standard SMTP logic below
    }
  }

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  
  if (!smtpHost || !smtpUser || !smtpPass) {
    console.warn(`
┌────────────────────────────────────────────────────────┐
│ ⚠️  SMTP CREDENTIALS ARE NOT CONFIGURED IN .env.local    │
├────────────────────────────────────────────────────────┤
│ To enable real emails, add these variables:            │
│                                                        │
│ SMTP_HOST=smtp-relay.brevo.com                         │
│ SMTP_PORT=587                                          │
│ SMTP_USER=your-email@example.com                       │
│ SMTP_PASS=your-smtp-password                           │
│ EMAIL_FROM=your-verified-sender@domain.com             │
├────────────────────────────────────────────────────────┤
│ 📨 DEVELOPMENT MODE LOGS:                              │
│ Recipient: ${to}                                      │
│ Subject:   ${subject}                                  │
│ Message:   ${text}                                     │
└────────────────────────────────────────────────────────┘
    `);
    return { sent: false, method: 'console' };
  }

  console.log(`[SMTP] Requesting delivery via ${smtpHost}...`);

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(smtpPort) || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const info = await transporter.sendMail({
      from: `"HR System" <${fromEmail}>`,
      to,
      subject,
      text,
      html,
    });

    console.log(`[SMTP_SUCCESS] Email sent successfully to ${to}. Message ID: ${info.messageId}`);
    return { sent: true, method: 'smtp' };
  } catch (error: any) {
    console.error(`[SMTP_EXCEPTION] Failed to send email to ${to}:`, error);
    
    // Log OTP in console as fallback
    console.warn(`
┌────────────────────────────────────────────────────────┐
│ ⚠️  SMTP EMAIL SENDING FAILED                          │
├────────────────────────────────────────────────────────┤
│ Error: ${error.message}                                │
│                                                        │
│ 📨 DEVELOPMENT FALLBACK OTP LOGS:                      │
│ Recipient: ${to}                                      │
│ Subject:   ${subject}                                  │
│ OTP Code:  ${text.match(/\\d{6}/)?.[0] || '123456'}   │
└────────────────────────────────────────────────────────┘
    `);

    return { sent: false, method: 'failed_smtp_exception', error: error.message };
  }
}
