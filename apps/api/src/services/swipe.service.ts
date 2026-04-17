import { prisma } from '../lib/prisma';
import { findOrCreateThread } from './message.service';

export interface SwipeCard {
  id: string;
  targetType: 'MODEL' | 'BRAND' | 'PHOTOGRAPHER' | 'CAMPAIGN';
  name: string;
  image: string | null;
  location: string | null;
  tags: string[];
  bio: string | null;
  userId?: string; // underlying userId for user-type targets
  // Campaign extras
  brandName?: string;
  brandImage?: string | null;
  budget?: string | null;
}

/** Return next 10 swipe cards for the given user */
export async function getSwipeQueue(userId: string, role: string): Promise<SwipeCard[]> {
  // IDs already swiped on (any direction)
  const swiped = await prisma.swipe.findMany({
    where: { swiperId: userId },
    select: { targetId: true, targetType: true },
  });
  const swipedIds = new Set(swiped.map((s) => `${s.targetType}:${s.targetId}`));

  if (role === 'MODEL') {
    return getModelQueue(userId, swipedIds);
  }
  if (role === 'BRAND') {
    return getBrandQueue(userId, swipedIds);
  }
  if (role === 'PHOTOGRAPHER') {
    return getPhotographerQueue(userId, swipedIds);
  }
  return [];
}

async function getModelQueue(userId: string, swiped: Set<string>): Promise<SwipeCard[]> {
  const campaigns = await prisma.campaign.findMany({
    where: { status: 'OPEN' },
    include: {
      brand: {
        select: { userId: true, brandName: true, logoUrl: true, profileImage: true, location: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return campaigns
    .filter((c) => !swiped.has(`CAMPAIGN:${c.id}`))
    .slice(0, 10)
    .map((c) => ({
      id: c.id,
      targetType: 'CAMPAIGN' as const,
      name: c.title,
      image: c.brand.profileImage ?? c.brand.logoUrl ?? null,
      location: c.location ?? c.brand.location ?? null,
      tags: c.tags,
      bio: c.description.slice(0, 160),
      brandName: c.brand.brandName,
      brandImage: c.brand.logoUrl ?? c.brand.profileImage ?? null,
      budget: c.budget ?? null,
    }));
}

async function getBrandQueue(userId: string, swiped: Set<string>): Promise<SwipeCard[]> {
  const models = await prisma.modelProfile.findMany({
    where: { user: { approved: true } },
    include: { user: { select: { id: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return models
    .filter((m) => m.user.id !== userId && !swiped.has(`MODEL:${m.user.id}`))
    .slice(0, 10)
    .map((m) => ({
      id: m.user.id,
      targetType: 'MODEL' as const,
      name: m.displayName,
      image: m.profileImage ?? m.coverImage ?? (m.portfolioImages[0] ?? null),
      location: m.location ?? null,
      tags: m.tags,
      bio: m.bio ? m.bio.slice(0, 160) : null,
      userId: m.user.id,
    }));
}

async function getPhotographerQueue(userId: string, swiped: Set<string>): Promise<SwipeCard[]> {
  const [models, brands] = await Promise.all([
    prisma.modelProfile.findMany({
      where: { user: { approved: true } },
      include: { user: { select: { id: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.brandProfile.findMany({
      where: { user: { approved: true } },
      include: { user: { select: { id: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
  ]);

  const modelCards: SwipeCard[] = models
    .filter((m) => m.user.id !== userId && !swiped.has(`MODEL:${m.user.id}`))
    .map((m) => ({
      id: m.user.id,
      targetType: 'MODEL' as const,
      name: m.displayName,
      image: m.profileImage ?? m.coverImage ?? (m.portfolioImages[0] ?? null),
      location: m.location ?? null,
      tags: m.tags,
      bio: m.bio ? m.bio.slice(0, 160) : null,
      userId: m.user.id,
    }));

  const brandCards: SwipeCard[] = brands
    .filter((b) => b.user.id !== userId && !swiped.has(`BRAND:${b.user.id}`))
    .map((b) => ({
      id: b.user.id,
      targetType: 'BRAND' as const,
      name: b.brandName,
      image: b.profileImage ?? b.logoUrl ?? null,
      location: b.location ?? null,
      tags: b.industry ? [b.industry] : [],
      bio: b.bio ? b.bio.slice(0, 160) : null,
      userId: b.user.id,
    }));

  // Interleave models and brands
  const mixed: SwipeCard[] = [];
  const len = Math.max(modelCards.length, brandCards.length);
  for (let i = 0; i < len && mixed.length < 10; i++) {
    if (modelCards[i]) mixed.push(modelCards[i]);
    if (mixed.length < 10 && brandCards[i]) mixed.push(brandCards[i]);
  }
  return mixed;
}

/** Record a LIKE and check for a match. Returns match info if matched. */
export async function recordLike(
  swiperId: string,
  swiperRole: string,
  targetId: string,
  targetType: string,
): Promise<{ matched: boolean; threadId?: string; matchedProfile?: MatchedProfile }> {
  await prisma.swipe.upsert({
    where: { swiperId_targetId_targetType: { swiperId, targetId, targetType } },
    update: { direction: 'LIKE' },
    create: { swiperId, targetId, targetType, direction: 'LIKE' },
  });

  // Determine if there's a reciprocal like to form a match
  const otherUserId = await findReverseUser(swiperId, swiperRole, targetId, targetType);
  if (!otherUserId || otherUserId === swiperId) return { matched: false };

  const reverseExists = await checkReverseSwipe(swiperId, swiperRole, targetId, targetType, otherUserId);
  if (!reverseExists) return { matched: false };

  // Create match (normalize IDs so @@unique is satisfied)
  const [u1, u2] = [swiperId, otherUserId].sort();
  const existing = await prisma.match.findUnique({ where: { user1Id_user2Id: { user1Id: u1, user2Id: u2 } } });
  if (existing) {
    // Already matched — return thread info
    const thread = await findOrCreateThread(swiperId, otherUserId);
    const profile = await getMatchedProfile(otherUserId);
    return { matched: true, threadId: thread.id, matchedProfile: profile };
  }

  await prisma.match.create({ data: { user1Id: u1, user2Id: u2 } });
  const thread = await findOrCreateThread(swiperId, otherUserId);
  const profile = await getMatchedProfile(otherUserId);
  return { matched: true, threadId: thread.id, matchedProfile: profile };
}

/** Record a PASS swipe (no match logic needed) */
export async function recordPass(swiperId: string, targetId: string, targetType: string): Promise<void> {
  await prisma.swipe.upsert({
    where: { swiperId_targetId_targetType: { swiperId, targetId, targetType } },
    update: { direction: 'PASS' },
    create: { swiperId, targetId, targetType, direction: 'PASS' },
  });
}

/** Return all matches for a user with profile info */
export async function getMatches(userId: string) {
  const matches = await prisma.match.findMany({
    where: { OR: [{ user1Id: userId }, { user2Id: userId }] },
    include: {
      user1: {
        select: {
          id: true, role: true,
          modelProfile: { select: { displayName: true, profileImage: true, coverImage: true, location: true } },
          brandProfile: { select: { brandName: true, logoUrl: true, profileImage: true, location: true } },
          photographerProfile: { select: { displayName: true, profileImage: true, location: true } },
        },
      },
      user2: {
        select: {
          id: true, role: true,
          modelProfile: { select: { displayName: true, profileImage: true, coverImage: true, location: true } },
          brandProfile: { select: { brandName: true, logoUrl: true, profileImage: true, location: true } },
          photographerProfile: { select: { displayName: true, profileImage: true, location: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return matches.map((m) => {
    const other = m.user1Id === userId ? m.user2 : m.user1;
    return { matchId: m.id, createdAt: m.createdAt, otherUser: other };
  });
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

interface MatchedProfile {
  userId: string;
  name: string;
  image: string | null;
  role: string;
}

async function getMatchedProfile(userId: string): Promise<MatchedProfile> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, role: true,
      modelProfile: { select: { displayName: true, profileImage: true, coverImage: true } },
      brandProfile: { select: { brandName: true, logoUrl: true, profileImage: true } },
      photographerProfile: { select: { displayName: true, profileImage: true } },
    },
  });
  if (!user) return { userId, name: 'Unknown', image: null, role: '' };

  let name = 'Unknown';
  let image: string | null = null;
  if (user.modelProfile) { name = user.modelProfile.displayName; image = user.modelProfile.profileImage ?? user.modelProfile.coverImage ?? null; }
  else if (user.brandProfile) { name = user.brandProfile.brandName; image = user.brandProfile.profileImage ?? user.brandProfile.logoUrl ?? null; }
  else if (user.photographerProfile) { name = user.photographerProfile.displayName; image = user.photographerProfile.profileImage ?? null; }

  return { userId: user.id, name, image, role: user.role };
}

/** Given a like event, find the userId of the "other side" for match purposes */
async function findReverseUser(
  swiperId: string,
  swiperRole: string,
  targetId: string,
  targetType: string,
): Promise<string | null> {
  // Model liked a Campaign → other side is the brand's userId
  if (targetType === 'CAMPAIGN') {
    const campaign = await prisma.campaign.findUnique({
      where: { id: targetId },
      include: { brand: { select: { userId: true } } },
    });
    return campaign?.brand.userId ?? null;
  }
  // Brand/Photographer liked a MODEL/BRAND/PHOTOGRAPHER → targetId is already a userId
  return targetId;
}

/** Check if the reverse swipe exists (i.e., the other user has already liked this user) */
async function checkReverseSwipe(
  swiperId: string,
  swiperRole: string,
  targetId: string,
  targetType: string,
  otherUserId: string,
): Promise<boolean> {
  if (targetType === 'CAMPAIGN') {
    // Brand (otherUserId) must have liked swiperId as a MODEL
    const rev = await prisma.swipe.findFirst({
      where: {
        swiperId: otherUserId,
        targetId: swiperId,
        targetType: 'MODEL',
        direction: 'LIKE',
      },
    });
    return rev !== null;
  }

  // Direct user-to-user swipes (brand→model, photographer→model, photographer→brand)
  // Reverse: otherUserId liked swiperId
  // Determine what targetType the reverse swipe would be
  let reverseTargetType = swiperRole; // e.g. PHOTOGRAPHER liked MODEL → reverse would be MODEL liked PHOTOGRAPHER

  const rev = await prisma.swipe.findFirst({
    where: {
      swiperId: otherUserId,
      targetId: swiperId,
      targetType: reverseTargetType,
      direction: 'LIKE',
    },
  });

  // Also check if other user liked a campaign that belongs to swiper (for model→brand via campaign)
  if (!rev && swiperRole === 'BRAND') {
    // swiper is a brand, otherUserId is a model
    const brand = await prisma.brandProfile.findUnique({ where: { userId: swiperId } });
    if (brand) {
      const campaigns = await prisma.campaign.findMany({ where: { brandId: brand.id }, select: { id: true } });
      const campaignIds = campaigns.map((c) => c.id);
      const campaignLike = await prisma.swipe.findFirst({
        where: {
          swiperId: otherUserId,
          targetType: 'CAMPAIGN',
          targetId: { in: campaignIds },
          direction: 'LIKE',
        },
      });
      return campaignLike !== null;
    }
  }

  return rev !== null;
}
