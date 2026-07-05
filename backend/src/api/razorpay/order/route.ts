import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export async function POST(req: Request) {
  try {
    const { amount } = await req.json() as any;
    
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
        amount: Math.round(amount * 100),
        currency: "INR",
        receipt: `receipt_${Date.now()}`
      });
      return NextResponse.json({
        id: order.id,
        key: keyId,
        simulated: false
      });
    } else {
      return NextResponse.json({
        id: null,
        key: keyId && keyId !== 'rzp_test_YOUR_KEY_HERE' ? keyId : null,
        simulated: true
      });
    }
  } catch (error: any) {
    console.error("Razorpay order creation failed:", error);
    return NextResponse.json({ error: "Failed to create payment order" }, { status: 500 });
  }
}

