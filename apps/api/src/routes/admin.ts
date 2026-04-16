import { Router } from 'express';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const router = Router();

router.use(requireAuth, requireRole('ADMIN'));

router.get('/users', async (_req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      role: true,
      approved: true,
      createdAt: true,
      modelProfile: { select: { displayName: true } },
      brandProfile: { select: { brandName: true } },
    },
  });
  res.json(users);
});

router.put('/users/:id/approve', async (req, res) => {
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { approved: true },
    select: { id: true, email: true, role: true, approved: true },
  });
  res.json(user);
});

router.delete('/users/:id', async (req, res) => {
  await prisma.user.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

router.get('/stats', async (_req, res) => {
  const [totalUsers, models, brands, campaigns, applications] = await prisma.$transaction([
    prisma.user.count(),
    prisma.modelProfile.count(),
    prisma.brandProfile.count(),
    prisma.campaign.count(),
    prisma.application.count(),
  ]);

  const pendingApprovals = await prisma.user.count({ where: { approved: false } });
  const openCampaigns = await prisma.campaign.count({ where: { status: 'OPEN' } });

  res.json({
    totalUsers,
    models,
    brands,
    campaigns,
    applications,
    pendingApprovals,
    openCampaigns,
  });
});

export default router;
