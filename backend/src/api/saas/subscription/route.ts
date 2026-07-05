import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../database';
import { Subscription } from '../../../models/Subscription';
import { Plan, ensurePlansSeeded } from '../../../models/Plan';
import { UsageMetrics } from '../../../models/UsageMetrics';
import { Invoice } from '../../../models/Invoice';
import { Employee } from '../../../models/Employee';
import { verifyAuth } from '../../lib/auth';

// Helper to calculate days remaining
function getDaysRemaining(endDate: Date): number {
  const diffTime = endDate.getTime() - Date.now();
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
}

// GET /api/saas/subscription
export async function GET(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    await ensurePlansSeeded();
    
    // Find or create default subscription (14-day Starter free trial)
    let sub = await Subscription.findOne({ companyId: decoded.companyId });
    if (!sub) {
      const trialDuration = 14 * 24 * 60 * 60 * 1000; // 14 days
      const now = new Date();
      const trialEnd = new Date(now.getTime() + trialDuration);
      
      sub = await Subscription.create({
        companyId: decoded.companyId,
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

    // Check if subscription has expired
    const isExpired = sub.endDate < new Date();
    if (isExpired && sub.status !== 'expired') {
      sub.status = 'expired';
      await sub.save();
    }

    // Fetch active plan details to know limits
    let plan = await Plan.findOne({ code: sub.planCode });
    if (!plan) {
      // Fallback
      plan = new Plan({
        name: sub.planCode === 'starter' ? 'Starter Plan' : sub.planCode === 'professional' ? 'Professional Plan' : 'Enterprise Plan',
        code: sub.planCode,
        price: sub.planCode === 'starter' ? 999 : sub.planCode === 'professional' ? 4999 : 0,
        employeeLimit: sub.planCode === 'starter' ? 25 : sub.planCode === 'professional' ? 250 : 999999,
      });
    }

    // Dynamic employee count calculation
    const activeEmployeesCount = await Employee.countDocuments({ companyId: decoded.companyId, isActive: { $ne: false } });
    const totalEmployeesCount = await Employee.countDocuments({ companyId: decoded.companyId });

    // Sync usage metrics
    const usage = await UsageMetrics.findOneAndUpdate(
      { companyId: decoded.companyId },
      { 
        activeEmployees: activeEmployeesCount, 
        totalEmployees: totalEmployeesCount,
        // Mock static storage & api values for demo/simulation
        $setOnInsert: {
          storageUsageBytes: 1024 * 1024 * 45, // 45 MB mock
          apiCallsCount: 185,
          aiQueriesCount: 22,
          monthlyTransactionsCount: 5,
        }
      },
      { upsert: true, new: true }
    );

    // Days remaining
    const daysRemaining = getDaysRemaining(sub.endDate);

    // Get upcoming invoice (simulated)
    const upcomingInvoice = {
      invoiceNumber: `UP-${Math.floor(100000 + Math.random() * 900000)}`,
      amount: sub.price,
      taxAmount: Math.round(sub.price * 0.18), // 18% GST
      totalAmount: Math.round(sub.price * 1.18),
      dueDate: sub.endDate,
      planName: plan.name
    };

    return NextResponse.json({
      subscription: sub,
      plan,
      usage,
      daysRemaining,
      upcomingInvoice,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Failed to get subscription:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve subscription info', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/saas/subscription/action
export async function POST(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json() as any;
    const { action, planCode, billingCycle } = body;

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    await connectToDatabase();
    await ensurePlansSeeded();

    let sub = await Subscription.findOne({ companyId: decoded.companyId });
    const now = new Date();

    if (!sub) {
      if (action === 'upgrade' || action === 'downgrade' || action === 'change') {
        if (!planCode) {
          return NextResponse.json({ error: 'planCode is required' }, { status: 400 });
        }
        const targetPlan = await Plan.findOne({ code: planCode });
        if (!targetPlan) {
          return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
        }

        const isTrial = body.status === 'trial' || body.trial === true || true;
        const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

        sub = new Subscription({
          companyId: decoded.companyId,
          planCode,
          status: isTrial ? 'trial' : 'active',
          price: isTrial ? 0 : targetPlan.price,
          billingCycle: billingCycle || 'monthly',
          startDate: now,
          endDate: isTrial ? trialEnd : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
          trialStartDate: isTrial ? now : undefined,
          trialEndDate: isTrial ? trialEnd : undefined,
          cancelAtPeriodEnd: false,
          autoRenew: true,
        });
        await sub.save();

        const invoiceNum = `INV-${Math.floor(100000 + Math.random() * 900000)}`;
        await Invoice.create({
          invoiceNumber: invoiceNum,
          companyId: decoded.companyId,
          companyName: decoded.companyName,
          gstNumber: decoded.companyCode + 'GST123',
          planName: targetPlan.name,
          billingPeriod: `${now.toLocaleString('en-US', { month: 'short' })} ${now.getFullYear()}`,
          amount: sub.price,
          taxAmount: Math.round(sub.price * 0.18),
          totalAmount: Math.round(sub.price * 1.18),
          paymentStatus: 'paid',
          pdfUrl: `/api/saas/invoices?download=true&invoiceNumber=${invoiceNum}`
        });

        return NextResponse.json({ message: 'Plan configured successfully', subscription: sub }, { status: 200 });
      } else {
        return NextResponse.json({ error: 'Subscription not found for this company' }, { status: 404 });
      }
    }

    if (action === 'upgrade' || action === 'downgrade' || action === 'change') {
      if (!planCode) {
        return NextResponse.json({ error: 'planCode is required for upgrade/downgrade' }, { status: 400 });
      }

      const targetPlan = await Plan.findOne({ code: planCode });
      if (!targetPlan) {
        return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
      }

      // Check current employee count if downgrading to Starter
      if (planCode === 'starter') {
        const activeCount = await Employee.countDocuments({ companyId: decoded.companyId, isActive: { $ne: false } });
        if (activeCount > 25) {
          return NextResponse.json({ 
            error: `Cannot downgrade to Starter. You have ${activeCount} active employees, but Starter Plan limit is 25.` 
          }, { status: 400 });
        }
      } else if (planCode === 'professional') {
        const activeCount = await Employee.countDocuments({ companyId: decoded.companyId, isActive: { $ne: false } });
        if (activeCount > 250) {
          return NextResponse.json({ 
            error: `Cannot downgrade to Professional. You have ${activeCount} active employees, but Professional Plan limit is 250.` 
          }, { status: 400 });
        }
      }

      sub.planCode = planCode;
      sub.price = targetPlan.price;
      sub.billingCycle = billingCycle || 'monthly';
      
      // If it's a paid plan upgrade, make it active
      if (planCode !== 'enterprise') {
        sub.status = 'active';
        sub.endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
      } else {
        sub.status = 'active'; // enterprise plan active status
        sub.endDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year
      }

      // Create an invoice for the upgrade/change
      const invoiceNum = `INV-${Math.floor(100000 + Math.random() * 900000)}`;
      const subtotal = targetPlan.price;
      const tax = Math.round(subtotal * 0.18);
      
      await Invoice.create({
        invoiceNumber: invoiceNum,
        companyId: decoded.companyId,
        companyName: decoded.companyName,
        gstNumber: decoded.companyCode, // mock gst
        planName: targetPlan.name,
        billingPeriod: `${now.toLocaleString('en-US', { month: 'short' })} ${now.getFullYear()}`,
        amount: subtotal,
        taxAmount: tax,
        totalAmount: subtotal + tax,
        paymentStatus: targetPlan.price > 0 ? 'paid' : 'paid', // seed paid for simulation
        pdfUrl: `/api/saas/invoices/${invoiceNum}/pdf`
      });

      await sub.save();
      return NextResponse.json({ message: 'Plan updated successfully', subscription: sub }, { status: 200 });
    }

    if (action === 'pause') {
      sub.status = 'paused';
      await sub.save();
      return NextResponse.json({ message: 'Subscription paused', subscription: sub }, { status: 200 });
    }

    if (action === 'resume') {
      // Resume trial if trialEndDate not reached, otherwise set active
      if (sub.trialEndDate && sub.trialEndDate > now) {
        sub.status = 'trial';
      } else {
        sub.status = 'active';
      }
      await sub.save();
      return NextResponse.json({ message: 'Subscription resumed', subscription: sub }, { status: 200 });
    }

    if (action === 'cancel') {
      sub.status = 'cancelled';
      sub.cancelAtPeriodEnd = true;
      await sub.save();
      return NextResponse.json({ message: 'Subscription set to cancel at end of billing cycle', subscription: sub }, { status: 200 });
    }

    if (action === 'renew') {
      const cycleDays = sub.billingCycle === 'yearly' ? 365 : 30;
      sub.endDate = new Date(sub.endDate.getTime() + cycleDays * 24 * 60 * 60 * 1000);
      sub.status = 'active';
      sub.cancelAtPeriodEnd = false;

      // Generate invoice
      const invoiceNum = `INV-${Math.floor(100000 + Math.random() * 900000)}`;
      const subtotal = sub.price;
      const tax = Math.round(subtotal * 0.18);
      
      await Invoice.create({
        invoiceNumber: invoiceNum,
        companyId: decoded.companyId,
        companyName: decoded.companyName,
        planName: sub.planCode === 'starter' ? 'Starter Plan' : sub.planCode === 'professional' ? 'Professional Plan' : 'Enterprise Plan',
        billingPeriod: `${now.toLocaleString('en-US', { month: 'short' })} ${now.getFullYear()}`,
        amount: subtotal,
        taxAmount: tax,
        totalAmount: subtotal + tax,
        paymentStatus: 'paid',
        pdfUrl: `/api/saas/invoices/${invoiceNum}/pdf`
      });

      await sub.save();
      return NextResponse.json({ message: 'Subscription renewed successfully', subscription: sub }, { status: 200 });
    }

    return NextResponse.json({ error: 'Invalid subscription action' }, { status: 400 });

  } catch (error: any) {
    console.error('Subscription action error:', error);
    return NextResponse.json(
      { error: 'Failed to complete subscription action', details: error.message },
      { status: 500 }
    );
  }
}
