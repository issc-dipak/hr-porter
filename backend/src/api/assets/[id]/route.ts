import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Asset } from '@/app/api/models/Asset';
import { verifyAuth } from '@/app/api/lib/auth';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyName = decoded.companyName;
    const { id } = await params;
    const data = await req.json() as any;

    await connectToDatabase();
    
    // Find the asset first to verify it belongs to the same company
    const asset = await Asset.findById(id);
    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }
    
    if (asset.companyName !== companyName) {
      return NextResponse.json({ error: 'Forbidden: You do not own this record' }, { status: 403 });
    }

    const oldAssignedTo = asset.assignedTo;
    const oldStatus = asset.status;

    // Update the allowed fields
    const allowedFields = ['name', 'type', 'serialNumber', 'assignedTo', 'status', 'assignedDate', 'value'];
    allowedFields.forEach((field) => {
      if (data[field] !== undefined) {
        (asset as any)[field] = data[field];
      }
    });

    await asset.save();

    // Trigger System Notification
    try {
      const { SystemNotificationService } = await import('../../../services/systemNotificationService');

      if (asset.assignedTo && asset.assignedTo !== oldAssignedTo) {
        // Asset assigned to a new user
        await SystemNotificationService.createNotification({
          companyId: decoded.companyId,
          userId: asset.assignedTo,
          title: 'Asset Assigned',
          content: `You have been assigned the asset: "${asset.name}" (${asset.type}). Serial: ${asset.serialNumber}.`,
          type: 'other',
          targetPage: 'dashboard'
        });
      } else if (!asset.assignedTo && oldAssignedTo) {
        // Asset unassigned
        await SystemNotificationService.createNotification({
          companyId: decoded.companyId,
          userId: oldAssignedTo,
          title: 'Asset Returned',
          content: `Your assigned asset "${asset.name}" has been marked as returned/released.`,
          type: 'other',
          targetPage: 'dashboard'
        });
      } else if (asset.assignedTo && asset.status !== oldStatus) {
        // Asset status updated
        await SystemNotificationService.createNotification({
          companyId: decoded.companyId,
          userId: asset.assignedTo,
          title: 'Asset Status Updated',
          content: `The status of your assigned asset "${asset.name}" has been updated to: ${asset.status}.`,
          type: 'other',
          targetPage: 'dashboard'
        });
      }
    } catch (notifErr) {
      console.error('Failed to trigger asset notification:', notifErr);
    }
    return NextResponse.json(asset, { status: 200 });
  } catch (error: any) {
    console.error('Failed to update asset:', error);
    return NextResponse.json({ error: 'Failed to update asset', details: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyName = decoded.companyName;
    const { id } = await params;

    await connectToDatabase();

    const asset = await Asset.findById(id);
    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    if (asset.companyName !== companyName) {
      return NextResponse.json({ error: 'Forbidden: You do not own this record' }, { status: 403 });
    }

    await Asset.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Asset deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Failed to delete asset:', error);
    return NextResponse.json({ error: 'Failed to delete asset', details: error.message }, { status: 500 });
  }
}
