import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Ticket } from '@/app/api/models/Ticket';
import { verifyAuth } from '@/app/api/lib/auth';
import { AuditLog } from '@/app/api/models/AuditLog';
import { sendEmail } from '../../utils/email';
import { buildEmailTemplate, infoTable, infoRow } from '../../utils/emailTemplates';

// AI Helper for Ticket Auto-Classification
function aiClassify(subject: string, description: string) {
  const content = (subject + ' ' + description).toLowerCase();
  
  // 1. Classification
  let category = 'General Inquiry';
  if (content.includes('payroll') || content.includes('salary') || content.includes('paycheck') || content.includes('slip') || content.includes('pf ') || content.includes('esi ') || content.includes('deduction')) {
    category = 'Payroll Issue';
  } else if (content.includes('leave') || content.includes('vacation') || content.includes('sick') || content.includes('holiday') || content.includes('casual')) {
    category = 'Leave Issue';
  } else if (content.includes('attendance') || content.includes('biometric') || content.includes('checkin') || content.includes('checkout') || content.includes('clock') || content.includes('punch')) {
    category = 'Attendance Issue';
  } else if (content.includes('laptop') || content.includes('computer') || content.includes('keyboard') || content.includes('mouse') || content.includes('monitor') || content.includes('asset') || content.includes('hardware')) {
    category = 'Asset Issue';
  } else if (content.includes('password') || content.includes('login') || content.includes('account') || content.includes('access') || content.includes('reset') || content.includes('portal')) {
    category = 'Account Access';
  } else if (content.includes('it ') || content.includes('vpn') || content.includes('wifi') || content.includes('internet') || content.includes('software') || content.includes('printer')) {
    category = 'IT Support';
  } else if (content.includes('document') || content.includes('certificate') || content.includes('letter') || content.includes('noc')) {
    category = 'Document Request';
  } else if (content.includes('hr ') || content.includes('policy') || content.includes('harassment') || content.includes('complaint')) {
    category = 'HR Support';
  }

  // 2. Priority recommendation
  let priority = 'Medium';
  if (content.includes('urgent') || content.includes('critical') || content.includes('blocker') || content.includes('immediate') || content.includes('broken') || content.includes('cannot work') || content.includes('fail')) {
    priority = 'Urgent';
  } else if (content.includes('high') || content.includes('important') || content.includes('error') || content.includes('missing') || content.includes('wrong')) {
    priority = 'High';
  } else if (content.includes('low') || content.includes('minor') || content.includes('query') || content.includes('ask') || content.includes('how to')) {
    priority = 'Low';
  }

  // 3. Suggested Response
  let aiSuggestedResponse = `Hello, thank you for raising this issue. We have received your request regarding "${subject}". An HR or Support representative has been notified and is looking into this.`;
  if (category === 'Payroll Issue') {
    aiSuggestedResponse = `Hello, thank you for reaching out. For payroll and salary-slip queries, our finance team typically processes reconciliation requests within 2-3 business days. We will verify your payroll log and update you here shortly.`;
  } else if (category === 'Leave Issue') {
    aiSuggestedResponse = `Hello, thank you for writing in. We have logged your query regarding leave balance/application. HR will cross-check the leave register and update your balance adjustment soon.`;
  } else if (category === 'Attendance Issue') {
    aiSuggestedResponse = `Hello! For attendance rectification or biometric miss-punches, please provide the specific date and timings. We will review your entry with the access control log.`;
  } else if (category === 'IT Support' || category === 'Account Access') {
    aiSuggestedResponse = `Hello, thank you for contacting support. Our IT Admin team handles login, account access, and hardware issues. An IT ticket has been queued, and we will update you as soon as possible.`;
  }

  // 4. Summary
  const aiSummary = `Employee is reporting an issue regarding ${category.toLowerCase()}: "${subject.substring(0, 60)}".`;

  return { category, priority, aiSuggestedResponse, aiSummary };
}

import { checkUserPermission } from '@/app/api/lib/rbac';

// GET all tickets (HR/Admin see all, Employees see their own)
export async function GET(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { companyId, role, email, userId } = decoded;
    await connectToDatabase();

    let query: any = { companyId };
    
    // Check if user has permission to view all tickets
    const canViewAll = await checkUserPermission(companyId, userId, role, 'helpdesk.view');
    if (!canViewAll) {
      query.$or = [{ employeeEmail: email }, { employeeId: userId }];
    }

    const tickets = await Ticket.find(query).sort({ createdAt: -1 });
    return NextResponse.json(tickets, { status: 200 });
  } catch (error: any) {
    console.error('Failed to fetch tickets:', error);
    return NextResponse.json({ error: 'Failed to fetch tickets', details: error.message }, { status: 500 });
  }
}

// POST a new ticket
export async function POST(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { companyId, email, userId, fullName } = decoded;
    const body = await req.json() as any;

    const { subject, category: userCategory, priority: userPriority, description, attachments, department } = body;

    if (!subject || !description || !department) {
      return NextResponse.json({ error: 'Missing required fields (subject, description, department)' }, { status: 400 });
    }

    await connectToDatabase();

    // Auto-generate ticket number TKT-YYYY-XXXX
    const currentYear = new Date().getFullYear();
    const count = await Ticket.countDocuments({ companyId, ticketNumber: new RegExp(`^TKT-${currentYear}-`) });
    const ticketNumber = `TKT-${currentYear}-${String(count + 1).padStart(4, '0')}`;

    // Local AI Analysis (Auto-classification, recommended priority, suggested response, summary)
    const aiAnalysis = aiClassify(subject, description);

    const ticketData = {
      companyId,
      employeeId: userId,
      employeeName: fullName || email.split('@')[0],
      employeeEmail: email,
      ticketNumber,
      subject,
      category: userCategory || aiAnalysis.category,
      priority: userPriority || aiAnalysis.priority,
      description,
      status: 'Open',
      attachments: attachments || [],
      department,
      aiSummary: aiAnalysis.aiSummary,
      aiSuggestedResponse: aiAnalysis.aiSuggestedResponse,
      aiPriorityRecommended: aiAnalysis.priority,
    };

    const newTicket = await Ticket.create(ticketData);

    // Notify Admin and HR about the new support ticket
    try {
      const { SystemNotificationService } = await import('../../services/systemNotificationService');
      await SystemNotificationService.notifyRoles(companyId, ['Admin', 'HR'], {
        companyId,
        title: 'New Support Ticket',
        content: `Ticket ${ticketNumber} raised by ${ticketData.employeeName}: "${subject}"`,
        type: 'ticket',
        targetPage: 'helpdesk'
      });
    } catch (err) {
      console.error('Failed to trigger ticket submission notification:', err);
    }

    // P2 Email: Confirm ticket receipt to employee
    try {
      const emailBody = `
        <p style="margin:0 0 16px; font-size:15px; color:#0f172a;">
          We’ve received your support ticket and our HR team will get back to you shortly.
        </p>
        ${infoTable(
          infoRow('Ticket Number', `<strong>${ticketNumber}</strong>`) +
          infoRow('Subject', subject) +
          infoRow('Category', ticketData.category) +
          infoRow('Priority', ticketData.priority) +
          infoRow('Status', 'Open')
        )}
        <div style="margin:20px 0; padding:16px; background:#f8fafc; border-left:4px solid #2563eb; border-radius:4px;">
          <p style="margin:0 0 6px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:#2563eb;">✨ AI Suggested Response</p>
          <p style="margin:0; font-size:13px; color:#334155; line-height:1.6;">${aiAnalysis.aiSuggestedResponse}</p>
        </div>
      `;

      const emailHtml = buildEmailTemplate({
        title: `🎫 Ticket ${ticketNumber} Received`,
        preheader: `Your support ticket "${subject}" has been received`,
        body: emailBody,
        ctaText: 'View My Ticket',
        ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`,
        footerNote: 'Our team typically responds within 1–2 business days. You will be notified by email when there is an update.'
      });

      await sendEmail({
        to: email,
        subject: `Ticket ${ticketNumber} received — we’re on it`,
        text: `Your support ticket "${subject}" (${ticketNumber}) has been received and is being reviewed by our HR team.`,
        html: emailHtml
      });
    } catch (emailErr) {
      console.error('Failed to send ticket confirmation email to employee:', emailErr);
    }

    // Create Audit Log
    await AuditLog.create({
      companyId,
      action: 'Ticket Created',
      performedBy: email,
      details: `Ticket ${ticketNumber} raised by ${email} (Subject: "${subject}")`,
      ipAddress: '127.0.0.1'
    });

    return NextResponse.json(newTicket, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create ticket:', error);
    return NextResponse.json({ error: 'Failed to create ticket', details: error.message }, { status: 500 });
  }
}
