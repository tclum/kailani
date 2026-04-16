import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth';
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

const campaignSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  budget: z.string().optional(),
  location: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['DRAFT', 'OPEN', 'CLOSED', 'COMPLETED']).optional(),
});

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

router.post('/', requireAuth, requireRole('BRAND'), async (req: AuthRequest, res) => {
  const brand = await prisma.brandProfile.findUnique({ where: { userId: req.userId! } });
  if (!brand) {
    res.status(400).json({ error: 'Complete your brand profile first', code: 'NO_BRAND_PROFILE' });
    return;
  }
  const parsed = campaignSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }
  const campaign = await createCampaign(brand.id, parsed.data);
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

router.put('/:id', requireAuth, requireRole('BRAND'), async (req: AuthRequest, res) => {
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
  const parsed = campaignSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }
  const updated = await updateCampaign(req.params.id, brand.id, parsed.data);
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

router.post('/:id/apply', requireAuth, requireRole('MODEL'), async (req: AuthRequest, res) => {
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
  async (req: AuthRequest, res) => {
    const { status } = req.body as { status?: string };
    const validStatuses = ['PENDING', 'SHORTLISTED', 'ACCEPTED', 'REJECTED'];
    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }
    const updated = await updateApplicationStatus(req.params.applicationId, status);
    res.json(updated);
  }
);

export default router;
