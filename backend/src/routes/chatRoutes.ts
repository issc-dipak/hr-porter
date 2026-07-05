import { Router } from 'express';
import { handleWebRoute } from '../adaptor';
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

// Import Database & Authentication Helpers
import connectToDatabase from '../api/lib/mongodb';
import { verifyAuth } from '../api/lib/auth';
import { emitToRoom, emitToUser } from '../config/socket';

// Import Models
import { Channel } from '../models/Channel';
import { Message } from '../models/Message';
import { Conversation } from '../models/Conversation';
import { ChatNotification } from '../models/Notification';

// Import route handlers
import { GET as getChannels, POST as createChannel } from '../api/channels/route';
import { PATCH as updateChannel, POST as inviteToChannel, DELETE as deleteChannel } from '../api/channels/[id]/route';
import { GET as getMessages, POST as createMessage } from '../api/messages/route';
import { GET as getBirthdayMessages, POST as sendBirthdayWishes } from '../api/messages/birthday/route';
import { PATCH as updateMessage, DELETE as deleteMessage } from '../api/messages/[id]/route';
import { POST as reactToMessage, DELETE as removeReaction } from '../api/messages/[id]/reactions/route';
import { GET as globalSearch } from '../api/search/global/route';
import { GET as getConversations, POST as createConversation } from '../api/conversations/route';
import { GET as getMeetings, POST as joinOrLeaveMeeting } from '../api/meetings/route';
import { GET as getNotifications, PUT as markNotificationsRead } from '../api/notifications/route';
import { POST as uploadFile } from '../api/upload/route';

// Custom /chat route wrappers
async function getChannelMessages(req: Request, context: any) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { channelId } = await context.params;
    await connectToDatabase();

    const isObjectId = mongoose.isValidObjectId(channelId);
    const channel = await Channel.findOne({
      companyId: decoded.companyId,
      $or: [
        isObjectId ? { _id: channelId } : null,
        { name: channelId }
      ].filter(Boolean) as any[]
    });

    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    if (channel.isPrivate && !channel.members.includes(decoded.email) && channel.createdBy !== decoded.email) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const messages = await Message.find({
      companyId: decoded.companyId,
      type: 'channel',
      channelId: channel._id.toString(),
      isDeleted: { $ne: true }
    }).sort({ sentAt: 1 }).lean();

    return NextResponse.json(messages, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch messages', details: error.message }, { status: 500 });
  }
}

function getMessageRooms(message: any) {
  if (message.type === 'channel' && message.channelId) {
    return [`channel:${message.channelId}`];
  }

  if (message.toEmail === 'all') {
    return [`company:${message.companyId}`];
  }

  return [
    `user:${message.fromEmail.trim().toLowerCase()}`,
    `user:${message.toEmail.trim().toLowerCase()}`
  ].filter(room => room !== 'user:');
}

async function createDirectMessage(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json() as any;
    const { toEmail, messageBody, attachments = [], mentions = [] } = body;
    
    if (!toEmail) {
      return NextResponse.json({ error: 'Recipient email is required' }, { status: 400 });
    }

    if (!messageBody && (!attachments || attachments.length === 0)) {
      return NextResponse.json({ error: 'Message body or attachments are required' }, { status: 400 });
    }

    await connectToDatabase();

    const senderEmail = decoded.email.trim().toLowerCase();
    const recipientEmail = toEmail.trim().toLowerCase();
    const cleanMembers = [senderEmail, recipientEmail].sort();

    let conv = await Conversation.findOne({
      companyId: decoded.companyId,
      type: 'dm',
      members: { $all: cleanMembers, $size: 2 }
    });

    if (!conv) {
      conv = await Conversation.create({
        type: 'dm',
        members: cleanMembers,
        companyId: decoded.companyId,
        createdBy: decoded.email
      });
    }

    const newMessage = await Message.create({
      fromEmail: decoded.email,
      fromName: body.fromName || decoded.fullName || decoded.email.split('@')[0],
      fromRole: decoded.role || 'Employee',
      toEmail: recipientEmail,
      toName: toEmail.split('@')[0],
      subject: 'Direct Chat',
      body: messageBody || '',
      type: 'direct',
      attachments: attachments,
      mentions: mentions,
      reactions: [],
      isRead: false,
      isReadBy: [decoded.email],
      companyId: decoded.companyId,
      sentAt: new Date()
    });

    // Update conversation lastMessage
    conv.set('lastMessage', newMessage);
    await conv.save();

    // Emit via sockets
    getMessageRooms(newMessage).forEach(room => {
      emitToRoom(room, 'new_message', newMessage);
    });

    // Create Notification
    const contentSnippet = (newMessage.body || attachments?.[0]?.name || 'Attachment').slice(0, 160);
    const notification = await ChatNotification.create({
      companyId: decoded.companyId,
      userId: recipientEmail,
      senderEmail,
      senderName: newMessage.fromName,
      senderAvatar: body.senderAvatar || '',
      type: 'direct_message',
      entityId: newMessage._id.toString(),
      content: contentSnippet,
      read: false
    });

    emitToUser(recipientEmail, 'notification', notification);

    return NextResponse.json({ success: true, message: 'Direct message sent successfully', data: newMessage }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to send direct message', details: error.message }, { status: 500 });
  }
}

const router = Router();

// Channel routes
router.get('/channels', handleWebRoute(getChannels));
router.post('/channels', handleWebRoute(createChannel));
router.patch('/channels/:id', handleWebRoute(updateChannel));
router.delete('/channels/:id', handleWebRoute(deleteChannel));
router.post('/channels/:id', handleWebRoute(inviteToChannel));
router.post('/chat/channels/:id', handleWebRoute(inviteToChannel));
router.delete('/chat/channels/:id', handleWebRoute(deleteChannel));
router.patch('/chat/channels/:id', handleWebRoute(updateChannel));

// Message routes
router.get('/messages', handleWebRoute(getMessages));
router.post('/messages', handleWebRoute(createMessage));
router.get('/messages/birthday', handleWebRoute(getBirthdayMessages));
router.post('/messages/birthday', handleWebRoute(sendBirthdayWishes));
router.patch('/messages/:id', handleWebRoute(updateMessage));
router.delete('/messages/:id', handleWebRoute(deleteMessage));
router.post('/messages/:id/reactions', handleWebRoute(reactToMessage));
router.delete('/messages/:id/reactions', handleWebRoute(removeReaction));

// New routes
router.get('/search/global', handleWebRoute(globalSearch));
router.get('/conversations', handleWebRoute(getConversations));
router.post('/conversations', handleWebRoute(createConversation));
router.get('/meetings', handleWebRoute(getMeetings));
router.post('/meetings/join', handleWebRoute(joinOrLeaveMeeting));
router.get('/notifications', handleWebRoute(getNotifications));
router.put('/notifications', handleWebRoute(markNotificationsRead));

// Spec-defined Chat Endpoints
router.post('/chat/channel', handleWebRoute(createChannel));
router.get('/chat/channels', handleWebRoute(getChannels));
router.post('/chat/message', handleWebRoute(createMessage));
router.get('/chat/messages/:channelId', handleWebRoute(getChannelMessages));
router.post('/chat/direct-message', handleWebRoute(createDirectMessage));
router.get('/chat/conversations', handleWebRoute(getConversations));
router.post('/chat/upload-file', handleWebRoute(uploadFile));
router.get('/chat/search', handleWebRoute(globalSearch));

export default router;
