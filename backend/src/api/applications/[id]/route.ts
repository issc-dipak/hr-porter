import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Application } from '@/app/api/models/Application';
import { Job } from '@/app/api/models/Job';
import { Interview } from '@/app/api/models/Interview';
import { verifyAuth } from '@/app/api/lib/auth';
import { sendEmail } from '@/app/api/lib/email';

// GET /api/applications/:id
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectToDatabase();

    const application = await Application.findById(id);
    if (!application) {
      return NextResponse.json({ error: 'Application record not found' }, { status: 404 });
    }

    if (application.companyId !== decoded.companyId) {
      return NextResponse.json({ error: 'Forbidden: Access denied' }, { status: 403 });
    }

    // Fetch associated job details
    const job = await Job.findById(application.jobId);

    // Fetch scheduled interviews
    const interviews = await Interview.find({ applicationId: id });

    return NextResponse.json({
      application,
      jobTitle: job ? job.title : 'Unknown Role',
      jobDept: job ? job.dept : '',
      interviews
    }, { status: 200 });
  } catch (error: any) {
    console.error('Failed to get application:', error);
    return NextResponse.json({ error: 'Failed to fetch application details', details: error.message }, { status: 500 });
  }
}

// PUT /api/applications/:id (or stage updates)
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json() as any;

    await connectToDatabase();

    const application = await Application.findById(id);
    if (!application) {
      return NextResponse.json({ error: 'Application record not found' }, { status: 404 });
    }

    if (application.companyId !== decoded.companyId) {
      return NextResponse.json({ error: 'Forbidden: Access denied' }, { status: 403 });
    }

    // Keep old stage value
    const oldStage = application.stage;
    const newStage = body.stage;

    // Update fields on the application
    if (body.stage) application.stage = body.stage;
    if (body.aiScore) application.aiScore = body.aiScore;
    if (body.aiSummary) application.aiSummary = body.aiSummary;
    if (body.aiSuggestedQuestions) application.aiSuggestedQuestions = body.aiSuggestedQuestions;
    if (body.skills) application.skills = body.skills;
    if (body.education) application.education = body.education;

    await application.save();

    // Synchronize stage update with Job.applicants array
    const job = await Job.findById(application.jobId);
    if (job) {
      let syncDone = false;
      if (job.applicants) {
        job.applicants = job.applicants.map((app: any) => {
          if (app.email.toLowerCase() === application.email.toLowerCase()) {
            app.status = newStage || app.status;
            syncDone = true;
          }
          return app;
        });
      }
      if (syncDone) {
        await job.save();
      }
    }

    // Trigger automation email triggers on stage transitions
    if (newStage && oldStage !== newStage) {
      try {
        let subject = '';
        let emailHtml = '';

        if (newStage === 'Rejected') {
          subject = `Application Update: ${job ? job.title : 'Job opening'}`;
          emailHtml = `
            <p>Dear <strong>${application.candidateName}</strong>,</p>
            <p>Thank you for taking the time to apply and interview for the role of ${job ? job.title : 'our open position'}.</p>
            <p>While we were impressed with your credentials, we have decided to move forward with other candidates who match our immediate stack constraints more closely.</p>
            <p>We will keep your resume on file for future opportunities.</p>
            <hr />
            <p style="font-size: 11px; color: #888;">Recruiting Team</p>
          `;
        } else if (newStage === 'Offer Sent') {
          subject = `Congratulations! Employment Offer from HR Core`;
          emailHtml = `
            <p>Dear <strong>${application.candidateName}</strong>,</p>
            <p>We are delighted to extend a formal offer of employment to join our engineering and product team!</p>
            <p>The formal offer packet and onboarding details will be sent in a separate email shortly.</p>
            <hr />
            <p style="font-size: 11px; color: #888;">Human Resources Dept</p>
          `;
        } else if (newStage === 'Joined') {
          subject = `Welcome Aboard: Onboarding Confirmation`;
          emailHtml = `
            <p>Dear <strong>${application.candidateName}</strong>,</p>
            <p>We are thrilled to welcome you as our newest team member! Your onboarding coordinates have been scheduled.</p>
            <p>Looking forward to a great journey together!</p>
            <hr />
            <p style="font-size: 11px; color: #888;">Onboarding Coordinator</p>
          `;
        }

        if (subject && emailHtml) {
          await sendEmail({
            to: application.email,
            subject,
            text: `Dear ${application.candidateName},\n\nYour application status has been updated. Please check the online portal.\n\nBest regards,\nRecruiting Team`,
            html: emailHtml
          });
        }
      } catch (mailErr) {
        console.error('[Application Update Mail Trigger Error]:', mailErr);
      }
    }

    return NextResponse.json({
      message: 'Application stage updated successfully',
      application
    }, { status: 200 });
  } catch (error: any) {
    console.error('Failed to update application:', error);
    return NextResponse.json({ error: 'Failed to update application', details: error.message }, { status: 500 });
  }
}
