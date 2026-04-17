import { prisma } from '../lib/prisma';

export async function listPhotographers(opts: {
  location?: string;
  specialties?: string[];
  page?: number;
  limit?: number;
  approvedOnly?: boolean;
}) {
  const { location, specialties, page = 1, limit = 20, approvedOnly = false } = opts;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (location) where.location = { contains: location, mode: 'insensitive' };
  if (specialties?.length) where.specialties = { hasSome: specialties };
  if (approvedOnly) where.user = { approved: true };

  const [profiles, total] = await prisma.$transaction([
    prisma.photographerProfile.findMany({
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
        specialties: true,
        createdAt: true,
      },
    }),
    prisma.photographerProfile.count({ where }),
  ]);

  return { profiles, total, page, limit };
}

export async function getPhotographer(userId: string) {
  return prisma.photographerProfile.findUnique({
    where: { userId },
    include: { user: { select: { id: true, email: true, approved: true, verified: true } } },
  });
}


export async function getMyPhotographer(userId: string) {
  return prisma.photographerProfile.findUnique({ where: { userId } });
}

export async function upsertMyPhotographer(userId: string, data: Record<string, unknown>) {
  return prisma.photographerProfile.upsert({
    where: { userId },
    update: data,
    create: {
      userId,
      displayName: (data.displayName as string) ?? '',
      specialties: [],
      portfolioImages: [],
      ...data,
    },
  });
}

export async function addPhotographerPortfolioImage(userId: string, imageUrl: string) {
  return prisma.photographerProfile.upsert({
    where: { userId },
    update: { portfolioImages: { push: imageUrl } },
    create: { userId, displayName: '', portfolioImages: [imageUrl] },
  });
}

export async function removePhotographerPortfolioImage(userId: string, imageUrl: string) {
  const profile = await prisma.photographerProfile.findUnique({ where: { userId } });
  if (!profile) throw new Error('Profile not found');
  const updated = profile.portfolioImages.filter((url) => url !== imageUrl);
  const data: Record<string, unknown> = { portfolioImages: updated };
  if (profile.coverImage === imageUrl) data.coverImage = null;
  return prisma.photographerProfile.update({ where: { userId }, data });
}
