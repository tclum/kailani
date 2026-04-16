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
  updateApplicationStatus,
} from '../services/campaign.service';
import { prisma } from '../lib/prisma';

const router = Router();


router.get('/', async (req, res) => {
  const { status, tags, page } = req.query;
  const tagArr = tags ? String(tags).split(',') : undefined;
  const result = await listCampaigns({
    status: status as any,
    tags: tagArr,
    page: page ? Number(page) : 1,
  });
  res.json(result);
});

router.post('/', requireAuth, requireRole('BRAND'), validate(createCampaignSchema), async (req: AuthRequest, res) => {
  const brand = await prisma.brandProfile.findUnique({ where: { userId: req.userId! } });
  if (!brand) {
    res.status(400).json({ error: 'Complete your brand profile first', code: 'NO_BRAND_PROFILE' });
    return;
  }
  const campaign = await createCampaign(brand.id, req.body);
  res.status(201).json(campaign);
});

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
    const updated = await updateApplicationStatus(req.params.applicationId, req.body.status);
    res.json(updated);
  }
);

export default router;
