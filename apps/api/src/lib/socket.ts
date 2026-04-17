import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from './prisma';

let io: SocketIOServer;

export function initSocket(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
      credentials: true,
    },
  });

  // Auth middleware — attach userId to every socket
  io.use((socket, next) => {
    const token = socket.handshake.auth.token as string | undefined;
    if (!token) return next(new Error('No token'));
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET ?? '') as {
        userId: string;
        role: string;
      };
      (socket as any).userId = payload.userId;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = (socket as any).userId as string;
    socket.join(`user:${userId}`);

    // ── join-thread ─────────────────────────────────────────────────────────────
    socket.on('join-thread', async ({ threadId }: { threadId: string }) => {
      try {
        const member = await prisma.threadMember.findUnique({
          where: { threadId_userId: { threadId, userId } },
        });
        if (!member) return socket.emit('error', 'Not a thread member');
        socket.join(`thread:${threadId}`);
      } catch {
        socket.emit('error', 'Failed to join thread');
      }
    });

    // ── leave-thread ────────────────────────────────────────────────────────────
    socket.on('leave-thread', ({ threadId }: { threadId: string }) => {
      socket.leave(`thread:${threadId}`);
    });

    // ── send-message ────────────────────────────────────────────────────────────
    socket.on('send-message', async ({ threadId, body }: { threadId: string; body: string }) => {
      if (!body?.trim()) return;
      try {
        const member = await prisma.threadMember.findUnique({
          where: { threadId_userId: { threadId, userId } },
        });
        if (!member) return socket.emit('error', 'Not a thread member');

        const message = await prisma.message.create({
          data: { threadId, senderId: userId, body: body.trim() },
          include: {
            sender: {
              select: {
                id: true,
                email: true,
                role: true,
                modelProfile: { select: { displayName: true, profileImage: true, coverImage: true } },
                brandProfile: { select: { brandName: true, logoUrl: true, profileImage: true } },
                photographerProfile: { select: { displayName: true, profileImage: true } },
              },
            },
          },
        });

        io.to(`thread:${threadId}`).emit('new-message', message);
      } catch {
        socket.emit('error', 'Failed to send message');
      }
    });

    // ── typing ──────────────────────────────────────────────────────────────────
    socket.on('typing', ({ threadId, isTyping }: { threadId: string; isTyping: boolean }) => {
      socket.to(`thread:${threadId}`).emit('user-typing', { userId, isTyping });
    });

    // ── mark-read ────────────────────────────────────────────────────────────────
    socket.on('mark-read', async ({ threadId }: { threadId: string }) => {
      try {
        await prisma.threadMember.updateMany({
          where: { threadId, userId },
          data: { lastReadAt: new Date() },
        });
        socket.to(`thread:${threadId}`).emit('messages-read', { threadId, userId });
      } catch {
        // non-critical
      }
    });

    // ── legacy underscore aliases ────────────────────────────────────────────────
    socket.on('join_thread', (threadId: string) => {
      socket.join(`thread:${threadId}`);
    });
    socket.on('leave_thread', (threadId: string) => {
      socket.leave(`thread:${threadId}`);
    });

    socket.on('disconnect', () => {
      // Socket.io automatically cleans up rooms on disconnect
    });
  });

  return io;
}

export function getIO(): SocketIOServer {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}
