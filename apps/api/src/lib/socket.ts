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

    socket.on('join_thread', (threadId: string) => {
      socket.join(`thread:${threadId}`);
    });

    socket.on('leave_thread', (threadId: string) => {
      socket.leave(`thread:${threadId}`);
    });

    socket.on('send_message', async (data: { threadId: string; body: string }) => {
      try {
        const member = await prisma.threadMember.findUnique({
          where: { threadId_userId: { threadId: data.threadId, userId } },
        });
        if (!member) return socket.emit('error', 'Not a thread member');

        const message = await prisma.message.create({
          data: { threadId: data.threadId, senderId: userId, body: data.body },
          include: {
            sender: {
              select: {
                id: true,
                email: true,
                modelProfile: { select: { displayName: true, coverImage: true } },
                brandProfile: { select: { brandName: true, logoUrl: true } },
              },
            },
          },
        });

        io.to(`thread:${data.threadId}`).emit('new_message', message);
      } catch (err) {
        socket.emit('error', 'Failed to send message');
      }
    });
  });

  return io;
}

export function getIO(): SocketIOServer {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}
