import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Designation } from '@/app/models/Designation';
import { Employee } from '@/app/models/Employee';
import { verifyAuth } from '@/app/api/lib/auth';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const companyId = decoded.companyId;
    const { id } = await params;
    const body = await req.json() as any;
    const { designationName, level } = body;

    await connectToDatabase();

    const desig = await Designation.findOne({ _id: id, companyId });
    if (!desig) {
      return NextResponse.json({ error: 'Designation not found' }, { status: 404 });
    }

    if (designationName !== undefined) {
      const trimmedName = designationName.trim();
      if (!trimmedName) {
        return NextResponse.json({ error: 'Designation name cannot be empty' }, { status: 400 });
      }

      const escapedName = trimmedName.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
      const existingDesig = await Designation.findOne({
        companyId,
        designationName: { $regex: new RegExp(`^${escapedName}$`, 'i') },
        _id: { $ne: id }
      });

      if (existingDesig) {
        return NextResponse.json({ error: 'A designation with this name already exists' }, { status: 400 });
      }
      desig.designationName = trimmedName;
    }

    if (level !== undefined) desig.level = Number(level);

    await desig.save();

    return NextResponse.json(desig, { status: 200 });
  } catch (error: any) {
    console.error('Failed to update designation:', error);
    return NextResponse.json({ error: 'Failed to update designation', details: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const companyId = decoded.companyId;
    const { id } = await params;

    await connectToDatabase();

    const desig = await Designation.findOne({ _id: id, companyId });
    if (!desig) {
      return NextResponse.json({ error: 'Designation not found' }, { status: 404 });
    }

    // Check if any employees are assigned to this designation (either by designationId or legacy name fallback)
    const employeeCount = await Employee.countDocuments({
      companyId,
      $or: [
        { designationId: id },
        { designation: desig.designationName, designationId: { $in: ['', null, undefined] } }
      ]
    });

    if (employeeCount > 0) {
      // Look for an alternate designation with the exact same name to merge employees into
      const alternateDesig = await Designation.findOne({
        companyId,
        designationName: desig.designationName,
        _id: { $ne: id }
      });

      if (alternateDesig) {
        // Seamless migration: update all employees pointing to the deleted designation to point to the alternate one
        await Employee.updateMany(
          {
            companyId,
            $or: [
              { designationId: id },
              { designation: desig.designationName, designationId: { $in: ['', null, undefined] } }
            ]
          },
          {
            $set: {
              designationId: alternateDesig._id.toString(),
              designation: alternateDesig.designationName
            }
          }
        );
      } else {
        return NextResponse.json({
          error: `Cannot delete designation. There are ${employeeCount} employees currently assigned to this designation.`
        }, { status: 400 });
      }
    }

    await Designation.deleteOne({ _id: id, companyId });

    return NextResponse.json({ success: true, message: 'Designation deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Failed to delete designation:', error);
    return NextResponse.json({ error: 'Failed to delete designation', details: error.message }, { status: 500 });
  }
}
