import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Wallet } from '@/app/api/models/Wallet';
import { verifyAuth } from '@/app/api/lib/auth';

export async function GET(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = decoded.companyId;

    await connectToDatabase();
    let wallet = await Wallet.findOne({ companyId });
    if (!wallet) {
      wallet = await Wallet.create({
        companyId,
        balance: 0,
        transactions: []
      });
    }
    return NextResponse.json(wallet, { status: 200 });
  } catch (error: any) {
    console.error('Failed to fetch wallet:', error);
    return NextResponse.json({ error: 'Failed to fetch wallet', details: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = decoded.companyId;

    const data = (await req.json()) as any;
    const { amount, paymentId, type, description } = data;

    if (!amount || !type) {
      return NextResponse.json({ error: 'Missing required fields (amount, type)' }, { status: 400 });
    }

    await connectToDatabase();
    let wallet = await Wallet.findOne({ companyId });
    if (!wallet) {
      wallet = await Wallet.create({ companyId, balance: 0, transactions: [] });
    }

    if (type === 'Credit') {
      wallet.balance += Number(amount);
      wallet.transactions.push({
        companyId,
        transactionId: paymentId || `PAY-${Date.now()}`,
        amount: Number(amount),
        type: 'Credit',
        description: description || 'Deposited funds via Razorpay Secure Gateway'
      });
    } else if (type === 'Debit') {
      if (wallet.balance < Number(amount)) {
        return NextResponse.json({ error: 'Insufficient wallet balance' }, { status: 400 });
      }
      wallet.balance -= Number(amount);
      wallet.transactions.push({
        companyId,
        transactionId: paymentId || `DEB-${Date.now()}`,
        amount: Number(amount),
        type: 'Debit',
        description: description || 'Salary disbursement payout'
      });
    }

    await wallet.save();
    return NextResponse.json(wallet, { status: 200 });
  } catch (error: any) {
    console.error('Failed to update wallet:', error);
    return NextResponse.json({ error: 'Failed to update wallet', details: error.message }, { status: 500 });
  }
}

