import { NextResponse } from 'next/server';
import { verifyAuthToken, createErrorResponse } from '../../middleware/auth';

export async function POST(req: Request) {
  try {
    const decoded = verifyAuthToken(req);
    if (!decoded) {
      return createErrorResponse('Unauthorized', 401);
    }

    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) {
      console.warn('[Chatbot API] GEMINI_API_KEY is not defined in env');
      return NextResponse.json({ error: 'AI capabilities are currently offline.' }, { status: 503 });
    }

    const body = await req.json() as any;
    const { message, history } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
    }

    const role = decoded.role || 'Employee';
    const fullName = decoded.fullName || 'User';

    // 1. Build the role-based system instruction prompt
    let systemPrompt = '';
    if (role === 'Admin') {
      systemPrompt = `You are "Admin-Bot", a secure enterprise administrative AI assistant for HR Core.
You are assisting the System Administrator named ${fullName}.
Your capabilities and permissions are:
- Help guide through server configurations, database seed statuses, system settings, and audit trails.
- Answer questions on system performance, role definitions, rules parameters (e.g. Auto SLA tracking, AI ticket classification settings).
- Help draft policy texts and system settings instructions.
- Maintain a highly secure, professional, and precise tone.
- Do not execute actions, but guide the administrator on how to perform them in the Admin Panel.`;
    } else if (role === 'HR') {
      systemPrompt = `You are "HR-Bot", a talent and operations AI assistant for HR Core.
You are assisting an HR Manager named ${fullName}.
Your capabilities and permissions are:
- Help summarize employee performance analytics, leave records, and recruitment pipeline status.
- Guide the HR manager on candidate evaluation, resume parsing results, and onboarding procedures.
- Draft corporate announcement notices, email outreach templates for candidates, and employee feedback forms.
- Do NOT share sensitive raw administrator credentials or infrastructure secret settings.
- Maintain a warm, encouraging, yet highly professional corporate tone.`;
    } else {
      // Default: Employee
      systemPrompt = `You are "Employee-Bot", a self-service AI assistant for HR Core.
You are assisting an employee named ${fullName}.
Your capabilities and permissions are:
- Answer questions about standard leave balance rules, office holiday calendars, referral guidelines, and general employee FAQs.
- Guide employees on how to apply for leave, check daily status report statuses, or raise helpdesk support tickets.
- Do NOT reveal administrative settings, other employees' salary slips, other employees' personal files, audit logs, or candidate pipelines.
- If asked about sensitive files of other employees or administrative controls, reply politely that you do not have permission to access that data.
- Maintain a helpful, friendly, and clear tone.`;
    }

    // 2. Format content history for Gemini API
    const contents: any[] = [];

    if (history && Array.isArray(history)) {
      history.forEach((turn: any) => {
        const turnRole = turn.role === 'user' ? 'user' : 'model';
        contents.push({
          role: turnRole,
          parts: [{ text: turn.text || turn.message || '' }]
        });
      });
    }

    // Append the current user message
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    // 3. Make POST call to Google Gemini 1.5 Flash
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      let parsedErr: any = null;
      try {
        parsedErr = JSON.parse(errText);
      } catch (e) {}

      const errMsg = parsedErr?.error?.message || errText;
      const isQuotaExceeded = response.status === 429 || 
                              errMsg.toLowerCase().includes('quota') || 
                              errMsg.toLowerCase().includes('rate limit');

      if (isQuotaExceeded) {
        return NextResponse.json({ 
          response: "I apologize, but my Gemini AI quota limit has been exceeded for today. Please wait a bit or update the API Key in the settings." 
        }, { status: 200 });
      }

      throw new Error(`Gemini API returned status ${response.status}: ${errMsg}`);
    }

    const resData = (await response.json()) as any;
    const aiResponse = resData.candidates?.[0]?.content?.parts?.[0]?.text || 'I apologize, but I could not formulate a response at the moment.';

    return NextResponse.json({ response: aiResponse }, { status: 200 });

  } catch (error: any) {
    console.error('[Chatbot Route Error]:', error);
    return NextResponse.json({ error: 'Failed to process AI response', details: error.message }, { status: 500 });
  }
}
