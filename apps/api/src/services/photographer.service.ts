import { prisma } from '../lib/prisma';

export async function listPhotographers(opts: {
  location?: string;
  specialties?: string[];
  page?: number;
  limit?: number;
}) {
  const { location, specialties, page = 1, limit = 20 } = opts;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (location) where.location = { contains: location, mode: 'insensitive' };
  if (specialties?.length) where.specialties = { hasSome: specialties };

  const [profiles, total] = await prisma.$transaction([
    prisma.photographerProfile.findMany({
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
        specialties: true,
        createdAt: true,
      },
    }),
    prisma.photographerProfile.count({ where }),
  ]);

  return { profiles, total, page, limit };
}

export async function getPhotographer(id: string) {
  return prisma.photographerProfile.findUnique({
    where: { id },
    include: { user: { select: { id: true, email: true, approved: true } } },
  });
}

export async function getMyPhotographer(userId: string) {
  return prisma.photographerProfile.findUnique({ where: { userId } });
}

export async function upsertMyPhotographer(userId: string, data: Record<string, unknown>) {
  return prisma.photographerProfile.upsert({
    where: { userId },
    update: data,
    create: { userId, displayName: (data.displayName as string) ?? '', ...data },
  });
}

export async function addPhotographerPortfolioImage(userId: string, imageUrl: string) {
  return prisma.photographerProfile.upsert({
    where: { userId },
    update: { portfolioImages: { push: imageUrl } },
    create: { userId, displayName: '', portfolioImages: [imageUrl] },
  });
}
