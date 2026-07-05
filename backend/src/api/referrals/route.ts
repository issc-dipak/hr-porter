import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Referral } from '@/app/api/models/Referral';
import { Job } from '@/app/api/models/Job';
import { verifyAuth } from '@/app/api/lib/auth';

// GET referrals (optionally filtered by referrerEmail)
export async function GET(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    const url = new URL(req.url);
    const referrerEmail = url.searchParams.get('referrerEmail');

    let query: any = { companyId: decoded.companyId };
    if (referrerEmail) {
      const escapedEmail = referrerEmail.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      query.referrerEmail = { $regex: new RegExp(`^${escapedEmail}$`, 'i') };
    }

    const referrals = await Referral.find(query).sort({ createdAt: -1 });
    return NextResponse.json(referrals, { status: 200 });
  } catch (error: any) {
    console.error('Failed to fetch referrals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch referrals', details: error.message },
      { status: 500 }
    );
  }
}

// POST a new referral and add the candidate to the Job's applicants
export async function POST(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const data = await req.json() as any;

    if (!data.candidateName || !data.candidateEmail || !data.targetJobId || !data.referrerEmail) {
      return NextResponse.json(
        { error: 'Missing required fields (candidateName, candidateEmail, targetJobId, referrerEmail)' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Find the target job
    const job = await Job.findById(data.targetJobId);
    if (!job || job.companyId !== decoded.companyId) {
      return NextResponse.json({ error: 'Target job opening not found' }, { status: 404 });
    }

    // Determine referral bonus based on job salary
    let bonus = 15000;
    if (job.salary) {
      if (job.salary.includes('35L')) {
        bonus = 35000;
      } else if (job.salary.includes('28L') || job.salary.includes('25L')) {
        bonus = 25000;
      } else if (job.salary.includes('18L') || job.salary.includes('22L')) {
        bonus = 20000;
      }
    }

    const dateStr = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    // Create the Referral document
    const newReferral = await Referral.create({
      companyId: decoded.companyId,
      referrerName: data.referrerName || 'Employee',
      referrerEmail: data.referrerEmail,
      candidateName: data.candidateName,
      candidateEmail: data.candidateEmail,
      jobId: job._id,
      role: job.title,
      status: 'Submitted',
      bonus: bonus,
      date: dateStr,
      notes: data.notes || '',
      experience: data.experience || '3 years',
      resumeUrl: data.resumeUrl || '',
      skills: data.skills ? data.skills.split(',').map((s: string) => s.trim()).filter(Boolean) : []
    });

    // Add candidate to Job's applicants array
    const applicant = {
      name: data.candidateName,
      email: data.candidateEmail,
      phone: 'Statutory Referral', // Marker to indicate internal referral source
      status: 'Applied',
      date: dateStr,
      skills: data.skills ? data.skills.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
      experience: data.experience || '3 years',
      rating: 85,
      resumeUrl: data.resumeUrl || '',
      scorecard: {
        interviewerRating: 0,
        feedbackComments: '',
        recommendation: ''
      },
      interviews: []
    };

    if (!job.applicants) {
      job.applicants = [];
    }

    // Check if applicant already exists in this job
    const alreadyApplied = job.applicants.some(
      (app: any) => app.email.toLowerCase() === data.candidateEmail.toLowerCase()
    );

    if (!alreadyApplied) {
      job.applicants.push(applicant);
      await job.save();
    }

    return NextResponse.json(
      { message: 'Referral submitted successfully', referral: newReferral },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Failed to submit referral:', error);
    return NextResponse.json(
      { error: 'Failed to submit referral', details: error.message },
      { status: 500 }
    );
  }
}

