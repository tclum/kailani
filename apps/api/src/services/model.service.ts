import { prisma } from '../lib/prisma';

export async function listModels(opts: {
  location?: string;
  tags?: string[];
  page?: number;
  limit?: number;
}) {
  const { location, tags, page = 1, limit = 20 } = opts;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (location) where.location = { contains: location, mode: 'insensitive' };
  if (tags && tags.length > 0) where.tags = { hasSome: tags };

  const [profiles, total] = await prisma.$transaction([
    prisma.modelProfile.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        displayName: true,
        bio: true,
        location: true,
        coverImage: true,
        tags: true,
        height: true,
        createdAt: true,
      },
    }),
    prisma.modelProfile.count({ where }),
  ]);

  return { profiles, total, page, limit };
}

export async function getModel(id: string) {
  return prisma.modelProfile.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, email: true, approved: true } },
    },
  });
}

export async function updateMyModel(userId: string, data: Record<string, unknown>) {
  return prisma.modelProfile.upsert({
    where: { userId },
    update: data,
    create: { userId, displayName: (data.displayName as string) ?? '', ...data },
  });
}
