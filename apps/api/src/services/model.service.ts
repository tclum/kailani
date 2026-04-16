import { prisma } from '../lib/prisma';

export async function listModels(opts: {
  location?: string;
  tags?: string[];
  page?: number;
  limit?: number;
  approvedOnly?: boolean;
}) {
  const { location, tags, page = 1, limit = 20, approvedOnly = false } = opts;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (location) where.location = { contains: location, mode: 'insensitive' };
  if (tags && tags.length > 0) where.tags = { hasSome: tags };
  if (approvedOnly) where.user = { approved: true };

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
        heightCm: true,
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

export async function getMyModel(userId: string) {
  return prisma.modelProfile.findUnique({ where: { userId } });
}

export async function updateMyModel(userId: string, data: Record<string, unknown>) {
  return prisma.modelProfile.upsert({
    where: { userId },
    update: data,
    create: { userId, displayName: (data.displayName as string) ?? '', ...data },
  });
}

export async function addPortfolioImage(userId: string, imageUrl: string) {
  return prisma.modelProfile.upsert({
    where: { userId },
    update: { portfolioImages: { push: imageUrl } },
    create: { userId, displayName: '', portfolioImages: [imageUrl] },
  });
}

export async function removePortfolioImage(userId: string, imageUrl: string) {
  const profile = await prisma.modelProfile.findUnique({ where: { userId } });
  if (!profile) throw new Error('Profile not found');
  const updated = profile.portfolioImages.filter((url) => url !== imageUrl);
  const data: Record<string, unknown> = { portfolioImages: updated };
  if (profile.coverImage === imageUrl) data.coverImage = null;
  return prisma.modelProfile.update({ where: { userId }, data });
}
