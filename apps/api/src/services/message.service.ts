import { prisma } from '../lib/prisma';

const userSelect = {
  id: true,
  email: true,
  role: true,
  modelProfile: { select: { displayName: true, profileImage: true, coverImage: true } },
  brandProfile: { select: { brandName: true, logoUrl: true, profileImage: true } },
  photographerProfile: { select: { displayName: true, profileImage: true } },
} as const;

export async function getThreadsForUser(userId: string) {
  return prisma.thread.findMany({
    where: { members: { some: { userId } } },
    include: {
      members: {
        include: { user: { select: userSelect } },
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function findOrCreateThread(userId: string, recipientId: string) {
  // Validate recipient exists
  const recipient = await prisma.user.findUnique({ where: { id: recipientId } });
  if (!recipient) throw new Error('RECIPIENT_NOT_FOUND');

  const existing = await prisma.thread.findFirst({
    where: {
      AND: [
        { members: { some: { userId } } },
        { members: { some: { userId: recipientId } } },
      ],
    },
  });
  if (existing) return existing;

  return prisma.thread.create({
    data: {
      members: {
        create: [{ userId }, { userId: recipientId }],
      },
    },
  });
}

export async function getMessages(threadId: string, userId: string) {
  const member = await prisma.threadMember.findUnique({
    where: { threadId_userId: { threadId, userId } },
  });
  if (!member) throw new Error('NOT_MEMBER');

  return prisma.message.findMany({
    where: { threadId },
    include: { sender: { select: userSelect } },
    orderBy: { createdAt: 'asc' },
  });
}

export async function createMessage(threadId: string, senderId: string, body: string) {
  return prisma.message.create({
    data: { threadId, senderId, body },
    include: { sender: { select: userSelect } },
  });
}
