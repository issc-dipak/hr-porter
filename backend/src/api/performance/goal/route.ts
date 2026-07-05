import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { sendEmail } from '@/app/api/lib/email';
import { Task } from '@/app/api/models/Task';
import { verifyAuth } from '@/app/api/lib/auth';

export async function POST(req: Request) {
  try {
    const data = await req.json() as any;
    const { title, assignee, assigneeEmail, dept, deadline } = data;

    if (!title || !assignee || !assigneeEmail || !dept || !deadline) {
      return NextResponse.json(
        { error: 'Missing required fields (title, assignee, assigneeEmail, dept, deadline)' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = decoded.companyId;

    // Create the goal as a Task document in MongoDB
    const newTask = await Task.create({
      companyId,
      title,
      assignedTo: assignee,
      assignedToEmail: assigneeEmail,
      dept,
      due: deadline,
      status: 'To Do',
      completionPercent: 0,
      priority: 'Medium'
    });

    // Create goal details
    const avatar = assignee.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);
    const formattedDue = new Date(deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    // Send email notification to employee via Brevo SMTP relay
    const subject = `🚀 New Performance Goal Assigned: ${title}`;
    const text = `Hello ${assignee},\n\nA new performance goal has been assigned to you:\nGoal: ${title}\nDepartment: ${dept}\nDeadline: ${deadline}\n\nPlease check your employee performance dashboard to update its progress.\n\nBest regards,\nHR Management System`;
    const html = `
      <div style="font-family: sans-serif; padding: 24px; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="font-size: 28px;">🎯</span>
          <h2 style="color: #1e3a8a; font-weight: 800; margin-top: 8px; font-family: system-ui, -apple-system, sans-serif;">New Goal Assigned</h2>
        </div>
        
        <p style="font-size: 14px; color: #475569; line-height: 1.6;">
          Hello <strong>${assignee}</strong>,
        </p>
        <p style="font-size: 14px; color: #475569; line-height: 1.6;">
          A new performance goal has been assigned to you by the HR Admin. Details of the assignment can be found below:
        </p>

        <div style="background-color: #f8fafc; border-radius: 12px; padding: 16px; margin: 20px 0; border: 1px solid #f1f5f9;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-size: 12px; font-weight: bold; color: #64748b; text-transform: uppercase;">Goal Description</td>
              <td style="padding: 8px 0; font-size: 14px; font-weight: bold; color: #0f172a; text-align: right;">${title}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-size: 12px; font-weight: bold; color: #64748b; text-transform: uppercase;">Department</td>
              <td style="padding: 8px 0; font-size: 14px; font-weight: bold; color: #0f172a; text-align: right;">${dept}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-size: 12px; font-weight: bold; color: #64748b; text-transform: uppercase;">Target Deadline</td>
              <td style="padding: 8px 0; font-size: 14px; font-weight: bold; color: #2563eb; text-align: right;">${formattedDue}</td>
            </tr>
          </table>
        </div>

        <p style="font-size: 14px; color: #475569; line-height: 1.6;">
          Please sign in to the Employee Dashboard, navigate to <strong>Tasks & Projects</strong> or <strong>Performance</strong>, and update the completion progress regularly.
        </p>

        <div style="border-t: 1px solid #e2e8f0; margin-top: 24px; padding-top: 16px; text-align: center;">
          <p style="font-size: 11px; color: #94a3b8; margin: 0;">This is an automated system notification from your HR Management System.</p>
        </div>
      </div>
    `;

    sendEmail({ to: assigneeEmail, subject, text, html }).catch(emailErr => {
      console.error('Failed to send goal assignment email:', emailErr);
    });

    return NextResponse.json({
      message: 'Goal assigned and email sent successfully',
      task: newTask
    }, { status: 201 });

  } catch (error: any) {
    console.error('Failed to assign performance goal:', error);
    return NextResponse.json(
      { error: 'Failed to assign performance goal', details: error.message },
      { status: 500 }
    );
  }
}

