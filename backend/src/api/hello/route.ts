import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';

export async function GET() {
  try {
    await connectToDatabase();
    return NextResponse.json({ message: 'Connected to MongoDB successfully!' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to connect to MongoDB', details: String(error) }, { status: 500 });
  }
}

