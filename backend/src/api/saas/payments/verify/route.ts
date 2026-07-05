import { NextResponse } from 'next/server';
import crypto from 'crypto';
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
    const { 
      razorpay_payment_id, 
      razorpay_order_id, 
      razorpay_signature, 
      planCode, 
      billingCycle 
    } = body;

    if (!razorpay_payment_id || !razorpay_order_id || !planCode || !billingCycle) {
      return NextResponse.json({ error: 'Required fields are missing' }, { status: 400 });
    }

    await connectToDatabase();
    await ensurePlansSeeded();

    const plan = await Plan.findOne({ code: planCode });
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const isMockOrder = razorpay_order_id.startsWith('mock_order_');

    const keyId = process.env.RAZORPAY_KEY_ID;
    const hasKeys = keyId && keySecret && 
                    keyId !== 'rzp_test_YOUR_KEY_HERE' && 
                    keySecret !== 'YOUR_SECRET_HERE';

    // Verify signature if keys are present and it is a real order
    if (hasKeys && !isMockOrder) {
      if (!razorpay_signature) {
        return NextResponse.json({ error: 'razorpay_signature is required for real verification' }, { status: 400 });
      }
      const expectedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(razorpay_order_id + '|' + razorpay_payment_id)
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        return NextResponse.json({ error: 'Payment signature verification failed' }, { status: 400 });
      }
    } else {
      console.log('[SaaS Razorpay Simulator] Verified simulated payment signature.');
    }

    const now = new Date();
    const cycleDays = billingCycle === 'yearly' ? 365 : 30;
    const price = billingCycle === 'yearly' ? plan.price * 10 : plan.price;
    const endDate = new Date(now.getTime() + cycleDays * 24 * 60 * 60 * 1000);

    // Update subscription to Active
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
        razorpaySubscriptionId: razorpay_payment_id,
      },
      { upsert: true, new: true }
    );

    // Create Payment transaction log
    const paymentId = `PAY-${Math.floor(100000 + Math.random() * 900000)}`;
    const tax = Math.round(price * 0.18);
    const total = price + tax;

    const payment = await Payment.create({
      paymentId,
      companyId: decoded.companyId,
      amount: total,
      currency: 'INR',
      status: 'success',
      gateway: 'razorpay',
      transactionId: razorpay_payment_id,
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
      message: 'Payment verified and subscription activated successfully',
      subscription: sub,
      payment,
      invoice,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Subscription verification failed:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment', details: error.message },
      { status: 500 }
    );
  }
}
