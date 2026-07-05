import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { useSystemNotificationStore } from './useSystemNotificationStore';

export interface ChatUser {
  email: string;
  name: string;
  avatar?: string;
  role: string;
  status: 'online' | 'away' | 'offline';
  dept?: string;
}

export interface ChatMessage {
  _id: string;
  fromEmail: string;
  fromName: string;
  fromRole: string;
  fromAvatar?: string;
  toEmail?: string;
  toName?: string;
  body: string;
  sentAt: string;
  type: 'direct' | 'channel' | 'thread';
  channelId?: string;
  threadParentId?: string;
  isRead: boolean;
  isReadBy?: string[];
  reactions: { emoji: string; email: string; name: string }[];
  attachments: { name: string; url: string; type: string; size: number }[];
  mentions: string[];
  pinned: boolean;
  companyId?: string;
}

export interface ChatConversation {
  _id: string;
  name: string;
  type: 'direct' | 'channel';
  description?: string;
  members?: string[];
  isPrivate?: boolean;
  unreadCount: number;
  lastMessage?: ChatMessage;
}

export interface ChatNotification {
  _id: string;
  companyId: string;
  userId: string;
  senderEmail: string;
  senderName: string;
  senderAvatar?: string;
  type: 'direct_message' | 'mention' | 'channel_message';
  entityId: string;
  content: string;
  read: boolean;
  createdAt: string;
}

export interface TypingStatus {
  email: string;
  name: string;
  isTyping: boolean;
}

interface ChatState {
  socket: Socket | null;
  connected: boolean;
  currentUser: { email: string; name: string; companyId: string } | null;
  conversations: ChatConversation[];
  activeConversationId: string | null;
  messages: Record<string, ChatMessage[]>;
  notifications: ChatNotification[];
  typingUsers: TypingStatus[];
  onlineUsers: string[];
  typingInRoom: Record<string, boolean>;
  conversationUnread: Record<string, number>;

  initSocket: (token: string) => void;
  disconnectSocket: () => void;
  setActiveConversation: (id: string | null) => void;
  loadConversations: () => Promise<void>;
  loadMessages: (conversationId: string) => Promise<void>;
  sendMessage: (data: {
    toEmail?: string;
    channelId?: string;
    type: 'direct' | 'channel';
    body: string;
    mentions?: string[];
    attachments?: { name: string; url: string; type: string; size: number }[];
  }) => Promise<void>;
  editMessage: (messageId: string, body: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  toggleReaction: (messageId: string, emoji: string) => Promise<void>;
  markNotificationsRead: (entityId?: string, senderEmail?: string) => Promise<void>;
  loadNotifications: () => Promise<void>;
  setTyping: (roomId: string, isTyping: boolean) => void;
  addReaction: (messageId: string, emoji: string) => void;
  removeReaction: (messageId: string, emoji: string) => void;
}

const getApiUrl = () => {
  if (process.env.NEXT_PUBLIC_BACKEND_URL) return process.env.NEXT_PUBLIC_BACKEND_URL;
  if (typeof window === 'undefined') return 'http://localhost:5000';
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') return 'http://localhost:5000';
  return `${window.location.protocol}//${hostname}:5000`;
};

const token = typeof window !== 'undefined' ? localStorage.getItem('hr_system_token') : null;
const getCurrentUser = () => {
  if (typeof window === 'undefined' || !token) return null;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const decoded: any = JSON.parse(
      decodeURIComponent(
        window.atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
      )
    );
    return {
      email: decoded.email,
      name: decoded.fullName || decoded.email.split('@')[0],
      companyId: decoded.companyId || decoded.companyCode || 'company_001'
    };
  } catch {
    return null;
  }
};

export const useChatStore = create<ChatState>((set, get) => {
  let socketInstance: Socket | null = null;

  function getDmConvId(fromEmail: string, toEmail: string): string {
    const a = fromEmail.toLowerCase().trim();
    const b = toEmail.toLowerCase().trim();
    return a < b ? `${a}|${b}` : `${b}|${a}`;
  }

  return {
    socket: null,
    connected: false,
    currentUser: getCurrentUser(),
    conversations: [],
    activeConversationId: null,
    messages: {},
    notifications: [],
    typingUsers: [],
    onlineUsers: [],
    typingInRoom: {},
    conversationUnread: {},

    initSocket: (authToken: string) => {
      const user = getCurrentUser();
      if (!user) return;

      const existingSocket = get().socket;
      if (existingSocket) {
        existingSocket.removeAllListeners();
        existingSocket.disconnect();
      }

      const socket = io(getApiUrl(), {
        auth: { token: authToken },
        transports: ['websocket', 'polling'],
      });
      socketInstance = socket;

      socket.on('connect', () => {
        set({ connected: true });
        socket.emit('join_room', `company:${user.companyId}`);
        socket.emit('join_room', `user:${user.email}`);
      });

      socket.on('disconnect', () => {
        set({ connected: false });
      });

      socket.on('new_message', (msg: ChatMessage) => {
        const { activeConversationId, messages, currentUser } = get();
        const convId = msg.type === 'channel' ? (msg.channelId || msg._id) : getDmConvId(msg.fromEmail, msg.toEmail || '');
        const existing = messages[convId] || [];
        
        // Remove pending messages from the sender in this conversation to avoid duplicates
        const cleaned = msg.fromEmail.toLowerCase() === currentUser?.email.toLowerCase()
          ? existing.filter(m => !(m as any)._pending)
          : existing;

        const isDuplicate = cleaned.some(m => m._id === msg._id);

        if (!isDuplicate) {
          set({
            messages: {
              ...messages,
              [convId]: [...cleaned, msg]
            }
          });

          if (activeConversationId !== convId) {
            set(state => ({
              conversationUnread: {
                ...state.conversationUnread,
                [convId]: (state.conversationUnread[convId] || 0) + 1
              }
            }));
          }
        }
      });

      socket.on('message_updated', (msg: ChatMessage) => {
        const { messages } = get();
        const convId = msg.type === 'channel' ? (msg.channelId || msg._id) : getDmConvId(msg.fromEmail, msg.toEmail || '');
        const current = messages[convId] || [];

        set({
          messages: {
            ...messages,
            [convId]: current.map((m) => m._id === msg._id ? msg : m)
          }
        });
      });

      socket.on('message_deleted', ({ id }: { id: string }) => {
        const { messages, activeConversationId } = get();
        const convId = activeConversationId;
        if (!convId) return;
        const current = messages[convId] || [];

        set({
          messages: {
            ...messages,
            [convId]: current.filter((m) => m._id !== id)
          }
        });
      });

      socket.on('reactions_updated', ({ messageId, reactions }: { messageId: string; reactions: any[] }) => {
        const { messages, activeConversationId } = get();
        const convId = activeConversationId;
        if (!convId) return;
        const current = messages[convId] || [];

        set({
          messages: {
            ...messages,
            [convId]: current.map((m) =>
              m._id === messageId ? { ...m, reactions } : m
            )
          }
        });
      });

      socket.on('typing_status', ({ email, name, isTyping }: TypingStatus) => {
        set(state => {
          const existing = state.typingUsers.filter(t => t.email !== email);
          if (isTyping) {
            return { typingUsers: [...existing, { email, name, isTyping }] };
          }
          return { typingUsers: existing };
        });
      });

      socket.on('user_status', ({ email, status }: { email: string; status: string }) => {
        set(state => ({
          onlineUsers: status === 'online'
            ? [...new Set([...state.onlineUsers, email])]
            : state.onlineUsers.filter(e => e !== email)
        }));
      });

      socket.on('notification', (notification: ChatNotification) => {
        set(state => {
          const notifications = [notification, ...state.notifications];
          const conversations = state.conversations.map(conv => {
            if (conv.type === 'channel') {
              const count = notifications.filter((n: ChatNotification) => n.entityId === conv._id && !n.read).length;
              return { ...conv, unreadCount: count };
            } else {
              const partnerEmail = conv.members?.find((m: string) => m.toLowerCase() !== user.email.toLowerCase()) || '';
              const count = notifications.filter(
                (n: ChatNotification) => n.type === 'direct_message' && n.senderEmail.toLowerCase() === partnerEmail.toLowerCase() && !n.read
              ).length;
              return { ...conv, unreadCount: count };
            }
          });
          return { notifications, conversations };
        });
      });

      socket.on('system_notification', (notification: any) => {
        useSystemNotificationStore.getState().addNotificationLocally(notification);
      });

      socket.on('connect_error', () => {
        set({ connected: false });
      });

      set({ socket, currentUser: user });
    },

    disconnectSocket: () => {
      const { socket } = get();
      if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
      }
      socketInstance = null;
      set({
        socket: null,
        connected: false,
        onlineUsers: [],
        typingUsers: [],
        conversationUnread: {}
      });
    },

    setActiveConversation: (id: string | null) => {
      set({ activeConversationId: id });
      if (id) {
        set(state => ({
          conversationUnread: {
            ...state.conversationUnread,
            [id]: 0
          }
        }));

        // Mark notifications as read on the backend
        const isDm = !id.includes(':') && id.includes('|');
        if (isDm) {
          const parts = id.split('|');
          const currentUserEmail = get().currentUser?.email || '';
          const partnerEmail = parts.find(p => p.toLowerCase().trim() !== currentUserEmail.toLowerCase().trim()) || parts[0];
          get().markNotificationsRead(undefined, partnerEmail);
        } else {
          get().markNotificationsRead(id);
        }

        get().loadMessages(id);
      }
    },

    loadConversations: async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('hr_system_token') : null;
      if (!token) return;
      try {
        const [channelsRes, dmsRes] = await Promise.all([
          fetch('/api/channels', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch('/api/conversations', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        const channels = channelsRes.ok ? await channelsRes.json() : [];
        const dmConvos = dmsRes.ok ? await dmsRes.json() : [];
        const user = get().currentUser;
        if (!user) return;

        const channelConvs: ChatConversation[] = channels.map((ch: any) => {
          const unreadCount = get().notifications.filter((n: ChatNotification) => n.entityId === (ch._id || ch.name) && !n.read).length;
          return {
            _id: ch._id || ch.name,
            name: ch.name,
            type: 'channel',
            description: ch.description,
            members: ch.members,
            isPrivate: ch.isPrivate,
            unreadCount
          };
        });

        const dmList: ChatConversation[] = dmConvos.map((conv: any) => {
          const partnerEmail = conv.members.find((m: string) => m.toLowerCase() !== user.email.toLowerCase()) || conv.members[0] || '';
          const convId = getDmConvId(user.email, partnerEmail);
          const unreadCount = get().notifications.filter(
            (n: ChatNotification) => n.type === 'direct_message' && n.senderEmail.toLowerCase() === partnerEmail.toLowerCase() && !n.read
          ).length;
          return {
            _id: convId,
            name: partnerEmail.split('@')[0],
            type: 'direct',
            description: conv.name || '',
            members: conv.members,
            isPrivate: false,
            unreadCount
          };
        });

        set({ conversations: [...channelConvs, ...dmList] });

        // Join socket rooms for all loaded channel conversations
        const socket = get().socket;
        if (socket) {
          channelConvs.forEach((ch: any) => {
            socket.emit('join_room', `channel:${ch._id}`);
          });
        }
      } catch (err) {
        console.error('Failed to load conversations', err);
      }
    },

    loadMessages: async (conversationId: string) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('hr_system_token') : null;
      if (!token) return;
      try {
        const isDm = !conversationId.includes(':') && conversationId.includes('|');
        const params = new URLSearchParams();
        if (isDm) {
          const parts = conversationId.split('|');
          const currentUserEmail = get().currentUser?.email || '';
          const partnerEmail = parts.find(p => p.toLowerCase().trim() !== currentUserEmail.toLowerCase().trim()) || parts[0];
          params.set('toEmail', partnerEmail);
          params.set('type', 'direct');
        } else {
          params.set('channelId', conversationId);
          params.set('type', 'channel');
        }

        const res = await fetch(`/api/messages?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const msgs = await res.json();
          set(state => ({
            messages: {
              ...state.messages,
              [conversationId]: msgs
            }
          }));
        }
      } catch (err) {
        console.error('Failed to load messages', err);
      }
    },

    sendMessage: async (data) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('hr_system_token') : null;
      if (!token) return;
      const { currentUser, activeConversationId } = get();
      if (!currentUser) return;

      const optimisticMsg: ChatMessage = {
        _id: `pending_${Date.now()}`,
        fromEmail: currentUser.email,
        fromName: currentUser.name,
        fromRole: '',
        toEmail: data.toEmail || '',
        body: data.body,
        sentAt: new Date().toISOString(),
        type: data.type,
        channelId: data.channelId,
        threadParentId: '',
        isRead: true,
        reactions: [],
        attachments: data.attachments || [],
        mentions: data.mentions || [],
        pinned: false,
        companyId: currentUser.companyId || ''
      };

      const convId = data.type === 'channel'
        ? (data.channelId || optimisticMsg._id)
        : getDmConvId(currentUser.email, data.toEmail || '');

      set(state => ({
        messages: {
          ...state.messages,
          [convId]: [...(state.messages[convId] || []), { ...optimisticMsg, _pending: true }]
        }
      }));

      try {
        const res = await fetch('/api/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            ...data,
            messageBody: data.body,
            subject: data.type === 'channel' ? `Channel Chat: ${data.channelId}` : 'Direct Chat'
          })
        });

        if (res.ok) {
          const result = await res.json();
          const savedMsg = result.data;
          set(state => ({
            messages: {
              ...state.messages,
              [convId]: (state.messages[convId] || [])
                .map(m => (m as any)._pending ? savedMsg : m)
            }
          }));
        } else {
          set(state => ({
            messages: {
              ...state.messages,
              [convId]: (state.messages[convId] || []).filter(m => !(m as any)._pending)
            }
          }));
        }
      } catch (err) {
        set(state => ({
          messages: {
            ...state.messages,
            [convId]: (state.messages[convId] || []).filter(m => !(m as any)._pending)
          }
        }));
        console.error('Failed to send message', err);
      }
    },

    editMessage: async (messageId: string, body: string) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('hr_system_token') : null;
      if (!token) return;
      const { messages, activeConversationId } = get();
      const convId = activeConversationId;
      if (!convId) return;
      const current = messages[convId] || [];

      const previous = current.find(m => m._id === messageId);
      if (!previous) return;

      set({
        messages: {
          ...messages,
          [convId]: current.map((m) =>
            m._id === messageId ? { ...m, body, _editing: true } : m
          )
        }
      });

      try {
        const res = await fetch(`/api/messages/${messageId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ messageBody: body })
        });

        if (!res.ok) {
          set({
            messages: {
              ...messages,
              [convId]: current.map((m) =>
                m._id === messageId ? { ...previous, _editing: false } : m
              )
            }
          });
        }
      } catch (err) {
        set({
          messages: {
            ...messages,
            [convId]: current.map((m) =>
              m._id === messageId ? { ...previous, _editing: false } : m
            )
          }
        });
        console.error('Failed to edit message', err);
      }
    },

    deleteMessage: async (messageId: string) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('hr_system_token') : null;
      if (!token) return;
      const { messages, activeConversationId } = get();
      const convId = activeConversationId;
      if (!convId) return;
      const current = messages[convId] || [];

      const snapshot = current.filter(m => m._id !== messageId);
      set({ messages: { ...messages, [convId]: snapshot } });

      try {
        const res = await fetch(`/api/messages/${messageId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) {
          set({ messages: { ...messages, [convId]: current } });
        }
      } catch (err) {
        set({ messages: { ...messages, [convId]: current } });
        console.error('Failed to delete message', err);
      }
    },

    toggleReaction: async (messageId: string, emoji: string) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('hr_system_token') : null;
      if (!token) return;
      const { activeConversationId, currentUser } = get();
      const convId = activeConversationId;
      if (!convId || !currentUser) return;
      const current = get().messages[convId] || [];

      set({
        messages: {
          ...get().messages,
          [convId]: current.map(m => {
            if (m._id !== messageId) return m;
            const reactions = m.reactions ? [...m.reactions] : [];
            const index = reactions.findIndex(r => r.emoji === emoji && r.email === currentUser.email);

            if (index > -1) {
              reactions.splice(index, 1);
            } else {
              reactions.push({ emoji, email: currentUser.email, name: currentUser.name });
            }

            return { ...m, reactions };
          })
        }
      });

      try {
        const method = (current.find(m => m._id === messageId)?.reactions || []).some(
          r => r.emoji === emoji && r.email === currentUser.email
        ) ? 'DELETE' : 'POST';

        const res = await fetch(`/api/messages/${messageId}/reactions`, {
          method,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: method === 'POST' ? JSON.stringify({ emoji }) : undefined
        });

        if (res.ok) {
          const data = await res.json();
          const updated = get().messages[convId] || [];
          set({
            messages: {
              ...get().messages,
              [convId]: updated.map(m =>
                m._id === messageId ? { ...m, reactions: data.data } : m
              )
            }
          });
        }
      } catch (err) {
        console.error('Failed to toggle reaction', err);
      }
    },

    markNotificationsRead: async (entityId?: string, senderEmail?: string) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('hr_system_token') : null;
      if (!token) return;
      try {
        await fetch('/api/notifications', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ entityId, senderEmail, all: !entityId && !senderEmail })
        });
        
        set(state => {
          let filtered = state.notifications;
          if (entityId) {
            filtered = filtered.filter((n: ChatNotification) => n.entityId !== entityId);
          } else if (senderEmail) {
            filtered = filtered.filter((n: ChatNotification) => n.senderEmail.toLowerCase() !== senderEmail.toLowerCase());
          } else {
            filtered = [];
          }
          const conversations = state.conversations.map(conv => {
            if (conv.type === 'channel') {
              const count = filtered.filter((n: ChatNotification) => n.entityId === conv._id && !n.read).length;
              return { ...conv, unreadCount: count };
            } else {
              const partnerEmail = conv.members?.find((m: string) => m.toLowerCase() !== state.currentUser?.email.toLowerCase()) || '';
              const count = filtered.filter(
                (n: ChatNotification) => n.type === 'direct_message' && n.senderEmail.toLowerCase() === partnerEmail.toLowerCase() && !n.read
              ).length;
              return { ...conv, unreadCount: count };
            }
          });
          return { notifications: filtered, conversations };
        });
      } catch (err) {
        console.error('Failed to mark notifications read', err);
      }
    },

    loadNotifications: async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('hr_system_token') : null;
      if (!token) return;
      try {
        const res = await fetch('/api/notifications', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const result = await res.json();
          const notifications: ChatNotification[] = result.data || [];
          set(state => {
            const conversations = state.conversations.map(conv => {
              if (conv.type === 'channel') {
                const count = notifications.filter((n: ChatNotification) => n.entityId === conv._id && !n.read).length;
                return { ...conv, unreadCount: count };
              } else {
                const partnerEmail = conv.members?.find((m: string) => m.toLowerCase() !== state.currentUser?.email.toLowerCase()) || '';
                const count = notifications.filter(
                  (n: ChatNotification) => n.type === 'direct_message' && n.senderEmail.toLowerCase() === partnerEmail.toLowerCase() && !n.read
                ).length;
                return { ...conv, unreadCount: count };
              }
            });
            return { notifications, conversations };
          });
        }
      } catch (err) {
        console.error('Failed to load notifications', err);
      }
    },

    setTyping: (roomId: string, isTyping: boolean) => {
      const { socket } = get();
      socket?.emit('typing_status', { roomId: roomId.toLowerCase(), isTyping });
    },

    addReaction: async (messageId: string, emoji: string) => {
      await get().toggleReaction(messageId, emoji);
    },

    removeReaction: async (messageId: string, emoji: string) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('hr_system_token') : null;
      if (!token) return;
      try {
        const { activeConversationId, currentUser } = get();
        const convId = activeConversationId;
        if (!convId || !currentUser) return;
        const current = get().messages[convId] || [];

        set({
          messages: {
            ...get().messages,
            [convId]: current.map(m => {
              if (m._id !== messageId) return m;
              const reactions = m.reactions ? [...m.reactions] : [];
              const index = reactions.findIndex(r => r.emoji === emoji && r.email === currentUser.email);
              if (index > -1) {
                reactions.splice(index, 1);
              }
              return { ...m, reactions };
            })
          }
        });

        const res = await fetch(`/api/messages/${messageId}/reactions?emoji=${encodeURIComponent(emoji)}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          const updated = get().messages[convId] || [];
          set({
            messages: {
              ...get().messages,
              [convId]: updated.map(m =>
                m._id === messageId ? { ...m, reactions: data.data } : m
              )
            }
          });
        }
      } catch (err) {
        console.error('Failed to remove reaction', err);
      }
    },
  };
});
