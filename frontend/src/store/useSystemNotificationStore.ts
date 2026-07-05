import { create } from 'zustand';

export interface SystemNotification {
  _id: string;
  companyId: string;
  userId: string;
  title: string;
  content: string;
  type: 'leave' | 'payroll' | 'ticket' | 'announcement' | 'daily-update' | 'other';
  targetPage: string;
  read: boolean;
  createdAt: string;
}

interface SystemNotificationState {
  notifications: SystemNotification[];
  fetchNotifications: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  addNotificationLocally: (notification: SystemNotification) => void;
}

export const useSystemNotificationStore = create<SystemNotificationState>((set, get) => ({
  notifications: [],

  fetchNotifications: async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('hr_system_token') : null;
    if (!token) return;
    try {
      const res = await fetch('/api/system-notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const result = await res.json();
        set({ notifications: result.data || [] });
      }
    } catch (err) {
      console.error('Failed to fetch system notifications:', err);
    }
  },

  markRead: async (id: string) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('hr_system_token') : null;
    if (!token) return;
    try {
      const res = await fetch('/api/system-notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ notificationId: id })
      });
      if (res.ok) {
        set(state => ({
          notifications: state.notifications.filter(n => n._id !== id)
        }));
      }
    } catch (err) {
      console.error('Failed to mark system notification read:', err);
    }
  },

  markAllRead: async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('hr_system_token') : null;
    if (!token) return;
    try {
      const res = await fetch('/api/system-notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ all: true })
      });
      if (res.ok) {
        set({ notifications: [] });
      }
    } catch (err) {
      console.error('Failed to mark all system notifications read:', err);
    }
  },

  addNotificationLocally: (notification: SystemNotification) => {
    set(state => {
      // Avoid duplicates
      if (state.notifications.some(n => n._id === notification._id)) return {};
      return { notifications: [notification, ...state.notifications] };
    });
  }
}));
