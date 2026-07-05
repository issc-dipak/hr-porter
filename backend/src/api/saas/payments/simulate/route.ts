import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../database';
import { Subscription } from '../../../../models/Subscription';
import { Plan, ensurePlansSeeded } from '../../../../models/Plan';
import { Payment } from '../../../../models/Payment';
import { Invoice } from '../../../../models/Invoice';
import { verifyAuth } from '../../../lib/auth';

export async function POST(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json() as any;
    const { planCode, billingCycle, gateway } = body;

    if (!planCode || !gateway) {
      return NextResponse.json({ error: 'planCode and gateway are required' }, { status: 400 });
    }

    await connectToDatabase();
    await ensurePlansSeeded();

    const plan = await Plan.findOne({ code: planCode });
    if (!plan) {
      return NextResponse.json({ error: 'Plan code is invalid' }, { status: 404 });
    }

    const now = new Date();
    const cycleDays = billingCycle === 'yearly' ? 365 : 30;
    const price = billingCycle === 'yearly' ? plan.price * 10 : plan.price; // 10 months price for annual discount
    const endDate = new Date(now.getTime() + cycleDays * 24 * 60 * 60 * 1000);

    // Update subscription
    const sub = await Subscription.findOneAndUpdate(
      { companyId: decoded.companyId },
      {
        planCode,
        status: 'active',
        price,
        billingCycle: billingCycle || 'monthly',
        startDate: now,
        endDate,
        cancelAtPeriodEnd: false,
        autoRenew: true,
        stripeSubscriptionId: gateway === 'stripe' ? `sub_stripe_${Math.floor(100000 + Math.random() * 900000)}` : '',
        razorpaySubscriptionId: gateway === 'razorpay' ? `sub_rzp_${Math.floor(100000 + Math.random() * 900000)}` : '',
      },
      { upsert: true, new: true }
    );

    // Create Payment transaction log
    const paymentId = `PAY-${Math.floor(100000 + Math.random() * 900000)}`;
    const txId = `txn_${Math.random().toString(36).substring(2, 11)}`;
    const tax = Math.round(price * 0.18);
    const total = price + tax;

    const payment = await Payment.create({
      paymentId,
      companyId: decoded.companyId,
      amount: total,
      currency: 'INR',
      status: 'success',
      gateway,
      transactionId: txId,
    });

    // Create corresponding Invoice
    const invoiceNumber = `INV-${Math.floor(100000 + Math.random() * 900000)}`;
    const invoice = await Invoice.create({
      invoiceNumber,
      companyId: decoded.companyId,
      companyName: decoded.companyName,
      gstNumber: decoded.companyCode + 'GST123',
      planName: plan.name,
      billingPeriod: `${now.toLocaleString('en-US', { month: 'short' })} ${now.getFullYear()}`,
      amount: price,
      taxAmount: tax,
      totalAmount: total,
      paymentStatus: 'paid',
      pdfUrl: `/api/saas/invoices?download=true&invoiceNumber=${invoiceNumber}`,
    });

    payment.invoiceId = invoiceNumber;
    await payment.save();

    return NextResponse.json({
      success: true,
      message: 'Checkout completed successfully',
      subscription: sub,
      payment,
      invoice,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Checkout simulation failed:', error);
    return NextResponse.json(
      { error: 'Failed to complete payment transaction simulation', details: error.message },
      { status: 500 }
    );
  }
}
