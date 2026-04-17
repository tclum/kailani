import { Router } from 'express';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { sendVerificationApprovedEmail, sendVerificationRejectedEmail } from '../services/email.service';

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
      modelProfile: { select: { id: true, displayName: true } },
      brandProfile: { select: { id: true, brandName: true } },
      photographerProfile: { select: { id: true, displayName: true } },
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

// ─── Verification queue ───────────────────────────────────────────────────────

const verificationUserSelect = {
  email: true,
  role: true,
  verified: true,
  modelProfile: { select: { displayName: true, profileImage: true, coverImage: true } },
  brandProfile: { select: { brandName: true, logoUrl: true, profileImage: true } },
  photographerProfile: { select: { displayName: true, profileImage: true } },
} as const;

router.get('/verification-queue', async (req, res) => {
  const { status } = req.query;
  const where = status ? { status: status as any } : {};
  const requests = await prisma.verificationRequest.findMany({
    where,
    include: { user: { select: verificationUserSelect } },
    orderBy: { submittedAt: 'desc' },
  });
  res.json({ requests });
});

router.put('/verification/:id/approve', async (req: AuthRequest, res) => {
  const request = await prisma.verificationRequest.findUnique({ where: { id: req.params.id } });
  if (!request) { res.status(404).json({ error: 'Request not found' }); return; }

  await prisma.$transaction([
    prisma.verificationRequest.update({
      where: { id: req.params.id },
      data: { status: 'APPROVED', reviewedAt: new Date(), reviewedBy: req.userId },
    }),
    prisma.user.update({
      where: { id: request.userId },
      data: { approved: true, verified: true },
    }),
  ]);

  // Send approval email fire-and-forget
  const user = await prisma.user.findUnique({
    where: { id: request.userId },
    select: {
      email: true,
      modelProfile: { select: { displayName: true } },
      brandProfile: { select: { brandName: true } },
      photographerProfile: { select: { displayName: true } },
    },
  });
  const name = user?.modelProfile?.displayName ?? user?.brandProfile?.brandName ?? user?.photographerProfile?.displayName ?? '';
  if (user) sendVerificationApprovedEmail(user.email, name).catch(() => {});

  res.json({ ok: true });
});

router.put('/verification/:id/reject', async (req: AuthRequest, res) => {
  const { adminNote } = req.body as { adminNote?: string };
  const request = await prisma.verificationRequest.findUnique({ where: { id: req.params.id } });
  if (!request) { res.status(404).json({ error: 'Request not found' }); return; }

  await prisma.verificationRequest.update({
    where: { id: req.params.id },
    data: { status: 'REJECTED', adminNote: adminNote ?? '', reviewedAt: new Date(), reviewedBy: req.userId },
  });

  const user = await prisma.user.findUnique({
    where: { id: request.userId },
    select: {
      email: true,
      modelProfile: { select: { displayName: true } },
      brandProfile: { select: { brandName: true } },
      photographerProfile: { select: { displayName: true } },
    },
  });
  const name = user?.modelProfile?.displayName ?? user?.brandProfile?.brandName ?? user?.photographerProfile?.displayName ?? '';
  if (user) sendVerificationRejectedEmail(user.email, name, adminNote ?? 'No reason provided').catch(() => {});

  res.json({ ok: true });
});

// ─── Reports queue ────────────────────────────────────────────────────────────

const reportUserSelect = {
  id: true, email: true, role: true,
  modelProfile: { select: { displayName: true, profileImage: true } },
  brandProfile: { select: { brandName: true, profileImage: true } },
  photographerProfile: { select: { displayName: true, profileImage: true } },
} as const;

router.get('/reports', async (req, res) => {
  const { resolved } = req.query;
  const where = resolved === 'true' ? { resolved: true } : { resolved: false };
  const reports = await prisma.report.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      reporter: { select: reportUserSelect },
      reported: { select: reportUserSelect },
    },
  });
  res.json({ reports });
});

router.put('/reports/:id/resolve', async (req, res) => {
  const report = await prisma.report.update({
    where: { id: req.params.id },
    data: { resolved: true },
  });
  res.json(report);
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
