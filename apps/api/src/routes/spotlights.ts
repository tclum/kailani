import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, requireRole } from '../middleware/auth';
import { AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/current', async (_req, res: Response) => {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const spotlights = await prisma.spotlight.findMany({
    where: { weekOf: { gte: startOfWeek } },
    include: {
      user: {
        select: {
          id: true,
          role: true,
          modelProfile: { select: { displayName: true, profileImage: true, location: true, tags: true } },
          photographerProfile: { select: { displayName: true, profileImage: true, location: true, specialties: true } },
          brandProfile: { select: { brandName: true, logoUrl: true, location: true, industry: true } },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });
  res.json(spotlights);
});

router.post('/', requireAuth, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  const { userId, type, reason } = req.body as { userId: string; type: string; reason: string };
  if (!userId || !type || !reason) { res.status(400).json({ error: 'userId, type, reason required' }); return; }

  const now = new Date();
  const weekOf = new Date(now);
  weekOf.setDate(now.getDate() - now.getDay());
  weekOf.setHours(0, 0, 0, 0);

  try {
    const spotlight = await prisma.spotlight.upsert({
      where: { userId },
      update: { type, reason, weekOf },
      create: { userId, type, reason, weekOf },
    });
    res.json(spotlight);
  } catch {
    res.status(400).json({ error: 'Failed to create spotlight' });
  }
});

router.delete('/:userId', requireAuth, requireRole('ADMIN'), async (req, res: Response) => {
  await prisma.spotlight.deleteMany({ where: { userId: req.params.userId } });
  res.json({ ok: true });
});

export default router;
