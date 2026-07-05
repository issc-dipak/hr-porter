import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Job } from '@/app/api/models/Job';
import { CompanyBranding } from '@/app/api/models/CompanyBranding';
import { Application } from '@/app/api/models/Application';
import { sendEmail } from '@/app/api/lib/email';

// Helper to call Google Gemini API for resume parsing & matching
async function callGeminiAPIEvaluation(resumeText: string, jobTitle: string, jobRequirements: string[], jobDescription: string) {
  const apiKey = process.env.GEMINI_API_KEY || '';
  if (!apiKey) {
    console.warn('[Gemini AI] GEMINI_API_KEY is not defined in env');
    return null;
  }

  const promptText = `
You are an expert ATS (Applicant Tracking System) assistant.
Parse the following resume text and compare it against the job description requirements for the role of "${jobTitle}".
Return ONLY a valid JSON object matching this schema (do not wrap in markdown or any other tags, return pure JSON):
{
  "parsedData": {
    "name": "Candidate Name",
    "email": "candidate@email.com",
    "phone": "+91 98765 43210",
    "skills": ["React", "TypeScript"],
    "experience": "Total experience description (e.g. 3 years)",
    "education": "Highest education details (e.g. B.Tech in CSE)"
  },
  "evaluation": {
    "matchPercentage": 85,
    "summary": "Short 2-3 sentence candidate summary highlighting strengths and gaps.",
    "suggestedQuestions": ["Question 1?", "Question 2?", "Question 3?"]
  }
}

Job Title: ${jobTitle}
Job Requirements: ${JSON.stringify(jobRequirements)}
Job Description: ${jobDescription}

Resume Text Content:
${resumeText}
`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API returned status ${response.status}: ${errText}`);
    }

    const resData = (await response.json()) as any;
    const generatedText = resData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Clean codeblock wrapper if Gemini wraps it in ```json ... ```
    const cleanText = generatedText
      .replace(/^```json\s*/i, '')
      .replace(/```\s*$/, '')
      .trim();
      
    return JSON.parse(cleanText);
  } catch (error) {
    console.error('[Gemini AI Evaluation Error]:', error);
    return null;
  }
}

// GET job details for Careers public page by slug
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    await connectToDatabase();

    // Query job by publicUrlSlug
    const job = await Job.findOne({ publicUrlSlug: slug, status: 'Published' });
    if (!job) {
      return NextResponse.json({ error: 'Job opening not found or has been closed' }, { status: 404 });
    }

    // Get company branding details
    const branding = await CompanyBranding.findOne({ companyId: job.companyId });

    return NextResponse.json({
      job: {
        id: job._id,
        title: job.title,
        dept: job.dept,
        location: job.location,
        salary: job.salary,
        type: job.type,
        experienceLevel: job.experienceLevel,
        description: job.description,
        requirements: job.requirements,
        responsibilities: job.responsibilities,
        benefits: job.benefits,
        applicationDeadline: job.applicationDeadline,
        openPositions: job.openPositions,
        companyId: job.companyId
      },
      company: branding ? {
        name: branding.companyName,
        logo: branding.companyLogo,
        website: branding.companyWebsite,
        tagline: branding.companyTagline,
        address: branding.companyAddress
      } : {
        name: 'HR Core Labs',
        logo: ''
      }
    }, { status: 200 });
  } catch (error: any) {
    console.error('Failed to get job by slug:', error);
    return NextResponse.json({ error: 'Failed to fetch job details', details: error.message }, { status: 500 });
  }
}

// POST candidate apply to job
export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const data = await req.json() as any;
    
    if (!data.candidateName || !data.email || !data.phone) {
      return NextResponse.json({ error: 'Missing required candidate information (Name, Email, Phone)' }, { status: 400 });
    }

    await connectToDatabase();

    // Find the job opening
    const job = await Job.findOne({ publicUrlSlug: slug, status: 'Published' });
    if (!job) {
      return NextResponse.json({ error: 'Job opening not found or is closed' }, { status: 404 });
    }

    // Trigger AI Resume Parsing and Candidate evaluation using Gemini
    let aiScore = 75;
    let aiSummary = 'Profile submitted via public career portal.';
    let aiSuggestedQuestions: string[] = [
      'Can you detail your experience matching this role requirements?',
      'Why are you looking to join our product team?',
      'Describe a recent project where you handled engineering challenges.'
    ];
    let extractedSkills = data.skills ? data.skills.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
    let extractedEducation = data.education || '';
    let extractedExperience = data.experience || '3 years';

    // If resumeText or coverLetter text is provided, trigger Gemini
    const parserText = `${data.resumeText || ''}\n\nCandidate Profile Details:\nSkills: ${data.skills || ''}\nExperience: ${data.experience || ''}\nEducation: ${data.education || ''}`;
    if (parserText.trim().length > 10) {
      const aiEval = await callGeminiAPIEvaluation(
        parserText,
        job.title,
        job.requirements || [],
        job.description || ''
      );
      if (aiEval) {
        console.log('[Gemini AI] Successfully parsed and matching scored candidate.');
        if (aiEval.parsedData) {
          if (aiEval.parsedData.skills && aiEval.parsedData.skills.length > 0) {
            extractedSkills = aiEval.parsedData.skills;
          }
          if (aiEval.parsedData.education) {
            extractedEducation = aiEval.parsedData.education;
          }
          if (aiEval.parsedData.experience) {
            extractedExperience = aiEval.parsedData.experience;
          }
        }
        if (aiEval.evaluation) {
          aiScore = aiEval.evaluation.matchPercentage || aiScore;
          aiSummary = aiEval.evaluation.summary || aiSummary;
          aiSuggestedQuestions = aiEval.evaluation.suggestedQuestions || aiSuggestedQuestions;
        }
      }
    }

    // Create the Application document
    const application = await Application.create({
      companyId: job.companyId,
      jobId: job._id.toString(),
      candidateName: data.candidateName,
      email: data.email.toLowerCase().trim(),
      phone: data.phone,
      currentCompany: data.currentCompany || '',
      currentDesignation: data.currentDesignation || '',
      experience: extractedExperience,
      currentSalary: data.currentSalary || '',
      expectedSalary: data.expectedSalary || '',
      noticePeriod: data.noticePeriod || '',
      linkedInUrl: data.linkedInUrl || '',
      portfolioUrl: data.portfolioUrl || '',
      resumeUrl: data.resumeUrl || '',
      coverLetter: data.coverLetter || '',
      source: data.source || 'Company Website',
      utmSource: data.utmSource || '',
      utmCampaign: data.utmCampaign || '',
      stage: 'Applied',
      aiScore,
      aiSummary,
      aiSuggestedQuestions,
      education: extractedEducation,
      skills: extractedSkills
    });

    // Create legacy applicant object to sync with corresponding Job applicants array
    const legacyApplicant = {
      companyId: job.companyId,
      name: data.candidateName,
      email: data.email.toLowerCase().trim(),
      phone: data.phone,
      status: 'Applied',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      resumeUrl: data.resumeUrl || '',
      skills: extractedSkills,
      experience: extractedExperience,
      rating: aiScore,
      scorecard: {
        companyId: job.companyId,
        interviewerRating: 0,
        feedbackComments: aiSummary,
        recommendation: ''
      },
      interviews: []
    };

    if (!job.applicants) {
      job.applicants = [];
    }

    // Push into job applicants list
    job.applicants.push(legacyApplicant);
    await job.save();

    // Notify Admin & HR of new application
    try {
      const { SystemNotificationService } = await import('../../../services/systemNotificationService');
      await SystemNotificationService.notifyRoles(job.companyId, ['Admin', 'HR'], {
        companyId: job.companyId,
        title: 'New Job Application',
        content: `${data.candidateName} applied for the role: "${job.title}". Match score: ${aiScore}%.`,
        type: 'other',
        targetPage: 'recruitment'
      });
    } catch (notifErr) {
      console.error('Failed to trigger candidate application notification:', notifErr);
    }

    // Send Application Received email notification to the candidate
    try {
      const branding = await CompanyBranding.findOne({ companyId: job.companyId });
      const companyName = branding ? branding.companyName : 'HR Core Labs';
      
      await sendEmail({
        to: data.email,
        subject: `Application Received: ${job.title} at ${companyName}`,
        text: `Dear ${data.candidateName},\n\nThank you for applying to the ${job.title} position at our organization. We have received your application and resume successfully, and our review panel will contact you if your skills align with our parameters.\n\nBest regards,\nRecruiting Team`,
        html: `
          <h3>Application Status: Received</h3>
          <p>Dear <strong>${data.candidateName}</strong>,</p>
          <p>We are delighted to confirm receipt of your application for the role of <strong>${job.title}</strong> at <strong>${companyName}</strong>.</p>
          <p>Our talent acquisition team is actively reviewing submissions. If your qualifications match our active parameters, we will schedule a call shortly.</p>
          <hr />
          <p style="font-size: 11px; color: #888;">This is an automated notification from ${companyName} Recruiting. Please do not reply.</p>
        `
      });
    } catch (mailErr) {
      console.error('[Careers Apply] Failed to send confirmation email:', mailErr);
    }

    return NextResponse.json({
      message: 'Application submitted successfully',
      applicationId: application._id,
      aiScore
    }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to submit career application:', error);
    return NextResponse.json({ error: 'Failed to submit application', details: error.message }, { status: 500 });
  }
}
