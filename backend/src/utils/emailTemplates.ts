/**
 * Reusable branded HTML email template builder.
 * All emails in the HR system should use this so they look consistent.
 */

export interface EmailTemplateOptions {
  title: string;
  preheader?: string;
  body: string;          // HTML body content (inside the card)
  ctaText?: string;
  ctaUrl?: string;
  footerNote?: string;
}

/**
 * Returns a clean branded HTML email string.
 * The email.ts utility will automatically prepend the company logo header.
 */
export function buildEmailTemplate({
  title,
  preheader,
  body,
  ctaText,
  ctaUrl,
  footerNote,
}: EmailTemplateOptions): string {
  const cta = ctaText && ctaUrl
    ? `<div style="text-align:center; margin: 28px 0 4px;">
        <a href="${ctaUrl}"
           style="display:inline-block; background:#2563eb; color:#ffffff; font-size:14px;
                  font-weight:700; text-decoration:none; padding:12px 28px;
                  border-radius:8px; letter-spacing:0.02em;">
          ${ctaText} →
        </a>
       </div>`
    : '';

  const footer = footerNote
    ? `<p style="margin:0; font-size:11px; color:#94a3b8; text-align:center; margin-top:20px; line-height:1.6;">
        ${footerNote}
       </p>`
    : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title}</title>
</head>
<body style="margin:0; padding:0; background-color:#f1f5f9; font-family: 'Inter', Arial, sans-serif; -webkit-font-smoothing:antialiased;">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#f1f5f9;">${preheader}</div>` : ''}

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:600px; background:#ffffff; border-radius:16px;
                                    box-shadow:0 4px 24px rgba(0,0,0,0.07); overflow:hidden;">
          <!-- Header Bar -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%); padding: 24px 36px;">
              <h1 style="margin:0; color:#ffffff; font-size:20px; font-weight:700; letter-spacing:-0.02em;">
                ${title}
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px 36px 24px;">
              ${body}
              ${cta}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc; border-top:1px solid #e2e8f0; padding:20px 36px;">
              <p style="margin:0; font-size:12px; color:#94a3b8; line-height:1.6; text-align:center;">
                This is an automated message from your HR system. Please do not reply to this email.
              </p>
              ${footer}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

/** Small helper: coloured status pill for use inside email body */
export function statusPill(text: string, color: 'green' | 'red' | 'amber' | 'blue'): string {
  const colors: Record<string, string> = {
    green: 'background:#dcfce7; color:#15803d;',
    red:   'background:#fee2e2; color:#b91c1c;',
    amber: 'background:#fef9c3; color:#a16207;',
    blue:  'background:#dbeafe; color:#1d4ed8;',
  };
  return `<span style="display:inline-block; padding:3px 12px; border-radius:100px; font-size:12px; font-weight:700; ${colors[color]}">${text}</span>`;
}

/** Info row for email body — label: value */
export function infoRow(label: string, value: string): string {
  return `
    <tr>
      <td style="padding:8px 0; border-bottom:1px solid #f1f5f9; font-size:13px; color:#64748b; font-weight:600; width:40%;">${label}</td>
      <td style="padding:8px 0; border-bottom:1px solid #f1f5f9; font-size:13px; color:#0f172a; font-weight:500;">${value}</td>
    </tr>`;
}

/** Wraps multiple infoRows in a table */
export function infoTable(rows: string): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0;">${rows}</table>`;
}
