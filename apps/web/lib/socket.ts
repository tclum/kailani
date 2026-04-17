import { io, type Socket } from 'socket.io-client';
import { getAccessToken } from './auth';

let _socket: Socket | null = null;

export function getSocket(): Socket | null {
  if (typeof window === 'undefined') return null;

  if (!_socket) {
    _socket = io(process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000', {
      auth: { token: getAccessToken() },
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
      timeout: 10000,
    });

    // Refresh the JWT on every reconnect attempt so an expired token doesn't block
    _socket.on('reconnect_attempt', () => {
      if (_socket) (_socket as any).auth = { token: getAccessToken() };
    });
  }

  return _socket;
}

export function connectSocket(): Socket | null {
  const s = getSocket();
  if (!s) return null;
  if (!s.connected) {
    (s as any).auth = { token: getAccessToken() };
    s.connect();
  }
  return s;
}

export function disconnectSocket(): void {
  if (_socket?.connected) {
    _socket.disconnect();
  }
}

/** Call on logout — tears down the connection and clears the singleton so the
 *  next login gets a fresh socket with the new user's JWT. */
export function resetSocket(): void {
  if (_socket) {
    _socket.removeAllListeners();
    _socket.disconnect();
    _socket = null;
  }
}
