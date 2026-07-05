import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Announcement } from '@/app/api/models/Announcement';
import { verifyAuth } from '@/app/api/lib/auth';
import { checkUserPermission } from '@/app/api/lib/rbac';

export async function GET(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = decoded.companyId;
    const email = decoded.email.toLowerCase().trim();
    const isPrivileged = decoded.role === 'Admin' || decoded.role === 'Company Admin' || decoded.role === 'HR';
    const userBranchId = decoded.branchId || '';

    await connectToDatabase();

    let announcements;
    if ((decoded.role === 'Branch Admin' || (decoded.role === 'HR' && userBranchId)) && userBranchId) {
      announcements = await Announcement.find({
        companyId,
        $or: [
          { targetBranchId: userBranchId },
          { targetBranchId: '' },
          { targetBranchId: { $exists: false } }
        ]
      }).sort({ createdAt: -1 });
    } else if (isPrivileged) {
      const { searchParams } = new URL(req.url);
      const branchId = searchParams.get('branchId');
      const filter: any = { companyId };
      if (branchId) {
        filter.targetBranchId = branchId;
      }
      announcements = await Announcement.find(filter).sort({ createdAt: -1 });
    } else {
      const branchFilter: any[] = [
        { targetBranchId: '' },
        { targetBranchId: { $exists: false } }
      ];
      if (userBranchId) {
        branchFilter.push({ targetBranchId: userBranchId });
      }

      announcements = await Announcement.find({
        companyId,
        $and: [
          {
            $or: [
              { audienceType: { $exists: false } },
              { audienceType: 'All' },
              { audienceType: 'Specific', targetEmployees: email }
            ]
          },
          {
            $or: branchFilter
          }
        ]
      }).sort({ createdAt: -1 });
    }

    return NextResponse.json(announcements, { status: 200 });
  } catch (error: any) {
    console.error('Failed to fetch announcements:', error);
    return NextResponse.json({ error: 'Failed to fetch announcements', details: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── RBAC: Verify announcement.create permission ─────────────────────────
    if (decoded.role !== 'Admin' && decoded.role !== 'Super Admin') {
      const hasCreate = await checkUserPermission(
        decoded.companyId,
        decoded.userId,
        decoded.role,
        'announcement.create'
      );
      if (!hasCreate) {
        return NextResponse.json(
          { error: 'Forbidden: You do not have permission to create announcements' },
          { status: 403 }
        );
      }
    }

    const companyId = decoded.companyId;
    const companyName = decoded.companyName;
    const data = await req.json() as any;
    
    if (!data.title || !data.content || !data.postedBy) {
      return NextResponse.json({ error: 'Missing required fields (title, content, postedBy)' }, { status: 400 });
    }
    
    await connectToDatabase();

    
    const targetBranchId = ((decoded.role === 'Branch Admin' || decoded.role === 'HR') && decoded.branchId)
      ? decoded.branchId
      : (data.targetBranchId || '');

    const newAnnouncement = await Announcement.create({
      ...data,
      companyId,
      companyName,
      targetBranchId
    });
    
    // Notify all users about the new announcement
    try {
      const { SystemNotificationService } = await import('../../services/systemNotificationService');
      await SystemNotificationService.notifyAllUsers(companyId, {
        companyId,
        title: 'New Announcement',
        content: `Announcement: ${data.title}`,
        type: 'announcement',
        targetPage: 'announcements',
        targetBranchId: data.targetBranchId || ''
      } as any);
    } catch (err) {
      console.error('Failed to trigger announcement notification:', err);
    }

    // Send email notifications to targeted employees
    try {
      const { sendEmail } = await import('../../utils/email');
      
      let recipientEmails: string[] = [];
      if (data.audienceType === 'Specific' && Array.isArray(data.targetEmployees)) {
        recipientEmails = data.targetEmployees.filter(Boolean);
      } else {
        const { Employee } = await import('../../models/Employee');
        const filter: any = { companyId, status: 'Active' };
        if (data.targetBranchId) {
          filter.branchId = data.targetBranchId;
        }
        const employees = await Employee.find(filter);
        recipientEmails = employees.map(emp => emp.email).filter(Boolean);
      }
      
      if (recipientEmails.length > 0) {
        console.log(`[Email Notification] Sending event/announcement email to ${recipientEmails.length} recipients.`);
        
        const subject = data.category === 'Event' 
          ? `📅 Event Invite: ${data.title}` 
          : `📢 New Announcement: ${data.title}`;
          
        const eventDateStr = data.eventDate 
          ? new Date(data.eventDate).toLocaleDateString(undefined, { dateStyle: 'long' }) 
          : 'N/A';

        const emailText = `Hello Team,\n\nA new ${data.category.toLowerCase()} has been published by ${data.postedBy}.\n\nTitle: ${data.title}\nContent: ${data.content}\n${
          data.category === 'Event' 
            ? `\nEvent Details:\nType: ${data.eventType || 'Event'}\nDate: ${eventDateStr}\nTime: ${data.eventTime || 'N/A'}\nLocation: ${data.eventLocation || 'N/A'}` 
            : ''
        }\n\nPlease check your dashboard for details.`;

        const emailHtml = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 8px;">
            <h2 style="color: #2563eb; font-size: 20px; font-weight: bold; border-bottom: 2px solid #2563eb; padding-bottom: 8px; margin-bottom: 16px;">
              ${data.category === 'Event' ? '📅 Corporate Event' : '📢 Corporate Broadcast'}
            </h2>
            
            <p style="font-size: 15px; font-weight: bold; margin-bottom: 8px;">Hello Team,</p>
            
            <p style="font-size: 14px; margin-bottom: 20px;">
              A new ${data.category.toLowerCase()} has been published by <strong>${data.postedBy}</strong>.
            </p>
            
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin-bottom: 20px;">
              <h3 style="margin-top: 0; color: #0f172a; font-size: 16px; font-weight: bold;">${data.title}</h3>
              <p style="font-size: 14px; color: #475569; white-space: pre-wrap; margin-bottom: 0;">${data.content}</p>
            </div>
            
            ${data.category === 'Event' ? `
            <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 16px; margin-bottom: 20px;">
              <h4 style="margin-top: 0; color: #1e3a8a; font-size: 14px; font-weight: bold; border-bottom: 1px solid #bfdbfe; padding-bottom: 6px; margin-bottom: 12px;">Event Details</h4>
              <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
                <tr>
                  <td style="padding: 4px 0; font-weight: bold; color: #1e40af; width: 120px;">Event Type:</td>
                  <td style="padding: 4px 0; color: #334155;">${data.eventType || 'Event'}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-weight: bold; color: #1e40af;">Date:</td>
                  <td style="padding: 4px 0; color: #334155;">${eventDateStr}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-weight: bold; color: #1e40af;">Time:</td>
                  <td style="padding: 4px 0; color: #334155;">${data.eventTime || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-weight: bold; color: #1e40af;">Location:</td>
                  <td style="padding: 4px 0; color: #334155;">${data.eventLocation || 'N/A'}</td>
                </tr>
                ${data.rsvpRequired ? `
                <tr>
                  <td style="padding: 4px 0; font-weight: bold; color: #1e40af;">RSVP Required:</td>
                  <td style="padding: 4px 0; color: #334155;">Yes (Please RSVP on your Employee Dashboard)</td>
                </tr>
                ` : ''}
              </table>
            </div>
            ` : ''}
            
            <p style="font-size: 12px; color: #64748b; margin-top: 20px; border-top: 1px solid #f0f0f0; padding-top: 8px;">
              This is an automated notification from the HR Management System. Please do not reply directly to this email.
            </p>
          </div>
        `;

        // Send to each recipient email asynchronously (don't block the API thread)
        Promise.all(
          recipientEmails.map(async (email) => {
            try {
              await sendEmail({
                to: email,
                subject,
                text: emailText,
                html: emailHtml
              });
            } catch (mailErr) {
              console.error(`Failed to send event email to ${email}:`, mailErr);
            }
          })
        ).catch(err => console.error('[Email Dispatch Group Error]', err));
      }
    } catch (emailErr) {
      console.error('Failed to trigger event email notification system:', emailErr);
    }

    return NextResponse.json(newAnnouncement, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create announcement:', error);
    return NextResponse.json({ error: 'Failed to create announcement', details: error.message }, { status: 500 });
  }
}

