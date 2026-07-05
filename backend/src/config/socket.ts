import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { Channel } from '@/app/api/models/Channel';
import { User } from '@/app/api/models/User';
import { config } from '../config';

const JWT_SECRET = config.jwtSecret;

interface SocketUser {
  userId: string;
  email: string;
  role: string;
  companyId: string;
  fullName: string;
}

let io: Server;

const onlineUsers = new Map<string, string[]>();
const typingTimeouts = new Map<string, NodeJS.Timeout>();
const SOCKET_RATE_LIMIT_WINDOW = 10000;
const SOCKET_RATE_LIMIT_MAX = 50;
const clientTimestamps = new Map<string, number[]>();
const userStatusTimestamps = new Map<string, number>();

function checkSocketRateLimit(socketId: string): boolean {
  const now = Date.now();
  const timestamps = clientTimestamps.get(socketId) || [];
  const recent = timestamps.filter(t => now - t < SOCKET_RATE_LIMIT_WINDOW);
  if (recent.length >= SOCKET_RATE_LIMIT_MAX) return false;
  recent.push(now);
  clientTimestamps.set(socketId, recent);
  return true;
}

function normaliseRoom(room: string): string {
  return room.trim().toLowerCase();
}

async function isUserInChannel(companyId: string, userEmail: string, channelId: string): Promise<boolean> {
  if (!mongoose.isValidObjectId(channelId)) return false;
  const channel = await Channel.findOne({ _id: channelId, companyId });
  if (!channel) return false;
  if (!channel.isPrivate) return true;
  return channel.members.includes(userEmail) || channel.createdBy === userEmail;
}

export function initSocket(server: any) {
  io = new Server(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL || 'http://localhost:3000' : '*',
      methods: ['GET', 'POST']
    }
  });

  io.use((socket: Socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) {
        return next(new Error('Authentication error: Token missing'));
      }

      const decoded = jwt.verify(token as string, JWT_SECRET) as any;
      if (!decoded || !decoded.email) {
        return next(new Error('Authentication error: Invalid token'));
      }

      if (!decoded.companyId) {
        decoded.companyId = decoded.companyCode || 'company_001';
      }
      if (!decoded.fullName) {
        decoded.fullName = decoded.email.split('@')[0];
      }

      socket.data.user = decoded as SocketUser;
      next();
    } catch (err) {
      console.error('Socket authentication failed:', err);
      return next(new Error('Authentication error: Verification failed'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user as SocketUser;
    const userEmail = user.email.toLowerCase();

    socket.removeAllListeners();

    const emitUserStatus = (status: 'online' | 'offline') => {
      const now = Date.now();
      const last = userStatusTimestamps.get(userEmail) || 0;
      if (now - last < 30000) return;
      userStatusTimestamps.set(userEmail, now);
      socket.to(`company:${user.companyId}`).emit('user_status', {
        email: user.email,
        status
      });
    };

    console.log(`Socket connected: ${socket.id} for user ${userEmail} in company ${user.companyId}`);

    if (!onlineUsers.has(userEmail)) {
      onlineUsers.set(userEmail, []);
      emitUserStatus('online');
    }
    onlineUsers.get(userEmail)!.push(socket.id);

    socket.join(`company:${user.companyId}`);
    socket.join(`user:${userEmail}`);

    socket.on('join_room', async (roomId: string) => {
      if (!checkSocketRateLimit(socket.id)) {
        socket.emit('error', { message: 'Rate limit exceeded' });
        return;
      }

      const room = normaliseRoom(roomId);

      if (room.startsWith('company:') && room !== `company:${user.companyId}`.toLowerCase()) {
        socket.emit('error', { message: 'Forbidden: Cannot join room of another company' });
        return;
      }

      if (room.startsWith('user:') && room !== `user:${userEmail}`.toLowerCase()) {
        socket.emit('error', { message: 'Forbidden: Cannot join room of another user' });
        return;
      }

      if (room.startsWith('channel:')) {
        const channelId = room.replace('channel:', '');
        const allowed = await isUserInChannel(user.companyId, userEmail, channelId);
        if (!allowed) {
          socket.emit('error', { message: 'Forbidden: Not a member of this channel' });
          return;
        }
      }

      socket.join(room);
      console.log(`Socket ${socket.id} joined room ${room}`);
    });

    socket.on('leave_room', (roomId: string) => {
      if (!checkSocketRateLimit(socket.id)) {
        socket.emit('error', { message: 'Rate limit exceeded' });
        return;
      }
      socket.leave(normaliseRoom(roomId));
    });

    socket.on('typing_status', ({ roomId, isTyping }: { roomId: string; isTyping: boolean }) => {
      if (!checkSocketRateLimit(socket.id)) {
        socket.emit('error', { message: 'Rate limit exceeded' });
        return;
      }

      const room = normaliseRoom(roomId);
      const timeoutKey = `${userEmail}:${room}`;
      if (typingTimeouts.has(timeoutKey)) clearTimeout(typingTimeouts.get(timeoutKey)!);

      socket.to(room).emit('typing_status', {
        roomId: room,
        email: user.email,
        name: user.fullName,
        isTyping
      });

      if (isTyping) {
        typingTimeouts.set(timeoutKey, setTimeout(() => {
          socket.to(room).emit('typing_status', {
            roomId: room,
            email: user.email,
            name: user.fullName,
            isTyping: false
          });
          typingTimeouts.delete(timeoutKey);
        }, 4000));
      }
    });

    socket.on('get_online_users', (callback: (emails: string[]) => void) => {
      if (typeof callback === 'function') {
        callback(Array.from(onlineUsers.keys()));
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id} for user ${userEmail}`);

      const userSockets = onlineUsers.get(userEmail);
      if (userSockets) {
        const remaining = userSockets.filter(id => id !== socket.id);
        if (remaining.length === 0) {
          onlineUsers.delete(userEmail);
          emitUserStatus('offline');
        } else {
          onlineUsers.set(userEmail, remaining);
        }
      }

      typingTimeouts.forEach((timeout, key) => {
        if (key.startsWith(userEmail)) clearTimeout(timeout);
      });
      clientTimestamps.delete(socket.id);
    });
  });

  return io;
}

export function getIO() {
  if (!io) {
    throw new Error('Socket.IO has not been initialized');
  }
  return io;
}

export function emitToRoom(roomId: string, event: string, data: any) {
  if (io) {
    io.to(normaliseRoom(roomId)).emit(event, data);
  }
}

export function emitToUser(email: string, event: string, data: any) {
  if (io) {
    const formattedEmail = email.trim().toLowerCase();
    io.to(`user:${formattedEmail}`).emit(event, data);
  }
}
