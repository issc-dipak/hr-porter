import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/api/lib/mongodb';
import { Task } from '@/app/api/models/Task';
import { verifyAuth } from '@/app/api/lib/auth';

// GET single task
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    await connectToDatabase();
    const task = await Task.findById(id);
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    if (task.companyId !== decoded.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json(task, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch task', details: error.message }, { status: 500 });
  }
}

// PUT update task
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    const data = await req.json() as any;
    await connectToDatabase();
    const task = await Task.findById(id);
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    if (task.companyId !== decoded.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // If status changed to Done, record completedAt
    if (data.status === 'Done' && !data.completedAt) {
      data.completedAt = new Date().toISOString();
      data.completionPercent = 100;
    }

    // Add avatar if missing
    if (data.assignedTo && !data.avatar) {
      data.avatar = data.assignedTo.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);
    }

    const updatedTask = await Task.findByIdAndUpdate(id, data, { new: true });

    // Send task update notifications
    if (updatedTask) {
      try {
        const { SystemNotificationService } = await import('../../../services/systemNotificationService');
        const { User } = await import('../../../models/User');

        let targetEmail = updatedTask.assignedToEmail;
        if (!targetEmail && updatedTask.assignedTo) {
          const matchingUser = await User.findOne({ fullName: updatedTask.assignedTo, companyId: decoded.companyId });
          if (matchingUser && matchingUser.email) {
            targetEmail = matchingUser.email;
          }
        }

        if (data.status === 'Done' && task.status !== 'Done') {
          // Task completed. Notify Admin and HR roles
          await SystemNotificationService.notifyRoles(decoded.companyId, ['Admin', 'HR'], {
            companyId: decoded.companyId,
            title: 'Task Completed',
            content: `Task "${updatedTask.title}" was marked as completed by ${decoded.fullName}.`,
            type: 'task',
            targetPage: 'dashboard'
          });
        } else if (decoded.role !== 'Employee') {
          // Admin/HR modified the task. Notify assignee.
          if (targetEmail) {
            await SystemNotificationService.createNotification({
              companyId: decoded.companyId,
              userId: targetEmail,
              title: 'Task Updated',
              content: `Your assigned task "${updatedTask.title}" has been updated by ${decoded.fullName}.`,
              type: 'task',
              targetPage: 'dashboard'
            });
          }
        }
      } catch (notifErr) {
        console.error('Failed to trigger task update notification:', notifErr);
      }
    }

    return NextResponse.json({ message: 'Task updated successfully', task: updatedTask }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update task', details: error.message }, { status: 500 });
  }
}

// DELETE task
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    await connectToDatabase();
    const task = await Task.findById(id);
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    if (task.companyId !== decoded.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    await Task.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Task deleted successfully' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete task', details: error.message }, { status: 500 });
  }
}
