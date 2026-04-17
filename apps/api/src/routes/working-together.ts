import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const router = Router();
router.use(requireAuth);

const userProfileSelect = {
  id: true,
  role: true,
  email: true,
  modelProfile: { select: { displayName: true, profileImage: true } },
  brandProfile: { select: { brandName: true, profileImage: true, logoUrl: true } },
  photographerProfile: { select: { displayName: true, profileImage: true } },
} as const;

const createSchema = z.object({
  campaignId: z.string().min(1),
  content: z.string().min(1).max(1000),
});

// ─── POST /api/working-together ───────────────────────────────────────────────
router.post('/', async (req: AuthRequest, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid data', details: parsed.error.flatten() });
    return;
  }

  const { campaignId, content } = parsed.data;
  const authorId = req.userId!;

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      brand: { select: { userId: true } },
      applications: { where: { status: 'ACCEPTED' }, include: { model: { select: { userId: true } } } },
    },
  });

  if (!campaign) { res.status(404).json({ error: 'Campaign not found' }); return; }
  if (campaign.status !== 'COMPLETED') { res.status(400).json({ error: 'Campaign must be completed' }); return; }

  // Check author was part of this campaign
  const brandUserId = campaign.brand.userId;
  const acceptedModelUserIds = campaign.applications.map((a) => a.model.userId);
  const isParticipant = authorId === brandUserId || acceptedModelUserIds.includes(authorId);
  if (!isParticipant) {
    res.status(403).json({ error: 'You were not part of this campaign' });
    return;
  }

  const responseDeadline = new Date(Date.now() + 48 * 60 * 60 * 1000);

  const post = await prisma.workingTogetherPost.create({
    data: { authorId, campaignId, content, responseDeadline },
    include: {
      author: { select: userProfileSelect },
      campaign: { select: { id: true, title: true, brand: { select: { brandName: true } } } },
    },
  });

  res.status(201).json(post);
});

// ─── POST /api/working-together/:id/respond ───────────────────────────────────
router.post('/:id/respond', async (req: AuthRequest, res) => {
  const { response } = req.body as { response?: string };
  if (!response?.trim()) {
    res.status(400).json({ error: 'response is required' });
    return;
  }

  const post = await prisma.workingTogetherPost.findUnique({
    where: { id: req.params.id },
    include: {
      campaign: {
        include: {
          brand: { select: { userId: true } },
          applications: { where: { status: 'ACCEPTED' }, include: { model: { select: { userId: true } } } },
        },
      },
    },
  });
  if (!post) { res.status(404).json({ error: 'Post not found' }); return; }
  if (post.authorId === req.userId) { res.status(400).json({ error: 'Cannot respond to your own post' }); return; }
  if (new Date() > post.responseDeadline) { res.status(400).json({ error: 'Response window has closed' }); return; }

  // Only participants of the campaign can respond
  const brandUserId = post.campaign.brand.userId;
  const acceptedModelUserIds = post.campaign.applications.map((a) => a.model.userId);
  const isParticipant = req.userId === brandUserId || acceptedModelUserIds.includes(req.userId!);
  if (!isParticipant) { res.status(403).json({ error: 'Not a campaign participant' }); return; }

  const updated = await prisma.workingTogetherPost.update({
    where: { id: req.params.id },
    data: { subjectResponse: response.trim(), isPublic: true },
    include: {
      author: { select: userProfileSelect },
      campaign: { select: { id: true, title: true, brand: { select: { brandName: true } } } },
    },
  });

  res.json(updated);
});

// ─── GET /api/working-together ────────────────────────────────────────────────
router.get('/', async (req: AuthRequest, res) => {
  const now = new Date();

  // Auto-publish expired posts
  await prisma.workingTogetherPost.updateMany({
    where: { responseDeadline: { lt: now }, isPublic: false },
    data: { isPublic: true },
  });

  const posts = await prisma.workingTogetherPost.findMany({
    where: { isPublic: true, adminFlagged: false },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      author: { select: userProfileSelect },
      campaign: { select: { id: true, title: true, brand: { select: { brandName: true } } } },
    },
  });

  // Pending posts visible to their authors
  const myPending = await prisma.workingTogetherPost.findMany({
    where: { authorId: req.userId!, isPublic: false, responseDeadline: { gt: now } },
    orderBy: { createdAt: 'desc' },
    include: {
      author: { select: userProfileSelect },
      campaign: { select: { id: true, title: true, brand: { select: { brandName: true } } } },
    },
  });

  // Find campaigns eligible for a new post from current user
  const completedCampaigns = await prisma.campaign.findMany({
    where: {
      status: 'COMPLETED',
      OR: [
        { brand: { userId: req.userId! } },
        { applications: { some: { status: 'ACCEPTED', model: { userId: req.userId! } } } },
      ],
    },
    select: { id: true, title: true },
  });

  // Exclude campaigns the user already posted about
  const myPosts = await prisma.workingTogetherPost.findMany({
    where: { authorId: req.userId! },
    select: { campaignId: true },
  });
  const postedCampaignIds = new Set(myPosts.map((p) => p.campaignId));
  const eligibleCampaigns = completedCampaigns.filter((c) => !postedCampaignIds.has(c.id));

  res.json({ posts, myPending, eligibleCampaigns });
});

export default router;
