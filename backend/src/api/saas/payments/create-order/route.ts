import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { connectToDatabase } from '../../../../database';
import { Plan, ensurePlansSeeded } from '../../../../models/Plan';
import { verifyAuth } from '../../../lib/auth';

export async function POST(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json() as any;
    const { planCode, billingCycle } = body;

    if (!planCode || !billingCycle) {
      return NextResponse.json({ error: 'planCode and billingCycle are required' }, { status: 400 });
    }

    await connectToDatabase();
    await ensurePlansSeeded();

    const plan = await Plan.findOne({ code: planCode });
    if (!plan) {
      return NextResponse.json({ error: 'Plan code is invalid' }, { status: 404 });
    }

    const price = billingCycle === 'yearly' ? plan.price * 10 : plan.price;
    const tax = Math.round(price * 0.18);
    const total = price + tax;

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    const hasKeys = keyId && keySecret && 
                    keyId !== 'rzp_test_YOUR_KEY_HERE' && 
                    keySecret !== 'YOUR_SECRET_HERE';

    if (hasKeys) {
      const rzp = new Razorpay({
        key_id: keyId,
        key_secret: keySecret
      });

      const order = await rzp.orders.create({
        amount: Math.round(total * 100), // in paise
        currency: 'INR',
        receipt: `sub_receipt_${Date.now()}`
      });

      return NextResponse.json({
        id: order.id,
        key: keyId,
        amount: total,
        currency: 'INR',
        simulated: false
      });
    } else {
      // Fallback for development if keys are not configured
      console.log('[SaaS Razorpay Simulator] Razorpay keys not configured. Returning simulated payload.');
      return NextResponse.json({
        id: `mock_order_${Math.floor(100000 + Math.random() * 900000)}`,
        key: 'rzp_test_mock_key',
        amount: total,
        currency: 'INR',
        simulated: true
      });
    }

  } catch (error: any) {
    console.error('Failed to create subscription payment order:', error);
    return NextResponse.json(
      { error: 'Failed to create payment order', details: error.message },
      { status: 500 }
    );
  }
}
