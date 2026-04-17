import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const router = Router();
router.use(requireAuth);

const createReviewSchema = z.object({
  revieweeId: z.string().min(1),
  campaignId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

// POST /api/reviews
router.post('/', async (req: AuthRequest, res) => {
  const parsed = createReviewSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid review data', details: parsed.error.flatten() });
    return;
  }

  const { revieweeId, campaignId, rating, comment } = parsed.data;
  const reviewerId = req.userId!;

  if (reviewerId === revieweeId) {
    res.status(400).json({ error: 'Cannot review yourself' });
    return;
  }

  // Verify the campaign exists and is COMPLETED
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { brand: { select: { userId: true } } },
  });
  if (!campaign) {
    res.status(404).json({ error: 'Campaign not found' });
    return;
  }
  if (campaign.status !== 'COMPLETED') {
    res.status(400).json({ error: 'Campaign must be completed before leaving a review' });
    return;
  }

  // Verify reviewer was part of this campaign (brand owner or accepted model)
  const brandUserId = campaign.brand.userId;
  let isParticipant = false;

  if (reviewerId === brandUserId) {
    // Brand reviewing a model — check reviewee was accepted
    const revieweeProfile = await prisma.modelProfile.findFirst({ where: { userId: revieweeId } });
    if (revieweeProfile) {
      const app = await prisma.application.findFirst({
        where: { campaignId, modelId: revieweeProfile.id, status: 'ACCEPTED' },
      });
      isParticipant = app !== null;
    }
  } else {
    // Model reviewing the brand — check reviewer was accepted
    const reviewerProfile = await prisma.modelProfile.findFirst({ where: { userId: reviewerId } });
    if (reviewerProfile && revieweeId === brandUserId) {
      const app = await prisma.application.findFirst({
        where: { campaignId, modelId: reviewerProfile.id, status: 'ACCEPTED' },
      });
      isParticipant = app !== null;
    }
  }

  if (!isParticipant) {
    res.status(403).json({ error: 'You were not part of this campaign' });
    return;
  }

  try {
    const review = await prisma.review.create({
      data: { reviewerId, revieweeId, campaignId, rating, comment },
      include: {
        reviewer: {
          select: {
            id: true, role: true,
            modelProfile: { select: { displayName: true, profileImage: true } },
            brandProfile: { select: { brandName: true, logoUrl: true, profileImage: true } },
            photographerProfile: { select: { displayName: true, profileImage: true } },
          },
        },
      },
    });
    res.status(201).json(review);
  } catch (err: any) {
    if (err.code === 'P2002') {
      res.status(409).json({ error: 'You have already reviewed this person for this campaign' });
    } else {
      res.status(500).json({ error: 'Failed to submit review' });
    }
  }
});

// GET /api/reviews/:userId
router.get('/:userId', async (req, res) => {
  const reviews = await prisma.review.findMany({
    where: { revieweeId: req.params.userId },
    orderBy: { createdAt: 'desc' },
    include: {
      reviewer: {
        select: {
          id: true, role: true,
          modelProfile: { select: { displayName: true, profileImage: true } },
          brandProfile: { select: { brandName: true, logoUrl: true, profileImage: true } },
          photographerProfile: { select: { displayName: true, profileImage: true } },
        },
      },
      campaign: { select: { id: true, title: true } },
    },
  });

  const total = reviews.length;
  const average = total > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / total : null;

  res.json({ reviews, total, average });
});

// GET /api/reviews/eligibility/:revieweeId/:campaignId — check if current user can review
router.get('/eligibility/:revieweeId/:campaignId', async (req: AuthRequest, res) => {
  const { revieweeId, campaignId } = req.params;
  const reviewerId = req.userId!;

  if (reviewerId === revieweeId) {
    res.json({ canReview: false, alreadyReviewed: false });
    return;
  }

  const existing = await prisma.review.findUnique({
    where: { reviewerId_revieweeId_campaignId: { reviewerId, revieweeId, campaignId } },
  });
  if (existing) {
    res.json({ canReview: false, alreadyReviewed: true });
    return;
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { brand: { select: { userId: true } } },
  });
  if (!campaign || campaign.status !== 'COMPLETED') {
    res.json({ canReview: false, alreadyReviewed: false });
    return;
  }

  const brandUserId = campaign.brand.userId;
  let canReview = false;

  if (reviewerId === brandUserId) {
    const revieweeProfile = await prisma.modelProfile.findFirst({ where: { userId: revieweeId } });
    if (revieweeProfile) {
      const app = await prisma.application.findFirst({
        where: { campaignId, modelId: revieweeProfile.id, status: 'ACCEPTED' },
      });
      canReview = app !== null;
    }
  } else {
    const reviewerProfile = await prisma.modelProfile.findFirst({ where: { userId: reviewerId } });
    if (reviewerProfile && revieweeId === brandUserId) {
      const app = await prisma.application.findFirst({
        where: { campaignId, modelId: reviewerProfile.id, status: 'ACCEPTED' },
      });
      canReview = app !== null;
    }
  }

  res.json({ canReview, alreadyReviewed: false });
});

export default router;
