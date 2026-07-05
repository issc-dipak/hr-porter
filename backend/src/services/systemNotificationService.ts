import { SystemNotification, ISystemNotification } from '../models/SystemNotification';
import { User } from '../models/User';
import { emitToUser } from '../config/socket';

export interface CreateNotificationInput {
  companyId: string;
  userId: string; // Recipient email
  title: string;
  content: string;
  type: 'leave' | 'payroll' | 'ticket' | 'announcement' | 'daily-update' | 'expense' | 'task' | 'policy' | 'recruitment' | 'other';
  targetPage: string;
}

export class SystemNotificationService {
  /**
   * Create a single notification for a user and emit via socket.
   */
  static async createNotification(input: CreateNotificationInput): Promise<ISystemNotification> {
    const notification = await SystemNotification.create({
      companyId: input.companyId,
      userId: input.userId.toLowerCase().trim(),
      title: input.title,
      content: input.content,
      type: input.type,
      targetPage: input.targetPage,
      read: false
    });

    // Send via socket real-time room
    emitToUser(input.userId, 'system_notification', notification);

    return notification;
  }

  /**
   * Send a notification to all users matching specific roles in a company.
   */
  static async notifyRoles(
    companyId: string,
    roles: ('Super Admin' | 'Company Admin' | 'Admin' | 'HR' | 'Manager' | 'Employee')[],
    input: Omit<CreateNotificationInput, 'userId'>
  ): Promise<ISystemNotification[]> {
    // Find all users in company with the target roles
    const users = await User.find({
      companyId,
      role: { $in: roles },
      status: 'Active'
    });

    const notifications: ISystemNotification[] = [];

    for (const user of users) {
      const notification = await this.createNotification({
        ...input,
        userId: user.email
      });
      notifications.push(notification);
    }

    return notifications;
  }

  /**
   * Send a notification to all active users in a company (e.g. for general announcements).
   */
  static async notifyAllUsers(
    companyId: string,
    input: Omit<CreateNotificationInput, 'userId'>
  ): Promise<ISystemNotification[]> {
    const users = await User.find({
      companyId,
      status: 'Active'
    });

    const notifications: ISystemNotification[] = [];

    for (const user of users) {
      const notification = await this.createNotification({
        ...input,
        userId: user.email
      });
      notifications.push(notification);
    }

    return notifications;
  }
}
