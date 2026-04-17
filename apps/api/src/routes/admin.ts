import { Router } from 'express';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import {
  sendVerificationApprovedEmail,
  sendVerificationRejectedEmail,
  sendWarningEmail,
} from '../services/email.service';

const router = Router();

router.use(requireAuth, requireRole('ADMIN'));

// ─── Users ────────────────────────────────────────────────────────────────────

router.get('/users', async (req, res) => {
  const { role, approved, verified, search, page } = req.query;
  const pageNum = page ? Number(page) : 1;
  const pageSize = 20;

  const where: Record<string, unknown> = {};
  if (role && role !== 'ALL') where.role = role;
  if (approved === 'true') where.approved = true;
  if (approved === 'false') where.approved = false;
  if (verified === 'true') where.verified = true;
  if (verified === 'false') where.verified = false;
  if (search) {
    where.OR = [
      { email: { contains: String(search), mode: 'insensitive' } },
      { modelProfile: { displayName: { contains: String(search), mode: 'insensitive' } } },
      { brandProfile: { brandName: { contains: String(search), mode: 'insensitive' } } },
      { photographerProfile: { displayName: { contains: String(search), mode: 'insensitive' } } },
    ];
  }

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (pageNum - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        email: true,
        role: true,
        approved: true,
        verified: true,
        createdAt: true,
        modelProfile: { select: { id: true, displayName: true, profileImage: true } },
        brandProfile: { select: { id: true, brandName: true, profileImage: true } },
        photographerProfile: { select: { id: true, displayName: true, profileImage: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  res.json({ users, total, page: pageNum, pages: Math.ceil(total / pageSize) });
});

router.put('/users/:id/approve', async (req, res) => {
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { approved: true },
    select: { id: true, email: true, role: true, approved: true },
  });
  res.json(user);
});

router.put('/users/:id/unapprove', async (req, res) => {
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { approved: false },
    select: { id: true, email: true, role: true, approved: true },
  });
  res.json(user);
});

router.post('/users/:id/warn', async (req, res) => {
  const { reason } = req.body as { reason?: string };
  if (!reason?.trim()) {
    res.status(400).json({ error: 'reason is required' });
    return;
  }
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: {
      email: true,
      modelProfile: { select: { displayName: true } },
      brandProfile: { select: { brandName: true } },
      photographerProfile: { select: { displayName: true } },
    },
  });
  if (!user) { res.status(404).json({ error: 'User not found' }); return; }
  const name = user.modelProfile?.displayName ?? user.brandProfile?.brandName ?? user.photographerProfile?.displayName ?? user.email;
  sendWarningEmail(user.email, name, reason).catch(() => {});
  res.json({ ok: true });
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
  const where = status ? { status: status as 'PENDING' | 'APPROVED' | 'REJECTED' } : {};
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

  // Attach report count for reported user (severity signal)
  const reportedIds = [...new Set(reports.map((r) => r.reportedId))];
  const counts = await Promise.all(
    reportedIds.map((id) => prisma.report.count({ where: { reportedId: id } }))
  );
  const countMap: Record<string, number> = {};
  reportedIds.forEach((id, i) => { countMap[id] = counts[i]; });

  const enriched = reports.map((r) => ({ ...r, reportedUserReportCount: countMap[r.reportedId] ?? 1 }));
  res.json({ reports: enriched });
});

router.put('/reports/:id/resolve', async (req, res) => {
  const report = await prisma.report.update({
    where: { id: req.params.id },
    data: { resolved: true },
  });
  res.json(report);
});

// ─── Campaigns ────────────────────────────────────────────────────────────────

router.get('/campaigns', async (req, res) => {
  const { status, flagged, search, page } = req.query;
  const pageNum = page ? Number(page) : 1;
  const pageSize = 20;

  const where: Record<string, unknown> = {};
  if (status && status !== 'ALL') where.status = status;
  if (flagged === 'true') where.flagged = true;
  if (search) {
    where.OR = [
      { title: { contains: String(search), mode: 'insensitive' } },
      { brand: { brandName: { contains: String(search), mode: 'insensitive' } } },
    ];
  }

  const [campaigns, total] = await prisma.$transaction([
    prisma.campaign.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (pageNum - 1) * pageSize,
      take: pageSize,
      include: {
        brand: { select: { id: true, brandName: true, profileImage: true } },
        _count: { select: { applications: true } },
      },
    }),
    prisma.campaign.count({ where }),
  ]);

  res.json({ campaigns, total, page: pageNum, pages: Math.ceil(total / pageSize) });
});

router.put('/campaigns/:id/flag', async (req, res) => {
  const { flagged } = req.body as { flagged?: boolean };
  const campaign = await prisma.campaign.update({
    where: { id: req.params.id },
    data: { flagged: flagged ?? true },
  });
  res.json(campaign);
});

router.put('/campaigns/:id/close', async (req, res) => {
  const campaign = await prisma.campaign.update({
    where: { id: req.params.id },
    data: { status: 'CLOSED' },
  });
  res.json(campaign);
});

// ─── Stats + activity ─────────────────────────────────────────────────────────

router.get('/stats', async (_req, res) => {
  const [
    totalUsers, models, brands, photographers, campaigns, applications,
    matches, messages, pendingApprovals, openCampaigns, pendingVerifications, openReports,
  ] = await prisma.$transaction([
    prisma.user.count(),
    prisma.modelProfile.count(),
    prisma.brandProfile.count(),
    prisma.photographerProfile.count(),
    prisma.campaign.count(),
    prisma.application.count(),
    prisma.match.count(),
    prisma.message.count(),
    prisma.user.count({ where: { approved: false } }),
    prisma.campaign.count({ where: { status: 'OPEN' } }),
    prisma.verificationRequest.count({ where: { status: 'PENDING' } }),
    prisma.report.count({ where: { resolved: false } }),
  ]);

  // Signups per day for the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentUsers = await prisma.user.findMany({
    where: { createdAt: { gte: thirtyDaysAgo } },
    select: { createdAt: true },
  });

  const dayMap: Record<string, number> = {};
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    dayMap[d.toISOString().split('T')[0]] = 0;
  }
  for (const u of recentUsers) {
    const key = u.createdAt.toISOString().split('T')[0];
    if (key in dayMap) dayMap[key]++;
  }
  const signupsPerDay = Object.entries(dayMap).map(([date, count]) => ({ date, count }));

  res.json({
    totalUsers, models, brands, photographers, campaigns, applications,
    matches, messages, pendingApprovals, openCampaigns, pendingVerifications, openReports,
    signupsPerDay,
  });
});

router.get('/activity', async (_req, res) => {
  const [recentUsers, recentCampaigns, recentVerifications, recentReports] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true, email: true, role: true, createdAt: true,
        modelProfile: { select: { displayName: true } },
        brandProfile: { select: { brandName: true } },
        photographerProfile: { select: { displayName: true } },
      },
    }),
    prisma.campaign.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true, title: true, status: true, createdAt: true,
        brand: { select: { brandName: true } },
      },
    }),
    prisma.verificationRequest.findMany({
      where: { status: 'PENDING' },
      orderBy: { submittedAt: 'desc' },
      take: 3,
      select: {
        id: true, submittedAt: true,
        user: {
          select: {
            email: true,
            modelProfile: { select: { displayName: true } },
            brandProfile: { select: { brandName: true } },
            photographerProfile: { select: { displayName: true } },
          },
        },
      },
    }),
    prisma.report.findMany({
      where: { resolved: false },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: {
        id: true, reason: true, createdAt: true,
        reported: {
          select: {
            email: true,
            modelProfile: { select: { displayName: true } },
            brandProfile: { select: { brandName: true } },
            photographerProfile: { select: { displayName: true } },
          },
        },
      },
    }),
  ]);

  type ActivityItem = { type: string; label: string; sub: string; time: string; id: string };
  const activity: ActivityItem[] = [];

  for (const u of recentUsers) {
    const name = u.modelProfile?.displayName ?? u.brandProfile?.brandName ?? u.photographerProfile?.displayName ?? u.email;
    activity.push({ type: 'signup', label: `New ${u.role.toLowerCase()} joined`, sub: name, time: u.createdAt.toISOString(), id: u.id });
  }
  for (const c of recentCampaigns) {
    activity.push({ type: 'campaign', label: `Campaign ${c.status.toLowerCase()}`, sub: `${c.title} · ${c.brand.brandName}`, time: c.createdAt.toISOString(), id: c.id });
  }
  for (const v of recentVerifications) {
    const name = v.user.modelProfile?.displayName ?? v.user.brandProfile?.brandName ?? v.user.photographerProfile?.displayName ?? v.user.email;
    activity.push({ type: 'verification', label: 'Verification request', sub: name, time: v.submittedAt.toISOString(), id: v.id });
  }
  for (const r of recentReports) {
    const name = r.reported.modelProfile?.displayName ?? r.reported.brandProfile?.brandName ?? r.reported.photographerProfile?.displayName ?? r.reported.email;
    activity.push({ type: 'report', label: `Report: ${r.reason}`, sub: `Against ${name}`, time: r.createdAt.toISOString(), id: r.id });
  }

  activity.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  res.json({ activity: activity.slice(0, 12) });
});

// ─── Community flagged users ──────────────────────────────────────────────────

const flaggedUserSelect = {
  id: true, email: true, role: true, communityFlagged: true, createdAt: true,
  modelProfile: { select: { displayName: true, profileImage: true } },
  brandProfile: { select: { brandName: true, profileImage: true } },
  photographerProfile: { select: { displayName: true, profileImage: true } },
} as const;

router.get('/flagged-users', async (_req, res) => {
  const users = await prisma.user.findMany({
    where: { communityFlagged: true },
    orderBy: { updatedAt: 'desc' },
    select: flaggedUserSelect,
  });

  // Include reviews for each flagged user
  const enriched = await Promise.all(
    users.map(async (u) => {
      const reviews = await prisma.structuredReview.findMany({
        where: { revieweeId: u.id, isPublic: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          reviewer: {
            select: {
              modelProfile: { select: { displayName: true } },
              brandProfile: { select: { brandName: true } },
              photographerProfile: { select: { displayName: true } },
            },
          },
          campaign: { select: { title: true } },
        },
      });
      return { ...u, recentReviews: reviews };
    })
  );

  res.json({ users: enriched });
});

router.put('/users/:id/clear-flag', async (req, res) => {
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { communityFlagged: false },
    select: { id: true, communityFlagged: true },
  });
  res.json(user);
});

// ─── Publish reviews (cron trigger) ──────────────────────────────────────────
router.post('/publish-reviews', async (_req, res) => {
  const now = new Date();
  const [reviews, posts] = await prisma.$transaction([
    prisma.structuredReview.updateMany({
      where: { responseDeadline: { lt: now }, isPublic: false },
      data: { isPublic: true },
    }),
    prisma.workingTogetherPost.updateMany({
      where: { responseDeadline: { lt: now }, isPublic: false },
      data: { isPublic: true },
    }),
  ]);
  res.json({ publishedReviews: reviews.count, publishedPosts: posts.count });
});

export default router;
