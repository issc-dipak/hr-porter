import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Job } from '@/app/api/models/Job';

export async function GET() {
  try {
    await connectToDatabase();
    
    // Update all jobs to set applicants to empty array []
    const result = await Job.updateMany({}, { $set: { applicants: [] } });

    return NextResponse.json({
      success: true,
      message: 'All referred applicants cleared successfully!',
      modifiedCount: result.modifiedCount
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

