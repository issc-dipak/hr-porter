import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Message } from '@/app/api/models/Message';
import { verifyAuth } from '@/app/api/lib/auth';
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

function emitReactionUpdate(message: any) {
  const payload = {
    messageId: message._id.toString(),
    reactions: message.reactions
  };

  getMessageRooms(message).forEach(room => {
    emitToRoom(room, 'reactions_updated', payload);
  });
}

// POST: Add reaction to a message
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json() as any;
    const { emoji } = body;

    if (!emoji) {
      return NextResponse.json({ error: 'Emoji is required' }, { status: 400 });
    }

    await connectToDatabase();

    const message = await Message.findById(id);
    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    if (message.companyId !== decoded.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if user already reacted with this exact emoji
    const exists = message.reactions.some(r => r.emoji === emoji && r.email === decoded.email);
    if (!exists) {
      message.reactions.push({
        emoji,
        email: decoded.email,
        name: decoded.fullName || decoded.email
      });
      await message.save();
    }

    emitReactionUpdate(message);

    return NextResponse.json({ message: 'Reaction added successfully', data: message.reactions }, { status: 200 });
  } catch (error: any) {
    console.error('POST /api/messages/[id]/reactions error:', error);
    return NextResponse.json({ error: 'Failed to add reaction' }, { status: 500 });
  }
}

// DELETE: Remove reaction from a message
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    
    // Attempt to extract emoji from query params or JSON body
    let emoji = '';
    const url = new URL(req.url);
    emoji = url.searchParams.get('emoji') || '';

    if (!emoji) {
      try {
        const body = await req.json() as any;
        emoji = body.emoji;
      } catch (err) {
        // Body was empty or invalid
      }
    }

    if (!emoji) {
      return NextResponse.json({ error: 'Emoji parameter is required' }, { status: 400 });
    }

    await connectToDatabase();

    const message = await Message.findById(id);
    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    if (message.companyId !== decoded.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Filter out the user's specific emoji reaction
    message.reactions = message.reactions.filter(
      r => !(r.emoji === emoji && r.email === decoded.email)
    );
    await message.save();

    emitReactionUpdate(message);

    return NextResponse.json({ message: 'Reaction removed successfully', data: message.reactions }, { status: 200 });
  } catch (error: any) {
    console.error('DELETE /api/messages/[id]/reactions error:', error);
    return NextResponse.json({ error: 'Failed to remove reaction' }, { status: 500 });
  }
}
