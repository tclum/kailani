import { prisma } from '../lib/prisma';

type CampaignStatus = 'DRAFT' | 'OPEN' | 'CLOSED' | 'COMPLETED';

export async function listCampaigns(opts: {
  status?: CampaignStatus;
  tags?: string[];
  location?: string;
  page?: number;
  limit?: number;
  brandId?: string;
  withCounts?: boolean;
}) {
  const { status, tags, location, page = 1, limit = 20, brandId, withCounts = false } = opts;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (status) where.status = status;
  if (tags && tags.length > 0) where.tags = { hasSome: tags };
  if (location) where.location = { contains: location, mode: 'insensitive' };
  if (brandId) where.brandId = brandId;

  const [campaigns, total] = await prisma.$transaction([
    prisma.campaign.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        brand: { select: { id: true, brandName: true, logoUrl: true, profileImage: true, location: true } },
        ...(withCounts ? { _count: { select: { applications: true } } } : {}),
      },
    }),
    prisma.campaign.count({ where }),
  ]);

  return { campaigns, total, page, limit };
}

export async function getCampaign(id: string) {
  return prisma.campaign.findUnique({
    where: { id },
    include: {
      brand: { select: { id: true, brandName: true, logoUrl: true, profileImage: true, location: true, website: true, instagramUrl: true, userId: true } },
      _count: { select: { applications: true } },
    },
  });
}

export async function createCampaign(brandId: string, data: Record<string, unknown>) {
  return prisma.campaign.create({
    data: { brandId, ...data } as any,
  });
}

export async function updateCampaign(id: string, brandId: string, data: Record<string, unknown>) {
  return prisma.campaign.update({
    where: { id },
    data: data as any,
    include: {
      brand: { select: { id: true, brandName: true, logoUrl: true, profileImage: true, location: true, website: true, instagramUrl: true, userId: true } },
      _count: { select: { applications: true } },
    },
  });
}

export async function deleteCampaign(id: string) {
  return prisma.campaign.delete({ where: { id } });
}

export async function applyToCampaign(campaignId: string, modelId: string, coverNote?: string) {
  return prisma.application.create({
    data: { campaignId, modelId, coverNote },
  });
}

export async function listApplications(campaignId: string) {
  return prisma.application.findMany({
    where: { campaignId },
    include: {
      model: {
        select: {
          id: true,
          userId: true,
          displayName: true,
          profileImage: true,
          coverImage: true,
          portfolioImages: true,
          location: true,
          tags: true,
          heightCm: true,
          bustCm: true,
          waistCm: true,
          hipsCm: true,
          bio: true,
          user: { select: { id: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getMyApplications(userId: string) {
  const model = await prisma.modelProfile.findUnique({ where: { userId } });
  if (!model) return [];
  return prisma.application.findMany({
    where: { modelId: model.id },
    include: {
      campaign: {
        include: {
          brand: { select: { id: true, brandName: true, logoUrl: true, profileImage: true, userId: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function updateApplicationStatus(applicationId: string, status: string) {
  return prisma.application.update({
    where: { id: applicationId },
    data: { status: status as any },
    include: {
      campaign: { include: { brand: { select: { brandName: true } } } },
      model: { include: { user: { select: { email: true } } } },
    },
  });
}
