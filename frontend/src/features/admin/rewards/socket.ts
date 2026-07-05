import { io } from 'socket.io-client';

const API = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'; // backend server address

export function getRewardsSocket() {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('hr_system_token') || '';
  return io(API, {
    auth: { token },
    query: { token },
    transports: ['websocket', 'polling']
  });
}
