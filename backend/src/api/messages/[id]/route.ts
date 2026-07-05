import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Message } from '@/app/api/models/Message';
import { Channel } from '@/app/api/models/Channel';
import { verifyAuth } from '@/app/api/lib/auth';
import { AuditLog } from '@/app/api/models/AuditLog';
import { emitToRoom } from '@/app/config/socket';

function normalizeEmail(email?: string) {
  return (email || '').trim().toLowerCase();
}

function getMessageRooms(message: any) {
  if (message.type === 'channel' && message.channelId) {
    return [`channel:${message.channelId}`];
  }

  if (message.toEmail === 'all') {
    return [`company:${message.companyId}`];
  }

  return [
    `user:${normalizeEmail(message.fromEmail)}`,
    `user:${normalizeEmail(message.toEmail)}`
  ].filter(room => room !== 'user:');
}

async function canEditMessage(message: any, userEmail: string, userRole: string): Promise<boolean> {
  if (message.fromEmail === userEmail) return true;
  if (['Admin', 'Company Admin', 'Super Admin', 'HR'].includes(userRole || '')) return true;
  if (message.type === 'channel' && message.channelId) {
    const channel = await Channel.findOne({ companyId: message.companyId, _id: message.channelId }).select('members createdAt').lean();
    if (channel && (channel as any).members?.includes(userEmail)) return true;
  }
  return false;
}

// PATCH: Update message (read status, pinned status, or edit body)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectToDatabase();

    const message = await Message.findById(id);
    if (!message || message.isDeleted) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    if (message.companyId !== decoded.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const allowed = await canEditMessage(message, decoded.email, decoded.role);
    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden: You cannot edit this message' }, { status: 403 });
    }

    let bodyData: any = {};
    try {
      bodyData = await req.json();
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const editFields = ['messageBody', 'pinned', 'isRead'];
    const hasValidField = editFields.some(f => bodyData[f] !== undefined);

    if (bodyData.messageBody !== undefined) {
      message.body = String(bodyData.messageBody).slice(0, 10000);
    }
    if (bodyData.isRead !== undefined) {
      message.isRead = Boolean(bodyData.isRead);
      if (bodyData.isRead && !message.isReadBy?.includes(decoded.email)) {
        message.isReadBy = [...(message.isReadBy || []), decoded.email];
      }
    }
    if (bodyData.pinned !== undefined) {
      message.pinned = Boolean(bodyData.pinned);
    }

    if (!hasValidField) {
      message.isRead = true;
      if (!message.isReadBy?.includes(decoded.email)) {
        message.isReadBy = [...(message.isReadBy || []), decoded.email];
      }
    }

    await message.save();

    if (bodyData.messageBody !== undefined) {
      await AuditLog.create({
        companyId: message.companyId,
        userEmail: decoded.email,
        action: 'message.edit',
        targetType: 'Message',
        targetId: message._id.toString(),
        metadata: { from: message.body, to: bodyData.messageBody }
      });
    }

    getMessageRooms(message).forEach(room => {
      emitToRoom(room, 'message_updated', message.toObject?.() || message);
    });

    return NextResponse.json({ success: true, message: 'Message updated successfully', data: message }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update message', details: error.message }, { status: 500 });
  }
}

// DELETE: Soft-delete/Unsend message
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectToDatabase();

    const message = await Message.findById(id);
    if (!message || message.isDeleted) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    if (message.companyId !== decoded.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const allowed = await canEditMessage(message, decoded.email, decoded.role);
    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden: You cannot delete this message' }, { status: 403 });
    }

    message.isDeleted = true;
    message.body = '[Message deleted]';
    message.attachments = [];
    await message.save();

    await AuditLog.create({
      companyId: message.companyId,
      userEmail: decoded.email,
      action: 'message.delete',
      targetType: 'Message',
      targetId: message._id.toString(),
      metadata: { fromEmail: message.fromEmail, channelId: message.channelId }
    });

    getMessageRooms(message).forEach(room => {
      emitToRoom(room, 'message_deleted', { id, messageId: id });
    });

    return NextResponse.json({ success: true, message: 'Message deleted successfully' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete message', details: error.message }, { status: 500 });
  }
}
