import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../database';
import { Plan, ensurePlansSeeded } from '../../../models/Plan';

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    await ensurePlansSeeded();
    
    const plans = await Plan.find({}).sort({ price: 1 });
    return NextResponse.json(plans, { status: 200 });
  } catch (error: any) {
    console.error('Failed to get plans:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve plans', details: error.message },
      { status: 500 }
    );
  }
}

