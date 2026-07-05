import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '../../../../../database';
import { Company } from '../../../../../models/Company';
import { Subscription } from '../../../../../models/Subscription';
import { User } from '@/app/api/models/User';
import { Plan, ensurePlansSeeded } from '../../../../../models/Plan';
import { Invoice } from '../../../../../models/Invoice';
import { verifyAuth } from '../../../../lib/auth';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded || decoded.role !== 'Super Admin') {
      return NextResponse.json({ error: 'Forbidden. Access restricted to Super Admins only.' }, { status: 403 });
    }

    const { companyId } = await params;
    const body = await req.json() as any;
    const { action, days, planCode, adminEmail, newPassword } = body;

    if (!action) {
      return NextResponse.json({ error: 'Action parameter is required' }, { status: 400 });
    }

    await connectToDatabase();
    await ensurePlansSeeded();

    // The slug can be parsed from companyId (e.g. company_acme -> slug: acme)
    const slug = companyId.replace(/^company_/, '');
    
    // Find company by slug or companyId
    const company = await Company.findOne({ $or: [{ slug }, { companyId }] });
    if (!company) {
      return NextResponse.json({ error: `Company workspace not found: ${companyId}` }, { status: 404 });
    }

    const targetCompanyId = `company_${company.slug}`;

    if (action === 'suspend') {
      company.status = 'suspended';
      await company.save();

      // Deactivate all users of this tenant
      await User.updateMany(
        { companyId: targetCompanyId },
        { $set: { status: 'Suspended', isActive: false } }
      );

      return NextResponse.json({ message: 'Company and all associated user profiles suspended successfully.' });
    }

    if (action === 'activate') {
      company.status = 'active';
      await company.save();

      // Reactivate all users
      await User.updateMany(
        { companyId: targetCompanyId },
        { $set: { status: 'Active', isActive: true } }
      );

      return NextResponse.json({ message: 'Company workspace activated successfully.' });
    }

    if (action === 'extend-trial') {
      const extensionDays = parseInt(days, 10) || 14;
      const sub = await Subscription.findOne({ companyId: targetCompanyId });
      
      const now = new Date();
      if (sub) {
        const baseDate = sub.endDate > now ? sub.endDate : now;
        sub.endDate = new Date(baseDate.getTime() + extensionDays * 24 * 60 * 60 * 1000);
        sub.trialEndDate = sub.endDate;
        sub.status = 'trial';
        await sub.save();
      } else {
        const trialEnd = new Date(now.getTime() + extensionDays * 24 * 60 * 60 * 1000);
        await Subscription.create({
          companyId: targetCompanyId,
          planCode: 'starter',
          status: 'trial',
          price: 999,
          billingCycle: 'monthly',
          startDate: now,
          endDate: trialEnd,
          trialStartDate: now,
          trialEndDate: trialEnd,
          cancelAtPeriodEnd: false,
          autoRenew: true,
        });
      }

      return NextResponse.json({ message: `Trial successfully extended by ${extensionDays} days.` });
    }

    if (action === 'change-subscription') {
      if (!planCode) {
        return NextResponse.json({ error: 'planCode is required' }, { status: 400 });
      }

      const plan = await Plan.findOne({ code: planCode });
      if (!plan) {
        return NextResponse.json({ error: 'Plan code not found' }, { status: 404 });
      }

      const sub = await Subscription.findOne({ companyId: targetCompanyId });
      const now = new Date();
      
      if (sub) {
        sub.planCode = planCode;
        sub.price = plan.price;
        sub.status = 'active';
        sub.endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // Reset for 30 days
        await sub.save();
      } else {
        await Subscription.create({
          companyId: targetCompanyId,
          planCode,
          status: 'active',
          price: plan.price,
          billingCycle: 'monthly',
          startDate: now,
          endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
          cancelAtPeriodEnd: false,
          autoRenew: true,
        });
      }

      // Generate invoice
      const invoiceNumber = `INV-${Math.floor(100000 + Math.random() * 900000)}`;
      await Invoice.create({
        invoiceNumber,
        companyId: targetCompanyId,
        companyName: company.companyName,
        planName: plan.name,
        billingPeriod: `${now.toLocaleString('en-US', { month: 'short' })} ${now.getFullYear()}`,
        amount: plan.price,
        taxAmount: Math.round(plan.price * 0.18),
        totalAmount: Math.round(plan.price * 1.18),
        paymentStatus: 'paid',
        pdfUrl: `/api/saas/invoices?download=true&invoiceNumber=${invoiceNumber}`,
      });

      return NextResponse.json({ message: `Subscription plan updated to ${plan.name} successfully.` });
    }

    if (action === 'reset-admin') {
      if (!adminEmail || !newPassword) {
        return NextResponse.json({ error: 'adminEmail and newPassword are required' }, { status: 400 });
      }

      const adminUser = await User.findOne({
        email: adminEmail.toLowerCase().trim(),
        companyId: targetCompanyId,
        role: 'Admin'
      });

      if (!adminUser) {
        return NextResponse.json({ error: 'Admin user with this email not found in company.' }, { status: 404 });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      
      adminUser.password = hashedPassword;
      await adminUser.save();

      return NextResponse.json({ message: `Password for administrator ${adminEmail} successfully reset.` });
    }

    if (action === 'billing-history') {
      const history = await Invoice.find({ companyId: targetCompanyId }).sort({ createdAt: -1 });
      return NextResponse.json(history);
    }

    return NextResponse.json({ error: 'Invalid action specified' }, { status: 400 });

  } catch (error: any) {
    console.error('Superadmin company action error:', error);
    return NextResponse.json(
      { error: 'Failed to execute company action', details: error.message },
      { status: 500 }
    );
  }
}
