import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Channel } from '@/app/api/models/Channel';
import { verifyAuth } from '@/app/api/lib/auth';
import { User } from '@/app/api/models/User';
import { sendEmail } from '@/app/api/lib/email';

// PATCH: Edit channel settings or pinned messages
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json() as any;
    const { name, description, pinnedMessages } = body;

    await connectToDatabase();

    const channel = await Channel.findById(id);
    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    if (channel.companyId !== decoded.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check permissions if channel is private (only members can update)
    if (channel.isPrivate && !channel.members.includes(decoded.email) && channel.createdBy !== decoded.email) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updates: any = {};
    if (name !== undefined) {
      updates.name = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '');
    }
    if (description !== undefined) updates.description = description;
    if (pinnedMessages !== undefined) updates.pinnedMessages = pinnedMessages;

    const updatedChannel = await Channel.findByIdAndUpdate(id, updates, { new: true });

    return NextResponse.json({ message: 'Channel updated successfully', data: updatedChannel }, { status: 200 });
  } catch (error: any) {
    console.error('PATCH /api/channels/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update channel' }, { status: 500 });
  }
}

// POST: Join, leave, or invite members to channels
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json() as any;
    const { action, email, emails } = body; // action: 'join' | 'leave' | 'invite'

    await connectToDatabase();

    const channel = await Channel.findById(id);
    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    if (channel.companyId !== decoded.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let updatedMembers = [...channel.members];

    if (action === 'join') {
      if (!updatedMembers.includes(decoded.email)) {
        updatedMembers.push(decoded.email);
      }
    } else if (action === 'leave') {
      updatedMembers = updatedMembers.filter(m => m !== decoded.email);
    } else if (action === 'invite') {
      const invitees = emails || (email ? [email] : []);
      const sender = await User.findOne({ email: decoded.email, companyId: decoded.companyId });
      const senderName = sender ? sender.fullName : decoded.email;
      const companyName = sender ? sender.companyName : 'HR System';
      const origin = req.headers.get('origin') || 'http://localhost:3000';

      for (const inv of invitees) {
        if (!updatedMembers.includes(inv)) {
          updatedMembers.push(inv);
        }

        try {
          const userExists = await User.findOne({ email: inv, companyId: decoded.companyId });
          let subject = '';
          let text = '';
          let html = '';

          if (userExists) {
            subject = `Invitation to join #${channel.name} channel`;
            const appLink = `${origin}`;
            text = `Hi,\n\n${senderName} has added you to the channel #${channel.name} in ${companyName}'s HR System.\n\nGo to the messages section to view and start chatting: ${appLink}\n\nBest regards,\nHR System Team`;
            html = `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #1e293b; border-radius: 12px; background-color: #0b0f19; color: #ffffff;">
                <h2 style="color: #6366f1; margin-top: 0; font-size: 20px;">New Channel Invitation</h2>
                <p style="font-size: 14px; line-height: 1.5; color: #94a3b8;">
                  Hi there,
                </p>
                <p style="font-size: 14px; line-height: 1.5; color: #cbd5e1;">
                  <strong>${senderName}</strong> has added you to the private channel <strong>#${channel.name}</strong> inside the <strong>${companyName}</strong> workspace.
                </p>
                <div style="margin: 25px 0; text-align: center;">
                  <a href="${appLink}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">Open HR System</a>
                </div>
                <p style="font-size: 12px; color: #64748b; margin-top: 30px; border-top: 1px solid #1e293b; padding-top: 15px;">
                  This is an automated notification. If you did not expect this, you can safely ignore this email.
                </p>
              </div>
            `;
          } else {
            subject = `Invitation to join ${companyName}'s workspace on HR System`;
            const signupLink = `${origin}?mode=signup&email=${encodeURIComponent(inv)}&company=${encodeURIComponent(companyName)}`;
            text = `Hi,\n\n${senderName} has invited you to join the channel #${channel.name} in ${companyName}'s HR System.\n\nTo join, please create a profile and sign up using this link:\n${signupLink}\n\nBest regards,\nHR System Team`;
            html = `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #1e293b; border-radius: 12px; background-color: #0b0f19; color: #ffffff;">
                <h2 style="color: #6366f1; margin-top: 0; font-size: 20px;">Workspace Invitation</h2>
                <p style="font-size: 14px; line-height: 1.5; color: #94a3b8;">
                  Hi there,
                </p>
                <p style="font-size: 14px; line-height: 1.5; color: #cbd5e1;">
                  <strong>${senderName}</strong> has invited you to join the private channel <strong>#${channel.name}</strong> and sign up for <strong>${companyName}</strong>'s HR workspace.
                </p>
                <p style="font-size: 14px; line-height: 1.5; color: #cbd5e1;">
                  Please click the button below to register your profile and access the channel. Your email and company details will be automatically prefilled:
                </p>
                <div style="margin: 25px 0; text-align: center;">
                  <a href="${signupLink}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">Accept Invitation & Sign Up</a>
                </div>
                <p style="font-size: 11px; color: #64748b; margin-top: 35px; border-top: 1px solid #1e293b; padding-top: 15px; word-break: break-all;">
                  Or copy and paste this URL into your browser:<br />
                  <a href="${signupLink}" style="color: #818cf8;">${signupLink}</a>
                </p>
              </div>
            `;
          }

          await sendEmail({
            to: inv,
            subject,
            text,
            html
          });
        } catch (mailErr) {
          console.error(`Failed to send invitation email to ${inv}:`, mailErr);
        }
      }
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    channel.members = updatedMembers;
    await channel.save();

    return NextResponse.json({ message: 'Channel members updated', data: channel }, { status: 200 });
  } catch (error: any) {
    console.error('POST /api/channels/[id] members error:', error);
    return NextResponse.json({ error: 'Failed to update members' }, { status: 500 });
  }
}

// DELETE: Delete a channel (Only for Admins)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['Admin', 'HR', 'Employee', 'Company Admin', 'Super Admin'].includes(decoded.role)) {
      return NextResponse.json({ error: `Forbidden: Unauthorized role ${decoded.role}` }, { status: 403 });
    }

    const { id } = await params;
    await connectToDatabase();

    const channel = await Channel.findById(id);
    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    if (channel.companyId !== decoded.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Prevent deleting default channels: general, announcements
    if (channel.name === 'general' || channel.name === 'announcements') {
      return NextResponse.json({ error: 'Cannot delete default system channels' }, { status: 400 });
    }

    await Channel.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Channel deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('DELETE /api/channels/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete channel' }, { status: 500 });
  }
}
