import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Interview } from '@/app/api/models/Interview';
import { Application } from '@/app/api/models/Application';
import { Job } from '@/app/api/models/Job';
import { verifyAuth } from '@/app/api/lib/auth';
import { sendEmail } from '@/app/api/lib/email';

// POST /api/interviews (Create / schedule an interview)
export async function POST(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json() as any;
    if (!body.applicationId || !body.interviewerName || !body.round || !body.interviewDate || !body.interviewTime) {
      return NextResponse.json({ error: 'Missing required interview properties' }, { status: 400 });
    }

    await connectToDatabase();

    // Find the application details
    const application = await Application.findById(body.applicationId);
    if (!application) {
      return NextResponse.json({ error: 'Application record not found' }, { status: 404 });
    }

    if (application.companyId !== decoded.companyId) {
      return NextResponse.json({ error: 'Forbidden: Access denied' }, { status: 403 });
    }

    // Create the Interview document
    const newInterview = await Interview.create({
      companyId: decoded.companyId,
      applicationId: body.applicationId,
      interviewerId: body.interviewerId || '',
      interviewerName: body.interviewerName,
      round: body.round,
      interviewDate: body.interviewDate,
      interviewTime: body.interviewTime,
      meetingLink: body.meetingLink || '',
      completed: false
    });

    // Advance application stage to 'Interview Scheduled' if still in 'Applied' or 'Screening'
    if (application.stage === 'Applied' || application.stage === 'Screening') {
      application.stage = 'Interview';
      await application.save();
    }

    // Synchronize scheduled interview with corresponding Job applicants array
    const job = await Job.findById(application.jobId);
    if (job) {
      let syncDone = false;
      if (job.applicants) {
        job.applicants = job.applicants.map((app: any) => {
          if (app.email.toLowerCase() === application.email.toLowerCase()) {
            if (!app.interviews) app.interviews = [];
            
            // Push interview rounds
            app.interviews.push({
              companyId: decoded.companyId,
              round: body.round,
              date: body.interviewDate,
              time: body.interviewTime,
              interviewer: body.interviewerName,
              meetingLink: body.meetingLink || '',
              completed: false
            });
            app.status = 'Interview';
            syncDone = true;
          }
          return app;
        });
      }
      if (syncDone) {
        await job.save();
      }
    }

    // Send calendar invite emails asynchronously
    try {
      const emailDate = `${body.interviewDate} at ${body.interviewTime}`;
      const emailLink = body.meetingLink || 'https://meet.google.com';
      
      // Notify candidate
      await sendEmail({
        to: application.email,
        subject: `Interview Scheduled: ${body.round} for ${job ? job.title : 'Position'}`,
        text: `Dear ${application.candidateName},\n\nYour interview round (${body.round}) has been scheduled on ${emailDate} with ${body.interviewerName}.\n\nMeeting link: ${emailLink}\n\nBest regards,\nRecruiting Team`,
        html: `
          <h3>Interview Invitation: ${body.round}</h3>
          <p>Dear <strong>${application.candidateName}</strong>,</p>
          <p>We are pleased to invite you for your next interview round for the position of <strong>${job ? job.title : 'our open role'}</strong>.</p>
          <ul>
            <li><strong>Round:</strong> ${body.round}</li>
            <li><strong>Date & Time:</strong> ${emailDate}</li>
            <li><strong>Interviewer:</strong> ${body.interviewerName}</li>
          </ul>
          <p>Please join the video room using the link below:</p>
          <p><a href="${emailLink}" target="_blank" style="padding: 10px 20px; background-color: #2563eb; color: #fff; text-decoration: none; border-radius: 6px; display: inline-block;">Join Interview Room</a></p>
          <hr />
          <p style="font-size: 11px; color: #888;">This is an automated calendar invite. Please do not reply.</p>
        `
      });

      // Notify Interviewer (if email is known or configured)
      const interviewerEmail = process.env.EMAIL_FROM || 'dipakpatil8589@gmail.com';
      await sendEmail({
        to: interviewerEmail,
        subject: `Assigned Interview: ${application.candidateName} - ${body.round}`,
        text: `Hello ${body.interviewerName},\n\nYou have been assigned as the interviewer for ${application.candidateName} for the ${body.round} round.\n\nTime: ${emailDate}\n\nMeeting link: ${emailLink}\n\nBest regards,\nATS Coordinator`,
        html: `
          <h3>New Interview Assignment</h3>
          <p>Hello <strong>${body.interviewerName}</strong>,</p>
          <p>You have been assigned to evaluate <strong>${application.candidateName}</strong> for the <strong>${body.round}</strong> round.</p>
          <ul>
            <li><strong>Candidate Name:</strong> ${application.candidateName}</li>
            <li><strong>Email:</strong> ${application.email}</li>
            <li><strong>Time:</strong> ${emailDate}</li>
          </ul>
          <p><a href="${emailLink}" target="_blank" style="padding: 10px 20px; background-color: #1e293b; color: #fff; text-decoration: none; border-radius: 6px; display: inline-block;">Enter Evaluation Room</a></p>
          <hr />
          <p style="font-size: 11px; color: #888;">ATS Automated System</p>
        `
      });
    } catch (mailErr) {
      console.error('[Interview Scheduling Mail Error]:', mailErr);
    }

    return NextResponse.json({
      message: 'Interview successfully scheduled',
      interview: newInterview
    }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to schedule interview:', error);
    return NextResponse.json({ error: 'Failed to schedule interview', details: error.message }, { status: 500 });
  }
}
