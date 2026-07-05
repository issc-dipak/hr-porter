import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../database';
import { Company } from '../../../models/Company';
import { Subscription } from '../../../models/Subscription';
import { Employee } from '../../../models/Employee';
import { verifyAuth } from '../../lib/auth';

export async function GET(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded || decoded.role !== 'Super Admin') {
      return NextResponse.json({ error: 'Forbidden. Access restricted to Super Admins only.' }, { status: 403 });
    }

    await connectToDatabase();

    const companies = await Company.find({}).sort({ createdAt: -1 });
    
    // Map companies and aggregate subscription & usage detail
    const companiesList = await Promise.all(
      companies.map(async (company) => {
        const companyId = `company_${company.slug}`;
        
        const sub = await Subscription.findOne({ companyId });
        const employeeCount = await Employee.countDocuments({ companyId, isActive: { $ne: false } });

        return {
          id: company._id,
          companyName: company.companyName,
          slug: company.slug,
          companyId,
          industry: company.industry || 'Technology',
          companySize: company.companySize || '1-10',
          status: company.status,
          workEmail: company.workEmail || company.companyEmail || '',
          phoneNumber: company.phoneNumber || company.phone || '',
          gstNumber: company.gstNumber || '',
          website: company.website || '',
          createdAt: company.createdAt,
          employeeCount,
          planCode: sub ? sub.planCode : 'starter',
          subscriptionStatus: sub ? sub.status : 'trial',
          trialEndDate: sub ? sub.trialEndDate : null,
          endDate: sub ? sub.endDate : null,
        };
      })
    );

    return NextResponse.json(companiesList, { status: 200 });
  } catch (error: any) {
    console.error('Failed to retrieve companies list:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve companies list', details: error.message },
      { status: 500 }
    );
  }
}
