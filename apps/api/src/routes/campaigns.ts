import { Router } from 'express';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth';
import {
  validate,
  createCampaignSchema,
  updateCampaignSchema,
  applyToCampaignSchema,
  updateApplicationStatusSchema,
} from '../lib/validate';
import {
  listCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  applyToCampaign,
  listApplications,
  getMyApplications,
  updateApplicationStatus,
} from '../services/campaign.service';
import { sendApplicationAcceptedEmail, sendApplicationRejectedEmail, sendCampaignCompletedEmail } from '../services/email.service';
import { prisma } from '../lib/prisma';

const router = Router();

// ─── Public / discovery ───────────────────────────────────────────────────────

router.get('/', async (req, res) => {
  const { status, tags, location, page, limit } = req.query;
  const tagArr = tags ? String(tags).split(',') : undefined;
  const result = await listCampaigns({
    status: status as any,
    tags: tagArr,
    location: location ? String(location) : undefined,
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 20,
    withCounts: true,
  });
  res.json(result);
});

// ─── Model: my applications (must be before /:id) ─────────────────────────────

router.get('/my-applications', requireAuth, requireRole('MODEL'), async (req: AuthRequest, res) => {
  try {
    const applications = await getMyApplications(req.userId!);
    res.json(applications);
  } catch (err) {
    console.error('[campaigns/my-applications]', err);
    res.status(500).json({ error: 'Failed to load applications' });
  }
});

// ─── Brand: create campaign ───────────────────────────────────────────────────

router.post('/', requireAuth, requireRole('BRAND'), validate(createCampaignSchema), async (req: AuthRequest, res) => {
  const brand = await prisma.brandProfile.findUnique({ where: { userId: req.userId! } });
  if (!brand) {
    res.status(400).json({ error: 'Complete your brand profile first', code: 'NO_BRAND_PROFILE' });
    return;
  }
  const campaign = await createCampaign(brand.id, req.body);
  res.status(201).json(campaign);
});

// ─── Model: my application for a campaign ────────────────────────────────────

router.get('/:id/my-application', requireAuth, requireRole('MODEL'), async (req: AuthRequest, res) => {
  try {
    const model = await prisma.modelProfile.findUnique({ where: { userId: req.userId! } });
    if (!model) { res.json(null); return; }
    const app = await prisma.application.findFirst({
      where: { campaignId: req.params.id, modelId: model.id },
      select: { id: true, status: true, createdAt: true },
    });
    res.json(app ?? null);
  } catch (err) {
    console.error('[campaigns/my-application]', err);
    res.status(500).json({ error: 'Failed to load application' });
  }
});

// ─── Campaign CRUD ────────────────────────────────────────────────────────────

router.get('/:id', async (req, res) => {
  const campaign = await getCampaign(req.params.id);
  if (!campaign) {
    res.status(404).json({ error: 'Campaign not found' });
    return;
  }
  res.json(campaign);
});

router.put('/:id', requireAuth, requireRole('BRAND'), validate(updateCampaignSchema), async (req: AuthRequest, res) => {
  const campaign = await getCampaign(req.params.id);
  if (!campaign) {
    res.status(404).json({ error: 'Campaign not found' });
    return;
  }
  const brand = await prisma.brandProfile.findUnique({ where: { userId: req.userId! } });
  if (!brand || campaign.brandId !== brand.id) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  const updated = await updateCampaign(req.params.id, brand.id, req.body);
  res.json(updated);

  // When marking COMPLETED, email all accepted models
  if (req.body.status === 'COMPLETED') {
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    const acceptedApps = await prisma.application.findMany({
      where: { campaignId: req.params.id, status: 'ACCEPTED' },
      include: {
        model: {
          select: { displayName: true, user: { select: { email: true } } },
        },
      },
    });
    for (const app of acceptedApps) {
      const email = app.model?.user?.email;
      const name = app.model?.displayName ?? '';
      if (email) {
        sendCampaignCompletedEmail(
          email,
          name,
          updated.title,
          brand.brandName,
          `${frontendUrl}/brand/${brand.userId}`,
        ).catch(() => {});
      }
    }
  }
});

router.delete('/:id', requireAuth, requireRole('BRAND'), async (req: AuthRequest, res) => {
  const campaign = await getCampaign(req.params.id);
  if (!campaign) {
    res.status(404).json({ error: 'Campaign not found' });
    return;
  }
  const brand = await prisma.brandProfile.findUnique({ where: { userId: req.userId! } });
  if (!brand || campaign.brandId !== brand.id) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  await deleteCampaign(req.params.id);
  res.status(204).send();
});

// ─── Applications ─────────────────────────────────────────────────────────────

router.post('/:id/apply', requireAuth, requireRole('MODEL'), validate(applyToCampaignSchema), async (req: AuthRequest, res) => {
  const model = await prisma.modelProfile.findUnique({ where: { userId: req.userId! } });
  if (!model) {
    res.status(400).json({ error: 'Complete your model profile first', code: 'NO_MODEL_PROFILE' });
    return;
  }
  try {
    const application = await applyToCampaign(req.params.id, model.id, req.body.coverNote);
    res.status(201).json(application);
  } catch (err: any) {
    if (err.code === 'P2002') {
      res.status(409).json({ error: 'Already applied to this campaign' });
    } else {
      res.status(500).json({ error: 'Application failed' });
    }
  }
});

router.get('/:id/applications', requireAuth, requireRole('BRAND'), async (req: AuthRequest, res) => {
  const brand = await prisma.brandProfile.findUnique({ where: { userId: req.userId! } });
  const campaign = await getCampaign(req.params.id);
  if (!campaign || !brand || campaign.brandId !== brand.id) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  const applications = await listApplications(req.params.id);
  res.json(applications);
});

router.put(
  '/applications/:applicationId/status',
  requireAuth,
  requireRole('BRAND'),
  validate(updateApplicationStatusSchema),
  async (req: AuthRequest, res) => {
    try {
      const updated = await updateApplicationStatus(req.params.applicationId, req.body.status);
      res.json(updated);

      // Fire-and-forget emails
      const modelEmail = updated.model?.user?.email;
      const modelName = updated.model?.displayName ?? '';
      const campaignTitle = updated.campaign?.title ?? '';
      const brandName = updated.campaign?.brand?.brandName ?? '';
      const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';

      if (modelEmail) {
        if (req.body.status === 'ACCEPTED') {
          sendApplicationAcceptedEmail(
            modelEmail,
            modelName,
            campaignTitle,
            brandName,
            `${frontendUrl}/brand/${(updated.campaign?.brand as any)?.userId ?? updated.campaign?.brandId}`,
          ).catch(() => {});
        } else if (req.body.status === 'REJECTED') {
          sendApplicationRejectedEmail(modelEmail, modelName, campaignTitle, brandName).catch(() => {});
        }
      }
    } catch (err) {
      console.error('[campaigns/applications/status]', err);
      res.status(500).json({ error: 'Failed to update status' });
    }
  }
);

export default router;
