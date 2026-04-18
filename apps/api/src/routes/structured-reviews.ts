import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, optionalAuth, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { sendNewReviewEmail, sendCommunityFlaggedEmail } from '../services/email.service';

const router = Router();

const FLAG_KEYWORDS = ['late', 'payment', 'unsafe', 'unprofessional', 'harassment', 'inappropriate'];

const dimensionsSchema = z.record(z.string(), z.union([z.number().min(1).max(5), z.boolean()]));

const createSchema = z.object({
  revieweeId: z.string().min(1),
  campaignId: z.string().min(1),
  dimensions: dimensionsSchema,
  comment: z.string().max(500).optional(),
});

const userProfileSelect = {
  id: true,
  role: true,
  email: true,
  communityFlagged: true,
  modelProfile: { select: { displayName: true, profileImage: true } },
  brandProfile: { select: { brandName: true, profileImage: true, logoUrl: true } },
  photographerProfile: { select: { displayName: true, profileImage: true } },
} as const;

function getUserName(user: { modelProfile?: { displayName: string } | null; brandProfile?: { brandName: string } | null; photographerProfile?: { displayName: string } | null; email: string }) {
  return user.modelProfile?.displayName ?? user.brandProfile?.brandName ?? user.photographerProfile?.displayName ?? user.email;
}

function calcOverall(dimensions: Record<string, unknown>): number {
  const nums = Object.entries(dimensions)
    .filter(([k, v]) => typeof v === 'number' && k !== 'wouldWorkAgain')
    .map(([, v]) => v as number);
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

async function autoPublish() {
  await prisma.structuredReview.updateMany({
    where: { responseDeadline: { lt: new Date() }, isPublic: false },
    data: { isPublic: true },
  });
  await prisma.workingTogetherPost.updateMany({
    where: { responseDeadline: { lt: new Date() }, isPublic: false },
    data: { isPublic: true },
  });
}

async function checkRedFlag(revieweeId: string) {
  const reviews = await prisma.structuredReview.findMany({
    where: { revieweeId, isPublic: true },
    select: { comment: true },
  });
  const fullText = reviews.map((r) => r.comment ?? '').join(' ').toLowerCase();
  const matches = FLAG_KEYWORDS.filter((kw) => fullText.split(kw).length - 1 >= 3);
  if (matches.length > 0) {
    await prisma.user.update({ where: { id: revieweeId }, data: { communityFlagged: true } });
    const user = await prisma.user.findUnique({
      where: { id: revieweeId },
      select: { email: true, modelProfile: { select: { displayName: true } }, brandProfile: { select: { brandName: true } }, photographerProfile: { select: { displayName: true } } },
    });
    const name = user ? getUserName({ ...user, email: user.email }) : revieweeId;
    const adminEmail = process.env.ADMIN_EMAIL ?? process.env.EMAIL_FROM ?? 'admin@kailani.com';
    sendCommunityFlaggedEmail(adminEmail, name, revieweeId).catch(() => {});
  }
}

// ─── Participant validation ───────────────────────────────────────────────────
async function validateParticipant(reviewerId: string, revieweeId: string, campaignId: string): Promise<boolean> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { brand: { select: { userId: true } } },
  });
  if (!campaign || campaign.status !== 'COMPLETED') return false;
  const brandUserId = campaign.brand.userId;

  // Brand reviewing model
  if (reviewerId === brandUserId) {
    const revieweeProfile = await prisma.modelProfile.findFirst({ where: { userId: revieweeId } });
    if (revieweeProfile) {
      const app = await prisma.application.findFirst({ where: { campaignId, modelId: revieweeProfile.id, status: 'ACCEPTED' } });
      if (app) return true;
    }
    // Brand reviewing photographer — allow if reviewee is photographer and campaign is completed
    const revieweePhotog = await prisma.photographerProfile.findFirst({ where: { userId: revieweeId } });
    if (revieweePhotog) return true;
  }

  // Model reviewing brand
  const reviewerProfile = await prisma.modelProfile.findFirst({ where: { userId: reviewerId } });
  if (reviewerProfile && revieweeId === brandUserId) {
    const app = await prisma.application.findFirst({ where: { campaignId, modelId: reviewerProfile.id, status: 'ACCEPTED' } });
    if (app) return true;
  }

  // Photographer reviewing brand
  const reviewerPhotog = await prisma.photographerProfile.findFirst({ where: { userId: reviewerId } });
  if (reviewerPhotog && revieweeId === brandUserId) return true;

  return false;
}

// ─── POST /api/structured-reviews ────────────────────────────────────────────
router.post('/', requireAuth, async (req: AuthRequest, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid data', details: parsed.error.flatten() });
    return;
  }

  const { revieweeId, campaignId, dimensions, comment } = parsed.data;
  const reviewerId = req.userId!;

  if (reviewerId === revieweeId) {
    res.status(400).json({ error: 'Cannot review yourself' });
    return;
  }

  const isParticipant = await validateParticipant(reviewerId, revieweeId, campaignId);
  if (!isParticipant) {
    res.status(403).json({ error: 'You were not part of this completed campaign' });
    return;
  }

  const overallRating = calcOverall(dimensions as Record<string, unknown>);
  const responseDeadline = new Date(Date.now() + 48 * 60 * 60 * 1000);

  try {
    const review = await prisma.structuredReview.create({
      data: { reviewerId, revieweeId, campaignId, dimensions, overallRating, comment, responseDeadline },
      include: {
        reviewer: { select: userProfileSelect },
        reviewee: { select: userProfileSelect },
        campaign: { select: { id: true, title: true } },
      },
    });

    // Send notification email
    const reviewerName = getUserName({ ...review.reviewer, email: review.reviewer.email });
    const revieweeName = getUserName({ ...review.reviewee, email: review.reviewee.email });
    sendNewReviewEmail(review.reviewee.email, revieweeName, reviewerName, review.campaign.title, responseDeadline.toISOString()).catch(() => {});

    res.status(201).json(review);
  } catch (err: any) {
    if (err.code === 'P2002') {
      res.status(409).json({ error: 'You have already reviewed this person for this campaign' });
    } else {
      console.error(err);
      res.status(500).json({ error: 'Failed to submit review' });
    }
  }
});

// ─── POST /api/structured-reviews/:id/respond ────────────────────────────────
router.post('/:id/respond', requireAuth, async (req: AuthRequest, res) => {
  const { response } = req.body as { response?: string };
  if (!response?.trim()) {
    res.status(400).json({ error: 'response is required' });
    return;
  }

  const review = await prisma.structuredReview.findUnique({ where: { id: req.params.id } });
  if (!review) { res.status(404).json({ error: 'Review not found' }); return; }
  if (review.revieweeId !== req.userId) { res.status(403).json({ error: 'Not your review' }); return; }
  if (new Date() > review.responseDeadline) { res.status(400).json({ error: 'Response window has closed' }); return; }

  const updated = await prisma.structuredReview.update({
    where: { id: req.params.id },
    data: { reviewerResponse: response.trim(), isPublic: true },
    include: {
      reviewer: { select: userProfileSelect },
      campaign: { select: { id: true, title: true } },
    },
  });

  // Check red flags after response triggers public status
  checkRedFlag(review.revieweeId).catch(() => {});

  res.json(updated);
});

// ─── GET /api/structured-reviews/:userId ─────────────────────────────────────
router.get('/:userId', optionalAuth, async (req: AuthRequest, res) => {
  await autoPublish();

  const now = new Date();
  const reviews = await prisma.structuredReview.findMany({
    where: {
      revieweeId: req.params.userId,
      OR: [
        { isPublic: true },
        { responseDeadline: { lt: now } },
      ],
    },
    orderBy: { createdAt: 'desc' },
    include: {
      reviewer: { select: userProfileSelect },
      campaign: { select: { id: true, title: true } },
    },
  });

  const reviewee = await prisma.user.findUnique({
    where: { id: req.params.userId },
    select: { communityFlagged: true, role: true },
  });

  // Pending reviews visible only to the reviewee themselves
  const pendingForMe = req.userId === req.params.userId
    ? await prisma.structuredReview.findMany({
        where: { revieweeId: req.params.userId, isPublic: false, responseDeadline: { gt: now } },
        orderBy: { createdAt: 'desc' },
        include: {
          reviewer: { select: userProfileSelect },
          campaign: { select: { id: true, title: true } },
        },
      })
    : [];

  // Eligibility check: can current user leave a structured review?
  let canReview = false;
  let eligibleCampaigns: { campaignId: string; title: string }[] = [];
  if (req.userId && req.userId !== req.params.userId) {
    const existing = await prisma.structuredReview.findMany({
      where: { reviewerId: req.userId, revieweeId: req.params.userId },
      select: { campaignId: true },
    });
    const reviewedCampaignIds = new Set(existing.map((r) => r.campaignId));

    // Find completed campaigns shared between reviewer and reviewee
    const campaigns = await prisma.campaign.findMany({
      where: { status: 'COMPLETED' },
      include: {
        brand: { select: { userId: true } },
        applications: { where: { status: 'ACCEPTED' }, include: { model: { select: { userId: true } } } },
      },
    });

    for (const c of campaigns) {
      if (reviewedCampaignIds.has(c.id)) continue;
      const valid = await validateParticipant(req.userId, req.params.userId, c.id);
      if (valid) {
        eligibleCampaigns.push({ campaignId: c.id, title: c.title });
        canReview = true;
      }
    }
  }

  const total = reviews.length;
  const avgRating = total > 0 ? reviews.reduce((s, r) => s + r.overallRating, 0) / total : null;
  const wouldWorkAgainPct = total > 0
    ? Math.round((reviews.filter((r) => (r.dimensions as Record<string, unknown>)?.wouldWorkAgain === true).length / total) * 100)
    : null;

  res.json({
    reviews,
    pendingForMe,
    total,
    avgRating,
    wouldWorkAgainPct,
    communityFlagged: reviewee?.communityFlagged ?? false,
    revieweeRole: reviewee?.role ?? null,
    canReview,
    eligibleCampaigns,
  });
});

// ─── POST /api/structured-reviews/publish — admin cron trigger ───────────────
router.post('/publish', requireAuth, async (_req: AuthRequest, res) => {
  await autoPublish();
  res.json({ ok: true });
});

export default router;
