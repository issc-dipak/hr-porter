import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Designation } from '@/app/models/Designation';
import { verifyAuth } from '@/app/api/lib/auth';

export async function GET(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const companyId = decoded.companyId;
    await connectToDatabase();

    const designations = await Designation.find({ companyId }).sort({ level: 1, designationName: 1 });
    return NextResponse.json(designations, { status: 200 });
  } catch (error: any) {
    console.error('Failed to fetch designations:', error);
    return NextResponse.json({ error: 'Failed to fetch designations', details: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const companyId = decoded.companyId;
    const body = await req.json() as any;
    const { designationName, level } = body;

    if (!designationName || !designationName.trim()) {
      return NextResponse.json({ error: 'Missing required field: designationName' }, { status: 400 });
    }

    await connectToDatabase();

    const trimmedName = designationName.trim();
    const escapedName = trimmedName.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
    const existingDesig = await Designation.findOne({
      companyId,
      designationName: { $regex: new RegExp(`^${escapedName}$`, 'i') }
    });

    if (existingDesig) {
      return NextResponse.json({ error: 'A designation with this name already exists' }, { status: 400 });
    }

    const newDesig = await Designation.create({
      companyId,
      designationName: trimmedName,
      level: level !== undefined ? Number(level) : 1
    });

    return NextResponse.json(newDesig, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create designation:', error);
    return NextResponse.json({ error: 'Failed to create designation', details: error.message }, { status: 500 });
  }
}
