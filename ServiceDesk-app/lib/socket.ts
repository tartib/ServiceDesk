import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from './api/config';

let socket: Socket | null = null;
let refCount = 0;

/**
 * Get or create the singleton Socket.IO connection.
 * Every caller that acquires the socket should call `releaseSocket()` on
 * cleanup so we can disconnect when the last consumer unmounts.
 */
export const getSocket = (): Socket => {
  if (!socket && typeof window !== 'undefined') {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      auth: { token },
    });

    socket.on('connect', () => {
      console.log('🔌 WebSocket connected');
    });

    socket.on('disconnect', () => {
      console.log('🔌 WebSocket disconnected');
    });

    socket.on('connect_error', (err) => {
      console.error('WebSocket connection error:', err.message);
    });
  }
  refCount++;
  return socket!;
};

/**
 * Decrement the reference count. When it reaches 0 the socket is
 * disconnected and cleared so the next `getSocket()` creates a fresh one.
 */
export const releaseSocket = () => {
  refCount = Math.max(0, refCount - 1);
  if (refCount === 0 && socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Force-disconnect regardless of ref count (e.g. on logout).
 */
export const disconnectSocket = () => {
  refCount = 0;
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Legacy aliases kept for backward compatibility
export const initSocket = getSocket;

const socketManager = { initSocket, getSocket, releaseSocket, disconnectSocket };
export default socketManager;
