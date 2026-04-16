import { prisma } from '../lib/prisma';

export async function getThreadsForUser(userId: string) {
  return prisma.thread.findMany({
    where: { members: { some: { userId } } },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              modelProfile: { select: { displayName: true, coverImage: true } },
              brandProfile: { select: { brandName: true, logoUrl: true } },
            },
          },
        },
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
    orderBy: { createdAt: 'asc' },
  });
}

export async function createMessage(threadId: string, senderId: string, body: string) {
  return prisma.message.create({
    data: { threadId, senderId, body },
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
}
