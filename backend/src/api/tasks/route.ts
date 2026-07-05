import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Task } from '@/app/api/models/Task';
import { verifyAuth } from '@/app/api/lib/auth';

// GET all tasks
export async function GET(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = decoded.companyId;
    await connectToDatabase();
    const tasks = await Task.find({ companyId }).sort({ createdAt: -1 });
    return NextResponse.json(tasks, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch tasks', details: error.message }, { status: 500 });
  }
}

// POST a new task
export async function POST(req: Request) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = decoded.companyId;
    const data = await req.json() as any;

    if (!data.title || !data.assignedTo) {
      return NextResponse.json({ error: 'Missing required fields (title, assignedTo)' }, { status: 400 });
    }

    await connectToDatabase();

    if (!data.avatar) {
      data.avatar = data.assignedTo.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);
    }
    if (!data.due) {
      data.due = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    if (!data.dept) {
      data.dept = 'General';
    }

    const newTask = await Task.create({
      ...data,
      companyId
    });

    // Notify assignee of the new task assignment
    try {
      const { SystemNotificationService } = await import('../../services/systemNotificationService');
      const { User } = await import('../../models/User');

      let targetEmail = newTask.assignedToEmail;
      if (!targetEmail && newTask.assignedTo) {
        const matchingUser = await User.findOne({ fullName: newTask.assignedTo, companyId });
        if (matchingUser && matchingUser.email) {
          targetEmail = matchingUser.email;
        }
      }

      if (targetEmail) {
        await SystemNotificationService.createNotification({
          companyId,
          userId: targetEmail,
          title: 'New Task Assigned',
          content: `You have been assigned a new task: "${newTask.title}". Due date: ${newTask.due}.`,
          type: 'task',
          targetPage: 'dashboard'
        });
      }
    } catch (notifErr) {
      console.error('Failed to trigger task creation notification:', notifErr);
    }

    return NextResponse.json({ message: 'Task created successfully', task: newTask }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to create task', details: error.message }, { status: 500 });
  }
}
