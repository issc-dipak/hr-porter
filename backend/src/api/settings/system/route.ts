import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { SystemSettings } from '@/app/api/models/SystemSettings';
import { verifyAuth } from '@/app/api/lib/auth';

// GET SystemSettings
export async function GET(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    // Find or create default settings
    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = await SystemSettings.create({});
    }

    return NextResponse.json(settings, { status: 200 });
  } catch (error: any) {
    console.error('Failed to get system settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings', details: error.message }, { status: 500 });
  }
}

// POST/PUT SystemSettings
export async function POST(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only Admin and HR roles can edit system settings
    if (decoded.role !== 'Admin' && decoded.role !== 'HR') {
      return NextResponse.json({ error: 'Forbidden. Role access denied.' }, { status: 403 });
    }

    const data = await req.json() as any;

    await connectToDatabase();

    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = new SystemSettings({});
    }

    // Role-based restrictions:
    // HR can only modify recruitment, leave, performance, and notification configs.
    // Admin can modify everything (company details, payroll, security, developer rules, etc.)
    if (decoded.role === 'HR') {
      if (data.recruitment) settings.recruitment = { ...settings.recruitment, ...data.recruitment };
      if (data.leave) settings.leave = { ...settings.leave, ...data.leave };
      if (data.notifications) settings.notifications = { ...settings.notifications, ...data.notifications };
      if (data.attendance) {
        // HR can change shift info but not core system integrations
        settings.attendance = { ...settings.attendance, ...data.attendance };
      }
      if (data.chat) settings.chat = { ...settings.chat, ...data.chat };
      if (data.payout) settings.payout = { ...settings.payout, ...data.payout };
    } else if (decoded.role === 'Admin') {
      if (data.company) settings.company = { ...settings.company, ...data.company };
      if (data.payroll) settings.payroll = { ...settings.payroll, ...data.payroll };
      if (data.attendance) settings.attendance = { ...settings.attendance, ...data.attendance };
      if (data.leave) settings.leave = { ...settings.leave, ...data.leave };
      if (data.recruitment) settings.recruitment = { ...settings.recruitment, ...data.recruitment };
      if (data.security) settings.security = { ...settings.security, ...data.security };
      if (data.notifications) settings.notifications = { ...settings.notifications, ...data.notifications };
      if (data.theme) settings.theme = { ...settings.theme, ...data.theme };
      if (data.chat) settings.chat = { ...settings.chat, ...data.chat };
      if (data.payout) settings.payout = { ...settings.payout, ...data.payout };
      if (data.org) settings.org = { ...settings.org, ...data.org };
      if (data.workflow) settings.workflow = { ...settings.workflow, ...data.workflow };
      if (data.integrations) settings.integrations = { ...settings.integrations, ...data.integrations };
      if (data.billing) settings.billing = { ...settings.billing, ...data.billing };
      if (data.backup) settings.backup = { ...settings.backup, ...data.backup };
    }

    await settings.save();

    return NextResponse.json({ message: 'System configurations updated successfully', settings }, { status: 200 });
  } catch (error: any) {
    console.error('Failed to update system settings:', error);
    return NextResponse.json({ error: 'Failed to update configurations', details: error.message }, { status: 500 });
  }
}

