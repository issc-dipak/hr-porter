import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Conversation } from '@/app/api/models/Conversation';
import { verifyAuth } from '@/app/api/lib/auth';

// GET: Fetch all active DMs and Group conversations for the user in the company workspace
export async function GET(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = decoded.companyId;

    await connectToDatabase();

    const conversations = await Conversation.find({
      companyId,
      members: decoded.email
    }).sort({ updatedAt: -1 });

    return NextResponse.json(conversations, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/conversations error:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations list' }, { status: 500 });
  }
}

// POST: Create or fetch a DM/Group conversation
export async function POST(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = decoded.companyId;

    const body = await req.json() as any;
    const { name, type, members = [] } = body; // type: 'dm' | 'group'

    if (!type || (type === 'group' && !name)) {
      return NextResponse.json({ error: 'Group conversations require a name and valid type' }, { status: 400 });
    }

    await connectToDatabase();

    // Clean and verify members emails
    const cleanMembers = Array.from(new Set([decoded.email, ...members].map(e => e.trim().toLowerCase())));

    if (type === 'dm') {
      // Check if direct conversation already exists between these two users
      if (cleanMembers.length !== 2) {
        return NextResponse.json({ error: 'Direct messages must have exactly 2 participants' }, { status: 400 });
      }

      const existing = await Conversation.findOne({
        companyId,
        type: 'dm',
        members: { $all: cleanMembers, $size: 2 }
      });

      if (existing) {
        return NextResponse.json({ message: 'Conversation retrieved', data: existing }, { status: 200 });
      }
    }

    const newConversation = await Conversation.create({
      name: name || '',
      type,
      members: cleanMembers,
      companyId,
      createdBy: decoded.email
    });

    return NextResponse.json({ message: 'Conversation created successfully', data: newConversation }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/conversations error:', error);
    return NextResponse.json({ error: 'Failed to build conversation room' }, { status: 500 });
  }
}

