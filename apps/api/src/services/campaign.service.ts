import { prisma } from '../lib/prisma';

type CampaignStatus = 'DRAFT' | 'OPEN' | 'CLOSED' | 'COMPLETED';

export async function listCampaigns(opts: {
  status?: CampaignStatus;
  tags?: string[];
  page?: number;
  limit?: number;
}) {
  const { status, tags, page = 1, limit = 20 } = opts;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (status) where.status = status;
  if (tags && tags.length > 0) where.tags = { hasSome: tags };

  const [campaigns, total] = await prisma.$transaction([
    prisma.campaign.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        brand: { select: { id: true, brandName: true, logoUrl: true, location: true } },
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
      brand: { select: { id: true, brandName: true, logoUrl: true, location: true, website: true } },
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
        select: { id: true, displayName: true, coverImage: true, location: true, tags: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function updateApplicationStatus(applicationId: string, status: string) {
  return prisma.application.update({
    where: { id: applicationId },
    data: { status: status as any },
  });
}
