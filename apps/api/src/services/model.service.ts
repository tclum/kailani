import { prisma } from '../lib/prisma';

export async function listModels(opts: {
  location?: string;
  tags?: string[];
  page?: number;
  limit?: number;
  approvedOnly?: boolean;
  excludeUserIds?: string[];
  featured?: boolean;
}) {
  const { location, tags, page = 1, limit = 20, approvedOnly = false, excludeUserIds, featured } = opts;

  // Featured: random approved models with profile image + portfolio
  if (featured) {
    const all = await prisma.modelProfile.findMany({
      where: { user: { approved: true }, profileImage: { not: null } },
      select: {
        id: true, userId: true, displayName: true, bio: true, location: true,
        coverImage: true, profileImage: true, tags: true, heightCm: true,
        portfolioImages: true, createdAt: true,
        user: { select: { verified: true } },
      },
    });
    const withPortfolio = all.filter((m) => m.portfolioImages.length > 0);
    // Fisher-Yates shuffle
    for (let i = withPortfolio.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [withPortfolio[i], withPortfolio[j]] = [withPortfolio[j], withPortfolio[i]];
    }
    const profiles = withPortfolio.slice(0, limit).map(({ portfolioImages: _p, ...m }) => m);
    return { profiles, total: profiles.length, page: 1, limit };
  }
  const skip = (page - 1) * limit;

  const where: any = {};
  if (location) where.location = { contains: location, mode: 'insensitive' };
  if (tags && tags.length > 0) where.tags = { hasSome: tags };
  if (approvedOnly || (excludeUserIds && excludeUserIds.length > 0)) {
    where.user = {};
    if (approvedOnly) where.user.approved = true;
    if (excludeUserIds && excludeUserIds.length > 0) where.user.id = { notIn: excludeUserIds };
  }

  const [profiles, total] = await prisma.$transaction([
    prisma.modelProfile.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userId: true,
        displayName: true,
        bio: true,
        location: true,
        coverImage: true,
        profileImage: true,
        tags: true,
        heightCm: true,
        createdAt: true,
        user: { select: { verified: true } },
      },
    }),
    prisma.modelProfile.count({ where }),
  ]);

  return { profiles, total, page, limit };
}

export async function getModel(userId: string) {
  return prisma.modelProfile.findUnique({
    where: { userId },
    include: {
      user: { select: { id: true, email: true, approved: true, verified: true } },
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
