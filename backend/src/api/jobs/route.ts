import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Job } from '@/app/api/models/Job';
import { Employee } from '@/app/api/models/Employee';
import { sendEmail } from '@/app/api/lib/email';
import { verifyAuth } from '@/app/api/lib/auth';

function getJobOpeningEmailTemplate(job: any) {
  const requirementsString = Array.isArray(job.requirements) ? job.requirements.join(', ') : 'N/A';
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Job Opportunity: ${job.title}</title>
  <style>
    body {
      font-family: 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #f8fafc;
      color: #1e293b;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      max-width: 600px;
      margin: 40px auto;
      background: #ffffff;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0,0,0,0.04);
      border: 1px solid #f1f5f9;
    }
    .header {
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      padding: 30px;
      text-align: center;
      color: #ffffff;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.02em;
    }
    .header p {
      margin: 5px 0 0 0;
      font-size: 13px;
      opacity: 0.9;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    .content {
      padding: 30px;
    }
    .greeting {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 20px;
    }
    .card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 24px;
    }
    .job-title {
      font-size: 18px;
      font-weight: 800;
      color: #1e3a8a;
      margin: 0 0 16px 0;
    }
    .label {
      font-size: 10px;
      font-weight: 800;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 4px;
      display: block;
    }
    .val {
      font-weight: 700;
      color: #334155;
      font-size: 13px;
    }
    .description {
      font-size: 14px;
      line-height: 1.6;
      color: #475569;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
    }
    .btn-container {
      text-align: center;
      margin-top: 30px;
    }
    .btn {
      display: inline-block;
      padding: 12px 32px;
      background-color: #2563eb;
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 800;
      font-size: 13px;
      border-radius: 10px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3);
    }
    .footer {
      background: #f8fafc;
      padding: 20px;
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
      border-top: 1px solid #f1f5f9;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <p>HR Core Portal</p>
      <h1>New Career Opportunity</h1>
    </div>
    <div class="content">
      <div class="greeting">Hello,</div>
      <p>We are excited to announce a new job opening at our company. If you know someone who would be a perfect fit, or if you are interested yourself, please check out the details below:</p>
      
      <div class="card">
        <h2 class="job-title">${job.title}</h2>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="width: 50%; padding-bottom: 12px; vertical-align: top;">
              <span class="label">Department</span>
              <span class="val">${job.dept}</span>
            </td>
            <td style="width: 50%; padding-bottom: 12px; vertical-align: top;">
              <span class="label">Job Type</span>
              <span class="val">${job.type || 'Full-time'}</span>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom: 12px; vertical-align: top;">
              <span class="label">Location</span>
              <span class="val">${job.location}</span>
            </td>
            <td style="padding-bottom: 12px; vertical-align: top;">
              <span class="label">Salary Range</span>
              <span class="val">${job.salary || 'Best in Industry'}</span>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom: 12px; vertical-align: top;">
              <span class="label">Experience Level</span>
              <span class="val">${job.experienceLevel || 'Mid'}</span>
            </td>
            <td style="padding-bottom: 12px; vertical-align: top;">
              <span class="label">Required Skills</span>
              <span class="val">${requirementsString}</span>
            </td>
          </tr>
        </table>
        
        <div class="description">
          <span class="label">Job Description</span>
          <p style="margin: 0; white-space: pre-line;">${job.description || 'No description provided.'}</p>
        </div>
      </div>
      
      <div class="btn-container">
        <a href="http://localhost:3000/recruitment" class="btn" style="color: #ffffff;">View Details & Refer Candidates</a>
      </div>
    </div>
    <div class="footer">
      This is an automated notification from your HR Core system.<br>
      © 2026 HR Core Inc. All rights reserved.
    </div>
  </div>
</body>
</html>
  `;
}

// GET all jobs
export async function GET(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();

    const filter: any = { companyId: decoded.companyId };
    if ((decoded.role === 'Branch Admin' || decoded.role === 'HR') && decoded.branchId) {
      filter.branchId = decoded.branchId;
    } else {
      const { searchParams } = new URL(req.url);
      const branchId = searchParams.get('branchId');
      if (branchId) {
        filter.branchId = branchId;
      }
    }

    const jobs = await Job.find(filter).sort({ createdAt: -1 });
    return NextResponse.json(jobs, { status: 200 });
  } catch (error: any) {
    console.error('Failed to fetch jobs:', error);
    return NextResponse.json({ error: 'Failed to fetch jobs', details: error.message }, { status: 500 });
  }
}

// POST a new job
export async function POST(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const data = await req.json() as any;

    if (!data.title || !data.dept || !data.location) {
      return NextResponse.json(
        { error: 'Missing required fields (title, dept, location)' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    if (!data.postedDate) {
      const today = new Date();
      data.postedDate = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    const newJob = await Job.create({
      ...data,
      companyId: decoded.companyId,
      branchId: ((decoded.role === 'Branch Admin' || decoded.role === 'HR') && decoded.branchId) ? decoded.branchId : (data.branchId || '')
    });

    // Send emails asynchronously in the background so it doesn't block the API response
    (async () => {
      try {
        await connectToDatabase();

        // Trigger system notifications for all active users
        try {
          const { SystemNotificationService } = await import('../../services/systemNotificationService');
          await SystemNotificationService.notifyAllUsers(decoded.companyId, {
            companyId: decoded.companyId,
            title: 'New Job Opening Published',
            content: `A new position for "${newJob.title}" has been published in the ${newJob.dept} department. Check it out and refer candidates!`,
            type: 'announcement',
            targetPage: 'recruitment',
            targetBranchId: newJob.branchId || ''
          } as any);
        } catch (notifErr) {
          console.error('[Job Notification Error] Failed to trigger system notifications:', notifErr);
        }

        // Fetch all active employees in this company (optionally matching the job branch)
        const employeeQuery: any = { companyId: decoded.companyId, status: 'Active' };
        if (newJob.branchId) {
          employeeQuery.branchId = newJob.branchId;
        }
        const employees = await Employee.find(employeeQuery);
        const emails = employees.map(emp => emp.email).filter(Boolean);
        
        console.log(`[Job Notification] Sending notifications to ${emails.length} employees...`);
        
        for (const email of emails) {
          try {
            await sendEmail({
              to: email,
              subject: `New Job Opportunity: ${newJob.title} - ${newJob.dept}`,
              text: `A new job opening has been published: ${newJob.title} in the ${newJob.dept} department. Location: ${newJob.location}. Apply at: http://localhost:3000/recruitment`,
              html: getJobOpeningEmailTemplate(newJob)
            });
          } catch (sendErr) {
            console.error(`[Job Notification Error] Failed to send email to ${email}:`, sendErr);
          }
        }
      } catch (err) {
        console.error(`[Job Notification Error] Failed to fetch employees or send notifications:`, err);
      }
    })();

    return NextResponse.json(
      { message: 'Job posted successfully', job: newJob },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Failed to create job:', error);
    return NextResponse.json({ error: 'Failed to create job', details: error.message }, { status: 500 });
  }
}

