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
  const threads = await prisma.thread.findMany({
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
  });

  // Get lastReadAt for each thread for this user
  const memberRows = await prisma.threadMember.findMany({
    where: { userId },
    select: { threadId: true, lastReadAt: true },
  });
  const lastReadMap = new Map(memberRows.map((m) => [m.threadId, m.lastReadAt]));

  // Count unread messages per thread
  const threadsWithMeta = await Promise.all(
    threads.map(async (t) => {
      const lastRead = lastReadMap.get(t.id) ?? null;
      const unreadCount = await prisma.message.count({
        where: {
          threadId: t.id,
          senderId: { not: userId },
          ...(lastRead ? { createdAt: { gt: lastRead } } : {}),
        },
      });
      return { ...t, unreadCount };
    }),
  );

  // Sort by most recent message (fall back to thread createdAt)
  return threadsWithMeta.sort((a, b) => {
    const aTime = a.messages[0]?.createdAt ?? a.createdAt;
    const bTime = b.messages[0]?.createdAt ?? b.createdAt;
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });
}

export async function getUnreadCount(userId: string): Promise<number> {
  const memberRows = await prisma.threadMember.findMany({
    where: { userId },
    select: { threadId: true, lastReadAt: true },
  });

  let total = 0;
  for (const row of memberRows) {
    const count = await prisma.message.count({
      where: {
        threadId: row.threadId,
        senderId: { not: userId },
        ...(row.lastReadAt ? { createdAt: { gt: row.lastReadAt } } : {}),
      },
    });
    total += count;
  }
  return total;
}

export async function markThreadRead(threadId: string, userId: string): Promise<void> {
  await prisma.threadMember.updateMany({
    where: { threadId, userId },
    data: { lastReadAt: new Date() },
  });
}

export async function findOrCreateThread(userId: string, recipientId: string) {
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
