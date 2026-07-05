import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { CompanyBranding } from '@/app/api/models/CompanyBranding';
import { verifyAuth } from '@/app/api/lib/auth';

// GET /api/company/branding
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const queryCompanyId = searchParams.get('companyId');
    const queryCompanyCode = searchParams.get('companyCode');

    let companyId = '';
    let companyName = 'HR Core Labs';
    let companyCode = 'hrcore';
    let companyEmail = '';

    if (queryCompanyId || queryCompanyCode) {
      await connectToDatabase();
      const filter = queryCompanyId ? { companyId: queryCompanyId } : { companyCode: queryCompanyCode };
      const branding = await CompanyBranding.findOne(filter);
      if (branding) {
        return NextResponse.json(branding, { status: 200 });
      }
      companyId = queryCompanyId || queryCompanyCode;
    } else {
      const decoded = verifyAuth(req);
      if (!decoded) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      companyId = decoded.companyId;
      companyName = decoded.companyName;
      companyCode = decoded.companyCode;
      companyEmail = decoded.email;
    }

    await connectToDatabase();
    
    // Find or create default branding settings for this companyId
    let branding = await CompanyBranding.findOne({ companyId });
    if (!branding) {
      branding = await CompanyBranding.create({
        companyId,
        companyName,
        companyCode,
        companyEmail,
        welcomeMessage: `Welcome to ${companyName} HR Portal`,
      });
    }

    return NextResponse.json(branding, { status: 200 });
  } catch (error: any) {
    console.error('Failed to get company branding:', error);
    return NextResponse.json({ error: 'Failed to fetch company branding settings', details: error.message }, { status: 500 });
  }
}

// PUT /api/company/branding
export async function PUT(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Allow Admin, HR, and Employee to modify company branding/theme settings
    if (!['Admin', 'HR', 'Employee'].includes(decoded.role)) {
      return NextResponse.json({ error: 'Forbidden. Authorized roles: Admin, HR, Employee.' }, { status: 403 });
    }

    const data = await req.json() as any;

    await connectToDatabase();

    let branding = await CompanyBranding.findOne({ companyId: decoded.companyId });
    if (!branding) {
      branding = new CompanyBranding({ companyId: decoded.companyId });
    }

    // Update fields
    const fieldsToUpdate = [
      'companyName',
      'companyShortName',
      'companyTagline',
      'companyLogo',
      'favicon',
      'loginBanner',
      'loginBackground',
      'companyWatermark',
      'primaryColor',
      'secondaryColor',
      'accentColor',
      'companyEmail',
      'companyPhone',
      'companyWebsite',
      'companyAddress',
      'companyCode',
      'welcomeMessage',
      'emailHeaderLogoVisible',
      'companyHandbookUrl',
      'hrPoliciesUrl',
      'orgChartUrl',
      'trainingPortalUrl'
    ];

    fieldsToUpdate.forEach(field => {
      if (data[field] !== undefined) {
        (branding as any)[field] = data[field];
      }
    });

    await branding.save();

    return NextResponse.json({ message: 'Company branding settings updated successfully', branding }, { status: 200 });
  } catch (error: any) {
    console.error('Failed to update company branding settings:', error);
    return NextResponse.json({ error: 'Failed to update company branding settings', details: error.message }, { status: 500 });
  }
}
