import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Message } from '@/app/api/models/Message';
import { Channel } from '@/app/api/models/Channel';
import { ChatNotification } from '@/app/api/models/Notification';
import { verifyAuth } from '@/app/api/lib/auth';
import { emitToRoom, emitToUser } from '@/app/config/socket';

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

function extractMentionEmails(text: string, explicitMentions: string[] = []) {
  const mentions = new Set(explicitMentions.map(normalizeEmail).filter(Boolean));
  const emailMentions: string[] = text.match(/@([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/gi) || [];

  emailMentions.forEach(mention => {
    mentions.add(normalizeEmail(mention.slice(1)));
  });

  return Array.from(mentions);
}

export async function GET(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = decoded.companyId;
    const { searchParams } = new URL(req.url);
    const channelId = searchParams.get('channelId');
    const toEmail = searchParams.get('toEmail');
    const type = searchParams.get('type');
    const threadParentId = searchParams.get('threadParentId');
    const before = searchParams.get('before');
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50', 10) || 50, 1), 200);

    await connectToDatabase();

    const query: any = { companyId, isDeleted: { $ne: true } };

    if (threadParentId) {
      query.threadParentId = threadParentId;
    } else if (type === 'channel' && channelId) {
      const isObjectId = mongoose.isValidObjectId(channelId);
      const channelFilter: any = { companyId };
      if (isObjectId) {
        channelFilter.$or = [{ _id: channelId }, { name: channelId }];
      } else {
        channelFilter.name = channelId;
      }
      const channel = await Channel.findOne(channelFilter);
      if (!channel) {
        return NextResponse.json([], { status: 200 });
      }
      if (channel.isPrivate && !channel.members.includes(decoded.email) && channel.createdBy !== decoded.email) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      query.type = 'channel';
      query.channelId = channel._id.toString();
    } else if (type === 'direct' && toEmail) {
      const partner = normalizeEmail(toEmail);
      query.$or = [
        { type: 'direct', fromEmail: decoded.email, toEmail: partner },
        { type: 'direct', fromEmail: partner, toEmail: decoded.email }
      ];
    } else {
      query.$or = [
        { toEmail: decoded.email },
        { fromEmail: decoded.email },
        { toEmail: 'all' },
        { type: 'channel', channelId: { $in: (await Channel.find({ companyId, $or: [{ isPrivate: false }, { members: decoded.email }] }).select('_id').lean()).map(c => c._id.toString()) } }
      ];
    }

    if (before) {
      query.sentAt = { ...query.sentAt, $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .sort({ sentAt: -1 })
      .limit(limit)
      .lean();

    const sorted = messages.reverse();
    return NextResponse.json(sorted, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/messages error:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
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
    const { toEmail, toName, subject, messageBody, type, channelId, threadParentId, attachments, mentions } = body;
    const mentionEmails = extractMentionEmails(messageBody || '', mentions || []);

    if (!messageBody && (!attachments || attachments.length === 0)) {
      return NextResponse.json({ error: 'Message body or attachments are required' }, { status: 400 });
    }

    await connectToDatabase();

    let resolvedChannelId = channelId || '';
    if (type === 'channel') {
      if (!resolvedChannelId) {
        return NextResponse.json({ error: 'Channel ID is required for channel type messages' }, { status: 400 });
      }
      const isObjectId = mongoose.isValidObjectId(resolvedChannelId);
      const channel = await Channel.findOne({
        companyId,
        $or: [
          isObjectId ? { _id: resolvedChannelId } : null,
          { name: resolvedChannelId }
        ].filter(Boolean) as any[]
      });

      if (!channel) {
        return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
      }

      if (channel.isPrivate) {
        const isCreator = channel.createdBy === decoded.email;
        const isMember = channel.members.includes(decoded.email);
        if (!isCreator && !isMember) {
          return NextResponse.json({ error: 'Forbidden: You are not a member of this private channel' }, { status: 403 });
        }
      }
      resolvedChannelId = channel._id.toString();
    }

    const newMessage = await Message.create({
      fromEmail: decoded.email,
      fromName: body.fromName || decoded.fullName || decoded.email,
      fromRole: decoded.role || 'Employee',
      toEmail: toEmail || (type === 'channel' ? resolvedChannelId : 'all'),
      toName: toName || '',
      subject: subject || (type === 'channel' ? `Channel Chat: ${resolvedChannelId}` : 'Direct Chat'),
      body: messageBody,
      type: type || 'direct',
      channelId: resolvedChannelId,
      threadParentId: threadParentId || '',
      attachments: attachments || [],
      mentions: mentionEmails,
      reactions: [],
      isRead: false,
      isReadBy: [decoded.email],
      companyId,
      sentAt: new Date()
    });

    const notificationRecipients = new Map<string, 'direct_message' | 'mention' | 'channel_message'>();

    if (newMessage.type === 'direct' && newMessage.toEmail && newMessage.toEmail !== 'all') {
      notificationRecipients.set(normalizeEmail(newMessage.toEmail), 'direct_message');
    }

    mentionEmails.forEach(email => {
      if (email !== normalizeEmail(decoded.email)) {
        notificationRecipients.set(email, 'mention');
      }
    });

    if (type === 'channel' && resolvedChannelId) {
      const channel = await Channel.findOne({ _id: resolvedChannelId, companyId });
      if (channel?.isPrivate) {
        channel.members.forEach(email => {
          const recipient = normalizeEmail(email);
          if (recipient && recipient !== normalizeEmail(decoded.email) && !notificationRecipients.has(recipient)) {
            notificationRecipients.set(recipient, 'channel_message');
          }
        });
      }
    }

    const contentSnippet = (newMessage.body || attachments?.[0]?.name || 'Attachment').slice(0, 160);
    const notifications = await ChatNotification.insertMany(
      Array.from(notificationRecipients.entries()).map(([userId, notificationType]) => ({
        companyId,
        userId,
        senderEmail: normalizeEmail(decoded.email),
        senderName: newMessage.fromName,
        senderAvatar: body.senderAvatar || '',
        type: notificationType,
        entityId: newMessage.type === 'channel' ? (newMessage.channelId || newMessage._id.toString()) : newMessage._id.toString(),
        content: contentSnippet,
        read: false
      })),
      { ordered: false }
    ).catch(() => []);

    getMessageRooms(newMessage).forEach(room => {
      emitToRoom(room, 'new_message', newMessage);
    });

    notifications.forEach((notification: any) => {
      emitToUser(notification.userId, 'notification', notification);
    });

    return NextResponse.json({ message: 'Message sent successfully', data: newMessage }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/messages error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
