import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Job } from '@/app/api/models/Job';
import { verifyAuth } from '@/app/api/lib/auth';

// Reuse Gemini evaluation helper logic
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

// POST /api/applications/parse-resume
export async function POST(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json() as any;
    if (!body.resumeText || !body.jobId) {
      return NextResponse.json({ error: 'Missing resumeText or jobId' }, { status: 400 });
    }

    await connectToDatabase();

    // Fetch the target job opening
    const job = await Job.findById(body.jobId);
    if (!job) {
      return NextResponse.json({ error: 'Job opening not found' }, { status: 404 });
    }

    if (job.companyId !== decoded.companyId) {
      return NextResponse.json({ error: 'Forbidden: Access denied' }, { status: 403 });
    }

    const aiEval = await callGeminiAPIEvaluation(
      body.resumeText,
      job.title,
      job.requirements || [],
      job.description || ''
    );

    if (!aiEval) {
      return NextResponse.json({ error: 'Failed to process resume parsing via Gemini' }, { status: 500 });
    }

    return NextResponse.json(aiEval, { status: 200 });
  } catch (error: any) {
    console.error('Failed to parse resume:', error);
    return NextResponse.json({ error: 'Failed to parse resume', details: error.message }, { status: 500 });
  }
}
